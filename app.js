// =====================================
// VECTOR CRM + SUPABASE
// =====================================


// Данные Supabase
const SUPABASE_URL = "https://nrchmdphzwgntsgjesqn.supabase.co";

const SUPABASE_KEY = "ТВОЙ_КЛЮЧ_ИЗ_SUPABASE";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================
// Формат денег
// =====================================

function money(value){
    return new Intl.NumberFormat('ru-RU')
    .format(Number(value || 0)) + " ₽";
}


// =====================================
// Загружаем автомобиль
// =====================================

let car = null;


async function loadCar(){


    const {data,error} = await supabaseClient
    .from("cars")
    .select("*")
    .limit(1)
    .single();


    if(error){

        console.log(error);
        document.getElementById("carTitle").innerText="Ошибка загрузки";

        return;
    }


    car=data;


    renderCar();


}



// =====================================
// Показываем данные
// =====================================


function renderCar(){


    document.getElementById("carTitle").innerText =
    `${car.brand} ${car.model}`;


    document.getElementById("carMeta").innerText =
    `${car.year} · ${car.mileage || 0} км · VIN: ${car.vin || "-"}`;



    document.getElementById("purchasePrice").innerText =
    money(car.purchase_price);



    document.getElementById("salePrice").innerText =
    money(car.sale_price);



    document.getElementById("status").value =
    car.status || "На складе";



    if(document.getElementById("brand"))
    document.getElementById("brand").value =
    car.brand || "";



    if(document.getElementById("model"))
    document.getElementById("model").value =
    car.model || "";



    if(document.getElementById("year"))
    document.getElementById("year").value =
    car.year || "";



    if(document.getElementById("vin"))
    document.getElementById("vin").value =
    car.vin || "";



    if(document.getElementById("mileage"))
    document.getElementById("mileage").value =
    car.mileage || "";



    calculate();


}



// =====================================
// Расходы
// =====================================


async function loadExpenses(){


const {data,error}=await supabaseClient
.from("expenses")
.select("*")
.eq("car_id",car.id);



if(error){
console.log(error);
return;
}



let total=0;


data.forEach(e=>{

total+=Number(e.amount || 0);

});



document.getElementById("expensesTotal").innerText =
money(total);



calculate(total);


}



// =====================================
// Маржа
// =====================================


function calculate(exp=0){


let margin =
Number(car?.sale_price || 0)
-
Number(car?.purchase_price || 0)
-
Number(exp);



if(document.getElementById("marginValue"))
document.getElementById("marginValue").innerText =
money(margin);



}



// =====================================
// Сохранение
// =====================================


async function saveCar(){


let update={

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


status:
document.getElementById("status").value

};



const {error}=await supabaseClient
.from("cars")
.update(update)
.eq("id",car.id);



if(error){

alert(error.message);

return;

}


alert("Автомобиль сохранён");


loadCar();



}



// =====================================
// Запуск
// =====================================


document.addEventListener(
"DOMContentLoaded",
()=>{


loadCar();


document
.getElementById("saveCarBtn")
?.addEventListener(
"click",
saveCar
);



});
