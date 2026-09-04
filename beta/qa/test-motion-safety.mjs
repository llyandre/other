import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const appCss=read("assets/css/app.css");
const assetCss=read("assets/css/asset-system.css");
const enhancements=read("assets/js/enhancements.js");
const profiles=read("assets/js/profile-assets.js");
const html=read("index.html");
const sw=read("sw.js");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

assert(/\.wk-theme-motion-overlay-v8,\.theme-transition-overlay\{display:none!important\}/.test(appCss),"Overlay tema lama masih dapat tampil");
assert(/\.wk-theme-v9-overlay\s*\{[^{}]*position:fixed[^{}]*pointer-events:none/is.test(appCss),"Overlay tema final tidak aman terhadap klik");
assert(/finished\.finally\(\(\)=>overlay\.remove\(\)\)/.test(enhancements),"Overlay tema tidak dibersihkan setelah animasi");
assert(/root\.dataset\.wkMotion==='reduced'\|\|matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/.test(enhancements),"Animasi tema belum menghormati preferensi sistem");
assert(/@media\s*\(prefers-reduced-motion:reduce\)[\s\S]*\.wk-theme-v9-overlay[\s\S]*animation:none!important/.test(assetCss),"Fallback reduced-motion final hilang");
assert(!/for\(let i=0;i<10;i\+\+\).*wk-theme-v9-particle/.test(enhancements),"Partikel tema dekoratif masih dibuat");
assert(/const duration=reduced\?40:220/.test(enhancements),"Durasi transisi tema belum dipadatkan");
assert(/overlay\.append\(wash\)/.test(enhancements)&&!/overlay\.append\(wash,badge\)/.test(enhancements),"Badge tema dekoratif masih dibuat");
assert(!/sections\.forEach\(\(section,index\)=>section\.animate/.test(enhancements),"Stagger animasi isi halaman masih aktif");
assert(/function addMotionArt\(\)\{\s*\$\$\('\.wk-motion-constellation'\)\.forEach\(node=>node\.remove\(\)\);\s*\}/.test(enhancements),"Ornamen motion setup masih dibuat");
assert(/wkQuietFadeIn \.18s ease-out/.test(assetCss),"Fade halaman 180 ms hilang");
assert(/wkQuietDropdownIn \.16s ease-out/.test(assetCss),"Motion dropdown 160 ms hilang");
assert(/wkQuietAnswerIn \.2s ease-out/.test(enhancements),"Feedback jawaban 200 ms hilang");
assert(/#quizPage\.wk-play-correct \.quiz-card-wrap,[\s\S]*animation:none!important/.test(assetCss),"Bounce kartu jawaban masih aktif");
assert(/#quizPage \.wk-play-particle\{display:none!important;animation:none!important;\}/.test(assetCss),"Confetti jawaban masih aktif");
assert(!/navigator\.vibrate\(correct\?/.test(enhancements),"Getaran jawaban masih aktif");

assert(!/wikaruHorizonScene|home-asset-scene/.test(assetCss),"Motion Horizon masih aktif setelah beranda dipulihkan");
assert(/\.hero-mini-card,[\s\S]*animation:none!important/.test(assetCss),"Hero dekoratif masih bergerak terus-menerus");
assert(/\.setup-progress-line::after,[\s\S]*\.marker-quiz-progress span::after,[\s\S]*display:none!important/.test(assetCss),"Kilau progress dekoratif masih aktif");
assert(/#loadingScreen \.loader-card\s*\{[\s\S]*animation:wkLoaderCardIn \.34s/.test(assetCss),"Loader belum disederhanakan");
assert(/@media \(hover:none\),\(pointer:coarse\)/.test(assetCss),"Hover motion layar sentuh belum dinonaktifkan");

assert(/export const DEFAULT_PROFILE=Object\.freeze/.test(profiles)&&/id:"default-account"/.test(profiles),"Profil default tidak tersedia");
assert(/DEFAULT_PROFILE_NAMES=new Set\(\["","masuk","login"/.test(profiles),"Nama kosong belum diarahkan ke profil default");
assert(/\.user-btn>\.wikaru-user-avatar\s*\{[^{}]*display:grid!important/is.test(assetCss),"Avatar header mobile masih dapat tersembunyi");
assert(/\.wikaru-profile-image\s*\{[^{}]*width:100%!important[^{}]*object-fit:contain!important/is.test(assetCss),"Avatar tidak memakai object-fit aman");
assert(/\.has-profile-asset\s*\{[^{}]*overflow:visible!important[^{}]*border-radius:50%!important/is.test(assetCss),"Wadah avatar masih dapat memotong aset");
assert(/Quiet motion pass:[\s\S]*\.wikaru-user-avatar\.avatar-refresh[\s\S]*animation:none!important/.test(assetCss),"Animasi avatar yang mengganggu masih aktif");
assert(sw.includes("./assets/profile/default-account.svg"),"Avatar default belum masuk cache aplikasi");
assert(!sw.includes("assets/horizon/horizon-scene-"),"Horizon yang tidak dipakai masih masuk precache awal");

assert(/id="userMenuBtn"[^>]*aria-expanded="false"[^>]*aria-controls="userDropdown"/.test(html),"Kontrol menu profil tidak aksesibel");
assert(/id="userDropdown"[^>]*aria-hidden="true"/.test(html),"State awal menu profil salah");
assert(/id="logoutBtn"/.test(html)&&/"#langToggleDrop","#navFictionToggle","#myResultDrop","#logoutBtn","#themeToggle"/.test(enhancements),"Aksi logout/menu profil tidak terhubung");
assert(/button\.addEventListener\("click", toggleUserDropdown, \{capture:true\}\)/.test(enhancements),"Handler profil final tidak terpasang");

console.log(JSON.stringify({
  status:"PASS",
  themeMotionSingleVisible:true,
  themeMotionCleanup:true,
  themeMotionDurationMs:220,
  profileDropdownDurationMs:160,
  pageFadeDurationMs:180,
  answerFeedbackDurationMs:200,
  answerBounceRemoved:true,
  answerConfettiRemoved:true,
  systemReducedMotion:true,
  originalHomepageRestored:true,
  perpetualHeroMotionRemoved:true,
  decorativeProgressSweepRemoved:true,
  themeParticlesRemoved:true,
  touchHoverMotionRemoved:true,
  simplifiedLoader:true,
  defaultProfile:true,
  mobileProfileVisible:true,
  avatarSafeArea:true,
  avatarRefreshMotionRemoved:true,
  pageContentStaggerRemoved:true,
  logoutWired:true
}));
