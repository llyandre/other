import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const expected=["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"];
const css=read("assets/css/wikaru-icons.css"),js=read("assets/js/wikaru-icons.js"),app=read("assets/js/app.js"),html=read("index.html"),sw=read("sw.js");
const generatedDir=path.join(root,"assets/icons/wikaru");
const syntax=spawnSync(process.execPath,["--input-type=commonjs","--check"],{input:js,encoding:"utf8"});
assert(syntax.status===0,`Syntax Wikaru Icons gagal: ${syntax.stderr||syntax.stdout}`);
const manifest=JSON.parse(read("assets/icons/wikaru/manifest.json"));
assert(manifest.release==="v39u1"&&manifest.runtime_png_size===64&&manifest.fallback_png_size===32,"Manifest ikon v39u1 tidak valid");
assert(manifest.icons.length===16&&new Set(manifest.icons).size===16,"Jumlah Wikaru Marks harus tepat 16");
for(const name of expected){
  assert(manifest.icons.includes(name),`Wikaru Mark hilang: ${name}`);
  assert(fs.existsSync(path.join(generatedDir,`${name}.svg`)),`SVG hilang: ${name}`);
  for(const size of [64,32]){
    const bytes=fs.readFileSync(path.join(generatedDir,`${name}-${size}.png`));
    assert(bytes.subarray(1,4).toString()==="PNG"&&bytes.readUInt32BE(16)===size&&bytes.readUInt32BE(20)===size&&bytes[25]===6,`PNG transparan rusak: ${name}-${size}`);
  }
}
assert(html.includes("assets/css/wikaru-icons.css")&&html.includes("assets/js/wikaru-icons.js"),"Wikaru icon system belum dimuat");
assert(js.includes('ASSET_BASE = "./assets/icons/wikaru/"')&&js.includes('${key}-64.png'),"Runtime belum memakai PNG 64px canonical");
assert(js.includes("new MutationObserver(schedule)")&&!/setInterval\s*\(/.test(js),"Integrasi icon harus observer-terjadwal tanpa polling");
for(const selector of ["#loginModal .login-icon","#materialPage .content-card > h2","#quizSettingsModal [data-quiz-step]","#setupModal [data-setup-step]","[data-voice-preset]","#micBox .mic-icon","#timerText","#wkQuizHelpButton","#learningPage .wk-learning-head h2","#resultPage .result-head h2","#adminPage .admin-title-row h2","#pdfFilterModal .kana-icon"]){assert(js.includes(selector),`Target semantik belum dipetakan: ${selector}`);}
assert(app.includes("aria-live','off'")&&app.includes("badge.dataset.remaining"),"Timer masih berpotensi mengumumkan nilai berulang");
assert(sw.includes("wikaru-static-v39u1-20260903")&&sw.includes("assets/icons/wikaru/${name}-64.png"),"Aset runtime icon belum tersedia offline");
console.log(JSON.stringify({status:"PASS",wikaruMarks:16,standaloneSVG:16,transparentPNG64:16,transparentPNG32:16,pollingIntervals:0,mutationObservers:1}));
