const SUPABASE_URL = "https://nrchmdphzwgntsgjesqn.supabase.co";
const SUPABASE_KEY = "sb_publishable_gF1GO41QQznJcDycpLBjkw_7fn_Q-hO";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =========================
// ЗАГРУЗКА АВТОМОБИЛЕЙ
// =========================

async function loadCars(){

    const { data, error } = await supabaseClient
        .from("cars")
        .select("*")
        .order("created_at", { ascending:false });


    const box = document.getElementById("cars");


    if(error){

        console.error(error);

        box.innerHTML = `
        <h2>
        Ошибка загрузки автомобилей
        </h2>
        `;

        return;
    }


    if(!data || data.length === 0){

        box.innerHTML = `
        <h2>
        Автомобилей пока нет
        </h2>
        `;

        return;
    }



    box.innerHTML = data.map(car => {


        const margin =
        Number(car.sale_price || 0) -
        Number(car.purchase_price || 0);



        return `

        <div class="car-card">


            <div class="car-photo">
                Фото автомобиля
            </div>



            <div class="car-info">


                <h2>
                ${car.brand || ""}
                ${car.model || ""}
                </h2>


                <div class="subtitle">
                ${car.year || ""} 
                • 
                ${car.mileage || 0} км
                </div>


                <p>
                VIN:
                ${car.vin || "-"}
                </p>



                <div class="finance">


                    <div>
                    <span>
                    Покупка
                    </span>

                    <b>
                    ${money(car.purchase_price)}
                    </b>
                    </div>



                    <div>
                    <span>
                    Маржа
                    </span>

                    <b class="green">
                    ${money(margin)}
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



// =========================
// ДОБАВЛЕНИЕ АВТО
// =========================


function openModal(){

    document.getElementById("modal")
    .style.display="flex";

}



async function saveCar(){


    const car = {


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

        console.error(error);

        return;

    }



    document.getElementById("modal")
    .style.display="none";


    loadCars();


}



// =========================
// ОТКРЫТИЕ КАРТОЧКИ
// =========================


function openCar(id){

    window.location.href =
    "car.html?id=" + id;

}



// =========================
// ФОРМАТ ДЕНЕГ
// =========================


function money(value){

    return new Intl.NumberFormat("ru-RU")
    .format(Number(value || 0))
    + " ₽";

}



// старт

loadCars();
