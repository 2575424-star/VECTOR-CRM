const SUPABASE_URL = "YOUR_URL";
const SUPABASE_KEY = "sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadCars(){
 const {data,error}=await supabaseClient.from("cars").select("*").order("created_at",{ascending:false});
 const box=document.getElementById("cars");
 if(error){box.innerHTML="Ошибка загрузки";return;}
 box.innerHTML=data.map(car=>`
 <div class="card">
 <div class="photo">Фото</div>
 <h2>${car.brand||""} ${car.model||""}</h2>
 <p>${car.year||""} • ${car.mileage||0} км</p>
 <p>VIN: ${car.vin||""}</p>
 <b>${car.purchase_price||0} ₽</b>
 <button>Открыть карточку</button>
 </div>`).join("");
}

function openModal(){
 document.getElementById("modal").style.display="flex";
}

async function saveCar(){
 const car={
 brand:brand.value,
 model:model.value,
 year:Number(year.value),
 vin:vin.value,
 mileage:Number(mileage.value),
 purchase_price:Number(purchase_price.value)
 };
 const {error}=await supabaseClient.from("cars").insert(car);
 if(error){alert(error.message);return;}
 document.getElementById("modal").style.display="none";
 loadCars();
}

loadCars();
