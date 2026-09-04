import fs from "node:fs/promises";
import path from "node:path";
import sharp from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const root=path.resolve(import.meta.dirname,"..");
const sessionRoot=path.resolve(root,"../..");
const previews=path.join(root,"output","previews");
const uploads=path.join(sessionRoot,"upload");
const output=path.join(previews,"Wikaru_v34_Before_After_Verification.png");
const beforeQuiz=path.join(uploads,"スクリーンショット 2026-09-02 120823.png");
const beforeLogin=path.join(uploads,"スクリーンショット 2026-09-02 120853.png");
const beforeGuide=path.join(uploads,"スクリーンショット 2026-09-02 120830.png");
const beforeNotice=path.join(uploads,"スクリーンショット 2026-09-02 120752.png");
const afterQuiz=path.join(previews,"Wikaru_v34_Quiz_Responsive_Preview.png");
const afterAssets=path.join(previews,"Wikaru_v34_Assets_Production_Preview.png");

await Promise.all([beforeQuiz,beforeLogin,beforeGuide,beforeNotice,afterQuiz,afterAssets].map(file=>fs.access(file)));
const contain=async(file,width,height)=>sharp(file).resize({width,height,fit:"contain",background:"#F7F9FC"}).png().toBuffer();
const [oldQuiz,oldLogin,oldGuide,oldNotice,newQuiz,newAssets]=await Promise.all([
  contain(beforeQuiz,570,300),contain(beforeLogin,270,310),contain(beforeGuide,270,200),contain(beforeNotice,570,226),contain(afterQuiz,1190,680),contain(afterAssets,1190,586)
]);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[char]));
const tx=(x,y,value,size=20,weight=700,fill="#142344",anchor="start")=>`<text x="${x}" y="${y}" font-family="DejaVu Sans,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
const shell=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1480" viewBox="0 0 1920 1480">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F6F9FD"/><stop offset="1" stop-color="#EAF1F9"/></linearGradient><filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#18345F" flood-opacity=".12"/></filter></defs>
  <rect width="1920" height="1480" fill="url(#bg)"/>
  <rect x="42" y="30" width="1836" height="108" rx="28" fill="#fff" filter="url(#s)"/>
  <rect x="70" y="55" width="58" height="58" rx="18" fill="#284787"/>${tx(99,96,"W",32,900,"#FFF1C9","middle")}
  ${tx(154,76,"Wikaru v34 · Bukti Koreksi Build Aktual",30,850)}${tx(154,108,"Kiri: screenshot website lama dari pengguna. Kanan: render verifikasi dari asset dan aturan layout dalam paket v34.",15,600,"#687791")}
  <rect x="42" y="166" width="624" height="1256" rx="30" fill="#fff" filter="url(#s)"/><rect x="690" y="166" width="1188" height="1256" rx="30" fill="#fff" filter="url(#s)"/>
  <rect x="68" y="190" width="190" height="40" rx="20" fill="#FFF0EE"/>${tx(163,217,"SEBELUM · UI LAMA",14,850,"#B33A35","middle")}
  ${tx(68,268,"1. Kuis masih memakai layout lama",16,850)}${tx(68,592,"2. Ikon wilayah lama",16,850)}${tx(368,592,"3. Maskot menimpa judul",16,850)}${tx(68,932,"4. Kotak latar maskot",16,850)}
  <rect x="716" y="190" width="196" height="40" rx="20" fill="#EAF5ED"/>${tx(814,217,"SESUDAH · BUILD v34",14,850,"#367349","middle")}
  ${tx(716,268,"Layout kuis responsif yang diterapkan ke DOM produksi",17,850)}${tx(716,892,"Aset produksi: wilayah, Kotoba Marks, cursor berpanah, maskot transparan",17,850)}
  <rect x="68" y="1228" width="570" height="156" rx="22" fill="#F6F8FC" stroke="#D8E2EF"/>
  ${tx(92,1264,"Yang diperbaiki",16,850)}${tx(92,1294,"• cache CSS/JS lama dibersihkan setelah deploy",13,650,"#5F6E86")}${tx(92,1321,"• ikon referensi, maskot transparan, dan posisi aman",13,650,"#5F6E86")}${tx(92,1348,"• desktop, iPad, mobile, cursor, dan copywriting diuji",13,650,"#5F6E86")}
  <rect x="716" y="1370" width="1136" height="28" rx="14" fill="#284787"/>${tx(1284,1390,"BERANDA AWAN AWAL TETAP DIPERTAHANKAN",12,850,"#fff","middle")}
</svg>`);

await sharp(shell).composite([
  {input:oldQuiz,left:68,top:282},{input:oldLogin,left:68,top:612},{input:oldGuide,left:368,top:612},{input:oldNotice,left:68,top:952},
  {input:newQuiz,left:698,top:282},{input:newAssets,left:698,top:910}
]).png({compressionLevel:9,palette:false}).toFile(output);
console.log(JSON.stringify({status:"PASS",output}));
