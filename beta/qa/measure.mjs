import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sourcePath=process.argv[2]?path.resolve(process.argv[2]):null;
const files=[
  "index.html","assets/css/app.css","assets/css/asset-system.css","assets/css/mascot.css","assets/css/learning-hub.css","assets/css/cursor-v35.css","assets/css/deploy-v35.css","assets/css/visual-v38.css","assets/css/quiz-guide.css","assets/css/app-management.css","assets/css/wikaru-icons.css","assets/css/account-offline.css","assets/css/question-page-final.css",
  "assets/js/critical.js","assets/js/enhancements.js","assets/js/data-loader.js","assets/js/pdf-reports.js","assets/js/supabase-client.js","assets/js/app.js","assets/js/profile-assets.js","assets/js/mascot.js","assets/js/learning-engine.js","assets/js/learning-hub.js","assets/js/cursor-v35.js","assets/js/deploy-v35.js","assets/js/quiz-guide.js","assets/js/app-management.js","assets/js/wikaru-icons.js","assets/js/runtime-config.js","assets/js/account-offline.js","assets/js/question-page-final.js",
  ...["normal","happy","hover","click","loading","typing","success","sleep"].map(state=>`assets/cursor/seal-cursor-${state}-v38.png`),
  ...["guide","welcome","sad-week","sad-month","sad-year","pass-kkm","perfect","streak","rest-angry"].map(expression=>`assets/mascot/v38/seal-${expression}-v38.png`),
  ...["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"].map(name=>`assets/icons/kotoba-v39/${name}.png`),
  "assets/region/jembrana.png","assets/region/singaraja.png","assets/region/badung.png","assets/region/umum.png","assets/onboarding/wikaru-desktop.webp","assets/onboarding/wikaru-ipad.webp","assets/onboarding/wikaru-mobile.webp","data/manifest.json","data/reference-static.json","data/bab-31.json","manifest.webmanifest"
];
const metrics=files.map(file=>{
  const bytes=fs.readFileSync(path.join(root,file));
  return {file,raw:bytes.length,gzip:zlib.gzipSync(bytes,{level:9}).length,brotli:zlib.brotliCompressSync(bytes,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}).length};
});
const sum=key=>metrics.reduce((total,row)=>total+row[key],0);
const report={
  generatedAt:new Date().toISOString(),
  initialSelfHosted:{raw:sum("raw"),gzip:sum("gzip"),brotli:sum("brotli"),files:metrics},
  sourceMonolith:null,
  reductions:null,
  scoringNote:"Engineering audit estimate; bukan hasil Lighthouse browser."
};
if(sourcePath&&fs.existsSync(sourcePath)){
  const bytes=fs.readFileSync(sourcePath);
  report.sourceMonolith={raw:bytes.length,gzip:zlib.gzipSync(bytes,{level:9}).length,brotli:zlib.brotliCompressSync(bytes,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}).length};
  report.reductions={
    rawPercent:Number((100*(1-report.initialSelfHosted.raw/report.sourceMonolith.raw)).toFixed(2)),
    gzipPercent:Number((100*(1-report.initialSelfHosted.gzip/report.sourceMonolith.gzip)).toFixed(2)),
    brotliPercent:Number((100*(1-report.initialSelfHosted.brotli/report.sourceMonolith.brotli)).toFixed(2))
  };
}
fs.writeFileSync(path.join(root,"qa/performance-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
