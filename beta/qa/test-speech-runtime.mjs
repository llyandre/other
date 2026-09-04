import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const full=fs.readFileSync(path.join(root,"assets/js/enhancements.js"),"utf8");
const start=full.indexOf("/* source-script: wikaru-progress-audio-natural-v7 */");
const end=full.indexOf("  function vocabById",start);
if(start<0||end<0)throw new Error("Modul audio v7 tidak ditemukan");
const source=full.slice(start,end)+"\n})();";
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const store=new Map();
const events=[];
const utterances=[];
class Utterance{
  constructor(text){this.text=text;this.lang="";this.rate=1;this.pitch=1;this.volume=1;this.voice=null}
}
const voices=[
  {name:"Microsoft Nanami Online (Natural)",lang:"ja-JP",localService:false,default:true},
  {name:"Haruka Enhanced",lang:"ja-JP",localService:true,default:false},
  {name:"Microsoft Keita Online (Natural)",lang:"ja-JP",localService:false,default:false},
  {name:"Ichiro Premium",lang:"ja-JP",localService:true,default:false}
];
const synth={
  getVoices:()=>voices,
  cancel(){},
  speak(utterance){
    utterances.push(utterance);
    utterance.onstart?.({type:"start"});
    setTimeout(()=>utterance.onend?.({type:"end"}),0);
  }
};
const context={
  console,Date,Array,String,RegExp,Math,JSON,Set,Map,Object,Promise,
  localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))},
  document:{querySelector:()=>null,dispatchEvent:event=>{events.push(event);return true}},
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}},
  SpeechSynthesisUtterance:Utterance,
  speechSynthesis:synth,
  setTimeout,clearTimeout,
  window:null
};
context.window=context;
vm.runInNewContext(source,context,{filename:"audio-v7.js"});

const expected={
  hanamama:{voice:"Nanami",rate:.84,pitch:.96},
  momokawaii:{voice:"Haruka",rate:.96,pitch:1.12},
  renikebo:{voice:"Keita",rate:.88,pitch:.84},
  kaitodandy:{voice:"Ichiro",rate:.78,pitch:.72}
};
let index=0;
for(const [preset,profile] of Object.entries(expected)){
  store.set("wikaru_voice_preset",preset);
  const started=context.WikaruAudioController.speak(`日本語単語${index++}`,'ja-JP',{kind:'vocab'});
  assert(started===true,`${preset} tidak memulai audio`);
  await new Promise(resolve=>setTimeout(resolve,70));
  const utterance=utterances.at(-1);
  assert(utterance.lang==='ja-JP',`${preset} tidak memakai locale ja-JP`);
  assert(utterance.voice?.name.includes(profile.voice),`${preset} memilih voice yang salah: ${utterance.voice?.name}`);
  assert(utterance.rate===profile.rate&&utterance.pitch===profile.pitch,`${preset} rate/pitch tidak sesuai personifikasi`);
}

assert(events.filter(event=>event.type==='wikaru:audio-started').length===4,"Event audio-started tidak lengkap");
assert(events.filter(event=>event.type==='wikaru:audio-ended').length===4,"Event audio-ended tidak lengkap");
assert(events.every(event=>event.detail?.lang==='ja-JP'),"Lifecycle audio kehilangan locale Jepang");

console.log(JSON.stringify({status:"PASS",personas:Object.keys(expected),nativeLocale:"ja-JP",voiceSelection:true,lifecycleEvents:{started:4,ended:4}}));
