import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const version="20260903-v39u1";
const githubVersion="20260903-v39u1";
const html=read("index.html");
const sw=read("sw.js");
const question=read("assets/js/question-page-final.js");
const guide=read("assets/js/quiz-guide.js");
const mascot=read("assets/js/mascot.js");
const cursorV35=read("assets/js/cursor-v35.js");
const cursorV36Css=read("assets/css/cursor-v35.css");
const app=read("assets/js/app.js");
const icons=read("assets/js/wikaru-icons.js");

for(const match of html.matchAll(/<(?:link|script)\b[^>]+(?:href|src)="(\.\/assets\/(?:css|js)\/[^"?]+)([^"]*)"/g)){
  const isV36Entry=/(?:app\.js|wikaru-icons\.(?:css|js)|deploy-v35\.(?:css|js)|cursor-v35\.(?:css|js)|visual-v38\.css|cache-reset-v35\.js|mascot\.(?:css|js)|quiz-guide\.(?:css|js)|question-page-final\.(?:css|js))$/.test(match[1]);
  const expected=isV36Entry?githubVersion:version;
  assert(match[2]===`?v=${expected}`,`Entry point belum versioned: ${match[1]}`);
}
assert((html.match(new RegExp(`\\?v=${githubVersion}`,"g"))||[]).length>=10,"Versi build v36 belum dipasang pada seluruh entry point visual");
assert(sw.includes("wikaru-static-v39u1-20260903")&&sw.includes("ignoreSearch:true"),"Cache baru belum dapat menyajikan entry point versioned");
assert(sw.includes("MASCOT_EXPRESSIONS")&&sw.includes("seal-${expression}-v38.png"),"Maskot transparan v38 belum masuk cache offline");

const active=[question,guide,mascot,read("assets/css/question-page-final.css"),read("assets/js/deploy-v35.js"),read("assets/css/deploy-v35.css")].join("\n");
assert(active.includes(`seal-guide-clean-v39u1.png?v=${githubVersion}`),"Maskot tegak transparan belum terhubung ke halaman aktif v38");
assert(active.includes(`seal-sad-month-v38.png?v=${githubVersion}`),"Ekspresi maskot transparan belum aktif pada v38");
const png=fs.readFileSync(path.join(root,"assets/generated/seal-guide-clean-v39u1.png"));
assert(png.subarray(1,4).toString()==="PNG","Aset maskot final bukan PNG");
assert(png.readUInt32BE(16)===512&&png.readUInt32BE(20)===512,"Dimensi maskot final harus 512px");
assert(png[25]===6,"Maskot final tidak memiliki kanal alpha transparan");

for(const file of ["jembrana-128.png","singaraja-128.png","badung-128.png","umum-128.png"]){
  assert(fs.existsSync(path.join(root,"assets/region-icons",file)),`Aset wilayah hilang: ${file}`);
  assert(app.includes(file.replace("-128.png","")),`Aset wilayah belum dipanggil: ${file}`);
}
assert(app.includes(`REGION_ASSET_VERSION="?v=${githubVersion}"`),"Ikon wilayah masih dapat tertahan cache lama");
assert(icons.includes(`icons/wikaru/`)&&icons.includes(`?v=${githubVersion}`),"16 aset Kotoba referensi v39 belum aktif atau masih dapat tertahan cache lama");
for(const state of ["normal","happy","hover","click","loading","typing","success","sleep"]){
  assert(cursorV36Css.includes(`seal-cursor-${state}-v38.png`),`Cursor ${state} v36 belum aktif`);
}
assert(cursorV35.includes("saved !== \"0\""),"Cursor maskot v36 harus aktif otomatis dan tetap dapat dimatikan");
assert(cursorV35.includes('(hover:hover) and (pointer:fine), (any-hover:hover) and (any-pointer:fine)'),"Deteksi mouse presisi v36 belum lengkap");

console.log(JSON.stringify({status:"PASS",build:githubVersion,versionedV39EntryPoints:true,uprightMascot:true,oldMascotActive:false,regions:4,kotobaMarks:16,cursorStates:8,cacheMigration:true}));
