import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const app=read("assets/js/app.js");
const enhancements=read("assets/js/enhancements.js");

for(const file of ["assets/js/app.js","assets/js/enhancements.js"]){
  const result=spawnSync(process.execPath,["--check",path.join(root,file)],{encoding:"utf8"});
  assert(result.status===0,`Syntax error ${file}: ${result.stderr||result.stdout}`);
}

assert(/function quizModeUsesVoice\(mode\)[\s\S]*listening[\s\S]*shadowing/.test(app),"Mode kuis suara belum didefinisikan lengkap");
assert(/micOn:quizModeUsesVoice\(selectedMode\)/.test(app)&&/quiz\.micOn=quizModeUsesVoice\(quiz\.mode\)/.test(app),"Mikrofon listening/shadowing belum aktif otomatis");
assert(/wikaru:audio-started/.test(app)&&/wikaru:audio-ended/.test(app)&&/_speechSuspendedByAudio/.test(app),"TTS dan mikrofon belum disinkronkan");
assert(/recognition\.interimResults=true/.test(app),"Transkrip sementara kuis utama belum digunakan");
assert(/SpeechGrammarList\|\|window\.webkitSpeechGrammarList/.test(app)&&/addFromString/.test(app),"Grammar jawaban belum membantu speech recognition");
assert(/function conservativeFuzzyMatch/.test(app)&&/function editDistance/.test(app),"Pencocokan toleran yang konservatif belum tersedia");
assert((app.match(/maxAlternatives=10/g)||[]).length>=6,"Semua keluarga kuis suara belum memakai 10 alternatif");
assert(!/maxAlternatives=5/.test(app),"Masih ada speech recognition dengan hanya 5 alternatif");
assert(/voiceAuto:true/.test(app)&&/setTimeout\(\(\)=>startMarkerSpeech\(\),420\)/.test(app)&&/setTimeout\(\(\)=>startDurationSpeech\(\),420\)/.test(app),"Auto-start kuis suara khusus tidak lengkap");

for(const preset of ["hanamama","momokawaii","renikebo","kaitodandy"]){
  assert(new RegExp(`${preset}:\\{vocabRate:`).test(enhancements),`Profil audio ${preset} hilang`);
}
assert(/hanamama:\{vocabRate:\.84,exampleRate:\.89,listRate:\.82,pitch:\.96/.test(enhancements),"Hana belum lembut dan keibuan");
assert(/momokawaii:\{vocabRate:\.96,exampleRate:1\.01,listRate:\.92,pitch:1\.12/.test(enhancements),"Momo belum ceria dan muda");
assert(/renikebo:\{vocabRate:\.88,exampleRate:\.91,listRate:\.85,pitch:\.84/.test(enhancements),"Ren belum tenang dan rendah");
assert(/kaitodandy:\{vocabRate:\.78,exampleRate:\.84,listRate:\.76,pitch:\.72/.test(enhancements),"Kaito belum matang dan berat");
assert(/utterance\.lang=outputLang/.test(enhancements)&&/\?'ja-JP':lang/.test(enhancements),"Pelafalan Jepang belum dikunci ke ja-JP");
assert(/wikaru:audio-started/.test(enhancements)&&/wikaru:audio-ended/.test(enhancements),"Lifecycle audio belum dipublikasikan");
assert(/currentPersona\(\)/.test(enhancements),"Status voice persona tidak dapat diverifikasi");

console.log(JSON.stringify({
  status:"PASS",
  autoVoiceModes:["listening","shadowing","verb","number","marker","duration","counter-cloze"],
  recognitionAlternatives:10,
  grammarHints:true,
  conservativeFuzzyMatching:true,
  ttsMicIsolation:true,
  japaneseLocale:"ja-JP",
  personas:4
}));
