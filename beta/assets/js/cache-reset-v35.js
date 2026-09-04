/* Runs before the application so a GitHub Pages client cannot stay on an older release. */
(() => {
  "use strict";
  const RELEASE="20260903-v39u1";
  window.WIKARU_BUILD_ID=RELEASE;
  document.documentElement.dataset.wikaruBuild=RELEASE;
  try{localStorage.setItem("wikaru_last_build",RELEASE)}catch(_){ }
  if(!("serviceWorker" in navigator)||!/^https?:$/.test(location.protocol))return;
  const workerUrl=new URL("./sw-v35.js?v=20260903-v39u1",document.baseURI);
  const migrate=async()=>{
    try{
      if("caches" in window){for(const key of await caches.keys())if(key!=="wikaru-offline-chapters-v1"&&key!=="wikaru-static-v39u1-20260903")await caches.delete(key)}
      const registration=await navigator.serviceWorker.register(workerUrl,{scope:"./",updateViaCache:"none"});
      await registration.update();
      registration.waiting?.postMessage({type:"SKIP_WAITING"});
    }catch(error){console.info("Pembaruan Wikaru v39u1 akan dicoba lagi:",error?.message||error)}
  };
  migrate();
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
    const key="wikaru_v39u1_controller_reloaded";
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,"1");
    const url=new URL(location.href);url.searchParams.set("wikaru-release","v39u1");location.replace(url);
  });
})();
