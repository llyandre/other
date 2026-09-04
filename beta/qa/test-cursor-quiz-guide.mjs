import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const cursorJs=read("assets/js/cursor-v35.js");
const cursorCss=read("assets/css/cursor-v35.css");
const guideJs=read("assets/js/quiz-guide.js");
const guideCss=read("assets/css/quiz-guide.css");
const visualCss=read("assets/css/visual-v38.css");
const app=read("assets/js/app.js");
const html=read("index.html");
const sw=read("sw.js");
const guideMascot=fs.readFileSync(path.join(root,"assets/generated/seal-guide-clean-v39u1.png"));

for(const file of ["assets/js/cursor-v35.js","assets/js/quiz-guide.js"]){
  const result=spawnSync(process.execPath,["--input-type=module","--check"],{input:read(file),encoding:"utf8"});
  assert(result.status===0,`Syntax error ${file}: ${result.stderr||result.stdout}`);
}

assert(html.includes('./assets/css/cursor-v35.css')&&html.includes('./assets/js/cursor-v35.js'),"Cursor maskot v36 belum dimuat");
assert(html.includes('./assets/css/quiz-guide.css')&&html.includes('./assets/js/quiz-guide.js'),"Panduan kuis belum dimuat");
for(const state of ["normal","happy","hover","click","loading","typing","success","sleep"]){
  const cursor=fs.readFileSync(path.join(root,`assets/cursor/seal-cursor-${state}-v38.png`));
  assert(cursor.subarray(1,4).toString()==="PNG"&&cursor.readUInt32BE(16)===56&&cursor.readUInt32BE(20)===56&&cursor[25]===6,`Aset cursor ${state} tidak valid`);
}
assert(guideMascot.length>2000&&guideMascot.readUInt32BE(16)===512&&guideMascot.readUInt32BE(20)===512&&guideMascot[25]===6,"Maskot panduan transparan 512px tidak valid");
assert(/\(any-hover:hover\) and \(any-pointer:fine\)/.test(cursorCss),"Cursor tidak mendukung mouse presisi pada desktop");
assert(!/min-width:1181px/.test(cursorJs)&&!/@media \(min-width:1181px\) and \(any-hover:hover\)/.test(cursorCss),"Cursor masih mati pada jendela desktop sempit");
assert(cursorJs.includes('wikaru_cursor_github_v38'),"Preferensi cursor v36 belum tersedia");
assert(cursorJs.includes('enabled = saved !== "0"'),"Cursor v36 belum aktif otomatis dengan pilihan opt-out");
assert(/new URL\(`\.\.\/cursor\/seal-cursor-\$\{name\}-v38\.png`, import\.meta\.url\)/.test(cursorJs),"Path cursor v38 belum aman untuk subfolder GitHub Pages");
assert(/cursor:url\("\.\.\/cursor\/seal-cursor-normal-v38\.png"\)/.test(cursorCss),"CSS cursor v38 belum memakai URL asset langsung");
assert(/image\.onload/.test(cursorJs)&&/ready/.test(cursorJs),"Cursor v36 dapat aktif sebelum aset siap");
assert(/\(any-hover:none\)/.test(cursorCss),"Fallback perangkat sentuh murni hilang");
assert(/prefers-reduced-motion:reduce/.test(cursorCss)&&/prefers-reduced-motion:reduce/.test(guideCss),"Reduced-motion belum lengkap");
assert(!/setInterval\s*\(/.test(cursorJs),"Cursor memakai polling interval");
for(const mode of ["study","listening","shadowing","speed","number","marker","duration","counter"]){
  assert(new RegExp(`${mode}:\\{title:`).test(guideJs),`Panduan ${mode} belum tersedia`);
}
assert(/setAttribute\("role","dialog"\)/.test(guideJs)&&/aria-modal/.test(guideJs)&&/trapFocus/.test(guideJs),"Aksesibilitas dialog panduan kuis tidak lengkap");
assert(/wikaru_quiz_guide_/.test(guideJs)&&/identity\(\)/.test(guideJs),"Status first-use belum dipisahkan per pengguna");
assert(/wkQuizHelpButton/.test(guideJs),"Tombol membuka ulang panduan kuis hilang");
assert(/wkQuizHelpSlot/.test(guideJs)&&/position:static/.test(guideCss),"Tombol petunjuk masih mengambang di atas kontrol kuis");
assert(guideJs.includes("assets/generated/seal-guide-clean-v39u1.png?v=20260903-v39u1"),"Panduan kuis belum memakai maskot transparan v38");
assert(/grid-template-columns:100px minmax\(0,1fr\)/.test(visualCss)&&/wk-quiz-guide-heading-copy/.test(visualCss),"Header panduan belum memisahkan mascot dari area judul");
assert((app.match(/wikaru:quiz-started/g)||[]).length>=5,"Semua keluarga kuis belum mengirim event mulai");
for(const mode of ["number","marker","duration","counter"]){
  assert(new RegExp(`mode:\"${mode}\"`).test(app),`Event kuis ${mode} belum diberi identitas mode`);
}
assert(sw.includes("wikaru-static-v39u1-20260903"),"Cache aset v39 belum aktif");
assert(sw.includes("CURSOR_STATES")&&sw.includes("MASCOT_EXPRESSIONS")&&sw.includes("seal-${expression}-v38.png"),"Aset v38 belum tersedia offline");

console.log(JSON.stringify({
  status:"PASS",
  cursorExpressions:8,
  quizGuideTypes:8,
  firstUsePerUser:true,
  replayHelp:true,
  desktopOnly:true,
  defaultDesktop:true,
  userOptOut:true,
  viewportIndependent:true,
  touchFallback:true,
  transparentMascot:true,
  helpButtonDocked:true,
  pollingIntervals:0
}));
