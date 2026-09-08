// Conservative extraction: use printed labels; leave uncertain/missing fields empty.
function parsePassportText(raw){
 const lines=String(raw).replace(/\r/g,'').split('\n').map(s=>s.replace(/[ \t]+/g,' ').trim()).filter(Boolean);
 const fields={},evidence={};
 const heading=/^(?:фамилия|имя(?:\s|$)|отчество|дата|место|пол(?:\s|$)|гражданство|паспорт|код подразделения|орган выдачи|пин|персональный|адрес|зарегистрирован|surname|given names?|date of|place of|nationality|sex|document|personal|authority|address)/i;
 function labelled(regex,maxLines=1){
  for(let i=0;i<lines.length;i++){
   const m=lines[i].match(regex);if(!m)continue;
   let rest=lines[i].slice(m[0].length).replace(/^[\s:№/.-]+/,'').trim();
   const result=[];if(rest&&!heading.test(rest))result.push(rest);
   for(let j=i+1;j<lines.length&&result.length<maxLines;j++){if(heading.test(lines[j]))break;result.push(lines[j]);}
   if(result.length)return {value:result.join(' '),source:lines.slice(i,i+1+maxLines).join('\n')};
  }
 }
 function put(key,found,transform=s=>s){if(!found)return;const value=transform(found.value);if(value){fields[key]=value;evidence[key]=found.source;}}
 function date(s){const m=s.match(/(?:^|\D)(\d{2})[.\/-](\d{2})[.\/-](\d{4})(?!\d)/);if(!m)return '';const iso=m[3]+'-'+m[2]+'-'+m[1],d=new Date(iso+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:'';}
 const name=s=>/^[А-ЯЁA-Zа-яёa-z][А-ЯЁA-Zа-яёa-z '-]{1,100}$/.test(s)?s:'';
 put('full_name',labelled(/^(?:ФИО|Ф\.\s*И\.\s*О\.|полное имя|full name)\s*[:.]?\s*/i),name);
 if(!fields.full_name){const surname=labelled(/^(?:фамилия|surname)\s*[:/]?\s*/i),given=labelled(/^(?:имя|given names?|first name)\s*[:/]?\s*/i),middle=labelled(/^(?:отчество|patronymic)\s*[:/]?\s*/i);
  if(surname&&given&&name(surname.value)&&name(given.value)){fields.full_name=[surname.value,given.value,middle&&name(middle.value)].filter(Boolean).join(' ');evidence.full_name=[surname.source,given.source,middle?.source].filter(Boolean).join('\n');}
 }
 put('birth_date',labelled(/^(?:дата рождения|date of birth|birth date)\s*[:/]?\s*/i,2),date);
 put('passport_issued_at',labelled(/^(?:дата выдачи|date of issue|issue date|выдан[ао]?)\s*[:/]?\s*/i,2),date);
 put('passport_issued_by',labelled(/^(?:паспорт выдан|кем выдан(?: паспорт)?|орган выдачи|issuing authority|authority)\s*[:/]?\s*/i,3));
 put('birth_place',labelled(/^(?:место рождения|place of birth)\s*[:/]?\s*/i,2));
 put('citizenship',labelled(/^(?:гражданство|nationality|citizenship)\s*[:/]?\s*/i));
 put('registration_address',labelled(/^(?:адрес регистрации|место жительства|зарегистрирован[а]?|registration address|address)\s*[:/]?\s*/i,4));
 put('passport_department_code',labelled(/^код подразделения\s*[:/]?\s*/i,2),s=>(s.match(/\d{3}\s*[-–]\s*\d{3}/)||[])[0]?.replace(/\s/g,'').replace('–','-')||'');
 put('personal_number',labelled(/^(?:пин|персональный номер|personal (?:number|no\.?))\s*[:/]?\s*/i),s=>(s.match(/\d{10,16}/)||[])[0]||'');
 put('passport_series',labelled(/^серия(?: паспорта)?\s*[:№]?\s*/i),s=>(s.match(/^(?:\d{2}\s?\d{2}|[A-Z]{1,4})(?=\s|$)/)||[])[0]||'');
 put('passport_number',labelled(/^(?:номер паспорта|номер документа|passport (?:number|no\.?)|document (?:number|no\.?))\s*[:№]?\s*/i),s=>(s.match(/^[A-Z0-9]{5,12}(?=\s|$)/i)||[])[0]||'');
 for(const line of lines){
  const id=line.match(/(?:^|[^A-Z0-9])(ID\s?\d{7})(?!\d)/i);
  if(id&&!fields.passport_number){fields.passport_number=id[1].replace(/\s/g,'').toUpperCase();fields.document_type='ID-карта';evidence.passport_number=line;evidence.document_type=line;}
  const passport=line.match(/^(?:паспорт\s*[:№]?\s*)?(\d{2}\s?\d{2})\s+(?:№\s*)?(\d{6})$/i);
  if(passport&&!fields.passport_number){fields.passport_series=passport[1].replace(/\s/g,'');fields.passport_number=passport[2];fields.document_type='Паспорт';for(const key of ['passport_series','passport_number','document_type'])evidence[key]=line;}
 }
 return {fields,evidence};
}
