const SUPABASE_URL="https://nrchmdphzwgntsgjesqn.supabase.co";
const SUPABASE_KEY="sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const id=new URLSearchParams(location.search).get("id");
const money=v=>new Intl.NumberFormat("ru-RU").format(Number(v||0))+" ₽";
async function loadCar(){
 if(!id){title.textContent="Автомобиль не выбран";return}
 const[{data:car,error},{data:costs}]=await Promise.all([supabaseClient.from("cars").select("*").eq("id",id).single(),supabaseClient.from("expenses").select("amount").eq("car_id",id)]);
 if(error){title.textContent="Автомобиль не найден";meta.textContent=error.message;return}
 const expenseTotal=(costs||[]).reduce((s,x)=>s+Number(x.amount||0),0),set=(name,value)=>document.getElementById(name).textContent=value;
 set("title",`${car.brand||""} ${car.model||""}`.trim()||"Без названия");set("meta",`${car.year||"—"} • ${new Intl.NumberFormat("ru-RU").format(Number(car.mileage||0))} км • VIN ${car.vin||"—"}`);
 set("brand",car.brand||"—");set("model",car.model||"—");set("vin",car.vin||"—");set("year",car.year||"—");set("mileage",new Intl.NumberFormat("ru-RU").format(Number(car.mileage||0))+" км");
 set("purchase",money(car.purchase_price));set("expenses",money(expenseTotal));set("sale",money(car.sale_price));set("margin",money(Number(car.sale_price||0)-Number(car.purchase_price||0)-expenseTotal));
}loadCar();
