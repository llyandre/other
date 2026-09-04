const CACHE_NAME="wikaru-static-v39u1-20260903";
const OFFLINE_CHAPTER_CACHE="wikaru-offline-chapters-v1";
const CURSOR_STATES=["normal","happy","hover","click","loading","typing","success","sleep"];
const MASCOT_EXPRESSIONS=["welcome","sad-week","sad-month","sad-year","pass-kkm","perfect","streak","rest-angry"];
const KOTOBA_ICONS=["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"];
const REGIONS=["jembrana","singaraja","badung","umum"];
const SHELL=[
  "./","./index.html","./refresh-v35.html","./version.json","./manifest.webmanifest",
  "./assets/css/app.css","./assets/css/asset-system.css","./assets/css/mascot.css","./assets/css/cursor-v35.css","./assets/css/quiz-guide.css","./assets/css/app-management.css","./assets/css/learning-hub.css","./assets/css/wikaru-icons.css","./assets/css/deploy-v35.css","./assets/css/visual-v38.css","./assets/css/account-offline.css","./assets/css/question-page-final.css","./assets/css/professional-v32.css","./assets/css/professional-v33.css",
  "./assets/js/critical.js","./assets/js/data-loader.js","./assets/js/pdf-reports.js","./assets/js/runtime-config.js","./assets/js/account-offline.js","./assets/js/question-page-final.js","./assets/js/supabase-client.js","./assets/js/app.js","./assets/js/enhancements.js","./assets/js/profile-assets.js","./assets/js/mascot.js","./assets/js/cursor-v35.js","./assets/js/cache-reset-v35.js","./assets/js/quiz-guide.js","./assets/js/app-management.js","./assets/js/learning-engine.js","./assets/js/learning-hub.js","./assets/js/wikaru-icons.js","./assets/js/experience-v33.js","./assets/js/deploy-v35.js",
  "./assets/profile/default-account.svg",
  ...CURSOR_STATES.map(state=>`./assets/cursor/seal-cursor-${state}-v38.png`),
  "./assets/generated/seal-guide-clean-v39u1.png",
  ...MASCOT_EXPRESSIONS.map(expression=>`./assets/mascot/v38/seal-${expression}-v38.png`),
  "./assets/onboarding/wikaru-desktop.webp","./assets/onboarding/wikaru-ipad.webp","./assets/onboarding/wikaru-mobile.webp",
  ...REGIONS.flatMap(name=>[64,128].map(size=>`./assets/region-icons/${name}-${size}.png`)),
  "./assets/icons/wikaru/manifest.json",
  ...KOTOBA_ICONS.map(name=>`./assets/icons/wikaru/${name}-64.png`),
  "./assets/brand/wikaru-app-icon.svg","./assets/brand/wikaru-app-icon-192.png","./assets/brand/wikaru-app-icon-512.png","./assets/brand/wikaru-social-preview.png",
  "./data/manifest.json","./data/reference-static.json"
];

self.addEventListener("install",event=>event.waitUntil(
  caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener("message",event=>{
  const type=event.data?.type;
  if(type==="SKIP_WAITING"){self.skipWaiting();return;}
  if(type!=="CACHE_CHAPTERS"&&type!=="REMOVE_CHAPTERS")return;
  const chapters=[...new Set((event.data?.chapters||[]).map(Number).filter(number=>number>=1&&number<=50))];
  const respond=payload=>event.ports?.[0]?.postMessage(payload);
  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(OFFLINE_CHAPTER_CACHE);
      const urls=chapters.map(chapter=>new URL(`data/bab-${String(chapter).padStart(2,"0")}.json`,self.registration.scope).href);
      if(type==="CACHE_CHAPTERS"){
        for(const url of urls){const response=await fetch(url,{cache:"reload"});if(!response.ok)throw new Error(`chapter-${response.status}`);await cache.put(url,response);}
      }else await Promise.all(urls.map(url=>cache.delete(url)));
      respond({ok:true,chapters});
    }catch(error){respond({ok:false,error:error?.message||String(error)});}
  })());
});

self.addEventListener("activate",event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME&&key!==OFFLINE_CHAPTER_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));

function cacheResponse(request,response){
  if(response?.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)).catch(()=>{});}
  return response;
}
function networkFirst(request){
  return fetch(request,{cache:"no-cache"}).then(response=>cacheResponse(request,response)).catch(()=>caches.match(request,{ignoreSearch:true}));
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request,{cache:"no-cache"}).then(response=>cacheResponse(new Request(new URL("./index.html",self.registration.scope)),response)).catch(()=>caches.match("./index.html")));
    return;
  }
  const freshAsset=/\/assets\/(?:generated|region-icons|icons\/wikaru)\//.test(url.pathname);
  if(freshAsset||["script","style","worker"].includes(request.destination)||/\.(?:js|css|webmanifest)$/.test(url.pathname)){
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>cached||fetch(request).then(response=>cacheResponse(request,response))));
});
