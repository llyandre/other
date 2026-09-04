import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {REVIEW_INTERVALS,nextReviewLevel,nextReviewDueAt,masteryAccuracy,masteryScore,isMasteredRecord,isWeakRecord,weeklyProgress,DAY_MS} from "../assets/js/learning-engine.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const html=read("index.html"),css=read("assets/css/learning-hub.css"),hub=read("assets/js/learning-hub.js"),app=read("assets/js/app.js"),sw=read("sw.js");

const featureIds=[
  "learningPage","wkMissionSteps","wkMistakeList","wkReviewTimeline","wkReviewList","wkChapterMap",
  "wkConversationStage","wkSummaryGrid","wkWeeklyRing","wkSmartSearchInput","wkFocusToggle","wkFocusExit"
];
for(const id of featureIds)assert(new RegExp(`\\bid=["']${id}["']`).test(html),`Elemen fitur hilang: ${id}`);

const tabs=["mission","mistakes","review","mastery","conversation","summary"];
for(const tab of tabs){
  assert(new RegExp(`data-wk-tab=["']${tab}["']`).test(html),`Tab hilang: ${tab}`);
  assert(new RegExp(`data-wk-panel=["']${tab}["']`).test(html),`Panel hilang: ${tab}`);
}

for(const action of ["start-adaptive","start-perfect","review-mistakes","start-review","load-mastery","start-conversation"]){
  assert(html.includes(`data-wk-action="${action}"`),`Aksi tidak tersedia: ${action}`);
}

assert(html.includes('role="tablist"')&&html.includes('role="tabpanel"'),"Semantik tab pusat belajar hilang");
assert(html.includes('role="progressbar"')&&html.includes('aria-valuemin="0"'),"Progress misi tidak aksesibel");
assert(/@media \(max-width:1100px\)/.test(css)&&/@media \(max-width:820px\)/.test(css)&&/@media \(max-width:767px\)/.test(css)&&/@media \(max-width:390px\)/.test(css),"Breakpoint pusat belajar tidak lengkap");
assert(/prefers-reduced-motion:reduce/.test(css),"Reduced motion belum didukung");
assert(/html\[data-theme="dark"\]/.test(css),"Dark mode pusat belajar belum didukung");
assert(/body\.wk-focus-mode \.top-nav/.test(css)&&/body\.wk-focus-mode \.bottom-nav/.test(css),"Mode fokus tidak menyembunyikan distraksi");

assert(JSON.stringify(REVIEW_INTERVALS)==="[1,3,7]","Algoritma review 1-3-7 hilang");
const reviewBase=Date.UTC(2026,7,30);
assert(nextReviewLevel(0,true)===1&&nextReviewDueAt(reviewBase,1)===reviewBase+DAY_MS,"Review hari ke-1 salah");
assert(nextReviewLevel(1,true)===2&&nextReviewDueAt(reviewBase,2)===reviewBase+3*DAY_MS,"Review hari ke-3 salah");
assert(nextReviewLevel(2,true)===3&&nextReviewDueAt(reviewBase,3)===reviewBase+7*DAY_MS,"Review hari ke-7 salah");
assert(nextReviewLevel(3,false)===0&&nextReviewDueAt(reviewBase,0)===reviewBase+DAY_MS,"Jawaban salah tidak mereset jadwal");
assert(masteryAccuracy({seen:4,correct:3})===75&&masteryScore({seen:3,correct:3})===100,"Perhitungan penguasaan salah");
assert(isMasteredRecord({seen:3,correct:3,level:3})&&!isMasteredRecord({seen:2,correct:2,level:2}),"Klasifikasi dikuasai salah");
assert(isWeakRecord({seen:2,correct:1,wrong:1,level:1,lastStatus:"wrong"}),"Klasifikasi kelemahan salah");
assert(weeklyProgress(75,75)===100&&weeklyProgress(150,75)===100&&weeklyProgress(35,75)===47,"Progres mingguan salah");
assert(hub.includes('function recordResult(')&&hub.includes('document.addEventListener("wikaru:quiz-finished"'),"Hasil kuis tidak terhubung ke progres pintar");
assert(hub.includes('function adaptiveIds(')&&hub.includes('function renderMastery('),"Latihan adaptif atau peta penguasaan hilang");
assert(hub.includes('function startConversation(')&&hub.includes('function answerConversation('),"Simulasi percakapan belum berfungsi");
assert(hub.includes('function searchAll(')&&hub.includes('await ensureAllData("search")'),"Pencarian pintar belum memuat seluruh bab sesuai kebutuhan");
assert(hub.includes('function weeklyStats(')&&hub.includes('weeklyTarget'),"Target mingguan belum tersimpan");
assert(hub.includes('function toggleFocus('),"Kontrol mode fokus hilang");
assert(hub.includes('if(allDataPromise)return allDataPromise'),"Pemuat 50 bab tidak memiliki deduplikasi request");
assert(!/setInterval\s*\(/.test(hub),"Modul belajar menambah polling berkala");

assert(app.includes('window.WIKARU_APP = Object.freeze'),"API aman aplikasi belum tersedia");
assert(app.includes('async startCustomQuiz(plan={})'),"Quiz khusus belum terhubung");
assert(app.includes('learningContext:quiz.learningContext || null'),"Konteks sesi pintar tidak tersimpan pada hasil");
assert(app.includes('wikaru:quiz-started')&&app.includes('wikaru:quiz-finished'),"Event siklus quiz tidak lengkap");
assert(sw.includes("./assets/css/learning-hub.css")&&sw.includes("./assets/js/learning-engine.js")&&sw.includes("./assets/js/learning-hub.js"),"Aset pusat belajar belum masuk cache offline");

console.log(JSON.stringify({
  status:"PASS",features:11,tabs:tabs.length,reviewSchedule:[1,3,7],responsiveBreakpoints:[1100,820,767,390],
  quizIntegration:true,localPersistence:true,lazyAllChapterLoad:true,darkMode:true,reducedMotion:true,focusMode:true
}));
