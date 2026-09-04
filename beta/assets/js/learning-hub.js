import {WIKARU_DATA,VOCABULARY} from "./data-loader.js";
import {REVIEW_INTERVALS,nextReviewLevel,nextReviewDueAt,masteryAccuracy,masteryScore,isMasteredRecord,isWeakRecord,weeklyProgress} from "./learning-engine.js";

const STORAGE=window.WIKARU_STORAGE||window.localStorage;
const BASE="minna_bab23";
const SMART_PREFIX="wikaru_smart_learning_v1_";
const DAY=86400000;
const ALL_CHAPTERS=Array.from({length:50},(_,index)=>index+1);
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));

const COPY={
  id:{
    smartLabel:"Pusat belajar pribadi",smartTitle:"Belajar yang paling perlu, lebih dulu",smartCopy:"Misi harian, review terjadwal, dan rekomendasi otomatis berdasarkan hasil latihanmu.",dueShort:"perlu direview",weakShort:"perlu dikuatkan",weekShort:"target mingguan",openLearningHub:"Buka pusat belajar",
    learningBreadcrumb:"Beranda › Pusat Belajar",learningTitle:"Pusat Belajar Pribadi",learningSubtitle:"Satu tempat untuk menentukan latihan yang paling berguna hari ini.",focusMode:"Mode Fokus",exitFocus:"Keluar Mode Fokus",todayMission:"Misi belajar hari ini",dueReview:"Review jatuh tempo",weakWords:"Kosakata perlu dikuatkan",masteredWords:"Kosakata dikuasai",perfectRuns:"Tantangan sempurna",
    smartSearch:"Pencarian pintar",smartSearchCopy:"Cari berdasarkan kanji, kana, romaji, arti Indonesia, atau nomor bab.",tabMission:"Misi",tabMistakes:"Buku Kesalahan",tabReview:"Review 1–3–7",tabMastery:"Peta Bab",tabConversation:"Percakapan",tabSummary:"Ringkasan",
    dailyPlanLabel:"Rencana harian",dailyPlanTitle:"Empat langkah, satu sesi yang terarah",adaptivePractice:"Latihan adaptif",perfectLabel:"Tantangan sempurna",perfectTitle:"10 soal, target 100%",perfectCopy:"Kosakata dipilih dari materi yang perlu kamu kuatkan. Selesaikan tanpa salah untuk menambah lencana sempurna.",startChallenge:"Mulai tantangan",
    mistakeLabel:"Catatan otomatis",mistakeTitle:"Buku Kesalahan",mistakeCopy:"Jawaban salah tersimpan otomatis dan akan berkurang prioritasnya setelah berhasil dijawab benar.",reviewMistakes:"Latih yang salah",reviewLabel:"Pengulangan bertahap",reviewTitle:"Jadwal Review 1–3–7 Hari",reviewCopy:"Kata yang sudah dilatih akan muncul kembali setelah 1, 3, dan 7 hari sesuai tingkat penguasaanmu.",startDueReview:"Mulai review",
    masteryLabel:"Minna no Nihongo I & II",masteryTitle:"Peta Penguasaan Bab 1–50",masteryCopy:"Lihat bab yang belum dimulai, sedang berkembang, dan sudah kuat.",refreshMap:"Perbarui peta",notStarted:"Belum dimulai",developing:"Berkembang",strong:"Kuat",
    conversationLabel:"Latihan berbasis situasi",conversationTitle:"Simulasi Percakapan",conversationCopy:"Pilih respons atau kosakata yang paling tepat untuk melengkapi situasi singkat.",newConversation:"Mulai simulasi",summaryLabel:"Tujuh hari terakhir",summaryTitle:"Ringkasan dan Target Belajar",summaryCopy:"Pantau konsistensi, akurasi, waktu belajar, dan rekomendasi sesi berikutnya.",thisWeek:"minggu ini",weeklyLabel:"Target mingguan"
  },
  ja:{
    smartLabel:"パーソナル学習センター",smartTitle:"必要な学習から、先に",smartCopy:"毎日のミッション、復習予定、練習結果に基づく自動おすすめ。",dueShort:"復習が必要",weakShort:"強化が必要",weekShort:"週間目標",openLearningHub:"学習センターを開く",
    learningBreadcrumb:"ホーム › 学習センター",learningTitle:"パーソナル学習センター",learningSubtitle:"今日いちばん役立つ練習を、ひとつの場所で選べます。",focusMode:"集中モード",exitFocus:"集中モードを終了",todayMission:"今日の学習ミッション",dueReview:"期限の復習",weakWords:"強化したい語彙",masteredWords:"習得した語彙",perfectRuns:"満点チャレンジ",
    smartSearch:"スマート検索",smartSearchCopy:"漢字、かな、ローマ字、インドネシア語、課番号から検索できます。",tabMission:"ミッション",tabMistakes:"間違いノート",tabReview:"1・3・7日復習",tabMastery:"課マップ",tabConversation:"会話",tabSummary:"まとめ",
    dailyPlanLabel:"今日のプラン",dailyPlanTitle:"4つの短いステップで、迷わず学習",adaptivePractice:"適応型練習",perfectLabel:"満点チャレンジ",perfectTitle:"10問・100点を目指そう",perfectCopy:"強化が必要な語彙から自動で出題します。全問正解で満点バッジが増えます。",startChallenge:"チャレンジ開始",
    mistakeLabel:"自動記録",mistakeTitle:"間違いノート",mistakeCopy:"間違えた語彙を自動で保存し、正解が続くと優先度が下がります。",reviewMistakes:"間違いを練習",reviewLabel:"段階的な復習",reviewTitle:"1・3・7日 復習スケジュール",reviewCopy:"学習した語彙は習得度に合わせて1日、3日、7日後に再び表示されます。",startDueReview:"復習を始める",
    masteryLabel:"みんなの日本語 I・II",masteryTitle:"第1～50課 習得マップ",masteryCopy:"未学習、学習中、定着した課を一覧で確認できます。",refreshMap:"マップ更新",notStarted:"未学習",developing:"学習中",strong:"定着",
    conversationLabel:"場面別練習",conversationTitle:"会話シミュレーション",conversationCopy:"短い場面に最も合う応答や語彙を選びます。",newConversation:"シミュレーション開始",summaryLabel:"直近7日間",summaryTitle:"学習まとめと目標",summaryCopy:"継続日数、正答率、学習時間、次のおすすめを確認できます。",thisWeek:"今週",weeklyLabel:"週間目標"
  }
};

let userSignature="";
let smartState=null;
let allDataPromise=null;
let searchTimer=0;
let pendingAction=null;
let conversation=null;
let pageObserver=null;

function lang(){return document.documentElement.lang==="ja"?"ja":"id"}
function text(key){return (COPY[lang()]||COPY.id)[key]||COPY.id[key]||key}
function safeJson(key,fallback){try{const value=JSON.parse(STORAGE.getItem(key)||"null");return value??fallback}catch(_){return fallback}}
function safeSet(key,value){try{STORAGE.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
function session(){const value=safeJson(`${BASE}_progress`,null);return value&&typeof value==="object"?value:null}
function normalizeKey(value){return String(value||"").normalize("NFKC").trim().toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff]+/giu,"-").replace(/^-+|-+$/g,"").slice(0,72)||"guest"}
function signature(){const current=session();return current?.username?`${normalizeKey(current.username)}__${normalizeKey(current.group||"umum")}`:"guest"}
function stateKey(){return SMART_PREFIX+userSignature}
function defaultState(){return{version:1,mastery:{},sessions:[],processed:[],weeklyTarget:75,perfectCount:0,missions:{},conversationHistory:[]}}
function normalizeState(value){const fallback=defaultState();if(!value||typeof value!=="object")return fallback;return{...fallback,...value,mastery:value.mastery&&typeof value.mastery==="object"?value.mastery:{},sessions:Array.isArray(value.sessions)?value.sessions.slice(0,365):[],processed:Array.isArray(value.processed)?value.processed.slice(0,600):[],missions:value.missions&&typeof value.missions==="object"?value.missions:{},conversationHistory:Array.isArray(value.conversationHistory)?value.conversationHistory.slice(0,60):[],weeklyTarget:[35,75,120].includes(Number(value.weeklyTarget))?Number(value.weeklyTarget):75,perfectCount:Math.max(0,Number(value.perfectCount)||0)}}
function save(){if(smartState)safeSet(stateKey(),smartState)}
function syncUser(force=false){const next=signature();if(!force&&next===userSignature&&smartState)return false;userSignature=next;smartState=normalizeState(safeJson(stateKey(),null));hydrateHistory();renderAll();return true}
function todayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function addDays(timestamp,days){return new Date(timestamp).getTime()+days*DAY}
function itemSnapshot(item={}){return{id:String(item.id||""),chapterNumber:Number(item.chapterNumber)||Number(String(item.chapter||"").match(/\d+/)?.[0])||0,chapter:String(item.chapter||""),kanji:String(item.kanji||""),kana:String(item.kana||""),romaji:String(item.romaji||""),indonesia:String(item.indonesia||""),exampleJa:String(item.exampleJa||item.examples?.[0]?.ja||""),exampleReading:String(item.exampleReading||item.examples?.[0]?.reading||""),exampleId:String(item.exampleId||item.examples?.[0]?.id||"")}}
function snapshotForId(id){const live=VOCABULARY.find(item=>String(item.id)===String(id));if(live)return itemSnapshot(live);return smartState?.mastery?.[id]?.snapshot||{id:String(id),chapterNumber:0,chapter:"",kanji:"",kana:"",romaji:"",indonesia:""}}
function isMastered(record){return isMasteredRecord(record)}
function isWeak(record){return isWeakRecord(record)}
function isDue(record,now=Date.now()){return !!record?.dueAt&&Number(record.dueAt)<=now}
function dueIds(){return Object.entries(smartState.mastery).filter(([,record])=>isDue(record)).sort((a,b)=>Number(a[1].dueAt)-Number(b[1].dueAt)).map(([id])=>id)}
function weakIds(){return Object.entries(smartState.mastery).filter(([,record])=>isWeak(record)).sort((a,b)=>(Number(b[1].wrong)-Number(a[1].wrong))||(masteryAccuracy(a[1])-masteryAccuracy(b[1]))).map(([id])=>id)}
function deterministic(items,seed){return[...items].sort((a,b)=>hash(`${seed}:${a}`)-hash(`${seed}:${b}`))}
function hash(value){let output=2166136261;for(const char of String(value)){output^=char.charCodeAt(0);output=Math.imul(output,16777619)}return output>>>0}
function liveQuizIds(){return VOCABULARY.filter(item=>item?.id&&item.quizEnabled!==false).map(item=>String(item.id))}
function distinct(source,count,excluded=new Set()){const result=[];for(const id of source){if(!id||excluded.has(id)||result.includes(id))continue;result.push(id);if(result.length>=count)break}return result}

function recordResult(result,{persist=true}={}){
  if(!result||typeof result!=="object")return false;
  const resultId=String(result.localId||`legacy-${result.finishedAt||""}-${result.username||""}-${result.scorePercent||0}`);
  if(smartState.processed.includes(resultId))return false;
  const finished=Date.parse(result.finishedAt)||Date.now();
  const details=Array.isArray(result.details)?result.details:[];
  for(const detail of details){
    const id=String(detail.id||"");if(!id)continue;
    const previous=smartState.mastery[id]||{seen:0,correct:0,wrong:0,level:0,dueAt:0,lastAt:0,lastStatus:"",snapshot:{id}};
    const correct=detail.isCorrect===true||detail.userStatus==="Benar";
    const level=nextReviewLevel(previous.level,correct);
    smartState.mastery[id]={
      ...previous,seen:(Number(previous.seen)||0)+1,correct:(Number(previous.correct)||0)+(correct?1:0),wrong:(Number(previous.wrong)||0)+(correct?0:1),
      level,dueAt:nextReviewDueAt(finished,level),lastAt:finished,lastStatus:correct?"correct":"wrong",correctStreak:correct?(Number(previous.correctStreak)||0)+1:0,
      snapshot:itemSnapshot({...snapshotForId(id),...detail,id,chapterNumber:Number(detail.chapterNumber)||snapshotForId(id).chapterNumber})
    };
  }
  smartState.sessions.unshift({id:resultId,at:new Date(finished).toISOString(),score:clamp(result.scorePercent,0,100),total:Number(result.totalQuestions)||details.length,correct:Number(result.correctCount)||details.filter(detail=>detail.isCorrect===true||detail.userStatus==="Benar").length,wrong:Number(result.wrongCount)||details.filter(detail=>detail.isCorrect===false||detail.userStatus==="Salah").length,duration:Math.max(0,Number(result.totalDuration)||0),kind:String(result.learningContext?.kind||"quiz")});
  smartState.sessions=smartState.sessions.slice(0,365);
  smartState.processed.unshift(resultId);smartState.processed=smartState.processed.slice(0,600);
  const context=result.learningContext||{};
  if(context.missionStep){const mission=getMission();mission.completed[context.missionStep]=true;smartState.missions[mission.date]=mission}
  if(context.kind==="perfect"&&Number(result.scorePercent)===100)smartState.perfectCount++;
  if(persist){save();renderAll()}
  return true;
}
function hydrateHistory(){
  if(!smartState||userSignature==="guest")return;
  const current=session();
  const rows=safeJson(`${BASE}_history`,[]);
  if(!Array.isArray(rows))return;
  rows.filter(row=>String(row?.username||"").trim().toLowerCase()===String(current?.username||"").trim().toLowerCase()).sort((a,b)=>(Date.parse(a.finishedAt)||0)-(Date.parse(b.finishedAt)||0)).forEach(row=>recordResult(row,{persist:false}));
  save();
}

function getMission(){
  const date=todayKey();
  let mission=smartState.missions[date];
  if(mission&&mission.ids&&mission.completed)return mission;
  const seedIds=deterministic(liveQuizIds(),date);
  const due=distinct(dueIds(),5);
  const used=new Set(due);
  const weak=distinct(weakIds(),3,used);weak.forEach(id=>used.add(id));
  const review=due.length?due:distinct(seedIds,5,used);review.forEach(id=>used.add(id));
  const weakPlan=weak.length?weak:distinct(seedIds,3,used);weakPlan.forEach(id=>used.add(id));
  const listening=distinct(seedIds,3,used);listening.forEach(id=>used.add(id));
  const adaptive=adaptiveIds(7,used);
  mission={date,createdAt:new Date().toISOString(),ids:{review,weak:weakPlan,listening,challenge:adaptive},completed:{review:false,weak:false,listening:false,challenge:false}};
  smartState.missions={[date]:mission};save();return mission;
}
function adaptiveIds(count=10,excluded=new Set()){
  const ranked=[...dueIds(),...weakIds(),...deterministic(liveQuizIds(),todayKey())];
  return distinct(ranked,count,excluded);
}
function chaptersForIds(ids){return[...new Set(ids.map(id=>Number(snapshotForId(id).chapterNumber)).filter(number=>number>=1&&number<=50))]}
async function startPlan({ids,kind,missionStep=null,mode="study",direction="idToJp",shuffle=true}){
  syncUser();
  const app=window.WIKARU_APP;
  if(!app){notify(lang()==="ja"?"アプリの準備が完了するまでお待ちください。":"Tunggu sebentar, aplikasi masih disiapkan.");return}
  if(!app.getSession()?.username){pendingAction={ids,kind,missionStep,mode,direction,shuffle};$("#homeLoginBtn")?.click();notify(lang()==="ja"?"先に学習者名を入力してください。":"Isi nama peserta terlebih dahulu, lalu latihan akan dilanjutkan.");return}
  const clean=[...new Set(ids.map(String).filter(Boolean))].slice(0,50);
  if(!clean.length){notify(lang()==="ja"?"練習する語彙がまだありません。":"Belum ada kosakata yang dapat dilatih.");return}
  const result=await app.startCustomQuiz({ids:clean,chapters:chaptersForIds(clean),kind,mode,direction,shuffle,context:{kind,missionStep,source:"learning-hub"}});
  if(!result?.ok&&result?.reason!=="login-required")notify(lang()==="ja"?"この練習はまだ利用できません。":"Latihan ini belum dapat dimulai.")
}
function notify(message){window.WIKARU_APP?.notify?.(message)}

function weekStart(timestamp=Date.now()){
  const date=new Date(timestamp);const day=(date.getDay()+6)%7;date.setHours(0,0,0,0);date.setDate(date.getDate()-day);return date.getTime();
}
function sessionsSince(timestamp){return smartState.sessions.filter(item=>(Date.parse(item.at)||0)>=timestamp)}
function weeklyStats(){const rows=sessionsSince(weekStart());return{rows,total:rows.reduce((sum,row)=>sum+(Number(row.total)||0),0),correct:rows.reduce((sum,row)=>sum+(Number(row.correct)||0),0),duration:rows.reduce((sum,row)=>sum+(Number(row.duration)||0),0)}}
function sevenDayStats(){const rows=sessionsSince(Date.now()-7*DAY);const total=rows.reduce((sum,row)=>sum+(Number(row.total)||0),0),correct=rows.reduce((sum,row)=>sum+(Number(row.correct)||0),0);return{rows,total,correct,accuracy:total?Math.round(correct/total*100):0,duration:rows.reduce((sum,row)=>sum+(Number(row.duration)||0),0),days:new Set(rows.map(row=>todayKey(new Date(row.at)))).size}}
function formatDuration(seconds){const minutes=Math.round(Number(seconds||0)/60);return lang()==="ja"?`${minutes}分`:`${minutes} mnt`}
function formatDue(timestamp){const delta=Number(timestamp)-Date.now();if(delta<=0)return lang()==="ja"?"今すぐ":"Sekarang";const days=Math.max(1,Math.ceil(delta/DAY));return lang()==="ja"?`${days}日後`:`${days} hari lagi`}

function applyCopy(){$$('[data-wk-copy]').forEach(node=>{const value=text(node.dataset.wkCopy);if(value)node.textContent=value});const input=$("#wkSmartSearchInput");if(input)input.placeholder=lang()==="ja"?"例：たべます、tabemasu、makan、第6課":"Contoh: たべます, tabemasu, makan, Bab 6"}
function renderOverview(){
  if(!smartState)return;
  const due=dueIds().length,weak=weakIds().length,mastered=Object.values(smartState.mastery).filter(isMastered).length,weekly=weeklyStats(),weekPercent=weeklyProgress(weekly.total,smartState.weeklyTarget);
  const map={wkHomeDueCount:due,wkHomeWeakCount:weak,wkHomeWeekValue:`${weekPercent}%`,wkDueCount:due,wkWeakCount:weak,wkMasteredCount:mastered,wkPerfectCount:smartState.perfectCount};
  Object.entries(map).forEach(([id,value])=>{const node=$("#"+id);if(node)node.textContent=String(value)});
  const mission=getMission(),done=Object.values(mission.completed).filter(Boolean).length,percent=Math.round(done/4*100);
  const headline=$("#wkMissionHeadline"),description=$("#wkMissionDescription"),progressText=$("#wkMissionProgressText"),progress=$("#wkMissionProgress"),percentNode=$("#wkMissionPercent");
  if(headline)headline.textContent=done===4?(lang()==="ja"?"今日のミッション完了！":"Misi hari ini selesai!"):(lang()==="ja"?"10分で記憶をしっかり保とう":"10 menit untuk menjaga ingatan tetap kuat");
  if(description)description.textContent=done===4?(lang()==="ja"?"よくできました。明日は新しい復習プランを用意します。":"Bagus. Besok Wikaru akan menyiapkan rencana review baru."):(lang()==="ja"?"期限の語彙から始め、短いチャレンジで締めくくります。":"Mulai dari kosakata yang sudah waktunya diulang, lalu tutup dengan tantangan singkat.");
  if(progressText)progressText.textContent=lang()==="ja"?`${done}/4 ステップ完了`:`${done} dari 4 langkah selesai`;
  if(percentNode)percentNode.textContent=`${percent}%`;if(progress){progress.setAttribute("aria-valuenow",String(percent));const fill=$("span",progress);if(fill)fill.style.width=`${percent}%`}
}
function missionMeta(){return[
  {key:"review",icon:"fa-clock-rotate-left",title:lang()==="ja"?"期限の復習":"Review terjadwal",copy:lang()==="ja"?"1・3・7日サイクルの語彙を復習します。":"Ulang kosakata yang masuk jadwal 1–3–7 hari.",action:lang()==="ja"?"復習開始":"Mulai review",mode:"study",direction:"idToJp"},
  {key:"weak",icon:"fa-seedling",title:lang()==="ja"?"弱点を強化":"Kuatkan kelemahan",copy:lang()==="ja"?"よく間違える語彙を優先します。":"Prioritaskan kata yang paling sering salah.",action:lang()==="ja"?"強化する":"Latih sekarang",mode:"study",direction:"jpToId"},
  {key:"listening",icon:"fa-headphones",title:lang()==="ja"?"聞き取り":"Latihan mendengar",copy:lang()==="ja"?"音を聞いて、答えを見る前に考えます。":"Dengarkan pelafalan sebelum membuka jawaban.",action:lang()==="ja"?"聞いてみる":"Mulai listening",mode:"listening",direction:"jpToId"},
  {key:"challenge",icon:"fa-bolt",title:lang()==="ja"?"今日の挑戦":"Tantangan singkat",copy:lang()==="ja"?"選ばれた語彙をテンポよく確認します。":"Tutup sesi dengan soal adaptif singkat.",action:lang()==="ja"?"挑戦する":"Mulai tantangan",mode:"speed",direction:"idToJp"}
]}
function renderMission(){const root=$("#wkMissionSteps");if(!root||!smartState)return;const mission=getMission();root.innerHTML=missionMeta().map((meta,index)=>{const complete=!!mission.completed[meta.key],count=mission.ids[meta.key]?.length||0;return`<article class="wk-mission-step ${complete?"completed":""}"><div class="wk-step-top"><span class="wk-step-number">${complete?'<i class="fa-solid fa-check"></i>':index+1}</span><span class="wk-step-status">${complete?(lang()==="ja"?"完了":"Selesai"):`${count} ${lang()==="ja"?"語":"kata"}`}</span></div><h4><i class="fa-solid ${meta.icon}" aria-hidden="true"></i> ${esc(meta.title)}</h4><p>${esc(meta.copy)}</p><button type="button" data-wk-mission-step="${meta.key}">${complete?(lang()==="ja"?"もう一度":"Ulangi"):`${esc(meta.action)}`}</button></article>`}).join("")}
function renderMistakes(){
  const root=$("#wkMistakeList");if(!root)return;
  const rows=Object.entries(smartState.mastery).filter(([,record])=>(Number(record.wrong)||0)>0).sort((a,b)=>(Number(b[1].wrong)-Number(a[1].wrong))||(Number(b[1].lastAt)-Number(a[1].lastAt))).slice(0,50);
  if(!rows.length){root.innerHTML=emptyMarkup("fa-book-open",lang()==="ja"?"間違いノートは空です":"Buku kesalahan masih kosong",lang()==="ja"?"クイズで間違えた語彙が自動でここに表示されます。":"Kosakata yang belum tepat saat kuis akan otomatis muncul di sini.");return}
  root.innerHTML=rows.map(([id,record])=>vocabRow(id,record,{primary:`${record.wrong}× ${lang()==="ja"?"不正解":"salah"}`,secondary:`${masteryAccuracy(record)}% ${lang()==="ja"?"正答率":"akurasi"}`,action:lang()==="ja"?"練習":"Latih"})).join("");
}
function renderReview(){
  const timeline=$("#wkReviewTimeline"),list=$("#wkReviewList");if(!timeline||!list)return;
  const groups=REVIEW_INTERVALS.map(day=>Object.values(smartState.mastery).filter(record=>Number(record.level)===({1:1,3:2,7:3}[day])).length);
  timeline.innerHTML=REVIEW_INTERVALS.map((day,index)=>`<article><span>${lang()==="ja"?`${day}日サイクル`:`Siklus ${day} hari`}</span><strong>${groups[index]}</strong><small>${lang()==="ja"?"登録された語彙":"kosakata terjadwal"}</small></article>`).join("");
  const rows=dueIds().slice(0,50).map(id=>[id,smartState.mastery[id]]);
  if(!rows.length){list.innerHTML=emptyMarkup("fa-circle-check",lang()==="ja"?"今日の復習は完了です":"Review hari ini sudah beres",lang()==="ja"?"期限が来た語彙はここに表示されます。":"Kosakata akan muncul kembali ketika jadwal review tiba.");return}
  list.innerHTML=rows.map(([id,record])=>vocabRow(id,record,{primary:lang()==="ja"?"復習期限":"Jatuh tempo",secondary:`${masteryAccuracy(record)}% ${lang()==="ja"?"正答率":"akurasi"}`,action:lang()==="ja"?"復習":"Review"})).join("");
}
function vocabRow(id,record,{primary,secondary,action}){const item=record.snapshot||snapshotForId(id),main=item.kanji||item.kana||id,reading=item.kanji&&item.kana?item.kana:item.romaji||"",meaning=item.indonesia||"-";return`<article class="wk-vocab-row"><div class="wk-vocab-main"><strong>${esc(main)}</strong>${reading?`<span>${esc(reading)}${item.romaji&&item.romaji!==reading?` · ${esc(item.romaji)}`:""}</span>`:""}<small>${esc(meaning)} · ${esc(item.chapter||`Bab ${item.chapterNumber||"-"}`)}</small></div><div class="wk-vocab-stat"><strong>${esc(primary)}</strong>${esc(secondary)}</div><div class="wk-vocab-stat"><strong>${isMastered(record)?(lang()==="ja"?"定着":"Kuat"):isWeak(record)?(lang()==="ja"?"要強化":"Perlu dilatih"):(lang()==="ja"?"学習中":"Berkembang")}</strong>${formatDue(record.dueAt)}</div><button class="wk-vocab-action" type="button" data-wk-train-id="${esc(id)}">${esc(action)}</button></article>`}
function emptyMarkup(icon,title,copy){return`<div class="wk-empty-state"><i class="fa-solid ${icon}" aria-hidden="true"></i><h4>${esc(title)}</h4><p>${esc(copy)}</p></div>`}

async function ensureAllData(reason=""){
  if(allDataPromise)return allDataPromise;
  const status=$("#wkSearchStatus");if(status)status.textContent=lang()==="ja"?"教材を準備中…":"Menyiapkan data…";
  allDataPromise=WIKARU_DATA.loadChapters(ALL_CHAPTERS).then(()=>{if(status)status.textContent=reason?`${VOCABULARY.length.toLocaleString(lang()==="ja"?"ja-JP":"id-ID")} ${lang()==="ja"?"件":"materi"}`:"";return VOCABULARY}).catch(error=>{allDataPromise=null;if(status)status.textContent=lang()==="ja"?"読み込み失敗":"Gagal memuat";throw error});
  return allDataPromise;
}
async function renderMastery(force=false){
  const root=$("#wkChapterMap");if(!root)return;
  root.innerHTML=emptyMarkup("fa-spinner fa-spin",lang()==="ja"?"課データを準備中":"Menyiapkan peta 50 bab",lang()==="ja"?"初回のみ少し時間がかかります。":"Proses ini hanya lebih lama pada pembukaan pertama.");
  try{if(force)allDataPromise=null;await ensureAllData();}catch(_){root.innerHTML=emptyMarkup("fa-triangle-exclamation",lang()==="ja"?"マップを読み込めません":"Peta belum dapat dimuat",lang()==="ja"?"接続を確認して再試行してください。":"Periksa koneksi lalu coba lagi.");return}
  root.innerHTML=ALL_CHAPTERS.map(chapter=>{
    const items=VOCABULARY.filter(item=>Number(item.chapterNumber)===chapter&&item.quizEnabled!==false&&item.id),ids=items.map(item=>String(item.id)),attempted=ids.filter(id=>smartState.mastery[id]?.seen),score=ids.length?Math.round(ids.reduce((sum,id)=>sum+masteryScore(smartState.mastery[id]),0)/ids.length):0,klass=score>=70?"strong":score>0||attempted.length?"learning":"new";
    return`<button class="wk-chapter ${klass}" type="button" data-wk-chapter="${chapter}" style="--wk-mastery:${score}%" aria-label="${lang()==="ja"?`第${chapter}課、習得度${score}%`:`Bab ${chapter}, penguasaan ${score}%`}"><strong>${lang()==="ja"?`第${chapter}課`:`Bab ${chapter}`}</strong><span>${score}%</span><small>${attempted.length}/${ids.length} ${lang()==="ja"?"語を練習":"kata dilatih"}</small></button>`
  }).join("");
}

function normalizeSearch(value){return String(value||"").toLowerCase().normalize("NFKC").replace(/[\s._/\\-]+/g," ").trim()}
async function searchAll(query){
  const root=$("#wkSearchResults"),status=$("#wkSearchStatus");if(!root)return;
  const term=normalizeSearch(query);if(term.length<2){root.hidden=true;root.innerHTML="";if(status)status.textContent="";return}
  root.hidden=false;root.innerHTML=emptyMarkup("fa-spinner fa-spin",lang()==="ja"?"検索中":"Mencari materi",lang()==="ja"?"第1～50課を確認しています。":"Memeriksa seluruh Bab 1–50.");
  try{await ensureAllData("search")}catch(_){return}
  const chapterMatch=term.match(/(?:bab|第)?\s*(\d{1,2})/i),chapter=chapterMatch?Number(chapterMatch[1]):0;
  const rows=VOCABULARY.filter(item=>{if(chapter&&Number(item.chapterNumber)!==chapter)return false;const hay=normalizeSearch([item.kanji,item.kana,item.romaji,item.indonesia,item.chapter,item.typeCategory,item.sectionCategory].join(" "));return term.split(" ").every(token=>hay.includes(token)||(/^(bab|第)$/.test(token)&&chapter))}).slice(0,30);
  if(status)status.textContent=lang()==="ja"?`${rows.length}件`:`${rows.length} hasil`;
  if(!rows.length){root.innerHTML=emptyMarkup("fa-magnifying-glass",lang()==="ja"?"見つかりませんでした":"Materi tidak ditemukan",lang()==="ja"?"別の表記や意味で検索してください。":"Coba kanji, kana, romaji, arti, atau nomor bab lain.");return}
  root.innerHTML=rows.map(item=>`<article class="wk-search-result"><div class="wk-search-result-main"><strong>${esc(item.kanji||item.kana||item.romaji)}</strong><small>${esc(item.kana||item.romaji)}${item.romaji?` · ${esc(item.romaji)}`:""} · ${esc(item.indonesia||"-")} · ${esc(item.chapter||"")}</small></div><div class="wk-search-result-actions"><button class="wk-mini-button" type="button" data-wk-speak="${esc(item.kanji||item.kana||"")}" aria-label="${lang()==="ja"?"音声を聞く":"Dengarkan"}"><i class="fa-solid fa-volume-high"></i></button><button class="wk-mini-button" type="button" data-wk-search-train="${esc(item.id)}" aria-label="${lang()==="ja"?"この語彙を練習":"Latih kosakata ini"}"><i class="fa-solid fa-play"></i></button></div></article>`).join("");
}

function scenarioLabel(item){const value=normalizeSearch(`${item.indonesia} ${item.exampleId} ${item.sectionCategory}`);if(/makan|minum|restoran|menu|食/.test(value))return lang()==="ja"?"レストラン":"Restoran";if(/stasiun|kereta|tiket|jalan|駅|電車/.test(value))return lang()==="ja"?"移動":"Perjalanan";if(/sekolah|guru|kelas|belajar|学校|先生/.test(value))return lang()==="ja"?"学校":"Sekolah";if(/kantor|perusahaan|pekerjaan|会社/.test(value))return lang()==="ja"?"職場":"Tempat kerja";if(/rumah|keluarga|家族/.test(value))return lang()==="ja"?"家庭":"Keluarga";return lang()==="ja"?"日常会話":"Percakapan sehari-hari"}
function startConversation(){
  const candidates=VOCABULARY.filter(item=>item.id&&(item.exampleId||item.exampleJa)&&(item.kanji||item.kana)&&item.quizEnabled!==false);
  if(candidates.length<8){notify(lang()==="ja"?"会話教材を準備中です。":"Materi percakapan belum cukup dimuat.");ensureAllData().then(startConversation);return}
  const selected=deterministic(candidates.map(item=>String(item.id)),`${todayKey()}:${Date.now()}`).slice(0,5).map(id=>VOCABULARY.find(item=>String(item.id)===id)).filter(Boolean);
  conversation={items:selected,index:0,correct:0,answers:[],locked:false};renderConversationQuestion();
}
function renderConversationWelcome(){const root=$("#wkConversationStage");if(!root)return;root.innerHTML=`<div class="wk-conversation-welcome"><i class="fa-regular fa-comments"></i><h4>${lang()==="ja"?"場面から日本語を選ぼう":"Pilih bahasa Jepang sesuai situasi"}</h4><p>${lang()==="ja"?"5つの短い場面を読み、最も合う語彙を選びます。答えたあと、例文の音声も確認できます。":"Baca lima situasi singkat, pilih kosakata paling sesuai, lalu dengarkan contoh kalimatnya."}</p></div>`}
function renderConversationQuestion(){
  const root=$("#wkConversationStage");if(!root||!conversation)return;
  if(conversation.index>=conversation.items.length)return finishConversation();
  const item=conversation.items[conversation.index],other=deterministic(VOCABULARY.filter(value=>value.id!==item.id&&(value.kanji||value.kana)&&value.quizEnabled!==false).map(value=>String(value.id)),`${item.id}:${conversation.index}`).slice(0,3).map(id=>VOCABULARY.find(value=>String(value.id)===id)),options=deterministic([item,...other],item.id);
  root.innerHTML=`<article class="wk-conversation-card"><div class="wk-conversation-top"><span class="wk-situation-tag"><i class="fa-solid fa-location-dot"></i>${esc(scenarioLabel(item))}</span><span class="wk-conversation-count">${conversation.index+1} / ${conversation.items.length}</span></div><div class="wk-conversation-line"><strong>${esc(item.exampleId||item.indonesia||"-")}</strong><span>${lang()==="ja"?"この場面に合う語彙を選んでください。":"Pilih kosakata Jepang yang paling sesuai dengan situasi ini."}</span></div><p class="wk-conversation-prompt">${lang()==="ja"?"最も適切なのはどれですか。":"Pilihan mana yang paling tepat?"}</p><div class="wk-conversation-options">${options.map(option=>`<button class="wk-conversation-option" type="button" data-wk-conversation-answer="${esc(option.id)}"><span class="jp">${esc(option.kanji||option.kana)}</span>${option.kanji&&option.kana?` <small>(${esc(option.kana)})</small>`:""}</button>`).join("")}</div><p class="wk-conversation-feedback" id="wkConversationFeedback" aria-live="polite"></p></article>`
}
function answerConversation(id){
  if(!conversation||conversation.locked)return;conversation.locked=true;
  const item=conversation.items[conversation.index],correct=String(id)===String(item.id);if(correct)conversation.correct++;
  conversation.answers.push({id:item.id,isCorrect:correct,userStatus:correct?"Benar":"Salah",...itemSnapshot(item)});
  $$('[data-wk-conversation-answer]').forEach(button=>{button.disabled=true;button.classList.toggle("correct",button.dataset.wkConversationAnswer===String(item.id));button.classList.toggle("wrong",button.dataset.wkConversationAnswer===String(id)&&!correct)});
  const feedback=$("#wkConversationFeedback");if(feedback)feedback.innerHTML=`<i class="fa-solid ${correct?"fa-circle-check":"fa-circle-xmark"}"></i> ${correct?(lang()==="ja"?"正解です。":"Benar."):(lang()==="ja"?`正解：${esc(item.kanji||item.kana)}`:`Jawaban tepat: ${esc(item.kanji||item.kana)}`)} <button class="wk-mini-button" type="button" data-wk-speak="${esc(item.exampleJa||item.kanji||item.kana)}" aria-label="${lang()==="ja"?"例文を聞く":"Dengarkan contoh"}"><i class="fa-solid fa-volume-high"></i></button>`;
  setTimeout(()=>{if(!conversation)return;conversation.index++;conversation.locked=false;renderConversationQuestion()},correct?1050:1450);
}
function finishConversation(){
  const root=$("#wkConversationStage");if(!root||!conversation)return;const total=conversation.items.length,score=Math.round(conversation.correct/Math.max(1,total)*100),finishedAt=new Date().toISOString();
  recordResult({localId:`conversation-${Date.now()}`,finishedAt,scorePercent:score,totalQuestions:total,correctCount:conversation.correct,wrongCount:total-conversation.correct,totalDuration:0,details:conversation.answers,learningContext:{kind:"conversation"}},{persist:true});
  smartState.conversationHistory.unshift({at:finishedAt,score,total});smartState.conversationHistory=smartState.conversationHistory.slice(0,60);save();
  root.innerHTML=`<div class="wk-conversation-result"><span>${lang()==="ja"?"会話シミュレーション完了":"Simulasi selesai"}</span><strong>${score}%</strong><h4>${score===100?(lang()==="ja"?"全問正解です！":"Sempurna!"):score>=80?(lang()==="ja"?"とてもよくできました":"Bagus sekali"):lang()==="ja"?"もう一度練習しましょう":"Mari ulangi lagi"}</h4><button class="btn" type="button" data-wk-action="start-conversation"><i class="fa-solid fa-rotate-right"></i>${lang()==="ja"?"もう一度":"Ulangi"}</button></div>`;conversation=null;
}

function chapterPerformance(){const groups={};for(const record of Object.values(smartState.mastery)){const chapter=Number(record.snapshot?.chapterNumber)||0;if(!chapter)continue;groups[chapter]??={seen:0,correct:0};groups[chapter].seen+=Number(record.seen)||0;groups[chapter].correct+=Number(record.correct)||0}return Object.entries(groups).map(([chapter,value])=>({chapter:Number(chapter),accuracy:value.seen?Math.round(value.correct/value.seen*100):0,seen:value.seen})).filter(item=>item.seen).sort((a,b)=>b.accuracy-a.accuracy)}
function renderSummary(){
  const root=$("#wkSummaryGrid"),weeklyRing=$("#wkWeeklyRing");if(!root||!weeklyRing)return;const stats=sevenDayStats(),weekly=weeklyStats(),performance=chapterPerformance(),strongest=performance[0],weakest=[...performance].sort((a,b)=>a.accuracy-b.accuracy)[0];
  const cards=[
    ["fa-layer-group",stats.total,lang()==="ja"?"解いた問題":"soal dikerjakan",`${stats.rows.length} ${lang()==="ja"?"セッション":"sesi"}`],
    ["fa-bullseye",`${stats.accuracy}%`,lang()==="ja"?"正答率":"akurasi",stats.total?`${stats.correct}/${stats.total}`:"—"],
    ["fa-clock",formatDuration(stats.duration),lang()==="ja"?"学習時間":"waktu belajar",`${stats.days} ${lang()==="ja"?"日活動":"hari aktif"}`],
    ["fa-star",strongest?`${lang()==="ja"?"第":"Bab "}${strongest.chapter}${lang()==="ja"?"課":""}`:"—",lang()==="ja"?"最も強い課":"bab terkuat",strongest?`${strongest.accuracy}%`:"—"]
  ];
  root.innerHTML=cards.map(([icon,value,label,small])=>`<article class="wk-summary-card"><i class="fa-solid ${icon}"></i><strong>${esc(value)}</strong><span>${esc(label)}</span><small>${esc(small)}</small></article>`).join("");
  const percent=weeklyProgress(weekly.total,smartState.weeklyTarget);weeklyRing.style.setProperty("--wk-week-progress",`${percent*3.6}deg`);$("#wkWeeklyPercent").textContent=`${percent}%`;$("#wkWeeklyHeadline").textContent=lang()==="ja"?`${weekly.total}/${smartState.weeklyTarget}問`:`${weekly.total} dari ${smartState.weeklyTarget} soal`;$("#wkWeeklyDescription").textContent=weekly.total>=smartState.weeklyTarget?(lang()==="ja"?"今週の目標を達成しました。無理のない範囲で復習を続けましょう。":"Target minggu ini tercapai. Lanjutkan review tanpa perlu memaksakan sesi panjang."):(lang()==="ja"?`あと${smartState.weeklyTarget-weekly.total}問で今週の目標です。`:`Tinggal ${smartState.weeklyTarget-weekly.total} soal lagi untuk mencapai target minggu ini.`);
  $$('[data-wk-target]').forEach(button=>button.classList.toggle("active",Number(button.dataset.wkTarget)===smartState.weeklyTarget));
  const recommendation=$("#wkNextRecommendation");if(recommendation){const due=dueIds().length,weak=weakIds().length;let title,copy,icon="fa-compass";if(due){title=lang()==="ja"?"まず期限の復習から":"Mulai dari review terjadwal";copy=lang()==="ja"?`${due}語が復習期限です。短い復習から始めましょう。`:`Ada ${due} kosakata yang sudah waktunya diulang.`}else if(weak){title=lang()==="ja"?"弱点を少し強化":"Kuatkan bagian yang masih lemah";copy=lang()==="ja"?`${weak}語を適応型練習で確認しましょう。`:`Latihan adaptif akan memprioritaskan ${weak} kosakata yang masih lemah.`}else if(weakest){title=lang()==="ja"?`第${weakest.chapter}課を復習`:`Ulang Bab ${weakest.chapter}`;copy=lang()==="ja"?`この課の正答率は${weakest.accuracy}%です。短い復習がおすすめです。`:`Akurasi bab ini ${weakest.accuracy}%. Sesi singkat akan membantu menguatkannya.`}else{title=lang()==="ja"?"最初のミッションを始めよう":"Mulai misi pertamamu";copy=lang()==="ja"?"最初の結果から、Wikaruが次の練習を調整します。":"Setelah hasil pertama, Wikaru akan mulai menyesuaikan rekomendasi."}recommendation.innerHTML=`<i class="fa-solid ${icon}"></i><div><h4>${esc(title)}</h4><p>${esc(copy)}</p></div>`}
}
function renderAll(){if(!smartState)return;applyCopy();renderOverview();renderMission();renderMistakes();renderReview();renderSummary();if(!conversation)renderConversationWelcome()}
function showTab(name){$$('[data-wk-tab]').forEach(button=>{const active=button.dataset.wkTab===name;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active))});$$('[data-wk-panel]').forEach(panel=>{const active=panel.dataset.wkPanel===name;panel.classList.toggle("active",active);panel.hidden=!active});if(name==="mastery")renderMastery();if(name==="conversation"&&!conversation)renderConversationWelcome();if(name==="summary")renderSummary()}
function toggleFocus(value=!document.body.classList.contains("wk-focus-mode")){document.body.classList.toggle("wk-focus-mode",value);const toggle=$("#wkFocusToggle"),exit=$("#wkFocusExit");if(toggle){toggle.setAttribute("aria-pressed",String(value));const icon=$("i",toggle);if(icon)icon.className=`fa-solid ${value?"fa-compress":"fa-expand"}`}if(exit)exit.hidden=!value}

async function chapterPractice(chapter){await ensureAllData();const items=VOCABULARY.filter(item=>Number(item.chapterNumber)===Number(chapter)&&item.quizEnabled!==false&&item.id),ranked=items.sort((a,b)=>masteryScore(smartState.mastery[a.id])-masteryScore(smartState.mastery[b.id])).slice(0,10).map(item=>String(item.id));startPlan({ids:ranked,kind:"chapter-mastery",mode:"study",direction:"idToJp"})}
function handleAction(action){const mission=getMission();if(action==="start-adaptive")return startPlan({ids:adaptiveIds(10),kind:"adaptive",mode:"study",direction:"idToJp"});if(action==="start-perfect")return startPlan({ids:adaptiveIds(10),kind:"perfect",missionStep:"challenge",mode:"speed",direction:"idToJp"});if(action==="review-mistakes")return startPlan({ids:weakIds().slice(0,20),kind:"mistakes",mode:"study",direction:"jpToId"});if(action==="start-review")return startPlan({ids:(dueIds().length?dueIds():mission.ids.review).slice(0,20),kind:"review",missionStep:"review",mode:"study",direction:"idToJp"});if(action==="load-mastery")return renderMastery(true);if(action==="start-conversation")return startConversation()}

function wire(){
  document.addEventListener("click",event=>{
    const tab=event.target.closest?.("[data-wk-tab]");if(tab){showTab(tab.dataset.wkTab);return}
    const action=event.target.closest?.("[data-wk-action]");if(action){handleAction(action.dataset.wkAction);return}
    const step=event.target.closest?.("[data-wk-mission-step]");if(step){const key=step.dataset.wkMissionStep,mission=getMission(),meta=missionMeta().find(item=>item.key===key);if(meta)startPlan({ids:mission.ids[key]||[],kind:`mission-${key}`,missionStep:key,mode:meta.mode,direction:meta.direction});return}
    const train=event.target.closest?.("[data-wk-train-id],[data-wk-search-train]");if(train){const id=train.dataset.wkTrainId||train.dataset.wkSearchTrain;startPlan({ids:[id],kind:"single-review",mode:"study",direction:"idToJp",shuffle:false});return}
    const speakButton=event.target.closest?.("[data-wk-speak]");if(speakButton){window.WIKARU_APP?.speak?.(speakButton.dataset.wkSpeak,"ja-JP");return}
    const chapter=event.target.closest?.("[data-wk-chapter]");if(chapter){chapterPractice(Number(chapter.dataset.wkChapter));return}
    const answer=event.target.closest?.("[data-wk-conversation-answer]");if(answer){answerConversation(answer.dataset.wkConversationAnswer);return}
    const target=event.target.closest?.("[data-wk-target]");if(target){smartState.weeklyTarget=Number(target.dataset.wkTarget);save();renderOverview();renderSummary();return}
    if(event.target.closest?.("#wkFocusToggle"))toggleFocus();if(event.target.closest?.("#wkFocusExit"))toggleFocus(false);
    if(event.target.closest?.('[data-page="learning"]'))setTimeout(()=>{syncUser();renderAll()},0);
  });
  $("#wkSmartSearchInput")?.addEventListener("input",event=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchAll(event.target.value),220)});
  document.addEventListener("wikaru:quiz-finished",event=>{syncUser();recordResult(event.detail?.result||null)});
  document.addEventListener("wikaru:language-changed",()=>requestAnimationFrame(renderAll));
  $("#saveLogin")?.addEventListener("click",()=>setTimeout(()=>{syncUser(true);if(pendingAction&&window.WIKARU_APP?.getSession()?.username){const action=pendingAction;pendingAction=null;startPlan(action)}},500));
  $("#logoutBtn")?.addEventListener("click",()=>setTimeout(()=>syncUser(true),100));
  window.addEventListener("keydown",event=>{if(event.key==="Escape"&&document.body.classList.contains("wk-focus-mode")){event.preventDefault();toggleFocus(false)}});
  const userNode=$("#userMenuText");if(userNode)new MutationObserver(()=>syncUser()).observe(userNode,{childList:true,characterData:true,subtree:true});
  const learning=$("#learningPage");if(learning){pageObserver=new MutationObserver(()=>{if(learning.classList.contains("active")){syncUser();renderAll()}});pageObserver.observe(learning,{attributes:true,attributeFilter:["class"]})}
}

function init(){syncUser(true);wire();renderAll();document.documentElement.dataset.wikaruLearningHub="ready";document.dispatchEvent(new CustomEvent("wikaru:learning-hub-ready"))}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
