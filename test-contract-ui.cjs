const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{value:'test',textContent:'',disabled:false});return elements.get(id);};
get('contractForm').reportValidity=()=>true;get('contractForm').elements={namedItem:get};
let fail=false,empty=false,downloaded=0;
const ctx={console,Blob,car:{},carId:'1',window:{},setTimeout:()=>{},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},document:{getElementById:get,createElement:()=>({click(){downloaded++;},remove(){}}),body:{appendChild(){}}},contractValues:(car,settings)=>settings,makeContract:async()=>new Blob(['test']),fetch:async()=>({ok:true,json:async()=>({})}),loadHistory:async()=>{},db:{from:()=>({update:settings=>({eq:()=>({select:()=>({single:async()=>fail?{error:{message:'denied'}}:empty?{data:null}:{data:settings}})})}),insert:async()=>({error:null})})}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('contracts.js','utf8'),ctx);
(async()=>{
 fail=true;await ctx.generateContract({preventDefault(){}});assert.equal(downloaded,0);assert.match(get('contractMessage').textContent,/denied/);assert.equal(get('contractFields').disabled,false);
 fail=false;empty=true;await ctx.generateContract({preventDefault(){}});assert.equal(downloaded,0);assert.match(get('contractMessage').textContent,/не подтвердила/);
 empty=false;await ctx.generateContract({preventDefault(){}});assert.equal(downloaded,1);assert.equal(ctx.car.contract_details.contract_number,'test');assert.match(get('contractMessage').textContent,/Реквизиты сохранены/);
 console.log('PASS: failed/empty save blocks download and preserves form; successful save starts download.');
})().catch(error=>{console.error(error);process.exitCode=1;});
