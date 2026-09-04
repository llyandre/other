import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html"),app=read("assets/js/app.js"),guide=read("assets/js/quiz-guide.js"),question=read("assets/js/question-page-final.js"),enhancements=read("assets/js/enhancements.js");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const production=[html,app,guide,question,enhancements].join("\n");

assert(!/Lanjutkan quiz|saat quiz|mulai quiz/i.test(production),"Ejaan 'kuis' belum konsisten");
assert(!/>Grup \/ Wilayah</.test(html),"Label wilayah masih ambigu");
assert(app.includes('changeCategory:"Ganti wilayah"')&&app.includes('changeCategory:"地域を変更"'),"Nama aksi wilayah belum bilingual");
assert(app.includes('saveStart:"Mulai Latihan"'),"CTA mulai latihan terlalu panjang");
assert(guide.includes('Ketuk atau klik kartu'),"Petunjuk belum ramah sentuh dan mouse");
assert(guide.includes('Sisa waktu setiap kartu selalu terlihat di bagian atas halaman kuis.'),"Petunjuk timer belum mengikuti layout baru");
assert(question.includes('Aktifkan mikrofon untuk menjawab dengan suara.'),"Petunjuk suara belum ringkas");
assert(enhancements.includes('Pilih jawaban yang paling tepat')&&enhancements.includes('最も適切な答えを選びましょう'),"Subjudul kuis belum bilingual");

console.log(JSON.stringify({status:"PASS",scope:"primary UI",languages:["id","ja"],touchFriendly:true,timerCopy:true,voiceCopy:true}));
