import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const js=read("assets/js/cursor-v35.js");
const css=read("assets/css/cursor-v35.css");
const states=["normal","happy","hover","click","loading","typing","success","sleep"];

assert(js.includes("wikaru_cursor_github_v38"),"Preferensi cursor v36 hilang");
assert(js.includes('(hover:hover) and (pointer:fine), (any-hover:hover) and (any-pointer:fine)'),"Deteksi fine pointer tidak lengkap");
assert(js.includes("navigator.maxTouchPoints > 1"),"Proteksi perangkat touch-first hilang");
assert(js.includes('enabled = saved !== "0"'),"Cursor harus aktif otomatis dan dapat di-opt-out");
assert(!/setInterval\s*\(/.test(js),"Cursor tidak boleh memakai polling interval");
for(const state of states){
  const file=`assets/cursor/seal-cursor-${state}-v38.png`;
  const bytes=fs.readFileSync(path.join(root,file));
  assert(bytes.subarray(1,4).toString()==="PNG",`Cursor ${state} bukan PNG`);
  assert(bytes.readUInt32BE(16)===56&&bytes.readUInt32BE(20)===56,`Cursor ${state} harus 56x56`);
  assert([4,6].includes(bytes[25]),`Cursor ${state} tidak transparan`);
  assert(css.includes(`seal-cursor-${state}-v38.png`),`State cursor ${state} belum diterapkan`);
}
assert(/@media \(any-hover:none\)/.test(css),"Cursor tidak dinonaktifkan pada perangkat sentuh");
console.log(JSON.stringify({status:"PASS",defaultDesktopMouseVisible:true,userOptOut:true,touchFirstDisabled:true,states,format:"transparent PNG",size:"56x56"}));
