let passportLibraryPromise=null,passportRun=0,passportWorker=null,passportPhotoURLs=[];
function loadPassportLibrary(){
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(passportLibraryPromise)return passportLibraryPromise;
 passportLibraryPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
  const timer=setTimeout(()=>{script.remove();reject(new Error('Не удалось загрузить распознавание. Проверьте соединение.'));},30000);
  script.onload=()=>{clearTimeout(timer);if(window.Tesseract)resolve(window.Tesseract);else reject(new Error('Модуль распознавания недоступен.'));};
  script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Не удалось загрузить модуль распознавания.'));};document.head.appendChild(script);
 }).catch(error=>{passportLibraryPromise=null;throw error;});return passportLibraryPromise;
}
function initSellerPassport(form){
 const button=document.createElement('button');button.type='button';button.className='ghost-btn passport-upload';button.textContent='Загрузить паспорт';
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.multiple=true;input.hidden=true;
 button.onclick=()=>{if(!partyState.seller?.saving)input.click();};
 input.onchange=()=>{const files=[...input.files];input.value='';if(files.length)recognizeSellerPassport(files);};
 form.querySelector('h3').after(button,input);
 if(document.getElementById('passportOCRDialog'))return;
 const dialog=document.createElement('dialog');dialog.id='passportOCRDialog';dialog.setAttribute('aria-labelledby','passportOCRTitle');
 dialog.innerHTML='<h2 id="passportOCRTitle">Паспорт продавца</h2><p>Загрузите чёткие фото страницы с данными и страницы с регистрацией (JPG, PNG или WebP). Проверьте найденные значения по фото. Отмеченные поля заменят данные в форме продавца; сохранить карточку нужно отдельно.</p><p id="passportOCRStatus" role="status" aria-live="polite"></p><div id="passportOCRPhotos"></div><div id="passportOCRFields"></div><details><summary>Распознанный текст</summary><pre id="passportOCRText"></pre></details><div class="dialog-actions"><button type="button" class="ghost-btn" id="passportOCRClose">Закрыть</button><button type="button" class="primary-btn" id="passportOCRApply" disabled>Перенести отмеченные поля</button></div>';
 document.body.appendChild(dialog);
 document.getElementById('passportOCRClose').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{
  passportRun++;const worker=passportWorker;passportWorker=null;if(worker)worker.terminate().catch(()=>{});
  for(const url of passportPhotoURLs)URL.revokeObjectURL(url);passportPhotoURLs=[];
  document.getElementById('passportOCRPhotos').replaceChildren();document.getElementById('passportOCRFields').replaceChildren();document.getElementById('passportOCRText').textContent='';
 });
 document.getElementById('passportOCRApply').onclick=applySellerPassport;
}
function showPassportCandidates(result){
 const root=document.getElementById('passportOCRFields');root.replaceChildren();
 for(const field of PARTY_FIELDS.filter(f=>!['phone','email'].includes(f.key))){
  const row=document.createElement('div');row.className='passport-ocr-field';
  const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.field=field.key;
  const current=partyState.seller.form.elements.namedItem(field.key).value,candidate=result.fields[field.key]||'';
  check.checked=!!candidate&&(!current||current===candidate);label.appendChild(check);label.appendChild(document.createTextNode(field.label));
  const input=document.createElement('input');input.id='passportOCR_'+field.key;input.type=field.type||'text';input.value=candidate;input.setAttribute('aria-label',field.label);if(field.max)input.maxLength=field.max;
  input.oninput=()=>{check.checked=!!input.value.trim();};row.appendChild(label);row.appendChild(input);
  if(current){const old=document.createElement('small');old.textContent='Сейчас в форме: '+current+(candidate&&current!==candidate?' — отметьте поле, если хотите заменить.':'');row.appendChild(old);}
  if(result.evidence[field.key]){const source=document.createElement('small');source.textContent='Найдено в тексте: '+result.evidence[field.key];row.appendChild(source);}
  root.appendChild(row);
 }
 document.getElementById('passportOCRApply').disabled=false;
}
function applySellerPassport(){
 const state=partyState.seller;if(!state||state.saving)return;
 let count=0;for(const check of document.querySelectorAll('#passportOCRFields input[type=checkbox]:checked')){
  const key=check.dataset.field;if(!PARTY_FIELDS.some(f=>f.key===key))continue;
  const input=document.getElementById('passportOCR_'+key),value=input.value.trim();if(!value)continue;
  if(!input.checkValidity()){input.reportValidity();return;}
 }
 for(const check of document.querySelectorAll('#passportOCRFields input[type=checkbox]:checked')){
  const key=check.dataset.field;if(!PARTY_FIELDS.some(f=>f.key===key))continue;
  const value=document.getElementById('passportOCR_'+key).value.trim();if(value){state.form.elements.namedItem(key).value=value;count++;}
 }
 if(!count){document.getElementById('passportOCRStatus').textContent='Отметьте хотя бы одно заполненное поле.';return;}
 state.form.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('passportOCRDialog').close();
 state.message.textContent='Перенесено полей: '+count+'. Проверьте данные и нажмите «Сохранить» у продавца.';state.message.scrollIntoView({block:'center',behavior:'smooth'});
}
async function recognizeSellerPassport(files){
 const dialog=document.getElementById('passportOCRDialog'),status=document.getElementById('passportOCRStatus');
 const token=++passportRun;document.getElementById('passportOCRApply').disabled=true;document.getElementById('passportOCRFields').replaceChildren();document.getElementById('passportOCRText').textContent='';
 if(!dialog.open)dialog.showModal();
 if(files.length>4||files.some(f=>f.size>12*1024*1024||!f.size||!['image/jpeg','image/png','image/webp'].includes(f.type))){status.textContent='Выберите до 4 фотографий JPG, PNG или WebP, до 12 МБ каждая. Для PDF и HEIC сначала сохраните страницы как JPG или PNG.';return;}
 const photos=document.getElementById('passportOCRPhotos');photos.replaceChildren();
 for(const file of files){const url=URL.createObjectURL(file);passportPhotoURLs.push(url);const img=document.createElement('img');img.src=url;img.alt='Фото паспорта для проверки';photos.appendChild(img);}
 status.textContent='Загрузка распознавания. При первом запуске нужно скачать языковые данные — это может занять около минуты.';
 let worker=null,timer;
 try{
  const library=await loadPassportLibrary();if(token!==passportRun)return;
  worker=await library.createWorker(['rus','eng'],1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',logger:m=>{if(token===passportRun&&m.status==='recognizing text')status.textContent='Распознавание фотографии… '+Math.round(m.progress*100)+'%';}});
  if(token!==passportRun)return;passportWorker=worker;
  await worker.setParameters({tessedit_pageseg_mode:'3'});
  const texts=[];
  for(let i=0;i<files.length;i++){
   status.textContent='Распознавание фото '+(i+1)+' из '+files.length+'…';
   const result=await Promise.race([worker.recognize(files[i]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Фото обрабатывается слишком долго. Попробуйте более чёткий снимок меньшего размера.')),90000);})]);clearTimeout(timer);
   if(token!==passportRun)return;texts.push(result.data.text||'');
  }
  const text=texts.join('\n');document.getElementById('passportOCRText').textContent=text||'Текст не найден.';
  const parsed=parsePassportText(text);showPassportCandidates(parsed);
  const count=Object.keys(parsed.fields).length;
  status.textContent=count?'Найдено полей: '+count+'. Распознавание может ошибаться: сверьте значения с фото. Ненайденные данные можно дописать ниже.':'Не удалось уверенно выделить поля. Можно заполнить их вручную по фото и распознанному тексту или повторить с более чётким снимком.';
 }catch(error){if(token===passportRun)status.textContent='Не удалось распознать паспорт: '+(error.message||String(error))+'. Данные продавца не изменены.';}
 finally{clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});if(passportWorker===worker)passportWorker=null;}
}
