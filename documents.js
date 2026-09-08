const DOCUMENT_CATEGORIES = {
 vehicle: "Автомобиль", purchase: "Покупка", sale: "Продажа",
 payments: "Платежи", parties: "Продавец и покупатель", other: "Прочее"
};
let documentRows = [], selectedDocumentFiles = [], documentPreviewUrl = null, documentPreviewRequest = 0;
function documentCategory(item) { return Object.hasOwn(DOCUMENT_CATEGORIES, item.category) ? item.category : "other"; }
function documentMessage(text) { document.getElementById("documentMessage").textContent = text; }
function makeDocumentButton(text, action) {
 const button = document.createElement("button");
 button.type = "button"; button.className = "ghost-btn"; button.textContent = text; button.onclick = action;
 return button;
}
function initDocuments() {
 const list = document.getElementById("documents");
 const toolbar = document.createElement("div");
 toolbar.className = "documents-toolbar";
 toolbar.innerHTML = '<label>Категория<select id="documentFilter"><option value="">Все документы</option></select></label>';
 toolbar.appendChild(makeDocumentButton("+ Загрузить документы", () => document.getElementById("documentInput").click()));
 list.before(toolbar);
 const message = document.createElement("p");
 message.id = "documentMessage"; message.setAttribute("role", "status");
 list.before(message);
 for (const [value,label] of Object.entries(DOCUMENT_CATEGORIES)) {
  const option = document.createElement("option"); option.value = value; option.textContent = label;
  document.getElementById("documentFilter").appendChild(option);
 }
 document.getElementById("documentFilter").onchange = () => renderDocuments(documentRows);
 const upload = document.createElement("dialog");
 upload.id = "documentUploadDialog"; upload.setAttribute("aria-labelledby", "documentUploadTitle");
 upload.innerHTML = '<form id="documentUploadForm"><h2 id="documentUploadTitle">Загрузить документы</h2><p id="selectedDocumentNames"></p><label>Категория<select id="documentCategory" required></select></label><label>Комментарий<textarea id="documentComment" maxlength="1000" rows="3" placeholder="Например: инвойс от продавца"></textarea></label><p>Выбранная категория и комментарий применятся ко всем выбранным файлам.</p><div class="dialog-actions"><button type="button" id="cancelDocuments" class="ghost-btn">Отмена</button><button type="submit" class="primary-btn">Загрузить</button></div></form>';
 document.body.appendChild(upload);
 for (const [value,label] of Object.entries(DOCUMENT_CATEGORIES)) {
  const option = document.createElement("option"); option.value=value; option.textContent=label;
  document.getElementById("documentCategory").appendChild(option);
 }
 document.getElementById("documentCategory").value="other";
 document.getElementById("cancelDocuments").onclick=()=>upload.close();
 upload.addEventListener("close",()=>{ selectedDocumentFiles=[]; document.getElementById("documentInput").value=""; });
 document.getElementById("documentInput").onchange = e => {
  if (uploadingFiles) return;
  selectedDocumentFiles = [...e.target.files];
  if (!selectedDocumentFiles.length) return;
  document.getElementById("selectedDocumentNames").textContent = selectedDocumentFiles.map(f=>f.name).join("\n");
  document.getElementById("documentComment").value="";
  upload.showModal();
 };
 document.getElementById("documentUploadForm").onsubmit = async e => {
  e.preventDefault();
  if (uploadingFiles || !selectedDocumentFiles.length) return;
  const files=[...selectedDocumentFiles];
  const details={category:document.getElementById("documentCategory").value,comment:document.getElementById("documentComment").value.trim()};
  if (!Object.hasOwn(DOCUMENT_CATEGORIES,details.category)) return;
  upload.close();
  documentMessage("Загрузка документов…");
  try {
   await uploadFiles(files,"document",details);
   documentMessage(document.getElementById("fileNotice")?.textContent || "Загрузка завершена.");
  } catch(error) { documentMessage("Ошибка загрузки: "+error.message); }
 };
 const preview=document.createElement("dialog");
 preview.id="documentPreview"; preview.setAttribute("aria-labelledby","documentPreviewTitle");
 preview.innerHTML='<div class="document-preview-heading"><h2 id="documentPreviewTitle"></h2><button type="button" class="ghost-btn" id="closeDocumentPreview">Закрыть</button></div><div id="documentPreviewBody"></div>';
 document.body.appendChild(preview);
 document.getElementById("closeDocumentPreview").onclick=()=>preview.close();
 preview.addEventListener("close",()=>{
  documentPreviewRequest++;
  document.getElementById("documentPreviewBody").replaceChildren();
  if(documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
  documentPreviewUrl=null;
 });
 const tab=[...document.querySelectorAll(".detail-tabs button")].find(b=>b.textContent.includes("Документы"));
 if(tab) tab.onclick=()=>toolbar.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderDocuments(allFiles) {
 documentRows=allFiles.filter(f=>f.file_type!=="photo");
 const filter=document.getElementById("documentFilter").value;
 const list=document.getElementById("documents");list.replaceChildren();
 const rows=documentRows.filter(f=>!filter||documentCategory(f)===filter);
 if(!rows.length) {
  const empty=document.createElement("p");empty.className="empty";
  empty.textContent=documentRows.length?"В этой категории документов пока нет.":"Документов пока нет. Загрузите первый файл.";
  list.appendChild(empty);return;
 }
 for(const file of rows) {
  const row=document.createElement("article");row.className="document-row";
  const name=document.createElement("strong");name.textContent=file.name;row.appendChild(name);
  const meta=document.createElement("p");
  const timestamp=new Date(file.created_at);
  meta.textContent=DOCUMENT_CATEGORIES[documentCategory(file)]+" · "+(file.created_at&&!Number.isNaN(timestamp.getTime())?timestamp.toLocaleString("ru-RU"):"Дата не указана");
  row.appendChild(meta);
  if(file.comment){const comment=document.createElement("p");comment.textContent=file.comment;row.appendChild(comment);}
  const actions=document.createElement("div");actions.className="document-actions";
  actions.appendChild(makeDocumentButton("Просмотр",()=>previewDocument(file)));
  const download=makeDocumentButton("Скачать",()=>downloadDocument(file,download));
  actions.appendChild(download);row.appendChild(actions);list.appendChild(row);
 }
}
function documentPreviewKind(file) {
 const mime=(file.mime_type||"").toLowerCase();
 if(mime==="application/pdf" || (!mime && /\.pdf$/i.test(file.name)))return "pdf";
 if(["image/jpeg","image/png","image/webp","image/gif","image/avif","image/bmp"].includes(mime))return "image";
 return "download";
}
async function previewDocument(file) {
 const modal=document.getElementById("documentPreview"),body=document.getElementById("documentPreviewBody");
 const request=++documentPreviewRequest;
 if(documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
 documentPreviewUrl=null;
 document.getElementById("documentPreviewTitle").textContent=file.name;
 body.textContent="Загрузка…";if(!modal.open)modal.showModal();
 const kind=documentPreviewKind(file);
 if(kind==="download") {body.textContent="Для этого формата просмотр недоступен. Скачайте файл и откройте его на устройстве.";return;}
 try {
  const {data,error}=await db.storage.from("car-files").download(file.path);
  if(error)throw error;
  if(request!==documentPreviewRequest||!modal.open)return;
  documentPreviewUrl=URL.createObjectURL(data);body.replaceChildren();
  const hint=document.createElement("p");hint.textContent="Если документ не отображается, закройте просмотр и нажмите «Скачать».";body.appendChild(hint);
  if(kind==="image") {
   const img=document.createElement("img");img.src=documentPreviewUrl;img.alt=file.name;
   img.onerror=()=>{img.remove();hint.textContent="Браузер не смог показать изображение. Скачайте файл для просмотра.";};
   body.appendChild(img);
  } else {
   const frame=document.createElement("iframe");frame.title=file.name;
   // Force the PDF content type so browsers use their PDF viewer.
   URL.revokeObjectURL(documentPreviewUrl);
   documentPreviewUrl=URL.createObjectURL(new Blob([data],{type:"application/pdf"}));
   frame.src=documentPreviewUrl;body.appendChild(frame);
  }
 } catch(error){if(request===documentPreviewRequest)body.textContent="Не удалось открыть документ: "+error.message;}
}
async function downloadDocument(file,button) {
 button.disabled=true;
 try{
  const {data,error}=await db.storage.from("car-files").download(file.path);if(error)throw error;
  const url=URL.createObjectURL(data),link=document.createElement("a");
  link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  documentMessage("Файл передан браузеру для скачивания.");
 }catch(error){documentMessage("Не удалось скачать файл: "+error.message);}
 finally{button.disabled=false;}
}
