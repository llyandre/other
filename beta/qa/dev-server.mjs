import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index>=0&&args[index+1]?args[index+1]:fallback};
const host=option("--host","0.0.0.0");
const port=Number(option("--port","4173"));
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".webp":"image/webp",".webmanifest":"application/manifest+json"};
const server=http.createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,"http://localhost").pathname);
    const relative=pathname==="/"?"index.html":pathname.replace(/^\/+/,"");
    const target=path.resolve(root,relative);
    if(!target.startsWith(root+path.sep))throw new Error("invalid path");
    const bytes=await fs.readFile(target);
    response.writeHead(200,{"content-type":mime[path.extname(target)]||"application/octet-stream","cache-control":"no-store"});
    response.end(bytes);
  }catch(_){response.writeHead(404,{"content-type":"text/plain; charset=utf-8"});response.end("Not found")}
});
server.listen(port,host,()=>console.log(`Wikaru preview ready on ${host}:${port}`));
for(const signal of["SIGINT","SIGTERM"])process.on(signal,()=>server.close(()=>process.exit(0)));
