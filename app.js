// ===============================
// VECTOR CRM + SUPABASE
// ===============================


// ---------- SUPABASE ----------

const SUPABASE_URL =
"https://nrchmdphzwgntsgjesqn.supabase.co";


const SUPABASE_KEY =
"ВСТАВЬ_СЮДА_СВОЙ_PUBLISHABLE_KEY";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ---------- HELPERS ----------

const money = n =>
new Intl.NumberFormat('ru-RU')
.format(Number(n || 0))
+ ' ₽';



// ---------- STATE ----------

let state = {

id:null,

brand:'',
model:'',
year:'',
vin:'',
mileage:'',
color:'',
country:'',
status:'',

purchase:0,
sale:0,

expenses:[]

};



// ---------- LOAD CAR ----------


async function loadCar(){


const {data,error}=await supabaseClient

.from('cars')

.select('*')

.eq('brand','BMW')

.eq('model','X7')

.single();



if(error){

console.log(
"Ошибка загрузки автомобиля:",
error
);

return;

}



state={


id:data.id,


brand:data.brand,

model:data.model,

year:data.year,

vin:data.vin || '',

mileage:data.mileage || '',

color:data.color || '',

country:data.country || '',


status:data.status || 'На складе',


purchase:data.purchase_price || 0,


sale:data.sale_price || 0,


expenses:[]

};



await loadExpenses();


refresh();


}



// ---------- EXPENSES ----------


async function loadExpenses(){


const {data,error}=await supabaseClient


.from('expenses')

.select('*')

.eq('car_id',state.id);



if(error){

console.log(error);

return;

}



state.expenses=data || [];


}



// ---------- SAVE CAR ----------


async function saveCar(){


const update={


vin:
document.getElementById('vin').value,


mileage:
Number(
document.getElementById('mileage').value
),


status:
document.getElementById('status').value,


sale_price:
Number(
document.getElementById('sale').value
)


};



const {error}=await supabaseClient


.from('cars')

.update(update)

.eq('id',state.id);



if(error){

alert(error.message);

return;

}


alert(
"Автомобиль сохранён"
);


await loadCar();


}




// ---------- REFRESH UI ----------


function refresh(){



document.getElementById('carTitle')
.textContent =
state.brand+" "+state.model;



document.getElementById('carMeta')
.textContent =

`${state.year} · ${
state.mileage || 0
} км · VIN: ${
state.vin || '-'
}`;



document.getElementById('model')
.value =
state.brand+" "+state.model;



document.getElementById('year')
.value =
state.year;



document.getElementById('mileage')
.value =
state.mileage;



document.getElementById('vin')
.value =
state.vin;



document.getElementById('status')
.value =
state.status;



document.getElementById('purchase')
.value =
state.purchase;



document.getElementById('sale')
.value =
state.sale;



const expenses =
state.expenses.reduce(
(sum,e)=>
sum+Number(
e.amount || e.price || 0
),
0
);



const margin =
Number(state.sale)
-
Number(state.purchase)
-
expenses;



document.getElementById('purchasePrice')
.textContent =
money(state.purchase);



document.getElementById('salePrice')
.textContent =
money(state.sale);



document.getElementById('expensesTotal')
.textContent =
money(expenses);



document.getElementById('marginValue')
.textContent =
money(margin);



const list =
document.getElementById('expenseList');


if(list){

list.innerHTML =
state.expenses.map(e=>`

<div class="expense-item">

<span>
${e.name || 'Расход'}
</span>


<strong>
${money(e.amount)}
</strong>


</div>


`).join('');

}



}




// ---------- FILE STORAGE ----------


const DB_NAME="vector_crm_files";

const STORE="files";


function openDb(){


return new Promise((resolve,reject)=>{


const request =
indexedDB.open(
DB_NAME,
1
);



request.onupgradeneeded=()=>{


let db=request.result;


if(!db.objectStoreNames.contains(STORE))

db.createObjectStore(
STORE,
{
keyPath:'id',
autoIncrement:true
}
);


};



request.onsuccess=()=>resolve(
request.result
);


request.onerror=()=>reject(
request.error
);



});


}




async function addFile(file){


const db=await openDb();


const tx=db.transaction(
STORE,
"readwrite"
);


tx.objectStore(STORE)
.add({

name:file.name,

type:file.type,

blob:file,

date:new Date()

});


}




async function refreshFiles(){


const db=await openDb();


const tx=
db.transaction(
STORE,
"readonly"
);


const req=
tx.objectStore(STORE)
.getAll();


req.onsuccess=()=>{


const files=req.result;


const box=
document.getElementById(
"documentsList"
);



if(!box)return;



box.innerHTML =
files.map(f=>`

<div>

${f.name}

</div>

`).join('');


};


}





document
.getElementById('fileInput')
?.addEventListener(
'change',
async e=>{

for(
const f of e.target.files
)

await addFile(f);


refreshFiles();


});




// ---------- BUTTONS ----------


document
.getElementById('saveCarBtn')
?.addEventListener(
'click',
saveCar
);



// ---------- START ----------


loadCar();

refreshFiles();
