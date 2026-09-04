import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const names=["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"];
const production=["index.html","version.json","sw.js","sw-v35.js","assets/js/wikaru-icons.js","assets/js/deploy-v35.js","assets/js/cache-reset-v35.js","assets/js/app.js","assets/js/quiz-guide.js","assets/js/question-page-final.js","assets/css/question-page-final.css","assets/css/visual-v38.css"].map(read).join("\n");
assert(production.includes("assets/icons/wikaru"),"Runtime belum menunjuk canonical Wikaru icon system");
assert(production.includes("20260903-v39u1"),"Cache bust ikon v39u1 belum aktif");
assert(production.includes("wikaru-static-v39u1-20260903"),"Service worker v39u1 belum aktif");
const hashes=new Set();
for(const name of names){
  for(const size of [64,32]){
    const file=path.join(root,`assets/icons/wikaru/${name}-${size}.png`);
    const png=fs.readFileSync(file);
    assert(png.subarray(1,4).toString()==="PNG",`Format PNG ikon salah: ${name}-${size}`);
    assert(png.readUInt32BE(16)===size&&png.readUInt32BE(20)===size,`Dimensi ikon salah: ${name}-${size}`);
    assert(png[25]===6,`Kanal alpha ikon hilang: ${name}-${size}`);
    if(size===64) hashes.add(crypto.createHash("sha256").update(png).digest("hex"));
  }
  assert(fs.existsSync(path.join(root,`assets/icons/wikaru/${name}.svg`)),`SVG ikon hilang: ${name}`);
}
assert(hashes.size===names.length,"Ada ikon runtime 64px yang terduplikasi");
console.log(JSON.stringify({status:"PASS",release:"v39u1",icons:16,svg:16,png64:16,png32:16,uniqueRenders:16,cacheBust:"20260903-v39u1"}));
