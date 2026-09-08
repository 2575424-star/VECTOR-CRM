const SUPABASE_URL="https://nrchmdphzwgntsgjesqn.supabase.co",SUPABASE_KEY="sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);let cars=[],activeFilter="all";
const money=v=>new Intl.NumberFormat("ru-RU").format(Number(v||0))+" ₽",safe=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const days=c=>{const d=c.status_changed_at||c.updated_at||c.created_at;return d?Math.max(0,Math.floor((Date.now()-new Date(d))/864e5)):"—"};
const group=s=>/тамож/i.test(s)?"customs":/склад|налич/i.test(s)?"stock":/продан/i.test(s)?"sold":/пути|транзит/i.test(s)?"transit":"other";
const badge=s=>group(s)==="customs"?"blue":group(s)==="stock"?"green":group(s)==="sold"?"purple":group(s)==="transit"?"orange":"gray";
function openCar(id){location.href=`car.html?id=${encodeURIComponent(id)}`}
function currentList(){const q=(document.getElementById("tableSearch").value||document.getElementById("search").value).trim().toLowerCase(),selected=document.getElementById("statusSelect").value.toLowerCase();return cars.filter(c=>(activeFilter==="all"||group(c.status||"")===activeFilter)&&(!selected||String(c.status||"").toLowerCase()===selected)&&(!q||[c.brand,c.model,c.vin,c.country,c.location].some(v=>String(v||"").toLowerCase().includes(q))))}
function render(){
 const list=currentList(),body=document.getElementById("carsBody"),table=document.getElementById("carsTable"),state=document.getElementById("state");body.innerHTML="";
 if(!list.length){table.hidden=true;state.hidden=false;state.textContent=cars.length?"Ничего не найдено":"Автомобилей пока нет";return}
 list.forEach(c=>{const row=document.createElement("tr"),name=`${safe(c.brand||"Без марки")} ${safe(c.model||"")}`;row.tabIndex=0;row.innerHTML=`<td><div class="car-thumb">${c.photo_url?`<img src="${safe(c.photo_url)}" alt="">`:"🚘"}</div></td><td><strong>${name}</strong><small>${safe(c.modification||"")}</small></td><td>${safe(c.year||"—")}</td><td class="vin">${safe(c.vin||"—")}</td><td>${safe(c.country||"—")}</td><td><span class="badge ${badge(c.status||"")}">${safe(c.status||"Без статуса")}</span></td><td>${safe(c.location||"—")}</td><td>${days(c)}</td><td>${money(c.purchase_price)}</td><td>${money(c.sale_price)}</td><td class="dots">⋮</td>`;row.onclick=()=>openCar(c.id);row.onkeydown=e=>{if(e.key==="Enter")openCar(c.id)};body.appendChild(row)});state.hidden=true;table.hidden=false;
}
function updateCounts(){const count=g=>cars.filter(c=>group(c.status||"")===g).length;totalCars.textContent=allCount.textContent=cars.length;transitCars.textContent=count("transit");customsCars.textContent=count("customs");stockCars.textContent=count("stock");soldCars.textContent=count("sold")}
async function load(){const{data,error}=await db.from("cars").select("*").order("created_at",{ascending:false});if(error){state.textContent="Не удалось загрузить автомобили: "+error.message;return}cars=data||[];updateCounts();render()}
["search","tableSearch"].forEach(id=>document.getElementById(id).oninput=render);statusSelect.onchange=render;
statusTabs.onclick=e=>{const b=e.target.closest("button");if(!b)return;activeFilter=b.dataset.filter;statusTabs.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));render()};
// Keep creation isolated from the existing list and card layout.
const createDialog = document.createElement("dialog");
createDialog.setAttribute("aria-labelledby", "createCarTitle");
createDialog.className = "create-car-dialog";
createDialog.innerHTML = `
 <form id="createCarForm">
  <h2 id="createCarTitle">Добавить автомобиль</h2>
  <p>Пока используйте только тестовые данные. Цены — в рублях.</p>
  <div class="create-car-fields">
   <label>VIN *<input name="vin" required minlength="17" maxlength="17" pattern="[A-HJ-NPR-Za-hj-npr-z0-9]{17}" autocomplete="off" title="17 латинских букв и цифр, без I, O, Q"></label>
   <label>Марка *<input name="brand" required maxlength="100"></label>
   <label>Модель *<input name="model" required maxlength="100"></label>
   <label>Год *<input name="year" type="number" required min="1886" max="${new Date().getFullYear()+1}" step="1"></label>
   <label>Пробег, км *<input name="mileage" type="number" required min="0" max="2147483647" step="1" value="0"></label>
   <label>Цена покупки, ₽ *<input name="purchase_price" type="number" required min="0" max="9999999999" step="0.01"></label>
   <label>Статус *<select name="status" required><option>В пути</option><option>Таможня</option><option>На складе</option><option>Продан</option></select></label>
  </div>
  <p id="createCarError" role="alert"></p>
  <div class="create-car-actions"><button type="button" class="ghost-btn" id="cancelCreateCar">Отмена</button><button type="submit" class="primary-btn" id="saveCreateCar">Сохранить и открыть</button></div>
 </form>`;
document.body.appendChild(createDialog);
const createStyle = document.createElement("style");
createStyle.textContent = `
 .create-car-dialog{width:min(620px,94vw);max-height:90vh;overflow:auto;border:1px solid var(--line2);border-radius:12px;background:var(--panel);color:var(--text);padding:24px}
 .create-car-dialog::backdrop{background:#000b}
 .create-car-dialog h2{margin-top:0}
 .create-car-dialog p{color:#b2c4d5;line-height:1.5;font-size:14px}
 .create-car-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}
 .create-car-fields label{display:grid;gap:7px;font-size:14px;min-width:0}
 .create-car-fields input,.create-car-fields select{width:100%;min-width:0;padding:11px;border:1px solid var(--line2);border-radius:7px;background:#041321;color:white;font-size:16px}
 .create-car-fields input:focus-visible,.create-car-fields select:focus-visible{outline:2px solid var(--blue)}
 .create-car-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
 #createCarError{color:#ffadad;white-space:pre-wrap}
 .create-car-dialog button:disabled{opacity:.6;cursor:wait}
 @media(max-width:540px){.create-car-fields{grid-template-columns:1fr}.create-car-dialog{padding:18px}.create-car-actions{flex-wrap:wrap}}
 `;
document.head.appendChild(createStyle);
const createForm = document.getElementById("createCarForm");
const createError = document.getElementById("createCarError");
const saveCreate = document.getElementById("saveCreateCar");
const cancelCreate = document.getElementById("cancelCreateCar");
let creatingCar = false;
document.getElementById("addCarBtn").onclick = () => {
 createError.textContent = "";
 createDialog.showModal();
 createForm.elements.vin.focus();
};
createForm.elements.vin.addEventListener("input", e => {
 e.target.value = e.target.value.toUpperCase();
});
cancelCreate.onclick = () => { if (!creatingCar) createDialog.close(); };
createDialog.addEventListener("cancel", e => { if (creatingCar) e.preventDefault(); });
function carCreationPayload(form) {
 const values = Object.fromEntries(new FormData(form));
 const payload = {
  vin: values.vin.trim().toUpperCase(),
  brand: values.brand.trim(), model: values.model.trim(),
  year: Number(values.year), mileage: Number(values.mileage),
  purchase_price: Number(values.purchase_price), status: values.status
 };
 if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(payload.vin)) throw new Error("VIN должен содержать 17 латинских букв и цифр, без I, O, Q.");
 if (!payload.brand || !payload.model) throw new Error("Укажите марку и модель.");
 if (!Number.isInteger(payload.year) || payload.year < 1886 || payload.year > new Date().getFullYear()+1) throw new Error("Проверьте год выпуска.");
 if (!Number.isInteger(payload.mileage) || payload.mileage < 0 || payload.mileage > 2147483647) throw new Error("Пробег должен быть целым неотрицательным числом.");
 if (!Number.isFinite(payload.purchase_price) || payload.purchase_price < 0 || payload.purchase_price > 9999999999) throw new Error("Проверьте цену покупки.");
 if (!["В пути","Таможня","На складе","Продан"].includes(payload.status)) throw new Error("Выберите статус.");
 return payload;
}
createForm.addEventListener("submit", async e => {
 e.preventDefault();
 if (creatingCar || !createForm.reportValidity()) return;
 createError.textContent = "";
 let payload;
 try { payload = carCreationPayload(createForm); }
 catch (error) { createError.textContent = error.message; return; }
 creatingCar = true;
 saveCreate.disabled = cancelCreate.disabled = true;
 saveCreate.textContent = "Сохранение…";
 createForm.setAttribute("aria-busy", "true");
 let insertStarted = false;
 try {
  const existing = await db.from("cars").select("id").ilike("vin", payload.vin).limit(1);
  if (existing.error) throw existing.error;
  if (existing.data?.length) throw new Error("Автомобиль с таким VIN уже есть. Найдите его через поиск.");
  insertStarted = true;
  const result = await db.from("cars").insert(payload).select("id").single();
  if (result.error) throw result.error;
  if (result.data?.id == null) throw new Error("Не получен номер новой карточки.");
  createDialog.close();
  createForm.reset();
  openCar(result.data.id);
 } catch (error) {
  const detail = error.code === "23505" ? "Запись с такими уникальными данными уже существует." : (error.message || "Нет связи с базой.");
  createError.textContent = (insertStarted ? "Не удалось подтвердить создание. Перед повтором проверьте VIN в списке автомобилей. " : "Автомобиль не создан. ") + detail;
 } finally {
  creatingCar = false;
  saveCreate.disabled = cancelCreate.disabled = false;
  saveCreate.textContent = "Сохранить и открыть";
  createForm.removeAttribute("aria-busy");
 }
});
load();
