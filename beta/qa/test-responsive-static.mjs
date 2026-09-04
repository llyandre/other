import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/css/app.css"),"utf8");
const assetCss=fs.readFileSync(path.join(root,"assets/css/asset-system.css"),"utf8");
const cursorCss=fs.readFileSync(path.join(root,"assets/css/cursor-v35.css"),"utf8");
const quizGuideCss=fs.readFileSync(path.join(root,"assets/css/quiz-guide.css"),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

assert(/name=["']viewport["'][^>]+width=device-width/i.test(html),"Viewport device-width hilang");
assert(/@media\s*\(min-width:1181px\)/.test(css),"Breakpoint desktop utama hilang");
assert(/@media\s*\(min-width:768px\)\s*and\s*\(max-width:1180px\)/.test(css),"Breakpoint iPad/tablet hilang");
assert(/@media\s*\(max-width:767px\)/.test(css),"Breakpoint mobile hilang");
assert(/@media\s*\(max-width:389px\)/.test(css),"Proteksi smartphone sempit hilang");
assert(/@media\s*\(max-width:1000px\)\s*and\s*\(orientation:landscape\)\s*and\s*\(max-height:600px\)/.test(css),"Proteksi landscape pendek hilang");
assert(/@media\s*\(prefers-reduced-motion:reduce\)/.test(css),"Reduced-motion fallback hilang");
assert(/\.flashcard\s*\{[^{}]*height:clamp\([^{}]*dvh[^{}]*touch-action:pan-y/is.test(css),"Kartu kuis tidak memiliki proteksi tinggi viewport dan gestur vertikal");
assert(/#quizPage\s+\.quiz-grid\s*\{\s*grid-template-columns:1fr!important/is.test(css),"Kuis mobile belum dikunci satu kolom");
assert(/\.modal-scroll-body\s*\{[^{}]*overflow-y:auto!important/is.test(css),"Isi modal mobile tidak dapat discroll");
assert(/:where\(button,\.btn,\.icon-btn,\.control-btn,\.choice-chip,\.check-pill,select,input\)\s*\{\s*min-height:var\(--wk-release-touch\)/is.test(css),"Target sentuh tablet hilang");
assert(/\.user-btn\s*\{[^{}]*min-width:42px!important[^{}]*height:42px!important/is.test(css),"Target profil mobile hilang");
assert(/<div class="home-theme-scene" aria-hidden="true">/.test(html),"Scene beranda awal tidak ada");
assert(!/home-asset-scene|home-scene-asset-main/.test(html),"Scene beranda pengganti masih aktif");
assert(/\.user-btn>\.wikaru-user-avatar\s*\{[^{}]*display:grid!important/is.test(assetCss),"Avatar tombol profil mobile masih dapat tersembunyi");
assert(/\.wikaru-profile-image\s*\{[^{}]*width:100%!important[^{}]*object-fit:contain!important/is.test(assetCss),"Object-fit aman avatar hilang");
assert(/\.has-profile-asset\s*\{[^{}]*overflow:visible!important[^{}]*border-radius:50%!important/is.test(assetCss),"Wadah anti-crop avatar hilang");
assert(/@media \(hover:none\),\(pointer:coarse\)/.test(assetCss),"Proteksi hover pada layar sentuh hilang");
assert(/@media \(max-width:767px\)[\s\S]*backdrop-filter:blur\(8px\)!important/.test(assetCss),"Blur mobile belum dibatasi");
assert(/@media \(hover:hover\) and \(pointer:fine\),\(any-hover:hover\) and \(any-pointer:fine\)/.test(cursorCss),"Cursor desktop bermouse presisi tidak dideteksi dengan benar");
assert(!/@media \(min-width:1181px\) and \(any-hover:hover\)/.test(cursorCss),"Cursor masih salah bergantung pada lebar viewport desktop");
assert(/@media \(any-hover:none\)/.test(cursorCss),"Cursor maskot belum dinonaktifkan pada perangkat sentuh murni");
assert(/@media \(min-width:768px\) and \(max-width:1180px\)/.test(quizGuideCss),"Panduan kuis iPad hilang");
assert(/@media \(max-width:767px\)/.test(quizGuideCss),"Panduan kuis mobile hilang");
assert(/max-height:min\(82dvh,720px\)/.test(quizGuideCss),"Panduan kuis mobile belum aman terhadap tinggi layar");

console.log(JSON.stringify({
  status:"PASS",
  desktop:"min-width 1181px",
  ipad:"768px-1180px",
  mobile:"max-width 767px",
  narrowMobile:"max-width 389px",
  shortLandscape:true,
  quizViewportProtection:true,
  scrollableMobileModals:true,
  reducedMotion:true
  ,originalHomepageScene:true,
  mobileProfileVisible:true,
  avatarSafeArea:true,
  avatarContainerNoCrop:true,
  touchHoverProtection:true,
  mobileBlurBudget:true,
  desktopCursorFinePointerOnly:true,
  desktopCursorViewportIndependent:true,
  quizGuideResponsive:true
}));
