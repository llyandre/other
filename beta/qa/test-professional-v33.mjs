import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const exists=file=>fs.existsSync(path.join(root,file));
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const html=read("index.html");
const css=read("assets/css/professional-v33.css");
const js=read("assets/js/experience-v33.js");
const questionCss=read("assets/css/question-page-final.css");
const manifest=JSON.parse(read("manifest.webmanifest"));
const sw=read("sw.js");
const config=read("assets/js/runtime-config.js");

assert(html.includes('id="mainContent" tabindex="-1"'),"Konten utama belum menjadi target skip link");
assert(html.includes('class="wk-skip-link" href="#mainContent"'),"Skip link belum tersedia");
assert(html.indexOf("professional-v33.css?v=20260903-v39u1")>html.indexOf("professional-v32.css?v=20260903-v39u1"),"CSS v33 harus dimuat paling akhir");
assert(html.indexOf("experience-v33.js?v=20260903-v39u1")>html.indexOf("learning-hub.js?v=20260903-v39u1"),"Runtime v33 harus dimuat setelah modul utama");

assert(/#homePage \.home-theme-scene \{ display:block!important; \}/.test(css),"Scene awan awal belum dikunci");
assert(/#homePage \.home-main-reference-image \{ display:none!important; \}/.test(css),"Gambar pengganti beranda belum dinonaktifkan");
assert(html.includes('<span class="home-scene-cloud home-scene-cloud-one"></span>'),"Awan pertama hilang");
assert(html.includes('<span class="home-scene-cloud home-scene-cloud-two"></span>'),"Awan kedua hilang");
const homeStart=html.indexOf('<section class="page active home-page" id="homePage">');
const homeEnd=html.indexOf('<section class="page" id="materialPage">');
const home=html.slice(homeStart,homeEnd);
assert(!/seal-question|wk-mascot|<img[^>]+mascot/i.test(home),"Maskot statis masuk ke scene beranda awal");

assert(/#quizPage::after[\s\S]*bottom:-57px!important[\s\S]*width:112px!important/.test(css),"Maskot mengintip desktop belum memakai crop referensi");
assert(/@media\(min-width:768px\) and \(max-width:1180px\)[\s\S]*#quizPage::after\{display:none!important\}/.test(questionCss),"Maskot bawah harus tersembunyi pada iPad");
assert(/@media\(max-width:767px\)[\s\S]*#quizPage::after\{display:none!important\}/.test(questionCss),"Maskot bawah harus tersembunyi pada mobile");

for(const id of ["wkAchievementBoard","wkAchievementGrid","wkAdminInsights","wkAdminInsightGrid","wkRefreshInsights"]){
  assert(html.includes(`id="${id}"`),`Komponen v33 hilang: ${id}`);
}
for(const feature of ["beforeinstallprompt","renderAchievements","renderAdminInsights","wikaru:pronunciation-result","wk-pronunciation-analysis","DIAGNOSTIC_KEY","bindTabKeyboard"]){
  assert(js.includes(feature),`Fitur runtime v33 hilang: ${feature}`);
}
assert(!/(google-analytics|googletagmanager|segment\.com|mixpanel|hotjar)/i.test(js+html),"Analitik pihak ketiga tidak boleh disisipkan");
assert(config.includes('diagnosticsMode: "local-only"'),"Mode diagnostik privat belum dikunci lokal");
assert(/turnstileSiteKey:\s*""/.test(config),"Site Key produksi tidak boleh dipalsukan");

assert(manifest.display==="standalone","Manifest bukan PWA standalone");
assert(manifest.icons?.some(icon=>icon.sizes==="192x192"),"Ikon PWA 192 hilang");
assert(manifest.icons?.some(icon=>icon.sizes==="512x512"),"Ikon PWA 512 hilang");
assert(manifest.shortcuts?.length===2,"Shortcut PWA belum lengkap");
for(const asset of ["assets/brand/wikaru-app-icon.svg","assets/brand/wikaru-app-icon-192.png","assets/brand/wikaru-app-icon-512.png","assets/brand/wikaru-social-preview.png"]){
  assert(exists(asset),`Aset brand hilang: ${asset}`);
  assert(sw.includes(`./${asset}`),`Aset brand belum dicache: ${asset}`);
}
assert(sw.includes('wikaru-static-v39u1-20260903'),"Cache v39 belum unik");
assert(sw.includes('./assets/js/experience-v33.js'),"Runtime v33 belum offline-ready");
assert(sw.includes('./assets/css/professional-v33.css'),"CSS v33 belum offline-ready");
assert(exists("docs/PRODUCTION_CHECKLIST.md"),"Checklist produksi belum disertakan");

console.log(JSON.stringify({
  status:"PASS",
  release:"v33-cloud-home",
  home:"sun-cloud-kana locked",
  quizSeal:"desktop peek crop",
  additions:["PWA install","offline pack","pronunciation units","weekly badges","admin insights","private diagnostics","SEO metadata","keyboard navigation"],
  externalActivation:["Turnstile Site Key","custom domain"]
}));
