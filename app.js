const money = n => new Intl.NumberFormat('ru-RU').format(Number(n||0)) + ' ₽';

const DB_NAME = 'vector_crm_db';
const STORE_FILES = 'files';

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES,{keyPath:'id',autoIncrement:true});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function addFile(file){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_FILES,'readwrite');
    const store=tx.objectStore(STORE_FILES);
    const req=store.add({name:file.name,type:file.type,size:file.size,createdAt:Date.now(),blob:file});
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function getFiles(){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_FILES,'readonly');
    const req=tx.objectStore(STORE_FILES).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}
async function deleteFile(id){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_FILES,'readwrite');
    const req=tx.objectStore(STORE_FILES).delete(id);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}

const defaultState = {
  model:'BMW X5 xDrive40i', year:'2023', mileage:'28400', vin:'WBA00000000000000',
  status:'На складе', purchase:8900000, sale:10200000,
  clientName:'Иванов Иван Иванович', clientPhone:'+7 900 000-00-00', clientEmail:'client@example.com',
  expenses:[{name:'Доставка',amount:170000},{name:'Таможня',amount:150000}]
};
let state = JSON.parse(localStorage.getItem('vectorCrmState')||'null') || defaultState;

function saveState(){localStorage.setItem('vectorCrmState', JSON.stringify(state));}
function refresh(){
  document.getElementById('model').value=state.model;
  document.getElementById('year').value=state.year;
  document.getElementById('mileage').value=state.mileage;
  document.getElementById('vin').value=state.vin;
  document.getElementById('status').value=state.status;
  document.getElementById('purchase').value=state.purchase;
  document.getElementById('sale').value=state.sale;
  document.getElementById('clientName').value=state.clientName;
  document.getElementById('clientPhone').value=state.clientPhone;
  document.getElementById('clientEmail').value=state.clientEmail;
  document.getElementById('carTitle').textContent=state.model;
  document.getElementById('carMeta').textContent=`${state.year} · ${Number(state.mileage).toLocaleString('ru-RU')} км · VIN: ${state.vin}`;
  const exp=state.expenses.reduce((a,b)=>a+Number(b.amount),0);
  const margin=Number(state.sale)-Number(state.purchase)-exp;
  document.getElementById('purchasePrice').textContent=money(state.purchase);
  document.getElementById('salePrice').textContent=money(state.sale);
  document.getElementById('expensesTotal').textContent=money(exp);
  document.getElementById('expenseSummary').textContent=money(exp);
  document.getElementById('marginValue').textContent=money(margin);
  document.getElementById('expenseList').innerHTML=state.expenses.map((e,i)=>`
    <div class="expense-item"><span>${e.name}</span><strong>${money(e.amount)}</strong></div>`).join('');
}
async function refreshFiles(){
  const files=await getFiles();
  const list=document.getElementById('documentsList');
  list.innerHTML = files.length ? files.map(f=>`
    <div class="doc-item">
      <div class="doc-meta"><strong>${f.name}</strong><small>${Math.max(1,Math.round(f.size/1024))} КБ · ${new Date(f.createdAt).toLocaleString('ru-RU')}</small></div>
      <div class="doc-actions">
        <button class="icon-btn" onclick="downloadStoredFile(${f.id})">Открыть</button>
        <button class="icon-btn" onclick="removeStoredFile(${f.id})">Удалить</button>
      </div>
    </div>`).join('') : '<div style="color:#747d88">Файлов пока нет. Нажмите «Загрузить файл».</div>';

  const imgs=files.filter(f=>f.type && f.type.startsWith('image/')).slice(0,3);
  if(imgs.length){
    const photoGrid=document.getElementById('photoGrid');
    photoGrid.innerHTML=imgs.map((f,i)=>`<img src="${URL.createObjectURL(f.blob)}" alt="${f.name}" style="${i===0?'grid-row:1/3;':''}">`).join('');
  }
}
window.downloadStoredFile = async id=>{
  const files=await getFiles();
  const f=files.find(x=>x.id===id);
  if(!f) return;
  const url=URL.createObjectURL(f.blob);
  const a=document.createElement('a');
  a.href=url;a.download=f.name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.removeStoredFile = async id=>{ await deleteFile(id); await refreshFiles(); };

async function handleFiles(fileList){
  for(const f of fileList) await addFile(f);
  await refreshFiles();
}
document.getElementById('fileInput').addEventListener('change',e=>handleFiles(e.target.files));
document.getElementById('fileInput2').addEventListener('change',e=>handleFiles(e.target.files));

document.getElementById('saveCarBtn').addEventListener('click',()=>{
  state.model=document.getElementById('model').value;
  state.year=document.getElementById('year').value;
  state.mileage=document.getElementById('mileage').value;
  state.vin=document.getElementById('vin').value;
  state.status=document.getElementById('status').value;
  state.purchase=Number(document.getElementById('purchase').value);
  state.sale=Number(document.getElementById('sale').value);
  state.clientName=document.getElementById('clientName').value;
  state.clientPhone=document.getElementById('clientPhone').value;
  state.clientEmail=document.getElementById('clientEmail').value;
  saveState();refresh();
  alert('Данные сохранены в этом браузере.');
});

const dialog=document.getElementById('expenseDialog');
document.getElementById('addExpenseBtn').addEventListener('click',()=>dialog.showModal());
document.getElementById('saveExpenseBtn').addEventListener('click',e=>{
  const name=document.getElementById('expenseName').value.trim();
  const amount=Number(document.getElementById('expenseAmount').value);
  if(!name || !amount) { e.preventDefault(); return; }
  state.expenses.push({name,amount}); saveState(); refresh();
  document.getElementById('expenseName').value=''; document.getElementById('expenseAmount').value='';
});
document.getElementById('changeStatusBtn').addEventListener('click',()=>{
  const select=document.getElementById('status');
  select.focus();
  select.scrollIntoView({behavior:'smooth',block:'center'});
});
refresh();refreshFiles();
