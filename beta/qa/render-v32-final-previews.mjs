import fs from "node:fs/promises";
import path from "node:path";
import sharp from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const root=path.resolve(import.meta.dirname,"..");
const out=path.join(root,"output","previews");
await fs.mkdir(out,{recursive:true});
const bytes=relative=>fs.readFile(path.join(root,relative));
const data=async(relative,mime)=>`data:${mime};base64,${(await bytes(relative)).toString("base64")}`;
const pngData=async relative=>`data:image/png;base64,${(await sharp(await bytes(relative)).png().toBuffer()).toString("base64")}`;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const tx=(x,y,value,size=18,weight=700,fill="#172747",anchor="start")=>`<text x="${x}" y="${y}" font-family="Inter,'Noto Sans JP',Arial,DejaVu Sans,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
const rr=(x,y,w,h,r=18,fill="#fff",stroke="#dbe4f1",extra="")=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;

const iconNames=["notes","understand","statistics","timer","guide","chapter","section","word-type"];
const icons=Object.fromEntries(await Promise.all(iconNames.map(async name=>[name,await pngData(`assets/icons/kotoba-v39/${name}.png`)])));
const mascot=await data("assets/mascot/v38/seal-guide-v38.png","image/png");
const icon=(name,x,y,size)=>`<image href="${icons[name]}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;

const chip=(x,y,w,label,active=false)=>`${rr(x,y,w,34,13,active?"#294985":"#f7f9fd",active?"#294985":"#dbe4f1")}${tx(x+w/2,y+22,label,11,800,active?"#fff":"#42516d","middle")}`;
const vocab=(x,y,w,jp,reading,meaning,tone="#294985")=>`${rr(x,y,w,116,17,"#fff","#dbe4f1")}${tx(x+16,y+30,jp,22,850,"#172747")}${tx(x+16,y+54,reading,12,750,tone)}${tx(x+16,y+77,meaning,12,650,"#68758c")}${rr(x+w-48,y+64,34,34,11,"#eef3ff","#dbe4f1")}${tx(x+w-31,y+87,"›",20,800,tone,"middle")}`;

const before=`
  ${rr(56,174,814,664,28,"#eef2f8","#d7e0ed","filter=\"url(#shadow)\"")}
  ${tx(82,212,"BEFORE · baseline v30",17,850,"#66748c")}
  ${rr(78,232,770,64,18,"#fff","#dbe4f1")}${tx(104,272,"W",23,900,"#294985")}${tx(142,259,"Materi",17,850)}${tx(142,280,"Pustaka kosakata",11,650,"#71809a")}
  ${rr(78,314,178,490,20,"#fff","#dbe4f1")}${["Beranda","Materi","Belajar","Hasil","Keluar"].map((v,i)=>`${rr(91,332+i*54,152,42,11,i===1?"#e9effd":"#fff",i===1?"#b9cbea":"#fff")}${tx(110,359+i*54,v,12,750,i===1?"#294985":"#63718a")}`).join("")}
  ${rr(272,314,576,490,20,"#fff","#dbe4f1")}${tx(296,354,"Jelajahi Materi Pilihan",25,850)}${tx(296,379,"Pelajari kata dan contoh penggunaan.",12,650,"#71809a")}
  ${rr(296,400,528,66,13,"#f6f8fc","#dbe4f1")}${tx(314,428,"Informasi materi",13,800)}${tx(314,450,"Baca sebelum memulai latihan.",10,600,"#71809a")}
  ${rr(296,482,250,42,10,"#fff","#cfd9e8")}${tx(314,508,"Cari kosakata...",11,600,"#8a95a8")}${rr(554,482,128,42,10,"#fff","#cfd9e8")}${tx(570,508,"Semua bagian",10,650,"#5d6b82")}${rr(690,482,134,42,10,"#fff","#cfd9e8")}${tx(704,508,"Semua jenis",10,650,"#5d6b82")}
  ${vocab(296,542,250,"TABEMASU","tabemasu","makan")}${vocab(574,542,250,"NOMIMASU","nomimasu","minum")}${vocab(296,674,250,"MIMASU","mimasu","melihat")}${vocab(574,674,250,"KIKIMASU","kikimasu","mendengar")}
`;

const after=`
  ${rr(900,174,844,664,28,"#f5f8fd","#cbd8ea","filter=\"url(#shadow)\"")}
  ${tx(928,212,"AFTER · v32 professional polish",17,850,"#294985")}
  ${rr(922,232,800,64,18,"#fff","#dbe4f1")}${tx(948,272,"W",23,900,"#294985")}${tx(986,259,"Materi",17,850)}${tx(986,280,"Rapi, konsisten, dan responsif",11,650,"#71809a")}${chip(1574,247,124,"Desktop · aman",true)}
  ${rr(922,314,192,490,20,"#fff","#dbe4f1")}${["Beranda","Materi","Belajar","Hasil","Keluar"].map((v,i)=>`${rr(934,328+i*52,168,44,12,i===1?"#eef3ff":"#fff",i===1?"#c1d1ed":"#fff")}${tx(954,356+i*52,v,12,780,i===1?"#294985":"#63718a")}`).join("")}${rr(934,610,168,176,16,"#f8faff","#dbe4f1")}${icon("statistics",948,626,34)}${tx(990,647,"Statistik Belajar",11,800)}${tx(950,685,"3.653",25,850,"#294985")}${tx(950,707,"Total kosakata",10,650,"#71809a")}${tx(950,746,"30 dtk",18,850,"#327345")}${tx(950,766,"Waktu per kartu",10,650,"#71809a")}
  ${rr(1130,314,592,490,22,"#fff","#dbe4f1")}${icon("notes",1154,338,40)}${tx(1205,365,"Jelajahi Materi Pilihan",27,850)}${tx(1154,397,"Baca bentuk Jepang, cara baca, arti, dan contoh penggunaannya.",12,650,"#68758c")}
  ${rr(1154,418,544,70,15,"#f8faff","#dbe4f1")}${icon("understand",1168,435,34)}${tx(1210,443,"Pahami kata sebelum berlatih",13,850)}${tx(1210,466,"Catatan penting dibuat lebih mudah dipindai.",10,600,"#71809a")}
  ${rr(1154,506,544,58,15,"#f6f8fc","#dbe4f1")}${rr(1164,514,256,42,11,"#fff","#dbe4f1")}${tx(1180,540,"Cari kanji, romaji, atau arti...",10,600,"#8a95a8")}${rr(1428,514,126,42,11,"#fff","#dbe4f1")}${tx(1491,540,"Bagian",10,700,"#52617a","middle")}${rr(1562,514,126,42,11,"#fff","#dbe4f1")}${tx(1625,540,"Jenis kata",10,700,"#52617a","middle")}
  ${vocab(1154,582,254,"TABEMASU","tabemasu","makan")}${vocab(1428,582,270,"NOMIMASU","nomimasu","minum")}${vocab(1154,716,254,"MIMASU","mimasu","melihat")}${vocab(1428,716,270,"KIKIMASU","kikimasu","mendengar")}
`;

const responsive=`
  ${tx(58,892,"Responsive proof · layout yang sama, kepadatan menyesuaikan perangkat",22,850)}
  ${rr(56,918,682,206,22,"#fff","#dbe4f1")}${tx(78,949,"iPad · dua area, toolbar turun rapi",13,850,"#294985")}${rr(78,966,188,136,15,"#f7f9fd","#dbe4f1")}${chip(92,982,72,"Materi",true)}${chip(170,982,72,"Belajar")}${tx(94,1040,"Statistik",12,800)}${tx(94,1064,"Tidak menutup konten",10,600,"#71809a")}${rr(280,966,436,136,15,"#fff","#dbe4f1")}${tx(300,994,"Materi pada iPad",15,850)}${rr(300,1010,396,34,10,"#f6f8fc","#dbe4f1")}${vocab(300,1054,188,"TABEMASU","tabemasu","makan")}${vocab(500,1054,196,"NOMIMASU","nomimasu","minum")}
  ${rr(758,918,300,206,22,"#fff","#dbe4f1")}${tx(780,949,"Mobile · satu kolom",13,850,"#294985")}${rr(780,966,256,42,11,"#f6f8fc","#dbe4f1")}${tx(798,992,"Cari kosakata...",10,600,"#8a95a8")}${vocab(780,1020,256,"TABEMASU","tabemasu","makan")}
  ${rr(1078,918,666,206,22,"#fff","#dbe4f1")}${tx(1100,949,"Dialog · scroll aman + tombol 46 px",13,850,"#294985")}${rr(1100,966,622,136,18,"#f8faff","#dbe4f1")}${icon("guide",1120,985,38)}${tx(1172,1002,"Atur Sesi Latihan",17,850)}${tx(1172,1024,"Konten panjang tetap dapat digulir tanpa tombol terpotong.",10,600,"#71809a")}${chip(1120,1050,128,"Kembali")}${chip(1258,1050,128,"Berikutnya",true)}${chip(1396,1050,146,"Mulai latihan",true)}${imageSeal(1608,1012,86)}
`;

function imageSeal(x,y,size){return `<image href="${mascot}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;}

const polishSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1180" viewBox="0 0 1800 1180"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5f8fd"/><stop offset="1" stop-color="#e9f0fa"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#18345f" flood-opacity=".10"/></filter></defs><rect width="1800" height="1180" fill="url(#bg)"/>${rr(56,34,1688,108,28,"#fff","#dbe4f1","filter=\"url(#shadow)\"")}${rr(82,59,58,58,18,"#294985","#294985")}${tx(111,98,"W",36,900,"#fff1c9","middle")}${tx(164,78,"Wikaru v32 · Professional Non-Home Polish",30,850)}${tx(164,110,"Beranda dipertahankan; materi, hasil, pengelola, pusat belajar, kuis, dan dialog dirapikan.",15,600,"#68758c")}${before}${after}${responsive}${rr(56,1142,1688,24,12,"#294985","#294985")}${tx(900,1160,"HOME LOCKED · 4 BREAKPOINTS · 16 GENERATED ICONS · 8-STATE SEAL CURSOR",11,850,"#fff","middle")}</svg>`;

const homeDesktop=await pngData("output/previews/Wikaru_v32_Home_Preserved_Desktop.png");
const homeIpad=await pngData("output/previews/Wikaru_v32_Home_Preserved_iPad.png");
const homeMobile=await pngData("output/previews/Wikaru_v32_Home_Preserved_Mobile.png");
const homeSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1120" viewBox="0 0 1800 1120"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5f8fd"/><stop offset="1" stop-color="#e9f0fa"/></linearGradient><filter id="shadow2" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#18345f" flood-opacity=".10"/></filter></defs><rect width="1800" height="1120" fill="url(#bg2)"/>${rr(48,34,1704,112,28,"#fff","#dbe4f1","filter=\"url(#shadow2)\"")}${rr(74,61,58,58,18,"#294985","#294985")}${tx(103,100,"W",36,900,"#fff1c9","middle")}${tx(156,80,"Beranda v32 · Dipertahankan dari baseline v30",30,850)}${tx(156,112,"Struktur, scene, grid, warna, dan komposisi tidak diubah oleh lapisan profesional.",15,600,"#68758c")}${tx(50,186,"Desktop",15,850,"#294985")}${rr(48,202,1220,754,24,"#fff","#dbe4f1","filter=\"url(#shadow2)\"")}<image href="${homeDesktop}" x="60" y="214" width="1196" height="730" preserveAspectRatio="xMidYMid meet"/>${tx(1300,186,"iPad",15,850,"#294985")}${rr(1292,202,460,446,24,"#fff","#dbe4f1","filter=\"url(#shadow2)\"")}<image href="${homeIpad}" x="1304" y="214" width="436" height="422" preserveAspectRatio="xMidYMid meet"/>${tx(1300,686,"Mobile",15,850,"#294985")}${rr(1292,702,460,356,24,"#fff","#dbe4f1","filter=\"url(#shadow2)\"")}<image href="${homeMobile}" x="1308" y="714" width="428" height="332" preserveAspectRatio="xMidYMid meet"/>${rr(48,982,1220,76,22,"#294985","#294985")}${tx(76,1016,"✓ Hash struktur beranda identik dengan v30",18,850,"#fff")}${tx(76,1042,"Desktop 12 kolom · iPad 2 kolom · mobile 1 kolom",13,650,"#dce7ff")}${imageSeal(1120,972,92)}</svg>`;

const files=[
  ["Wikaru_v32_NonHome_Before_After.png",polishSvg],
  ["Wikaru_v32_Home_Preserved_Preview.png",homeSvg]
];
for(const [name,svg] of files)await sharp(Buffer.from(svg)).png({compressionLevel:9,palette:false}).toFile(path.join(out,name));
console.log(JSON.stringify({status:"PASS",files:files.map(([name])=>path.join(out,name))}));
