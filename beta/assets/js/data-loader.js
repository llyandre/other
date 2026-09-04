const VOCABULARY=[];
const manifestUrl=new URL("../../data/manifest.json",import.meta.url);
const referenceUrl=new URL("../../data/reference-static.json",import.meta.url);
let manifest=null,referenceStatic=null,initializePromise=null,orderIndex=new Map();
const loadedChapters=new Set(),chapterRequests=new Map();

async function requestJson(url){
  const response=await fetch(url,{credentials:"same-origin"});
  if(!response.ok) throw new Error(`HTTP ${response.status} untuk ${url.pathname}`);
  return response.json();
}
function chapterNumbers(label=""){
  const values=[...String(label).matchAll(/\d+/g)].map(match=>Number(match[0]));
  if(values.length===2){const[start,end]=values;return Array.from({length:Math.max(0,end-start+1)},(_,index)=>start+index)}
  return values.length===1?[values[0]]:[];
}
function storage(){return window.WIKARU_STORAGE||window.localStorage}
function addVocabulary(items){
  const known=new Set(VOCABULARY.map(item=>String(item?.id||"")));
  for(const item of items||[]){const id=String(item?.id||"");if(!id||known.has(id))continue;VOCABULARY.push(item);known.add(id)}
  VOCABULARY.sort((a,b)=>(orderIndex.get(String(a?.id||""))??Number.MAX_SAFE_INTEGER)-(orderIndex.get(String(b?.id||""))??Number.MAX_SAFE_INTEGER));
  window.__WIKARU_VOCABULARY=VOCABULARY;
}
async function loadChapter(number){
  const chapter=Number(number);
  if(!Number.isInteger(chapter)||chapter<1||chapter>50)return[];
  if(loadedChapters.has(chapter))return VOCABULARY.filter(item=>Number(item.chapterNumber)===chapter);
  if(chapterRequests.has(chapter))return chapterRequests.get(chapter);
  const request=(async()=>{
    const file=manifest?.chapterFiles?.[chapter];if(!file)throw new Error(`Berkas Bab ${chapter} tidak terdaftar`);
    const items=await requestJson(new URL(`../../data/${file}`,import.meta.url));
    if(!Array.isArray(items))throw new Error(`Format data Bab ${chapter} tidak valid`);
    addVocabulary(items);loadedChapters.add(chapter);
    document.dispatchEvent(new CustomEvent("wikaru:chapter-loaded",{detail:{chapter,count:items.length}}));
    return items;
  })().finally(()=>chapterRequests.delete(chapter));
  chapterRequests.set(chapter,request);return request;
}
async function loadChapters(numbers){
  const queue=[...new Set((numbers||[]).map(Number).filter(number=>Number.isInteger(number)&&number>=1&&number<=50))];
  let cursor=0;const workers=Array.from({length:Math.min(4,queue.length)},async()=>{while(cursor<queue.length)await loadChapter(queue[cursor++])});
  await Promise.all(workers);return VOCABULARY.filter(item=>queue.includes(Number(item.chapterNumber)));
}
async function initialize(){
  if(initializePromise)return initializePromise;
  initializePromise=(async()=>{
    [manifest,referenceStatic]=await Promise.all([requestJson(manifestUrl),requestJson(referenceUrl)]);
    orderIndex=new Map((manifest.itemOrder||[]).map((id,index)=>[String(id),index]));
    if(manifest.extrasFile)addVocabulary(await requestJson(new URL(`../../data/${manifest.extrasFile}`,import.meta.url)));
    let saved=null;try{saved=JSON.parse(storage().getItem("minna_bab23_settings")||"null")}catch(_){ }
    const requested=chapterNumbers(saved?.chapter||"Bab 31");
    await loadChapters([...new Set([31,...(requested.length?requested:[31])])]);
    window.WIKARU_DATA=WIKARU_DATA;return WIKARU_DATA;
  })();return initializePromise;
}
async function loadSelection(setup={}){await initialize();const numbers=chapterNumbers(setup.chapter);return loadChapters(numbers.length?numbers:[31])}
function normalizeCategory(value=""){const raw=String(value||"").trim();return raw.toLowerCase()==="kata-kata referensi dan informasi"?"Kata-Kata Referensi dan Informasi":raw}
function catalogRows(book,category){const normalized=normalizeCategory(category);return(manifest?.catalog||[]).filter(row=>(!book||row.book===book)&&(!normalized||normalizeCategory(row.materialCategory)===normalized))}
function books(additional=[]){const values=[];for(const value of[...(manifest?.books||[]),...(additional||[])])if(value&&!values.includes(value))values.push(value);return values}
function materialsFor(book){const values=[];for(const row of catalogRows(book))if(row.materialCategory&&!values.includes(normalizeCategory(row.materialCategory)))values.push(normalizeCategory(row.materialCategory));return values}
function chaptersFor(book,category){return[...new Set(catalogRows(book,category).map(row=>Number(row.chapterNumber)))].filter(Number.isFinite).sort((a,b)=>a-b)}
function staticValue(name){return referenceStatic?.values?.[name]??null}
function liveDataset(name){
  const ids=()=>referenceStatic?.datasets?.[name]||[];
  const current=()=>{const byId=new Map(VOCABULARY.map(item=>[String(item?.id||""),item]));return ids().map(id=>byId.get(String(id))).filter(Boolean)};
  return new Proxy([],{get(_target,property){const data=current();if(property===Symbol.iterator)return data[Symbol.iterator].bind(data);const value=Reflect.get(data,property);return typeof value==="function"?value.bind(data):value},has(_target,property){return property in current()},ownKeys(){return Reflect.ownKeys(current())},getOwnPropertyDescriptor(_target,property){return Object.getOwnPropertyDescriptor(current(),property)||{configurable:true,enumerable:false,writable:false,value:undefined}}});
}
function isChapterLoaded(number){return loadedChapters.has(Number(number))}
function registerServiceWorker(){if(!("serviceWorker" in navigator)||!/^https?:$/.test(location.protocol))return;window.addEventListener("load",()=>navigator.serviceWorker.register(new URL("../../sw.js",import.meta.url)).catch(error=>console.info("Cache offline tidak aktif:",error?.message||error)),{once:true})}
const WIKARU_DATA={initialize,loadChapter,loadChapters,loadSelection,books,materialsFor,chaptersFor,staticValue,liveDataset,isChapterLoaded,registerServiceWorker,get manifest(){return manifest},get loadedChapters(){return[...loadedChapters].sort((a,b)=>a-b)}};
export{WIKARU_DATA,VOCABULARY};
