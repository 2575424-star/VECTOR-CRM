function contractDate(value) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))throw new Error('Укажите дату полностью.');
 const date=new Date(value+'T12:00:00Z');
 if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error('Некорректная дата.');
 return value.slice(8,10)+'.'+value.slice(5,7)+'.'+value.slice(0,4);
}
function contractCents(value) {
 const s=String(value).replace(/\s/g,'').replace(',','.');
 if(!/^\d{1,12}(\.\d{1,2})?$/.test(s))throw new Error('Сумма: положительное число, не более двух знаков после запятой.');
 const [whole,fraction='']=s.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(cents<=0)throw new Error('Сумма должна быть больше нуля.');
 return cents;
}
function contractPlural(n,forms) {const last=n%100;return forms[last>=11&&last<=14?2:n%10===1?0:n%10>=2&&n%10<=4?1:2];}
function contractIntegerWords(n) {
 if(n===0)return 'ноль';
 const units=['','один','два','три','четыре','пять','шесть','семь','восемь','девять'];
 const teens=['десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
 const tens=['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
 const hundreds=['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];
 const scales=[null,['тысяча','тысячи','тысяч'],['миллион','миллиона','миллионов'],['миллиард','миллиарда','миллиардов']];
 const chunks=[];let index=0;
 while(n){const group=n%1000;n=Math.floor(n/1000);if(group){const words=[hundreds[Math.floor(group/100)]];const rest=group%100;
 if(rest>=10&&rest<20)words.push(teens[rest-10]);else{words.push(tens[Math.floor(rest/10)]);words.push(index===1&&rest%10===1?'одна':index===1&&rest%10===2?'две':units[rest%10]);}
 if(index)words.push(contractPlural(group,scales[index]));chunks.unshift(words.filter(Boolean).join(' '));}index++;}
 return chunks.join(' ');
}
function contractMoney(value,currency) {
 const cents=contractCents(value),whole=Math.floor(cents/100),fraction=cents%100;
 const amount=String(whole).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(currency==='RUB'||fraction?','+String(fraction).padStart(2,'0'):'');
 const major=currency==='RUB'?['рубль','рубля','рублей']:['доллар США','доллара США','долларов США'];
 const minor=currency==='RUB'?['копейка','копейки','копеек']:['цент','цента','центов'];
 return {amount,words:contractIntegerWords(whole)+' '+contractPlural(whole,major)+(currency==='RUB'||fraction?' '+String(fraction).padStart(2,'0')+' '+contractPlural(fraction,minor):'')};
}
function contractValues(vehicle,settings) {
 const values={...settings};
 for(const role of ['seller','buyer']) {
  const party=vehicle[role]||{};
  for(const key of ['full_name','birth_date','passport_number','passport_issued_at','passport_issued_by','registration_address']){
   if(!String(party[key]||'').trim())throw new Error((role==='seller'?'Продавец':'Покупатель')+': заполните '+({full_name:'ФИО',birth_date:'дату рождения',passport_number:'номер паспорта / ID',passport_issued_at:'дату выдачи',passport_issued_by:'кем выдан документ',registration_address:'адрес регистрации'}[key])+ ' и сохраните данные.');
  }
  for(const key of ['full_name','passport_issued_by','registration_address','citizenship','personal_number','passport_department_code'])values[role+'_'+key]=String(party[key]||'').trim()||'—';
  values[role+'_birth_date']=contractDate(party.birth_date);values[role+'_passport_issued_at']=contractDate(party.passport_issued_at);
  const identifier=[party.passport_series,party.passport_number].filter(Boolean).join(' №');
  values[role+'_document']=role==='seller'?(party.document_type?.trim()||'Документ')+' '+identifier:identifier;
 }
 if(!vehicle.buyer.citizenship?.trim())throw new Error('Покупатель: заполните гражданство и сохраните данные.');
 for(const key of ['contract_date','appendix_date','invoice_date'])values[key]=contractDate(settings[key]);
 const usd=contractMoney(settings.usd_amount,'USD'),rub=contractMoney(settings.rub_amount,'RUB');
 values.usd_amount=usd.amount;values.usd_words=usd.words;values.rub_amount=rub.amount;values.rub_words=rub.words;
 return values;
}
function contractEscape(text) {
 return String(text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function fillContractXML(xml,values) {
 return xml.replace(/\{\{([a-z_]+)\}\}/g,(_,key)=>{
  if(values[key]===undefined||values[key]===null||String(values[key]).trim()==='')throw new Error('Не заполнено поле договора: '+key);
  return contractEscape(values[key]);
 });
}
// DOCX is a ZIP container. Store entries without compression to avoid external libraries.
function contractZip(entries) {
 const encoder=new TextEncoder(),chunks=[],central=[];let offset=0;
 function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
 for(const [name,content] of Object.entries(entries)) {
  const filename=encoder.encode(name),data=encoder.encode(content),crc=crc32(data);
  const local=new Uint8Array(30+filename.length),v=new DataView(local.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,filename.length,true);local.set(filename,30);
  chunks.push(local,data);
  const c=new Uint8Array(46+filename.length),cv=new DataView(c.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,filename.length,true);cv.setUint32(42,offset,true);c.set(filename,46);central.push(c);offset+=local.length+data.length;
 }
 const size=central.reduce((sum,c)=>sum+c.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
 ev.setUint32(0,0x06054b50,true);ev.setUint16(8,central.length,true);ev.setUint16(10,central.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
async function makeContract(template,values) {
 const entries={};
 for(const [name,encoded] of Object.entries(template)) {
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const xml=await new Response(stream).text();entries[name]=name==='word/document.xml'?fillContractXML(xml,values):xml;
 }
 return contractZip(entries);
}
