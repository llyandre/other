import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"assets/js/app.js"),"utf8");
const enhancements=fs.readFileSync(path.join(root,"assets/js/enhancements.js"),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const id of ["homePage","materialPage","quizPage","resultPage","setupModal","quizSettingsModal","userDropdown","userMenuBtn","questionCountSelect","startQuizFromSettings"]){
  assert(new RegExp(`\\bid=["']${id}["']`).test(html),`Elemen inti hilang: ${id}`);
}
for(const value of ["5","10","20","50","all"]){
  assert(new RegExp(`<option\\s+value=["']${value}["']`).test(html),`Pilihan jumlah soal hilang: ${value}`);
}
assert(/\$\("#startQuizFromSettings"\)\.onclick=startQuiz/.test(app),"Tombol mulai kuis tidak terhubung");
assert(/function\s+startQuiz\s*\(\)/.test(app),"Fungsi mulai kuis hilang");
assert(/function\s+openQuizSettings\s*\(\)/.test(app),"Fungsi pengaturan kuis hilang");
assert(/function\s+showPage\s*\(/.test(app),"Router halaman hilang");
assert(/speechSynthesis|webkitSpeechRecognition|SpeechRecognition/.test(app),"Fitur audio/speech hilang");
assert(/storeKey\+"_favorites"/.test(app),"Persistence favorit hilang");
assert(/storeKey\+"_history"/.test(app),"Persistence riwayat hilang");
assert(/storeKey\+"_settings"/.test(app),"Persistence pengaturan hilang");
assert(/storeKey\+"_lang"/.test(app),"Persistence bahasa hilang");
assert(/data-theme/.test(app)&&/theme-is-changing/.test(app),"Tema dan transisinya hilang");
assert(/event\?\.stopImmediatePropagation\(\)/.test(enhancements),"Perbaikan konflik menu profil hilang");
assert(/addEventListener\("keydown"/.test(app)||/addEventListener\('keydown'/.test(app),"Dukungan keyboard hilang");

console.log(JSON.stringify({
  status:"PASS",
  corePages:4,
  setupModal:true,
  profileMenu:true,
  quizSettings:true,
  questionCounts:[5,10,20,50,"all"],
  quizStartWired:true,
  audioSpeech:true,
  persistence:["settings","language","favorites","history"],
  themeTransition:true,
  keyboardSupport:true
}));
