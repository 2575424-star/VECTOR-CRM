// Relative regions for an upright, tightly framed, full Russian passport spread.
// Only used when the user explicitly chooses this document layout.
const RF_PASSPORT_REGIONS=[
 ['surname',.57,.568,.255,.039,'8'],['given',.52,.63,.37,.039,'7'],['middle',.49,.669,.41,.038,'7'],
 ['birth_date',.64,.707,.26,.037,'7'],['birth_place',.56,.742,.32,.069,'6'],
 ['passport_issued_at',.19,.197,.27,.036,'7'],['passport_department_code',.69,.187,.19,.035,'7'],
 ['passport_issued_by',.27,.077,.60,.077,'6'],
 ['passport_series',.925,.123,.06,.111,'7'],['passport_number',.925,.25,.06,.11,'7']
];
function parseRussianPassportRegions(raw){
 const fields={},evidence={};
 function put(key,value){if(value){fields[key]=value;evidence[key]=String(raw[key]||'').trim();}}
 function date(value){const m=String(value||'').match(/(\d{2})\s*[.\/-]\s*(\d{2})\s*[.\/-]\s*(\d{4})/);if(!m)return '';const iso=m[3]+'-'+m[2]+'-'+m[1],d=new Date(iso+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:'';}
 function name(value){const m=String(value||'').toUpperCase().match(/[А-ЯЁ]+(?:-[А-ЯЁ]+)*/g);return m?.length===1&&m[0].length>=2?m[0]:'';}
 const names=['surname','given','middle'].map(key=>name(raw[key]));
 if(names.every(Boolean)){fields.full_name=names.join(' ');evidence.full_name=['surname','given','middle'].map(key=>raw[key]).join('\n');}
 for(const key of ['birth_date','passport_issued_at'])put(key,date(raw[key]));
 for(const [key,length] of [['passport_series',4],['passport_number',6]]){
  const cleaned=String(raw[key]||'').replace(/\s/g,'');if(new RegExp('^\\d{'+length+'}$').test(cleaned))put(key,cleaned);
 }
 put('passport_department_code',(String(raw.passport_department_code||'').match(/\d{3}\s*[-–]\s*\d{3}/)||[])[0]?.replace(/\s/g,'').replace('–','-'));
 const authority=String(raw.passport_issued_by||'').replace(/\s+/g,' ').trim();
 if(/МВД|УФМС|ОВД|УВД|МИГРАЦ/i.test(authority)&&!/[0-9]/.test(authority))put('passport_issued_by',authority);
 const place=String(raw.birth_place||'').replace(/\s+/g,' ').trim();if(place&&/[А-ЯЁ]{3}/i.test(place)&&!/[0-9<>]/.test(place))put('birth_place',place);
 if(fields.passport_series&&fields.passport_number){fields.document_type='Паспорт';evidence.document_type='Выбран режим разворота паспорта РФ.';}
 // Do not infer citizenship, address or personal number from birthplace or appearance.
 return {fields,evidence};
}
function passportRegionCanvas(bitmap,region){
 const [key,x,y,w,h]=region,rotated=['passport_series','passport_number'].includes(key);
 const crop=document.createElement('canvas');crop.width=Math.round(bitmap.width*w);crop.height=Math.round(bitmap.height*h);
 const context=crop.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,Math.round(bitmap.width*x),Math.round(bitmap.height*y),crop.width,crop.height,0,0,crop.width,crop.height);
 const pixels=context.getImageData(0,0,crop.width,crop.height);
 for(let i=0;i<pixels.data.length;i+=4){let v=rotated?.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2]:pixels.data[i];if(key!=='surname')v=Math.max(0,Math.min(255,(v-110)*1.8));pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}
 context.putImageData(pixels,0,0);
 const scale=key==='surname'?3:2,border=key==='surname'?30:24,out=document.createElement('canvas');
 out.width=(rotated?crop.height:crop.width)*scale+border*2;out.height=(rotated?crop.width:crop.height)*scale+border*2;
 const ctx=out.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,out.width,out.height);ctx.translate(border,border);ctx.scale(scale,scale);
 if(rotated){ctx.translate(0,crop.width);ctx.rotate(-Math.PI/2);}ctx.drawImage(crop,0,0);return out;
}
async function recognizeRussianPassportSpread(worker,file,progress,isCurrent){
 const bitmap=await createImageBitmap(file);
 try{
  const ratio=bitmap.width/bitmap.height;if(ratio<.58||ratio>.83)throw new Error('Для этого режима нужен полный вертикальный разворот паспорта РФ. Обрежьте лишний фон и расположите обе страницы друг над другом. Для ID и прописки выберите другой режим.');
  const raw={};
  for(let i=0;i<RF_PASSPORT_REGIONS.length;i++){
   if(!isCurrent())throw new Error('Распознавание отменено.');
   const region=RF_PASSPORT_REGIONS[i];progress(i+1,RF_PASSPORT_REGIONS.length);
   await worker.setParameters({tessedit_pageseg_mode:region[5]});
   const result=await worker.recognize(passportRegionCanvas(bitmap,region));raw[region[0]]=result.data.text||'';
  }
  return {...parseRussianPassportRegions(raw),text:Object.entries(raw).map(([key,value])=>key+': '+value).join('\n')};
 }finally{bitmap.close();}
}
