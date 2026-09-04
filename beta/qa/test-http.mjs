import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const prefixes=["/wikaru-test/","/"];
const mime={".html":"text/html",".css":"text/css",".js":"text/javascript",".json":"application/json",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".webp":"image/webp",".png":"image/png"};
const server=http.createServer(async(req,res)=>{
  try{
    const requestPath=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    const prefix=prefixes.find(value=>requestPath.startsWith(value))||"/";
    let relative=requestPath.slice(prefix.length);
    if(!relative||relative.endsWith("/"))relative+="index.html";
    const target=path.resolve(root,relative);
    if(target!==root&&!target.startsWith(root+path.sep))throw new Error("Path traversal");
    const bytes=await fs.readFile(target);
    res.writeHead(200,{"content-type":mime[path.extname(target)]||"application/octet-stream","cache-control":"no-store"});
    res.end(bytes);
  }catch{
    res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");
  }
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const address=server.address();
const base=`http://127.0.0.1:${address.port}`;
const core=[
  "index.html","refresh-v35.html","version.json","manifest.webmanifest","sw.js","sw-v35.js",
  "assets/css/app.css","assets/css/asset-system.css","assets/css/learning-hub.css","assets/css/quiz-guide.css","assets/css/app-management.css","assets/css/wikaru-icons.css","assets/css/question-page-final.css","assets/css/deploy-v35.css","assets/css/cursor-v35.css","assets/css/visual-v38.css",
  "assets/js/critical.js","assets/js/enhancements.js","assets/js/data-loader.js","assets/js/supabase-client.js","assets/js/app.js","assets/js/quiz-guide.js","assets/js/app-management.js","assets/js/learning-engine.js","assets/js/learning-hub.js","assets/js/wikaru-icons.js","assets/js/question-page-final.js","assets/js/deploy-v35.js","assets/js/cursor-v35.js","assets/js/cache-reset-v35.js",
  ...["jembrana","singaraja","badung","umum"].flatMap(region=>[128,64,32].map(size=>`assets/region-icons/${region}-${size}.png`)),
  "assets/generated/seal-guide-clean-v39u1.png",
  ...["normal","happy","hover","click","loading","typing","success","sleep"].map(state=>`assets/cursor/seal-cursor-${state}-v38.png`),
  ...["guide","welcome","sad-week","sad-month","sad-year","pass-kkm","perfect","streak","rest-angry"].map(expression=>`assets/mascot/v38/seal-${expression}-v38.png`),
  ...["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"].flatMap(name=>[`assets/icons/wikaru/${name}.svg`,`assets/icons/wikaru/${name}-64.png`,`assets/icons/wikaru/${name}-32.png`]),
  "assets/icons/wikaru/manifest.json",
  "assets/onboarding/wikaru-desktop.webp","assets/onboarding/wikaru-ipad.webp","assets/onboarding/wikaru-mobile.webp",
  "data/manifest.json","data/reference-static.json","supabase/schema.sql","docs/SUPABASE_SETUP.md"
];
const chapters=Array.from({length:50},(_,index)=>`data/bab-${String(index+1).padStart(2,"0")}.json`);
const embedded=Object.keys(JSON.parse(await fs.readFile(path.join(root,"data/embedded-assets.json"),"utf8"))).map(file=>`assets/media/${file}`);
const listFiles=async(directory,extension)=>{
  try{return (await fs.readdir(path.join(root,directory))).filter(file=>file.endsWith(extension)).map(file=>`${directory}/${file}`)}
  catch(error){if(error?.code==="ENOENT")return[];throw error}
};
const profileFiles=await listFiles("assets/profile",".webp");
const profileDefaults=["assets/profile/default-account.svg"];
const atmosphereFiles=await listFiles("assets/atmosphere",".webp");
const horizonFiles=await listFiles("assets/horizon",".webp");
const regionFiles=await listFiles("assets/region-icons",".png");
core.push("assets/css/asset-system.css","assets/js/profile-assets.js","qa/profile-preview.html");
const targets=[...core,...chapters,...embedded,...profileFiles,...profileDefaults,...atmosphereFiles,...horizonFiles,...regionFiles];

try{
  for(const prefix of prefixes){
    for(const target of targets){
      const response=await fetch(`${base}${prefix}${target}`);
      if(!response.ok)throw new Error(`HTTP ${response.status}: ${prefix}${target}`);
      await response.arrayBuffer();
    }
    const html=await (await fetch(`${base}${prefix}`)).text();
    for(const match of html.matchAll(/(?:src|href)=["'](\.\/[^"']+)["']/g)){
      const response=await fetch(new URL(match[1],`${base}${prefix}`));
      if(!response.ok)throw new Error(`Referensi HTML rusak pada ${prefix}: ${match[1]}`);
    }
  }
  console.log(JSON.stringify({status:"PASS",rootPath:true,githubPagesSubfolder:true,coreFiles:core.length,chapters:chapters.length,embeddedAssets:embedded.length,profileAssets:profileFiles.length,profileDefaults:profileDefaults.length,legacyAtmosphereAssets:atmosphereFiles.length,horizonAssets:horizonFiles.length,regionAssets:regionFiles.length,httpRequests:(targets.length+1)*prefixes.length}));
}finally{
  await new Promise(resolve=>server.close(resolve));
}
