const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map();
function node(id) {
 if(elements.has(id)) return elements.get(id);
 const n={id,textContent:'',children:[],style:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},replaceChildren(){this.children=[];},appendChild(x){this.children.push(x);if(x.id)elements.set(x.id,x);},parentNode:{appendChild(x){elements.set(x.id,x);}}};
 elements.set(id,n);return n;
}
let storageError=false,metadataError=false,readError=false,uploads=[],rows=[];
const db={
 storage:{from:()=>({upload:async(path,file)=>{uploads.push(path);return storageError?{error:{message:'Invalid key'}}:{data:{path}};},getPublicUrl:path=>({data:{publicUrl:'https://example.test/'+path}})})},
 from(table){return {
  insert:async row=>{if(table==='car_files'){if(metadataError)return {error:{message:'metadata denied'}};rows.push(row);}return {error:null};},
  select(){let filters={};const result=()=>readError?{error:{message:'read denied'}}:{data:table==='car_files'?rows.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v)):[]};const query={eq(k,v){filters[k]=v;return query},order(){return query},limit(){return query},then(resolve,reject){return Promise.resolve(result()).then(resolve,reject)}};return query;}
 }}
};
const ctx={supabase:{createClient:()=>db},URLSearchParams,location:{search:'?id=123'},document:{getElementById:node,createElement:()=>node(Math.random())},crypto:require('node:crypto').webcrypto,Intl,Date,setTimeout,console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('documents.js','utf8'),ctx);vm.runInContext(fs.readFileSync('car.js','utf8').replace(/initDocuments\(\);loadCar\(\);\s*$/,''),ctx);vm.runInContext('car={id:123};',ctx);
async function upload(file){ctx.file=file;await vm.runInContext('uploadFiles([file],"photo")',ctx);}
(async()=>{
 const photo={name:'Фото машины 東京.jpg',size:100,type:'image/jpeg'};
 await upload(photo);assert.equal(rows.length,1);assert.match(uploads[0],/^uploads\/[a-z0-9-]+\.jpg$/);assert.equal(rows[0].name,photo.name);
 await vm.runInContext('loadFiles()',ctx);assert.equal(node('photos').children.length,1);
 metadataError=true;const second={...photo};await upload(second);assert.equal(rows.length,1);assert.match(node('fileNotice').textContent,/metadata denied/);
 const before=uploads.length;metadataError=false;await upload(second);assert.equal(uploads.length,before);assert.equal(rows.length,2);
 storageError=true;await upload({...photo});assert.equal(rows.length,2);assert.match(node('fileNotice').textContent,/Invalid key/);assert.match(node('fileNotice').textContent,/Сохранено: 0/);
 storageError=false;ctx.doc={name:'<img onerror=alert(1)>.pdf',size:100,type:'application/pdf'};
 await vm.runInContext('uploadFiles([doc],"document",{category:"purchase",comment:"Инвойс"})',ctx);
assert.equal(rows[2].category,'purchase');assert.equal(rows[2].comment,'Инвойс');
 node('documentFilter').value='purchase';await vm.runInContext('loadFiles()',ctx);assert.equal(node('documents').children.length,1);assert.equal(node('documents').children[0].children[0].textContent,ctx.doc.name);
 assert.equal(vm.runInContext('documentCategory({})',ctx),'other');
 assert.equal(vm.runInContext('documentPreviewKind({mime_type:"image/svg+xml"})',ctx),'download');
 assert.equal(vm.runInContext('documentPreviewKind({mime_type:"application/pdf"})',ctx),'pdf');
 readError=true;await vm.runInContext('loadFiles()',ctx);assert.match(node('fileNotice').textContent,/read denied/);assert.equal(node('photoInput').disabled,false);
 console.log('PASS: Document metadata/category/filter/legacy fallback/safe names/preview formats;  Unicode filename, persisted gallery reload, metadata retry without reupload, storage error, read error.');
})().catch(e=>{console.error(e);process.exitCode=1});

