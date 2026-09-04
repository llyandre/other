import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const iconNames = ["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"];
const cursorStates = ["normal","happy","hover","click","loading","typing","success","sleep"];
const mascotExpressions = ["welcome","sad-week","sad-month","sad-year","pass-kkm","perfect","streak","rest-angry"];
const regions = ["jembrana","singaraja","badung","umum"];

function paeth(a,b,c){
  const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
  return pa<=pb && pa<=pc ? a : pb<=pc ? b : c;
}

function decodeRgbaPng(relative){
  const file=path.join(root,relative);
  assert(fs.existsSync(file),`Aset hilang: ${relative}`);
  const bytes=fs.readFileSync(file);
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Bukan PNG valid: ${relative}`);
  let offset=8, width=0, height=0, bitDepth=0, colorType=0, interlace=0;
  const idat=[];
  while(offset+12<=bytes.length){
    const length=bytes.readUInt32BE(offset); const type=bytes.toString("ascii",offset+4,offset+8);
    const data=bytes.subarray(offset+8,offset+8+length); offset+=12+length;
    if(type==="IHDR"){
      width=data.readUInt32BE(0); height=data.readUInt32BE(4); bitDepth=data[8]; colorType=data[9]; interlace=data[12];
    } else if(type==="IDAT") idat.push(data);
    else if(type==="IEND") break;
  }
  assert(width>0 && height>0,`IHDR PNG rusak: ${relative}`);
  assert(bitDepth===8 && colorType===6 && interlace===0,`PNG harus RGBA 8-bit non-interlaced: ${relative}`);
  const bpp=4, stride=width*bpp;
  const inflated=zlib.inflateSync(Buffer.concat(idat));
  assert(inflated.length===height*(stride+1),`Data PNG tidak sesuai dimensi: ${relative}`);
  const raw=Buffer.alloc(width*height*bpp);
  let src=0;
  for(let y=0;y<height;y++){
    const filter=inflated[src++];
    const rowStart=y*stride;
    for(let x=0;x<stride;x++){
      const val=inflated[src++];
      const left=x>=bpp ? raw[rowStart+x-bpp] : 0;
      const up=y>0 ? raw[rowStart-stride+x] : 0;
      const upLeft=y>0 && x>=bpp ? raw[rowStart-stride+x-bpp] : 0;
      let out;
      if(filter===0) out=val;
      else if(filter===1) out=(val+left)&255;
      else if(filter===2) out=(val+up)&255;
      else if(filter===3) out=(val+Math.floor((left+up)/2))&255;
      else if(filter===4) out=(val+paeth(left,up,upLeft))&255;
      else throw new Error(`Filter PNG ${filter} tidak didukung: ${relative}`);
      raw[rowStart+x]=out;
    }
  }
  return {width,height,data:raw};
}

function assertTransparent(relative,width,height){
  const decoded=decodeRgbaPng(relative);
  assert(decoded.width===width && decoded.height===height,`Dimensi salah: ${relative} (${decoded.width}x${decoded.height})`);
  const alphaAt=(x,y)=>decoded.data[(y*decoded.width+x)*4+3];
  for(const [x,y] of [[0,0],[width-1,0],[0,height-1],[width-1,height-1]]) assert(alphaAt(x,y)===0,`Sudut tidak transparan: ${relative}`);
  let visible=false;
  for(let index=3;index<decoded.data.length;index+=4){if(decoded.data[index]>8){visible=true;break;}}
  assert(visible,`Aset kosong: ${relative}`);
}

for(const name of iconNames){
  assert(fs.existsSync(path.join(root,`assets/icons/wikaru/${name}.svg`)),`SVG Wikaru hilang: ${name}`);
  assertTransparent(`assets/icons/wikaru/${name}-64.png`,64,64);
  assertTransparent(`assets/icons/wikaru/${name}-32.png`,32,32);
}
assertTransparent("assets/generated/seal-guide-clean-v39u1.png",512,512);
for(const state of cursorStates) assertTransparent(`assets/cursor/seal-cursor-${state}-v38.png`,56,56);
for(const expression of mascotExpressions) assertTransparent(`assets/mascot/v38/seal-${expression}-v38.png`,512,512);
for(const region of regions){
  for(const size of [128,64,32]) assertTransparent(`assets/region-icons/${region}-${size}.png`,size,size);
}

const visualCss=fs.readFileSync(path.join(root,"assets/css/visual-v38.css"),"utf8");
assert(/grid-template-columns:100px minmax\(0,1fr\)/.test(visualCss),"Kolom maskot dan teks panduan belum dipisahkan");
assert(/\.wk-quiz-guide-mascot img[\s\S]*position:static!important/.test(visualCss),"Maskot panduan masih dapat menimpa judul");
assert(/\.wk-quiz-guide-mascot[\s\S]*background:none!important[\s\S]*background-color:transparent!important/.test(visualCss),"Latar pembungkus maskot belum transparan");
assert(/#groupGrid \.region-icon-shell[\s\S]*background:none!important/.test(visualCss),"Backplate ikon wilayah belum dinetralkan");

console.log(JSON.stringify({
  status:"PASS",release:"v39u1",icons:iconNames.length,iconSizes:[64,32],cursorStates:cursorStates.length,
  mascotExpressions:mascotExpressions.length+1,regions:regions.length,regionSizes:[128,64,32],transparentCorners:true,
  guideCollisionProtected:true,regionBackplateRemoved:true,pngDecoder:"node-zlib"
}));
