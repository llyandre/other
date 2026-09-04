import fs from "node:fs/promises";
import path from "node:path";
import sharp from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const root=path.resolve(import.meta.dirname,"..");
const previews=path.join(root,"output","previews");
const base=path.join(previews,"Wikaru_v30_Quiz_After.png");
const v33=path.join(previews,"v33","Wikaru_v33_Quiz_Responsive_Preview.jpg");
const output=path.join(previews,"v33","Wikaru_v33_Quiz_Final_Preview.jpg");

await fs.access(base);
await fs.access(v33);

// Preserve the proven Japanese typography from the earlier render, while replacing
// the v33 header and the exact desktop mascot crop from the new reference-matched render.
const header=await sharp(v33).extract({left:0,top:0,width:1800,height:150}).toBuffer();
const mascotCrop=await sharp(v33).extract({left:945,top:925,width:170,height:145}).toBuffer();

await sharp(base)
  .composite([
    {input:header,left:0,top:0},
    {input:mascotCrop,left:945,top:925}
  ])
  .flatten({background:"#EEF3FA"})
  .jpeg({quality:94,chromaSubsampling:"4:4:4"})
  .toFile(output);

console.log(JSON.stringify({status:"PASS",output}));
