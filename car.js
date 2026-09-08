const SUPABASE_URL="https://nrchmdphzwgntsgjesqn.supabase.co",SUPABASE_KEY="sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY),carId=new URLSearchParams(location.search).get("id"),money=v=>new Intl.NumberFormat("ru-RU").format(Number(v||0))+" ₽",date=v=>new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v));
let car,expenseTotal=0,dialogMode="";
const el=id=>document.getElementById(id),set=(id,value)=>el(id).textContent=value;
function toast(message){set("toast",message);el("toast").classList.add("show");setTimeout(()=>el("toast").classList.remove("show"),2500)}
async function history(action,details=""){await db.from("car_history").insert({car_id:String(carId),action,details})}
async function loadCar(){
 if(!carId){set("title","Автомобиль не выбран");return}
 const{data,error}=await db.from("cars").select("*").eq("id",carId).single();if(error){set("title","Автомобиль не найден");set("meta",error.message);return}car=data;
 set("title",`${car.brand||""} ${car.model||""}`.trim()||"Без названия");set("meta",`${car.year||"—"} • ${Number(car.mileage||0).toLocaleString("ru-RU")} км • VIN ${car.vin||"—"}`);
 ["brand","model","vin","year","status"].forEach(k=>set(k,car[k]||"—"));set("location",car.location||car.current_location||"—");set("mileage",Number(car.mileage||0).toLocaleString("ru-RU")+" км");set("purchase",money(car.purchase_price));set("sale",money(car.sale_price));set("saleTop",money(car.sale_price));
 const since=car.status_changed_at||car.updated_at||car.created_at;if(since){set("daysCount",Math.max(0,Math.floor((Date.now()-new Date(since))/(864e5))));set("daysLabel",/пути|транзит/i.test(car.status||"")?"Дней в пути":/склад|налич/i.test(car.status||"")?"Дней на складе":"Дней в статусе")}
 initParties(car);initContracts();
 await Promise.all([loadExpenses(),loadFiles(),loadRoute(),loadHistory()]);updateMoney();
}
function updateMoney(){set("expenses",money(expenseTotal));set("costPrice",money(Number(car?.purchase_price||0)+expenseTotal));set("margin",money(Number(car?.sale_price||0)-Number(car?.purchase_price||0)-expenseTotal))}
async function loadExpenses(){const{data}=await db.from("expenses").select("*").eq("car_id",carId).order("created_at",{ascending:false});expenseTotal=(data||[]).reduce((s,x)=>s+Number(x.amount||0),0);el("expenseList").innerHTML=(data||[]).map(x=>`<div class="record"><span>${x.name||x.category||"Расход"}<small>${x.created_at?date(x.created_at):""}</small></span><b>${money(x.amount)}</b></div>`).join("")||'<div class="empty">Расходов пока нет</div>'}
const pendingUploads = new WeakMap();
let uploadingFiles = false;
function fileNotice(message) {
 let notice = el("fileNotice");
 if (!notice) {
  notice = document.createElement("p");
  notice.id = "fileNotice";
  notice.setAttribute("role", "status");
  notice.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;color:#cddff1;padding:12px;border:1px solid #214766;border-radius:8px;";
  el("photos").parentNode.appendChild(notice);
 }
 notice.textContent = message;
}
async function loadFiles() {
 try {
  const {data,error} = await db.from("car_files").select("*").eq("car_id",String(carId)).order("created_at",{ascending:false});
  if (error) throw error;
  renderDocuments(data || []);
  for (const [container,type] of [["photos","photo"],["documents","document"]]) {
   const target = el(container);
   if (type === "document") continue;
   target.replaceChildren();
   const items = (data || []).filter(x => type === "photo" ? x.file_type === "photo" : x.file_type !== "photo");
   for (const item of items) {
    const url = db.storage.from("car-files").getPublicUrl(item.path).data.publicUrl;
    const link = document.createElement("a");
    link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
    if (type === "photo") {
     const img = document.createElement("img");
     img.src = url; img.alt = item.name; img.loading = "lazy";
     img.onerror = () => { link.textContent = item.name + " — открыть файл (предпросмотр недоступен)"; };
     link.appendChild(img);
    } else {
     link.className = "record file-link";
     link.textContent = "📄 " + item.name + " · Открыть";
    }
    target.appendChild(link);
   }
   if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = type === "photo" ? "Фото пока нет" : "Документов пока нет";
    target.appendChild(empty);
   }
  }
  return true;
 } catch (error) {
  fileNotice("Не удалось прочитать список файлов: " + (error.message || String(error)) + ". Уже показанные файлы сохранены.");
  return false;
 }
}
async function uploadFiles(files,type,documentDetails = {}) {
 if (!files.length || uploadingFiles) return;
 if (!carId || !car) { fileNotice("Сначала дождитесь загрузки карточки автомобиля."); return; }
 uploadingFiles = true;
 el("photoInput").disabled = el("documentInput").disabled = true;
 const errors = [], warnings = [];
 let saved = 0;
 try {
  for (let index = 0; index < files.length; index++) {
   const file = files[index];
   let stage = "Загрузка в хранилище";
   fileNotice("Загрузка " + (index+1) + " из " + files.length + ": " + file.name);
   try {
    if (!file.size) throw new Error("Файл пустой.");
    let pending = pendingUploads.get(file);
    if (!pending) {
     const extension = (file.name.match(/\.([a-zA-Z0-9]{1,10})$/) || [,"bin"])[1].toLowerCase();
     // ASCII-only keys; keep the original filename exclusively in metadata.
     const path = "uploads/" + crypto.randomUUID() + "." + extension;
     const result = await db.storage.from("car-files").upload(path,file,{upsert:false,contentType:file.type || "application/octet-stream"});
     if (result.error) throw result.error;
     pending = {path,registered:false};
     pendingUploads.set(file,pending);
    }
    stage = "Привязка файла к автомобилю";
    if (!pending.registered) {
     // A prior response may have been lost; avoid inserting metadata twice.
     const lookup = await db.from("car_files").select("id").eq("car_id",String(carId)).eq("path",pending.path).limit(1);
     if (lookup.error) throw lookup.error;
     if (!lookup.data?.length) {
      const metadata = {car_id:String(carId),name:file.name,path:pending.path,file_type:type,mime_type:file.type};
      if (type === "document") {
       metadata.category = documentDetails.category || "other";
       metadata.comment = documentDetails.comment || "";
      }
      const result = await db.from("car_files").insert(metadata);
      if (result.error) throw result.error;
     }
     pending.registered = true;
     try {
      const log = await db.from("car_history").insert({car_id:String(carId),action:type === "photo" ? "Загружено фото" : "Загружен документ",details:file.name});
      if (log.error) throw log.error;
     } catch (error) { warnings.push(file.name + ": файл сохранён, но история не записана — " + (error.message || String(error))); }
    }
    saved++;
   } catch (error) {
    errors.push(file.name + " — " + stage + ": " + (error.message || String(error)));
   }
  }
  fileNotice("Сохранено: " + saved + " из " + files.length + (errors.length ? "\n" + errors.join("\n") : "") + (warnings.length ? "\n" + warnings.join("\n") : ""));
  await loadFiles();
  // Preserve a retry using the same File objects when metadata registration failed.
  if (errors.length) {
   const retry = document.createElement("button");
   retry.type = "button"; retry.className = "ghost-btn"; retry.textContent = "Повторить несохранённые";
   retry.onclick = () => { retry.remove(); uploadFiles(files.filter(f => !pendingUploads.get(f)?.registered),type,documentDetails); };
   el("fileNotice").appendChild(document.createElement("br"));
   el("fileNotice").appendChild(retry);
  }
  await loadHistory();
 } finally {
  uploadingFiles = false;
  el("photoInput").disabled = el("documentInput").disabled = false;
  el("photoInput").value = el("documentInput").value = "";
 }
}
async function loadRoute(){const{data}=await db.from("route_events").select("*").eq("car_id",String(carId)).order("event_date",{ascending:false});el("routeList").innerHTML=(data||[]).map(x=>`<div class="timeline-item"><b>${x.location}</b><span>${x.status||"Событие маршрута"} · ${date(x.event_date)}</span></div>`).join("")||'<div class="empty">Маршрут пока не заполнен</div>'}
async function loadHistory(){const{data}=await db.from("car_history").select("*").eq("car_id",String(carId)).order("created_at",{ascending:false}).limit(30);el("historyList").innerHTML=(data||[]).map(x=>`<div class="timeline-item"><b>${x.action}</b><span>${x.details||""} · ${date(x.created_at)}</span></div>`).join("")||'<div class="empty">История пока пуста</div>'}
function openDialog(mode){dialogMode=mode;set("dialogTitle",mode==="expense"?"Добавить расход":"Добавить событие маршрута");el("dialogFields").innerHTML=mode==="expense"?'<label>Название<input name="name" required placeholder="Доставка, таможня…"></label><label>Сумма<input name="amount" type="number" min="0" required></label>':'<label>Местоположение<input name="location" required placeholder="Бишкек"></label><label>Статус<input name="status" placeholder="Прибыл на склад"></label><label>Дата<input name="event_date" type="date" required></label>';if(mode==="route")el("quickForm").elements.event_date.value=new Date().toISOString().slice(0,10);el("formDialog").showModal()}
el("quickForm").addEventListener("submit",async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(dialogMode==="expense"){const{error}=await db.from("expenses").insert({car_id:carId,name:f.name,amount:Number(f.amount)});if(error)return toast("Ошибка: "+error.message);await history("Добавлен расход",`${f.name}: ${money(f.amount)}`);await loadExpenses();updateMoney()}else{await db.from("route_events").insert({...f,car_id:String(carId)});await history("Обновлён маршрут",`${f.location}: ${f.status||"событие"}`);await loadRoute()}await loadHistory();el("formDialog").close();e.target.reset();toast("Сохранено")});
el("expenseBtn").onclick=()=>openDialog("expense");el("expenseAddBtn").onclick=()=>openDialog("expense");el("routeBtn").onclick=()=>openDialog("route");el("routeAddBtn").onclick=()=>openDialog("route");el("photoInput").onchange=e=>uploadFiles([...e.target.files],"photo");el("documentInput").onchange=e=>uploadFiles([...e.target.files],"document");initDocuments();loadCar();
