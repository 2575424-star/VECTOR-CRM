const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let fail=false,missing=false,historyFail=false,updates=[],logs=[],stored={seller:{},buyer:{full_name:'Тестовый покупатель'}};
const db={from(table){return {
 update(payload){updates.push(payload);return {eq(key,id){assert.equal(key,'id');assert.equal(id,'car-1');return {select(role){return {async single(){
  if(fail)return {error:{message:'permission denied'}};
  if(missing)return {data:null};
  stored={...stored,...payload};return {data:{[role]:stored[role]}};
 }}}}}};},
 async insert(row){logs.push(row);return historyFail?{error:{message:'history unavailable'}}:{error:null};}
}}};
const ctx={db,carId:'car-1',car:{...stored},loadHistory:async()=>{},window:{addEventListener(){}},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('parties.js','utf8'),ctx);
vm.runInContext(`
function setup(role,data={}) {
 const controls={};for(const f of PARTY_FIELDS)controls[f.key]={value:data[f.key]||''};
 partyState[role]={form:{elements:{namedItem:key=>controls[key]},reportValidity:()=>true},fieldset:{},message:{},save:{},cancel:{},saved:normalizeParty(data),saving:false};
 return controls;
}
sellerControls=setup('seller');buyerControls=setup('buyer',{full_name:'Тестовый покупатель'});
`,ctx);
const run=code=>vm.runInContext(code,ctx);
(async()=>{
 run("sellerControls.full_name.value='  Тестовый продавец  ';sellerControls.passport_number.value='001234';sellerControls.passport_series.value='AB';sellerControls.birth_date.value='1990-01-02';");
 await ctx.saveParty('seller');
 assert.equal(stored.seller.full_name,'Тестовый продавец');assert.equal(stored.seller.passport_number,'001234');assert.equal(stored.seller.passport_series,'AB');
 assert.equal(stored.buyer.full_name,'Тестовый покупатель');assert.deepEqual(Object.keys(updates[0]),['seller']);
 assert.equal(run('partyDirty("seller")'),false);assert.equal(run('partyState.seller.message.textContent'),'Сохранено.');
 assert.ok(!JSON.stringify(logs).includes('001234'));
 const mapping=ctx.buildContractPartyData(stored);assert.equal(mapping.seller_birth_date,'1990-01-02');assert.equal(mapping.buyer_full_name,'Тестовый покупатель');
 run("buyerControls.phone.value='+996 000 00 00 00'");fail=true;
 await ctx.saveParty('buyer');assert.equal(run('partyDirty("buyer")'),true);assert.equal(run('buyerControls.phone.value'),'+996 000 00 00 00');assert.match(run('partyState.buyer.message.textContent'),/permission denied/);assert.equal(run('partyState.buyer.fieldset.disabled'),false);
 fail=false;missing=true;await ctx.saveParty('buyer');assert.match(run('partyState.buyer.message.textContent'),/не подтвердила/);assert.equal(run('partyDirty("buyer")'),true);
 missing=false;historyFail=true;await ctx.saveParty('buyer');assert.equal(stored.buyer.phone,'+996 000 00 00 00');assert.equal(run('partyDirty("buyer")'),false);assert.match(run('partyState.buyer.message.textContent'),/Данные сохранены/);
 assert.equal(ctx.buildContractPartyData({}).seller_passport_number,'');
 console.log('PASS: independent participant saves, exact passport strings, template mapping, failed/empty response preserves input, history failure does not undo save.');
})().catch(error=>{console.error(error);process.exitCode=1;});
