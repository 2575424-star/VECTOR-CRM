const SUPABASE_URL = "https://nrchmdphzwgntsgjesqn.supabase.co";
const SUPABASE_KEY = "sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


async function loadCars(){

    const {data,error}=await supabaseClient
        .from("cars")
        .select("*")
        .order("created_at",{ascending:false});


    const box=document.getElementById("cars");


    if(error){
        box.innerHTML="<h2>Ошибка загрузки</h2>";
        console.log(error);
        return;
    }


    box.innerHTML=data.map(car=>{


        const margin =
        (car.sale_price || 0) -
        (car.purchase_price || 0);


        return `

        <div class="car-card">


            <div class="car-photo">
                Фото автомобиля
            </div>


            <div class="car-info">

            <h2>
            ${car.brand || ""} ${car.model || ""}
            </h2>


            <div class="subtitle">
            ${car.year || ""} • ${car.mileage || 0} км
            </div>


            <p>
            VIN:
            ${car.vin || "-"}
            </p>


            <div class="finance">


            <div>
            <span>Покупка</span>
            <b>${Number(car.purchase_price||0).toLocaleString()} ₽</b>
            </div>


            <div>
            <span>Маржа</span>
            <b class="green">
            ${margin.toLocaleString()} ₽
            </b>
            </div>


            </div>


            <button onclick="openCar('${car.id}')">
            Открыть карточку
            </button>


            </div>


        </div>

        `;

    }).join("");

}



function openModal(){

document.getElementById("modal").style.display="flex";

}



async function saveCar(){


const car={

brand:
document.getElementById("brand").value,


model:
document.getElementById("model").value,


year:
Number(document.getElementById("year").value),


vin:
document.getElementById("vin").value,


mileage:
Number(document.getElementById("mileage").value),


purchase_price:
Number(document.getElementById("purchase_price").value)

};


const {error}=await supabaseClient
.from("cars")
.insert(car);



if(error){

alert(error.message);
return;

}



document.getElementById("modal").style.display="none";


loadCars();


}



function openCar(id){

window.location.href="car.html?id="+id;

}



loadCars();
