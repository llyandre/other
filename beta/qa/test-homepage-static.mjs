import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html");
const css=read("assets/css/app.css");
const assetCss=read("assets/css/asset-system.css");
const enhancements=read("assets/js/enhancements.js");
const professionalCss=read("assets/css/professional-v32.css");
const iconRuntime=read("assets/js/wikaru-icons.js");
const iconCss=read("assets/css/wikaru-icons.css");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const sha=value=>crypto.createHash("sha256").update(value).digest("hex");
const finalCss=css.slice(css.indexOf("/* source-style: wikaru-qa-release-fixes-v2 */"));

assert(finalCss.length>1000,"Lapisan responsive final beranda tidak ditemukan");
const homeShellStart=html.indexOf('<header class="top-nav"');
const homeShellEnd=html.indexOf('<section class="page" id="materialPage">');
assert(homeShellStart>=0&&homeShellEnd>homeShellStart,"Batas struktur beranda tidak ditemukan");
const homeShell=html.slice(homeShellStart,homeShellEnd);
const canonicalHomeShell=homeShell.replace('<main class="app" id="mainContent" tabindex="-1">','<main class="app">');
assert(sha(canonicalHomeShell)==="04db0871f62c025f5704d300920cbe326e4788873ec7a7146fd1967ef10232c1","Struktur beranda berubah dari baseline v30");
assert(sha(css)==="1f43c01da99ccb671954a953019704ed58b79b7a7c70efa0c2020dfa3cf6f827","CSS utama beranda berubah dari baseline v30");
assert(sha(assetCss)==="a8786bbfa613b7754d01af2f8e34b01a70d3637e64b99639ec050b1a7055183b","Sistem aset beranda berubah dari baseline v30");
assert(!/(#homePage|\.home-|\.top-nav|\.bottom-nav|\.nav-inner)/.test(professionalCss),"Lapisan profesional menyentuh selector beranda atau navigasi global");
assert(/decorate\("\.top-nav/.test(iconRuntime)&&/\.bottom-nav/.test(iconRuntime),"Runtime ikon global belum mencakup navigasi beranda");
assert(/\.top-nav button>\.wk-kotoba-icon,\.bottom-nav button>\.wk-kotoba-icon/.test(iconCss),"Ukuran ikon navigasi global belum konsisten");
for(const id of [
  "homePage","homeGreetingTitle","homeContinueTitle","homeStartBtn","homeLoginBtn",
  "homeMaterialBtn","homeResultBtn","homeDailyWordTitle","homeDailyAudioBtn",
  "homeDailySpeechBtn","homeTargetTitle","homeRecommendationBtn"
]) assert(new RegExp(`\\bid=["']${id}["']`).test(html),`Elemen beranda hilang: ${id}`);

for(const area of ["continue","vocab","stats","quick","target","recommend"]){
  assert(new RegExp(`grid-area:${area}`).test(css),`Area grid beranda hilang: ${area}`);
}

assert(/\.home-main-grid\{[\s\S]*grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/.test(css),"Grid desktop 12 kolom hilang");
assert(/@media \(min-width:768px\) and \(max-width:1180px\)[\s\S]*\.home-main-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important[\s\S]*grid-template-areas:"continue continue" "target vocab" "stats stats" "quick quick" "recommend recommend"!important/.test(finalCss),"Susunan beranda iPad berubah");
assert(/@media \(min-width:768px\) and \(max-width:1180px\)[\s\S]*\.bottom-nav\{[\s\S]*bottom:14px!important[\s\S]*width:min\(640px,calc\(100% - 36px\)\)!important/.test(finalCss),"Dock iPad tidak aman");
assert(/@media \(max-width:767px\)[\s\S]*\.home-main-grid\{[\s\S]*grid-template-columns:1fr!important[\s\S]*grid-template-areas:"continue" "target" "vocab" "quick" "recommend" "stats"!important/.test(finalCss),"Susunan beranda mobile berubah");
assert(/@media \(max-width:767px\)[\s\S]*\.home-theme-scene,\.home-main-reference-image\{display:none!important\}/.test(finalCss),"Proteksi scene mobile hilang");
assert(/@media \(max-width:767px\)[\s\S]*\.home-header h1\{font-size:clamp\(28px,8\.5vw,35px\)!important/.test(finalCss),"Judul mobile kembali terlalu kecil");
assert(/@media \(max-width:767px\)[\s\S]*\.home-primary-actions \.btn\{width:100%!important;min-height:50px!important\}/.test(finalCss),"Tombol utama mobile tidak aman");
assert(/@media \(max-width:389px\)[\s\S]*\.home-quick-list\{grid-template-columns:1fr!important\}/.test(finalCss),"Proteksi quick action layar sempit hilang");

assert(/<div class="home-theme-scene" aria-hidden="true">/.test(html),"Scene beranda awal hilang");
assert(!/home-asset-scene|home-scene-asset-main/.test(html),"Horizon lama kembali aktif");
assert(/html\[data-theme="dark"\] \.home-scene-orb::before\{content:"☾"/.test(css),"Personalisasi scene malam hilang");
assert(/html\[data-theme="dark"\] \.home-card/.test(css),"Surface dark mode beranda hilang");
assert(/\.user-btn>\.wikaru-user-avatar\s*\{[^{}]*display:grid!important/is.test(assetCss),"Avatar header mobile tidak terlihat");

assert(/const duration=reduced\?40:220/.test(enhancements),"Motion tema 220 ms hilang");
assert(/wkQuietDropdownIn \.16s ease-out/.test(assetCss),"Motion dropdown 160 ms hilang");
assert(/wkQuietFadeIn \.18s ease-out/.test(assetCss),"Motion halaman 180 ms hilang");
assert(/wkQuietAnswerIn \.2s ease-out/.test(enhancements),"Motion jawaban 200 ms hilang");
assert(/@media \(prefers-reduced-motion:reduce\)/.test(assetCss),"Reduced motion final hilang");

console.log(JSON.stringify({
  status:"PASS",
  homepage:"original CSS scene preserved",
  desktop:"12-column dashboard",
  ipad:"2-column dashboard + bottom dock",
  mobile:"single column + fixed bottom navigation",
  narrowMobile:"single-column quick actions",
  lightDarkScenes:true,
  mobileSceneCollisionPrevented:true,
  profileVisible:true,
  baselineV30HashLocked:true,
  approvedMotionMs:{theme:220,profileMenu:160,page:180,answer:200},
  reducedMotion:true
}));
