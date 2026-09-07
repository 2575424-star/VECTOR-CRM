const SUPABASE_URL="https://nrchmdphzwgntsgjesqn.supabase.co";
const SUPABASE_KEY="ВСТАВЬТЕ_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let car=null;

const money=n=>new Intl.NumberFormat("ru-RU").format(Number(n||0))+" ₽";

async function loadCar(){
 const {data,error}=await supabaseClient.from("cars").select("*").limit(1);
 if(error){console.error(error);return;}
 car=data[0];
 if(!car)return;
 renderCar();
 loadExpenses();
}

function renderCar(){
 document.getElementById("carTitle").textContent=`${car.brand} ${car.model}`;
 document.getElementById("carMeta").textContent=`${car.year} · ${car.mileage||0} км · VIN: ${car.vin||"-"}`;
 if(document.getElementById("purchasePrice")) purchasePrice.textContent=money(car.purchase_price);
 if(document.getElementById("salePrice")) salePrice.textContent=money(car.sale_price);
}

async function loadExpenses(){
 const {data}=await supabaseClient.from("expenses").select("*").eq("car_id",car.id);
 const total=(data||[]).reduce((a,b)=>a+Number(b.amount||0),0);
 if(document.getElementById("expenseTotal")) expenseTotal.textContent=money(total);
 if(document.getElementById("margin")) margin.textContent=money(car.sale_price-car.purchase_price-total);
}

async function saveCar(){
 await supabaseClient.from("cars").update({
  brand:brand.value,
  model:model.value,
  year:Number(year.value),
  vin:vin.value,
  mileage:Number(mileage.value),
  purchase_price:Number(purchase.value),
  sale_price:Number(sale.value),
  status:status.value
 }).eq("id",car.id);
 loadCar();
}

document.addEventListener("DOMContentLoaded",()=>{
 loadCar();
 document.getElementById("saveBtn")?.addEventListener("click",saveCar);
});
