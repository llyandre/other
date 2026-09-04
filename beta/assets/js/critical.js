/* source-script: wikaru-theme-init */
(function(){
      var memory = new Map();
      var nativeStorage = null;
      try {
        nativeStorage = window.localStorage;
        var probe = "__wikaru_storage_probe__";
        nativeStorage.setItem(probe,"1");
        nativeStorage.removeItem(probe);
      } catch(_) { nativeStorage = null; }
      window.WIKARU_STORAGE = {
        getItem:function(key){
          key=String(key);
          try { return nativeStorage ? nativeStorage.getItem(key) : (memory.has(key) ? memory.get(key) : null); }
          catch(_) { return memory.has(key) ? memory.get(key) : null; }
        },
        setItem:function(key,value){
          key=String(key); value=String(value); memory.set(key,value);
          try { if(nativeStorage) nativeStorage.setItem(key,value); } catch(_) {}
        },
        removeItem:function(key){
          key=String(key); memory.delete(key);
          try { if(nativeStorage) nativeStorage.removeItem(key); } catch(_) {}
        },
        clear:function(){ memory.clear(); try { if(nativeStorage) nativeStorage.clear(); } catch(_) {} }
      };
      if(!nativeStorage){
        try { Object.defineProperty(window,"localStorage",{configurable:true,value:window.WIKARU_STORAGE}); } catch(_) {}
      }
    })();
    try { document.documentElement.dataset.theme = localStorage.getItem("wikaru_theme") === "dark" ? "dark" : "light"; document.documentElement.lang = localStorage.getItem("minna_bab23_lang") === "ja" ? "ja" : "id"; } catch(e) { document.documentElement.dataset.theme = "light"; document.documentElement.lang = "id"; }
    (function(){
      var loaderReleased = false;
      window.__wikaruReleaseLoader = function(reason){
        if(loaderReleased) return;
        var loader = document.getElementById("loadingScreen");
        if(!loader) return;
        loaderReleased = true;
        loader.dataset.releaseReason = reason || "complete";
        loader.setAttribute("aria-hidden","true");
        loader.classList.add("is-leaving");
        loader.style.pointerEvents = "none";
        if(window.__wikaruLoaderStatusTimer){
          clearInterval(window.__wikaruLoaderStatusTimer);
          window.__wikaruLoaderStatusTimer = null;
        }
        setTimeout(function(){
          loader.hidden = true; loader.classList.add("is-released"); loader.style.setProperty("display","none","important");
          document.documentElement.classList.add("wikaru-ready");
        },260);
      };
      window.__wikaruLoaderFailsafe = setTimeout(function(){
        if(typeof window.__wikaruReleaseLoader === "function"){
          window.__wikaruReleaseLoader("absolute-failsafe");
        }
      },2400);
      window.addEventListener("pageshow",function(){
        setTimeout(function(){
          if(document.readyState === "complete" && document.documentElement.classList.contains("wikaru-ready")){
            window.__wikaruReleaseLoader("pageshow-ready");
          }
        },80);
      },{once:true});
    })();

/* source-script: wikaru-storage-sanitizer-v4 */
(function(){
  'use strict';
  const prefix='minna_bab23';
  const checks=[[prefix+'_settings','object',null],[prefix+'_progress','object',null],[prefix+'_favorites','array',[]],[prefix+'_history','array',[]],[prefix+'_lastResult','object',null],[prefix+'_pendingCloudResults','array',[]],['wikaru_number_quiz_settings','object',{}]];
  try{checks.forEach(([key,type,fallback])=>{const raw=localStorage.getItem(key);if(raw===null||raw==='')return;try{const value=JSON.parse(raw);const valid=type==='array'?Array.isArray(value):(value===null||(typeof value==='object'&&!Array.isArray(value)));if(!valid)throw new Error('wrong-shape')}catch(_){if(fallback===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(fallback))}})}catch(_){ }
})();
