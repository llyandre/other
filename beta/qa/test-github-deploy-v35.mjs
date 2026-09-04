import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const exists=file=>fs.existsSync(path.join(root,file));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const html=read("index.html"),css=read("assets/css/deploy-v35.css"),js=read("assets/js/deploy-v35.js"),cursorCss=read("assets/css/cursor-v35.css"),cursorJs=read("assets/js/cursor-v35.js"),reset=read("assets/js/cache-reset-v35.js"),sw=read("sw-v35.js"),workflow=read(".github/workflows/deploy-pages.yml");

for(const file of ["assets/js/deploy-v35.js","assets/js/cursor-v35.js","assets/js/cache-reset-v35.js","sw.js","sw-v35.js"]){const result=spawnSync(process.execPath,["--check",path.join(root,file)],{encoding:"utf8"});assert(result.status===0,`Syntax error ${file}: ${result.stderr||result.stdout}`)}
assert(html.includes('content="20260903-v39u1"'),"Marker build v39 tidak aktif");
for(const entry of ["assets/js/cache-reset-v35.js","assets/css/deploy-v35.css","assets/css/cursor-v35.css","assets/css/visual-v38.css","assets/js/deploy-v35.js","assets/js/cursor-v35.js"]){assert(html.includes(entry),`Entry point visual v38 hilang: ${entry}`)}
assert(!html.includes("actual-v34.css")&&!html.includes("actual-v34.js"),"Runtime v34 masih aktif dan dapat berebut aset dengan v38");
assert(reset.includes("sw-v35.js")&&reset.includes('updateViaCache:"none"')&&reset.includes("caches.delete"),"Pemutus cache lama belum lengkap");
assert(exists("refresh-v35.html")&&read("refresh-v35.html").includes("getRegistrations")&&read("refresh-v35.html").includes("caches.delete"),"Halaman pemulihan deploy belum tersedia");
assert(JSON.parse(read("version.json")).release==="v39u1","Endpoint versi v39 salah");
assert(exists(".nojekyll"),".nojekyll GitHub Pages hilang");
assert(sw.includes('wikaru-static-v39u1-20260903')&&sw.includes("refresh-v35.html")&&sw.includes("version.json"),"Service worker v39 belum unik");
assert(workflow.includes("Verify Wikaru v39u1 is live")&&workflow.includes("version.json?release=v39u1")&&workflow.includes('"release":"v39u1"'),"Workflow belum memverifikasi hasil deploy v39");
assert(sw.includes("seal-${expression}-v38.png"),"Aset ekspresi maskot v38 belum terhubung");
for(const region of ["jembrana","singaraja","badung","umum"]){
  assert(js.includes(`region-icons/${region}-128.png`)||sw.includes(`"${region}"`),`Aset wilayah v39u1 belum terhubung: ${region}`);
}
assert(js.includes("icons/wikaru/")||sw.includes("icons/wikaru/"),"Icon system Wikaru v39u1 belum terhubung");
assert(css.includes("seal-guide-clean-v39u1.png"),"Maskot kuis transparan v38 belum dipakai CSS produksi");
for(const state of ["normal","happy","hover","click","loading","typing","success","sleep"]){
  const file=`assets/cursor/seal-cursor-${state}-v38.png`;
  const png=fs.readFileSync(path.join(root,file));
  assert(cursorCss.includes(`seal-cursor-${state}-v38.png`)&&png.subarray(1,4).toString()==="PNG"&&png.readUInt32BE(16)===56&&png.readUInt32BE(20)===56,`Cursor ${state} v38 rusak`);
}
assert(cursorJs.includes('const KEY = "wikaru_cursor_github_v38"')&&cursorJs.includes('enabled = saved !== "0"'),"Cursor v38 belum aktif default dengan opt-out");
assert(css.includes("body.quiz-mode .top-nav,body.quiz-mode .bottom-nav{display:none!important}"),"Layout kuis fokus v35 belum aktif");
assert(js.includes("ensureLoginArtwork")&&js.includes("syncQuestionStack")&&js.includes("cleanMascotArtwork"),"Koreksi DOM produksi v35 tidak lengkap");
console.log(JSON.stringify({status:"PASS",release:"v39u1",githubRecovery:true,versionedEntryPoints:6,uniqueAssets:true,cursor:"56px-eight-state",workflowVerification:true}));
