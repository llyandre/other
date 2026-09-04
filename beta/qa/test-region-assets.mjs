import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const regions=["badung","jembrana","singaraja","umum"];
const sizes=[128,64,32];
for(const region of regions){
  for(const size of sizes){
    const file=`${region}-${size}.png`;
    const target=path.join(root,"assets/region-icons",file);
    assert(fs.existsSync(target),`Aset wilayah PNG hilang: ${file}`);
    const bytes=fs.readFileSync(target);
    assert(bytes.length>800&&bytes.subarray(1,4).toString()==="PNG",`Format PNG rusak: ${file}`);
    assert(bytes.readUInt32BE(16)===size&&bytes.readUInt32BE(20)===size,`Dimensi wilayah salah: ${file}`);
    assert([4,6].includes(bytes[25]),`Aset wilayah harus transparan: ${file}`);
  }
}
const app=fs.readFileSync(path.join(root,"assets/js/app.js"),"utf8");
const css=fs.readFileSync(path.join(root,"assets/css/visual-v38.css"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
assert(app.includes('const REGION_ASSET_BASE="./assets/region-icons/"'),"Base path aset wilayah v39u1 tidak terpasang");
assert(app.includes('class="wikaru-region-image"')&&app.includes('srcset='),"Gambar wilayah responsif tidak dirender");
assert(app.includes('data-group="${esc(g.name)}"'),"Nilai grup tidak dipertahankan");
for(const region of regions){
  assert(app.includes(`asset:"${region}"`),`Mapping wilayah hilang: ${region}`);
  assert(sw.includes(`"${region}"`),`Nama wilayah tidak masuk daftar cache: ${region}`);
}
assert(sw.includes('[64,128].map(size=>`./assets/region-icons/${name}-${size}.png`)'),"Varian runtime 64/128 tidak masuk cache");
assert(css.includes("region artwork follows the approved open, transparent reference style"),"Final reset ikon wilayah belum aktif");
console.log(JSON.stringify({status:"PASS",regions:4,sizes:[128,64,32],transparent:true,responsiveSrcset:true,approvedMapping:true}));
