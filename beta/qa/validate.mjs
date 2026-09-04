import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const sha=value=>crypto.createHash("sha256").update(value).digest("hex");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const preservation=JSON.parse(read("qa/preservation.json"));
const manifest=JSON.parse(read("data/manifest.json"));
const referenceStatic=JSON.parse(read("data/reference-static.json"));
const embeddedAssets=JSON.parse(read("data/embedded-assets.json"));
assert(manifest.sourceSha256===preservation.sourceSha256,"Identitas sumber tidak konsisten");
assert(Object.keys(manifest.chapterFiles).length===50,"Manifest tidak berisi 50 bab");

const orderIndex=new Map((manifest.itemOrder||[]).map((id,index)=>[String(id),index]));
const allItems=[];
const ids=new Set();
for(let chapter=1;chapter<=50;chapter+=1){
  const file=manifest.chapterFiles[String(chapter)];
  assert(file&&fs.existsSync(path.join(root,"data",file)),`Data Bab ${chapter} tidak ditemukan`);
  const rows=JSON.parse(read(`data/${file}`));
  assert(rows.length===manifest.chapterCounts[String(chapter)],`Jumlah Bab ${chapter} berubah`);
  for(const item of rows){
    const id=String(item?.id||"");
    assert(id,`Item tanpa ID pada Bab ${chapter}`);
    assert(!ids.has(id),`ID duplikat: ${id}`);
    assert(Number(item.chapterNumber)===chapter,`chapterNumber salah: ${id}`);
    assert(String(item.indonesia||"").trim(),`Arti Indonesia kosong: ${id}`);
    assert(String(item.kanji||item.kana||item.displayTerm||"").trim(),`Teks Jepang kosong: ${id}`);
    ids.add(id);allItems.push(item);
  }
}
assert(allItems.length===manifest.totalItems,"Total materi berubah");
assert(ids.size===manifest.itemOrder.length,"Daftar urutan materi tidak lengkap");
allItems.sort((a,b)=>(orderIndex.get(String(a.id))??Number.MAX_SAFE_INTEGER)-(orderIndex.get(String(b.id))??Number.MAX_SAFE_INTEGER));
assert(allItems.every((item,index)=>String(item.id)===String(manifest.itemOrder[index])),"Urutan global materi berubah");
assert(sha(JSON.stringify(allItems))===preservation.transformedVocabularySha256,"Isi materi tidak identik dengan sumber");
assert(sha(JSON.stringify(referenceStatic))===preservation.transformedReferenceSha256,"Data referensi berubah");

for(const [file,metadata] of Object.entries(embeddedAssets)){
  const target=path.join(root,"assets/media",file);
  assert(fs.existsSync(target),`Aset tertanam hilang: ${file}`);
  const bytes=fs.readFileSync(target);
  assert(bytes.length===metadata.bytes,`Ukuran aset berubah: ${file}`);
  assert(sha(bytes)===metadata.sha256,`Hash aset berubah: ${file}`);
}
const serializedData=JSON.stringify({allItems,referenceStatic});
assert(!serializedData.includes("data:image/"),"Gambar base64 masih membebani data awal");
for(const match of serializedData.matchAll(/\.\/assets\/media\/([^"\\]+)/g)){
  assert(fs.existsSync(path.join(root,"assets/media",match[1])),`Referensi aset lokal rusak: ${match[1]}`);
}

const html=read("index.html");
assert(!/<style\b/i.test(html),"Masih ada blok CSS inline");
assert(!/<script\b(?![^>]*\bsrc=)/i.test(html),"Masih ada blok JavaScript inline");
assert(/<meta[^>]+name=["']viewport["'][^>]+width=device-width/i.test(html),"Viewport responsive hilang");
assert(!/<button\b(?![^>]*\btype=)/i.test(html),"Ada tombol tanpa type");
assert(!/<img\b(?![^>]*\balt=)/i.test(html),"Ada gambar tanpa alt");
assert(!/<a\b[^>]*target=["']_blank["'](?![^>]*rel=["'][^"']*noopener)/i.test(html),"Link tab baru tanpa noopener");
const htmlIds=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]);
assert(htmlIds.length===new Set(htmlIds).size,"Ada ID HTML duplikat");

for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  const value=match[1];
  if(/^(?:https?:|data:|blob:|#)/.test(value))continue;
  const clean=value.replace(/[?#].*$/,'');
  assert(fs.existsSync(path.resolve(root,clean)),`Path lokal tidak ditemukan: ${value}`);
}

const canonicalShell=value=>value
  .replace(/\?v=20260902-final33/g,"")
  .replace(/\?v=20260902-actual34/g,"")
  .replace(/\?v=20260903-v39u1/g,"")
  .replace(/\s*<meta name="wikaru-build"[^>]+>/g,"")
  .replace(/<script src="\.\/assets\/js\/cache-reset-v35\.js"><\/script>/g,"")
  .replace(/<script src="\.\/assets\/js\/critical\.js"><\/script>/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/app\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/asset-system\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/mascot\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/quiz-guide\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/app-management\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/learning-hub\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/wikaru-icons\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/account-offline\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/question-page-final\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/professional-v32\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/professional-v33\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/deploy-v35\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/cursor-v35\.css">/g,"")
  .replace(/<link rel="stylesheet" href="\.\/assets\/css\/visual-v38\.css">/g,"")
  .replace(/\s*<link rel="apple-touch-icon"[^>]+>/g,"")
  .replace(/<link rel="manifest" href="\.\/manifest\.webmanifest">/g,"")
  .replace(/<script src="\.\/assets\/js\/enhancements\.js"><\/script>/g,"")
  .replace(/<script src="\.\/assets\/js\/wikaru-icons\.js"><\/script>/g,"")
  .replace(/<script src="\.\/assets\/js\/runtime-config\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/account-offline\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/question-page-final\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/app\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/profile-assets\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/mascot\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/quiz-guide\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/app-management\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/learning-hub\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/experience-v33\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/deploy-v35\.js"><\/script>/g,"")
  .replace(/<script type="module" src="\.\/assets\/js\/cursor-v35\.js"><\/script>/g,"")
  .replace(/\s*<meta name="application-name"[^>]+>[\s\S]*?<meta name="twitter:image"[^>]+>/g,"")
  .replace(/\s*<a class="wk-skip-link" href="#mainContent">[\s\S]*?<\/a>/g,"")
  .replace(/<main class="app" id="mainContent" tabindex="-1">/g,'<main class="app">')
  .replace(/\s*<section class="wk-admin-insights" id="wkAdminInsights"[\s\S]*?<\/section>(?=\s*<div class="admin-report-card)/g,"")
  .replace(/\s*<!-- WIKARU SMART LEARNING: HOME START -->[\s\S]*?<!-- WIKARU SMART LEARNING: HOME END -->/g,"")
  .replace(/\s*<!-- WIKARU SMART LEARNING: PAGE START -->[\s\S]*?<!-- WIKARU SMART LEARNING: PAGE END -->/g,"")
  .replace(/\s*<!-- WIKARU SMART LEARNING: FOCUS START -->[\s\S]*?<!-- WIKARU SMART LEARNING: FOCUS END -->/g,"")
  .replace(/\s*<button class="drop-item" id="mascotGuideBtn"[\s\S]*?<\/button>/g,"")
  .replace(/\s*<button class="drop-item" id="mascotEyeReminderBtn"[\s\S]*?<\/button>/g,"")
  .replace(/<img class="home-scene-asset[^>]+>/g,"")
  .replace(/home-theme-scene home-asset-scene/g,"home-theme-scene")
  .replace(/ https:\/\/challenges\.cloudflare\.com/g,"")
  .replace(/aria-label="Progres kuis"/g,'aria-label="Progres quiz"')
  .replace(/<strong data-i18n="speechFeature">Jawab dengan Suara<\/strong><p id="speechHelp">Aktifkan mikrofon untuk menjawab dengan suara\.<\/p>/g,'<strong data-i18n="speechFeature">Fungsi Bicara</strong><p id="speechHelp">Jawab dengan suara untuk pengalaman belajar.</p>')
  .replace(/aria-label="Aktifkan atau nonaktifkan mikrofon"/g,'aria-label="Mic toggle"')
  .replace(/aria-label="Tutup pengaturan kuis"/g,'aria-label="Tutup pengaturan quiz"')
  .replace(/<h2 id="loginModalTitle" data-i18n="loginTitle">Masuk sebagai Peserta<\/h2>/g,'<h2 id="loginModalTitle" data-i18n="loginTitle">Masuk Peserta</h2>')
  .replace(/<span data-i18n="changeCategory">Ganti wilayah<\/span>/g,'<span data-i18n="changeCategory">Ganti kategori</span>')
  .replace(/<strong class="field-label" id="groupLabel"><i class="fa-solid fa-location-dot"><\/i>Wilayah peserta<\/strong>/g,'<strong class="field-label" id="groupLabel"><i class="fa-solid fa-location-dot"></i>Grup / Wilayah</strong>')
  .replace(/<p class="field-help" id="groupHelp">Pilih wilayah agar hasil latihan tersimpan pada kelompok yang tepat\.<\/p>/g,'<p class="field-help" id="groupHelp">Pilih wilayah peserta untuk menyimpan laporan latihan.</p>')
  .replace(/<button type="button" class="btn" id="nextQuizSetting">Berikutnya<\/button>/g,'<button type="button" class="btn" id="nextQuizSetting">Lanjut</button>')
  .replace(/<button type="button" class="btn hidden" id="startQuizFromSettings" data-i18n="saveStart">Mulai Latihan<\/button>/g,'<button type="button" class="btn hidden" id="startQuizFromSettings" data-i18n="saveStart">Terapkan dan Mulai Latihan</button>')
  .replace(/\s+/g," ").trim();
assert(sha(canonicalShell(html))===preservation.supabaseStaticShellSha256,"Struktur HTML berubah di luar adaptasi Supabase yang disetujui");

function scanCss(css,file){
  let mode="code",quote="",escaped=false,depth=0,minDepth=0;
  for(let index=0;index<css.length;index+=1){
    const char=css[index],next=css[index+1]||"";
    if(mode==="comment"){if(char==="*"&&next==="/"){mode="code";index+=1}}
    else if(mode==="string"){if(escaped)escaped=false;else if(char==="\\")escaped=true;else if(char===quote)mode="code"}
    else if(char==="/"&&next==="*"){mode="comment";index+=1}
    else if(char==="'"||char==='"'){mode="string";quote=char}
    else if(char==="{")depth+=1;
    else if(char==="}"){depth-=1;minDepth=Math.min(minDepth,depth)}
  }
  assert(mode==="code"&&depth===0&&minDepth>=0,`CSS tidak seimbang: ${file}`);
}
const appCss=read("assets/css/app.css");
scanCss(appCss,"assets/css/app.css");
const assetCss=read("assets/css/asset-system.css");
scanCss(assetCss,"assets/css/asset-system.css");
const mascotCss=read("assets/css/mascot.css");
scanCss(mascotCss,"assets/css/mascot.css");
const quizGuideCss=read("assets/css/quiz-guide.css");
scanCss(quizGuideCss,"assets/css/quiz-guide.css");
const appManagementCss=read("assets/css/app-management.css");
scanCss(appManagementCss,"assets/css/app-management.css");
const learningHubCss=read("assets/css/learning-hub.css");
scanCss(learningHubCss,"assets/css/learning-hub.css");
const wikaruIconsCss=read("assets/css/wikaru-icons.css");
scanCss(wikaruIconsCss,"assets/css/wikaru-icons.css");
const visualV38Css=read("assets/css/visual-v38.css");
scanCss(visualV38Css,"assets/css/visual-v38.css");
const accountOfflineCss=read("assets/css/account-offline.css");
scanCss(accountOfflineCss,"assets/css/account-offline.css");
const questionPageCss=read("assets/css/question-page-final.css");
scanCss(questionPageCss,"assets/css/question-page-final.css");
const professionalCss=read("assets/css/professional-v32.css");
scanCss(professionalCss,"assets/css/professional-v32.css");
const deployCss=read("assets/css/deploy-v35.css");
scanCss(deployCss,"assets/css/deploy-v35.css");
const cursorV35Css=read("assets/css/cursor-v35.css");
scanCss(cursorV35Css,"assets/css/cursor-v35.css");
const cssBodies=appCss.replace(/\/\* source-style: [^*]+\*\/\n/g,"").trim();
assert(sha(cssBodies)===preservation.cssBodiesSha256,"Urutan atau isi CSS berubah");

function checkJavaScript(file,isModule=false){
  const source=read(file);
  const args=isModule?["--input-type=module","--check"]:["--input-type=commonjs","--check"];
  const result=spawnSync(process.execPath,args,{input:source,encoding:"utf8",maxBuffer:16*1024*1024});
  assert(result.status===0,`Syntax error ${file}: ${result.stderr||result.stdout}`);
}
checkJavaScript("assets/js/critical.js");
checkJavaScript("assets/js/enhancements.js");
checkJavaScript("assets/js/data-loader.js",true);
checkJavaScript("assets/js/pdf-reports.js",true);
checkJavaScript("assets/js/supabase-client.js",true);
checkJavaScript("assets/js/app.js",true);
checkJavaScript("assets/js/profile-assets.js",true);
checkJavaScript("assets/js/mascot.js",true);
checkJavaScript("assets/js/deploy-v35.js",true);
checkJavaScript("assets/js/cursor-v35.js",true);
checkJavaScript("assets/js/cache-reset-v35.js");
checkJavaScript("assets/js/quiz-guide.js",true);
checkJavaScript("assets/js/app-management.js",true);
checkJavaScript("assets/js/learning-engine.js",true);
checkJavaScript("assets/js/learning-hub.js",true);
checkJavaScript("assets/js/wikaru-icons.js");
checkJavaScript("assets/js/runtime-config.js");
checkJavaScript("assets/js/account-offline.js");
checkJavaScript("assets/js/question-page-final.js");
checkJavaScript("sw.js");

const criticalBodies=read("assets/js/critical.js").replace(/\/\* source-script: [^*]+\*\/\n/g,"").trim();
const enhancementBodies=read("assets/js/enhancements.js").replace(/\/\* source-script: [^*]+\*\/\n/g,"").trim();
assert(sha(criticalBodies)===preservation.criticalBodiesSha256,"Critical script berubah");
assert(sha(enhancementBodies)===preservation.supabaseEnhancementBodiesSha256,"Enhancement script berubah di luar adaptasi Supabase yang disetujui");
assert(enhancementBodies.includes('event?.stopImmediatePropagation();'),"Konflik handler profil dapat muncul kembali");
assert(enhancementBodies.includes('button.addEventListener("click", toggleUserDropdown, {capture:true});'),"Menu profil belum memakai satu handler capture");
assert(enhancementBodies.includes("const meaningful=Math.abs(nextWidth-lastWidth)>32"),"Menu profil dapat tertutup akibat perubahan scrollbar");
const appJs=read("assets/js/app.js");
assert(appJs.includes("await WIKARU_DATA.initialize()"),"Aplikasi dapat berjalan sebelum data siap");
assert(appJs.includes("await WIKARU_DATA.loadSelection(tempSetup)"),"Pilihan bab tidak menunggu data");
assert(!appJs.includes("wikaru-range-nav"),"Navigator rentang baru mengubah fungsi asli");

const python=process.env.CODEX_PRIMARY_RUNTIME_PYTHON||"python3";
const parserCode=[
  "import json,sys",
  "from lxml import html",
  "p=html.HTMLParser(recover=True)",
  "d=html.parse(sys.argv[1],p)",
  "unnamed=[]",
  "unlabelled=[]",
  "[(unnamed.append(e.get('id')) if not ' '.join(''.join(e.itertext()).split()) and not e.get('aria-label') and not e.get('title') else None) for e in d.xpath('//button')]",
  "[(unlabelled.append(e.get('id')) if e.get('type')!='hidden' and not (e.get('aria-label') or e.get('aria-labelledby') or e.get('title') or (e.get('id') and d.xpath('//label[@for=$x]',x=e.get('id'))) or e.xpath('ancestor::label')) else None) for e in d.xpath('//input|//select|//textarea')]",
  "errors=[{'line':e.line,'level':e.level_name,'message':e.message} for e in p.error_log]",
  "print(json.dumps({'errors':errors,'unnamedButtons':unnamed,'unlabelledControls':unlabelled},ensure_ascii=False))"
].join(";");
const parsed=spawnSync(python,["-c",parserCode,path.join(root,"index.html")],{encoding:"utf8",maxBuffer:8*1024*1024});
assert(parsed.status===0,`Parser HTML gagal: ${parsed.stderr}`);
const parserReport=JSON.parse(parsed.stdout);
assert(!parserReport.errors.some(error=>["ERROR","FATAL"].includes(error.level)),`HTML parser error: ${JSON.stringify(parserReport.errors)}`);
assert(parserReport.unnamedButtons.length===0,`Tombol tanpa nama aksesibel: ${parserReport.unnamedButtons.join(",")}`);
assert(parserReport.unlabelledControls.length===0,`Form tanpa label: ${parserReport.unlabelledControls.join(",")}`);

assert(read("sw.js").includes("wikaru-static-v39u1-20260903"),"Versi cache halaman soal final salah");
assert(read("sw.js").includes("assets/js/data-loader.js"),"Data loader belum masuk cache shell");
assert(read("sw.js").includes("assets/js/pdf-reports.js"),"Generator PDF belum masuk cache shell");
assert(read("sw.js").includes("assets/js/supabase-client.js"),"Klien Supabase belum masuk cache shell");
assert(read("sw.js").includes("assets/js/profile-assets.js"),"Sistem avatar belum masuk cache shell");
assert(read("sw.js").includes("assets/js/mascot.js"),"Sistem maskot belum masuk cache shell");
assert(read("sw.js").includes("assets/js/cursor-v35.js"),"Cursor maskot v38 belum masuk cache shell");
assert(read("sw.js").includes("assets/js/quiz-guide.js"),"Panduan kuis belum masuk cache shell");
assert(read("sw.js").includes("assets/js/app-management.js"),"Manajemen update dan backup belum masuk cache shell");
assert(read("sw.js").includes("CURSOR_STATES")&&read("sw.js").includes("seal-cursor-${state}-v38.png"),"Delapan cursor v38 belum masuk cache shell");
assert(read("sw.js").includes("MASCOT_EXPRESSIONS")&&read("sw.js").includes("seal-${expression}-v38.png"),"Maskot transparan v38 belum masuk cache shell");
assert(!read("assets/js/question-page-final.js").includes("seal-guide-original.webp"),"Halaman soal masih memakai maskot rebah lama");
assert(html.includes("?v=20260903-v39u1"),"Entry point v39 belum diberi versi sehingga cache lama dapat tetap tampil");
for(const preview of ["wikaru-desktop.webp","wikaru-ipad.webp","wikaru-mobile.webp"]){
  assert(read("sw.js").includes(`assets/onboarding/${preview}`),`Screenshot panduan ${preview} belum masuk cache shell`);
}
assert(read("sw.js").includes("assets/css/learning-hub.css"),"CSS pusat belajar belum masuk cache shell");
assert(read("sw.js").includes("assets/js/learning-hub.js"),"Modul pusat belajar belum masuk cache shell");
assert(read("sw.js").includes("assets/js/learning-engine.js"),"Mesin progres belajar belum masuk cache shell");
assert(read("sw.js").includes("assets/css/wikaru-icons.css"),"CSS Kotoba Marks belum masuk cache shell");
assert(read("sw.js").includes("assets/js/wikaru-icons.js"),"Runtime Kotoba Marks belum masuk cache shell");
assert(read("sw.js").includes("assets/css/visual-v38.css"),"Proteksi visual v38 belum masuk cache shell");
assert(read("sw.js").includes("assets/css/account-offline.css"),"CSS sinkronisasi dan timer belum masuk cache shell");
assert(read("sw.js").includes("assets/js/account-offline.js"),"Runtime sinkronisasi dan offline belum masuk cache shell");
assert(read("sw.js").includes("assets/css/question-page-final.css"),"CSS halaman soal final belum masuk cache shell");
assert(read("sw.js").includes("assets/js/question-page-final.js"),"Runtime halaman soal final belum masuk cache shell");
assert(read("sw.js").includes("assets/css/professional-v32.css"),"CSS profesional v32 belum masuk cache shell");
assert(read("sw.js").includes("assets/icons/wikaru/${name}-64.png"),"Ikon Kotoba v39 belum masuk cache shell");
assert(!read("sw.js").includes("assets/horizon/horizon-scene-"),"Aset beranda yang tidak aktif masih membebani precache");
assert(JSON.parse(read("manifest.webmanifest")).start_url==="./","Manifest tidak aman untuk subfolder GitHub Pages");

console.log(JSON.stringify({
  status:"PASS",
  sourceSha256:preservation.sourceSha256,
  staticShellPreserved:true,
  cssBlocksPreserved:preservation.pageStyleBlocks,
  enhancementBlocksPreserved:preservation.enhancementBlocks,
  chapters:50,
  items:allItems.length,
  uniqueIds:ids.size,
  embeddedAssets:Object.keys(embeddedAssets).length,
  htmlParserErrors:parserReport.errors.length,
  duplicateIds:0,
  unnamedButtons:0,
  unlabelledControls:0
}));
