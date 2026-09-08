const SUPABASE_URL="https://nrchmdphzwgntsgjesqn.supabase.co";
const SUPABASE_KEY="sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let cars=[];
const money=v=>new Intl.NumberFormat("ru-RU").format(Number(v||0))+" ₽";
const safe=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
function openCar(id){location.href=`car.html?id=${encodeURIComponent(id)}`;}
function render(list){
 const body=document.getElementById("carsBody"),table=document.getElementById("carsTable"),state=document.getElementById("state");body.innerHTML="";
 if(!list.length){table.hidden=true;state.hidden=false;state.textContent=cars.length?"Ничего не найдено":"Автомобилей пока нет";return;}
 list.forEach(car=>{const row=document.createElement("tr");row.tabIndex=0;row.innerHTML=`<td><strong>${safe(car.brand)} ${safe(car.model)}</strong></td><td class="vin">${safe(car.vin||"—")}</td><td>${safe(car.year||"—")}</td><td>${new Intl.NumberFormat("ru-RU").format(Number(car.mileage||0))} км</td><td><span class="badge">${safe(car.status||"Без статуса")}</span></td><td>${money(car.purchase_price)}</td>`;row.onclick=()=>openCar(car.id);row.onkeydown=e=>{if(e.key==="Enter")openCar(car.id)};body.appendChild(row)});
 state.hidden=true;table.hidden=false;
}
function updateStats(){totalCars.textContent=cars.length;transitCars.textContent=cars.filter(c=>/пути|транзит/i.test(c.status||"")).length;stockCars.textContent=cars.filter(c=>/склад|налич/i.test(c.status||"")).length;}
async function loadCars(){const{data,error}=await supabaseClient.from("cars").select("*").order("created_at",{ascending:false});if(error){state.textContent="Не удалось загрузить автомобили: "+error.message;return}cars=data||[];updateStats();render(cars)}
search.addEventListener("input",e=>{const q=e.target.value.trim().toLowerCase();render(cars.filter(c=>[c.brand,c.model,c.vin].some(v=>String(v||"").toLowerCase().includes(q))))});loadCars();
