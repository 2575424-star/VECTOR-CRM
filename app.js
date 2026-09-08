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
addCarBtn.onclick=()=>{toast.textContent="Форма добавления автомобиля — следующий шаг";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2400)};load();
