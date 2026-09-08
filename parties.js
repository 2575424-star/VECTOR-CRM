// Stable field names are shared by storage and future contract templates.
const PARTY_FIELDS = [
 {key:"full_name",label:"ФИО полностью",max:200,wide:true},
 {key:"birth_date",label:"Дата рождения",type:"date"},
 {key:"birth_place",label:"Место рождения",max:300},
 {key:"citizenship",label:"Гражданство",max:100},
 {key:"document_type",label:"Тип документа (паспорт, ID-карта)",max:80},
 {key:"passport_series",label:"Серия паспорта",max:30},
 {key:"passport_number",label:"Номер паспорта / ID",max:50},
 {key:"personal_number",label:"ПИН / персональный номер (если есть)",max:50},
 {key:"passport_issued_at",label:"Дата выдачи",type:"date"},
 {key:"passport_issued_by",label:"Кем выдан паспорт",max:500,wide:true},
 {key:"passport_department_code",label:"Код подразделения (если есть)",max:30},
 {key:"registration_address",label:"Адрес регистрации",max:1000,wide:true},
 {key:"phone",label:"Телефон",type:"tel",max:50},
 {key:"email",label:"Электронная почта",type:"email",max:254}
];
const PARTY_ROLES = {seller:"Продавец",buyer:"Покупатель"};
const partyState = {};
function normalizeParty(source) {
 const result={};
 for(const field of PARTY_FIELDS) result[field.key]=typeof source?.[field.key]==="string"?source[field.key].trim():"";
 return result;
}
function readPartyForm(form) {
 const result={};
 for(const field of PARTY_FIELDS) result[field.key]=form.elements.namedItem(field.key).value;
 return normalizeParty(result);
}
function fillPartyForm(form,data) {
 for(const field of PARTY_FIELDS) form.elements.namedItem(field.key).value=data[field.key]||"";
}
function partyDirty(role) {
 const state=partyState[role];
 return !!state && JSON.stringify(readPartyForm(state.form))!==JSON.stringify(state.saved);
}
function initParties(vehicle) {
 const root=document.getElementById("partiesForms");root.replaceChildren();
 for(const [role,title] of Object.entries(PARTY_ROLES)) {
  const form=document.createElement("form");form.className="party-form";form.autocomplete="off";
  const heading=document.createElement("h3");heading.textContent=title;form.appendChild(heading);
  const fieldset=document.createElement("fieldset");fieldset.className="party-fields";
  const legend=document.createElement("legend");legend.className="party-sr-only";legend.textContent="Данные: "+title;fieldset.appendChild(legend);
  for(const field of PARTY_FIELDS) {
   const label=document.createElement("label");label.textContent=field.label;
   if(field.wide)label.className="party-wide";
   const input=document.createElement("input");input.type=field.type||"text";input.name=field.key;
   input.id=role+"_"+field.key;label.htmlFor=input.id;
   if(field.max)input.maxLength=field.max;
   // Passport numbers remain strings, including leading zeros and letters.
   label.appendChild(input);fieldset.appendChild(label);
  }
  form.appendChild(fieldset);
  const message=document.createElement("p");message.className="party-message";message.setAttribute("role","status");message.setAttribute("aria-live","polite");
  const actions=document.createElement("div");actions.className="party-actions";
  const save=document.createElement("button");save.type="submit";save.className="primary-btn";save.textContent="Сохранить";
  const cancel=document.createElement("button");cancel.type="button";cancel.className="ghost-btn";cancel.textContent="Отменить изменения";
  actions.appendChild(save);actions.appendChild(cancel);form.appendChild(message);form.appendChild(actions);root.appendChild(form);
  const state=partyState[role]={form,fieldset,message,save,cancel,saved:normalizeParty(vehicle[role]),saving:false};
  fillPartyForm(form,state.saved);save.disabled=true;cancel.disabled=true;
  if(role==="seller")initSellerPassport(form);
  form.addEventListener("input",()=>{
   const dirty=partyDirty(role);save.disabled=cancel.disabled=!dirty;
   message.textContent=dirty?"Есть несохранённые изменения.":"";
  });
  cancel.onclick=()=>{fillPartyForm(form,state.saved);save.disabled=cancel.disabled=true;message.textContent="Изменения отменены.";};
  form.addEventListener("submit",async event=>{event.preventDefault();await saveParty(role);});
 }
 document.getElementById("partiesTab").onclick=()=>document.getElementById("partiesSection").scrollIntoView({behavior:"smooth",block:"start"});
}
async function saveParty(role) {
 const state=partyState[role];
 if(!state||state.saving||!partyDirty(role)||!state.form.reportValidity())return;
 if(!carId||!car){state.message.textContent="Дождитесь загрузки автомобиля.";return;}
 const values=readPartyForm(state.form);
 state.saving=true;state.fieldset.disabled=state.save.disabled=state.cancel.disabled=true;
 state.message.textContent="Сохранение…";
 try {
  // Only update this party; do not overwrite the vehicle or the other party.
  // Read back the row so an RLS-filtered update cannot report false success.
  const {data,error}=await db.from("cars").update({[role]:values}).eq("id",carId).select(role).single();
  if(error)throw error;
  if(!data||!data[role])throw new Error("База не подтвердила сохранение.");
  state.saved=normalizeParty(data[role]);car[role]=state.saved;fillPartyForm(state.form,state.saved);
  state.message.textContent="Сохранено.";
  try {
   const log=await db.from("car_history").insert({car_id:String(carId),action:"Обновлены данные: "+PARTY_ROLES[role],details:"Данные участника сделки сохранены."});
   if(log.error)throw log.error;
   await loadHistory();
  } catch(error) {state.message.textContent="Данные сохранены. Не удалось обновить историю: "+(error.message||String(error));}
 } catch(error) {
  state.message.textContent="Не удалось сохранить: "+(error.message||String(error))+". Введённые данные остаются в форме — попробуйте ещё раз.";
 } finally {
  state.saving=false;state.fieldset.disabled=false;
  state.save.disabled=state.cancel.disabled=!partyDirty(role);
 }
}
window.addEventListener("beforeunload",event=>{
 if(Object.keys(PARTY_ROLES).some(role=>partyState[role]?.saving||partyDirty(role))){event.preventDefault();event.returnValue="";}
});
// Adapter for the next stage: generation uses saved data, never unsaved inputs.
function buildContractPartyData(vehicle) {
 const values={};
 for(const role of Object.keys(PARTY_ROLES)) {
  const party=normalizeParty(vehicle[role]);
  for(const field of PARTY_FIELDS)values[role+"_"+field.key]=party[field.key];
 }
 return values;
}
