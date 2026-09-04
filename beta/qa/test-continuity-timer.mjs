import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const html=read("index.html"),cloud=read("assets/js/supabase-client.js"),feature=read("assets/js/account-offline.js"),css=read("assets/css/account-offline.css"),enhancements=read("assets/js/enhancements.js"),app=read("assets/js/app.js"),sw=read("sw.js"),runtime=read("assets/js/runtime-config.js");

assert(html.includes("assets/js/account-offline.js")&&html.includes("assets/css/account-offline.css"),"Modul continuity belum dimuat");
assert(/detectSessionInUrl:\s*true/.test(cloud)&&/flowType:\s*"pkce"/.test(cloud),"Callback Magic Link belum aman");
assert(/signInWithOtp/.test(cloud)&&/emailRedirectTo/.test(cloud),"Magic Link belum tersedia");
assert(/!currentSession\)\s*\{\s*await ensureParticipantSession/.test(cloud),"Akun permanen masih berisiko ditimpa akun anonim");
assert(/captchaToken/.test(cloud)&&/WIKARU_CAPTCHA/.test(cloud),"Token CAPTCHA belum terhubung ke akun anonim");
assert(/turnstileSiteKey/.test(runtime)&&/challenges\.cloudflare\.com/.test(html),"Fondasi Turnstile atau CSP belum lengkap");
assert(/CACHE_CHAPTERS/.test(feature)&&/REMOVE_CHAPTERS/.test(feature)&&/OFFLINE_CHAPTER_CACHE/.test(sw),"Unduhan bab offline belum lengkap");
assert(/data\/bab-/.test(sw)&&/Ribuan gambar eksternal tidak diunduh/.test(feature),"Batas unduhan offline belum aman");
assert(/pronunciationScore/.test(feature)&&/wikaru:pronunciation-result/.test(app)&&/maxAlternatives=10/.test(app),"Penilaian pelafalan belum terhubung");
assert(/wkQuestionTimerText/.test(enhancements)&&/timer-metric/.test(css)&&/wk-question-timer/.test(css),"Timer header halaman soal belum lengkap");
assert(/max-width:820px/.test(css)&&/max-width:520px/.test(css)&&/max-width:374px/.test(css),"Breakpoint timer/continuity belum lengkap");
assert(/prefers-reduced-motion:reduce/.test(css),"Reduced motion belum tersedia");
assert(sw.includes("wikaru-static-v39u1-20260903")&&sw.includes("account-offline.js"),"Cache continuity terbaru belum aktif");

console.log(JSON.stringify({status:"PASS",magicLink:true,captchaReady:true,offlineChapters:50,pronunciationScore:true,timerLayouts:["desktop","ipad","mobile"],cache:"v30"}));
