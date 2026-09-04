import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const css=read("assets/css/professional-v32.css");
const html=read("index.html");
const sw=read("sw.js");
const app=read("assets/js/app.js");
const cursor=read("assets/js/cursor-v35.js");

function balancedCss(source){
  const clean=source.replace(/\/\*[\s\S]*?\*\//g,"");
  let depth=0,quote="",escaped=false;
  for(const char of clean){
    if(escaped){escaped=false;continue}
    if(char==="\\"){escaped=true;continue}
    if(quote){if(char===quote)quote="";continue}
    if(char==='"'||char==="'"){quote=char;continue}
    if(char==="{")depth++;
    if(char==="}")depth--;
    if(depth<0)return false;
  }
  return depth===0&&!quote;
}

assert(css.length>15000,"Lapisan polish profesional terlalu kecil atau tidak lengkap");
assert(balancedCss(css),"Kurung atau string CSS profesional tidak seimbang");
assert(!/(#homePage|\.home-|\.top-nav|\.bottom-nav|\.nav-inner)/.test(css),"CSS profesional menyentuh beranda atau navigasi global");

for(const selector of ["#materialPage","#quizPage","#learningPage","#resultPage","#adminPage","#loginModal","#quizSettingsModal","#pdfFilterModal","#detailModal"]){
  assert(css.includes(selector),`Polish belum mencakup ${selector}`);
}

for(const rule of [
  "@media (min-width: 768px) and (max-width: 1180px)",
  "@media (max-width: 767px)",
  "@media (max-width: 389px)",
  "@media (prefers-reduced-motion: reduce)",
  "env(safe-area-inset-bottom)",
  "overflow-x: auto",
  "min-height: 46px"
]) assert(css.includes(rule),`Proteksi responsif hilang: ${rule}`);

const questionIndex=html.indexOf("assets/css/question-page-final.css?v=20260903-v39u1");
const polishIndex=html.indexOf("assets/css/professional-v32.css?v=20260903-v39u1");
assert(questionIndex>=0&&polishIndex>questionIndex,"CSS profesional harus dimuat setelah komposisi halaman kuis");
assert(sw.includes("assets/css/professional-v32.css"),"CSS profesional belum tersedia secara offline");

assert(!app.includes("Ayo belajar lebih giat lagi!"),"Copy hasil yang menghakimi masih aktif");
assert(app.includes("Sedikit lagi, mari perkuat materinya!"),"Copy hasil suportif belum aktif");
const adminUiStart=app.indexOf('const adminUi = state.lang === "ja"');
const adminUiEnd=app.indexOf("const rowsHtml",adminUiStart);
const adminUi=app.slice(adminUiStart,adminUiEnd);
assert(adminUiStart>=0&&adminUiEnd>adminUiStart,"Pemetaan bahasa dashboard pengelola tidak ditemukan");
assert((adminUi.match(/\? \{no:/g)||[]).length===1,"Ternary bahasa dashboard pengelola kembali ganda");

assert(cursor.includes('enabled = saved !== "0"'),"Cursor seal belum aktif secara default");
assert(cursor.includes("fine.matches && !touchFirst"),"Cursor belum dilindungi untuk perangkat sentuh");
assert(cursor.includes("fa-arrow-pointer"),"Kontrol cursor belum memakai penanda panah");

console.log(JSON.stringify({
  status:"PASS",
  release:"wikaru-static-v39u1-20260903",
  polishedPages:["material","quiz","learning","result","admin","dialogs"],
  responsive:["desktop","ipad","mobile","narrow-mobile"],
  homepageSelectorsTouched:0,
  copywriting:"supportive",
  cursor:"desktop-default-on-touch-safe"
}));
