import fs from "node:fs/promises";
import path from "node:path";
import sharp from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const root=path.resolve(import.meta.dirname,"..");
const out=path.join(root,"output","previews","v33");
await fs.mkdir(out,{recursive:true});
const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[char]));
const text=(x,y,value,size=18,weight=700,fill="#172747",anchor="start")=>`<text x="${x}" y="${y}" font-family="'Noto Sans JP','DejaVu Sans',Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
const cloud=(x,y,scale=1,opacity=.92)=>`<g transform="translate(${x} ${y}) scale(${scale})" opacity="${opacity}"><rect x="0" y="28" width="116" height="34" rx="17" fill="#fff"/><circle cx="35" cy="30" r="28" fill="#fff"/><circle cx="75" cy="23" r="34" fill="#fff"/></g>`;
const scene=(x,y,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})"><circle cx="190" cy="54" r="48" fill="#FFD86F"/><circle cx="190" cy="54" r="62" fill="none" stroke="#FFD86F" stroke-opacity=".18" stroke-width="16"/>${cloud(70,70,.84,.9)}${cloud(154,128,.62,.72)}<rect x="0" y="20" width="64" height="64" rx="18" fill="#fff" opacity=".16" stroke="#fff" stroke-opacity=".35"/><text x="32" y="64" font-family="'DejaVu Sans',Arial,sans-serif" font-size="30" font-weight="800" fill="#fff" text-anchor="middle">A</text><rect x="58" y="130" width="56" height="56" rx="17" fill="#F7B18A" opacity=".2"/><text x="86" y="166" font-family="'DejaVu Sans',Arial,sans-serif" font-size="20" font-weight="800" fill="#fff" text-anchor="middle">JP</text></g>`;

function nav(x,y,w,compact=false){
  return `<rect x="${x}" y="${y}" width="${w}" height="62" rx="18" fill="#fff" stroke="#DCE4EF"/><rect x="${x+18}" y="${y+13}" width="36" height="36" rx="12" fill="#243B73"/>${text(x+36,y+39,"W",20,900,"#fff","middle")}${text(x+66,y+35,"Wikaru",compact?16:19,850)}${compact?"":`${text(x+w-310,y+35,"Beranda",12,800,"#284989")}${text(x+w-230,y+35,"Materi",12,700,"#66758C")}${text(x+w-158,y+35,"Belajar",12,700,"#66758C")}`}<circle cx="${x+w-28}" cy="${y+31}" r="16" fill="#F1F4F9"/>`;
}

function continueCard(x,y,w,h,scale=1){
  const contentWidth=w*.56;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="#284787"/><circle cx="${x+w-40}" cy="${y+h+18}" r="130" fill="#fff" opacity=".05"/>${text(x+24,y+32,"▣  LANJUTKAN BELAJAR",10*scale,850,"#DCE7FF")}<rect x="${x+24}" y="${y+50}" width="${Math.min(contentWidth,390)}" height="22" rx="11" fill="#fff" opacity=".12"/>${text(x+24,y+105,"Minna no Nihongo I",11*scale,650,"#BFCDED")}${text(x+24,y+137,"Bab 12 · Materi Umum",22*scale,850,"#fff")}${text(x+24,y+164,"Lanjutkan kartu terakhir dan dengarkan pelafalannya.",10*scale,600,"#CBD7F1")}<rect x="${x+24}" y="${y+h-84}" width="${Math.min(contentWidth,360)}" height="7" rx="4" fill="#fff" opacity=".16"/><rect x="${x+24}" y="${y+h-84}" width="${Math.min(contentWidth,360)*.42}" height="7" rx="4" fill="#8DCDBB"/><rect x="${x+24}" y="${y+h-58}" width="132" height="38" rx="13" fill="#fff"/>${text(x+90,y+h-33,"Mulai Belajar",11*scale,850,"#284787","middle")}${scene(x+w-242,y+34,.72*scale)}`;
}

function smallCard(x,y,w,h,title,value,tint="#F6F8FC"){
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${tint}" stroke="#DEE6F1"/>${text(x+18,y+31,title,10,750,"#6A7890")}${text(x+18,y+66,value,20,850,"#172747")}<rect x="${x+18}" y="${y+h-28}" width="${w-36}" height="6" rx="3" fill="#E5EAF2"/><rect x="${x+18}" y="${y+h-28}" width="${(w-36)*.46}" height="6" rx="3" fill="#5278C2"/>`;
}

const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1080" viewBox="0 0 1800 1080">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F7F9FC"/><stop offset="1" stop-color="#EAF1FA"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#233E70" flood-opacity=".12"/></filter></defs>
<rect width="1800" height="1080" fill="url(#bg)"/>
<rect x="42" y="32" width="1716" height="104" rx="28" fill="#fff" filter="url(#shadow)"/><rect x="70" y="56" width="56" height="56" rx="18" fill="#284787"/>${text(98,95,"W",32,900,"#FFF1C9","middle")}${text(150,76,"Beranda v33 · Scene Awan Awal",30,850)}${text(150,108,"Tidak ada maskot dashboard; matahari, awan, dan kana tetap tampil di semua kategori.",15,600,"#687791")}
${text(48,174,"Desktop · 1440 px",15,800,"#71809A")}${text(1052,174,"iPad · 820 px",15,800,"#71809A")}${text(1510,174,"Mobile · 390 px",15,800,"#71809A")}
<g filter="url(#shadow)"><rect x="42" y="194" width="974" height="816" rx="28" fill="#F8FAFD"/><rect x="1042" y="194" width="438" height="816" rx="28" fill="#F8FAFD"/><rect x="1500" y="194" width="258" height="816" rx="28" fill="#F8FAFD"/></g>
${nav(58,210,942)}${text(74,316,"Selamat datang di Wikaru!",26,850)}${text(74,342,"Pilih aktivitas singkat dan lanjutkan progresmu hari ini.",12,600,"#687791")}${continueCard(74,372,586,334,1)}${smallCard(680,372,304,156,"KOSAKATA HARI INI","tetsudaimasu","#F4F7FC")}${smallCard(680,724,304,128,"TARGET HARI INI","7 / 15","#FFF9E9")}<rect x="74" y="724" width="586" height="128" rx="20" fill="#fff" stroke="#DEE6F1"/>${text(96,755,"Ringkasan belajar",12,800)}${text(96,800,"7/15",23,850,"#284989")}${text(210,800,"42 kata",23,850,"#284989")}${text(370,800,"88%",23,850,"#284989")}${text(96,824,"Target",10,650,"#71809A")}${text(210,824,"Dipelajari",10,650,"#71809A")}${text(370,824,"Akurasi",10,650,"#71809A")}<rect x="74" y="870" width="910" height="112" rx="20" fill="#fff" stroke="#DEE6F1"/>${text(96,902,"Akses cepat",12,800)}${["Materi","Pusat Belajar","Review","Hasil"].map((label,index)=>`<rect x="${96+index*206}" y="922" width="182" height="42" rx="14" fill="#EFF3FA"/>${text(187+index*206,948,label,11,750,"#284989","middle")}`).join("")}
${nav(1058,210,406,true)}${text(1074,302,"Selamat datang!",23,850)}${text(1074,328,"Belajar singkat, progres tetap jalan.",11,600,"#687791")}${continueCard(1074,354,374,300,.88)}${smallCard(1074,670,180,134,"TARGET","7 / 15")}${smallCard(1268,670,180,134,"AKURASI","88%","#F2F8F5")}<rect x="1074" y="822" width="374" height="158" rx="20" fill="#fff" stroke="#DEE6F1"/>${text(1094,854,"Kosakata hari ini",11,800)}${text(1094,898,"tetsudaimasu",21,850,"#172747")}${text(1094,928,"membantu",11,650,"#687791")}<rect x="1094" y="944" width="132" height="30" rx="12" fill="#EEF3FC"/>${text(1160,964,"Dengarkan",10,800,"#284989","middle")}
${nav(1512,210,234,true)}${text(1518,298,"Selamat datang!",20,850)}${text(1518,322,"Lanjutkan progres hari ini.",10,600,"#687791")}<rect x="1512" y="344" width="234" height="344" rx="22" fill="#284787"/>${text(1528,374,"LANJUTKAN BELAJAR",9,850,"#DCE7FF")}${scene(1580,370,.56)}${text(1528,495,"Minna no Nihongo I",9,650,"#BFCDED")}${text(1528,525,"Bab 12",20,850,"#fff")}${text(1528,548,"Materi Umum",11,700,"#DCE7FF")}<rect x="1528" y="584" width="202" height="6" rx="3" fill="#fff" opacity=".18"/><rect x="1528" y="584" width="84" height="6" rx="3" fill="#8DCDBB"/><rect x="1528" y="612" width="202" height="48" rx="14" fill="#fff"/>${text(1629,642,"Mulai Belajar",11,850,"#284787","middle")}${smallCard(1512,704,234,118,"TARGET HARI INI","7 / 15","#FFF9E9")}${smallCard(1512,838,234,118,"KOSAKATA HARI INI","tetsudaimasu","#F4F7FC")}
<rect x="42" y="1028" width="1716" height="28" rx="14" fill="#284787"/>${text(900,1048,"✓ Scene awan aktif di desktop, iPad, dan mobile   ·   ✓ Tidak ada maskot di beranda",13,800,"#fff","middle")}
</svg>`;

const file=path.join(out,"Wikaru_v33_Home_Cloud_Responsive_Preview.jpg");
await sharp(Buffer.from(svg)).flatten({background:"#F7F9FC"}).jpeg({quality:93,chromaSubsampling:"4:4:4"}).toFile(file);
console.log(JSON.stringify({status:"PASS",file}));
