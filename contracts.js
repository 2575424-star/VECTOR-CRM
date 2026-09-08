const CONTRACT_FIELDS=[
 ['contract_number','Номер договора'],['contract_date','Дата договора','date'],['city','Город заключения'],['appendix_date','Дата приложения','date'],
 ['vehicle_name','Марка и модель полностью'],['vin','VIN'],['invoice_number','Номер инвойса'],['invoice_date','Дата инвойса','date'],
 ['usd_amount','Стоимость, USD'],['rub_amount','Эквивалентная стоимость, ₽'],
 ['recipient_name','Получатель платежа (третье лицо)'],['bank_name','Bank Name'],['bank_address','Bank Address'],['bank_swift','SWIFT Code'],['bank_account','Account No.'],['bank_account_name','Account Name']
];
let contractBusy=false,contractSavedSnapshot='',contractDialogInitialized=false;
let contractDownloadUrl=null;
function showContractMessage(text){
 const message=document.getElementById('contractMessage');message.textContent=text;
 message.setAttribute('tabindex','-1');message.focus();message.scrollIntoView({block:'center',behavior:'smooth'});
}
function validateContractForm(form){
 const invalid=CONTRACT_FIELDS.filter(([key])=>{const input=form.elements.namedItem(key);return !input.value.trim()||!input.checkValidity();});
 if(!invalid.length)return true;
 showContractMessage('Заполните или исправьте поля: '+invalid.map(([,title])=>title).join(', ')+'.');
 return false;
}
function contractFormData(){const form=document.getElementById('contractForm');return Object.fromEntries(CONTRACT_FIELDS.map(([key])=>[key,form.elements.namedItem(key).value.trim()]));}
function initContracts(){
 if(contractDialogInitialized)return;contractDialogInitialized=true;
 const section=document.getElementById('partiesSection'),button=document.createElement('button');button.type='button';button.className='primary-btn';button.textContent='Сформировать договор Word';button.onclick=openContract;section.appendChild(button);
 const dialog=document.createElement('dialog');dialog.id='contractDialog';dialog.setAttribute('aria-labelledby','contractTitle');
 dialog.innerHTML='<form id="contractForm"><h2 id="contractTitle">Договор и приложение №1</h2><p>Данные сторон берутся из сохранённой карточки. Проверьте инвойс, обе суммы и реквизиты получателя. Суммы прописью заполнятся автоматически. ПИН и код подразделения при отсутствии будут обозначены «—».</p><fieldset id="contractFields"></fieldset><p id="contractMessage" role="status"></p><div class="dialog-actions"><button type="button" class="ghost-btn" id="closeContract">Закрыть</button><button type="submit" class="primary-btn" id="generateContract">Сохранить данные и скачать Word</button></div></form>';
 document.body.appendChild(dialog);
 document.getElementById('contractForm').noValidate=true;
 const download=document.createElement('a');download.id='contractDownload';download.className='primary-btn';download.textContent='Скачать готовый Word';download.hidden=true;document.getElementById('contractMessage').after(download);
 const fields=document.getElementById('contractFields');
 for(const [key,title,type] of CONTRACT_FIELDS){const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.name=key;input.type=type||'text';input.required=true;input.maxLength=key==='bank_address'?500:250;if(key.endsWith('_amount'))input.inputMode='decimal';label.appendChild(input);fields.appendChild(label);}
 document.getElementById('closeContract').onclick=()=>dialog.requestClose?dialog.requestClose():closeContractDialog();
 dialog.addEventListener('cancel',event=>{if(!canCloseContract())event.preventDefault();});
 document.getElementById('contractForm').addEventListener('submit',generateContract);
 window.addEventListener('beforeunload',event=>{if(contractBusy||(dialog.open&&JSON.stringify(contractFormData())!==contractSavedSnapshot)){event.preventDefault();event.returnValue='';}});
}
function canCloseContract(){return !contractBusy&&(JSON.stringify(contractFormData())===contractSavedSnapshot||window.confirm('Закрыть без сохранения изменений договора?'));}
function closeContractDialog(){if(canCloseContract())document.getElementById('contractDialog').close();}
function openContract(){
 if(!car)return;
 if(Object.keys(PARTY_ROLES).some(role=>partyState[role]?.saving||partyDirty(role))){toast('Сначала сохраните изменения продавца и покупателя.');return;}
 const today=new Date(),localDate=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 const defaults={contract_date:localDate,appendix_date:localDate,vehicle_name:[car.brand,car.model].filter(Boolean).join(' '),vin:car.vin||'',...car.contract_details};
 const form=document.getElementById('contractForm');for(const [key] of CONTRACT_FIELDS)form.elements.namedItem(key).value=defaults[key]||'';
 contractSavedSnapshot=JSON.stringify(contractFormData());document.getElementById('contractMessage').textContent='';document.getElementById('contractDialog').showModal();
 document.getElementById('contractDownload').hidden=true;
}
async function generateContract(event){
 event.preventDefault();if(contractBusy)return;
 const form=document.getElementById('contractForm'),message=document.getElementById('contractMessage');if(!validateContractForm(form))return;
 const settings=contractFormData();let values;
 try{values=contractValues(car,settings);}catch(error){showContractMessage(error.message);return;}
 contractBusy=true;document.getElementById('contractFields').disabled=true;document.getElementById('generateContract').disabled=true;document.getElementById('closeContract').disabled=true;
 let settingsSaved=false;
 try{
  document.getElementById('contractDownload').hidden=true;
  showContractMessage('Подготовка договора…');
  const response=await fetch('contract-template.json');if(!response.ok)throw new Error('Не удалось загрузить шаблон.');
  const blob=await makeContract(await response.json(),values);
  const result=await db.from('cars').update({contract_details:settings}).eq('id',carId).select('contract_details').single();
  if(result.error)throw result.error;if(!result.data?.contract_details)throw new Error('База не подтвердила сохранение реквизитов договора.');
  car.contract_details=result.data.contract_details;contractSavedSnapshot=JSON.stringify(settings);settingsSaved=true;
  const filename=('ДКП_'+settings.contract_number+'_'+settings.vin+'_'+settings.contract_date).replace(/[^\p{L}\p{N}_.-]/gu,'_')+'.docx';
  if(contractDownloadUrl)URL.revokeObjectURL(contractDownloadUrl);
  contractDownloadUrl=URL.createObjectURL(blob);
  const link=document.getElementById('contractDownload');link.href=contractDownloadUrl;link.download=filename;link.hidden=false;link.click();
  showContractMessage('Реквизиты сохранены, договор готов. Если скачивание не началось, нажмите «Скачать готовый Word» ниже. Чтобы хранить файл в карточке, добавьте его в раздел «Документы».');
  try{const log=await db.from('car_history').insert({car_id:String(carId),action:'Сформирован договор Word',details:'Договор с приложением №1 подготовлен для скачивания.'});if(log.error)throw log.error;await loadHistory();}catch(error){message.textContent+=' Не удалось обновить историю.';}
 }catch(error){showContractMessage((settingsSaved?'Реквизиты сохранены, но скачивание не завершено: ':'Не удалось сформировать договор: ')+(error.message||String(error))+'. Данные остаются в форме.');}
 finally{contractBusy=false;document.getElementById('contractFields').disabled=false;document.getElementById('generateContract').disabled=false;document.getElementById('closeContract').disabled=false;}
}
