const SUPABASE_URL="https://nrchmdphzwgntsgjesqn.supabase.co";
const SUPABASE_KEY="sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";

const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const id=new URLSearchParams(location.search).get("id");

const money=n=>new Intl.NumberFormat("ru-RU").format(Number(n||0))+" ₽";

async function loadCar(){
 const {data,error}=await supabaseClient.from("cars").select("*").eq("id",id).single();
 if(error){console.log(error);return;}

 title.innerText=`${data.brand||""} ${data.model||""}`;
 meta.innerText=`${data.year||""} • ${data.mileage||0} км • VIN ${data.vin||"-"}`;

 brand.innerText=data.brand||"";
 model.innerText=data.model||"";
 vin.innerText=data.vin||"";
 year.innerText=data.year||"";
 mileage.innerText=(data.mileage||0)+" км";

 purchase.innerText=money(data.purchase_price);
 sale.innerText=money(data.sale_price);
 margin.innerText=money((data.sale_price||0)-(data.purchase_price||0));
}

loadCar();
