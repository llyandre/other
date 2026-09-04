import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath,pathToFileURL } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(await fs.readFile(path.join(root,"data/manifest.json"),"utf8"));
const memory=new Map([["minna_bab23_settings",JSON.stringify({book:"Minna no Nihongo II (2nd Edition)",materialCategory:"Materi Umum",chapter:"Bab 31"})]]);
const storage={getItem:key=>memory.has(String(key))?memory.get(String(key)):null,setItem:(key,value)=>memory.set(String(key),String(value)),removeItem:key=>memory.delete(String(key)),clear:()=>memory.clear()};
globalThis.window={WIKARU_STORAGE:storage,localStorage:storage,addEventListener(){}};
globalThis.document={dispatchEvent(){}};
globalThis.CustomEvent=class{constructor(type,options={}){this.type=type;this.detail=options.detail}};
Object.defineProperty(globalThis,"navigator",{value:{},configurable:true});
Object.defineProperty(globalThis,"location",{value:{protocol:"http:"},configurable:true});
globalThis.fetch=async input=>{
  const url=input instanceof URL?input:new URL(String(input));
  const bytes=await fs.readFile(fileURLToPath(url));
  return {ok:true,status:200,json:async()=>JSON.parse(bytes.toString("utf8"))};
};

const moduleUrl=pathToFileURL(path.join(root,"assets/js/data-loader.js"));
moduleUrl.searchParams.set("qa",Date.now());
const {WIKARU_DATA,VOCABULARY}=await import(moduleUrl.href);
await WIKARU_DATA.initialize();
if(WIKARU_DATA.loadedChapters.join(",")!=="31")throw new Error(`Initial load bukan hanya Bab 31: ${WIKARU_DATA.loadedChapters}`);
if(VOCABULARY.length!==manifest.chapterCounts["31"])throw new Error("Jumlah initial vocabulary salah");
if(WIKARU_DATA.books().length<2)throw new Error("Katalog buku tidak lengkap");
if(!WIKARU_DATA.materialsFor("Minna no Nihongo II (2nd Edition)").includes("Materi Umum"))throw new Error("Katalog materi tidak lengkap");
if(!WIKARU_DATA.chaptersFor("Minna no Nihongo II (2nd Edition)","Materi Umum").includes(50))throw new Error("Katalog bab tidak lengkap");

const sameChapter=await Promise.all([WIKARU_DATA.loadChapter(31),WIKARU_DATA.loadChapter(31),WIKARU_DATA.loadChapter(31)]);
if(sameChapter.some(rows=>rows.length!==manifest.chapterCounts["31"]))throw new Error("Dedup request bab gagal");
await WIKARU_DATA.loadSelection({chapter:"Bab 1-50"});
if(WIKARU_DATA.loadedChapters.length!==50)throw new Error("Rentang Bab 1-50 tidak memuat seluruh data");
if(VOCABULARY.length!==manifest.totalItems)throw new Error("Total vocabulary setelah rentang penuh salah");
if(new Set(VOCABULARY.map(item=>String(item.id))).size!==manifest.totalItems)throw new Error("Data duplikat setelah lazy load");
if(!VOCABULARY.every((item,index)=>String(item.id)===String(manifest.itemOrder[index])))throw new Error("Urutan vocabulary berubah setelah lazy load");

console.log(JSON.stringify({status:"PASS",initialChapter:31,initialItems:manifest.chapterCounts["31"],rangeChapters:50,totalItems:VOCABULARY.length,requestDeduplication:true,globalOrderPreserved:true}));
