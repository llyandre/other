/* source-script: wikaru-loader-language-init */
try {
      if(localStorage.getItem("minna_bab23_lang") === "ja"){
        const a=document.getElementById("loaderTitle"),b=document.getElementById("loaderDesc"),c=document.getElementById("loaderTagline"),d=document.querySelector("#loaderSkipBtn span"),e=document.getElementById("loaderStatusText");
        if(a)a.textContent="学習スペースを準備しています";
        if(b)b.textContent="カード・音声・学習記録を読み込んでいます。";
        if(c)c.textContent="日本語をもっとやさしく";
        if(d)d.textContent="今すぐ開く";
        if(e)e.textContent="語彙を準備しています";
      }
    } catch(_) {}

/* source-script: wikaru-v4-enhancements */
(function(){
  "use strict";
  const THEME_KEY = "wikaru_theme";
  let activeAudioButton = null;
  let activeUtterance = null;
  let voices = [];
  let enhanceLock = false;

  function byId(id){ return document.getElementById(id); }
  function all(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }
  function escapeAttr(value){ return String(value ?? "").replace(/"/g,"&quot;"); }

  let isThemeTransitionRunning = false;
  let themeTransitionCleanupTimer = 0;

  function safeStoredTheme(){
    try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; }
    catch(_) { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
  }

  function isJapaneseThemeUI(){
    try {
      return document.documentElement.lang === "ja" || localStorage.getItem("minna_bab23_lang") === "ja";
    } catch(_) {
      return document.documentElement.lang === "ja";
    }
  }

  function refreshThemeToggleUI(theme){
    const next = theme === "dark" ? "dark" : "light";
    const button = byId("themeToggle");
    if(!button) return;
    const dark = next === "dark";
    const ja = isJapaneseThemeUI();
    const label = dark
      ? (ja ? "ライトモードに切り替える" : "Gunakan mode terang")
      : (ja ? "ダークモードに切り替える" : "Gunakan mode malam");
    button.setAttribute("aria-pressed",String(dark));
    button.title = label;
    button.setAttribute("aria-label",label);
    button.innerHTML = `<i class="fa-solid ${dark ? "fa-sun" : "fa-moon"}" aria-hidden="true"></i><span>${dark ? (ja ? "ライトモード" : "Mode Terang") : (ja ? "ダークモード" : "Mode Malam")}</span>`;
  }

  function applyTheme(theme, options={}){
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    if(options.persist !== false){
      try { localStorage.setItem(THEME_KEY,next); }
      catch(error){ console.warn("Wikaru theme storage unavailable:",error); }
    }
    refreshThemeToggleUI(next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content = next === "dark" ? "#0F1722" : "#F7F8FA";
    return next;
  }

  function themeMotionReduced(){
    try { return document.documentElement.dataset.wkMotion === "reduced"; }
    catch(_) { return false; }
  }

  function removeThemeTransitionArtifacts(){
    if(themeTransitionCleanupTimer){
      clearTimeout(themeTransitionCleanupTimer);
      themeTransitionCleanupTimer = 0;
    }
    document.querySelectorAll(".theme-transition-overlay").forEach(element=>element.remove());
    document.documentElement.classList.remove("theme-is-changing");
    document.querySelectorAll(".theme-toggle.is-switching").forEach(button=>{
      button.classList.remove("is-switching");
      button.removeAttribute("aria-busy");
      if(button.dataset.themeWasDisabled !== "true") button.disabled = false;
      delete button.dataset.themeWasDisabled;
    });
  }

  function getThemeMotionOrigin(triggerElement){
    const fallbackX = Math.max(48,window.innerWidth - 48);
    const fallbackY = 48;
    if(!(triggerElement instanceof Element)){
      return {x:fallbackX,y:fallbackY,iconX:fallbackX,iconY:fallbackY};
    }
    const rect = triggerElement.getBoundingClientRect();
    if(!rect.width || !rect.height){
      return {x:fallbackX,y:fallbackY,iconX:fallbackX,iconY:fallbackY};
    }
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return {
      x,
      y,
      iconX:Math.min(Math.max(x,54),Math.max(54,window.innerWidth - 54)),
      iconY:Math.min(Math.max(y,54),Math.max(54,window.innerHeight - 54))
    };
  }

  function createThemeTransitionOverlay(nextTheme, triggerElement){
    const origin = getThemeMotionOrigin(triggerElement);
    const farX = Math.max(origin.x,window.innerWidth - origin.x);
    const farY = Math.max(origin.y,window.innerHeight - origin.y);
    const radius = Math.ceil(Math.hypot(farX,farY) + 40);
    const overlay = document.createElement("div");
    overlay.className = `theme-transition-overlay theme-to-${nextTheme}`;
    overlay.setAttribute("aria-hidden","true");
    overlay.style.setProperty("--theme-origin-x",`${origin.x}px`);
    overlay.style.setProperty("--theme-origin-y",`${origin.y}px`);
    overlay.style.setProperty("--theme-icon-x",`${origin.iconX}px`);
    overlay.style.setProperty("--theme-icon-y",`${origin.iconY}px`);
    overlay.style.setProperty("--theme-diameter",`${radius * 2}px`);

    const circle = document.createElement("div");
    circle.className = "theme-transition-circle";
    const icon = document.createElement("div");
    icon.className = "theme-transition-icon";
    icon.innerHTML = `<i class="fa-solid ${nextTheme === "dark" ? "fa-moon" : "fa-sun"}"></i>`;
    const particles = document.createElement("div");
    particles.className = "theme-transition-particles";
    const particleGlyph = nextTheme === "dark" ? "✦" : "•";
    for(let index=0;index<8;index++){
      const particle = document.createElement("span");
      particle.className = "theme-transition-particle";
      particle.textContent = particleGlyph;
      particle.style.setProperty("--particle-angle",`${index * 45 + (index % 2 ? 10 : -5)}deg`);
      particle.style.setProperty("--particle-distance",`${48 + (index % 3) * 15}px`);
      particle.style.setProperty("--particle-delay",`${80 + index * 22}ms`);
      particle.style.setProperty("--particle-size",`${8 + (index % 3) * 3}px`);
      particles.appendChild(particle);
    }
    overlay.append(circle,icon,particles);
    document.body.appendChild(overlay);
    return overlay;
  }

  function commitThemeWithViewTransition(nextTheme){
    const update = ()=>applyTheme(nextTheme);
    if(typeof document.startViewTransition === "function"){
      try {
        const transition = document.startViewTransition(update);


        Promise.resolve(transition.ready).then(()=>{
          if(typeof transition.skipTransition === "function") transition.skipTransition();
        }).catch(()=>{});
        return Promise.resolve(transition.updateCallbackDone).catch(error=>{
          console.warn("Wikaru View Transition fallback:",error);
          if(document.documentElement.dataset.theme !== nextTheme) update();
        });
      } catch(error){
        console.warn("Wikaru View Transition unavailable:",error);
        update();
      }
    } else {
      update();
    }
    return Promise.resolve();
  }

  function waitThemeMotion(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

  async function changeThemeWithMotion(nextTheme, triggerElement){
    const next = nextTheme === "dark" ? "dark" : "light";
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    if(next === current || isThemeTransitionRunning || window.__wikaruLanguageTransitionRunning || document.querySelector(".language-transition-overlay")) return;

    const loader = byId("loadingScreen");
    const loaderActive = loader && !loader.hidden && loader.style.display !== "none" && !loader.classList.contains("is-leaving");
    if(loaderActive || themeMotionReduced()){
      applyTheme(next);
      return;
    }

    isThemeTransitionRunning = true;
    removeThemeTransitionArtifacts();
    const trigger = triggerElement instanceof HTMLElement ? triggerElement : byId("themeToggle");
    const wasDisabled = Boolean(trigger?.disabled);
    if(trigger){
      trigger.dataset.themeWasDisabled = String(wasDisabled);
      trigger.disabled = true;
      trigger.classList.add("is-switching");
      trigger.setAttribute("aria-busy","true");
    }

    document.documentElement.classList.add("theme-is-changing");
    const overlay = createThemeTransitionOverlay(next,trigger);

    try {
      await waitThemeMotion(270);
      await commitThemeWithViewTransition(next);
      await waitThemeMotion(390);
      overlay.classList.add("is-fading");
      await waitThemeMotion(230);
    } catch(error){
      console.warn("Wikaru theme motion recovered:",error);
      applyTheme(next);
    } finally {
      overlay.remove();
      document.documentElement.classList.remove("theme-is-changing");
      if(trigger){
        trigger.classList.remove("is-switching");
        trigger.removeAttribute("aria-busy");
        trigger.disabled = wasDisabled;
        delete trigger.dataset.themeWasDisabled;
      }
      isThemeTransitionRunning = false;
    }
  }
  window.changeThemeWithMotion = changeThemeWithMotion;

  function installThemeToggle(){
    const navActions = document.querySelector(".nav-actions");
    let btn = byId("themeToggle");
    if(navActions && !btn){
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "themeToggle";
      btn.className = "theme-toggle";
      navActions.insertBefore(btn,navActions.querySelector(".user-menu") || navActions.lastElementChild);
    }
    if(btn && !btn.dataset.themeMotionBound){
      btn.dataset.themeMotionBound = "true";
      btn.addEventListener("click",event=>{
        const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        changeThemeWithMotion(current === "dark" ? "light" : "dark",event.currentTarget);
      });
    }
    document.documentElement.classList.add("theme-motion-enabled");
    applyTheme(safeStoredTheme(),{persist:false});

    if(!document.documentElement.dataset.themeStorageBound){
      document.documentElement.dataset.themeStorageBound = "true";
      window.addEventListener("storage",event=>{
        if(event.key === THEME_KEY) applyTheme(event.newValue === "dark" ? "dark" : "light",{persist:false});
      });
    }
  }
  window.wikaruRefreshThemeLabel = function(){
    applyTheme(document.documentElement.dataset.theme || safeStoredTheme(),{persist:false});
  };

  function refreshVoices(){
    try { voices = window.speechSynthesis?.getVoices?.() || []; } catch(_){ voices = []; }
  }
  function currentVoicePreset(){
    const allowed=["hanamama","momokawaii","renikebo","kaitodandy"];
    let value="hanamama";
    try { value=localStorage.getItem("wikaru_voice_preset") || "hanamama"; } catch(_) {}
    if(!allowed.includes(value)) value="hanamama";
    try { localStorage.setItem("wikaru_voice_preset",value); } catch(_) {}
    return value;
  }
  function voiceProfileParams(preset="hanamama",kind="vocab"){
    const sentence=kind === "example";
    const profiles={
      hanamama:{rate:sentence?.90:.84,pitch:1.03},
      momokawaii:{rate:sentence?.99:.95,pitch:1.16},
      renikebo:{rate:sentence?.94:.89,pitch:.84},
      kaitodandy:{rate:sentence?.88:.81,pitch:.72}
    };
    return profiles[preset] || profiles.hanamama;
  }
  function voiceScore(voice,lang="ja-JP",preset=currentVoicePreset()){
    const name=String(voice?.name || "");
    const voiceLang=String(voice?.lang || "");
    const female=/Nanami|Haruka|Ayumi|Kyoko|O-Ren|Mizuki|Sayaka|Hikari|Akari|Nozomi|Sakura|Aoi|Mei|Yuna|Ichika|Female|女性/i;
    const male=/Keita|Otoya|Ichiro|Hattori|Kenji|Takumi|Daichi|Hiroshi|Male|男性/i;
    let score=0;
    if(/^ja(-|_)?JP$/i.test(voiceLang)) score+=240;
    else if(/^ja/i.test(voiceLang)) score+=175;
    if(/Natural|Neural|Premium|Enhanced|Online|Siri/i.test(name)) score+=95;
    if(/Google.*(日本語|Japanese)/i.test(name)) score+=75;
    if(/Microsoft.*(Japanese|日本語|Nanami|Keita)/i.test(name)) score+=75;
    if(voice?.localService) score+=18;
    if(voice?.default) score+=8;
    if(/Compact|eSpeak|Festival|Desktop/i.test(name)) score-=30;
    if(lang && voiceLang.toLowerCase()===lang.toLowerCase()) score+=20;

    if(preset==="hanamama"){
      if(female.test(name)) score+=125;
      if(/Nanami|Kyoko|Ayumi|Mizuki|Nozomi/i.test(name)) score+=55;
      if(male.test(name)) score-=110;
    }else if(preset==="momokawaii"){
      if(female.test(name)) score+=125;
      if(/Haruka|Hikari|Sayaka|Sakura|Aoi|Mei|Yuna/i.test(name)) score+=65;
      if(male.test(name)) score-=110;
    }else if(preset==="renikebo"){
      if(male.test(name)) score+=135;
      if(/Keita|Otoya|Takumi|Daichi/i.test(name)) score+=60;
      if(female.test(name)) score-=115;
    }else if(preset==="kaitodandy"){
      if(male.test(name)) score+=135;
      if(/Ichiro|Hattori|Hiroshi|Kenji|Otoya/i.test(name)) score+=65;
      if(female.test(name)) score-=115;
    }
    return score;
  }
  function bestVoice(lang="ja-JP",preset=currentVoicePreset()){
    refreshVoices();
    return voices.slice().sort((a,b)=>voiceScore(b,lang,preset)-voiceScore(a,lang,preset))[0] || null;
  }
  function updateVoicePresetUI(){
    const select=byId("voicePresetSelect");
    const title=byId("voiceProfileTitle");
    const status=byId("voiceAvailabilityText");
    const ja=document.documentElement.lang === "ja";
    const preset=currentVoicePreset();
    const copy={
      hanamama:{id:["Hana Onee-san","Perempuan dewasa yang lembut, hangat, dan keibuan."],ja:["花お姉さん","やさしく母性のある大人の女性の声"]},
      momokawaii:{id:["Momo Kawaii","Remaja Jepang yang ceria, ringan, dan ekspresif."],ja:["ももカワイイ","明るく元気で表情豊かな十代の女性の声"]},
      renikebo:{id:["Ren Ikebo","Remaja Jepang yang tenang, cool, dan pendiam."],ja:["蓮イケボ","静かでクールな十代の男性の声"]},
      kaitodandy:{id:["Kaito Dandy","Pria dewasa yang matang, tenang, dan bersuara berat."],ja:["海斗ダンディ","落ち着きと深みのある大人の男性の声"]}
    };
    const meta=(copy[preset] || copy.hanamama)[ja?"ja":"id"];
    if(select) select.value=preset;
    if(title) title.textContent=meta[0];
    const voice=bestVoice("ja-JP",preset);
    if(status){
      status.textContent=voice ? `${meta[1]} ${ja?"使用音声":"Voice perangkat"}: ${voice.name}` : meta[1];
      status.title=status.textContent;
    }
    document.querySelectorAll("[data-current-voice-name]").forEach(node=>node.textContent=meta[0]);
    document.querySelectorAll("[data-current-voice-desc]").forEach(node=>node.textContent=meta[1]);
  }
  function normalizeSpeechText(text,kind="vocab"){
    let value = String(text || "").replace(/[〜～]/g,"").replace(/\s+/g," ").trim();
    if(kind === "vocab"){
      value = value.replace(/（[^）]*）/g,"").replace(/\([^)]*\)/g,"").trim();
    } else {
      value = value.replace(/([。！？])/g,"$1 ").replace(/、/g,"、 ");
    }
    return value;
  }
  function restoreAudioButton(button){
    if(!button) return;
    button.classList.remove("is-speaking");
    button.removeAttribute("aria-pressed");
    const icon = button.querySelector("i");
    if(icon && button.dataset.originalIcon) icon.className = button.dataset.originalIcon;
  }
  function activateAudioButton(button){
    if(activeAudioButton && activeAudioButton !== button) restoreAudioButton(activeAudioButton);
    activeAudioButton = button || null;
    if(!button) return;
    const icon = button.querySelector("i");
    if(icon && !button.dataset.originalIcon) button.dataset.originalIcon = icon.className;
    if(icon) icon.className = "fa-solid fa-wave-square";
    button.classList.add("is-speaking");
    button.setAttribute("aria-pressed","true");
  }
  function naturalSpeak(text,lang="ja-JP",options={}){
    if(!("speechSynthesis" in window)) return;
    const kind = options.kind || (/([。！？]|です|ます)/.test(String(text)) ? "example" : "vocab");
    const cleaned = normalizeSpeechText(text,kind);
    if(!cleaned) return;
    try {
      window.speechSynthesis.cancel();
      restoreAudioButton(activeAudioButton);
      const button = options.button || window.__wikaruAudioButton || null;
      activateAudioButton(button);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      activeUtterance = utterance;
      utterance.lang = lang;
      const preset=currentVoicePreset();
      const voice = bestVoice(lang,preset);
      if(voice) utterance.voice = voice;
      const profile=voiceProfileParams(preset,kind);
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = 1;
      utterance.onstart = ()=>activateAudioButton(button);
      utterance.onend = ()=>{ restoreAudioButton(button); if(activeAudioButton===button) activeAudioButton=null; activeUtterance=null; };
      utterance.onerror = ()=>{ restoreAudioButton(button); if(activeAudioButton===button) activeAudioButton=null; activeUtterance=null; };
      window.speechSynthesis.speak(utterance);
    } catch(_){ restoreAudioButton(activeAudioButton); }
  }

  window.wikaruNaturalSpeak = naturalSpeak;

  window.speak = function(text,lang="ja-JP"){
    const options = {
      kind: window.__wikaruAudioKind || (/([。！？]|です|ます)/.test(String(text)) ? "example" : "vocab"),
      button: window.__wikaruAudioButton || null
    };
    window.__wikaruAudioKind = null;
    window.__wikaruAudioButton = null;
    naturalSpeak(text,lang,options);
  };

  function findVocab(id){
    try { return (window.__WIKARU_VOCABULARY || []).find(v=>String(v.id)===String(id)); } catch(_){ return null; }
  }
  function exampleText(v){
    if(!v) return "";
    const direct = String(v.exampleJa || v.exampleJapanese || "").trim();
    if(direct) return direct;
    if(Array.isArray(v.examples)){
      const item = v.examples.find(ex=>ex && String(ex.ja || ex.japanese || "").trim());
      if(item) return String(item.ja || item.japanese).trim();
    }
    return "";
  }

  function containsJapanese(value){
    return /[\u3040-\u30ff\u3400-\u9fff]/.test(String(value || ""));
  }
  function cleanNodeText(node){
    return String(node?.textContent || "").replace(/\s+/g," ").trim();
  }
  function directAudioTexts(container){
    const priority = [
      ".material-ref-jp", ".jp-line", ".kanji", ".kana",
      "[class$='-kanji']", "[class*='-kanji ']", "[class$='-jp']", "[class*='-jp ']",
      "h3.jp", "h4.jp", "strong.jp", ".jp"
    ];
    const found = [];
    priority.forEach(selector=>{
      all(selector,container).forEach(node=>{
        if(node.closest("button")) return;
        const value = cleanNodeText(node);
        if(containsJapanese(value) && !found.includes(value)) found.push(value);
      });
    });
    if(!found.length){
      const own = cleanNodeText(container);
      if(containsJapanese(own) && own.length <= 80) found.push(own);
    }
    const vocab = found.find(value=>value.length <= 24) || found[0] || "";
    let example = found.find(value=>value !== vocab && (/[。！？]/.test(value) || value.length >= 9)) || "";
    if(!example && vocab && (/[。！？]/.test(vocab) || vocab.length >= 7)) example = vocab;
    return {vocab,example};
  }
  function makeDirectAudioButton(text,kind){
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-btn";
    button.dataset.directSpeak = text || "";
    button.dataset.directKind = kind;
    const available = Boolean(text);
    button.disabled = !available;
    button.title = available
      ? (kind === "example" ? "Dengarkan contoh kalimat" : "Dengarkan kosakata")
      : (kind === "example" ? "Audio contoh kalimat belum tersedia" : "Audio kosakata belum tersedia");
    button.setAttribute("aria-label",button.title);
    button.innerHTML = `<i class="fa-solid ${kind === "example" ? "fa-comment-dots" : "fa-volume-high"}"></i>`;
    return button;
  }
  function installDirectAudio(container,isTableRow=false){
    if(!container || container.dataset.wikaruDirectAudio === "true") return;
    if(container.querySelector("[data-speak-id]")) return;
    const texts = directAudioTexts(container);
    if(!texts.vocab && !texts.example) return;
    const dock = document.createElement("div");
    dock.className = "wikaru-direct-audio-dock";
    dock.append(makeDirectAudioButton(texts.vocab,"vocab"),makeDirectAudioButton(texts.example,"example"));
    if(isTableRow){
      const cell = document.createElement("td");
      cell.className = "wikaru-direct-audio-cell";
      cell.appendChild(dock);
      container.appendChild(cell);
    } else {
      container.appendChild(dock);
    }
    container.dataset.wikaruDirectAudio = "true";
  }
  function enhanceMaterialAudioActions(){
    if(enhanceLock) return;
    enhanceLock = true;
    const root = byId("materialGrid");
    if(root){
      all("[data-speak-id]",root).forEach(vocabButton=>{
        const id = vocabButton.dataset.speakId;
        const duplicate = all("[data-example-speak-id]",root).some(btn=>String(btn.dataset.exampleSpeakId)===String(id));
        if(!id || duplicate) return;
        const v = findVocab(id);
        const text = exampleText(v);
        const exampleButton = document.createElement("button");
        exampleButton.type = "button";
        exampleButton.className = "icon-btn wikaru-example-audio";
        exampleButton.dataset.exampleSpeakId = id;
        exampleButton.title = text ? "Dengarkan contoh kalimat" : "Audio contoh kalimat belum tersedia";
        exampleButton.setAttribute("aria-label",exampleButton.title);
        exampleButton.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
        exampleButton.disabled = !text;
        const parent = vocabButton.parentElement;
        if(parent){
          parent.classList.add("wikaru-audio-actions");
          vocabButton.insertAdjacentElement("afterend",exampleButton);
        }
      });
      all("article:not(.gift-overview-row):not(.gift-seasonal-row):not(.gift-envelope-card):not(.number-rule-card)",root).forEach(card=>installDirectAudio(card,false));
      all("tbody tr",root).forEach(row=>installDirectAudio(row,true));
      all(".material-ref-address-example,.family-example-item",root).forEach(block=>installDirectAudio(block,false));
    }
    enhanceLock = false;
  }

  function enhanceTimer(){
    const timer = byId("timerText");
    if(!timer || timer.dataset.wikaruTimerReady) return;
    timer.dataset.wikaruTimerReady = "true";
    const metric = timer.closest(".metric");
    if(metric) metric.classList.add("timer-metric");
    let previous = timer.textContent;
    const update = ()=>{
      const text = timer.textContent.trim();
      if(text !== previous){
        timer.classList.remove("timer-tick");
        void timer.offsetWidth;
        timer.classList.add("timer-tick");
        previous = text;
      }
      const parts = text.split(":").map(Number);
      const seconds = parts.length===2 ? parts[0]*60+parts[1] : Number(text)||0;
      metric?.classList.toggle("timer-warning",seconds<=10 && seconds>5);
      metric?.classList.toggle("timer-danger",seconds<=5);
    };
    new MutationObserver(update).observe(timer,{childList:true,characterData:true,subtree:true});
    update();
  }

  function installMaterialObserver(){
    const root = byId("materialGrid");
    if(!root) return;
    const observer = new MutationObserver(()=>requestAnimationFrame(enhanceMaterialAudioActions));
    observer.observe(root,{childList:true,subtree:true});
    enhanceMaterialAudioActions();
  }

  document.addEventListener("click",event=>{
    const directButton = event.target.closest("[data-direct-speak]");
    if(directButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      const text = String(directButton.dataset.directSpeak || "").trim();
      if(!text) return;
      naturalSpeak(text,"ja-JP",{kind:directButton.dataset.directKind || "vocab",button:directButton});
      return;
    }
    const exampleButton = event.target.closest("[data-example-speak-id]");
    if(exampleButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      const v = findVocab(exampleButton.dataset.exampleSpeakId);
      const text = exampleText(v);
      if(!text) return;
      naturalSpeak(text,"ja-JP",{kind:"example",button:exampleButton});
      return;
    }
    const vocabButton = event.target.closest("[data-speak-id],#exampleVocabSpeakBtn,#hearBtn,[data-detail-speak='vocab']");
    if(vocabButton){
      window.__wikaruAudioButton = vocabButton;
      window.__wikaruAudioKind = "vocab";
    }
    const sentenceButton = event.target.closest("#exampleSpeakBtn,[data-detail-speak='example']");
    if(sentenceButton){
      window.__wikaruAudioButton = sentenceButton;
      window.__wikaruAudioKind = "example";
    }
  },true);

  refreshVoices();
  if("speechSynthesis" in window){
    window.speechSynthesis.onvoiceschanged = ()=>{ refreshVoices(); updateVoicePresetUI(); };
  }
  document.addEventListener("change",event=>{
    if(event.target?.id !== "voicePresetSelect") return;
    const allowed=["hanamama","momokawaii","renikebo","kaitodandy"];
    const value=allowed.includes(event.target.value)?event.target.value:"hanamama";
    event.target.value=value;
    try { localStorage.setItem("wikaru_voice_preset",value); } catch(_) {}
    updateVoicePresetUI();
    const samples={
      hanamama:"こんにちは。今日もゆっくり、一緒に日本語を勉強しましょうね。",
      momokawaii:"こんにちは！今日も楽しく日本語を勉強しよう！",
      renikebo:"こんにちは。今日も一緒に、日本語を練習しよう。",
      kaitodandy:"こんにちは。落ち着いて、日本語の練習を始めましょう。"
    };
    naturalSpeak(samples[value],"ja-JP",{kind:"example"});
    document.dispatchEvent(new CustomEvent("wikaru:voice-preset-changed",{detail:{preset:value}}));
  });

  function init(){
    installThemeToggle();
    installMaterialObserver();
    enhanceTimer();
    updateVoicePresetUI();
    const originalShowPage = window.showPage;
    if(typeof originalShowPage === "function"){
      window.showPage = function(){
        const value = originalShowPage.apply(this,arguments);
        requestAnimationFrame(()=>{ enhanceMaterialAudioActions(); enhanceTimer(); });
        return value;
      };
    }
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* source-script: wikaru-v8-runtime-audit */
(function(){'use strict';function release(reason){if(typeof window.__wikaruReleaseLoader==='function'){window.__wikaruReleaseLoader(reason||'runtime-recovery');return}const loader=document.getElementById('loadingScreen');if(loader){loader.classList.add('is-leaving');loader.style.pointerEvents='none';setTimeout(()=>{loader.hidden = true; loader.classList.add("is-released"); loader.style.setProperty("display","none","important"); },520)}}window.addEventListener('error',e=>{console.error('Wikaru runtime error:',e.error||e.message);release('runtime-error')});window.addEventListener('unhandledrejection',e=>{console.error('Wikaru async error:',e.reason);release('async-error')});document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('a[target="_blank"]').forEach(a=>a.rel='noopener noreferrer');document.querySelectorAll('img').forEach(img=>{if(!img.loading)img.loading='lazy';img.referrerPolicy='no-referrer'});setTimeout(()=>release('dom-failsafe'),6800)},{once:true})})();

/* source-script: wikaru-v9-optimized-icons-profile */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const palette={navy:['#243B73','#35549D'],indigo:['#2F477F','#5973B2'],matcha:['#63785D','#82947C'],teal:['#3F716C','#61938D'],amber:['#95662F','#C08E4E'],rose:['#A64D45','#D16B61'],plum:['#4D6078','#70839B'],green:['#4D6D57','#78907A'],blue:['#315D82','#5A86A8'],slate:['#4B617E','#72859C'],brown:['#765A43','#9B785C'],red:['#B84B41','#D96A5E']};
  const profileSet=[
    ['fa-user-graduate','navy','Pembelajar'],['fa-pen-nib','matcha','Pencatat'],['fa-paper-plane','teal','Penjelajah'],['fa-star','amber','Bintang Belajar'],['fa-book-open','rose','Pembaca'],['fa-mountain-sun','slate','Pendaki Level'],['fa-seedling','green','Tumbuh Konsisten'],['fa-fan','plum','Pecinta Jepang'],
    ['fa-compass','blue','Pencari Arah'],['fa-feather-pointed','brown','Perangkai Kata'],['fa-lightbulb','amber','Pemikir Cerah'],['fa-puzzle-piece','indigo','Pemecah Pola'],['fa-mug-hot','rose','Belajar Santai'],['fa-headphones','teal','Pendengar Aktif'],['fa-microphone-lines','red','Pelatih Pelafalan'],['fa-scroll','brown','Penjelajah Kanji'],
    ['fa-torii-gate','red','Sahabat Jepang'],['fa-bolt','blue','Belajar Cepat'],['fa-leaf','green','Pembelajar Tenang'],['fa-moon','indigo','Pembelajar Malam'],['fa-sun','amber','Pembelajar Pagi'],['fa-rocket','navy','Pengejar Target'],['fa-chess-knight','plum','Penyusun Strategi'],['fa-wand-magic-sparkles','rose','Kreator Memori'],
    ['fa-dharmachakra','teal','Penjaga Ritme'],['fa-gem','indigo','Kolektor Kata'],['fa-route','slate','Penjelajah Bab'],['fa-hourglass-half','brown','Penjaga Waktu'],['fa-award','amber','Pencapai Level'],['fa-language','navy','Perakit Bahasa'],['fa-comments','green','Praktisi Percakapan'],['fa-umbrella','blue','Belajar Fleksibel']
  ];
  const chapterIcons={1:'fa-user-group',2:'fa-cube',3:'fa-building',4:'fa-clock',5:'fa-train-subway',6:'fa-utensils',7:'fa-scissors',8:'fa-palette',9:'fa-heart',10:'fa-location-dot',11:'fa-calculator',12:'fa-calendar-days',13:'fa-basket-shopping',14:'fa-bus-simple',15:'fa-briefcase',16:'fa-credit-card',17:'fa-notes-medical',18:'fa-person-running',19:'fa-landmark',20:'fa-comments',21:'fa-newspaper',22:'fa-shirt',23:'fa-road',24:'fa-handshake-angle'};
  const rules=[
    [/badung/i,'fa-city','#243B73','#E9EDFA'],[/jembrana/i,'fa-mountain-sun','#63785D','#EBF0E8'],[/singaraja/i,'fa-water','#387B75','#E7F3F1'],[/^umum$|wilayah umum/i,'fa-compass','#B57A25','#FFF3D9'],
    [/materi umum|kosakata utama/i,'fa-book-open-reader','#243B73','#E9EDFA'],[/referensi|informasi|参考/i,'fa-compass','#63785D','#EBF0E8'],[/kata benda|nomina|noun/i,'fa-cube','#243B73','#E9EDFA'],[/kata kerja|verba|verb/i,'fa-person-running','#387B75','#E7F3F1'],[/kata sifat|adjektiva|adjective/i,'fa-palette','#8A4F65','#F6EAF0'],[/kata keterangan|adverb/i,'fa-gauge-high','#B57A25','#FFF3D9'],[/ungkapan|ekspresi|percakapan|expression/i,'fa-comments','#63785D','#EBF0E8'],[/partikel/i,'fa-link','#7A5B85','#F1EAF4'],[/kata tanya|question/i,'fa-circle-question','#B57A25','#FFF3D9'],[/bilangan|angka|counter|satuan/i,'fa-hashtag','#243B73','#E9EDFA'],[/waktu|jam|tanggal/i,'fa-clock','#B57A25','#FFF3D9'],[/tempat|lokasi|arah/i,'fa-location-dot','#E84B3C','#FCECE9'],[/orang|keluarga|profesi/i,'fa-users','#63785D','#EBF0E8'],[/negara|bahasa/i,'fa-earth-asia','#243B73','#E9EDFA'],[/transportasi|jalan|lalu lintas|rambu|道路|交通/i,'fa-road','#387B75','#E7F3F1'],[/fasilitas umum/i,'fa-building-shield','#4B617E','#EAF0F5'],[/kesehatan|tubuh|gejala|penyakit/i,'fa-heart-pulse','#E84B3C','#FCECE9'],[/pakaian|服/i,'fa-shirt','#8A4F65','#F6EAF0'],[/makanan|minuman/i,'fa-utensils','#B57A25','#FFF3D9'],[/cuaca|musim/i,'fa-cloud-sun','#315D82','#E8F1F7'],[/hobi|olahraga/i,'fa-person-running','#387B75','#E7F3F1'],[/warna/i,'fa-palette','#8A4F65','#F6EAF0'],[/hewan/i,'fa-paw','#795D4B','#F2ECE8'],[/benda|barang|kosakata/i,'fa-shapes','#243B73','#E9EDFA'],[/kanji|漢字/i,'fa-font','#7A5B85','#F1EAF4'],[/hiragana|cara baca|読み方/i,'fa-signature','#387B75','#E7F3F1'],[/romaji|ローマ字/i,'fa-font','#315D82','#E8F1F7'],[/gambar|画像/i,'fa-image','#B57A25','#FFF3D9'],[/acak|shuffle/i,'fa-shuffle','#243B73','#E9EDFA'],[/tidak acak|urutan/i,'fa-list-ol','#63785D','#EBF0E8'],[/semua kategori|semua bagian|semua topik|all/i,'fa-layer-group','#243B73','#E9EDFA'],[/tambahan/i,'fa-plus','#E84B3C','#FCECE9']
  ];
  function hash(v){let h=2166136261;for(const ch of String(v||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  const roleJa={'Sahabat Jepang':'日本語の友だち','Belajar Cepat':'スピード学習者','Pembelajar Tenang':'マイペース学習者','Pembelajar Malam':'夜の学習者','Pembelajar Pagi':'朝の学習者','Pengejar Target':'目標チャレンジャー','Penyusun Strategi':'学習プランナー','Kreator Memori':'記憶クリエイター','Penjaga Ritme':'学習リズムキーパー','Kolektor Kata':'単語コレクター','Penjelajah Bab':'課の探検家','Penjaga Waktu':'時間マスター','Pencapai Level':'レベルアップ達成者','Perakit Bahasa':'ことばビルダー','Praktisi Percakapan':'会話トレーニー','Belajar Fleksibel':'フレキシブル学習者'};
  function profile(name){const n=String(name||'').trim(),ja=document.documentElement.lang==='ja',api=window.WIKARU_PROFILE_ASSETS;if(api?.resolveProfile)return api.resolveProfile(n,{admin:/^admin404$/i.test(n),language:ja?'ja':'id'});if(/^admin404$/i.test(n))return{icon:'fa-user-shield',a:'#243B73',b:'#E84B3C',role:ja?'管理者':'Pengelola'};if(!n||/^(masuk|login|ログイン|名前を入力)$/i.test(n))return{icon:'fa-user',a:'#66736D',b:'#89938D',role:ja?'ゲスト':'Tamu'};const [icon,tone,role]=profileSet[hash(n)%profileSet.length],colors=palette[tone];return{icon,a:colors[0],b:colors[1],role:ja?(roleJa[role]||role):role}}
  function applyAvatar(el,name,showRole){if(!el)return null;const p=profile(name),api=window.WIKARU_PROFILE_ASSETS;if(api?.applyProfileAsset&&('assetUrl'in p)){api.applyProfileAsset(el,p);if(showRole){const role=$('#userRoleText'),label=p.nickname||p.role;if(role&&role.textContent!==label)role.textContent=label}return p}const letter=(String(name||'W').trim()[0]||'W').toUpperCase();el.style.setProperty('--avatar-a',p.a);el.style.setProperty('--avatar-b',p.b);const i=$('i',el);if(i&&i.className!=='fa-solid '+p.icon)i.className='fa-solid '+p.icon;const sm=$('small',el);if(sm&&sm.textContent!==letter)sm.textContent=letter;if(showRole){const role=$('#userRoleText');if(role&&role.textContent!==p.role)role.textContent=p.role}return p}
  function ensureLoginPreview(){const card=$('#loginModal .login-card'),head=$('#loginModal .login-head');if(!card||!head)return null;let preview=$('.wikaru-login-preview',card);if(!preview){const ja=document.documentElement.lang==='ja';preview=document.createElement('div');preview.className='wikaru-login-preview';preview.innerHTML=`<span class="wikaru-user-avatar" aria-hidden="true"><i class="fa-solid fa-user-graduate"></i><small>W</small></span><div><strong>${ja?'Wikaruの学習プロフィール':'Identitas belajar Wikaru'}</strong><span>${ja?'名前を入力すると、あなた専用のアバターが表示されます。':'Ketik nama untuk melihat avatar unikmu.'}</span></div>`;head.insertAdjacentElement('afterend',preview)}return preview}
  function fixBrowserIdentity(){const desired=document.documentElement.lang==='ja'?'Wikaru — 日本語をもっとやさしく':'Wikaru — Belajar Bahasa Jepang Lebih Mudah';if(document.title!==desired)document.title=desired}
  function meta(el){const text=(el.textContent||'').replace(/\s+/g,' ').trim(),m=(el.dataset.setupChapter||el.querySelector('input')?.value||text).match(/(?:Bab|第)\s*(\d+)/i);if(m){const n=Number(m[1]);return{icon:chapterIcons[n]||'fa-bookmark',a:n%3===0?'#387B75':n%3===1?'#243B73':'#63785D',soft:n%3===0?'#E7F3F1':n%3===1?'#E9EDFA':'#EBF0E8'}}for(const [re,icon,a,soft] of rules)if(re.test(text))return{icon,a,soft};return{icon:'fa-bookmark',a:'#243B73',soft:'#E9EDFA'}}
  function decorate(el){if(!el)return;const text=(el.textContent||'').replace(/\s+/g,' ').trim();if(el.dataset.wkDecorated===text)return;const m=meta(el);el.style.setProperty('--option-accent',m.a);el.style.setProperty('--option-soft',m.soft);let holder=$('.option-soft-icon',el)||$('.wikaru-category-icon',el)||$('.wk-filter-icon',el)||(el.matches('.login-group-card')?$(':scope>span',el):null);if(el.matches('.category-button')&&!holder){holder=document.createElement('span');holder.className='wikaru-category-icon';el.prepend(holder)}if(el.matches('.check-pill')){const span=$(':scope>span',el);if(span){const nativeIcon=$(':scope>i',span);holder=$('.wk-filter-icon',span);if(nativeIcon){holder?.remove();holder=null;nativeIcon.classList.add('wk-filter-native-icon')}else if(!holder){holder=document.createElement('span');holder.className='wk-filter-icon';span.prepend(holder)}}}if(holder){let icon=$('i',holder);if(!icon){icon=document.createElement('i');holder.append(icon)}const cls='fa-solid '+m.icon;if(icon.className!==cls)icon.className=cls}el.dataset.wkDecorated=text}
  function flowMap(){const ja=document.documentElement.lang==='ja';return{idToJp:[[(ja?'インドネシア語':'ID'),''],['日本語','jp']],jpToId:[['日本語','jp'],[(ja?'インドネシア語':'Indonesia'),'']],kanjiToReading:[['漢字','jp'],[(ja?'かな':'Kana'),'jp'],[(ja?'ローマ字':'Romaji'),'romaji']],readingToMeaning:[[(ja?'かな':'Kana'),'jp'],[(ja?'ローマ字':'Romaji'),'romaji'],[(ja?'意味':'Arti'),'']],imageToJp:[[(ja?'画像':'Gambar'),''],['日本語','jp']]};}
  function directions(){Object.entries(flowMap()).forEach(([key,items])=>{const btn=$(`[data-qdir="${key}"]`);if(!btn)return;const holder=$('.option-soft-icon',btn);if(holder&&!holder.dataset.wkScript){holder.textContent=key==='kanjiToReading'?'漢':key==='readingToMeaning'?'あ':key==='idToJp'?'ID':key==='jpToId'?'日':'';holder.dataset.wkScript='1'}if(!$('.wk-script-flow',btn)){const box=document.createElement('div');box.className='wk-script-flow';box.innerHTML=items.map((x,i)=>`${i?'<i class="fa-solid fa-arrow-right wk-script-arrow"></i>':''}<span class="wk-script-chip ${x[1]}">${x[0]}</span>`).join('');$('div',btn)?.append(box)}})}
  function headings(root=document){const sel='#materialPage [class$="-section-head"],#materialPage [class*="-section-head "],#materialPage [class$="-section-title"],#materialPage [class*="-section-title "],#materialPage .road-reference-kicker,#materialPage .material-ref-badge';$$(sel,root).forEach(box=>{if(box.dataset.wkHeading)return;const target=box.matches('h3,h4')?box:($('h3,h4',box)||box),m=meta(box);box.style.setProperty('--option-accent',m.a);box.style.setProperty('--option-soft',m.soft);if(target&&!target.closest('button')&&!$('.wk-heading-icon',target)){const span=document.createElement('span');span.className='wk-heading-icon';span.setAttribute('aria-hidden','true');span.innerHTML='<i class="fa-solid '+m.icon+'"></i>';target.prepend(span)}box.dataset.wkHeading='1'})}
  function run(root=document){$$('.option-card.icon-option,.login-group-card,.category-button,.check-pill',root).forEach(decorate);headings(root);directions();fixBrowserIdentity();const name=$('#userMenuText')?.textContent.trim()||'';applyAvatar($('#userAvatar'),name,true);const previewBox=ensureLoginPreview(),input=$('#usernameInput'),preview=previewBox?$('.wikaru-user-avatar',previewBox):null;if(preview){const value=input?.value.trim()||'Wikaru',ja=document.documentElement.lang==='ja',assigned=applyAvatar(preview,value,false);const strong=$(':scope > div > strong',previewBox),note=$(':scope > div > span',previewBox);if(strong)strong.textContent=input?.value.trim()||(ja?'Wikaruの学習プロフィール':'Identitas belajar Wikaru');if(note)note.textContent=input?.value.trim()?(ja?`称号：${assigned?.nickname||'学習者'}`:`Julukan: ${assigned?.nickname||'Pembelajar'}`):(ja?'名前を入力すると専用アバターと称号が決まります。':'Ketik nama untuk menentukan avatar dan julukanmu.')}}
  let scheduled=false;function schedule(root=document){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run(root)})}
  function init(){['#setupModal','#quizSettingsModal','#loginModal','#materialGrid'].map(s=>$(s)).filter(Boolean).forEach(root=>{run(root);new MutationObserver(()=>schedule(root)).observe(root,{childList:true,subtree:true})});run();const title=$('title');if(title)new MutationObserver(fixBrowserIdentity).observe(title,{childList:true,characterData:true,subtree:true});$('#usernameInput')?.addEventListener('input',()=>schedule($('#loginModal')||document));const user=$('#userMenuText');if(user)new MutationObserver(()=>schedule()).observe(user,{childList:true,characterData:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* source-script: wikaru-v11-adaptive-app-behavior */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const mobileMQ=window.matchMedia('(max-width:599px)');
  const adaptiveMQ=window.matchMedia('(max-width:899px)');
  const pageOrder={home:0,material:1,quiz:2,result:3,admin:3};
  let previousPage='home';
  let activeModal=null;
  let answerPlaceholder=null;

  function clickProxy(selectors){
    const list=String(selectors||'').split(',').map(s=>s.trim()).filter(Boolean);
    for(const selector of list){
      const el=$(selector);
      if(el && !el.disabled && !el.classList.contains('hidden')){ el.click(); return true; }
    }
    return false;
  }

  function createMobilePageTitle(){
    const brand=$('.top-nav .brand');
    if(!brand || $('.wk-mobile-page-title')) return;
    const title=document.createElement('div');
    title.className='wk-mobile-page-title';
    title.setAttribute('aria-live','polite');
    title.textContent='Beranda';
    brand.insertAdjacentElement('afterend',title);
  }

  function activePageName(){
    const page=$('.page.active');
    return page?.id?.replace(/Page$/,'') || 'home';
  }

  function pageTitle(page){
    const ja=(document.documentElement.lang||'id').toLowerCase().startsWith('ja');
    const map=ja
      ? {home:'Wikaru',material:'教材',quiz:'学習',result:'学習結果',admin:'参加者レポート'}
      : {home:'Wikaru',material:'Materi',quiz:'Latihan',result:'Hasil Belajar',admin:'Laporan Peserta'};
    if(page==='material') return $('#materialPage .content-card > h2')?.textContent?.trim() || map.material;
    if(page==='result') return $('#resultPage h2')?.textContent?.trim() || map.result;
    if(page==='admin') return $('#adminPage h2')?.textContent?.trim() || map.admin;
    return map[page] || 'Wikaru';
  }

  function updatePageChrome(){
    const page=activePageName();
    const title=$('.wk-mobile-page-title');
    if(title) title.textContent=pageTitle(page);
    document.body.dataset.wkPage=page;
    $$('.bottom-nav button').forEach(btn=>{
      const label=$('span',btn)?.textContent?.trim();
      if(label){btn.title=label;if(!btn.getAttribute('aria-label'))btn.setAttribute('aria-label',label);}
    });
    if(page!==previousPage){
      const target=$('.page.active');
      const forward=(pageOrder[page]??0)>=(pageOrder[previousPage]??0);
      if(target){
        target.classList.remove('wk-page-enter-forward','wk-page-enter-back');
        void target.offsetWidth;
        target.classList.add(forward?'wk-page-enter-forward':'wk-page-enter-back');
        setTimeout(()=>target.classList.remove('wk-page-enter-forward','wk-page-enter-back'),340);
      }
      previousPage=page;
    }
  }

  function cloneSelect(source,id){
    const clone=source.cloneNode(true);
    clone.id=id;
    clone.removeAttribute('class');
    clone.removeAttribute('aria-label');
    return clone;
  }

  function syncSelectOptions(source,clone){
    if(!source||!clone)return;
    const value=source.value;
    clone.innerHTML=source.innerHTML;
    clone.value=value;
  }

  function buildMaterialFilters(){
    const toolbar=$('#materialPage .material-toolbar');
    const section=$('#materialSectionFilter');
    const type=$('#materialTypeFilter');
    if(!toolbar||!section||!type||$('#wkMaterialFilterBtn')) return;

    const ja=(document.documentElement.lang||'id').toLowerCase().startsWith('ja');
    const segments=document.createElement('div');
    segments.className='wk-material-segments';
    segments.setAttribute('aria-label',ja?'教材カテゴリーのショートカット':'Kategori materi cepat');
    segments.innerHTML=ja
      ? '<button type="button" data-wk-section="all" class="active">すべて</button><button type="button" data-wk-section="Kosakata">語彙</button><button type="button" data-wk-section="Percakapan">会話</button>'
      : '<button type="button" data-wk-section="all" class="active">Semua</button><button type="button" data-wk-section="Kosakata">Kosakata</button><button type="button" data-wk-section="Percakapan">Percakapan</button>';
    toolbar.insertAdjacentElement('beforebegin',segments);

    const trigger=document.createElement('button');
    trigger.type='button';trigger.id='wkMaterialFilterBtn';trigger.className='wk-mobile-filter-btn';trigger.setAttribute('aria-label',ja?'教材フィルターを開く':'Buka filter materi');trigger.innerHTML='<i class="fa-solid fa-sliders"></i>';
    toolbar.append(trigger);

    const backdrop=document.createElement('div');
    backdrop.className='wk-sheet-backdrop';backdrop.id='wkSheetBackdrop';
    const sheet=document.createElement('section');
    sheet.className='wk-filter-sheet';sheet.id='wkMaterialFilterSheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','wkFilterTitle');
    const sectionClone=cloneSelect(section,'wkSectionFilter');
    const typeClone=cloneSelect(type,'wkTypeFilter');
    sheet.innerHTML=ja
      ? '<div class="wk-sheet-handle" aria-hidden="true"></div><div class="wk-sheet-head"><h3 id="wkFilterTitle">教材フィルター</h3><button type="button" class="wk-sheet-close" aria-label="フィルターを閉じる"><i class="fa-solid fa-xmark"></i></button></div><div class="wk-sheet-body"><div class="wk-filter-field" id="wkSectionField"><label for="wkSectionFilter">教材カテゴリー</label></div><div class="wk-filter-field" id="wkTypeField"><label for="wkTypeFilter">品詞</label></div></div><div class="wk-sheet-actions"><button type="button" class="btn secondary" id="wkResetFilter">リセット</button><button type="button" class="btn" id="wkApplyFilter">結果を表示</button></div>'
      : '<div class="wk-sheet-handle" aria-hidden="true"></div><div class="wk-sheet-head"><h3 id="wkFilterTitle">Filter materi</h3><button type="button" class="wk-sheet-close" aria-label="Tutup filter"><i class="fa-solid fa-xmark"></i></button></div><div class="wk-sheet-body"><div class="wk-filter-field" id="wkSectionField"><label for="wkSectionFilter">Kategori materi</label></div><div class="wk-filter-field" id="wkTypeField"><label for="wkTypeFilter">Jenis kata</label></div></div><div class="wk-sheet-actions"><button type="button" class="btn secondary" id="wkResetFilter">Reset</button><button type="button" class="btn" id="wkApplyFilter">Tampilkan hasil</button></div>';
    $('#wkSectionField',sheet).append(sectionClone);$('#wkTypeField',sheet).append(typeClone);
    document.body.append(backdrop,sheet);

    const reflect=()=>{
      sectionClone.value=section.value;typeClone.value=type.value;
      trigger.classList.toggle('has-filter',section.value!=='all'||type.value!=='all');
      $$('[data-wk-section]',segments).forEach(b=>b.classList.toggle('active',b.dataset.wkSection===section.value || (section.value!=='Kosakata'&&section.value!=='Percakapan'&&b.dataset.wkSection==='all')));
    };
    const apply=(clone,source)=>{source.value=clone.value;source.dispatchEvent(new Event('change',{bubbles:true}));reflect();};
    sectionClone.addEventListener('change',()=>apply(sectionClone,section));
    typeClone.addEventListener('change',()=>apply(typeClone,type));
    section.addEventListener('change',reflect);type.addEventListener('change',reflect);
    segments.addEventListener('click',e=>{const b=e.target.closest('[data-wk-section]');if(!b)return;const val=b.dataset.wkSection;const exists=Array.from(section.options).some(o=>o.value===val);section.value=exists?val:'all';section.dispatchEvent(new Event('change',{bubbles:true}));reflect();});

    function open(){syncSelectOptions(section,sectionClone);syncSelectOptions(type,typeClone);reflect();backdrop.classList.add('show');sheet.classList.add('show');document.body.classList.add('wk-sheet-open');setTimeout(()=>$('.wk-sheet-close',sheet)?.focus(),20);}
    function close(){backdrop.classList.remove('show');sheet.classList.remove('show');document.body.classList.remove('wk-sheet-open');trigger.focus();}
    trigger.addEventListener('click',open);backdrop.addEventListener('click',close);$('.wk-sheet-close',sheet).addEventListener('click',close);$('#wkApplyFilter',sheet).addEventListener('click',close);$('#wkResetFilter',sheet).addEventListener('click',()=>{section.value='all';type.value='all';section.dispatchEvent(new Event('change',{bubbles:true}));type.dispatchEvent(new Event('change',{bubbles:true}));syncSelectOptions(section,sectionClone);syncSelectOptions(type,typeClone);reflect();});
    new MutationObserver(()=>{syncSelectOptions(section,sectionClone);reflect();}).observe(section,{childList:true});
    new MutationObserver(()=>{syncSelectOptions(type,typeClone);reflect();}).observe(type,{childList:true});
    reflect();
  }

  function buildQuizHeader(){
    const page=$('#quizPage');const grid=$('#quizPage .quiz-grid');
    if(!page||!grid||$('#wkQuizMobileHead')) return;
    const head=document.createElement('header');
    head.id='wkQuizMobileHead';head.className='wk-quiz-mobile-head';
    const ja=(document.documentElement.lang||'id').toLowerCase().startsWith('ja');
    head.innerHTML=ja
      ? '<button type="button" class="wk-quiz-head-btn" id="wkQuizExit" aria-label="クイズを終了"><i class="fa-solid fa-chevron-left"></i></button><span class="wk-quiz-head-mark" aria-hidden="true">あ</span><div class="wk-quiz-head-copy"><strong id="wkQuizTitle">語彙クイズ</strong><small id="wkQuizSubtitle">最も適切な答えを選びましょう</small></div><div class="wk-question-progress"><strong id="wkQuizCounter">カード 1 / 1</strong><div class="wk-quiz-head-progress" aria-label="クイズの進捗"><span id="wkQuizProgress"></span></div></div><button type="button" class="wk-question-timer" id="wkQuestionTimer" aria-label="タイマーを一時停止"><i class="fa-regular fa-clock" aria-hidden="true"></i><span><small>残り</small><strong id="wkQuestionTimerText">00:30</strong></span></button><button type="button" class="wk-quiz-head-btn" id="wkQuizSettings" aria-label="クイズガイド"><i class="fa-regular fa-circle-question"></i></button>'
      : '<button type="button" class="wk-quiz-head-btn" id="wkQuizExit" aria-label="Keluar dari kuis"><i class="fa-solid fa-chevron-left"></i></button><span class="wk-quiz-head-mark" aria-hidden="true">あ</span><div class="wk-quiz-head-copy"><strong id="wkQuizTitle">Kuis Kosakata</strong><small id="wkQuizSubtitle">Pilih jawaban yang paling tepat</small></div><div class="wk-question-progress"><strong id="wkQuizCounter">Kartu 1 / 1</strong><div class="wk-quiz-head-progress" aria-label="Progres kuis"><span id="wkQuizProgress"></span></div></div><button type="button" class="wk-question-timer" id="wkQuestionTimer" aria-label="Jeda atau lanjutkan timer"><i class="fa-regular fa-clock" aria-hidden="true"></i><span><small>Sisa waktu</small><strong id="wkQuestionTimerText">00:30</strong></span></button><button type="button" class="wk-quiz-head-btn" id="wkQuizSettings" aria-label="Petunjuk kuis"><i class="fa-regular fa-circle-question"></i></button>';
    page.insertBefore(head,grid);
    $('#wkQuizExit').addEventListener('click',()=>clickProxy(".bottom-nav [data-page='home'],.side-btn[data-page='home']"));
    $('#wkQuizSettings').addEventListener('click',()=>clickProxy('#wkQuizHelpButton'));
    $('#wkQuestionTimer').addEventListener('click',()=>clickProxy('#pauseBtn'));
    const answerRow=$('#correctBtn')?.closest('.control-row');if(answerRow)answerRow.classList.add('quiz-answer-row');
    syncAnswerBarLocation();syncQuizHeader();
    const counter=$('#cardCounter');if(counter)new MutationObserver(syncQuizHeader).observe(counter,{childList:true,characterData:true,subtree:true});
    const progress=$('#quizProgress');if(progress)new MutationObserver(syncQuizHeader).observe(progress,{attributes:true,attributeFilter:['style','class']});
    const timer=$('#timerText');if(timer)new MutationObserver(syncQuizHeader).observe(timer,{childList:true,characterData:true,subtree:true});
  }

  function syncQuizHeader(){
    const c=$('#cardCounter')?.textContent?.trim();if(c&&$('#wkQuizCounter'))$('#wkQuizCounter').textContent=c;
    const source=$('#quizProgress'),target=$('#wkQuizProgress');if(source&&target)target.style.width=source.style.width||getComputedStyle(source).width;
    const sourceTimer=$('#timerText'),targetTimer=$('#wkQuestionTimerText');
    if(sourceTimer&&targetTimer){
      const value=sourceTimer.textContent.trim();targetTimer.textContent=value;
      const seconds=value.split(':').map(Number).reduce((total,part)=>total*60+part,0);
      const timer=$('#wkQuestionTimer');timer?.classList.toggle('is-warning',seconds<=10&&seconds>5);timer?.classList.toggle('is-danger',seconds<=5);
    }
  }


  function syncAnswerBarLocation(){
    const row=document.querySelector('.quiz-answer-row');
    if(!row)return;
    if(mobileMQ.matches){
      if(row.parentElement!==document.body){
        answerPlaceholder=document.createComment('wikaru-answer-row-placeholder');
        row.parentNode.insertBefore(answerPlaceholder,row);
        document.body.appendChild(row);
      }
    }else if(answerPlaceholder&&answerPlaceholder.parentNode){
      answerPlaceholder.parentNode.insertBefore(row,answerPlaceholder);
      answerPlaceholder.remove();
      answerPlaceholder=null;
    }
  }

  function setupQuizGestures(){
    const card=$('#flashcard');if(!card||card.dataset.wkGesture)return;card.dataset.wkGesture='1';
    let startX=0,startY=0,startTime=0,longTimer=0,suppressUntil=0,moved=false;
    card.addEventListener('click',e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
    card.addEventListener('pointerdown',e=>{
      if(!mobileMQ.matches||e.button>0||e.target.closest('button'))return;
      startX=e.clientX;startY=e.clientY;startTime=Date.now();moved=false;
      longTimer=window.setTimeout(()=>{suppressUntil=Date.now()+500;$('#exampleBtn')?.click();navigator.vibrate?.(12);},650);
    },{passive:true});
    card.addEventListener('pointermove',e=>{
      if(!startTime)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>12||Math.abs(dy)>12){moved=true;clearTimeout(longTimer);}
    },{passive:true});
    card.addEventListener('pointercancel',()=>{clearTimeout(longTimer);startTime=0;});
    card.addEventListener('pointerup',e=>{
      clearTimeout(longTimer);if(!startTime||!mobileMQ.matches)return;
      const dx=e.clientX-startX,dy=e.clientY-startY;startTime=0;
      if(Math.abs(dx)>72&&Math.abs(dx)>Math.abs(dy)*1.25){
        suppressUntil=Date.now()+450;
        const btn=dx>0?$('#correctBtn'):$('#wrongBtn');
        if(btn&&!btn.disabled){btn.click();navigator.vibrate?.(dx>0?18:[10,35,10]);}
        else card.click();
      }else if(dy<-72&&Math.abs(dy)>Math.abs(dx)*1.25){
        suppressUntil=Date.now()+450;($('#quizFavBtn')||$('#quizFavBtnBack'))?.click();navigator.vibrate?.(10);
      }else if(moved){suppressUntil=Date.now()+80;}
    },{passive:true});
  }

  function feedbackButtons(){  }

  function annotateTable(table){
    if(!table)return;const headers=$$('thead th',table).map(th=>th.textContent.trim());
    $$('tbody tr',table).forEach(row=>$$('td',row).forEach((cell,i)=>cell.dataset.label=headers[i]||`Kolom ${i+1}`));
  }
  function annotateAllTables(root=document){$$('table',root).forEach(annotateTable);}

  function improveAccessibility(){
    $$('button').forEach(btn=>{
      if(!btn.getAttribute('aria-label')){
        const text=btn.textContent.replace(/\s+/g,' ').trim()||btn.title;
        if(text)btn.setAttribute('aria-label',text);
      }
    });
    $$('.modal').forEach(modal=>{
      if(!modal.hasAttribute('role')) modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');modal.setAttribute('aria-hidden',String(!modal.classList.contains('show')));
      const close=$('.close-x',modal);if(close&&!close.getAttribute('aria-label'))close.setAttribute('aria-label','Tutup dialog');
    });
    const speech=$('#speechStatus');if(speech){speech.setAttribute('aria-live','polite');speech.setAttribute('aria-atomic','true');}
  }

  function syncModalState(){
    const shown=$('.modal.show');
    $$('.modal').forEach(m=>m.setAttribute('aria-hidden',String(!m.classList.contains('show'))));
    document.body.classList.toggle('wk-modal-open',!!shown);
    if(shown&&shown!==activeModal){activeModal=shown;setTimeout(()=>{const focusable=$('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',shown);focusable?.focus({preventScroll:true});},25);}
    if(!shown)activeModal=null;
  }

  function setupFocusTrap(){
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        if($('#wkMaterialFilterSheet.show')){$('.wk-sheet-close')?.click();return;}
        const modal=$('.modal.show');if(modal){const close=$('.close-x,#cancelSetup,#cancelQuizSettings,#cancelDelete',modal);close?.click();}
      }
      if(e.key!=='Tab'||!activeModal)return;
      const items=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex="-1"])',activeModal).filter(el=>el.offsetParent!==null);
      if(items.length<2)return;const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
  }

  function observeApplication(){
    $$('.page').forEach(page=>new MutationObserver(()=>setTimeout(updatePageChrome,0)).observe(page,{attributes:true,attributeFilter:['class']}));
    const result=$('#resultContent');if(result)new MutationObserver(()=>{annotateAllTables(result);improveAccessibility();}).observe(result,{childList:true,subtree:true});
    const admin=$('#adminTableWrap');if(admin)new MutationObserver(()=>{annotateAllTables(admin);improveAccessibility();}).observe(admin,{childList:true,subtree:true});
    $$('.modal').forEach(m=>new MutationObserver(syncModalState).observe(m,{attributes:true,attributeFilter:['class']}));
    document.addEventListener('click',event=>{
      if(!event.target.closest('[data-page],.bottom-nav button,.nav-link,.modal button,.modal [role=button],#userMenuBtn,.drop-item')) return;
      setTimeout(()=>{updatePageChrome();syncQuizHeader();syncAnswerBarLocation();},24);
    });
    window.addEventListener('scroll',()=>$('#topNav')?.classList.toggle('wk-scrolled',window.scrollY>8),{passive:true});
    const themeObserver=new MutationObserver(()=>{const meta=$('meta[name="theme-color"]');if(meta)meta.content=document.documentElement.dataset.theme==='dark'?'#0F1722':'#F7F8FA';});
    themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  }

  function init(){
    createMobilePageTitle();buildMaterialFilters();buildQuizHeader();syncAnswerBarLocation();setupQuizGestures();feedbackButtons();improveAccessibility();annotateAllTables();setupFocusTrap();observeApplication();updatePageChrome();syncQuizHeader();syncModalState();
    [mobileMQ,adaptiveMQ].forEach(mq=>mq.addEventListener?.('change',()=>{syncAnswerBarLocation();updatePageChrome();annotateAllTables();}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* source-script: wikaru-v12-final-responsive-behavior */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const landscape=window.matchMedia('(min-width:900px) and (max-width:1199px)');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let selectedKey='';
  const ui=(id,ja)=>document.documentElement.lang==='ja'?ja:id;

  function labelRail(){
    $$('.bottom-nav button').forEach((button,index)=>{
      const label=$('span',button)?.textContent?.replace(/\s+/g,' ').trim() || ['Beranda','Materi','Latihan','Hasil'][index] || 'Menu';
      button.dataset.wkTooltip=label;
      if(!button.getAttribute('aria-label')) button.setAttribute('aria-label',label);
    });
  }

  function ensureMaterialWorkspace(){
    const card=$('#materialPage .content-card');
    const toolbar=$('#materialPage .material-toolbar');
    const grid=$('#materialGrid');
    const empty=$('#materialEmpty');
    if(!card||!toolbar||!grid||!empty) return null;
    let workspace=$('.wk-tablet-material-workspace',card);
    if(!workspace){
      workspace=document.createElement('div');
      workspace.className='wk-tablet-material-workspace';
      const list=document.createElement('div');
      list.className='wk-tablet-material-list-pane';
      const detail=document.createElement('aside');
      detail.className='wk-tablet-material-detail';
      detail.setAttribute('aria-live','polite');
      detail.innerHTML=`<div class="wk-detail-empty"><div class="wk-detail-empty-symbol">語</div><strong>${ui('Pilih kosakata','単語を選んでください')}</strong><span>${ui('Detail, audio, contoh, dan favorit akan tampil di panel ini.','詳細・音声・例文・お気に入りがここに表示されます。')}</span></div>`;
      workspace.append(list,detail);
      card.insertBefore(workspace,toolbar);
      list.append(toolbar,grid,empty);
    }
    return workspace;
  }

  function cardKey(card){
    return $('[data-fav]',card)?.dataset.fav || $('[data-speak-id]',card)?.dataset.speakId || $('.vocab-jp',card)?.textContent?.trim() || '';
  }

  function renderDetail(card){
    const workspace=ensureMaterialWorkspace();
    const detail=$('.wk-tablet-material-detail',workspace||document);
    if(!workspace||!detail) return;
    const cards=$$('.vocab-card',$('#materialGrid'));
    workspace.classList.toggle('is-reference-layout',cards.length===0);
    if(!card||!cards.includes(card)){
      detail.innerHTML=`<div class="wk-detail-empty"><div class="wk-detail-empty-symbol">語</div><strong>${ui('Pilih kosakata','単語を選んでください')}</strong><span>${ui('Detail, audio, contoh, dan favorit akan tampil di panel ini.','詳細・音声・例文・お気に入りがここに表示されます。')}</span></div>`;
      return;
    }
    cards.forEach(item=>{item.classList.toggle('wk-selected',item===card);item.setAttribute('aria-selected',String(item===card));item.tabIndex=0;});
    selectedKey=cardKey(card);
    const jp=$('.vocab-jp',card)?.textContent?.trim()||'—';
    const kana=$('.vocab-kana',card)?.textContent?.trim()||'';
    const romaji=$('.vocab-romaji',card)?.textContent?.trim()||'';
    const meaning=$('.vocab-id',card)?.textContent?.trim()||ui('Arti belum tersedia','意味はまだありません');
    const image=$('img.thumb',card)?.getAttribute('src')||'';
    const tags=$$('.tag',card).map(tag=>`<span class="${esc(tag.className)}">${esc(tag.textContent.trim())}</span>`).join('');
    const actionButtons=$$('.card-actions button',card).map(button=>{
      const clone=button.cloneNode(true);clone.removeAttribute('id');clone.removeAttribute('style');
      return clone.outerHTML;
    }).join('');
    detail.innerHTML=`
      <div class="wk-detail-eyebrow"><span>●</span><span>${ui('Detail kosakata','単語の詳細')}</span></div>
      <div class="wk-detail-visual">
        ${image?`<img class="wk-detail-image" src="${esc(image)}" alt="${esc(jp)}" loading="lazy" decoding="async">`:`<div class="wk-detail-image-fallback">${esc(jp.slice(0,1))}</div>`}
        <div><div class="wk-detail-jp">${esc(jp)}</div>${kana?`<div class="wk-detail-kana">${esc(kana)}</div>`:''}${romaji?`<div class="wk-detail-romaji">${esc(romaji)}</div>`:''}</div>
      </div>
      <div class="wk-detail-meaning">${esc(meaning)}</div>
      <div class="wk-detail-tags">${tags}</div>
      <div class="wk-detail-actions">${actionButtons}</div>
      <div class="wk-detail-hint">${ui('Gunakan tombol di atas untuk mendengar audio, menyimpan favorit, membuka catatan, atau melihat contoh kalimat.','上のボタンから音声、お気に入り、メモ、例文を利用できます。')}</div>`;
  }

  function refreshMaterialDetail(){
    const workspace=ensureMaterialWorkspace();
    if(!workspace) return;
    const cards=$$('.vocab-card',$('#materialGrid'));
    workspace.classList.toggle('is-reference-layout',cards.length===0);
    if(!cards.length){renderDetail(null);return;}
    const next=cards.find(card=>cardKey(card)===selectedKey)||cards[0];
    renderDetail(next);
  }

  function bindMaterial(){
    const grid=$('#materialGrid');
    if(!grid||grid.dataset.wkV12Bound) return;
    grid.dataset.wkV12Bound='1';
    grid.addEventListener('click',event=>{
      const card=event.target.closest('.vocab-card');
      if(card) renderDetail(card);
    });
    grid.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ') return;
      const card=event.target.closest('.vocab-card');
      if(card&&!event.target.closest('button')){event.preventDefault();renderDetail(card);}
    });
    new MutationObserver(()=>requestAnimationFrame(refreshMaterialDetail)).observe(grid,{childList:true,subtree:false});
  }

  function normalizeMenus(){
    const dropdown=$('#userDropdown');
    if(dropdown) dropdown.classList.remove('show');
    const button=$('#userMenuBtn');
    if(button) button.setAttribute('aria-expanded','false');
  }

  function init(){
    labelRail();
    ensureMaterialWorkspace();
    bindMaterial();
    refreshMaterialDetail();
    normalizeMenus();
    landscape.addEventListener?.('change',()=>{labelRail();refreshMaterialDetail();normalizeMenus();});
    const bottom=$('.bottom-nav');
    if(bottom)new MutationObserver(labelRail).observe(bottom,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* source-script: wikaru-learning-journey-runtime */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const STORE='minna_bab23';
  let dailyWord=null;

  function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback;}catch(_){return fallback;}}
  function setText(id,value){const el=$('#'+id);if(el&&value!=null)el.textContent=String(value);}
  function cleanName(value){return String(value||'').trim();}
  function parseNumber(value){const n=Number(String(value||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function sameDay(a,b){const x=new Date(a),y=new Date(b);return x.getFullYear()===y.getFullYear()&&x.getMonth()===y.getMonth()&&x.getDate()===y.getDate();}
  function dayKey(value){const d=new Date(value);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function isJapanese(){return localStorage.getItem(STORE+'_lang')==='ja';}
  function visibleUser(){
    const session=readJson(STORE+'_progress',null);
    return session?.username?{name:session.username,role:session.role||'user'}:{name:'',role:'guest'};
  }
  function resultHistory(){
    const user=visibleUser();
    const rows=readJson(STORE+'_history',[]);
    return Array.isArray(rows)?rows.filter(r=>!user.name||String(r.username||'').toLocaleLowerCase()===user.name.toLocaleLowerCase()):[];
  }
  function lastResult(){return readJson(STORE+'_lastResult',null);}
  function calculateStreak(rows){
    const keys=[...new Set(rows.map(r=>dayKey(r.finishedAt)).filter(Boolean))].sort().reverse();
    if(!keys.length)return 0;
    const today=new Date();today.setHours(0,0,0,0);
    const first=new Date(keys[0]+'T00:00:00');
    const diff=Math.round((today-first)/86400000);
    if(diff>1)return 0;
    let streak=1;
    let cursor=first;
    for(let i=1;i<keys.length;i++){
      const next=new Date(keys[i]+'T00:00:00');
      const gap=Math.round((cursor-next)/86400000);
      if(gap!==1)break;
      streak++;cursor=next;
    }
    return streak;
  }
  function chapterNumbers(label){
    const nums=[...String(label||'').matchAll(/\d+/g)].map(m=>Number(m[0]));
    if(nums.length>1){const out=[];for(let i=nums[0];i<=nums[1];i++)out.push(i);return out;}
    return nums;
  }
  function activeVocabulary(){
    const all=Array.isArray(window.__WIKARU_VOCABULARY)?window.__WIKARU_VOCABULARY:[];
    const setup=readJson(STORE+'_settings',{});
    const chapters=chapterNumbers(setup.chapter);
    const includeFiction=localStorage.getItem(STORE+'_includeFiction')!=='false';
    return all.filter(v=>{
      const combinedAll=String(setup.chapter||'')==='Bab 1-50'&&String(setup.materialCategory||'').toLocaleLowerCase()==='materi umum';
      const number=Number(v.chapterNumber);
      const itemBook=String(v.book||'');
      const isMinnaTwo=/^Minna no Nihongo II(\s|$|\()/i.test(itemBook);
      const isMinnaOne=/^Minna no Nihongo I(\s|$|\()/i.test(itemBook)&&!isMinnaTwo;
      const sameBook=combinedAll
        ? ((isMinnaOne&&number>=1&&number<=25)||(isMinnaTwo&&number>=26&&number<=50))
        : (!setup.book||v.book===setup.book);
      const sameMaterial=!setup.materialCategory||String(v.materialCategory||'').toLocaleLowerCase()===String(setup.materialCategory||'').toLocaleLowerCase();
      const sameChapter=!chapters.length||chapters.includes(Number(v.chapterNumber));
      const fictionOk=includeFiction||!v.isFiction;
      return sameBook&&sameMaterial&&sameChapter&&fictionOk;
    });
  }
  function chooseDailyWord(){
    const list=activeVocabulary();
    if(!list.length)return null;
    const now=new Date();
    const seed=Number(`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`);
    return list[seed%list.length];
  }
  function splitChoice(){
    const text=$('#activeChoiceText')?.textContent?.trim()||'';
    const parts=text.split('•').map(v=>v.trim()).filter(Boolean);
    return {book:parts[0]||'Wikaru',category:parts[1]||'',chapter:parts.slice(2).join(' • ')||''};
  }
  function compactHomeSelection(choice={}){
    const rawChapter=String(choice.chapter||'').trim();
    const chapterParts=rawChapter.split('•').map(v=>v.trim()).filter(Boolean);
    const chapter=chapterParts.find(v=>/^Bab\s+\d+(?:-\d+)?$/i.test(v)) || chapterParts[0] || '';
    const topic=chapterParts.filter(v=>v!==chapter).join(' • ').trim();
    const canonicalCategory=String(choice.category||'').replace(/^Kata-Kata Referensi dan Informasi$/i,'Referensi & Informasi').trim();
    let titlePart='';
    let subtitle='';
    if(topic){
      const slashIndex=topic.lastIndexOf(' / ');
      if(slashIndex>=0){
        subtitle=topic.slice(0,slashIndex).trim();
        titlePart=topic.slice(slashIndex+3).trim();
      }else titlePart=topic;
    }else titlePart=canonicalCategory;
    if(/^Bab\s*24$/i.test(chapter) && /贈答|Tukar-Menukar Hadiah/i.test(rawChapter)){
      titlePart='Tukar-Menukar Hadiah';
      subtitle='贈答の習慣（ぞうとうのしゅうかん）';
    }else if(/^Bab\s*23$/i.test(chapter) && /道路|Jalan dan Lalu Lintas/i.test(rawChapter)){
      titlePart='Jalan dan Lalu Lintas';
      subtitle='道路・交通（どうろ・こうつう）';
    }
    const title=[chapter,titlePart].filter(Boolean).join(' · ') || (titlePart||chapter||'Pilihan Aktif');
    return {title,subtitle};
  }
  function greeting(hour,jp){
    if(jp){if(hour<11)return'おはようございます';if(hour<18)return'こんにちは';return'こんばんは';}
    if(hour<11)return'Selamat pagi';if(hour<15)return'Selamat siang';if(hour<18)return'Selamat sore';return'Selamat malam';
  }
  function normalizeHomeRomaji(value){
    return String(value||'')
      .replace(/[、，]/g, ',')
      .replace(/。/g, '.')
      .replace(/！/g, '!')
      .replace(/？/g, '?')
      .replace(/・/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function syncThemeMenu(){
    const dropdown=$('#userDropdown');
    const menuScroll=dropdown?.querySelector('.profile-menu-scroll') || dropdown;
    const theme=$('#themeToggle');
    const logout=$('#logoutBtn');
    if(menuScroll&&theme&&theme.parentElement!==menuScroll){
      theme.classList.add('drop-item','home-theme-menu-item');
      theme.setAttribute('role','menuitem');
      const anchor=logout?.parentElement===menuScroll ? logout : null;
      menuScroll.insertBefore(theme,anchor);
    }
  }
  function refreshHome(){
    const jp=isJapanese();
    const user=visibleUser();
    const result=lastResult();
    const history=resultHistory();
    const hasLearningHistory=history.length>0;
    const choice=splitChoice();
    const compactChoice=compactHomeSelection(choice);
    const count=parseNumber($('#homeVocabCount')?.textContent);
    const target=Math.max(1,Math.min(15,count||15));
    const todayRows=history.filter(r=>sameDay(r.finishedAt,new Date()));
    const completed=Math.min(target,todayRows.reduce((sum,r)=>sum+Number(r.totalQuestions||0),0));
    const progress=Math.max(0,Math.min(100,Math.round((completed/target)*100)));
    const streak=calculateStreak(history);
    const hour=new Date().getHours();
    const hello=greeting(hour,jp);
    const displayName=user.name|| (jp?'ゲスト':'Tamu');

    setText('homeGreetingKicker',jp?'今日も少しずつ':'Belajar sebentar, progres tetap jalan');
    setText('homeGreetingTitle',user.name?(jp?`${user.name}さん、${hello}！`:`${hello}, ${user.name}!`):(jp?`${hello}！`:`${hello}!`));
    setText('homeGreetingCopy',user.name?(jp?'今日も数分から、気軽に始めましょう。':'Pilih satu aktivitas, belajar beberapa menit, lalu lanjutkan harimu dengan progres baru.'):(jp?'名前を入力して、最初の学習を始めましょう。':'Masukkan nama untuk memulai perjalanan belajar yang tersimpan.'));
    setText('homeProfileName',displayName);
    setText('homeProfileRole',user.role==='admin'?(jp?'管理者':'Pengelola'):(user.name?(jp?'学習中':'Sedang belajar'):(jp?'はじめる準備':'Siap mulai')));
    setText('homeStreakValue',streak);
    setText('homeStreakLabel',jp?'日連続':'hari beruntun');
    setText('homeContinueEyebrow',user.name?(jp?'前回の続きから':'Lanjut dari terakhir'):(jp?'最初の一歩':'Mulai belajar'));
    setText('homeActiveBook',choice.book);
    setText('homeActiveChapter',compactChoice.title || (jp?'選択中の教材':'Pilihan Aktif'));
    setText('homeActiveCategory',compactChoice.subtitle);
    const homeTopic=$('#homeActiveCategory');
    if(homeTopic) homeTopic.hidden=!compactChoice.subtitle;
    const homeDivider=$('.home-title-divider');
    if(homeDivider) homeDivider.hidden=true;
    const isNearbyStoreReference = typeof isReferenceInfoBab27 === 'function' && isReferenceInfoBab27();
    const isWeatherReference = typeof isReferenceInfoBab32 === 'function' && isReferenceInfoBab32();
    const isPostal50Reference = /Bab\s*50/i.test(String(choice.chapter||''))
      && /封筒|はがき|Alamat Surat|Kartu Pos/i.test(String(choice.chapter||''))
      && /Referensi dan Informasi/i.test(String(choice.category||''));
    setText('homeContinueDescription',isPostal50Reference
      ? (jp?'封筒とはがきの宛名、郵便局で使うことば、窓口での会話、送り方を、参考画像と45項目の教材で学びます。':'Pelajari alamat surat dan kartu pos melalui gambar referensi, 45 materi, percakapan di loket, format penulisan, serta langkah pengiriman.')
      : isWeatherReference
      ? (jp?'天気記号、降水確率、気温、日本の地方と都市を、実際の天気情報と一緒に学びます。':'Baca peta cuaca Jepang, kuasai 37 istilah penting, lalu bandingkan dengan prakiraan nyata dari sumber tepercaya.')
      : isNearbyStoreReference
      ? (jp?'修理店、クリーニング屋、コンビニの24語を、画像・例文・音声・フラッシュカードで学びます。':'Pelajari 24 kosakata layanan toko reparasi, laundry, dan minimarket melalui gambar, contoh kalimat, audio, dan flashcard.')
      : (jp?'フラッシュカードや音声、例文、発音練習を一つのセッションでまとめて学べます。':'Lanjut dari kartu terakhir, dengarkan pelafalannya, lalu coba ucapkan sendiri.'));
    setText('homeSessionStatus',user.name?(jp?'すぐに続けられます':'Siap lanjut'):(jp?'名前を入力して始めましょう':'Masukkan nama dulu'));
    setText('homeProgressLabel',jp?'今日の目標':'Target belajar hari ini');
    setText('homeProgressValue',progress+'%');
    const progressCaption=completed>=target
      ? (jp?'今日の目標を達成しました！':'Target hari ini selesai. Keren, pertahankan ritmenya!')
      : (completed
          ? jp?`あと${target-completed}語で今日の目標達成です。`:`${target-completed} kata lagi. Kamu hampir sampai!`
          : (jp?'今日のセッションはまだありません。':'Belum ada sesi yang diselesaikan hari ini.'));
    setText('homeProgressCaption',progressCaption);
    const fill=$('#homeProgressFill');if(fill)fill.style.width=progress+'%';
    const track=$('#homeProgressTrack');if(track){track.setAttribute('aria-valuenow',String(progress));}
    setText('homeTargetDone',completed);setText('homeTargetTotal','/'+target);setText('homeTargetStat',`${completed}/${target}`);
    setText('homeTargetStatLabel',jp?'今日の目標':'Target hari ini');
    setText('homeTargetLabel',jp?'今日の目標':'Target hari ini');
    setText('homeTargetTitle',completed>=target?(jp?'目標達成！':'Target selesai!'):(jp?'少しずつ、学習を習慣に':'Sedikit demi sedikit, jadi bisa'));
    setText('homeTargetDescription',completed>=target?(jp?'今日の学習をしっかり積み重ねました。':'Target hari ini sudah selesai. Saatnya rayakan progres kecilmu.'):(jp?`今日は${target}語を学んで、学習記録をつなげましょう。`:`Pelajari ${target} kata hari ini dan pertahankan rentetan belajarmu.`));
    setText('homeTargetActionLabel',completed>=target?(jp?'さっと復習する':'Ulang sebentar'):(jp?'今日の学習を始める':'Mulai sekarang'));
    const targetActionButton=$('#homeTargetActionLabel')?.closest('button');
    if(targetActionButton)targetActionButton.setAttribute('aria-label',$('#homeTargetActionLabel')?.textContent?.trim()||(jp?'今日の学習を始める':'Mulai sekarang'));
    const ring=$('#homeTargetRing');if(ring)ring.style.setProperty('--target-progress',`${progress*3.6}deg`);
    setText('homeAccuracyValue',result?`${Number(result.scorePercent||0)}%`:'—');
    setText('homeAccuracyLabel',jp?'前回の正答率':'Akurasi terakhir');
    const startText=$('#homeStartBtn span');
    if(startText){
      startText.textContent=jp
        ? (hasLearningHistory?'学習を続ける':'学習を始める')
        : (hasLearningHistory?'Lanjut belajar':'Mulai belajar');
    }
    const loginText=$('#homeLoginBtn span');if(loginText)loginText.textContent=jp?'名前を入力して始める':'Masukkan nama & mulai';
    const materialText=$('#homeMaterialBtn span');if(materialText)materialText.textContent=jp?'教材を見る':'Jelajahi materi';
    const resultText=$('#homeResultBtn span');if(resultText)resultText.textContent=jp?'進捗を見る':'Lihat progres';

    const wrong=Number(result?.wrongCount||0);
    if(result&&wrong>0){
      setText('homeRecommendationTitle',jp?`間違えた${wrong}語を復習しましょう`:`Perkuat ${wrong} kata yang masih goyah`);
      setText('homeRecommendationCopy',jp?`前回の正答率は${Number(result.scorePercent||0)}%でした。間違えたカードから復習しましょう。`:`Akurasi terakhirmu ${Number(result.scorePercent||0)}%. Mulai dari kartu yang belum mantap.`);
      setText('homeRecommendationAction',jp?'復習を始める':'Mulai latihan ulang');
    }else if(result){
      setText('homeRecommendationTitle',jp?'いい流れを続けましょう':'Progresmu sedang bagus');
      setText('homeRecommendationCopy',jp?`前回の正答率は${Number(result.scorePercent||0)}%でした。短い復習で記憶を定着させましょう。`:`Skor terakhirmu ${Number(result.scorePercent||0)}%. Ulang sebentar agar kata-katanya tetap melekat.`);
      setText('homeRecommendationAction',jp?'もう一度チャレンジ':'Latihan lagi');
    }else{
      setText('homeRecommendationTitle',jp?'まずは5分から始めましょう':'Mulai dari lima menit');
      setText('homeRecommendationCopy',jp?'学習を終えると、結果に合ったおすすめが表示されます。':'Pilih satu aktivitas dan mulai tanpa menunggu suasana hati yang sempurna.');
      setText('homeRecommendationAction',jp?'学習を始める':'Mulai latihan');
    }

    dailyWord=chooseDailyWord();
    if(dailyWord){
      setText('homeDailyJapanese',dailyWord.kanji||dailyWord.kana||dailyWord.romaji||'—');
      setText('homeDailyKana',dailyWord.kana||'');
      setText('homeDailyRomaji',normalizeHomeRomaji(dailyWord.romaji||''));
      setText('homeDailyMeaning',dailyWord.indonesia||dailyWord.sectionMeaning||'');
      setText('homeDailyIndex',jp?'今日の言葉':`Kata ${String((activeVocabulary().indexOf(dailyWord)+1)||1).padStart(2,'0')}`);
      const favs=readJson(STORE+'_favorites',[]);
      const active=Array.isArray(favs)&&favs.includes(dailyWord.id);
      const fav=$('#homeDailyFavoriteBtn');if(fav){fav.classList.toggle('active',active);fav.setAttribute('aria-pressed',String(active));fav.innerHTML=`<i class="${active?'fa-solid':'fa-regular'} fa-star"></i>`;}
    }
    setText('homeDailyWordLabel',jp?'今日の単語':'Kosakata hari ini');
    setText('homeDailyWordTitle',jp?'今日の一語を覚えよう':'Kenalan dengan satu kata baru');
    setText('homeListenLabel',jp?'音声を聞く':'Dengarkan');setText('homeSpeakLabel',jp?'発音練習':'Latihan bicara');
    setText('homeQuickLabel',jp?'すぐに学ぶ':'Aktivitas cepat');
    setText('homeQuickTitle',jp?'今日はどうやって学びますか？':'Mau belajar dengan cara apa?');
    setText('homeQuickHint',jp?'横にスワイプして見る':'Geser untuk melihat lainnya');
    setText('homeQuickMaterial',jp?'教材':'Materi');
    setText('homeQuickMaterialCopy',jp?'選択中の単語を学ぶ':'Pelajari kosakata aktif');
    setText('homeQuickFlashcard',jp?'フラッシュカード':'Flashcard');
    setText('homeQuickFlashCopy',jp?'カードでテンポよく復習':'Latihan kartu terarah');
    setText('homeQuickSpeech',jp?'発音練習':'Latihan bicara');
    setText('homeQuickSpeechCopy',jp?'日本語を声に出して練習':'Ucapkan kosakata Jepang');
    setText('homeQuickResult',jp?'前回の結果':'Hasil terakhir');
    setText('homeQuickResultCopy',jp?'スコアと回答を確認':'Tinjau skor dan jawaban');
    setText('homeQuickFavorite',jp?'お気に入り':'Favorit');
    setText('homeQuickFavoriteCopy',jp?'保存した単語を開く':'Buka kata tersimpan');
    setText('homeRecommendationLabel',jp?'あなたにおすすめ':'Pilihan untukmu');
    syncThemeMenu();
  }
  function proxyClick(selectors){
    for(const selector of String(selectors||'').split(',')){
      const el=$(selector.trim());
      if(el&&!el.disabled&&el.offsetParent!==null){el.click();return true;}
    }
    return false;
  }
  function speakDaily(){
    const text=dailyWord?.speech||dailyWord?.kana||dailyWord?.kanji;
    if(!text||!('speechSynthesis'in window))return;
    if(typeof window.wikaruNaturalSpeak === "function") return window.wikaruNaturalSpeak(text,"ja-JP",{kind:"vocab",button:$("#homeDailyAudioBtn")});
    speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='ja-JP';utter.rate=.90;utter.pitch=.99;speechSynthesis.speak(utter);
  }
  function toggleFavorite(){
    if(!dailyWord?.id)return;
    const favorites=readJson(STORE+'_favorites',[]);
    const list=Array.isArray(favorites)?favorites:[];
    const index=list.indexOf(dailyWord.id);
    if(index>=0)list.splice(index,1);else list.push(dailyWord.id);
    localStorage.setItem(STORE+'_favorites',JSON.stringify(list));
    refreshHome();
  }
  function openFavorites(){
    const material=$('#homeMaterialBtn')||$('[data-page="material"]');
    material?.click();
    setTimeout(()=>{
      const search=$('#materialSearch');if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
    },180);
  }
  function bind(){
    const home=$('#homePage');if(!home||home.dataset.journeyBound)return;home.dataset.journeyBound='1';
    home.addEventListener('click',event=>{
      const proxy=event.target.closest('[data-home-proxy]');if(proxy){event.preventDefault();proxyClick(proxy.dataset.homeProxy);return;}
      const action=event.target.closest('[data-home-action]');if(action?.dataset.homeAction==='favorites'){event.preventDefault();openFavorites();}
    });
    $('#homeDailyAudioBtn')?.addEventListener('click',speakDaily);
    $('#homeDailySpeechBtn')?.addEventListener('click',()=>proxyClick('#homeStartBtn,#homeLoginBtn'));
    $('#homeDailyFavoriteBtn')?.addEventListener('click',toggleFavorite);
    ['#activeChoiceText','#homeVocabCount','#homeTimeValue','#homeChapterCount','#userMenuText'].forEach(selector=>{const el=$(selector);if(el)new MutationObserver(()=>requestAnimationFrame(refreshHome)).observe(el,{childList:true,subtree:true,characterData:true});});
    const themeObserver=new MutationObserver(()=>requestAnimationFrame(syncThemeMenu));themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','lang']});
    $('#navLangBtn')?.addEventListener('click',()=>setTimeout(refreshHome,80));
    $('#langToggleDrop')?.addEventListener('click',()=>setTimeout(refreshHome,80));
    window.addEventListener('storage',refreshHome);
  }
  let homeProgressWatchTimer=0;
  let homeProgressStartupTimer=0;
  let lastHomeProgressSignature='';
  function homeProgressSignature(){
    const keys=[
      STORE+'_progress',
      STORE+'_history',
      STORE+'_lastResult',
      STORE+'_settings',
      STORE+'_includeFiction',
      STORE+'_lang'
    ];
    const storagePart=keys.map(key=>`${key}:${localStorage.getItem(key)||''}`).join('|');
    const domPart=[
      $('#activeChoiceText')?.textContent||'',
      $('#homeVocabCount')?.textContent||'',
      $('#userMenuText')?.textContent||''
    ].join('|');
    return storagePart+'||'+domPart;
  }
  function syncHomeProgress(force=false){
    const signature=homeProgressSignature();
    if(force||signature!==lastHomeProgressSignature){
      lastHomeProgressSignature=signature;
      refreshHome();
    }
  }
  function startHomeStartupSync(){
    clearInterval(homeProgressStartupTimer);
    const startedAt=Date.now();
    let stableTicks=0;
    let previousSignature='';
    homeProgressStartupTimer=setInterval(()=>{
      const signature=homeProgressSignature();
      if(signature===previousSignature) stableTicks++; else stableTicks=0;
      previousSignature=signature;
      syncHomeProgress(false);
      if((Date.now()-startedAt>10000&&stableTicks>=4)||Date.now()-startedAt>16000){
        clearInterval(homeProgressStartupTimer);
        homeProgressStartupTimer=0;
      }
    },300);
  }
  function bindHomeProgressLifecycle(){
    if(window.__wikaruHomeProgressLifecycleBound)return;
    window.__wikaruHomeProgressLifecycleBound=true;
    window.__wikaruRefreshHomeProgress=()=>syncHomeProgress(true);
    window.addEventListener('pageshow',()=>{syncHomeProgress(true);startHomeStartupSync();});
    window.addEventListener('focus',()=>syncHomeProgress(true));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncHomeProgress(true);});
    document.addEventListener('wikaru:sync-success',()=>syncHomeProgress(true));
    document.addEventListener('wikaru:sync-queue',()=>syncHomeProgress(true));
    document.addEventListener('wikaru:home-refresh',()=>syncHomeProgress(true));
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-page="home"],#adminBackHomeWarn'))setTimeout(()=>syncHomeProgress(true),0);
    },true);
    homeProgressWatchTimer=setInterval(()=>{
      if(document.hidden)return;
      const home=$('#homePage');
      if(home?.classList.contains('active'))syncHomeProgress(false);
    },1000);
  }
  function init(){
    bind();
    bindHomeProgressLifecycle();
    syncThemeMenu();
    syncHomeProgress(true);
    startHomeStartupSync();
    setTimeout(()=>syncHomeProgress(true),350);
    setTimeout(()=>syncHomeProgress(true),1200);
    setTimeout(()=>syncHomeProgress(true),2500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* source-script: wikaru-profile-category-responsive-runtime */
(function(){
  "use strict";

  const CATEGORY_SESSION_KEY = "wikaru_category_cue_seen";
  const STORE_KEY = "minna_bab23";
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  let lastMenuOpener = null;
  let resizeTimer = 0;

  function readJSON(key, fallback=null){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(error){
      console.warn("Wikaru storage read error:", error);
      return fallback;
    }
  }

  function isJapanese(){
    try{
      return document.documentElement.lang === "ja" ||
        localStorage.getItem(STORE_KEY + "_lang") === "ja";
    }catch(error){
      return document.documentElement.lang === "ja";
    }
  }

  function currentSession(){
    return readJSON(STORE_KEY + "_progress", null);
  }

  function visibleMenuItems(){
    return $$("#userDropdown [role='menuitem']").filter(item => {
      if(item.classList.contains("hidden") || item.disabled) return false;
      const style = getComputedStyle(item);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  }

  function setBackdrop(open){
    const backdrop = $("#profileMenuBackdrop");
    if(!backdrop) return;
    backdrop.classList.toggle("show", open);
    backdrop.setAttribute("aria-hidden", String(!open));
  }

  function updateProfileMenuContent(){
    const session = currentSession();
    const logged = !!String(session?.username || "").trim();
    const admin = session?.role === "admin";
    const activeChoice = String($("#activeChoiceText")?.textContent || "").trim();

    const loginBtn = $("#loginDropBtn");
    const adminBtn = $("#adminDropBtn");
    const logoutBtn = $("#logoutBtn");
    const menuName = $("#profileMenuName");
    const menuRole = $("#profileMenuRole");
    const menuCategory = $("#profileMenuCategory");
    const menuAvatar = $("#profileMenuHeader .profile-menu-avatar i");

    loginBtn?.classList.toggle("hidden", logged);
    adminBtn?.classList.toggle("hidden", !admin);
    if(logoutBtn) logoutBtn.classList.toggle("hidden", !logged);

    if(menuName){
      const nextName = logged
        ? (admin ? "Admin404" : String(session.username))
        : (isJapanese() ? "ゲストユーザー" : "Pengguna Tamu");
      if(menuName.textContent !== nextName) menuName.textContent = nextName;
    }
    if(menuRole){
      const nextRole = logged
        ? (admin ? (isJapanese() ? "管理者" : "Administrator") : (isJapanese() ? "学習者" : "Peserta belajar"))
        : (isJapanese() ? "ログインしていません" : "Belum masuk");
      if(menuRole.textContent !== nextRole) menuRole.textContent = nextRole;
    }
    if(menuCategory){
      const prefix = isJapanese() ? "現在のカテゴリー：" : "Kategori pilihan: ";
      const nextCategory = prefix + (activeChoice || (isJapanese() ? "未選択" : "Belum dipilih"));
      if(menuCategory.textContent !== nextCategory) menuCategory.textContent = nextCategory;
    }
    if(menuAvatar){
      const nextAvatarClass = admin ? "fa-solid fa-user-shield" : (logged ? "fa-solid fa-user" : "fa-regular fa-user");
      if(menuAvatar.className !== nextAvatarClass) menuAvatar.className = nextAvatarClass;
    }

    const realThemeButton = $("#themeToggle");
    if(realThemeButton && realThemeButton.closest("#userDropdown")){
      realThemeButton.setAttribute("role", "menuitem");
      realThemeButton.setAttribute("tabindex", "0");
    }

    const loginLabel = $("#loginDropBtn span");
    if(loginLabel){
      const nextLoginLabel = isJapanese() ? "ログイン／学習者名を入力" : "Masuk / Isi Nama Peserta";
      if(loginLabel.textContent !== nextLoginLabel) loginLabel.textContent = nextLoginLabel;
    }
    const adminLabel = $("#adminDropBtn span");
    if(adminLabel){
      const nextAdminLabel = isJapanese() ? "管理者パネル" : "Panel Admin";
      if(adminLabel.textContent !== nextAdminLabel) adminLabel.textContent = nextAdminLabel;
    }
    const homeCategoryLabel = $("#homeChangeCategoryBtn span");
    if(homeCategoryLabel){
      const nextHomeCategoryLabel = isJapanese() ? "語彙カテゴリーを変更" : "Ganti Materi Belajar";
      if(homeCategoryLabel.textContent !== nextHomeCategoryLabel) homeCategoryLabel.textContent = nextHomeCategoryLabel;
    }
    $("#homeChangeCategoryBtn")?.setAttribute(
      "aria-label",
      isJapanese() ? "語彙カテゴリーを変更" : "Ganti materi belajar"
    );
  }

  function openUserDropdown(opener){
    const button = $("#userMenuBtn");
    const dropdown = $("#userDropdown");
    if(!button || !dropdown) return;

    lastMenuOpener = opener || button;
    updateProfileMenuContent();
    dropdown.classList.add("show");
    dropdown.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    document.body.classList.add("profile-menu-open");
    setBackdrop(true);

    requestAnimationFrame(() => {
      const first = visibleMenuItems()[0];
      first?.focus({preventScroll:true});
      first?.scrollIntoView({block:"nearest"});
    });
  }

  function closeUserDropdown(options={}){
    const {returnFocus=false} = options;
    const button = $("#userMenuBtn");
    const dropdown = $("#userDropdown");
    if(!dropdown) return;

    dropdown.classList.remove("show");
    dropdown.setAttribute("aria-hidden", "true");
    button?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("profile-menu-open");
    setBackdrop(false);

    if(returnFocus){
      const target = lastMenuOpener instanceof HTMLElement ? lastMenuOpener : button;
      target?.focus({preventScroll:true});
    }
  }

  window.openUserDropdown = openUserDropdown;
  window.closeUserDropdown = closeUserDropdown;

  function toggleUserDropdown(event){
    event?.preventDefault();
    event?.stopImmediatePropagation();
    const dropdown = $("#userDropdown");
    if(!dropdown) return;
    if(dropdown.classList.contains("show")) closeUserDropdown({returnFocus:true});
    else openUserDropdown(event?.currentTarget || $("#userMenuBtn"));
  }

  function invokeCategorySetup(){
    closeUserDropdown();
    try{
      if(typeof window.openSetup === "function"){
        window.openSetup();
        return;
      }
    }catch(error){
      console.warn("Wikaru openSetup direct call failed:", error);
    }
    const fallback = $("#changeCategoryBtn");
    if(fallback && document.activeElement !== fallback){
      fallback.click();
    }
  }

  function bindProfileMenu(){
    const button = $("#userMenuBtn");
    const dropdown = $("#userDropdown");
    const backdrop = $("#profileMenuBackdrop");
    if(!button || !dropdown) return;


    button.onclick = null;
    if(!button.dataset.profileMenuBound){
      button.dataset.profileMenuBound = "true";
      button.addEventListener("click", toggleUserDropdown, {capture:true});
      button.addEventListener("keydown", event => {
        if(event.key === "ArrowDown"){
          event.preventDefault();
          openUserDropdown(button);
        }
      });
    }

    if(!dropdown.dataset.profileMenuBound){
      dropdown.dataset.profileMenuBound = "true";
      dropdown.addEventListener("click", event => {
        event.stopPropagation();
        if(event.target.closest("#themeToggle")){
          setTimeout(closeUserDropdown, 0);
        }
      });
      dropdown.addEventListener("keydown", event => {
        const items = visibleMenuItems();
        if(!items.length) return;
        const index = items.indexOf(document.activeElement);

        if(event.key === "Escape"){
          event.preventDefault();
          closeUserDropdown({returnFocus:true});
          return;
        }
        if(event.key === "ArrowDown"){
          event.preventDefault();
          items[(index + 1 + items.length) % items.length].focus();
        }else if(event.key === "ArrowUp"){
          event.preventDefault();
          items[(index - 1 + items.length) % items.length].focus();
        }else if(event.key === "Home"){
          event.preventDefault();
          items[0].focus();
        }else if(event.key === "End"){
          event.preventDefault();
          items[items.length - 1].focus();
        }
      });
    }

    if(backdrop && !backdrop.dataset.profileMenuBound){
      backdrop.dataset.profileMenuBound = "true";
      backdrop.addEventListener("click", () => closeUserDropdown({returnFocus:true}));
    }

    document.addEventListener("click", event => {
      if(!event.target.closest("#userMenuBtn") && !event.target.closest("#userDropdown")){
        closeUserDropdown();
      }
    }, {capture:false});

    document.addEventListener("keydown", event => {
      if(event.key === "Escape" && dropdown.classList.contains("show")){
        event.preventDefault();
        closeUserDropdown({returnFocus:true});
      }
    });
  }

  function bindMenuActions(){
    const loginBtn = $("#loginDropBtn");
    if(loginBtn && !loginBtn.dataset.actionBound){
      loginBtn.dataset.actionBound = "true";
      loginBtn.addEventListener("click", () => {
        closeUserDropdown();
        const homeLogin = $("#homeLoginBtn");
        if(homeLogin) homeLogin.click();
        else if(typeof window.openLogin === "function") window.openLogin();
      });
    }

    const categoryBtn = $("#changeCategoryBtn");
    if(categoryBtn && !categoryBtn.dataset.profileActionBound){
      categoryBtn.dataset.profileActionBound = "true";
      categoryBtn.addEventListener("click", () => setTimeout(closeUserDropdown, 0));
    }

    const homeCategory = $("#homeChangeCategoryBtn");
    if(homeCategory && !homeCategory.dataset.actionBound){
      homeCategory.dataset.actionBound = "true";
      homeCategory.addEventListener("click", invokeCategorySetup);
    }

    const adminDrop = $("#adminDropBtn");
    if(adminDrop && !adminDrop.dataset.actionBound){
      adminDrop.dataset.actionBound = "true";
      adminDrop.addEventListener("click", () => {
        closeUserDropdown();
        const adminNav = $('[data-page="admin"]');
        adminNav?.click();
      });
    }

    ["#langToggleDrop","#navFictionToggle","#myResultDrop","#logoutBtn","#themeToggle"].forEach(selector => {
      const item = $(selector);
      if(item && !item.dataset.menuCloseBound){
        item.dataset.menuCloseBound = "true";
        item.addEventListener("click", () => setTimeout(closeUserDropdown, 0));
      }
    });
  }

  function observeState(){
    const textTargets=[
      $("#activeChoiceText"),
      $("#userMenuText"),
      $("#userRoleText"),
      $("#logoutBtn"),
      $("#myResultDrop")
    ].filter(Boolean);
    let refreshFrame=0;
    const scheduleRefresh=()=>{
      if(refreshFrame)return;
      refreshFrame=requestAnimationFrame(()=>{
        refreshFrame=0;
        updateProfileMenuContent();
        const dropdown=$("#userDropdown");
        if(dropdown?.classList.contains("show")&&dropdown.getAttribute("aria-hidden")!=="false")dropdown.setAttribute("aria-hidden","false");
      });
    };
    if(textTargets.length){
      const textObserver=new MutationObserver(scheduleRefresh);
      textTargets.forEach(target=>textObserver.observe(target,{childList:true,characterData:true,subtree:true}));
    }
    const rootObserver=new MutationObserver(scheduleRefresh);
    rootObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","lang"]});
    window.addEventListener("storage",scheduleRefresh);
  }

  function markCategoryCueWhenOpened(){
    const modal = $("#setupModal");
    if(!modal) return;
    const mark = () => {
      if(modal.classList.contains("show")){
        try{ sessionStorage.setItem(CATEGORY_SESSION_KEY, "true"); }catch(error){}
      }
    };
    mark();
    new MutationObserver(mark).observe(modal, {attributes:true, attributeFilter:["class"]});
  }

  function openCategoryCuePerSession(attempt=0){
    try{

      if(localStorage.getItem("minna_bab23_setupCompleted")==="true"){
        sessionStorage.setItem(CATEGORY_SESSION_KEY,"true");
        return;
      }
      if(sessionStorage.getItem(CATEGORY_SESSION_KEY)) return;
    }catch(error){
      console.warn("Category session cue storage unavailable:", error);
      return;
    }

    const loader = $("#loadingScreen");
    const loaderVisible = loader && getComputedStyle(loader).display !== "none" && Number(getComputedStyle(loader).opacity || 1) > .05;
    const activeModal = $(".modal.show");
    const quizActive = document.body.classList.contains("quiz-mode") || $("#quizPage")?.classList.contains("active");

    if(loaderVisible || activeModal || quizActive){
      if(attempt < 30){
        setTimeout(() => openCategoryCuePerSession(attempt + 1), 280);
      }
      return;
    }

    try{
      if(typeof window.openSetup === "function"){
        window.openSetup();
      }else{
        $("#changeCategoryBtn")?.click();
      }
      if($("#setupModal")?.classList.contains("show")){
        sessionStorage.setItem(CATEGORY_SESSION_KEY, "true");
      }
    }catch(error){
      console.warn("Category session cue error:", error);
    }
  }

  function bindViewportRecovery(){
    let lastWidth=window.innerWidth;
    let lastHeight=window.visualViewport?.height||window.innerHeight;
    const closeOnViewportChange = () => {
      const nextWidth=window.innerWidth;
      const nextHeight=window.visualViewport?.height||window.innerHeight;
      const meaningful=Math.abs(nextWidth-lastWidth)>32||Math.abs(nextHeight-lastHeight)>32;
      lastWidth=nextWidth;lastHeight=nextHeight;
      if(!meaningful) return;
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => closeUserDropdown(), 120);
    };
    window.addEventListener("resize", closeOnViewportChange, {passive:true});
    window.addEventListener("orientationchange", () => closeUserDropdown(), {passive:true});
    window.addEventListener("pageshow", () => {
      closeUserDropdown();
      updateProfileMenuContent();
    });
  }

  function init(){
    bindProfileMenu();
    bindMenuActions();
    updateProfileMenuContent();
    observeState();
    markCategoryCueWhenOpened();
    bindViewportRecovery();


    setTimeout(() => openCategoryCuePerSession(), 900);
    setTimeout(updateProfileMenuContent, 1400);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }
})();

/* source-script: wikaru-loading-motion-runtime-v20 */
(function(){
  "use strict";
  if(window.__wikaruLoaderV20) return;
  window.__wikaruLoaderV20 = true;
  const loader=document.getElementById("loadingScreen");
  if(!loader) return;
  const status=document.getElementById("loaderStatusText");
  const fill=loader.querySelector(".loader-fill");
  const skip=document.getElementById("loaderSkipBtn");
  const started=performance.now();
  const isJa=document.documentElement.lang==="ja";
  const phases=isJa
    ? [["語彙を準備しています",28],["学習画面を整えています",72],["準備ができました",100]]
    : [["Menyiapkan kosakata",28],["Merapikan ruang belajar",72],["Siap digunakan",100]];
  let released=false;
  function setPhase(index){
    const phase=phases[Math.min(index,phases.length-1)];
    if(status) status.textContent=phase[0];
    if(fill) fill.style.setProperty("--wk-loader-progress",phase[1]+"%");
    loader.dataset.phase=String(index+1);
  }
  function release(reason){
    if(released) return;
    released=true;
    const wait=Math.max(0,420-(performance.now()-started));
    setPhase(2);
    setTimeout(()=>{
      if(typeof window.__wikaruReleaseLoader==="function") window.__wikaruReleaseLoader(reason||"loader-v20-ready");
      else{loader.classList.add("is-leaving");setTimeout(()=>{loader.hidden=true;loader.style.display="none";},260);}
    },wait);
  }
  setPhase(0);
  requestAnimationFrame(()=>setTimeout(()=>setPhase(1),110));
  const ready=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>release("dom-ready-v20")));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",ready,{once:true}); else ready();
  skip?.addEventListener("click",()=>release("user-skip-v20"),{once:true});
  setTimeout(()=>loader.classList.add("is-slow"),850);
  setTimeout(()=>release("hard-failsafe-v20"),1800);
  window.addEventListener("error",()=>release("runtime-error-v20"),{once:true});
  window.addEventListener("unhandledrejection",()=>release("async-error-v20"),{once:true});
})();

/* source-script: wikaru-final-responsive-audit-runtime */
(function(){
  'use strict';
  if(window.__wikaruFinalResponsiveAuditInitialized) return;
  window.__wikaruFinalResponsiveAuditInitialized = true;

  const root=document.documentElement;
  let resizeTimer=0;

  function forceLoaderRelease(){
    const loader=document.getElementById('loadingScreen');
    if(!loader) return;
    if(loader.hidden || loader.classList.contains('is-leaving') || loader.classList.contains('is-released')){
      loader.hidden=true;
      loader.classList.add('is-released');
      loader.setAttribute('aria-hidden','true');
      loader.setAttribute('aria-busy','false');
      loader.style.setProperty('display','none','important');
      loader.style.setProperty('pointer-events','none','important');
    }
  }

  function updateViewportVars(){
    const height=window.visualViewport?.height || window.innerHeight;
    root.style.setProperty('--wikaru-visual-height',`${Math.max(1,height)}px`);
  }

  function normalizeDialogs(){
    document.querySelectorAll('.modal').forEach(modal=>{
      if(!modal.hasAttribute('role')) modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      const close=modal.querySelector('.close-x');
      if(close && !close.getAttribute('aria-label')){
        close.setAttribute('aria-label',root.lang==='ja'?'閉じる':'Tutup');
      }
    });
  }

  function closeTransientUI(){
    document.querySelectorAll('.theme-transition-overlay,.language-transition-overlay').forEach(el=>el.remove());
    root.classList.remove('theme-is-changing','language-is-changing');
    window.__wikaruCleanupLanguageMotion?.();
    document.querySelectorAll('.theme-toggle.is-switching,.is-language-switching').forEach(el=>{
      el.classList.remove('is-switching','is-language-switching');
      el.removeAttribute('disabled');
      el.removeAttribute('aria-busy');
      el.setAttribute('aria-disabled','false');
    });
    window.__wikaruLanguageTransitionRunning=false;
    if(typeof window.closeUserDropdown==='function'){
      try{ window.closeUserDropdown(); }catch(_){}
    }else{
      const menu=document.getElementById('userDropdown');
      const button=document.getElementById('userMenuBtn');
      const backdrop=document.getElementById('profileMenuBackdrop');
      menu?.classList.remove('show');
      menu?.setAttribute('aria-hidden','true');
      button?.setAttribute('aria-expanded','false');
      backdrop?.classList.remove('show');
      document.body.classList.remove('profile-menu-open');
    }
  }

  let lastViewportWidth=window.innerWidth;
  let lastViewportHeight=window.visualViewport?.height||window.innerHeight;
  function onViewportChange(){
    const nextWidth=window.innerWidth;
    const nextHeight=window.visualViewport?.height||window.innerHeight;
    const meaningful=Math.abs(nextWidth-lastViewportWidth)>32||Math.abs(nextHeight-lastViewportHeight)>32;
    lastViewportWidth=nextWidth;lastViewportHeight=nextHeight;
    clearTimeout(resizeTimer);
    resizeTimer=window.setTimeout(()=>{
      updateViewportVars();
      if(meaningful) closeTransientUI();
      forceLoaderRelease();
    },120);
  }

  function init(){
    updateViewportVars();
    normalizeDialogs();
    forceLoaderRelease();
    window.setTimeout(forceLoaderRelease,7600);

    window.addEventListener('resize',onViewportChange,{passive:true});
    window.addEventListener('orientationchange',onViewportChange,{passive:true});
    window.addEventListener('pageshow',()=>{updateViewportVars();forceLoaderRelease();},{passive:true});
    window.visualViewport?.addEventListener('resize',onViewportChange,{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

/* source-script: wikaru-single-file-quality-runtime-v10 */
(function(){
  'use strict';
  if(window.__wikaruSingleFileQualityV10) return;
  window.__wikaruSingleFileQualityV10=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const debounce=(fn,wait=140)=>{let timer;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait);};};
  let lastFocused=null;
  const modalTransitionState=new WeakMap();
  const modalReturnFocus=new WeakMap();

  function languageText(id,ja){return document.documentElement.lang==='ja'?ja:id;}
  function ensureSemantics(){
    const main=$('main.app');
    if(main){main.id=main.id||'wikaruMain';main.setAttribute('role','main');main.tabIndex=-1;}
    const top=$('#topNav');
    if(top){top.setAttribute('role','navigation');top.setAttribute('aria-label',languageText('Navigasi utama','メインナビゲーション'));}
    const bottom=$('.bottom-nav');
    if(bottom){bottom.setAttribute('role','navigation');bottom.setAttribute('aria-label',languageText('Navigasi bawah','下部ナビゲーション'));}
    if(!$('.wikaru-skip-link')){
      const skip=document.createElement('a');
      skip.className='wikaru-skip-link';skip.href='#wikaruMain';skip.textContent=languageText('Lewati ke konten utama','メインコンテンツへ移動');
      skip.addEventListener('click',()=>setTimeout(()=>main?.focus({preventScroll:true}),0));
      document.body.prepend(skip);
    }
    if(!$('#wikaruLiveRegion')){
      const live=document.createElement('div');live.id='wikaruLiveRegion';live.className='wikaru-visually-hidden';live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');document.body.append(live);
    }
    $$('.modal').forEach(modal=>{
      if(!modal.hasAttribute('role')) modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      modal.setAttribute('aria-hidden',String(!modal.classList.contains('show')));
      if(!modal.hasAttribute('tabindex')) modal.tabIndex=-1;
    });
    $$('button i,a i').forEach(icon=>icon.setAttribute('aria-hidden','true'));
    syncNavigation();
  }

  function announce(message){const live=$('#wikaruLiveRegion');if(!live)return;live.textContent='';requestAnimationFrame(()=>{live.textContent=message;});}
  function syncNavigation(){
    const activePage=$('.page.active')?.id?.replace(/Page$/,'')||'';
    $$('[data-page]').forEach(button=>{
      const active=button.dataset.page===activePage;
      button.toggleAttribute('aria-current',active);
      if(active) button.setAttribute('aria-current','page');
    });
  }
  function focusables(root){return $$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',root).filter(el=>el.offsetParent!==null);}
  function onModalState(modal){
    const open=modal.classList.contains('show');
    modal.setAttribute('aria-hidden',String(!open));
    const previous=modalTransitionState.get(modal);
    modalTransitionState.set(modal,open);


    if(previous===open)return;
    if(open){
      const opener=document.activeElement;
      lastFocused=opener;
      modalReturnFocus.set(modal,opener);
      const items=focusables(modal);
      setTimeout(()=>{if(modal.classList.contains('show'))(items[0]||modal).focus({preventScroll:true});},0);
    }else if(previous===true){
      const returnTarget=modalReturnFocus.get(modal)||lastFocused;
      modalReturnFocus.delete(modal);
      if(returnTarget instanceof HTMLElement&&document.contains(returnTarget)){
        setTimeout(()=>{if(!modal.classList.contains('show'))returnTarget.focus({preventScroll:true});},0);
      }
    }
  }
  function trapModalKeys(event){
    const modal=$$('.modal.show').at(-1);if(!modal)return;
    if(event.key==='Tab'){
      const items=focusables(modal);if(!items.length){event.preventDefault();modal.focus();return;}
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  }
  function debounceHeavyInputs(){
    ['materialSearch','resSearch','adminSearch'].forEach(id=>{
      const input=document.getElementById(id);if(!input||input.dataset.wikaruDebounced==='true')return;
      const original=input.oninput;if(typeof original!=='function')return;
      input.oninput=null;input.addEventListener('input',debounce(function(event){original.call(input,event);},130));input.dataset.wikaruDebounced='true';
    });
  }
  function optimizeMedia(scope=document){
    const roots=[];
    if(scope?.matches?.('img,iframe')) roots.push(scope);
    scope?.querySelectorAll?.('img,iframe').forEach(node=>roots.push(node));
    roots.forEach(node=>{
      if(node.tagName==='IMG'){
        if(!node.hasAttribute('decoding')) node.setAttribute('decoding','async');
        if(!node.hasAttribute('alt')) node.setAttribute('alt','');
        const priority=node.closest('#homePage,.modal.show,.flashcard,.loading-card')?'eager':'lazy';
        if(!node.hasAttribute('loading')) node.setAttribute('loading',priority);
        if(priority==='lazy'&&!node.hasAttribute('fetchpriority')) node.setAttribute('fetchpriority','low');
      }else{
        if(!node.hasAttribute('loading')) node.setAttribute('loading','lazy');
        if(!node.hasAttribute('title')) node.setAttribute('title',languageText('Konten tertanam','埋め込みコンテンツ'));
      }
    });
  }
  function normalizeInteractive(scope=document){
    const selector='[onclick]:not(button):not(a):not(input):not(select):not(textarea),[role="button"]:not(button):not(a):not(input),.answer-img-preview:not(button),.family-node:not(button)';
    const nodes=[];
    if(scope?.matches?.(selector)) nodes.push(scope);
    scope?.querySelectorAll?.(selector).forEach(node=>nodes.push(node));
    nodes.forEach(node=>{
      if(!node.hasAttribute('role')) node.setAttribute('role','button');
      if(!node.hasAttribute('tabindex')) node.tabIndex=0;
      if(!node.hasAttribute('aria-label')&&node.classList.contains('answer-img-preview')) node.setAttribute('aria-label',languageText('Perbesar gambar','画像を拡大'));
    });
  }
  function activateCustomControl(event){
    if(event.key!=='Enter'&&event.key!==' ')return;
    const control=event.target.closest?.('[role="button"]:not(button):not(a):not(input):not([aria-disabled="true"])');
    if(!control)return;
    event.preventDefault();control.click();
  }
  function setupNetworkState(){
    const update=()=>{document.documentElement.dataset.network=navigator.onLine?'online':'offline';announce(navigator.onLine?languageText('Koneksi kembali online.','オンラインに戻りました。'):languageText('Mode offline aktif. Data lokal tetap dapat digunakan.','オフラインモードです。ローカルデータは利用できます。'));};
    window.addEventListener('online',update,{passive:true});window.addEventListener('offline',update,{passive:true});update();
  }
  function performanceProfile(){
    const lowMemory=Number(navigator.deviceMemory||8)<=2;const lowCpu=Number(navigator.hardwareConcurrency||8)<=2;
    if(lowMemory||lowCpu) document.documentElement.classList.add('performance-lite');
  }
  function observeUI(){
    $$('.modal').forEach(modal=>new MutationObserver(()=>onModalState(modal)).observe(modal,{attributes:true,attributeFilter:['class']}));
    $$('.page').forEach(page=>new MutationObserver(()=>{
      if(!page.classList.contains('active'))return;
      syncNavigation();const heading=page.querySelector('h1,h2');if(heading)announce(heading.textContent.trim());
    }).observe(page,{attributes:true,attributeFilter:['class']}));
    const dynamicRoots=['materialGrid','resultContent','adminTableWrap','toast','answerArea'].map(id=>document.getElementById(id)).filter(Boolean);
    dynamicRoots.forEach(root=>new MutationObserver(records=>{
      records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType!==1)return;if(node.matches?.('button:not([type])'))node.type='button';node.querySelectorAll?.('button:not([type])').forEach(button=>button.type='button');optimizeMedia(node);normalizeInteractive(node);}));
    }).observe(root,{childList:true,subtree:true}));
  }
  function init(){
    performanceProfile();ensureSemantics();optimizeMedia();normalizeInteractive();setupNetworkState();observeUI();document.addEventListener('keydown',trapModalKeys,true);document.addEventListener('keydown',activateCustomControl,true);
    setTimeout(debounceHeavyInputs,900);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* source-script: wikaru-v15-final-ui-supabase-runtime */
(function(){
  'use strict';
  if(window.__wikaruV13FinalFix) return;
  window.__wikaruV13FinalFix=true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const marks={
    idToJp:['ID','→ 日'],jpToId:['日','→ ID'],kanjiToReading:['漢','→ あ'],readingToMeaning:['あ','→ 意'],imageToJp:['画','→ 日']
  };
  function fixDirectionCards(){
    Object.entries(marks).forEach(([key,parts])=>{
      const button=$(`[data-qdir="${key}"]`); if(!button) return;
      const holder=$('.option-soft-icon',button); if(!holder) return;
      const signature=parts.join('|'); if(holder.dataset.wkFinalMark===signature) return;
      holder.innerHTML=`<span class="wk-qdir-mark" aria-hidden="true"><strong>${parts[0]}</strong><small>${parts[1]}</small></span><i class="fa-solid fa-language" aria-hidden="true"></i>`;
      holder.dataset.wkScript='1';holder.dataset.wkFinalMark=signature;
      const label=$('.qdir-label',button)?.textContent?.trim()||key;
      button.setAttribute('aria-label',label);
    });
  }
  function ensureCloudPill(){
    let pill=$('#wikaruCloudSync'); if(pill) return pill;
    const actions=$('.nav-actions'); if(!actions) return null;
    pill=document.createElement('button');pill.type='button';pill.id='wikaruCloudSync';pill.className='wikaru-cloud-sync';pill.dataset.state='testing';pill.title='Periksa sinkronisasi Supabase';pill.innerHTML='<i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i><span>Cloud</span>';
    const userMenu=$('.user-menu',actions);actions.insertBefore(pill,userMenu||null);
    pill.addEventListener('click',()=>runRoundTripTest(true));
    return pill;
  }
  function pendingCount(){
    try{
      const storage=window.WIKARU_STORAGE||window.localStorage;
      const rows=JSON.parse(storage.getItem('minna_bab23_pendingCloudResults')||'[]');
      return Array.isArray(rows)?rows.length:0;
    }catch(_){return 0}
  }
  function cloudText(){
    return document.documentElement.lang === 'ja'
      ? {
          testing:'接続中', testingTitle:'Supabase に接続しています…',
          syncing:'テスト中', syncingTitle:'Supabase の書き込み・読み取り・削除を確認しています…',
          synced:'同期済み', syncedTitle:'Supabase に接続されています。クリックすると読み取り・書き込み・削除テストを実行します。',
          pending:(n)=>`${n} 件待機`, pendingTitle:'Supabase への同期待ちデータがあります。',
          offline:'オフライン', offlineTitle:'オフラインです。結果は端末に保存され、オンライン時に同期されます。',
          error:'同期エラー', errorTitle:(msg)=>`Supabase テストに失敗しました: ${msg}`,
          successToast:'Supabase の接続テストに成功しました。',
          failToast:'Supabase テストはまだ完了していません。結果はこの端末に安全に保存されます。',
          connectFail:'Supabase に接続できません'
        }
      : {
          testing:'Menghubungkan', testingTitle:'Sedang menghubungkan Supabase…',
          syncing:'Menguji', syncingTitle:'Menguji tulis, baca, dan hapus Supabase…',
          synced:'Tersinkron', syncedTitle:'Supabase terhubung. Klik untuk menguji baca, tulis, dan hapus.',
          pending:(n)=>`${n} antre`, pendingTitle:'Ada hasil yang menunggu sinkronisasi Supabase.',
          offline:'Offline', offlineTitle:'Offline — hasil disimpan lokal dan akan disinkronkan saat online.',
          error:'Cloud gagal', errorTitle:(msg)=>`Uji Supabase gagal: ${msg}`,
          successToast:'Supabase berhasil diuji: tulis, baca, dan hapus berjalan.',
          failToast:'Supabase belum lolos uji. Hasil tetap aman di perangkat ini.',
          connectFail:'Supabase belum terhubung'
        };
  }
  function setCloudState(state,label,title){const pill=ensureCloudPill();if(!pill)return;pill.dataset.state=state;pill.querySelector('span').textContent=label;pill.title=title||label;const icon=pill.querySelector('i');icon.className='fa-solid '+({synced:'fa-cloud-circle-check',pending:'fa-cloud-arrow-up',testing:'fa-cloud',offline:'fa-cloud-slash',error:'fa-triangle-exclamation'}[state]||'fa-cloud');}
  function refreshCloudState(){
    const copy = cloudText();
    const pending=pendingCount();
    if(!navigator.onLine) return setCloudState('offline',copy.offline,copy.offlineTitle);
    try{
      const status=window.WIKARU_CLOUD?.status?.();
      if(status?.authenticated){
        return pending
          ? setCloudState('pending',copy.pending(pending),copy.pendingTitle)
          : setCloudState('synced',copy.synced,copy.syncedTitle);
      }
    }catch(_){ }
    setCloudState('testing',copy.testing,copy.testingTitle);
  }
  async function runRoundTripTest(showNotice=false){
    const copy = cloudText();
    setCloudState('testing',copy.syncing,copy.syncingTitle);
    const started=Date.now();
    try{
      const cloud=window.WIKARU_CLOUD;
      if(!cloud) throw new Error(copy.connectFail);
      if(!cloud.status().connected) await cloud.initialize();
      if(!cloud.status().authenticated) await cloud.ensureParticipantSession();
      await cloud.roundTripTest();
      window.WIKARU_SUPABASE_DIAGNOSTIC=Object.freeze({ok:true,checkedAt:new Date().toISOString(),durationMs:Date.now()-started,operations:['write','read','delete']});
      setCloudState(pendingCount()?'pending':'synced',pendingCount()?copy.pending(pendingCount()):copy.synced,`${document.documentElement.lang === 'ja' ? 'Supabase の書き込み・読み取り・削除テストに成功しました' : 'Supabase lulus uji tulis, baca, dan hapus'} (${Date.now()-started} ms).`);
      if(showNotice) window.WIKARU_SHOW_TOAST?.(copy.successToast);
      await window.WIKARU_FLUSH_PENDING_RESULTS?.();
    }catch(error){
      window.WIKARU_SUPABASE_DIAGNOSTIC=Object.freeze({ok:false,checkedAt:new Date().toISOString(),durationMs:Date.now()-started,error:error?.message||String(error)});
      setCloudState(navigator.onLine?'error':'offline',navigator.onLine?copy.error:copy.offline,navigator.onLine?copy.errorTitle(error?.message||error):copy.offlineTitle);
      if(showNotice) window.WIKARU_SHOW_TOAST?.(copy.failToast);
    }
  }
  function bind(){
    fixDirectionCards();ensureCloudPill();refreshCloudState();
    const quiz=$('#quizSettingsModal');if(quiz)new MutationObserver(()=>requestAnimationFrame(fixDirectionCards)).observe(quiz,{childList:true,subtree:true});
    document.addEventListener('wikaru:cloud-ready',refreshCloudState);
    document.addEventListener('wikaru:supabase-ready',refreshCloudState);
    document.addEventListener('wikaru:cloud-auth',refreshCloudState);
    document.addEventListener('wikaru:sync-queue',refreshCloudState);document.addEventListener('wikaru:sync-success',refreshCloudState);document.addEventListener('wikaru:sync-error',refreshCloudState);
    window.addEventListener('online',async()=>{refreshCloudState();try{if(!window.WIKARU_CLOUD?.status?.().connected)await window.WIKARU_CLOUD?.initialize?.();await window.WIKARU_FLUSH_PENDING_RESULTS?.();}catch(_){}refreshCloudState();});
    window.addEventListener('offline',refreshCloudState);
    setTimeout(()=>{fixDirectionCards();refreshCloudState();},3200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

/* source-script: wikaru-v14-single-file-final-runtime */
(function(){
  'use strict';
  if(window.__wikaruV14SingleFileFinal) return;
  window.__wikaruV14SingleFileFinal=true;
  const root=window.WIKARU=window.WIKARU||{};
  root.config=Object.assign({
    version:'15.0-supabase-final',schemaVersion:3,searchDebounceMs:130,supabaseTimeoutMs:15000,
    performanceBudget:{maxHorizontalOverflowPx:2,minTouchTargetPx:44,maxInitialCards:60},
    strictHiraganaColumns:true,inspectionDeterrent:true
  },root.config||{});
  root.modules=root.modules||{};root.utils=root.utils||{};
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const hasHiragana=t=>/[\u3040-\u309f]/u.test(String(t||''));
  const hasKatakana=t=>/[\u30a0-\u30ff\uff65-\uff9f]/u.test(String(t||''));
  root.utils.kanaScriptType=root.utils.kanaScriptType||function(value){const h=hasHiragana(value),k=hasKatakana(value);return h&&!k?'hiragana':k&&!h?'katakana':h||k?'mixed':'none'};
  function normalizeIconLabels(scope=document){
    $$('.icon-btn',scope).forEach(btn=>{const label=btn.getAttribute('aria-label')||btn.title;if(label&&!btn.getAttribute('aria-label'))btn.setAttribute('aria-label',label);});
  }
  function enforceStrictHiragana(scope=document){
    $$('.vocab-card',scope).forEach(card=>{
      const main=$('.vocab-jp',card)?.textContent?.trim()||'';
      const kana=$('.vocab-kana',card);if(!kana)return;
      const value=kana.textContent.trim();
      if(!value||value===main||hasKatakana(value)||!hasHiragana(value)){kana.remove();}
      else kana.dataset.kanaScript='hiragana';
    });
    $$('[data-kana-script="hiragana"]',scope).forEach(el=>{if(hasKatakana(el.textContent))el.hidden=true;});
  }
  function updateGenericKanaCopy(){
    const copy={
      kanjiToReading:{id:'Tebak kana dan romaji dari kanji.',ja:'漢字を見て、かなとローマ字で答えます。'},
      readingToMeaning:{id:'Kartu depan menampilkan kana dan romaji.',ja:'カードの表面にかなとローマ字を表示します。'}
    };
    Object.entries(copy).forEach(([key,text])=>{const note=$(`[data-qdir="${key}"] .qdir-note`);if(!note)return;note.dataset.id=text.id;note.dataset.ja=text.ja;const next=document.documentElement.lang==='ja'?text.ja:text.id;if(note.textContent!==next)note.textContent=next;});
    $$('.wk-script-chip',document).forEach(chip=>{if(['ひらがな','Hiragana'].includes(chip.textContent.trim())){const next=document.documentElement.lang==='ja'?'かな':'Kana';if(chip.textContent!==next)chip.textContent=next;}});
  }
  function elementRect(el){const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}
  function auditResponsive(){
    const width=window.innerWidth,height=window.innerHeight,doc=document.documentElement;
    const clippedCardButtons=[];
    $$('.vocab-card').forEach((card,index)=>{const cr=card.getBoundingClientRect();$$('.card-actions .icon-btn',card).forEach((btn,buttonIndex)=>{const br=btn.getBoundingClientRect();if(br.left<cr.left-1||br.right>cr.right+1||br.top<cr.top-1||br.bottom>cr.bottom+1)clippedCardButtons.push({index,buttonIndex,card:elementRect(card),button:elementRect(btn)});});});
    const modal=$('#quizSettingsModal.show .modal-card');const clippedModalItems=[];
    if(modal){const mr=modal.getBoundingClientRect();$$('[data-qdir],.modal-footer,.close-x',modal).forEach((el,index)=>{const er=el.getBoundingClientRect();if(er.left<mr.left-2||er.right>mr.right+2||er.top<mr.top-2||er.bottom>mr.bottom+2)clippedModalItems.push({index,className:el.className,rect:elementRect(el)});});}
    const mislabeledHiragana=[];
    $$('[data-kana-script="hiragana"],.example-word-meta-item.kana,.quiz-answer-detail.kana,.quiz-reading-cue-item.kana').forEach(el=>{const label=el.querySelector('small,span')?.textContent||'';const value=el.querySelector('strong')?.textContent||el.textContent;if(/Hiragana|ひらがな/i.test(label)&&hasKatakana(value))mislabeledHiragana.push({label,value:value.trim()});});
    const report={
      checkedAt:new Date().toISOString(),viewport:{width,height,devicePixelRatio:window.devicePixelRatio},
      horizontalOverflowPx:Math.max(0,doc.scrollWidth-width),clippedCardButtons,clippedModalItems,mislabeledHiragana,
      cards:$$('.vocab-card').length,modalOpen:!!modal
    };
    root.lastResponsiveAudit=report;return report;
  }
  root.modules.auditResponsive=auditResponsive;
  function refresh(){normalizeIconLabels();enforceStrictHiragana();updateGenericKanaCopy();}
  function bind(){
    refresh();
    const scheduleRefresh=(()=>{let frame=0;return()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;refresh();});};})();
    ['materialGrid','answerArea'].map(id=>document.getElementById(id)).filter(Boolean).forEach(scope=>{
      new MutationObserver(scheduleRefresh).observe(scope,{childList:true,subtree:true});
    });
    new MutationObserver(scheduleRefresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){try{if(typeof flushPendingResults==='function')flushPendingResults();}catch(_){}}});
    window.addEventListener('resize',()=>{clearTimeout(root._auditTimer);root._auditTimer=setTimeout(auditResponsive,180);},{passive:true});
    setTimeout(()=>{refresh();auditResponsive();},500);
    window.WIKARU_BUILD_INFO=Object.freeze(Object.assign({},window.WIKARU_BUILD_INFO||{}, {version:root.config.version,strictKana:true,responsiveAudit:true}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();

/* source-script: wikaru-native-scroll-runtime-v17 */
(function(){
  'use strict';
  if(window.__wikaruNativeScrollV17) return;
  window.__wikaruNativeScrollV17=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  let scheduled=false;

  function isVisible(element){
    if(!element || element.hidden) return false;
    const style=getComputedStyle(element);
    const rect=element.getBoundingClientRect();
    return style.display!=='none' && style.visibility!=='hidden' && Number(style.opacity||1)>0.01 && rect.width>1 && rect.height>1;
  }

  function normalizeNativeScroll(){
    const html=document.documentElement;
    const body=document.body;
    if(!body) return;

    html.style.setProperty('height','auto','important');
    html.style.setProperty('min-height','100%','important');
    html.style.setProperty('overflow-x','hidden','important');
    html.style.setProperty('overflow-y','auto','important');
    body.style.setProperty('height','auto','important');
    body.style.setProperty('min-height','100vh','important');
    body.style.setProperty('overflow-x','hidden','important');
    body.style.setProperty('overflow-y','visible','important');
    body.style.setProperty('position','static','important');
    body.style.removeProperty('top');
    body.style.removeProperty('left');
    body.style.removeProperty('right');

    body.classList.remove('inspect-private-mode','wk-modal-open','wk-sheet-open','scroll-locked','no-scroll');

    const devOverlay=$('#devtoolsOverlay');
    if(devOverlay){
      devOverlay.classList.remove('show');
      devOverlay.hidden=true;
      devOverlay.setAttribute('aria-hidden','true');
      devOverlay.style.setProperty('display','none','important');
      devOverlay.style.setProperty('pointer-events','none','important');
    }

    const loader=$('#loadingScreen');
    if(loader && (loader.hidden || loader.classList.contains('is-leaving') || loader.classList.contains('is-released') || document.readyState==='complete')){
      loader.hidden=true;
      loader.classList.add('is-released');
      loader.setAttribute('aria-hidden','true');
      loader.style.setProperty('display','none','important');
      loader.style.setProperty('pointer-events','none','important');
    }

    $$('.theme-transition-overlay,.language-transition-overlay').forEach(overlay=>{
      overlay.style.setProperty('pointer-events','none','important');
    });

    const dropdown=$('#userDropdown');
    const backdrop=$('#profileMenuBackdrop');
    const menuOpen=!!(dropdown && dropdown.classList.contains('show') && isVisible(dropdown));
    if(dropdown){
      dropdown.style.setProperty('pointer-events',menuOpen?'auto':'none','important');
      dropdown.setAttribute('aria-hidden',String(!menuOpen));
    }
    if(backdrop){
      backdrop.classList.toggle('show',menuOpen && matchMedia('(max-width:1180px)').matches);
      backdrop.style.setProperty('pointer-events',menuOpen?'auto':'none','important');
      backdrop.setAttribute('aria-hidden',String(!menuOpen));
    }
    if(!menuOpen) body.classList.remove('profile-menu-open');

    $$('.modal').forEach(modal=>{
      const open=modal.classList.contains('show') && isVisible(modal);
      modal.setAttribute('aria-hidden',String(!open));
      modal.style.setProperty('pointer-events',open?'auto':'none','important');
      const card=modal.querySelector('.modal-card,.login-card');
      if(card) card.style.setProperty('pointer-events',open?'auto':'none','important');
      if(!open) modal.classList.remove('wk-interaction-blocker');
    });
  }

  function scheduleNormalize(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      normalizeNativeScroll();
      auditInteractionSurface();
    });
  }

  function auditInteractionSurface(){
    const viewport={width:innerWidth,height:innerHeight};
    const fullscreenPointerBlockers=$$('body *').filter(element=>{
      if(!isVisible(element)) return false;
      const style=getComputedStyle(element);
      if(style.position!=='fixed' || style.pointerEvents==='none') return false;
      const rect=element.getBoundingClientRect();
      const covers=rect.width>=innerWidth*.85 && rect.height>=innerHeight*.85;
      const allowed=element.matches('.modal.show,#loadingScreen:not([hidden]),#profileMenuBackdrop.show');
      return covers && !allowed;
    }).map(element=>({id:element.id||'',className:String(element.className||''),zIndex:getComputedStyle(element).zIndex}));

    const report={
      checkedAt:new Date().toISOString(),
      viewport,
      scrollY:window.scrollY,
      scrollHeight:document.documentElement.scrollHeight,
      clientHeight:document.documentElement.clientHeight,
      canScroll:document.documentElement.scrollHeight>document.documentElement.clientHeight+2,
      htmlOverflowY:getComputedStyle(document.documentElement).overflowY,
      bodyOverflowY:getComputedStyle(document.body).overflowY,
      activeModal:$$('.modal.show').find(isVisible)?.id||null,
      fullscreenPointerBlockers
    };
    window.WIKARU_NATIVE_SCROLL_AUDIT=report;
    return report;
  }

  window.WIKARU_REPAIR_INTERACTION_SURFACE=normalizeNativeScroll;
  window.WIKARU_AUDIT_INTERACTION_SURFACE=auditInteractionSurface;

  function init(){
    normalizeNativeScroll();
    window.addEventListener('pageshow',scheduleNormalize,{passive:true});
    window.addEventListener('focus',scheduleNormalize,{passive:true});
    window.addEventListener('resize',scheduleNormalize,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleNormalize();},{passive:true});
    $$('.modal,#loadingScreen,#userDropdown,#profileMenuBackdrop,#devtoolsOverlay').forEach(surface=>{
      new MutationObserver(scheduleNormalize).observe(surface,{attributes:true,attributeFilter:['class','hidden']});
    });
    setTimeout(scheduleNormalize,80);
    setTimeout(scheduleNormalize,900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

/* source-script: wikaru-interaction-motion-runtime-v17 */
(function(){
  'use strict';
  if(window.__wikaruInteractionMotionV17) return;
  window.__wikaruInteractionMotionV17=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const isJapanese=()=>document.documentElement.lang==='ja';
  let protectionTimer=0,tabTimer=0,answerTimer=0;

  function ensureLiveRegion(){
    let live=$('#wikaruInteractionLive');
    if(!live){
      live=document.createElement('div');
      live.id='wikaruInteractionLive';
      live.className='wikaru-visually-hidden';
      live.setAttribute('aria-live','polite');
      live.setAttribute('aria-atomic','true');
      document.body.append(live);
    }
    return live;
  }
  function announce(text){
    const live=ensureLiveRegion();
    live.textContent='';
    requestAnimationFrame(()=>{live.textContent=text;});
  }
  function ensureNotice(id){
    let notice=$('#'+id);
    if(notice) return notice;
    notice=document.createElement('div');
    notice.id=id;
    notice.setAttribute('role','status');
    notice.setAttribute('aria-live','polite');
    notice.innerHTML='<span class="wk-notice-icon" aria-hidden="true"><i class="fa-solid fa-shield-halved"></i></span><span class="wk-notice-copy"><strong></strong><span></span></span><small class="wk-notice-step" hidden></small>';
    document.body.append(notice);
    return notice;
  }
  function showNotice(notice,title,message,{type='',step='',duration=2600}={}){
    notice.dataset.type=type;
    $('.wk-notice-copy strong',notice).textContent=title;
    $('.wk-notice-copy span',notice).textContent=message;
    const stepEl=$('.wk-notice-step',notice);
    stepEl.hidden=!step;
    stepEl.textContent=step;
    notice.classList.remove('show');
    void notice.offsetWidth;
    notice.classList.add('show');
    announce(title+' '+message);
    return setTimeout(()=>notice.classList.remove('show'),duration);
  }

  function showProtectionNotice(){
    const notice=ensureNotice('wkProtectionNotice');
    $('.wk-notice-icon',notice).innerHTML='<i class="fa-solid fa-shield-halved"></i>';
    clearTimeout(protectionTimer);
    protectionTimer=showNotice(
      notice,
      isJapanese()?'保護モードが有効です':'Mode perlindungan aktif',
      isJapanese()?'学習画面に戻って学習を続けましょう。':'Menu inspeksi dibatasi. Yuk, lanjutkan belajar di Wikaru.',
      {type:'protection',duration:2300}
    );
    window.WIKARU_REPAIR_INTERACTION_SURFACE?.();
  }

  function showTabNotice(type,attempt){
    const notice=ensureNotice('wkQuizTabNotice');
    const icon=$('.wk-notice-icon',notice);
    clearTimeout(tabTimer);
    if(type==='stopped'){
      icon.innerHTML='<i class="fa-solid fa-house"></i>';
      tabTimer=showNotice(
        notice,
        isJapanese()?'クイズを終了しました':'Kuis dihentikan',
        isJapanese()?'2回タブを離れたため、ホームに戻りました。':'Kamu berpindah tab dua kali, jadi sesi dikembalikan ke Beranda.',
        {type:'stopped',step:'2/2',duration:4200}
      );
    }else{
      icon.innerHTML='<i class="fa-solid fa-eye"></i>';
      tabTimer=showNotice(
        notice,
        isJapanese()?'集中を続けましょう':'Tetap fokus, ya',
        isJapanese()?'あと1回タブを離れるとクイズが終了します。':'Satu kesempatan tersisa. Pindah tab sekali lagi akan mengakhiri kuis.',
        {type:'warning',step:'1/2',duration:3900}
      );
    }
  }

  function answerFeedback(correct){
    const page=$('#quizPage');
    if(!page) return;
    clearTimeout(answerTimer);
    page.classList.remove('wk-answer-correct','wk-answer-wrong');
    void page.offsetWidth;
    page.classList.add(correct?'wk-answer-correct':'wk-answer-wrong');
    announce(correct?(isJapanese()?'正解です':'Jawaban benar'):(isJapanese()?'不正解です':'Jawaban salah'));
    answerTimer=setTimeout(()=>page.classList.remove('wk-answer-correct','wk-answer-wrong'),260);
  }

  function fallbackPageNavigation(requested){
    if(!['home','material'].includes(requested)) return false;
    const target=$('#'+requested+'Page');
    if(!target) return false;
    $$('.page').forEach(page=>page.classList.toggle('active',page===target));
    $$('[data-page]').forEach(button=>{
      const active=button.dataset.page===requested;
      button.classList.toggle('active',active);
      if(active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    document.body.classList.remove('quiz-mode');
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    return true;
  }

  function installNavigationSafetyNet(){
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-page]');
      if(!button || button.disabled) return;
      const requested=button.dataset.page;
      const before=$('.page.active')?.id;
      requestAnimationFrame(()=>{
        const expected=requested+'Page';
        const after=$('.page.active')?.id;
        if(after!==expected && after===before) fallbackPageNavigation(requested);
      });
    });
  }

  function interactionAudit(){
    const blockers=$$('body *').filter(element=>{
      const style=getComputedStyle(element),rect=element.getBoundingClientRect();
      if(style.display==='none'||style.visibility==='hidden'||style.pointerEvents==='none') return false;
      if(style.position!=='fixed'||rect.width<innerWidth*.85||rect.height<innerHeight*.85) return false;
      return !element.matches('.modal.show,#loadingScreen:not([hidden]),#profileMenuBackdrop.show');
    }).map(element=>({id:element.id||'',className:String(element.className||''),zIndex:getComputedStyle(element).zIndex}));
    const buttons=$$('button');
    const report={
      checkedAt:new Date().toISOString(),
      scroll:{y:scrollY,height:document.documentElement.scrollHeight,viewport:innerHeight,htmlOverflow:getComputedStyle(document.documentElement).overflowY,bodyOverflow:getComputedStyle(document.body).overflowY},
      pointerBlockers:blockers,
      buttons:{total:buttons.length,disabled:buttons.filter(button=>button.disabled).length,zeroSize:buttons.filter(button=>{const r=button.getBoundingClientRect();return r.width<1||r.height<1;}).length},
      activePage:$('.page.active')?.id||null,
      activeModal:$('.modal.show')?.id||null,
      wheelBlockingListeners:0,
      version:'17.0-interaction-motion'
    };
    window.WIKARU_INTERACTION_AUDIT=report;
    return report;
  }

  window.WIKARU_INTERACTIONS={showProtectionNotice,showTabNotice,answerFeedback,audit:interactionAudit};

  function init(){
    ensureLiveRegion();
    installNavigationSafetyNet();
    window.WIKARU_REPAIR_INTERACTION_SURFACE?.();
    window.addEventListener('pageshow',()=>window.WIKARU_REPAIR_INTERACTION_SURFACE?.(),{passive:true});
    window.addEventListener('focus',()=>window.WIKARU_REPAIR_INTERACTION_SURFACE?.(),{passive:true});
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden){
        window.WIKARU_REPAIR_INTERACTION_SURFACE?.();
        const pending=window.__wikaruQuizTabNotice;
        if(pending){window.__wikaruQuizTabNotice=null;showTabNotice(pending.type,pending.attempt);}
      }
    },{passive:true});
    setTimeout(interactionAudit,900);
    setTimeout(interactionAudit,3500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

/* source-script: wikaru-response-fast-runtime-v18 */
(function(){
  'use strict';
  if(window.__wikaruResponseFastV18) return;
  window.__wikaruResponseFastV18=true;
  const interactive='button:not(:disabled),.option-card:not([aria-disabled="true"]),.choice-chip:not([aria-disabled="true"]),.check-pill';
  function pressOn(target){
    const element=target?.closest?.(interactive);
    if(!element)return;
    element.classList.add('wk-choice-pressed');
    window.setTimeout(()=>element.classList.remove('wk-choice-pressed'),130);
  }
  document.addEventListener('pointerdown',event=>pressOn(event.target),{capture:true,passive:true});
  document.addEventListener('pointerup',event=>event.target?.closest?.(interactive)?.classList.remove('wk-choice-pressed'),{capture:true,passive:true});
  document.addEventListener('pointercancel',event=>event.target?.closest?.(interactive)?.classList.remove('wk-choice-pressed'),{capture:true,passive:true});
  document.addEventListener('pointerdown',()=>{
    try{
      if(typeof audioCtx!=='undefined'){
        audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
        if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
      }
    }catch(_){ }
  },{capture:true,once:true,passive:true});
})();

/* source-script: wikaru-playful-feedback-runtime-v20 */
(function(){
  "use strict";
  if(window.__wikaruPlayfulFeedbackV20) return;
  window.__wikaruPlayfulFeedbackV20=true;
  const $=(selector,root=document)=>root.querySelector(selector);
  const audit=window.WIKARU_PLAYFUL_AUDIT={version:"20.0-playful-native",samples:[],startedAt:new Date().toISOString()};
  let hideTimer=0,animationTimer=0;
  function isJapanese(){return document.documentElement.lang==="ja";}
  function copy(correct){
    if(isJapanese()) return correct
      ? {title:"やった！正解です",subtitle:"この調子で進もう！",stamp:"〇"}
      : {title:"おしい！",subtitle:"次のカードでもう一度挑戦しよう",stamp:"△"};
    return correct
      ? {title:"Mantap! Jawabanmu benar",subtitle:"Lanjutkan ritmenya!",stamp:"〇"}
      : {title:"Hampir tepat!",subtitle:"Coba lagi di kartu berikutnya.",stamp:"△"};
  }
  function ensureFeedback(){
    const wrap=$("#quizPage .quiz-card-wrap");
    if(!wrap) return null;
    let node=$(".wk-play-feedback",wrap);
    if(!node){
      node=document.createElement("div");
      node.className="wk-play-feedback";
      node.setAttribute("role","status");
      node.setAttribute("aria-live","polite");
      node.innerHTML='<span class="wk-play-stamp"></span><span class="wk-play-copy"><strong></strong><small></small></span><i class="wk-play-particle"></i><i class="wk-play-particle"></i><i class="wk-play-particle"></i><i class="wk-play-particle"></i>';
      wrap.appendChild(node);
    }
    return node;
  }
  function answerFeedback(correct){
    const started=performance.now();
    const page=$("#quizPage"),node=ensureFeedback();
    if(!page||!node) return;
    clearTimeout(hideTimer);clearTimeout(animationTimer);
    page.classList.remove("wk-answer-correct","wk-answer-wrong","wk-brand-correct","wk-brand-wrong","wk-play-correct","wk-play-wrong");
    void page.offsetWidth;
    page.classList.add(correct?"wk-play-correct":"wk-play-wrong");
    const message=copy(correct);
    node.className="wk-play-feedback "+(correct?"correct":"wrong");
    $(".wk-play-stamp",node).textContent=message.stamp;
    $(".wk-play-copy strong",node).textContent=message.title;
    $(".wk-play-copy small",node).textContent=message.subtitle;
    node.hidden=false;
    node.style.animation="none";void node.offsetWidth;
    node.style.animation="wkQuietAnswerIn .2s ease-out both";
    hideTimer=setTimeout(()=>{
      node.style.animation="wkQuietAnswerOut .16s ease-in both";
      setTimeout(()=>{node.hidden=true;},160);
    },620);
    animationTimer=setTimeout(()=>page.classList.remove("wk-play-correct","wk-play-wrong"),260);
    requestAnimationFrame(()=>audit.samples.push({correct,paintMs:Math.round((performance.now()-started)*10)/10,language:isJapanese()?"ja":"id",at:new Date().toISOString()}));
  }
  function prefetchNextAssets(){
    try{
      if(typeof quiz==="undefined"||!quiz?.cards?.length)return;
      [quiz.cards[quiz.index+1],quiz.cards[quiz.index+2]].forEach(item=>{
        const src=String(item?.image||"").trim();if(!src)return;const img=new Image();img.decoding="async";img.src=src;img.decode?.().catch(()=>{});
      });
    }catch(_){}
  }
  function install(){
    window.WIKARU_INTERACTIONS=window.WIKARU_INTERACTIONS||{};
    window.WIKARU_INTERACTIONS.answerFeedback=answerFeedback;
    window.WIKARU_RESPONSE_FAST=Object.assign(window.WIKARU_RESPONSE_FAST||{},{preloadNextQuizAsset:prefetchNextAssets});
    try{window.speechSynthesis?.getVoices?.();}catch(_){}
  }
  audit.summary=()=>({version:audit.version,samples:audit.samples.slice(-10),language:document.documentElement.lang,loaderReleased:document.getElementById("loadingScreen")?.hidden||false});
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install,{once:true}); else install();
})();

/* source-script: wikaru-v8-reliable-mode-voice-controls */
(()=>{
  "use strict";
  if(window.__WIKARU_SINGLE_MODE_FOUR_VOICES__) return;
  window.__WIKARU_SINGLE_MODE_FOUR_VOICES__=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const VOICES=["hanamama","momokawaii","renikebo","kaitodandy"];
  const MODES=["study","listening","shadowing","speed"];
  const COPY={
    id:{
      hanamama:["Hana Onee-san","Dewasa, lembut & keibuan"],
      momokawaii:["Momo Kawaii","Remaja ceria & ekspresif"],
      renikebo:["Ren Ikebo","Remaja cool & pendiam"],
      kaitodandy:["Kaito Dandy","Dewasa, matang & berat"]
    },
    ja:{
      hanamama:["花お姉さん","やさしく包み込む声"],
      momokawaii:["ももカワイイ","明るく可愛い声"],
      renikebo:["蓮イケボ","低音で魅力的な声"],
      kaitodandy:["海斗ダンディ","深く落ち着いた声"]
    }
  };
  const ICON={hanamama:"fa-heart",momokawaii:"fa-face-smile-wink",renikebo:"fa-music",kaitodandy:"fa-user-tie"};
  function lang(){return document.documentElement.lang==="ja"?"ja":"id";}
  function safeStore(key,value){try{localStorage.setItem(key,value);}catch(_){}}
  function readStore(key,fallback){try{return localStorage.getItem(key)||fallback;}catch(_){return fallback;}}
  function activeVoice(){
    const value=$("#voicePresetSelect")?.value || readStore("wikaru_voice_preset","hanamama");
    return VOICES.includes(value)?value:"hanamama";
  }
  function buttonMarkup(value){
    const copy=(COPY[lang()]||COPY.id)[value];
    return `<button type="button" class="wk8-voice-choice" data-voice-preset="${value}" aria-pressed="false"><i class="fa-solid ${ICON[value]}" aria-hidden="true"></i><span>${copy[0]}</span><small>${copy[1]}</small></button>`;
  }
  function ensureMaterialCard(){
    const content=$("#materialPage .content-card");
    if(!content) return;
    let card=$("#materialVoiceCard");
    if(!card){
      card=document.createElement("section");
      card.id="materialVoiceCard";
      card.className="material-voice-card";
      card.innerHTML=`<div class="material-voice-head"><span class="material-voice-icon"><i class="fa-solid fa-headphones"></i></span><div><span class="material-voice-kicker">${lang()==="ja"?"音声キャラクター":"Karakter audio"}</span><h3>${lang()==="ja"?"教材の声を選ぶ":"Pilih suara materi"}</h3><p><strong data-current-voice-name></strong> · <span data-current-voice-desc></span></p></div></div><div id="materialVoicePresetSwitcher" class="wk8-voice-switcher material-voice-switcher" role="group"></div>`;
      const notice=$(".notice",content);
      content.insertBefore(card,notice || content.children[2] || null);
    }
  }
  function buildVoiceButtons(){
    ensureMaterialCard();
    const quizCard=$("#voiceProfileCard");
    let quizRoot=$("#voicePresetSwitcher");
    if(quizCard && !quizRoot){
      quizRoot=document.createElement("div");
      quizRoot.id="voicePresetSwitcher";
      quizRoot.className="wk8-voice-switcher";
      quizRoot.setAttribute("role","group");
      quizCard.appendChild(quizRoot);
    }
    const roots=[$("#voicePresetSwitcher"),$("#materialVoicePresetSwitcher")].filter(Boolean);
    roots.forEach(root=>{
      root.setAttribute("aria-label",lang()==="ja"?"日本語の声を選ぶ":"Pilih karakter suara Jepang");
      root.innerHTML=VOICES.map(buttonMarkup).join("");
    });
  }
  function syncVoiceUI(){
    const value=activeVoice();
    $$('[data-voice-preset]').forEach(button=>{
      const on=button.dataset.voicePreset===value;
      button.classList.toggle("active",on);
      button.setAttribute("aria-pressed",String(on));
    });
    const meta=(COPY[lang()]||COPY.id)[value];
    $$('[data-current-voice-name]').forEach(node=>node.textContent=meta[0]);
    $$('[data-current-voice-desc]').forEach(node=>node.textContent=meta[1]);
  }
  function syncMode(requested){
    const select=$("#modeSelect");
    const stored=readStore("wikaru_quiz_mode","study");
    const mode=MODES.includes(requested) ? requested : MODES.includes(select?.value) ? select.value : MODES.includes(stored) ? stored : "study";
    safeStore("wikaru_quiz_mode",mode);
    if(select) select.value=mode;
    $$('[data-quiz-mode-pick]').forEach(button=>{
      const on=button.dataset.quizModePick===mode;
      button.hidden=false;
      button.classList.toggle("active",on);
      button.setAttribute("aria-pressed",String(on));
    });
    return mode;
  }
  function applyMode(value){
    if(!MODES.includes(value)) return;
    const select=$("#modeSelect");
    if(!select) return;
    select.value=value;
    safeStore("wikaru_quiz_mode",value);
    select.dispatchEvent(new Event("change",{bubbles:true}));
    requestAnimationFrame(()=>syncMode(value));
  }
  function applyVoice(value){
    if(!VOICES.includes(value)) return;
    const select=$("#voicePresetSelect");
    if(!select) return;
    select.value=value;
    safeStore("wikaru_voice_preset",value);
    select.dispatchEvent(new Event("change",{bubbles:true}));
    requestAnimationFrame(syncVoiceUI);
  }
  function render(){
    syncMode();
    buildVoiceButtons();
    syncVoiceUI();
    if(typeof window.updateVoicePresetUI==="function"){try{window.updateVoicePresetUI();}catch(_){}}
  }
  document.addEventListener("click",event=>{
    const voiceButton=event.target.closest("[data-voice-preset]");
    if(!voiceButton) return;
    event.preventDefault();
    event.stopPropagation();
    applyVoice(voiceButton.dataset.voicePreset);
  });
  document.addEventListener("change",event=>{
    if(event.target?.id==="modeSelect") syncMode(event.target.value);
    if(event.target?.id==="voicePresetSelect") requestAnimationFrame(syncVoiceUI);
  });
  window.addEventListener("storage",event=>{
    if(event.key==="wikaru_quiz_mode") syncMode(event.newValue);
    if(event.key==="wikaru_voice_preset"){
      const value=VOICES.includes(event.newValue)?event.newValue:"hanamama";
      const select=$("#voicePresetSelect");
      if(select) select.value=value;
      syncVoiceUI();
    }
  });
  document.addEventListener("wikaru:language-changed",()=>requestAnimationFrame(render));
  document.addEventListener("wikaru:voice-preset-changed",()=>requestAnimationFrame(syncVoiceUI));

  window.WIKARU_V8_CONTROLS={
    applyMode,
    applyVoice,
    render,
    activeMode:()=>syncMode(),
    activeVoice
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",render,{once:true}); else render();
})();

/* source-script: wikaru-single-study-four-voices-bootstrap */
(()=>{
  const allowed=["hanamama","momokawaii","renikebo","kaitodandy"];
  const modes=["study","listening","shadowing","speed"];
  try{
    const currentMode=localStorage.getItem("wikaru_quiz_mode");
    if(!modes.includes(currentMode)) localStorage.setItem("wikaru_quiz_mode","study");
    const current=localStorage.getItem("wikaru_voice_preset");
    if(!allowed.includes(current)) localStorage.setItem("wikaru_voice_preset","hanamama");
  }catch(_){}
})();

/* source-script: wikaru-v18-antiblink-runtime */
(function(){
  'use strict';
  if(window.__wikaruV18AntiBlink) return;
  window.__wikaruV18AntiBlink=true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  let routeTimer=0;
  function cleanGiftOverview(scope=document){
    $$('.gift-overview-row>.wikaru-direct-audio-dock,.gift-seasonal-row>.wikaru-direct-audio-dock,.gift-envelope-card>.wikaru-direct-audio-dock',scope).forEach(node=>node.remove());
  }
  function primeImages(scope=document){
    $$('img',scope).slice(0,12).forEach((img,index)=>{
      img.loading='eager';
      if(index<4) img.setAttribute('fetchpriority','high');
      if(!img.decoding) img.decoding='async';
    });
  }
  function settleRoute(){
    clearTimeout(routeTimer);
    document.documentElement.classList.add('wk-route-transition');
    routeTimer=setTimeout(()=>document.documentElement.classList.remove('wk-route-transition'),150);
  }
  function refresh(scope=document){
    cleanGiftOverview(scope);
    const active=$('.page.active',document);
    if(active) primeImages(active);
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-page],[data-action="openQuizSettings"],#startQuizFromSettings,#homeStartBtn')) settleRoute();
  },true);
  const grid=$('#materialGrid');
  if(grid){
    new MutationObserver(()=>requestAnimationFrame(()=>refresh(grid))).observe(grid,{childList:true,subtree:true});
  }
  $$('.page').forEach(page=>new MutationObserver(()=>{
    if(page.classList.contains('active')) requestAnimationFrame(()=>refresh(page));
  }).observe(page,{attributes:true,attributeFilter:['class']}));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>refresh(),{once:true});
  else refresh();
})();

/* source-script: wikaru-v6-adaptive-performance-runtime */
(function(){
  "use strict";
  if(window.__wikaruV6AdaptivePerformance)return;
  window.__wikaruV6AdaptivePerformance=true;
  const root=document.documentElement;
  let longTasks=0,totalLongTaskMs=0,observer=null;
  function enableLite(reason){
    if(root.classList.contains('performance-lite'))return;
    root.classList.add('performance-lite');
    root.dataset.performanceReason=reason||'adaptive';
  }
  try{
    if('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')){
      observer=new PerformanceObserver(list=>{
        for(const entry of list.getEntries()){
          longTasks++;totalLongTaskMs+=entry.duration;
        }
        if(longTasks>=6||totalLongTaskMs>=700){enableLite('long-task-budget');observer.disconnect();}
      });
      observer.observe({type:'longtask',buffered:true});
      setTimeout(()=>observer?.disconnect(),10000);
    }
  }catch(_){ }
  const lowMemory=Number(navigator.deviceMemory||8)<=3;
  const lowCpu=Number(navigator.hardwareConcurrency||8)<=3;
  if(lowMemory||lowCpu)enableLite('device-capability');
})();

/* source-script: wikaru-dark-contrast-guard-v2 */
(function(){
  'use strict';
  const AUTO=['wikaru-dark-auto-surface','wikaru-dark-auto-light-text','wikaru-dark-auto-dark-text'];
  const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','META','LINK','HEAD','HTML']);
  let timer=0,running=false;
  function rgba(value){const match=String(value||'').match(/rgba?\(([^)]+)\)/i);if(!match)return null;const parts=match[1].split(/[ ,/]+/).filter(Boolean).map(Number);if(parts.length<3||parts.some((x,i)=>i<3&&!Number.isFinite(x)))return null;return{r:parts[0],g:parts[1],b:parts[2],a:Number.isFinite(parts[3])?parts[3]:1};}
  function lum(color){const fn=value=>{value/=255;return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4)};return .2126*fn(color.r)+.7152*fn(color.g)+.0722*fn(color.b);}
  function contrast(a,b){const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function mix(fg,bg){const alpha=fg.a+(bg.a||1)*(1-fg.a)||1;return{r:(fg.r*fg.a+bg.r*(bg.a||1)*(1-fg.a))/alpha,g:(fg.g*fg.a+bg.g*(bg.a||1)*(1-fg.a))/alpha,b:(fg.b*fg.a+bg.b*(bg.a||1)*(1-fg.a))/alpha,a:alpha};}
  function effectiveBg(element){let background={r:11,g:18,b:29,a:1},stack=[],node=element;while(node&&node.nodeType===1){stack.push(node);node=node.parentElement;}stack.reverse().forEach(item=>{const color=rgba(getComputedStyle(item).backgroundColor);if(color&&color.a>0)background=mix(color,background);});return background;}
  function directText(element){return Array.from(element.childNodes).some(node=>node.nodeType===3&&node.nodeValue&&node.nodeValue.trim());}
  function visible(element){const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;const rect=element.getBoundingClientRect();return rect.width>1&&rect.height>1;}
  function clearAutoClasses(){document.querySelectorAll('.'+AUTO.join(',.')).forEach(element=>AUTO.forEach(name=>element.classList.remove(name)));}
  function audit(){
    timer=0;if(running)return;
    if(document.documentElement.dataset.theme!=='dark'){clearAutoClasses();return;}
    running=true;
    try{
      const nodes=document.body?document.body.querySelectorAll('*'):[];
      nodes.forEach(element=>{
        if(SKIP.has(element.tagName)||AUTO.some(name=>element.classList.contains(name))||!directText(element)||!visible(element))return;
        const style=getComputedStyle(element),foreground=rgba(style.color);if(!foreground)return;
        const background=effectiveBg(element),size=parseFloat(style.fontSize)||16,weight=parseInt(style.fontWeight,10)||400;
        const threshold=(size>=24||(size>=18.66&&weight>=700))?3:4.5;
        if(contrast(foreground,background)>=threshold)return;
        const own=rgba(style.backgroundColor);
        element.classList.add(own&&own.a>.45&&lum(own)>.62?'wikaru-dark-auto-surface':lum(background)<.46?'wikaru-dark-auto-light-text':'wikaru-dark-auto-dark-text');
      });
    }catch(_){ }
    finally{running=false;}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(audit,90);}
  function resetAndSchedule(){clearAutoClasses();schedule();}
  const start=()=>{
    schedule();
    const contentObserver=new MutationObserver(mutations=>{if(mutations.some(mutation=>mutation.addedNodes.length))schedule();});
    if(document.body)contentObserver.observe(document.body,{subtree:true,childList:true});
    new MutationObserver(resetAndSchedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('pageshow',schedule,{passive:true});
    document.addEventListener('click',()=>setTimeout(schedule,50),true);
    document.addEventListener('wikaru:theme-changed',resetAndSchedule);
    document.addEventListener('wikaru:language-changed',schedule);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* source-script: wikaru-session-ui-integrity-v4 */
(function(){
 'use strict';const KEY='minna_bab23_progress',LAST='minna_bab23_lastResult',$=s=>document.querySelector(s);
 function read(key,fallback=null){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
 function hide(el,value){if(!el)return;el.classList.toggle('hidden',!!value);el.setAttribute('aria-hidden',String(!!value))}
 function sync(){const s=read(KEY,null),name=String(s?.username||'').trim(),logged=!!name,admin=s?.role==='admin';hide($('#homeLoginBtn'),logged);hide($('#homeStartBtn'),!logged);hide($('#homeMaterialBtn'),!logged);hide($('#homeResultBtn'),!logged);if(logged){const pn=$('#homeProfileName');if(pn)pn.textContent=name;const pr=$('#homeProfileRole');if(pr)pr.textContent=admin?(document.documentElement.lang==='ja'?'管理者':'Pengelola'):(document.documentElement.lang==='ja'?'学習中':'Sedang belajar')}}
 function later(){requestAnimationFrame(sync)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',later,{once:true});else later();window.addEventListener('pageshow',later);window.addEventListener('storage',later);document.addEventListener('click',()=>setTimeout(sync,80),true);
})();

/* source-script: wikaru-progress-audio-natural-v7 */
(function(){
  'use strict';
  if(window.__wikaruProgressAudioNaturalV7) return;
  window.__wikaruProgressAudioNaturalV7=true;

  const synth=window.speechSynthesis;
  let voices=[];
  let activeUtterance=null;
  let activeButton=null;
  let startTimer=0;
  let requestSerial=0;
  let lastRequestKey='';
  let lastRequestAt=0;
  let activeAudioDetail=null;
  const DUPLICATE_GUARD_MS=850;

  const PERSONAS={
    hanamama:{vocabRate:.84,exampleRate:.89,listRate:.82,pitch:.96,preferred:/Nanami|Kyoko|Ayumi|Mizuki|Nozomi/i,gender:'female'},
    momokawaii:{vocabRate:.96,exampleRate:1.01,listRate:.92,pitch:1.12,preferred:/Haruka|Hikari|Sayaka|Sakura|Aoi|Mei|Yuna/i,gender:'female'},
    renikebo:{vocabRate:.88,exampleRate:.91,listRate:.85,pitch:.84,preferred:/Keita|Otoya|Takumi|Daichi/i,gender:'male'},
    kaitodandy:{vocabRate:.78,exampleRate:.84,listRate:.76,pitch:.72,preferred:/Ichiro|Hattori|Hiroshi|Kenji|Otoya/i,gender:'male'}
  };

  const $=(selector,root=document)=>root.querySelector(selector);

  function readJson(key,fallback=null){
    try{
      const raw=localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(_){ return fallback; }
  }

  function session(){
    return readJson('minna_bab23_progress',null) || {};
  }

  function refreshVoices(){
    try{ voices=Array.from(synth?.getVoices?.() || []); }
    catch(_){ voices=[]; }
    return voices;
  }

  function currentPreset(){
    try{return localStorage.getItem('wikaru_voice_preset') || 'hanamama';}
    catch(_){return 'hanamama';}
  }

  function voiceScore(voice,lang='ja-JP',preset=currentPreset()){
    const name=String(voice?.name||'');
    const locale=String(voice?.lang||'');
    const persona=PERSONAS[preset] || PERSONAS.hanamama;
    let score=0;
    if(/^ja(?:-|_)?JP$/i.test(locale)) score+=500;
    else if(/^ja/i.test(locale)) score+=360;
    else score-=500;

    if(/Natural|Neural|Premium|Enhanced|Online|Siri/i.test(name)) score+=190;
    if(/Microsoft.*(?:Nanami|Keita|Japanese|日本語)/i.test(name)) score+=150;
    if(/Google.*(?:Japanese|日本語)/i.test(name)) score+=135;
    if(/Apple|Kyoko|Otoya|Hattori|Haruka|Mizuki/i.test(name)) score+=85;
    if(voice?.localService) score+=24;
    if(voice?.default) score+=12;
    if(/eSpeak|Festival|Compact|Desktop/i.test(name)) score-=90;

    const female=/Nanami|Haruka|Ayumi|Kyoko|Mizuki|Hikari|Sayaka|Sakura|Aoi|Mei|Yuna|Female|女性/i;
    const male=/Keita|Otoya|Ichiro|Hattori|Kenji|Takumi|Daichi|Hiroshi|Male|男性/i;
    if(persona.preferred.test(name)) score+=260;
    if(persona.gender==='female'&&female.test(name)) score+=110;
    if(persona.gender==='male'&&male.test(name)) score+=110;
    if(persona.gender==='female'&&male.test(name)) score-=170;
    if(persona.gender==='male'&&female.test(name)) score-=170;
    return score;
  }

  function bestVoice(lang='ja-JP',preset=currentPreset()){
    refreshVoices();
    return voices.filter(v=>/^ja/i.test(String(v.lang||'')))
      .sort((a,b)=>voiceScore(b,lang,preset)-voiceScore(a,lang,preset))[0] ||
      voices.sort((a,b)=>voiceScore(b,lang,preset)-voiceScore(a,lang,preset))[0] || null;
  }

  function inferKind(text,requested){
    if(requested) return requested;
    const value=String(text||'');
    if(/[、,，]/.test(value) && !/[。！？!?]/.test(value)) return 'list';
    return /[。！？!?]|です|ます|でした|ません/.test(value) ? 'example' : 'vocab';
  }

  function normalizeSpeechText(text,kind='vocab'){
    let value=String(text||'').normalize('NFKC')
      .replace(/<[^>]*>/g,' ')
      .replace(/[〜～]/g,'')
      .replace(/\s+/g,' ')
      .trim();

    if(kind==='vocab'){
      value=value.replace(/（[^）]*）/g,'').replace(/\([^)]*\)/g,'').trim();
    }

    const separated=value.split(/[、,，。.!！？?\s]+/).map(v=>v.trim()).filter(Boolean);
    if(separated.length>1 && separated.every(v=>v===separated[0])) value=separated[0];

    if(kind==='example'){
      value=value.replace(/、\s*/g,'、 ').replace(/([。！？])\s*/g,'$1 ').trim();
    }
    return value;
  }

  function speechProfile(text,kind){
    const length=Array.from(String(text||'').replace(/\s/g,'')).length;
    const preset=currentPreset();
    const persona=PERSONAS[preset] || PERSONAS.hanamama;
    let rate=kind==='example'?persona.exampleRate:kind==='list'?persona.listRate:persona.vocabRate;
    if(kind==='example'&&length>35) rate=Math.max(.72,rate-.03);
    else if(kind==='vocab'&&length<=3) rate=Math.max(.72,rate-.02);
    return {rate,pitch:persona.pitch,volume:1,preset};
  }

  function dispatchAudio(name,detail){
    try{document.dispatchEvent(new CustomEvent(name,{detail}));}catch(_){ }
  }

  function finishAudioEvent(reason='ended',serial=null){
    if(!activeAudioDetail || (serial!==null&&activeAudioDetail.serial!==serial)) return;
    const detail={...activeAudioDetail,reason};
    activeAudioDetail=null;
    dispatchAudio('wikaru:audio-ended',detail);
  }

  function restoreButton(button){
    if(!button) return;
    button.classList.remove('wikaru-audio-playing-v6','wikaru-audio-playing-v7','is-speaking');
    button.removeAttribute('aria-pressed');
    const icon=button.querySelector('i');
    if(icon && button.dataset.wikaruV6OriginalIcon){
      icon.className=button.dataset.wikaruV6OriginalIcon;
      delete button.dataset.wikaruV6OriginalIcon;
    }
  }

  function markButton(button){
    if(activeButton && activeButton!==button) restoreButton(activeButton);
    activeButton=button||null;
    if(!button) return;
    const icon=button.querySelector('i');
    if(icon && !button.dataset.wikaruV6OriginalIcon) button.dataset.wikaruV6OriginalIcon=icon.className;
    if(icon) icon.className='fa-solid fa-wave-square';
    button.classList.add('wikaru-audio-playing-v7','is-speaking');
    button.setAttribute('aria-pressed','true');
  }

  function stopAudio(){
    requestSerial++;
    clearTimeout(startTimer);
    startTimer=0;
    try{synth?.cancel();}catch(_){ }
    finishAudioEvent('cancelled');
    if(activeUtterance){
      activeUtterance.onstart=null;
      activeUtterance.onend=null;
      activeUtterance.onerror=null;
    }
    activeUtterance=null;
    restoreButton(activeButton);
    activeButton=null;
  }

  function naturalSpeak(text,lang='ja-JP',options={}){
    if(!synth || typeof SpeechSynthesisUtterance==='undefined') return false;
    const kind=inferKind(text,options.kind);
    const cleaned=normalizeSpeechText(text,kind);
    if(!cleaned) return false;

    const now=Date.now();
    const key=`${lang}|${kind}|${cleaned}`;

    if(key===lastRequestKey && now-lastRequestAt<DUPLICATE_GUARD_MS) return false;
    lastRequestKey=key;
    lastRequestAt=now;

    const serial=++requestSerial;
    clearTimeout(startTimer);
    try{synth.cancel();}catch(_){ }
    finishAudioEvent('replaced');
    if(activeButton) restoreButton(activeButton);
    const button=options.button || window.__wikaruAudioButton || null;
    window.__wikaruAudioButton=null;
    window.__wikaruAudioKind=null;
    markButton(button);


    startTimer=window.setTimeout(()=>{
      if(serial!==requestSerial) return;
      const utterance=new SpeechSynthesisUtterance(cleaned);
      activeUtterance=utterance;
      const outputLang=/^ja/i.test(String(lang||''))?'ja-JP':lang;
      utterance.lang=outputLang;
      const preset=currentPreset();
      const voice=bestVoice(outputLang,preset);
      if(voice) utterance.voice=voice;
      const profile=speechProfile(cleaned,kind);
      utterance.rate=profile.rate;
      utterance.pitch=profile.pitch;
      utterance.volume=profile.volume;
      utterance.onstart=()=>{
        if(serial!==requestSerial) return;
        markButton(button);
        activeAudioDetail={serial,preset,kind,text:cleaned,lang:outputLang,voice:voice?.name||''};
        dispatchAudio('wikaru:audio-started',{...activeAudioDetail});
      };
      const finish=(event)=>{
        if(serial!==requestSerial) return;
        finishAudioEvent(event?.type==='error'?'error':'ended',serial);
        restoreButton(button);
        if(activeButton===button) activeButton=null;
        if(activeUtterance===utterance) activeUtterance=null;
      };
      utterance.onend=finish;
      utterance.onerror=finish;
      try{synth.speak(utterance);}catch(_){finish();}
    },55);
    return true;
  }

  window.wikaruNaturalSpeak=naturalSpeak;
  window.speak=function(text,lang='ja-JP'){
    return naturalSpeak(text,lang,{
      kind:window.__wikaruAudioKind || undefined,
      button:window.__wikaruAudioButton || null
    });
  };
  window.wikaruStopAudio=stopAudio;
  window.WikaruAudioController={
    speak:naturalSpeak,
    stop:stopAudio,
    refreshVoices,
    currentPersona(){const preset=currentPreset();return {preset,profile:PERSONAS[preset]||PERSONAS.hanamama,voice:bestVoice('ja-JP',preset)?.name||''};}
  };

  function vocabById(id){
    const rows=Array.isArray(window.__WIKARU_VOCABULARY)?window.__WIKARU_VOCABULARY:[];
    return rows.find(v=>String(v?.id)===String(id)) || null;
  }
  function vocabSpeech(v){
    return String(v?.speech||v?.kana||v?.kanji||v?.romaji||'').trim();
  }
  function exampleSpeech(v){
    const direct=String(v?.exampleJa||v?.exampleJapanese||'').trim();
    if(direct) return direct;
    const row=Array.isArray(v?.examples)?v.examples.find(x=>String(x?.ja||x?.japanese||'').trim()):null;
    return String(row?.ja||row?.japanese||'').trim();
  }


  window.addEventListener('click',event=>{
    const numberButton=event.target?.closest?.('[data-number-speak]');
    if(numberButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      naturalSpeak(numberButton.dataset.numberSpeak||'','ja-JP',{kind:/[、,，]/.test(numberButton.dataset.numberSpeak||'')?'list':'vocab',button:numberButton});
      return;
    }

    const directButton=event.target?.closest?.('[data-direct-speak]');
    if(directButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      naturalSpeak(directButton.dataset.directSpeak||'','ja-JP',{kind:directButton.dataset.directKind||'vocab',button:directButton});
      return;
    }

    const exampleButton=event.target?.closest?.('[data-example-speak-id]');
    if(exampleButton){
      const text=exampleSpeech(vocabById(exampleButton.dataset.exampleSpeakId));
      if(!text) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      naturalSpeak(text,'ja-JP',{kind:'example',button:exampleButton});
      return;
    }
  },true);

  function syncProgressButton(){
    const button=$('#homeResultBtn');
    if(!button) return;
    const data=session();
    const logged=Boolean(String(data?.username||'').trim());
    button.classList.toggle('hidden',!logged);
    button.setAttribute('aria-hidden',String(!logged));
    if(logged){
      button.disabled=false;
      button.removeAttribute('disabled');
      const label=button.querySelector('span');
      if(label) label.textContent=document.documentElement.lang==='ja'?'進捗を見る':'Lihat progres';
      const ja=(document.documentElement.lang||'id').toLowerCase().startsWith('ja');
      button.title=ja
        ? (data?.role==='admin'?'参加者全体の進捗を開く':'学習の進捗を開く')
        : (data?.role==='admin'?'Buka progres seluruh peserta':'Buka progres belajar');
    }
  }

  function scheduleSync(){
    requestAnimationFrame(syncProgressButton);
    setTimeout(syncProgressButton,120);
  }

  refreshVoices();
  try{synth?.addEventListener?.('voiceschanged',refreshVoices);}catch(_){ }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
  else scheduleSync();
  window.addEventListener('pageshow',scheduleSync);
  window.addEventListener('storage',scheduleSync);
  document.addEventListener('click',()=>setTimeout(syncProgressButton,160),true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();});
})();

/* source-script: wikaru-number-card-cleanup-runtime-v7 */
(function(){
  'use strict';
  let scheduled=0;
  function cleanNumberCard(card){
    if(!(card instanceof HTMLElement))return;
    let primary=card.querySelector(':scope > .number-audio-btn');
    if(!primary){
      primary=card.querySelector('[data-number-speak]');
      if(primary&&!primary.classList.contains('number-audio-btn'))primary.classList.add('number-audio-btn');
    }
    card.querySelectorAll('button').forEach(button=>{if(button!==primary)button.remove();});
    Array.from(card.children).forEach(child=>{if(!child.matches('.number-card-value,.number-card-reading,.number-audio-btn'))child.remove();});
  }
  function cleanAll(){scheduled=0;document.querySelectorAll('#materialGrid .number-card').forEach(cleanNumberCard);}
  function schedule(){clearTimeout(scheduled);scheduled=setTimeout(cleanAll,40);}
  const start=()=>{
    schedule();
    const grid=document.getElementById('materialGrid');
    if(grid)new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))schedule();}).observe(grid,{subtree:true,childList:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-material-category],#materialFilter,#materialSearch'))setTimeout(schedule,50);
  },true);
})();

/* source-script: wikaru-theme-motion-runtime-revision-8 */
(function(){
  "use strict";
  if(window.__wikaruThemeMotionRevision8) return;
  window.__wikaruThemeMotionRevision8=true;

  const root=document.documentElement;
  const THEME_KEY="wikaru_theme";
  let running=false;
  let cleanupTimer=0;

  function delay(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
  }

  function safeTheme(){
    return root.dataset.theme==="dark"?"dark":"light";
  }

  function refreshButton(theme){
    const button=document.getElementById("themeToggle");
    if(!button) return;
    const dark=theme==="dark";
    const ja=root.lang==="ja";
    const label=dark
      ?(ja?"ライトモードに切り替える":"Gunakan mode terang")
      :(ja?"ダークモードに切り替える":"Gunakan mode malam");
    button.setAttribute("aria-pressed",String(dark));
    button.setAttribute("aria-label",label);
    button.title=label;
    button.innerHTML=
      `<i class="fa-solid ${dark?"fa-sun":"fa-moon"}" aria-hidden="true"></i>`+
      `<span>${dark?(ja?"ライトモード":"Mode Terang"):(ja?"ダークモード":"Mode Malam")}</span>`;
  }

  function applyTheme(theme){
    const next=theme==="dark"?"dark":"light";
    root.dataset.theme=next;
    try{localStorage.setItem(THEME_KEY,next);}catch(_){}
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content=next==="dark"?"#0F1722":"#F7F8FA";
    refreshButton(next);
    try{window.wikaruRefreshThemeLabel?.();}catch(_){}
    document.dispatchEvent(new CustomEvent("wikaru:theme-changed",{
      detail:{theme:next,source:"revision-8-motion"}
    }));
  }

  function originFrom(button){
    const fallbackX=Math.max(48,innerWidth-48);
    const fallbackY=48;
    const rect=button?.getBoundingClientRect?.();
    if(!rect||!rect.width||!rect.height){
      return {x:fallbackX,y:fallbackY,iconX:fallbackX,iconY:fallbackY};
    }
    const x=rect.left+rect.width/2;
    const y=rect.top+rect.height/2;
    return {
      x,y,
      iconX:Math.min(Math.max(x,54),Math.max(54,innerWidth-54)),
      iconY:Math.min(Math.max(y,54),Math.max(54,innerHeight-54))
    };
  }

  function buildOverlay(next,button){
    document.querySelectorAll(
      ".wk-theme-motion-overlay-v8,.theme-transition-overlay"
    ).forEach(node=>node.remove());

    const point=originFrom(button);
    const farX=Math.max(point.x,innerWidth-point.x);
    const farY=Math.max(point.y,innerHeight-point.y);
    const radius=Math.ceil(Math.hypot(farX,farY)+48);

    const overlay=document.createElement("div");
    overlay.className=`wk-theme-motion-overlay-v8 to-${next}`;
    overlay.setAttribute("aria-hidden","true");
    overlay.style.setProperty("--wk8-origin-x",`${point.x}px`);
    overlay.style.setProperty("--wk8-origin-y",`${point.y}px`);
    overlay.style.setProperty("--wk8-icon-x",`${point.iconX}px`);
    overlay.style.setProperty("--wk8-icon-y",`${point.iconY}px`);
    overlay.style.setProperty("--wk8-diameter",`${radius*2}px`);

    const circle=document.createElement("div");
    circle.className="wk-theme-motion-circle-v8";

    const icon=document.createElement("div");
    icon.className="wk-theme-motion-icon-v8";
    icon.innerHTML=`<i class="fa-solid ${next==="dark"?"fa-moon":"fa-sun"}"></i>`;

    const particles=document.createElement("div");
    particles.className="wk-theme-motion-particles-v8";
    for(let index=0;index<8;index++){
      const particle=document.createElement("span");
      particle.textContent=next==="dark"?"✦":"•";
      particle.style.setProperty("--wk8-angle",`${index*45+(index%2?10:-5)}deg`);
      particle.style.setProperty("--wk8-distance",`${48+(index%3)*15}px`);
      particle.style.setProperty("--wk8-particle-delay",`${80+index*22}ms`);
      particle.style.setProperty("--wk8-particle-size",`${8+(index%3)*3}px`);
      particles.appendChild(particle);
    }

    overlay.append(circle,icon,particles);
    document.body.appendChild(overlay);
    return overlay;
  }

  function cleanup(button,overlay){
    clearTimeout(cleanupTimer);
    cleanupTimer=0;
    overlay?.remove();
    root.classList.remove("wk-theme-changing-v8","theme-is-changing");
    button?.classList.remove("wk-theme-switching-v8","is-switching");
    button?.removeAttribute("aria-busy");
    if(button){
      button.disabled=false;
      button.setAttribute("aria-disabled","false");
    }
    running=false;
  }

  async function changeWithMotion(button){
    if(running) return;
    const current=safeTheme();
    const next=current==="dark"?"light":"dark";
    running=true;

    const overlay=buildOverlay(next,button);
    root.classList.add("wk-theme-changing-v8");
    button?.classList.add("wk-theme-switching-v8");
    if(button){
      button.disabled=true;
      button.setAttribute("aria-busy","true");
      button.setAttribute("aria-disabled","true");
    }

    cleanupTimer=setTimeout(()=>cleanup(button,overlay),1600);

    try{
      const reduced=document.documentElement.dataset.wkMotion==="reduced";
      await delay(reduced?55:300);
      applyTheme(next);
      await delay(reduced?125:430);
      overlay.classList.add("is-leaving");
      await delay(220);
      cleanup(button,overlay);
      try{window.closeUserDropdown?.();}catch(_){}
    }catch(error){
      console.warn("Wikaru theme motion revision 8 recovered:",error);
      applyTheme(next);
      cleanup(button,overlay);
    }
  }


  document.addEventListener("click",event=>{
    const button=event.target.closest?.("#themeToggle");
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    changeWithMotion(button);
  },true);

  window.addEventListener("pagehide",()=>{
    document.querySelectorAll(".wk-theme-motion-overlay-v8").forEach(node=>node.remove());
  });

  window.wikaruChangeThemeWithMotionV8=changeWithMotion;
})();

/* source-script: wikaru-marker-audio-motion-revision-v2 */
(function(){
  "use strict";
  if(window.__wikaruMarkerAudioMotionV2) return;
  window.__wikaruMarkerAudioMotionV2=true;
  let activeButton=null;
  let clearTimer=0;

  function clearActive(){
    clearTimeout(clearTimer);
    clearTimer=0;
    if(!activeButton) return;
    activeButton.classList.remove("is-playing");
    activeButton.setAttribute("aria-pressed","false");
    activeButton.closest(".marker-row")?.classList.remove("is-audio-active");
    activeButton=null;
  }

  document.addEventListener("click",function(event){
    const button=event.target.closest?.(".marker-audio[data-marker-speak], .marker-lab-listen[data-marker-speak]");
    if(!button) return;
    if(activeButton && activeButton!==button) clearActive();
    activeButton=button;
    button.classList.remove("is-playing");
    void button.offsetWidth;
    button.classList.add("is-playing");
    button.setAttribute("aria-pressed","true");
    button.closest(".marker-row")?.classList.add("is-audio-active");
    const text=String(button.dataset.markerSpeak||"").trim();
    const duration=Math.min(3600,Math.max(1450,1000+text.length*115));
    clearTimer=setTimeout(clearActive,duration);
  },true);

  document.addEventListener("visibilitychange",function(){
    if(document.hidden) clearActive();
  });
  window.addEventListener("pagehide",clearActive);
})();

/* source-script: wikaru-question-page-visibility-fallback-v2 */
(function(){
  'use strict';
  const makeVisible=(kind)=>{
    const page=document.getElementById('quizPage');if(!page)return;
    document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===page));
    page.hidden=false;page.style.removeProperty('display');page.style.removeProperty('visibility');page.style.removeProperty('opacity');
    document.body.classList.add('quiz-mode');
    const map={marker:['marker-quiz-active','markerQuizPanel'],duration:['duration-quiz-active','durationQuizPanel'],counter:['counter-quiz-active','counterQuizPanel']};
    if(map[kind]){
      Object.values(map).forEach(([cls])=>{if(cls!==map[kind][0])document.body.classList.remove(cls);});
      document.body.classList.add(map[kind][0]);
      const panel=document.getElementById(map[kind][1]);if(panel){panel.hidden=false;panel.style.setProperty('display','block','important');panel.style.removeProperty('visibility');panel.style.removeProperty('opacity');}
    }
  };
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('#startQuizFromSettings,[data-start-marker-quiz],[data-start-duration-quiz],[data-counter-start]');if(!trigger)return;
    const kind=trigger.matches('[data-start-marker-quiz]')?'marker':trigger.matches('[data-start-duration-quiz]')?'duration':trigger.matches('[data-counter-start]')?'counter':'generic';
    [40,140,360,700].forEach(delay=>setTimeout(()=>makeVisible(kind),delay));
  },true);
})();

/* source-script: wikaru-revisi-4-final-script */
(function(){
  'use strict';
  if(window.__wikaruRevisi4FinalReady)return;
  window.__wikaruRevisi4FinalReady=true;
  function openZoom(img){
    const modal=document.getElementById('imageModal'),target=document.getElementById('zoomImage');
    const src=img?.currentSrc||img?.src||'';
    if(!modal||!target||!src)return;
    target.src=src;target.alt=img.alt||'Pratinjau gambar materi';
    modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  }
  const decorate=()=>{
    document.querySelectorAll('#quizPage .time-distinct-answer-image').forEach(img=>{
      img.classList.add('answer-img-preview');img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','Perbesar gambar jawaban');
    });
    document.querySelectorAll('#quizPage .duration-reading-variants').forEach(node=>node.classList.toggle('is-long',(node.textContent||'').trim().length>18));
  };
  document.addEventListener('click',event=>{const img=event.target.closest?.('.time-distinct-answer-image,.answer-img-preview');if(!img)return;event.preventDefault();event.stopPropagation();openZoom(img);},true);
  document.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const img=event.target.closest?.('.time-distinct-answer-image,.answer-img-preview');if(!img)return;event.preventDefault();openZoom(img);},true);
  const start=()=>{decorate();const quizPage=document.getElementById('quizPage');if(quizPage)new MutationObserver(decorate).observe(quizPage,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* source-script: wikaru-revisi-5-ux-audit-script */
(function(){
  'use strict';
  if(window.__wikaruRevisi5UxAuditReady)return;
  window.__wikaruRevisi5UxAuditReady=true;

  const MODES={
    number:{className:'number-quiz-active',panelId:'numberQuizPanel',chapter:'I. Kata Bilangan'},
    marker:{className:'marker-quiz-active',panelId:'markerQuizPanel',chapter:'Penanda Waktu'},
    duration:{className:'duration-quiz-active',panelId:'durationQuizPanel',chapter:'III. Ungkapan Waktu'},
    counter:{className:'counter-quiz-active',panelId:'counterQuizPanel',chapter:'IV. Kata Bantu Bilangan'}
  };
  let reconcileQueued=false;
  let reconciling=false;
  let copyQueued=false;

  function appState(){
    try{return typeof state!=='undefined'?state:null;}catch(_){return null;}
  }
  function selectedChapter(){
    const value=appState()?.setup?.chapter;
    if(value)return String(value);
    const labels=['IV. Kata Bantu Bilangan','III. Ungkapan Waktu','Penanda Waktu','II. Ungkapan Waktu','V. Konjugasi Kata Kerja','I. Kata Bilangan'];
    const setupOpen=document.getElementById('setupModal')?.classList.contains('show');
    const active=document.querySelector('#setupChapterGrid [data-setup-chapter].active');
    if(setupOpen&&active?.dataset?.setupChapter)return String(active.dataset.setupChapter);
    const choice=String(document.getElementById('activeChoiceText')?.textContent||'');
    for(const label of labels){if(choice.includes(label))return label;}
    const result=String(document.getElementById('resultActiveChoice')?.textContent||'');
    for(const label of labels){if(result.includes(label))return label;}
    if(active?.dataset?.setupChapter)return String(active.dataset.setupChapter);
    return '';
  }
  function visiblePage(){return document.querySelector('.page.active')?.id||'';}
  function setImportantDisplay(node,value){
    if(!node)return;
    if(node.style.getPropertyValue('display')!==value||node.style.getPropertyPriority('display')!=='important')node.style.setProperty('display',value,'important');
  }
  function hidePanel(panel){
    if(!panel)return;
    if(!panel.hidden)panel.hidden=true;
    if(panel.getAttribute('aria-hidden')!=='true')panel.setAttribute('aria-hidden','true');
    setImportantDisplay(panel,'none');
  }
  function showPanel(panel){
    if(!panel)return;
    if(panel.hidden)panel.hidden=false;
    if(panel.getAttribute('aria-hidden')!=='false')panel.setAttribute('aria-hidden','false');
    setImportantDisplay(panel,'block');
  }
  function modeFromClasses(){
    return Object.entries(MODES).find(([,meta])=>document.body.classList.contains(meta.className))?.[0]||'';
  }
  function expectedModeForChapter(chapter){
    return Object.entries(MODES).find(([,meta])=>meta.chapter===chapter)?.[0]||'';
  }
  function scheduleReconcile(){
    if(reconcileQueued)return;
    reconcileQueued=true;
    requestAnimationFrame(()=>{reconcileQueued=false;reconcileQuizPanels();});
  }
  function reconcileQuizPanels(){
    if(reconciling)return;
    reconciling=true;
    try{
      const chapter=selectedChapter();
      const quizPage=document.getElementById('quizPage');
      const quizVisible=quizPage?.classList.contains('active')||visiblePage()==='quizPage';
      const expected=expectedModeForChapter(chapter);
      let active=modeFromClasses();

      /* Kelas dari kuis lama tidak boleh terbawa ke kategori yang baru dipilih. */
      if(active&&expected&&active!==expected){
        document.body.classList.remove(MODES[active].className);
        active='';
      }
      if(active&&!expected&&chapter){
        document.body.classList.remove(MODES[active].className);
        active='';
      }

      /* Bila lebih dari satu kelas sempat tertinggal, pertahankan hanya yang sesuai kategori. */
      const present=Object.entries(MODES).filter(([,meta])=>document.body.classList.contains(meta.className));
      if(present.length>1){
        const keep=(expected&&present.some(([key])=>key===expected))?expected:present[present.length-1][0];
        present.forEach(([key,meta])=>{if(key!==keep)document.body.classList.remove(meta.className);});
        active=keep;
      }else active=present[0]?.[0]||'';

      Object.entries(MODES).forEach(([key,meta])=>{
        const panel=document.getElementById(meta.panelId);
        if(key===active&&quizVisible)showPanel(panel);else hidePanel(panel);
      });

      const grid=quizPage?.querySelector('.quiz-grid');
      const wrap=grid?.querySelector(':scope > .quiz-card-wrap');
      const control=grid?.querySelector(':scope > .control-panel');
      const flash=wrap?.querySelector(':scope > .flashcard');
      const counterPanel=document.getElementById('counterQuizPanel');

      if(!active){
        if(wrap){wrap.hidden=false;wrap.setAttribute('aria-hidden','false');setImportantDisplay(wrap,'flex');}
        if(control){control.hidden=false;control.setAttribute('aria-hidden','false');setImportantDisplay(control,'flex');}
        if(flash){flash.hidden=false;flash.setAttribute('aria-hidden','false');setImportantDisplay(flash,'block');}
        if(counterPanel)hidePanel(counterPanel);
      }else if(active==='counter'){
        if(wrap){wrap.hidden=true;wrap.setAttribute('aria-hidden','true');setImportantDisplay(wrap,'none');}
        if(control){control.hidden=true;control.setAttribute('aria-hidden','true');setImportantDisplay(control,'none');}
        if(flash){flash.hidden=true;flash.setAttribute('aria-hidden','true');setImportantDisplay(flash,'none');}
        showPanel(counterPanel);
      }else{
        if(wrap){wrap.hidden=false;wrap.setAttribute('aria-hidden','false');setImportantDisplay(wrap,'block');}
        if(control){control.hidden=true;control.setAttribute('aria-hidden','true');setImportantDisplay(control,'none');}
        if(flash){flash.hidden=true;flash.setAttribute('aria-hidden','true');setImportantDisplay(flash,'none');}
      }

      document.body.classList.toggle('wk-duration-base-active',quizVisible&&chapter==='III. Ungkapan Waktu'&&!active);
    }finally{reconciling=false;}
  }

  function resetStaleQuizPanels(){
    Object.values(MODES).forEach(meta=>{
      document.body.classList.remove(meta.className);
      hidePanel(document.getElementById(meta.panelId));
    });
    document.body.classList.remove('wk-duration-base-active');
    scheduleReconcile();
  }

  function setText(node,text){if(node&&text&&node.textContent!==text)node.textContent=text;}
  function improveCopywriting(){ if(typeof window.__wikaruUnifiedCopySchedule==='function') window.__wikaruUnifiedCopySchedule(); }

  document.addEventListener('click',event=>{
    const chapterButton=event.target.closest?.('[data-setup-chapter],[data-setup-material],[data-setup-book]');
    if(chapterButton)setTimeout(resetStaleQuizPanels,0);

    const specialStart=event.target.closest?.('[data-start-marker-quiz],[data-start-duration-quiz],[data-counter-start]');
    if(specialStart){
      const key=specialStart.matches('[data-start-marker-quiz]')?'marker':specialStart.matches('[data-start-duration-quiz]')?'duration':'counter';
      Object.entries(MODES).forEach(([other,meta])=>{if(other!==key){document.body.classList.remove(meta.className);hidePanel(document.getElementById(meta.panelId));}});
    }
    if(event.target.closest?.('[data-page],[data-action="openQuizSettings"],#startQuizFromSettings,[data-start-marker-quiz],[data-start-duration-quiz],[data-counter-start],#saveSetup,#nextSetupStep,#prevSetupStep')){
      [0,60,180,420,850].forEach(delay=>setTimeout(()=>{scheduleReconcile();improveCopywriting();},delay));
    }
  },true);
  document.addEventListener('change',event=>{
    if(event.target.closest?.('#setupModal,#quizSettingsModal,#markerQuizSettingsModal,#durationQuizSettingsModal,#counterSettingsModal')){
      setTimeout(()=>{scheduleReconcile();improveCopywriting();},0);
    }
  },true);

  const scheduleRepair=()=>{if(reconciling)return;scheduleReconcile();improveCopywriting();};
  new MutationObserver(scheduleRepair).observe(document.body,{attributes:true,attributeFilter:['class']});
  ['quizPage','setupModal','quizSettingsModal','materialPage'].forEach(id=>{
    const root=document.getElementById(id);
    if(root)new MutationObserver(scheduleRepair).observe(root,{subtree:true,childList:true});
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{resetStaleQuizPanels();improveCopywriting();},{once:true});
  else{resetStaleQuizPanels();improveCopywriting();}
  window.addEventListener('pageshow',()=>{scheduleReconcile();improveCopywriting();});
  [120,420,1100,2200].forEach(delay=>setTimeout(()=>{scheduleReconcile();improveCopywriting();},delay));
})();

/* source-script: wikaru-revisi-6-visual-system-script */
(function(){
  'use strict';
  if(window.__wikaruRevision6VisualReady)return;
  window.__wikaruRevision6VisualReady=true;

  const MATERIALS={
    'Materi Umum':{tone:'blue',title:{id:'Materi Umum',ja:'一般教材'},note:{id:'Pelajari kosakata utama setiap bab melalui gambar, cara baca, contoh kalimat, catatan singkat, flashcard, dan kuis.',ja:'各課の基本語彙を、画像・読み方・例文・メモ・フラッシュカード・クイズで学べます。'}},
    'Kata-Kata Referensi dan Informasi':{tone:'violet',title:{id:'Kata-Kata Referensi dan Informasi',ja:'参考語彙・情報'},note:{id:'Perluas pemahaman melalui kosakata tambahan, informasi praktis, dan konteks budaya yang berkaitan dengan setiap bab.',ja:'各課に関係する補足語彙・実用情報・文化的背景を確認できます。'}},
    'Kata-Kata Referensi dan Informasi':{tone:'violet',title:{id:'Kata-Kata Referensi dan Informasi',ja:'参考語彙・情報'},note:{id:'Perluas pemahaman melalui kosakata tambahan, informasi praktis, dan konteks budaya yang berkaitan dengan setiap bab.',ja:'各課に関係する補足語彙・実用情報・文化的背景を確認できます。'}},
    'Daftar Lampiran':{tone:'teal',title:{id:'Daftar Lampiran',ja:'付録一覧'},note:{id:'Tabel praktis, laboratorium interaktif, audio, dan kuis tematik dalam satu tempat.',ja:'実用表・インタラクティブ教材・音声・テーマ別クイズをまとめています。'}}
  };
  const APPENDIX=[
    {test:/^I\.?\s*Kata Bilangan$/i,tone:'blue',icon:'fa-hashtag',note:{id:'Angka dan pola bacanya',ja:'数字と読み方のパターン'}},
    {test:/^II\.?\s*Ungkapan Waktu$/i,tone:'violet',icon:'fa-clock-rotate-left',note:{id:'Ungkapan waktu dalam konteks',ja:'文脈で使う時間表現'}},
    {test:/Penanda\s*Waktu/i,tone:'amber',icon:'fa-calendar-days',note:{id:'Jam, menit, bulan, dan tanggal',ja:'時・分・月・日付'}},
    {test:/^III\.?\s*Ungkapan Waktu$/i,tone:'coral',icon:'fa-hourglass-half',note:{id:'Durasi dan jangka waktu',ja:'期間と所要時間'}},
    {test:/^IV\.?\s*Kata Bantu Bilangan$/i,tone:'teal',icon:'fa-cubes-stacked',note:{id:'Penghitung yang sesuai dengan benda',ja:'物に合った助数詞'}},
    {test:/^V\.?\s*Konjugasi Kata Kerja$/i,tone:'green',icon:'fa-shuffle',note:{id:'Perubahan bentuk kata kerja',ja:'動詞の活用'}}
  ];
  const TONES=['blue','teal','violet','green'];

  function directText(container){
    return Array.from(container?.childNodes||[]).find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
  }
  function setDirectText(container,text){
    if(!container||!text)return;
    const node=directText(container);
    if(node){if(node.textContent!==text)node.textContent=text;}
    else container.insertBefore(document.createTextNode(text),container.firstChild);
  }
  function setText(node,text){if(node&&node.textContent!==text)node.textContent=text;}
  function setData(node,key,value){if(node&&node.dataset[key]!==value)node.dataset[key]=value;}
  function setAttr(node,key,value){if(node&&node.getAttribute(key)!==value)node.setAttribute(key,value);}
  function materialKey(value=''){
    const s=String(value).toLowerCase();
    if(s.includes('lampiran'))return 'appendix';
    if(s.includes('referensi')||s.includes('informasi'))return 'reference';
    return 'general';
  }
  function uiLang(){return (document.documentElement.lang||'id').toLowerCase().startsWith('ja')?'ja':'id'}
  function localized(value){return value&&typeof value==='object'?(value[uiLang()]||value.id||value.ja||''):String(value||'')}
  function decorateMaterialCards(){
    document.querySelectorAll('#setupMaterialGrid [data-setup-material]').forEach(card=>{
      const meta=MATERIALS[card.dataset.setupMaterial]||{tone:'blue',title:{id:card.dataset.setupMaterial,ja:card.dataset.setupMaterial},note:{id:'Materi belajar yang tersedia.',ja:'利用できる教材です。'}};
      const title=localized(meta.title),note=localized(meta.note);
      setData(card,'wkTone',meta.tone);
      const copy=card.querySelector(':scope>div');
      if(copy){
        setDirectText(copy,title);
        const small=copy.querySelector('small');
        setText(small,note);
      }
      setAttr(card,'aria-label',title+'. '+note);
    });
    document.querySelectorAll('#setupBookGrid [data-setup-book]').forEach((card,index)=>setData(card,'wkTone',index%2?'teal':'blue'));
    document.querySelectorAll('#setupLangGrid [data-setup-lang]').forEach(card=>setData(card,'wkTone',card.dataset.setupLang==='ja'?'violet':'blue'));
  }
  function chapterMeta(label){
    const lang=uiLang();
    const currentBook=String((typeof tempSetup!=="undefined"&&tempSetup?.book)||(typeof state!=="undefined"&&state.setup?.book)||"");
    const currentMaterial=String((typeof tempSetup!=="undefined"&&tempSetup?.materialCategory)||(typeof state!=="undefined"&&state.setup?.materialCategory)||"");
    const isMinnaII=currentBook.startsWith("Minna no Nihongo II");
    const isReference=/referensi|informasi/i.test(currentMaterial);
    if(isMinnaII&&label==="Bab 43"&&isReference){
      return {tone:'violet',icon:'fa-user-group',note:lang==='ja'?'性格・性質を表す20語：イ形容詞10語＋ナ形容詞10語':'20 kosakata karakter dan sifat • 10 Kata Sifat-i + 10 Kata Sifat-na'};
    }
    if(isMinnaII&&label==="Bab 26"&&isReference){
      return {tone:'violet',icon:'fa-recycle',note:lang==='ja'?'ごみの分別・収集日・粗大ごみの実用ガイド（クイズなし）':'Panduan visual memilah dan membuang sampah di Jepang • tanpa kuis'};
    }
    if(isMinnaII&&label==="Bab 26"){
      return {tone:'blue',icon:'fa-magnifying-glass',note:lang==='ja'?'探す・時間・活動・ごみ・宇宙を扱う47語':'47 kosakata tentang mencari, waktu, kegiatan, sampah, dan luar angkasa'};
    }
    if(isMinnaII&&label==="Bab 27"){
      return {tone:'teal',icon:'fa-house',note:lang==='ja'?'感覚・住まい・家具・ドラえもんを扱う44語':'44 kosakata tentang indra, rumah, perabot, dan bacaan Doraemon'};
    }
    if(isMinnaII&&label==="Bab 28"){
      return {tone:'blue',icon:'fa-book-open',note:lang==='ja'?'語彙・会話・読み物に分けた54語':'54 kosakata: Kosakata, Percakapan, dan Bacaan'};
    }
    if(isMinnaII&&label==="Bab 29"&&isReference){
      return {tone:'violet',icon:'fa-shapes',note:lang==='ja'?'状態・様子を表す14語':'14 kosakata keadaan dan kondisi'};
    }
    if(isMinnaII&&label==="Bab 29"){
      return {tone:'teal',icon:'fa-door-open',note:lang==='ja'?'状態変化・忘れ物・地震を扱う52語':'52 kosakata: perubahan keadaan, barang tertinggal, dan gempa'};
    }
    if(isMinnaII&&label==="Bab 30"&&isReference){
      return {tone:'violet',icon:'fa-shield-halved',note:lang==='ja'?'非常時のことばと防災行動を学ぶ実用ガイド（クイズなし）':'Panduan keadaan darurat di Jepang: kosakata + tindakan praktis • tanpa kuis'};
    }
    if(isMinnaII&&label==="Bab 30"){
      return {tone:'blue',icon:'fa-table-cells-large',note:lang==='ja'?'配置・予定・非常時・読み物を扱う48語':'48 kosakata tentang penataan, jadwal, keadaan darurat, dan bacaan'};
    }
    if(isMinnaII&&label==="Bab 31"&&!isReference){
      return {tone:'teal',icon:'fa-graduation-cap',note:lang==='ja'?'進学・休暇・施設・会話・読み物を扱う40語':'40 kosakata: 28 Kosakata, 3 Percakapan, dan 9 Bacaan'};
    }
    if(isMinnaII&&label==="Bab 35"&&isReference){
      return {tone:'violet',icon:'fa-quote-left',note:lang==='ja'?'ことわざ6項目＋状況検索（クイズなし）':'6 kotowaza utama + pencari pepatah berdasarkan situasi • tanpa kuis'};
    }
    if(isMinnaII&&label==="Bab 34"&&isReference){
      return {tone:'green',icon:'fa-utensils',note:lang==='ja'?'料理・調味料・台所用品の43語':'43 kosakata dapur: masakan, bumbu, dan peralatan dapur'};
    }
    if(isMinnaII&&label==="Bab 26-30"&&!isReference){
      return {tone:'green',icon:'fa-layer-group',note:lang==='ja'?'第26～30課をまとめて効率よく復習':'Gabungan Materi Umum Bab 26–30'};
    }
    if(isMinnaII&&label==="Bab 31-35"&&!isReference){
      return {tone:'violet',icon:'fa-layer-group',note:lang==='ja'?'第31～35課をまとめて重点復習':'Gabungan Materi Umum Bab 31–35'};
    }
    if(isMinnaII&&label==="Bab 26-35"&&!isReference){
      return {tone:'green',icon:'fa-books',note:lang==='ja'?'第26～35課をまとめた総合復習':'Paket lengkap Materi Umum Bab 26–35'};
    }
    if(isMinnaII&&label==="Bab 36-40"&&!isReference){
      return {tone:'violet',icon:'fa-layer-group',note:lang==='ja'?'第36～40課をまとめて重点復習':'Gabungan Materi Umum Bab 36–40'};
    }
    if(isMinnaII&&label==="Bab 26-40"&&!isReference){
      return {tone:'green',icon:'fa-books',note:lang==='ja'?'第26～40課をまとめた総合復習':'Paket lengkap Materi Umum Bab 26–40'};
    }
    if(isMinnaII&&label==="Bab 41-45"&&!isReference){
      return {tone:'violet',icon:'fa-layer-group',note:lang==='ja'?'第41～45課をまとめて重点復習':'Gabungan Materi Umum Bab 41–45'};
    }
    if(isMinnaII&&label==="Bab 26-45"&&!isReference){
      return {tone:'green',icon:'fa-books',note:lang==='ja'?'第26～45課をまとめた総合復習':'Paket lengkap Materi Umum Bab 26–45'};
    }
    if(isMinnaII&&label==="Bab 46-50"&&!isReference){
      return {tone:'violet',icon:'fa-layer-group',note:lang==='ja'?'第46～50課をまとめて重点復習':'Gabungan Materi Umum Bab 46–50'};
    }
    if(isMinnaII&&label==="Bab 26-50"&&!isReference){
      return {tone:'green',icon:'fa-books',note:lang==='ja'?'みんなの日本語II・第26～50課の総合復習':'Paket lengkap Minna no Nihongo II Bab 26–50'};
    }
    if(isMinnaII&&label==="Bab 1-50"&&!isReference){
      return {tone:'green',icon:'fa-book-open-reader',note:lang==='ja'?'みんなの日本語I・IIの第1～50課をまとめて復習':'Paket lengkap Minna no Nihongo I & II Bab 1–50'};
    }
    for(const item of APPENDIX)if(item.test.test(label))return {...item,note:localized(item.note)};
    const range=label.match(/^Bab\s*(\d+)\s*-\s*(\d+)$/i);
    if(range){
      const start=Number(range[1]),end=Number(range[2]);
      if(start===1&&end>=25)return {tone:'green',icon:'fa-books',note:lang==='ja'?`第${start}～${end}課の全教材`:`Seluruh materi Bab ${start}–${end}`};
      return {tone:'violet',icon:'fa-layer-group',note:lang==='ja'?`第${start}～${end}課のまとめ`:`Gabungan materi Bab ${start}–${end}`};
    }
    const match=label.match(/(?:Bab|第)\s*(\d+)/i);
    if(match){
      const n=Number(match[1]);
      return {tone:TONES[(n-1)%TONES.length],icon:'fa-book-open',note:lang==='ja'?`第${n}課の語彙・例文・練習`:`Kosakata, contoh, dan latihan Bab ${n}`};
    }
    return {tone:'blue',icon:'fa-bookmark',note:lang==='ja'?'教材と練習':'Materi dan latihan terarah'};
  }
  function displayChapterLabel(label){
    if(uiLang()!=='ja'){
      const range=label.match(/^Bab\s*(\d+)\s*-\s*(\d+)$/i);
      return range?`Bab ${range[1]}–${range[2]}`:label;
    }
    const range=label.match(/^Bab\s*(\d+)\s*-\s*(\d+)$/i);
    if(range)return `第${range[1]}～${range[2]}課`;
    const one=label.match(/^Bab\s*(\d+)$/i);
    if(one)return `第${one[1]}課`;
    const appendix={
      'I. Kata Bilangan':'I. 数詞','II. Ungkapan Waktu':'II. 時間表現','Penanda Waktu':'時刻・日付',
      'III. Ungkapan Waktu':'III. 期間表現','IV. Kata Bantu Bilangan':'IV. 助数詞','V. Konjugasi Kata Kerja':'V. 動詞活用'
    };
    return appendix[label]||label;
  }
  function decorateChapterCards(){
    const grid=document.getElementById('setupChapterGrid');
    const buttons=Array.from(document.querySelectorAll('#setupChapterGrid [data-setup-chapter]'));
    let appendixCards=0;
    buttons.forEach(button=>{
      const label=button.dataset.setupChapter||button.textContent.trim();
      const displayLabel=displayChapterLabel(label);
      const meta=chapterMeta(label);
      if(APPENDIX.some(item=>item.test.test(label)))appendixCards+=1;
      setData(button,'wkTone',meta.tone);
      let shell=button.querySelector('.wk-category-main');
      if(!shell){
        button.innerHTML=`<span class="wk-category-main"><span class="wk-category-icon"><i class="fa-solid ${meta.icon}"></i></span><span class="wk-category-copy"><strong></strong><small></small></span></span>`;
        shell=button.querySelector('.wk-category-main');
      }
      const icon=shell.querySelector('i');
      if(icon&&icon.className!==`fa-solid ${meta.icon}`)icon.className=`fa-solid ${meta.icon}`;
      const strong=shell.querySelector('strong');
      const small=shell.querySelector('small');
      setText(strong,displayLabel);
      setText(small,meta.note);
      setAttr(button,'aria-label',displayLabel+'. '+meta.note);
    });
    setData(grid,'wkLayout',appendixCards>=4?'appendix':'chapters');
  }
  function improveCopy(){
    const lang=(document.documentElement.lang||'id').toLowerCase();
    if(lang.startsWith('ja'))return;
    const setup=document.getElementById('setupModal');
    if(setup){
      const title=setup.querySelector('.modal-title h2');
      const desc=setup.querySelector('.modal-title p');
      setText(title,'Pilih Materi Belajar');
      setText(desc,'Atur bahasa, buku, kategori materi, dan bab yang ingin dipelajari. Halaman materi dan latihan akan mengikuti pilihan tersebut.');
      const headings=setup.querySelectorAll('.step-block h3');
      const labels=['1. Pilih bahasa tampilan','2. Pilih buku','3. Pilih kategori materi','4. Pilih bab'];
      headings.forEach((node,index)=>{const target=node.querySelector('span:last-child')||node;if(labels[index])setText(target,labels[index]);});
      const activeStep=setup.querySelector('.step-block.active')?.dataset.setupStep||'1';
      const hint=document.getElementById('setupStepHint');
      const hints={1:'Bahasa',2:'Buku',3:'Kategori Materi',4:'Bab'};
      setText(hint,hints[activeStep]||'Pilihan');
      const next=document.getElementById('nextSetupStep');
      const save=document.getElementById('saveSetup');
      setText(next,'Lanjutkan');
      setText(save,'Terapkan Pilihan');
    }
    const categoryButton=document.getElementById('homeChangeCategoryBtn');
    const categoryLabel=categoryButton?.querySelector('span');
    setText(categoryLabel,'Ganti Materi');
    const quick={
      homeQuickMaterialCopy:'Pelajari arti, bacaan, dan contoh penggunaan',
      homeQuickFlashCopy:'Uji ingatan dengan kartu yang fokus',
      homeQuickSpeechCopy:'Latih pelafalan dan lihat hasil tangkapan suara',
      homeQuickResultCopy:'Tinjau skor, kesalahan, dan progres belajar'
    };
    Object.entries(quick).forEach(([id,text])=>setText(document.getElementById(id),text));
    document.querySelectorAll('.counter-hero-quiz strong').forEach(node=>setText(node,'Mulai Kuis Kata Bantu Bilangan'));
    document.querySelectorAll('.counter-hero-quiz small').forEach(node=>setText(node,'Pilih flashcard atau latihan kalimat rumpang.'));
  }
  function syncContext(){
    const text=[document.getElementById('activeChoiceText')?.textContent,document.getElementById('resultActiveChoice')?.textContent].filter(Boolean).join(' ');
    setData(document.body,'wkMaterial',materialKey(text));
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta){const value=document.documentElement.dataset.theme==='dark'?'#0E1624':'#2D4F8B';if(meta.content!==value)meta.content=value;}
  }
  function decorate(){
    decorateMaterialCards();
    decorateChapterCards();
    improveCopy();
    syncContext();
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});}
  document.addEventListener('click',event=>{
    if(event.target.closest('#homeChangeCategoryBtn,#changeCategoryBtn,#nextSetupStep,#prevSetupStep,[data-setup-book],[data-setup-material],[data-setup-chapter],#saveSetup,#themeToggle')){
      [0,80,220,520].forEach(delay=>setTimeout(schedule,delay));
    }
  },true);
  const observe=(target,options)=>{if(!target)return;const observer=new MutationObserver(schedule);observer.observe(target,options);};
  observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','lang']});
  observe(document.body,{attributes:true,attributeFilter:['class']});
  ['setupMaterialGrid','setupChapterGrid','setupBookGrid','setupLangGrid'].forEach(id=>observe(document.getElementById(id),{childList:true,subtree:true}));
  ['activeChoiceText','resultActiveChoice'].forEach(id=>observe(document.getElementById(id),{childList:true,characterData:true,subtree:true}));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
  [120,420,1000,2200].forEach(delay=>setTimeout(schedule,delay));
})();

/* source-script: wikaru-revisi-7-contrast-guard-script */
(function(){
  'use strict';
  if(window.__wikaruRevision7ContrastReady)return;
  window.__wikaruRevision7ContrastReady=true;

  const LIGHT={r:248,g:250,b:255,a:1};
  const DARK={r:20,g:33,b:61,a:1};
  const ROOTS='.top-nav,.bottom-nav,.page.active,.modal.show,.toast,.dropdown.show';
  let running=false,queued=false,lastReport={scanned:0,fixed:0,unresolved:0};

  function rgba(value){
    if(!value)return null;
    const match=String(value).match(/rgba?\(([^)]+)\)/i);
    if(!match)return null;
    const parts=match[1].split(',').map(item=>Number.parseFloat(item.trim()));
    if(parts.length<3||parts.slice(0,3).some(Number.isNaN))return null;
    return {r:parts[0],g:parts[1],b:parts[2],a:parts.length>3&&!Number.isNaN(parts[3])?parts[3]:1};
  }
  function composite(top,bottom){
    const a=top.a+(bottom.a||1)*(1-top.a);
    if(a<=0)return {r:255,g:255,b:255,a:1};
    return {
      r:(top.r*top.a+bottom.r*(bottom.a||1)*(1-top.a))/a,
      g:(top.g*top.a+bottom.g*(bottom.a||1)*(1-top.a))/a,
      b:(top.b*top.a+bottom.b*(bottom.a||1)*(1-top.a))/a,
      a
    };
  }
  function luminance(color){
    const channel=value=>{value/=255;return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4);};
    return .2126*channel(color.r)+.7152*channel(color.g)+.0722*channel(color.b);
  }
  function ratio(a,b){
    const x=luminance(a),y=luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  function gradientColors(image){
    if(!image||image==='none')return [];
    return Array.from(String(image).matchAll(/rgba?\(([^)]+)\)/gi),match=>rgba(match[0])).filter(Boolean);
  }
  function limit(colors){
    if(colors.length<=12)return colors;
    const result=[];
    for(let index=0;index<12;index++)result.push(colors[Math.round(index*(colors.length-1)/11)]);
    return result;
  }
  function backgroundCandidates(element){
    const chain=[];
    let node=element;
    while(node&&node.nodeType===1){chain.push(node);if(node===document.body)break;node=node.parentElement;}
    let candidates=[document.documentElement.dataset.theme==='dark'?{r:14,g:22,b:36,a:1}:{r:244,g:247,b:251,a:1}];
    chain.reverse().forEach(item=>{
      const style=getComputedStyle(item);
      const base=rgba(style.backgroundColor);
      if(base&&base.a>0)candidates=limit(candidates.map(color=>composite(base,color)));
      const stops=gradientColors(style.backgroundImage);
      if(stops.length){
        const next=[];
        candidates.forEach(color=>stops.forEach(stop=>next.push(composite(stop,color))));
        candidates=limit(next);
      }
    });
    return candidates.length?candidates:[document.documentElement.dataset.theme==='dark'?DARK:LIGHT];
  }
  function directText(element){
    return Array.from(element.childNodes).some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
  }
  function isVisible(element){
    const style=getComputedStyle(element);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)<.15)return false;
    const rect=element.getBoundingClientRect();
    const margin=640;
    return rect.width>1&&rect.height>1&&rect.bottom>=-margin&&rect.top<=window.innerHeight+margin;
  }
  function threshold(element){
    const style=getComputedStyle(element);
    const size=Number.parseFloat(style.fontSize)||16;
    const weight=Number.parseInt(style.fontWeight,10)||400;
    return size>=24||(size>=18.66&&weight>=700)?3:4.5;
  }
  function restore(element){
    delete element.dataset.wkContrastAuto;
  }
  function apply(element,mode){
    element.dataset.wkContrastAuto=mode;
  }
  function collect(){
    const set=new Set();
    document.querySelectorAll(ROOTS).forEach(root=>{
      if(!isVisible(root))return;
      if(directText(root))set.add(root);
      root.querySelectorAll('*').forEach(element=>{if(directText(element))set.add(element);});
    });
    return Array.from(set);
  }
  function audit(){
    if(running)return lastReport;
    running=true;
    let scanned=0,fixed=0,unresolved=0;
    try{
      collect().forEach(element=>{
        if(!isVisible(element))return;
        scanned+=1;
        /* Kembalikan warna stylesheet terlebih dahulu agar penilaian tidak memakai koreksi lama. */
        if(element.dataset.wkContrastAuto)restore(element);
        const foreground=rgba(getComputedStyle(element).color);
        if(!foreground)return;
        const backgrounds=backgroundCandidates(element);
        const required=threshold(element);
        const current=Math.min(...backgrounds.map(background=>ratio(foreground,background)));
        if(current>=required)return;
        const lightScore=Math.min(...backgrounds.map(background=>ratio(LIGHT,background)));
        const darkScore=Math.min(...backgrounds.map(background=>ratio(DARK,background)));
        const mode=lightScore>=darkScore?'light':'dark';
        const best=Math.max(lightScore,darkScore);
        apply(element,mode);
        fixed+=1;
        if(best<required)unresolved+=1;
      });
      lastReport={scanned,fixed,unresolved,theme:document.documentElement.dataset.theme||'light',at:new Date().toISOString()};
      document.documentElement.dataset.wkContrastAudit=unresolved?'review':'pass';
      return lastReport;
    }finally{running=false;}
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;audit();});
  }

  const themeObserver=new MutationObserver(()=>setTimeout(schedule,40));
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  document.addEventListener('click',()=>[60,520].forEach(delay=>setTimeout(schedule,delay)),true);
  window.addEventListener('resize',schedule,{passive:true});
  let scrollTimer=0;
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(schedule,90);},{passive:true});
  window.addEventListener('pageshow',schedule);
  window.__WIKARU_REVISI_7_CONTRAST_AUDIT=()=>audit();
  window.__WIKARU_REVISI_7_REPORT=()=>({...lastReport,build:'REVISI_7_CONTRAST_GUARD'});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  [100,900,2400].forEach(delay=>setTimeout(schedule,delay));
})();

/* source-script: wikaru-revisi-8-home-white-icon-guard */
(function(){
  'use strict';
  if(window.__wikaruRevision8HomeIconReady)return;
  window.__wikaruRevision8HomeIconReady=true;
  const selector='#homeMaterialBtn,#homeResultBtn,#homeStartBtn,#homeLoginBtn';
  function clean(){
    document.querySelectorAll(selector).forEach(button=>{
      delete button.dataset.wkContrastAuto;
      button.querySelectorAll('[data-wk-contrast-auto]').forEach(node=>delete node.dataset.wkContrastAuto);
    });
  }
  const observer=new MutationObserver(clean);
  const start=()=>{
    clean();
    const home=document.getElementById('homePage');
    if(home)observer.observe(home,{subtree:true,attributes:true,attributeFilter:['data-wk-contrast-auto','class','style']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('click',()=>setTimeout(clean,70),true);
  window.__WIKARU_REVISI_8_HOME_ICON_REPORT=()=>({
    build:'REVISI_8_HOME_WHITE_ICON',
    forcedBlackIcons:Array.from(document.querySelectorAll('#homePage button i')).filter(icon=>{
      const c=getComputedStyle(icon).color;
      return c==='rgb(0, 0, 0)'||c==='rgba(0, 0, 0, 1)';
    }).length
  });
})();

/* source-script: wikaru-revisi-9-motion-icon-runtime */
(function(){
  'use strict';
  if(window.__wikaruRevision9MotionIconReady)return;
  window.__wikaruRevision9MotionIconReady=true;
  const root=document.documentElement;
  const MOTION_KEY='wikaru_motion';
  const $=(selector,scope=document)=>scope.querySelector(selector);
  const $$=(selector,scope=document)=>Array.from(scope.querySelectorAll(selector));

  function motionMode(){try{return localStorage.getItem(MOTION_KEY)==='reduced'?'reduced':'full'}catch(_){return 'full'}}
  function setMotion(mode,persist=true){
    const value=mode==='reduced'?'reduced':'full';
    root.dataset.wkMotion=value;
    if(persist){try{localStorage.setItem(MOTION_KEY,value)}catch(_){}}
    refreshMotionToggle();
    document.dispatchEvent(new CustomEvent('wikaru:motion-changed',{detail:{mode:value}}));
  }
  setMotion(motionMode(),false);

  const path=(d,extra='')=>`<path d="${d}" ${extra}/>`;
  function iconSvg(name){
    const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="wk-inline-icon"';
    const icons={
      language:`${path('M4 5h10M9 3v2m1.5 0c-.7 3.2-2.5 5.8-5.5 7.5m2.3-4.2c1.4 1.8 3 3.2 4.9 4.2')}${path('M14 11l4 10m-8 0 4-10m-2.5 6h5')}`,
      book:`${path('M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z')}${path('M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z')}`,
      layers:`${path('m12 3-9 5 9 5 9-5-9-5z')}${path('m3 12 9 5 9-5')}${path('m3 16 9 5 9-5')}`,
      bookmark:`${path('M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.8L6 21z')}`,
      general:`${path('M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z')}${path('M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z')}${path('M7 7h2M15 7h2')}`,
      info:`${path('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z')}${path('M12 10v6')}${path('M12 7h.01')}`,
      archive:`${path('M4 8v11h16V8')}${path('M3 4h18v4H3z')}${path('M9 12h6')}`,
      hash:`${path('M5 9h14M4 15h14M10 3 8 21M16 3l-2 18')}`,
      clock:`${path('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z')}${path('M12 6v6l4 2')}`,
      calendar:`${path('M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z')}${path('M7 2v4M17 2v4M3 9h18')}${path('M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2')}`,
      hourglass:`${path('M6 2h12M6 22h12')}${path('M7 2c0 5 2 6 5 10-3 4-5 5-5 10M17 2c0 5-2 6-5 10 3 4 5 5 5 10')}`,
      cubes:`${path('m8 3 4 2.3L8 7.7 4 5.3 8 3z')}${path('M4 5.3v4.5L8 12V7.7M12 5.3v4.5L8 12')}${path('m16 12 4 2.3-4 2.4-4-2.4 4-2.3z')}${path('M12 14.3v4.5l4 2.2v-4.3M20 14.3v4.5L16 21')}`,
      shuffle:`${path('M3 7h3c4 0 5 10 9 10h6')}${path('m18 14 3 3-3 3')}${path('M3 17h3c1.5 0 2.7-1.4 3.8-3')}${path('M14.3 7c1.2-1.4 2.2-2 3.7-2h3')}${path('m18 2 3 3-3 3')}`,
      sun:`${path('M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z')}${path('M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42')}`,
      moon:`${path('M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8z')}`,
      spark:`${path('m12 2 1.4 4.1L17.5 7.5l-4.1 1.4L12 13l-1.4-4.1-4.1-1.4 4.1-1.4L12 2z')}${path('m18.5 13 1 2.5L22 16.5l-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z')}${path('m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14z')}`
    };
    return `<svg ${common}>${icons[name]||icons.book}</svg>`;
  }

  function materialIcon(card){
    const value=String(card.dataset.setupMaterial||'').toLowerCase();
    if(value.includes('lampiran'))return 'archive';
    if(value.includes('referensi')||value.includes('informasi'))return 'info';
    return 'general';
  }
  function chapterIcon(card){
    const label=String(card.dataset.setupChapter||card.textContent||'');
    if(/^I\.?\s*Kata Bilangan/i.test(label))return 'hash';
    if(/^II\.?\s*Ungkapan Waktu/i.test(label))return 'clock';
    if(/Penanda\s*Waktu/i.test(label))return 'calendar';
    if(/^III\.?\s*Ungkapan Waktu/i.test(label))return 'hourglass';
    if(/^IV\.?\s*Kata Bantu Bilangan/i.test(label))return 'cubes';
    if(/^V\.?\s*Konjugasi/i.test(label))return 'shuffle';
    if(/-/.test(label))return 'layers';
    return 'book';
  }
  function replaceIcon(container,name){
    if(!container)return;
    const current=container.querySelector(':scope > .wk-inline-icon');
    if(current&&current.dataset.iconName===name)return;
    container.innerHTML=iconSvg(name);
    const svg=container.querySelector('.wk-inline-icon');
    if(svg)svg.dataset.iconName=name;
  }
  function restoreIcons(){
    $$('#setupLangGrid [data-setup-lang]').forEach(card=>replaceIcon($('.option-soft-icon',card),'language'));
    $$('#setupBookGrid [data-setup-book]').forEach(card=>replaceIcon($('.option-soft-icon',card),'book'));
    $$('#setupMaterialGrid [data-setup-material]').forEach(card=>replaceIcon($('.option-soft-icon',card),materialIcon(card)));
    $$('#setupChapterGrid [data-setup-chapter]').forEach(card=>{
      let shell=$('.wk-category-icon',card);
      if(!shell){
        const main=$('.wk-category-main',card);
        if(main){shell=document.createElement('span');shell.className='wk-category-icon';main.prepend(shell)}
      }
      replaceIcon(shell,chapterIcon(card));
    });
    const heads=[
      ['[data-setup-step="1"] .soft-step-icon','language'],['[data-setup-step="2"] .soft-step-icon','book'],
      ['[data-setup-step="3"] .soft-step-icon','layers'],['[data-setup-step="4"] .soft-step-icon','bookmark']
    ];
    heads.forEach(([selector,name])=>replaceIcon($(selector),name));
  }

  function addMotionArt(){
    $$('.wk-motion-constellation').forEach(node=>node.remove());
  }

  let lastStep=null;
  function animateActiveStep(force=false){
    const step=$('#setupModal .step-block.active');
    if(!step)return;
    const key=step.dataset.setupStep||step.dataset.quizStep||'';
    if(!force&&lastStep===key&&step.dataset.wkMotionAnimated==='true')return;
    lastStep=key;step.dataset.wkMotionAnimated='true';
    step.classList.remove('wk-step-motion-in');
    step.style.opacity='1';
    step.style.transform='none';
  }
  function animateModalOpen(){
    const modal=$('#setupModal');
    const card=$('.modal-card',modal);
    if(!modal?.classList.contains('show')||!card)return;
    if(modal.dataset.wkOpenMotionPlayed==='true')return;
    modal.dataset.wkOpenMotionPlayed='true';
    card.style.opacity='1';
    card.style.transform='none';
    animateActiveStep(true);
  }

  function cardFeedback(event,card){
    card.classList.remove('wk-card-ripple','wk-card-selected');
  }

  function refreshMotionToggle(){
    const button=$('#motionToggle');if(!button)return;
    const full=root.dataset.wkMotion!=='reduced';
    const ja=(document.documentElement.lang||'id').toLowerCase().startsWith('ja');
    button.setAttribute('aria-pressed',String(full));
    button.title=ja
      ? (full?'アニメーションは有効です。クリックすると軽量モードになります。':'軽量モードです。クリックするとアニメーションを有効にします。')
      : (full?'Animasi aktif — klik untuk mode ringan':'Animasi ringan — klik untuk mengaktifkan penuh');
    const label=$('.wk-motion-label',button);if(label)label.textContent=ja?'画面アニメーション':'Animasi Antarmuka';
    const state=$('.wk-motion-state',button);if(state)state.textContent=ja?(full?'有効':'軽量'):(full?'Aktif':'Ringan');
  }
  function installMotionToggle(){
    const anchor=$('#langToggleDrop');const parent=anchor?.parentElement;
    if(!parent||$('#motionToggle')){refreshMotionToggle();return;}
    const button=document.createElement('button');
    button.className='drop-item';button.id='motionToggle';button.type='button';button.setAttribute('role','menuitem');
    button.innerHTML=`${iconSvg('spark')}<span class="wk-motion-label"></span><span class="wk-motion-state"></span>`;
    anchor.insertAdjacentElement('afterend',button);
    button.addEventListener('click',()=>setMotion(root.dataset.wkMotion==='reduced'?'full':'reduced'));
    refreshMotionToggle();
  }

  function themePoint(button){
    const rect=button?.getBoundingClientRect?.();
    const x=rect?.width?rect.left+rect.width/2:innerWidth-48;
    const y=rect?.height?rect.top+rect.height/2:48;
    return {x,y,ix:Math.min(Math.max(x,54),innerWidth-54),iy:Math.min(Math.max(y,54),innerHeight-54)};
  }
  function createThemeOverlay(next,button){
    $$('.wk-theme-v9-overlay').forEach(node=>node.remove());
    const point=themePoint(button);const radius=Math.ceil(Math.hypot(Math.max(point.x,innerWidth-point.x),Math.max(point.y,innerHeight-point.y))+52);
    const overlay=document.createElement('div');overlay.className=`wk-theme-v9-overlay to-${next}`;overlay.setAttribute('aria-hidden','true');
    overlay.style.setProperty('--wk-theme-x',`${point.x}px`);overlay.style.setProperty('--wk-theme-y',`${point.y}px`);
    overlay.style.setProperty('--wk-theme-ix',`${point.ix}px`);overlay.style.setProperty('--wk-theme-iy',`${point.iy}px`);overlay.style.setProperty('--wk-theme-size',`${radius*2}px`);
    const wash=document.createElement('div');wash.className='wk-theme-v9-wash';
    overlay.append(wash);
    document.body.appendChild(overlay);root.classList.add('wk-theme-v9-changing');
    const reduced=root.dataset.wkMotion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration=reduced?40:220;
    wash.animate([{opacity:0},{opacity:1}],{duration,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>{overlay.animate([{opacity:1},{opacity:0}],{duration:100,fill:'forwards'}).finished.finally(()=>overlay.remove());root.classList.remove('wk-theme-v9-changing')},duration);
  }

  window.addEventListener('click',event=>{
    const themeButton=event.target?.closest?.('#themeToggle');
    if(themeButton){const next=root.dataset.theme==='dark'?'light':'dark';createThemeOverlay(next,themeButton)}
  },true);

  document.addEventListener('click',event=>{
    const card=event.target.closest?.('#setupModal .option-card,#setupModal .category-button,#setupModal .choice-chip,#setupModal .check-pill');
    if(card)cardFeedback(event,card);
    const stepNavigation=event.target.closest?.('#nextSetupStep,#prevSetupStep');
    const simpleSelection=event.target.closest?.('[data-setup-lang],[data-setup-book],[data-setup-material],[data-setup-chapter]');
    if(stepNavigation){
      clearTimeout(window.__wikaruSetupMotionTimer);
      window.__wikaruSetupMotionTimer=setTimeout(()=>{restoreIcons();animateActiveStep(true)},90);
    }else if(simpleSelection){
      clearTimeout(window.__wikaruSetupIconTimer);
      window.__wikaruSetupIconTimer=setTimeout(restoreIcons,30);
    }
  },true);

  let lastPageId='';
  function animateCurrentPage(){
    const page=$('.page.active');
    if(!page||page.id===lastPageId)return;
    lastPageId=page.id;
    page.classList.remove('wk-page-motion-in');void page.offsetWidth;page.classList.add('wk-page-motion-in');
  }
  function animateDropdown(){
    const dropdown=$('#userDropdown.show');
    if(!dropdown||dropdown.dataset.wkMotionOpen==='true')return;
    dropdown.dataset.wkMotionOpen='true';
    dropdown.classList.remove('wk-dropdown-motion-in');void dropdown.offsetWidth;dropdown.classList.add('wk-dropdown-motion-in');
    setTimeout(()=>{if(!dropdown.classList.contains('show'))delete dropdown.dataset.wkMotionOpen},320);
  }

  let scheduled=0;
  function refresh(){
    clearTimeout(scheduled);
    scheduled=setTimeout(()=>{
      restoreIcons();
      addMotionArt();
      installMotionToggle();
      animateActiveStep(false);
      animateCurrentPage();
      animateDropdown();
      const dd=$('#userDropdown');
      if(dd&&!dd.classList.contains('show'))delete dd.dataset.wkMotionOpen;
    },60);
  }
  const observer=new MutationObserver(()=>refresh());
  function start(){
    restoreIcons();addMotionArt();installMotionToggle();
    const setupRoot=$('#setupModal');
    const dropdownRoot=$('#userDropdown');
    if(setupRoot) observer.observe(setupRoot,{subtree:true,childList:true});
    if(dropdownRoot) observer.observe(dropdownRoot,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','lang','data-wk-motion']});
    const modal=$('#setupModal');
    if(modal){
      let wasOpen=modal.classList.contains('show');
      if(wasOpen){delete modal.dataset.wkOpenMotionPlayed;requestAnimationFrame(animateModalOpen)}
      new MutationObserver(()=>{
        const isOpen=modal.classList.contains('show');
        if(isOpen&&!wasOpen){
          delete modal.dataset.wkOpenMotionPlayed;
          requestAnimationFrame(()=>requestAnimationFrame(animateModalOpen));
        }else if(!isOpen&&wasOpen){
          delete modal.dataset.wkOpenMotionPlayed;
          const card=$('.modal-card',modal);
          try{card?.__wkOpenAnimation?.cancel()}catch(_){}
          if(card){card.style.opacity='1';card.style.transform='none'}
        }
        wasOpen=isOpen;
      }).observe(modal,{attributes:true,attributeFilter:['class','hidden']});
    }
    [100,360,900].forEach(delay=>setTimeout(refresh,delay));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  window.__WIKARU_REVISI_9_MOTION_REPORT=()=>({
    build:'REVISI_9_MOTION_ICON',
    motion:root.dataset.wkMotion,
    materialIcons:$$('#setupMaterialGrid .wk-inline-icon').length,
    chapterIcons:$$('#setupChapterGrid .wk-inline-icon').length,
    missingIconContainers:$$('#setupModal .option-soft-icon,#setupModal .wk-category-icon').filter(node=>!$('.wk-inline-icon',node)).length,
    motionArt:Boolean($('.wk-motion-constellation')),
    externalMotionDependency:false
  });
})();

/* source-script: wk-revisi-10-motion-fix-script */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const svgShuffle='<svg class="wk-inline-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 4h4v4"></path><path d="M4 19l16-15"></path><path d="M20 16v4h-4"></path><path d="M15 15l5 5"></path><path d="M4 4l7 7"></path></svg>';
  const svgOrdered='<svg class="wk-inline-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path><path d="M4 6h.01"></path><path d="M4 12h.01"></path><path d="M4 18h.01"></path></svg>';
  function setIconOnce(node, type, markup){
    if(!node || node.dataset.wkIconType === type) return;
    node.dataset.wkIconType = type;
    node.innerHTML = markup;
  }
  function ensureShuffleIcons(){
    $$('#quizSettingsModal [data-shuffle], #setupModal [data-shuffle]').forEach(btn=>{
      const icon=$('.option-soft-icon',btn);
      const type=btn.dataset.shuffle === 'true' ? 'shuffle' : 'ordered';
      setIconOnce(icon,type,type === 'shuffle' ? svgShuffle : svgOrdered);
    });
    $$('#quizSettingsModal .step-block h3, #setupModal .step-block h3').forEach(head=>{
      if(!/urutan kartu|カード順/i.test(head.textContent||'')) return;
      setIconOnce($('.soft-step-icon',head),'shuffle-step',svgShuffle);
    });
  }
  function playFlip(el){
    if(!el) return;
    el.classList.remove('wk-flip-select');
    void el.offsetWidth;
    el.classList.add('wk-flip-select');
    clearTimeout(el.__wkFlipTimer);
    el.__wkFlipTimer = setTimeout(()=>el.classList.remove('wk-flip-select'),700);
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#quizSettingsModal [data-shuffle].option-card.icon-option, #setupModal [data-shuffle].option-card.icon-option');
    if(!btn) return;
    requestAnimationFrame(()=>playFlip(btn));
    setTimeout(ensureShuffleIcons,10);
  },true);
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ') && e.target.closest){
      const btn=e.target.closest('#quizSettingsModal [data-shuffle].option-card.icon-option, #setupModal [data-shuffle].option-card.icon-option');
      if(btn) requestAnimationFrame(()=>playFlip(btn));
    }
  },true);
  function start(){
    ensureShuffleIcons();
    [120,420,900].forEach(delay=>setTimeout(ensureShuffleIcons,delay));
    const started=performance.now();
    const releaseWhenReady=()=>{
      const modal=document.getElementById('setupModal');
      const category=document.getElementById('changeCategoryBtn');
      const ready=window.__wikaruCoreReady===true
        && typeof window.openSetup==='function'
        && modal
        && category;
      if(ready){
        if(typeof window.__wikaruReleaseLoader==='function') window.__wikaruReleaseLoader('revisi-12-core-ready');
        return;
      }
      if(performance.now()-started<9000){
        setTimeout(releaseWhenReady,120);
        return;
      }
      if(typeof window.__wikaruReleaseLoader==='function') window.__wikaruReleaseLoader('revisi-12-recovery-timeout');
    };
    releaseWhenReady();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();

/* source-script: wikaru-revisi-12-stability-runtime */
(function(){
  'use strict';
  if(window.__wikaruRevision12StabilityReady) return;
  window.__wikaruRevision12StabilityReady=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  let opening=false;
  let openingTimer=0;

  function visible(element){
    if(!element) return false;
    const style=getComputedStyle(element);
    return style.display!=='none' && style.visibility!=='hidden' && Number(style.opacity||1)>.01;
  }

  function normalizeSetupModal(){
    const modal=$('#setupModal');
    if(!modal) return false;
    modal.classList.add('show');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden','false');
    const steps=$$('#setupModal .step-block');
    if(steps.length && !steps.some(step=>step.classList.contains('active'))){
      steps.forEach((step,index)=>step.classList.toggle('active',index===0));
    }
    document.body.classList.add('modal-open');
    return visible(modal);
  }

  function finishOpening(success){
    opening=false;
    clearTimeout(openingTimer);
    $$('#homeChangeCategoryBtn,#changeCategoryBtn').forEach(button=>button.classList.remove('is-pending'));
    if(success){
      const card=$('#setupModal .modal-card');
      requestAnimationFrame(()=>card?.focus?.({preventScroll:true}));
    }
  }

  function openCategorySafely(source){
    if(opening || $('#setupModal')?.classList.contains('show')) return true;
    opening=true;
    source?.classList.add('is-pending');
    const started=performance.now();

    const attempt=()=>{
      const modal=$('#setupModal');
      const menuButton=$('#changeCategoryBtn');
      try{
        if(typeof window.openSetup==='function'){
          window.openSetup();
        }else if(typeof menuButton?.onclick==='function'){
          menuButton.onclick.call(menuButton,new MouseEvent('click',{bubbles:false,cancelable:true}));
        }
      }catch(error){
        console.error('Wikaru category recovery:',error);
      }

      if(modal?.classList.contains('show') || normalizeSetupModal()){
        finishOpening(true);
        return;
      }

      if(performance.now()-started<6500){
        openingTimer=setTimeout(attempt,90);
      }else{
        finishOpening(false);
      }
    };
    attempt();
    return true;
  }

  function bindCategoryOpeners(){
    const home=$('#homeChangeCategoryBtn');
    if(home && !home.dataset.wk12CategoryBound){
      home.dataset.wk12CategoryBound='true';
      home.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        openCategorySafely(home);
      },true);
    }

    const menu=$('#changeCategoryBtn');
    if(menu && !menu.dataset.wk12CategoryBound){
      menu.dataset.wk12CategoryBound='true';
      menu.addEventListener('click',()=>{
        setTimeout(()=>{
          if(!$('#setupModal')?.classList.contains('show')) openCategorySafely(menu);
        },40);
      },true);
    }
  }

  function repairCoreHooks(){
    bindCategoryOpeners();
    const loader=$('#loadingScreen');
    if(window.__wikaruCoreReady===true && loader && !loader.hidden){
      window.__wikaruReleaseLoader?.('revisi-12-hook-ready');
    }
  }

  function healthCheck(){
    const ids=$$('[id]').map(node=>node.id);
    const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
    const essentials=['loadingScreen','homePage','materialPage','quizPage','resultPage','setupModal','homeChangeCategoryBtn','changeCategoryBtn'];
    const missing=essentials.filter(id=>!document.getElementById(id));
    const activePages=$$('.page.active').map(page=>page.id);
    return Object.freeze({
      build:'REVISI_12_STABILITY_FULL_AUDIT',
      coreReady:window.__wikaruCoreReady===true,
      openerReady:typeof window.openSetup==='function',
      missing,
      duplicateIds:duplicates,
      activePages,
      setupVisible:$('#setupModal')?.classList.contains('show')||false,
      loaderVisible:visible($('#loadingScreen')),
      motion:document.documentElement.dataset.wkMotion||'full',
      theme:document.documentElement.dataset.theme||'light'
    });
  }

  window.__wikaruOpenCategorySafe=openCategorySafely;
  window.__WIKARU_HEALTHCHECK=healthCheck;

  document.addEventListener('wikaru:core-ready',repairCoreHooks,{once:false});
  window.addEventListener('pageshow',repairCoreHooks,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) repairCoreHooks()},{passive:true});

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',repairCoreHooks,{once:true});
  }else{
    repairCoreHooks();
  }
  [120,450,1000,2200,4500].forEach(delay=>setTimeout(repairCoreHooks,delay));
})();

/* source-script: wikaru-revisi-13-flicker-health */
(function(){
  'use strict';
  if(window.__wikaruRevision13FlickerGuardReady)return;
  window.__wikaruRevision13FlickerGuardReady=true;
  const modal=document.getElementById('setupModal');
  function stabilize(){
    if(!modal?.classList.contains('show'))return;
    const card=modal.querySelector('.modal-card');
    if(card&&!card.getAnimations().some(animation=>animation.playState==='running')){
      if(card.style.opacity!=='1')card.style.opacity='1';
      if(card.style.transform!=='none')card.style.transform='none';
    }
    modal.querySelectorAll('.step-block.active .option-card,.step-block.active .category-button,.step-block.active .choice-chip,.step-block.active .check-pill').forEach(element=>{
      if(!element.classList.contains('wk-flip-select')&&element.style.opacity!=='1')element.style.opacity='1';
    });
  }
  if(modal){
    new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(modal,{attributes:true,attributeFilter:['class','hidden']});
    modal.addEventListener('animationend',stabilize,true);
    modal.addEventListener('transitionend',stabilize,true);
  }
})();

/* source-script: wikaru-revisi-14-category-stability-runtime */
(function(){
  'use strict';
  if(window.__wikaruRevision14CategoryReady)return;
  window.__wikaruRevision14CategoryReady=true;
  const modal=document.getElementById('setupModal');
  if(!modal)return;
  let lastStep='';
  function cleanCategoryMotion(){
    modal.querySelectorAll('[data-setup-lang].wk-flip-select,[data-setup-book].wk-flip-select,[data-setup-material].wk-flip-select,[data-setup-chapter].wk-flip-select').forEach(node=>node.classList.remove('wk-flip-select'));
    const active=modal.querySelector('.step-block.active');
    if(!active)return;
    const step=active.dataset.setupStep||'';
    active.querySelectorAll('.option-card,.category-button,.choice-chip,.check-pill').forEach(node=>{
      if(!node.matches('[data-shuffle]')){
        node.style.opacity='1';
        if(!node.classList.contains('wk-card-selected'))node.style.transform='';
      }
    });
    if(step===lastStep&&active.classList.contains('wk-step-motion-in')){
      const running=active.getAnimations().some(animation=>animation.playState==='running');
      if(!running)active.classList.remove('wk-step-motion-in');
    }
    lastStep=step;
  }
  modal.addEventListener('click',event=>{
    if(event.target.closest('[data-setup-lang],[data-setup-book],[data-setup-material],[data-setup-chapter]')){
      requestAnimationFrame(cleanCategoryMotion);
      setTimeout(cleanCategoryMotion,180);
    }
  },true);
  modal.addEventListener('animationend',cleanCategoryMotion,true);
  new MutationObserver(()=>requestAnimationFrame(cleanCategoryMotion)).observe(modal,{attributes:true,attributeFilter:['class','hidden']});
  window.__WIKARU_CATEGORY_MOTION_HEALTHCHECK=()=>({
    build:'REVISI_14_CATEGORY_FLICKER_FINAL',
    open:modal.classList.contains('show'),
    activeStep:modal.querySelector('.step-block.active')?.dataset.setupStep||null,
    activeCards:modal.querySelectorAll('.step-block.active .option-card,.step-block.active .category-button').length,
    unintendedFlipCards:modal.querySelectorAll('[data-setup-lang].wk-flip-select,[data-setup-book].wk-flip-select,[data-setup-material].wk-flip-select,[data-setup-chapter].wk-flip-select').length,
    runningModalAnimations:modal.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length
  });
})();

/* source-script: wikaru-revisi-15-ui-healthcheck */
(function(){
  'use strict';
  if(window.__wikaruRevision15Ready)return;
  window.__wikaruRevision15Ready=true;
  const modal=document.getElementById('setupModal');
  function repairVisibleIcons(){
    if(!modal)return;
    modal.querySelectorAll('.option-card.active .option-soft-icon,.category-button.active .wk-category-icon').forEach(shell=>{
      shell.style.setProperty('color','#fff','important');
      shell.querySelectorAll('i,svg,svg *').forEach(node=>{
        node.style.setProperty('color','#fff','important');
        if(node instanceof SVGElement)node.style.setProperty('stroke','#fff','important');
        node.style.setProperty('opacity','1','important');
      });
    });
  }
  if(modal){
    const schedule=()=>requestAnimationFrame(repairVisibleIcons);
    modal.addEventListener('click',schedule,true);
    modal.addEventListener('change',schedule,true);
    document.addEventListener('wikaru:theme-changed',repairVisibleIcons);
    document.addEventListener('wikaru:language-changed',schedule);
    ['setupLangGrid','setupBookGrid','setupMaterialGrid','setupChapterGrid'].forEach(id=>{
      const grid=document.getElementById(id);
      if(grid)new MutationObserver(schedule).observe(grid,{childList:true,subtree:true});
    });
    setTimeout(repairVisibleIcons,120);
  }
})();

/* source-script: wikaru-e2e-i18n-guard */
(function(){
  'use strict';
  if(window.__wikaruE2EI18nGuardReady)return;
  window.__wikaruE2EI18nGuardReady=true;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  let queued=false;
  function lang(){return (document.documentElement.lang||'id').toLowerCase().startsWith('ja')?'ja':'id'}
  function setText(selector,idText,jaText){const el=$(selector);if(el){const value=lang()==='ja'?jaText:idText;if(el.textContent!==value)el.textContent=value}}
  function attr(selector,name,idText,jaText){const el=$(selector);if(el){const value=lang()==='ja'?jaText:idText;if(el.getAttribute(name)!==value)el.setAttribute(name,value)}}
  function sync(){
    queued=false;
    const ja=lang()==='ja';
    setText('#adminDropBtn span','Panel Pengelola','管理パネル');
    setText('#pdfFilterTitle','Filter Sebelum Simpan PDF','PDF保存前のフィルター');
    setText('#pdfFilterDesc','Pilih kategori hasil latihan yang ingin dimasukkan ke PDF.','PDFに含める学習結果のカテゴリーを選択してください。');
    setText('#pdfCancelText','Batal','キャンセル');
    setText('#pdfResetText','Reset Filter','フィルターをリセット');
    setText('#pdfSaveText','Simpan PDF','PDFを保存');
    const pdfLabels={
      pdfBookLabel:['Buku','教科書'],pdfMaterialLabel:['Kategori Materi','教材カテゴリー'],pdfChapterLabel:['Bab','章'],
      pdfSectionLabel:['Bagian','セクション'],pdfTypeLabel:['Jenis Kata','品詞'],pdfStatusLabel:['Status Jawaban','回答状況']
    };
    Object.entries(pdfLabels).forEach(([id,pair])=>{const el=document.getElementById(id);if(!el)return;const icon=el.querySelector('i')?.outerHTML||'';const value=pair[ja?1:0];if(el.textContent.trim()!==value)el.innerHTML=icon+value});
    attr('#closePdfFilter','aria-label','Tutup','閉じる');
    attr('#closeExample','aria-label','Tutup','閉じる');
    attr('#closeDetail','aria-label','Tutup','閉じる');
    attr('#closeImage','aria-label','Tutup pratinjau','プレビューを閉じる');
    attr('#imageModal .image-preview-card','aria-label','Pratinjau gambar','画像プレビュー');
    attr('#exampleVocabSpeakBtn','title','Dengarkan kosakata','単語を聞く');
    attr('#exampleVocabSpeakBtn','aria-label','Dengarkan kosakata','単語を聞く');
    attr('#exampleSpeakBtn','title','Dengarkan contoh kalimat','例文を聞く');
    attr('#exampleSpeakBtn','aria-label','Dengarkan contoh kalimat','例文を聞く');
    attr('#cancelPdfFilter','aria-label','Batal','キャンセル');
    attr('#resetPdfFilterBtn','aria-label','Reset Filter','フィルターをリセット');
    attr('#saveFilteredPdf','aria-label','Simpan PDF','PDFを保存');
    ['#closeSetup','#closeQuizSettings','#closeLogin'].forEach(selector=>attr(selector,'aria-label','Tutup dialog','ダイアログを閉じる'));
    $$('.close-x').forEach(button=>{if(button.id==='closeImage')return;const value=ja?'ダイアログを閉じる':'Tutup dialog';if(button.getAttribute('aria-label')!==value)button.setAttribute('aria-label',value)});
    $$('[data-close-verb-quiz],[data-close-number-settings],[data-close-marker-settings],[data-close-duration-settings],.verb-quiz-close,.wk-sheet-close').forEach(button=>button.setAttribute('aria-label',ja?'閉じる':'Tutup'));
    setText('#wkFilterTitle','Filter materi','教材フィルター');
    const mobilePageTitle=$('.wk-mobile-page-title');if(mobilePageTitle){const active=$('.page.active')?.id?.replace(/Page$/,'')||'home';const map=ja?{home:'Wikaru',material:'教材',quiz:'学習',result:'学習結果',admin:'参加者レポート'}:{home:'Wikaru',material:'Materi',quiz:'Latihan',result:'Hasil Belajar',admin:'Laporan Peserta'};mobilePageTitle.textContent=active==='material'?($('#materialPage .content-card > h2')?.textContent?.trim()||map.material):active==='result'?($('#resultPage h2')?.textContent?.trim()||map.result):active==='admin'?($('#adminPage h2')?.textContent?.trim()||map.admin):(map[active]||'Wikaru')}
    const segments=$('.wk-material-segments');if(segments){segments.setAttribute('aria-label',ja?'教材カテゴリーのショートカット':'Kategori materi cepat');const map={all:ja?'すべて':'Semua',Kosakata:ja?'語彙':'Kosakata',Percakapan:ja?'会話':'Percakapan'};$$('[data-wk-section]',segments).forEach(button=>{const value=map[button.dataset.wkSection];if(value)button.textContent=value})}
    attr('#wkMaterialFilterBtn','aria-label','Buka filter materi','教材フィルターを開く');
    const sectionFilterLabel=$('#wkSectionField label');if(sectionFilterLabel)sectionFilterLabel.textContent=ja?'教材カテゴリー':'Kategori materi';
    const typeFilterLabel=$('#wkTypeField label');if(typeFilterLabel)typeFilterLabel.textContent=ja?'品詞':'Jenis kata';
    setText('#wkResetFilter','Reset','リセット');
    setText('#wkApplyFilter','Tampilkan hasil','結果を表示');
    attr('#wkQuizExit','aria-label','Keluar dari kuis','クイズを終了');
    attr('#wkQuizSettings','aria-label','Petunjuk kuis','クイズガイド');
    attr('.wk-quiz-head-progress','aria-label','Progres kuis','クイズの進捗');
    const translateQuizMeta=(value)=>String(value||'').split('•').map(part=>{const text=part.trim();if(ja){const chapter=text.match(/^Bab\s*(\d+)$/i);if(chapter)return `第${chapter[1]}課`;return {'Kosakata':'語彙','Kata Benda':'名詞','Kata Kerja':'動詞','Kata Sifat-i':'い形容詞','Kata Sifat-na':'な形容詞','Percakapan':'会話'}[text]||text}const chapter=text.match(/^第(\d+)課$/);if(chapter)return `Bab ${chapter[1]}`;return {'語彙':'Kosakata','名詞':'Kata Benda','動詞':'Kata Kerja','い形容詞':'Kata Sifat-i','な形容詞':'Kata Sifat-na','会話':'Percakapan'}[text]||text}).join(' • ');
    const quizLabel=$('#quizLabel');if(quizLabel)quizLabel.textContent=translateQuizMeta(quizLabel.textContent);
    const quizTitle=$('#wkQuizTitle');if(quizTitle){const raw=quizTitle.textContent.trim();quizTitle.textContent=/^(Kuis Kosakata|Latihan Kosakata|語彙練習|語彙クイズ)$/.test(raw)?(ja?'語彙クイズ':'Kuis Kosakata'):translateQuizMeta(raw)}
    const quizSubtitle=$('#wkQuizSubtitle');if(quizSubtitle)quizSubtitle.textContent=ja?'最も適切な答えを選びましょう':'Pilih jawaban yang paling tepat';
    ['#cardCounter','#wkQuizCounter'].forEach(selector=>{const counter=$(selector);if(!counter)return;const match=counter.textContent.match(/(\d+)\s*\/\s*(\d+)/);if(match)counter.textContent=(ja?'カード ':'Kartu ')+match[1]+' / '+match[2]});
    const progressText=$('#progressText');if(progressText){const pct=progressText.textContent.match(/(\d+)%/);if(pct)progressText.textContent=pct[1]+'% '+(ja?'完了':'Selesai')}
    const flipHint=$('#flipHint');if(flipHint&&(/Klik kartu/i.test(flipHint.textContent)||/カードをクリック/.test(flipHint.textContent)))flipHint.textContent=ja?'カードをクリックして答えを表示':'Klik kartu untuk melihat jawaban';
    attr('#voicePresetSelect','aria-label','Pilih karakter suara Jepang','日本語の声を選ぶ');
    const homeResult=$('#homeResultBtn');if(homeResult){let role='';try{role=JSON.parse(localStorage.getItem('minna_bab23_progress')||'null')?.role||''}catch(_){ }homeResult.title=ja?(role==='admin'?'参加者全体の進捗を開く':'学習の進捗を開く'):(role==='admin'?'Buka progres seluruh peserta':'Buka progres belajar')}
    const targetAction=$('#homeTargetActionLabel')?.closest('button');if(targetAction){const value=$('#homeTargetActionLabel')?.textContent?.trim()||(ja?'今日の学習を始める':'Mulai sekarang');targetAction.setAttribute('aria-label',value)}
    const navs=['#prevSetupStep','#nextSetupStep','#prevQuizSetting','#nextQuizSetting'];
    navs.forEach(selector=>{const el=$(selector);if(el&&el.textContent.trim())el.setAttribute('aria-label',el.textContent.trim())});
    const dailySpeech=$('#homeDailySpeechBtn');if(dailySpeech)dailySpeech.setAttribute('aria-label',ja?'発音練習':'Latihan bicara');
    $$('#homePage .home-quick-item').forEach(button=>{const title=button.querySelector('strong')?.textContent.trim()||'';const desc=button.querySelector('small')?.textContent.trim()||'';if(title||desc)button.setAttribute('aria-label',[title,desc].filter(Boolean).join(' — '))});
    const recommendation=$('#homeRecommendationBtn');if(recommendation)recommendation.setAttribute('aria-label',$('#homeRecommendationAction')?.textContent.trim()||(ja?'学習を始める':'Mulai latihan'));
    const motion=$('#motionToggle');if(motion){const full=document.documentElement.dataset.wkMotion!=='reduced';setText('#motionToggle .wk-motion-label','Animasi Antarmuka','画面アニメーション');setText('#motionToggle .wk-motion-state',full?'Aktif':'Ringan',full?'有効':'軽量');motion.title=ja?(full?'アニメーションは有効です。クリックすると軽量モードになります。':'軽量モードです。クリックするとアニメーションを有効にします。'):(full?'Animasi aktif — klik untuk mode ringan':'Animasi ringan — klik untuk mengaktifkan penuh')}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-wk-motion']});
  document.addEventListener('click',()=>{schedule();setTimeout(schedule,90);setTimeout(schedule,360)},true);
  window.addEventListener('pageshow',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  [120,500,1400].forEach(delay=>setTimeout(schedule,delay));
  window.__wikaruSyncE2EUiText=sync;
})();

/* source-script: wikaru-layout-tidy-runtime-v2 */
(function(){
  if(window.__wikaruLayoutTidyV2) return;
  window.__wikaruLayoutTidyV2 = true;
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  let scheduled = false;

  function applyQdirLayout(){
    $$('#quizSettingsModal .option-card.icon-option[data-qdir]').forEach(card=>{
      card.style.display = 'grid';
      card.style.gridTemplateColumns = '60px minmax(0,1fr)';
      card.style.alignItems = 'center';
      card.style.gap = '14px';
      card.style.minHeight = '132px';
      const icon = $('.option-soft-icon', card);
      if(icon){
        icon.style.width = '56px';
        icon.style.height = '56px';
        icon.style.minWidth = '56px';
        icon.style.maxWidth = '56px';
        icon.style.margin = '0';
        icon.style.alignSelf = 'center';
        icon.style.justifySelf = 'center';
      }
      const box = $(':scope > div', card);
      if(box){
        box.style.display = 'flex';
        box.style.flexDirection = 'column';
        box.style.alignItems = 'flex-start';
        box.style.justifyContent = 'center';
        box.style.gap = '4px';
        box.style.height = 'auto';
      }
      const label = $('.qdir-label', card);
      if(label){
        label.style.margin = '0';
        label.style.lineHeight = '1.22';
      }
      const note = $('.qdir-note', card);
      if(note){
        note.style.margin = '0';
        note.style.minHeight = '0';
        note.style.lineHeight = '1.34';
      }
      const flow = $('.wk-script-flow', card);
      if(flow){
        flow.style.marginTop = '8px';
        flow.style.paddingTop = '0';
        flow.style.display = 'flex';
        flow.style.flexWrap = 'wrap';
        flow.style.alignItems = 'center';
        flow.style.gap = '6px';
      }
    });
  }

  function applySpeechLayout(){
    const card = $('#micBox');
    if(!card) return;
    card.style.display = 'grid';
    card.style.gridTemplateColumns = '44px minmax(0,1fr) auto';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.padding = '14px 16px';
    const icon = $('.mic-icon', card);
    if(icon){
      icon.style.width = '40px';
      icon.style.height = '40px';
      icon.style.margin = '0';
      icon.style.display = 'grid';
      icon.style.placeItems = 'center';
    }
    const copy = $('.mic-copy', card);
    if(copy){
      copy.style.display = 'flex';
      copy.style.flexDirection = 'column';
      copy.style.justifyContent = 'center';
      copy.style.alignItems = 'flex-start';
      copy.style.gap = '3px';
    }
    const strong = $('strong', copy || card);
    if(strong){
      strong.style.margin = '0';
      strong.style.lineHeight = '1.15';
    }
    const p = $('#speechHelp', card) || $('p', copy || card);
    if(p){
      p.style.margin = '0';
      p.style.lineHeight = '1.32';
      p.style.display = 'block';
    }
    const sw = $('#micSwitch', card);
    if(sw){
      sw.style.marginLeft = 'auto';
      sw.style.alignSelf = 'center';
      sw.style.justifySelf = 'end';
    }
  }

  function run(){
    scheduled = false;
    applyQdirLayout();
    applySpeechLayout();
  }
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
  const modal = document.getElementById('quizSettingsModal');
  if(modal){
    new MutationObserver(schedule).observe(modal, {subtree:true, childList:true, attributes:true, attributeFilter:['class','style']});
  }
  const mic = document.getElementById('micBox');
  if(mic){
    new MutationObserver(schedule).observe(mic, {subtree:true, childList:true, attributes:true, attributeFilter:['class','style']});
  }
  window.addEventListener('resize', schedule);
  [100, 500, 1200, 2200].forEach(ms => setTimeout(schedule, ms));
})();

/* source-script: wikaru-all-category-layout-guard */
(function(){
  'use strict';
  if(window.__wikaruAllCategoryLayoutGuard)return;
  window.__wikaruAllCategoryLayoutGuard=true;
  const MODES={
    number:{className:'number-quiz-active',panelId:'numberQuizPanel',chapter:'I. Kata Bilangan'},
    marker:{className:'marker-quiz-active',panelId:'markerQuizPanel',chapter:'Penanda Waktu'},
    duration:{className:'duration-quiz-active',panelId:'durationQuizPanel',chapter:'III. Ungkapan Waktu'},
    counter:{className:'counter-quiz-active',panelId:'counterQuizPanel',chapter:'IV. Kata Bantu Bilangan'}
  };
  let queued=false,running=false;
  const $=(s,r=document)=>r.querySelector(s);
  function chapter(){
    try{if(typeof state!=='undefined'&&state?.setup?.chapter)return String(state.setup.chapter);}catch(_){ }
    const active=$('#setupChapterGrid [data-setup-chapter].active');
    if(active?.dataset?.setupChapter)return String(active.dataset.setupChapter);
    const text=`${$('#activeChoiceText')?.textContent||''} ${$('#resultActiveChoice')?.textContent||''}`;
    return Object.values(MODES).find(meta=>text.includes(meta.chapter))?.chapter||'';
  }
  function setDisplay(node,value){
    if(!node)return;
    if(node.style.getPropertyValue('display')!==value||node.style.getPropertyPriority('display')!=='important')node.style.setProperty('display',value,'important');
  }
  function reconcile(){
    queued=false;if(running)return;running=true;
    try{
      const selected=chapter();
      const present=Object.entries(MODES).filter(([,meta])=>document.body.classList.contains(meta.className));
      let keep='';
      if(present.length){
        keep=present.find(([,meta])=>meta.chapter===selected)?.[0]||present[present.length-1][0];
        present.forEach(([key,meta])=>{if(key!==keep)document.body.classList.remove(meta.className);});
      }
      Object.entries(MODES).forEach(([key,meta])=>{
        const panel=document.getElementById(meta.panelId);
        if(!panel)return;
        const visible=key===keep&&$('#quizPage')?.classList.contains('active');
        panel.hidden=!visible;
        panel.setAttribute('aria-hidden',String(!visible));
        setDisplay(panel,visible?'block':'none');
      });
      const grid=$('#quizPage>.quiz-grid');
      const wrap=$('#quizPage>.quiz-grid>.quiz-card-wrap');
      const control=$('#quizPage>.quiz-grid>.control-panel');
      const flash=wrap?.querySelector(':scope>.flashcard');
      const special=Boolean(keep);
      if(!special){
        if(wrap){wrap.hidden=false;wrap.setAttribute('aria-hidden','false');setDisplay(wrap,'flex');}
        if(control){control.hidden=false;control.setAttribute('aria-hidden','false');setDisplay(control,'flex');}
        if(flash){flash.hidden=false;flash.setAttribute('aria-hidden','false');setDisplay(flash,'block');}
      }else if(keep==='counter'){
        if(wrap){wrap.hidden=true;wrap.setAttribute('aria-hidden','true');setDisplay(wrap,'none');}
        if(control){control.hidden=true;control.setAttribute('aria-hidden','true');setDisplay(control,'none');}
        if(flash){flash.hidden=true;flash.setAttribute('aria-hidden','true');setDisplay(flash,'none');}
      }else{
        if(wrap){wrap.hidden=false;wrap.setAttribute('aria-hidden','false');setDisplay(wrap,'block');}
        if(control){control.hidden=true;control.setAttribute('aria-hidden','true');setDisplay(control,'none');}
        if(flash){flash.hidden=true;flash.setAttribute('aria-hidden','true');setDisplay(flash,'none');}
      }
      if(grid&&special){grid.style.setProperty('display','block','important');}
    }finally{running=false;}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(reconcile);}
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  document.addEventListener('click',()=>{schedule();setTimeout(schedule,80);setTimeout(schedule,280);},true);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('resize',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  [120,500,1400].forEach(delay=>setTimeout(schedule,delay));
  window.__wikaruReconcileAllQuizLayouts=reconcile;
})();

/* source-script: wikaru-speech-switch-runtime */
(function(){
  if(window.__wikaruSpeechSwitchPolished) return;
  window.__wikaruSpeechSwitchPolished = true;
  const sync = ()=>{
    const btn = document.getElementById('micSwitch');
    if(!btn) return;
    const on = btn.classList.contains('on');
    const ja = (document.documentElement.lang || '').toLowerCase().startsWith('ja');
    btn.setAttribute('aria-label', ja ? (on ? '音声入力をオフにする' : '音声入力をオンにする') : (on ? 'Nonaktifkan fungsi bicara' : 'Aktifkan fungsi bicara'));
    btn.setAttribute('title', ja ? (on ? '音声入力：オン' : '音声入力：オフ') : (on ? 'Fungsi bicara: aktif' : 'Fungsi bicara: nonaktif'));
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, {once:true}); else sync();
  const mic = document.getElementById('micSwitch');
  if(mic){ new MutationObserver(sync).observe(mic,{attributes:true,attributeFilter:['class']}); }
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  [100,400,1200].forEach(ms=>setTimeout(sync,ms));
})();

/* source-script: wikaru-copywriting-seragam-v1 */
(function(){
  'use strict';
  if(window.__wikaruCopywritingSeragamV1)return;
  window.__wikaruCopywritingSeragamV1=true;

  const CATEGORY={
    'Materi Umum':{
      label:'Materi Umum',
      setup:'Berisi kosakata utama setiap bab, lengkap dengan gambar, cara baca, contoh kalimat, catatan, dan latihan.',
      materialTitle:'Jelajahi Materi Umum',
      materialDesc:'Pelajari kosakata utama, cara baca, arti, contoh penggunaan, dan pelafalan pada bab yang dipilih.',
      studyTitle:'Pahami kosakata sebelum berlatih',
      studyDesc:'Buka setiap kartu, dengarkan pelafalannya, lalu pelajari contoh kalimat dan catatan penggunaannya.',
      quizTitle:'Latihan Materi Umum',
      quizDesc:'Soal diambil dari bab, bagian materi, dan jenis kata yang dipilih agar latihan tetap terarah.',
      search:'Cari kosakata, kanji, kana, romaji, atau arti...',
      allSection:'Semua Bagian Materi',
      allType:'Semua Jenis Kata',
      emptyTitle:'Kosakata tidak ditemukan',
      emptyDesc:'Coba ubah kata kunci atau filter materi.',
      quickMaterial:'Buka materi umum yang dipilih'
    },
    'Kata-Kata Referensi dan Informasi':{
      label:'Kata-Kata Referensi dan Informasi',
      setup:'Berisi kosakata tambahan, informasi praktis, dan konteks budaya yang mendukung pemahaman setiap bab.',
      materialTitle:'Jelajahi Referensi dan Informasi',
      materialDesc:'Pelajari kosakata tambahan, istilah praktis, dan informasi pendukung yang berkaitan dengan bab yang dipilih.',
      studyTitle:'Pahami konteks sebelum berlatih',
      studyDesc:'Buka setiap materi, perhatikan gambar atau tabel, lalu baca penjelasan dan contoh penggunaannya.',
      quizTitle:'Latihan Referensi dan Informasi',
      quizDesc:'Soal diambil dari topik dan materi pendukung pada bab yang dipilih agar latihan tetap relevan.',
      search:'Cari kosakata, istilah, romaji, arti, atau informasi...',
      allSection:'Semua Topik',
      allType:'Semua Jenis Kata',
      emptyTitle:'Materi tidak ditemukan',
      emptyDesc:'Coba ubah kata kunci atau filter topik.',
      quickMaterial:'Buka referensi dan informasi yang dipilih'
    },
    'Daftar Lampiran':{
      label:'Daftar Lampiran',
      setup:'Berisi tabel interaktif dan latihan tematik untuk angka, waktu, kata bantu bilangan, serta konjugasi kata kerja.',
      materialTitle:'Jelajahi Daftar Lampiran',
      materialDesc:'Gunakan tabel interaktif dan latihan tematik untuk mempelajari angka, waktu, kata bantu bilangan, serta konjugasi kata kerja.',
      studyTitle:'Pahami pola sebelum berlatih',
      studyDesc:'Baca penjelasan, dengarkan contoh, lalu gunakan tabel atau latihan untuk memahami polanya.',
      quizTitle:'Latihan Lampiran Pilihan',
      quizDesc:'Soal diambil dari lampiran dan cakupan yang dipilih agar latihan tetap terarah.',
      search:'Cari materi, pola, cara baca, atau arti...',
      allSection:'Semua Bagian Lampiran',
      allType:'Semua Jenis Materi',
      emptyTitle:'Materi lampiran tidak ditemukan',
      emptyDesc:'Coba ubah kata kunci atau pilihan lampiran.',
      quickMaterial:'Buka lampiran yang dipilih'
    }
  };

  const CATEGORY_VARIANTS_TEST=/Kata-kata referensi dan Informasi|Kata-kata Referensi dan Informasi|Kata-Kata referensi dan Informasi/;
  const CATEGORY_VARIANTS_REPLACE=/Kata-kata referensi dan Informasi|Kata-kata Referensi dan Informasi|Kata-Kata referensi dan Informasi/g;
  const SPECIAL_APPENDIX_CLASSES=['marker-appendix-active','duration-appendix-active','counter-appendix-active','time-appendix-active','verb-appendix-active'];
  let queued=false;

  function canonical(value){
    const text=String(value||'').trim();
    if(text.toLowerCase()==='kata-kata referensi dan informasi')return 'Kata-Kata Referensi dan Informasi';
    if(text.toLowerCase()==='daftar lampiran')return 'Daftar Lampiran';
    return text==='Materi Umum'?'Materi Umum':text;
  }
  function storedCategory(){
    try{
      const saved=JSON.parse(localStorage.getItem('minna_bab23_settings')||'null');
      return canonical(saved?.materialCategory||'');
    }catch(_){return '';}
  }
  function activeCategory(){
    const activeSetup=document.querySelector('#setupModal.show [data-setup-material].active');
    if(activeSetup)return canonical(activeSetup.dataset.setupMaterial);
    if(SPECIAL_APPENDIX_CLASSES.some(name=>document.body.classList.contains(name)))return 'Daftar Lampiran';
    const home=canonical(document.getElementById('homeActiveCategory')?.textContent);
    if(CATEGORY[home])return home;
    const stored=storedCategory();
    return CATEGORY[stored]?stored:'Materi Umum';
  }
  function setText(node,text){
    if(node&&typeof text==='string'&&node.textContent!==text)node.textContent=text;
  }
  function setAttr(node,name,value){
    if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
  }
  function setDirectLabel(copy,label){
    if(!copy)return;
    const textNode=Array.from(copy.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
    if(textNode){
      if(textNode.textContent.trim()!==label)textNode.textContent=label;
      return;
    }
    const strong=copy.querySelector(':scope > strong');
    if(strong)setText(strong,label);
  }
  function normalizeVisibleCategoryNames(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style,textarea'))return NodeFilter.FILTER_REJECT;
      return CATEGORY_VARIANTS_TEST.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.nodeValue=node.nodeValue.replace(CATEGORY_VARIANTS_REPLACE,'Kata-Kata Referensi dan Informasi');});
    root.querySelectorAll?.('[title],[aria-label]').forEach(node=>{
      ['title','aria-label'].forEach(attr=>{
        const value=node.getAttribute(attr); if(!value)return;
        const next=value.replace(CATEGORY_VARIANTS_REPLACE,'Kata-Kata Referensi dan Informasi');
        if(next!==value)node.setAttribute(attr,next);
      });
    });
  }
  function patchSetup(){
    const setup=document.getElementById('setupModal');
    if(!setup)return;
    setText(setup.querySelector('.modal-title h2'),'Atur Jalur Belajar');
    setText(setup.querySelector('.modal-title p'),'Pilih bahasa, buku, kategori materi, dan bab yang ingin dipelajari. Semua pilihan dapat diubah kapan saja.');
    const headings=setup.querySelectorAll('.step-block h3');
    const headingMeta=[
      ['fa-language','1. Pilih bahasa antarmuka'],
      ['fa-book-open','2. Pilih buku utama'],
      ['fa-layer-group','3. Pilih kategori materi'],
      ['fa-bookmark','4. Pilih bab atau lampiran']
    ];
    headingMeta.forEach(([icon,copy],index)=>{
      const heading=headings[index]; if(!heading)return;
      const target=heading.querySelector('span:last-child');
      if(target)setText(target,copy);
      else heading.innerHTML=`<span class="soft-step-icon"><i class="fa-solid ${icon}"></i></span><span>${copy}</span>`;
    });
    setup.querySelectorAll('[data-setup-material]').forEach(card=>{
      const key=canonical(card.dataset.setupMaterial);
      const profile=CATEGORY[key]; if(!profile)return;
      const copy=card.querySelector(':scope > div:not(.option-soft-icon), .wk-card-copy');
      setDirectLabel(copy,profile.label);
      setText(copy?.querySelector('small'),profile.setup);
      setAttr(card,'title',profile.setup);
    });
    setText(document.getElementById('nextSetupStep'),'Lanjutkan');
    const save=document.getElementById('saveSetup');
    if(save)setText(save.querySelector('span')||save,'Terapkan Pilihan');
  }
  function patchHome(profile){
    setText(document.getElementById('homeActiveCategory'),profile.label);
    const change=document.getElementById('homeChangeCategoryBtn');
    setText(change?.querySelector('span'),'Ganti Materi Belajar');
    setAttr(change,'aria-label','Ganti materi belajar');
    setText(document.getElementById('homeQuickMaterialCopy'),profile.quickMaterial);
    setText(document.getElementById('homeQuickFlashCopy'),'Latihan dengan kartu interaktif');
    setText(document.getElementById('homeQuickSpeechCopy'),'Ucapkan jawaban dan periksa pelafalan');
    setText(document.getElementById('homeQuickResultCopy'),'Tinjau skor dan jawaban sebelumnya');
    ['activeChoiceText','resultActiveChoice'].forEach(id=>{
      const node=document.getElementById(id); if(!node)return;
      let text=node.textContent.replace(CATEGORY_VARIANTS_REPLACE,'Kata-Kata Referensi dan Informasi');
      text=text.replace(/^Pilihan aktif\s*:/i,'Materi yang dipilih:');
      if(text!==node.textContent)node.textContent=text;
    });
  }
  function patchMaterial(profile,key){
    const homeChapter=String(document.getElementById('homeActiveChapter')?.textContent||'');
    const activeChoice=String(document.getElementById('activeChoiceText')?.textContent||'');
    const bab42OfficeReference=key==='Kata-Kata Referensi dan Informasi'
      && /Bab\s*42/i.test(homeChapter)
      && /Perlengkapan Kantor|事務用品・道具/.test(homeChapter+' '+activeChoice);
    const bab43CharacterReference=key==='Kata-Kata Referensi dan Informasi'
      && /Bab\s*43/i.test(homeChapter)
      && /Karakter|Sifat|性格|性質/.test(homeChapter+' '+activeChoice);
    const special=(key==='Daftar Lampiran'&&SPECIAL_APPENDIX_CLASSES.some(name=>document.body.classList.contains(name))) || document.body.classList.contains('weather-reference-active') || document.body.classList.contains('postal50-reference-active') || bab42OfficeReference || bab43CharacterReference;
    if(!special){
      setText(document.querySelector('[data-i18n="materialTitle"]'),profile.materialTitle);
      setText(document.querySelector('[data-i18n="materialDesc"]'),profile.materialDesc);
      setText(document.querySelector('[data-i18n="studyFirst"]'),profile.studyTitle);
      setText(document.querySelector('[data-i18n="studyFirstDesc"]'),profile.studyDesc);
      const search=document.getElementById('materialSearch');
      if(search)setAttr(search,'placeholder',profile.search);
      setText(document.querySelector('#materialSectionFilter option[value="all"]'),profile.allSection);
      setText(document.querySelector('#materialTypeFilter option[value="all"]'),profile.allType);
    }
    document.querySelectorAll('.empty').forEach(box=>{
      const heading=box.querySelector('h3');
      const paragraph=box.querySelector('p');
      if(heading&&/tidak ditemukan/i.test(heading.textContent||''))setText(heading,profile.emptyTitle);
      if(paragraph&&/(ubah|filter|pencarian)/i.test(paragraph.textContent||''))setText(paragraph,profile.emptyDesc);
    });
  }
  function patchQuiz(profile){
    setText(document.querySelector('[data-i18n="quizFiltered"]'),profile.quizTitle);
    setText(document.querySelector('[data-i18n="quizFilteredDesc"]'),profile.quizDesc);
    const modal=document.getElementById('quizSettingsModal');
    if(modal){
      setText(modal.querySelector('.modal-title h2'),'Atur Sesi Latihan');
      setText(modal.querySelector('.modal-title p'),'Tentukan arah soal, urutan kartu, dan cakupan materi sebelum latihan dimulai.');
      setText(modal.querySelector('[data-i18n="chooseDirection"]'),'1. Pilih arah bahasa soal');
      setText(modal.querySelector('[data-i18n="shuffleStepTitle"]'),'2. Pilih urutan kartu');
      setText(modal.querySelector('[data-i18n="chapterScopeStep"]'),'3A. Pilih bab');
      setText(modal.querySelector('[data-i18n="sectionScopeStep"]'),'3B. Pilih bagian materi');
      setText(modal.querySelector('[data-i18n="typeScopeStep"]'),'3C. Pilih jenis kata');
      setText(modal.querySelector('[data-i18n="chapterCategory"]'),'Bab');
      setText(modal.querySelector('[data-i18n="sectionCategory"]'),'Bagian Materi');
      setText(modal.querySelector('[data-i18n="typeCategory"]'),'Jenis Kata');
      setText(document.getElementById('nextQuizSetting'),'Lanjutkan');
      setText(document.getElementById('startQuizFromSettings'),'Terapkan dan Mulai Latihan');
      setText(document.getElementById('quizFilterMessage'),'Tidak ada materi yang sesuai dengan filter ini.');
      modal.querySelectorAll('[data-shuffle="true"] .qstatic-note').forEach(node=>setText(node,'Urutan kartu diacak setiap latihan dimulai.'));
    }
    setText(document.getElementById('speechHelp'),'Aktifkan mikrofon untuk menjawab dengan suara.');
    const flipHint=document.getElementById('flipHint');
    if(flipHint&&!document.body.classList.contains('time-distinct-quiz-active'))setText(flipHint,'Klik kartu untuk melihat jawaban dan penjelasan.');
    document.querySelectorAll('[data-duration-open-quiz]').forEach(button=>{
      const label=Array.from(button.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
      if(label&&label.textContent.trim()!=='Mulai Latihan Durasi')label.textContent=' Mulai Latihan Durasi';
    });
    document.querySelectorAll('[data-marker-open-quiz]').forEach(button=>{
      const label=Array.from(button.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
      if(label&&label.textContent.trim()!=='Mulai Latihan Penanda Waktu')label.textContent=' Mulai Latihan Penanda Waktu';
    });
    document.querySelectorAll('.counter-hero-quiz strong').forEach(node=>setText(node,'Mulai Latihan Kata Bantu Bilangan'));
    document.querySelectorAll('.counter-hero-quiz small').forEach(node=>setText(node,'Pilih flashcard atau latihan kalimat rumpang.'));
  }
  function patchResults(){
    setText(document.querySelector('[data-i18n="resultTitle"]'),'Ringkasan Latihan');
    const active=document.getElementById('resultActiveChoice');
    if(active){
      let text=active.textContent.replace(CATEGORY_VARIANTS_REPLACE,'Kata-Kata Referensi dan Informasi');
      text=text.replace(/^Pilihan aktif\s*:/i,'Materi yang dipilih:');
      if(text!==active.textContent)active.textContent=text;
    }
  }
  function apply(){
    queued=false;
    if((document.documentElement.lang||'id').toLowerCase().startsWith('ja'))return;
    const key=activeCategory();
    const profile=CATEGORY[key]||CATEGORY['Materi Umum'];
    normalizeVisibleCategoryNames();
    patchSetup();
    patchHome(profile);
    patchMaterial(profile,key);
    patchQuiz(profile);
    patchResults();
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(apply);
  }
  window.__wikaruUnifiedCopySchedule=schedule;
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-setup-material],[data-setup-book],[data-setup-chapter],[data-page],#saveSetup,#nextSetupStep,#prevSetupStep,#changeCategoryBtn,#homeChangeCategoryBtn,[data-action="openQuizSettings"],#startQuizFromSettings')){
      [0,70,180,420,900].forEach(delay=>setTimeout(schedule,delay));
    }
  },true);
  document.addEventListener('change',schedule,true);
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-hidden']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  window.addEventListener('pageshow',schedule);
  [120,500,1200,2400].forEach(delay=>setTimeout(schedule,delay));
})();

/* source-script: wikaru-transitivity-categories-v3 */
(function(){
  'use strict';
  const TRANSITIVITY_BY_ID={"mni-b4-001":"Intransitif","mni-b4-002":"Intransitif","mni-b4-003":"Intransitif","mni-b4-004":"Intransitif","mni-b4-005":"Transitif","mni-b4-006":"Intransitif","mni-b5-001":"Intransitif","mni-b5-002":"Intransitif","mni-b5-003":"Intransitif","mni-b6-001":"Transitif","mni-b6-002":"Transitif","mni-b6-003":"Transitif","mni-b6-004":"Transitif","mni-b6-005":"Transitif","mni-b6-006":"Transitif","mni-b6-007":"Transitif","mni-b6-008":"Transitif","mni-b6-009":"Transitif","mni-b6-010":"Transitif","mni-b6-011":"Intransitif","mni-b7-001":"Transitif","mni-b7-002":"Transitif","mni-b7-003":"Transitif","mni-b7-004":"Transitif","mni-b7-005":"Transitif","mni-b7-006":"Transitif","mni-b7-007":"Transitif","mni-b7-008":"Transitif","mni-b7-009":"Transitif","mni-b9-001":"Intransitif","mni-b9-002":"Intransitif","mni-b13-001":"Intransitif","mni-b13-002":"Intransitif","mni-b13-003":"Transitif","mni-b13-004":"Intransitif","mni-b13-005":"Intransitif","mni-b13-006":"Intransitif","mni-b13-007":"Intransitif","mni-b13-008":"Intransitif","mni-b13-009":"Intransitif","mni-b14-001":"Transitif","mni-b14-002":"Transitif","mni-b14-003":"Transitif","mni-b14-004":"Transitif","mni-b14-005":"Intransitif","mni-b14-006":"Transitif","mni-b14-007":"Transitif","mni-b14-008":"Transitif","mni-b14-009":"Transitif","mni-b14-010":"Transitif","mni-b14-011":"Transitif","mni-b14-012":"Transitif","mni-b14-013":"Transitif","mni-b14-014":"Transitif","mni-b14-015":"Transitif","mni-b14-016":"Intransitif","mni-b14-017":"Intransitif","mni-b14-018":"Intransitif","mni-b14-019":"Intransitif","mni-b14-020":"Intransitif","mni-b14-021":"Transitif","mni-b15-001":"Transitif","mni-b15-002":"Transitif","mni-b15-003":"Transitif","mni-b15-004":"Transitif","mni-b15-005":"Intransitif","mni-b15-006":"Transitif","mni-b15-021":"Transitif","mni-b16-001":"Intransitif","mni-b16-002":"Intransitif","mni-b16-003":"Intransitif","mni-b16-004":"Intransitif","mni-b16-005":"Intransitif","mni-b16-006":"Transitif","mni-b16-007":"Transitif","mni-b16-008":"Transitif","mni-b16-009":"Transitif","mni-b16-010":"Transitif","mni-b16-011":"Transitif","mni-b16-012":"Intransitif","mni-b16-013":"Intransitif","mni-b16-014":"Intransitif","mni-b16-015":"Intransitif","mni-b16-016":"Transitif","mni-b16-017":"Transitif","mni-b16-018":"Transitif","mni-b16-019":"Transitif","mni-b16-020":"Intransitif","mni-b17-001":"Transitif","mni-b17-002":"Transitif","mni-b17-003":"Transitif","mni-b17-004":"Transitif","mni-b17-005":"Transitif","mni-b17-006":"Intransitif","mni-b17-007":"Transitif","mni-b17-008":"Transitif","mni-b17-009":"Transitif","mni-b17-010":"Intransitif","mni-b17-011":"Transitif","mni-b17-012":"Intransitif","mni-b17-013":"Transitif","mni-b17-014":"Intransitif","mni-b18-001":"Intransitif","mni-b18-002":"Transitif","mni-b18-003":"Transitif","mni-b18-004":"Transitif","mni-b18-005":"Transitif","mni-b18-006":"Transitif","mni-b18-007":"Transitif","mni-b18-008":"Transitif","mni-b18-009":"Transitif","mni-b19-001":"Intransitif","mni-b19-002":"Intransitif","mni-b19-004":"Transitif","mni-b19-005":"Transitif","mni-b19-006":"Intransitif","mni-b20-001":"Intransitif","mni-b20-002":"Transitif","mni-b20-003":"Transitif","mni-b21-001":"Transitif","mni-b21-002":"Transitif","mni-b21-003":"Intransitif","mni-b21-004":"Intransitif","mni-b21-007":"Intransitif","mni-b21-010":"Intransitif","mni-b22-001":"Transitif","mni-b22-002":"Transitif","mni-b22-003":"Transitif","mni-b22-006":"Intransitif","mni-b23-001":"Transitif","mni-b23-003":"Transitif","mni-b23-004":"Transitif","mni-b23-005":"Transitif","mni-b23-006":"Intransitif","mni-b23-008":"Intransitif","mni-b23-010":"Intransitif","mni-b23-011":"Intransitif","mni-b23-013":"Intransitif","mni-b23-020":"Intransitif","mni-b24-001":"Transitif","mni-b24-002":"Transitif","mni-b24-003":"Transitif","mni-b24-004":"Transitif","mni-b24-005":"Transitif","mni-b24-006":"Transitif","mni-b24-007":"Transitif","mni-b24-008":"Transitif","mni-b25-001":"Transitif","mni-b25-002":"Intransitif","mni-b25-003":"Transitif","mni-b25-004":"Intransitif","mni-b25-016":"Intransitif","mnii-b26-001":"Transitif","mnii-b26-002":"Transitif","mnii-b26-003":"Transitif","mnii-b26-004":"Transitif","mnii-b26-005":"Intransitif","mnii-b26-006":"Intransitif","mnii-b26-007":"Transitif","mnii-b26-008":"Transitif","mnii-b26-009":"Intransitif","mnii-b26-032":"Intransitif","mnii-b26-033":"Transitif","mnii-b26-046":"Intransitif","mnii-b27-001":"Transitif","mnii-b27-002":"Intransitif","mnii-b27-003":"Intransitif","mnii-b27-004":"Intransitif","mnii-b27-005":"Intransitif","mnii-b27-006":"Transitif","mnii-b27-028":"Transitif","mnii-b27-037":"Transitif","mnii-b27-040":"Intransitif","mnii-b28-001":"Intransitif","mnii-b28-002":"Intransitif","mnii-b28-003":"Transitif","mnii-b28-004":"Transitif","mnii-b28-005":"Intransitif","mnii-b28-006":"Transitif","mnii-b28-048":"Intransitif","mnii-b28-053":"Transitif","mnii-b29-001":"Intransitif","mnii-b29-002":"Intransitif","mnii-b29-003":"Intransitif","mnii-b29-004":"Intransitif","mnii-b29-005":"Intransitif","mnii-b29-006":"Intransitif","mnii-b29-007":"Intransitif","mnii-b29-008":"Intransitif","mnii-b29-009":"Intransitif","mnii-b29-010":"Intransitif","mnii-b29-011":"Intransitif","mnii-b29-012":"Intransitif","mnii-b29-013":"Transitif","mnii-b29-014":"Transitif","mnii-b29-015":"Intransitif","mnii-b29-016":"Transitif","mnii-b29-017":"Transitif","mnii-b29-018":"Transitif","mnii-b29-038":"Transitif","mnii-b29-046":"Transitif","mnii-b29-048":"Intransitif","mnii-b29-051":"Intransitif","mnii-b30-001":"Transitif","mnii-b30-002":"Transitif","mnii-b30-003":"Transitif","mnii-b30-004":"Transitif","mnii-b30-005":"Transitif","mnii-b30-006":"Transitif","mnii-b30-007":"Transitif","mnii-b30-008":"Transitif","mnii-b30-009":"Transitif","mnii-b30-010":"Transitif","mnii-b30-011":"Transitif","mnii-b30-012":"Transitif","mnii-b30-039":"Intransitif","mnii-b30-044":"Transitif","mnii-b30-048":"Intransitif","mnii-b29-ref-state-01":"Intransitif","mnii-b29-ref-state-02":"Intransitif","mnii-b29-ref-state-03":"Intransitif","mnii-b29-ref-state-04":"Intransitif","mnii-b29-ref-state-05":"Intransitif","mnii-b29-ref-state-06":"Intransitif","mnii-b29-ref-state-07":"Intransitif","mnii-b29-ref-state-08":"Intransitif","mnii-b29-ref-state-09":"Intransitif","mnii-b29-ref-state-10":"Intransitif","mnii-b29-ref-state-11":"Intransitif","mnii-b29-ref-state-12":"Intransitif","mnii-b29-ref-state-13":"Intransitif","mnii-b29-ref-state-14":"Intransitif","mnii-b27-ref-info-16":"Intransitif","mnii-b27-ref-info-17":"Intransitif","mni-b18-ref-common-movement-001":"Intransitif","mni-b18-ref-common-movement-002":"Intransitif","mni-b18-ref-common-movement-003":"Intransitif","mni-b18-ref-common-movement-004":"Intransitif","mni-b18-ref-common-movement-005":"Intransitif","mni-b18-ref-common-movement-006":"Intransitif","mni-b18-ref-common-movement-007":"Intransitif","mni-b18-ref-common-movement-008":"Intransitif","mni-b18-ref-common-movement-009":"Intransitif","mni-b18-ref-common-movement-010":"Transitif","mni-b18-ref-common-movement-011":"Transitif","mni-b18-ref-common-movement-012":"Transitif","mni-b18-ref-common-movement-013":"Transitif","mni-b18-ref-common-movement-014":"Transitif","mni-b18-ref-common-movement-015":"Transitif","mni-b18-ref-common-movement-016":"Transitif","mni-b18-ref-common-movement-017":"Transitif","mni-b18-ref-common-movement-018":"Transitif","mni-b18-ref-common-movement-019":"Intransitif","mni-b18-ref-common-movement-020":"Intransitif","mni-b10-001":"Intransitif","mni-b10-002":"Intransitif","mni-b11-001":"Intransitif","mni-b11-002":"Intransitif","mni-b11-003":"Intransitif","mni-b11-004":"Intransitif","mni-ref-b25-life-009":"Intransitif","mni-ref-b25-life-017":"Intransitif","mni-ref-b25-life-018":"Intransitif","mni-ref-b25-life-019":"Intransitif","mni-ref-b25-life-020":"Intransitif","mni-ref-b25-life-022":"Intransitif","mni-ref-b25-life-023":"Intransitif","mni-ref-b25-life-024":"Transitif","mni-ref-b25-life-025":"Intransitif"};
  function applyVerbTransitivityLabels(){
    const rows=Array.isArray(window.__WIKARU_VOCABULARY)?window.__WIKARU_VOCABULARY:[];
    rows.forEach(v=>{
      const value=TRANSITIVITY_BY_ID[String(v?.id||'')];
      if(value && /^Kata Kerja Kelompok\s+(?:I|II|III)$/.test(String(v?.typeCategory||''))) v.transitivity=value;
    });
    return rows;
  }
  function transitivityBadge(v){
    if(!v || !v.transitivity) return null;
    const span=document.createElement('span');
    span.className='tag verb-transitivity wikaru-auto-transitivity';
    span.dataset.transitivity=v.transitivity;
    span.innerHTML='<i class="fa-solid fa-arrows-left-right"></i> '+String(v.transitivity);
    return span;
  }
  function decorateTransitivityTags(){
    const grid=document.getElementById('materialGrid');
    if(!grid) return;
    const rows=applyVerbTransitivityLabels();
    const byId=new Map(rows.map(v=>[String(v?.id||''),v]));
    grid.querySelectorAll('[data-speak-id]').forEach(btn=>{
      const v=byId.get(String(btn.dataset.speakId||''));
      if(!v?.transitivity) return;
      const card=btn.closest('.vocab-card, article, tr');
      if(!card) return;
      const tagRow=card.querySelector('.tag-row');
      if(!tagRow) return;
      const existing=[...tagRow.querySelectorAll('.verb-transitivity')].find(el=>el.textContent.includes(v.transitivity));
      if(!existing){ const badge=transitivityBadge(v); if(badge) tagRow.appendChild(badge); }
    });
  }
  let scheduled=false;
  function scheduleDecorate(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{ scheduled=false; decorateTransitivityTags(); });
  }
  applyVerbTransitivityLabels();
  window.__WIKARU_TRANSITIVITY_BY_ID=TRANSITIVITY_BY_ID;
  window.__wikaruApplyVerbTransitivityLabels=applyVerbTransitivityLabels;
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      applyVerbTransitivityLabels();
      try{ if(typeof renderMaterialFilterOptions==='function') renderMaterialFilterOptions(); }catch(_){}
      scheduleDecorate();
      const grid=document.getElementById('materialGrid');
      if(grid) new MutationObserver(scheduleDecorate).observe(grid,{childList:true,subtree:true});
    },{once:true});
  }else{
    try{ if(typeof renderMaterialFilterOptions==='function') renderMaterialFilterOptions(); }catch(_){}
    scheduleDecorate();
    const grid=document.getElementById('materialGrid');
    if(grid) new MutationObserver(scheduleDecorate).observe(grid,{childList:true,subtree:true});
  }
})();

/* source-script: wikaru-category-selection-feedback-v2-script */
(function(){
  'use strict';
  if(window.__wikaruCategorySelectionFeedbackV2Ready)return;
  window.__wikaruCategorySelectionFeedbackV2Ready=true;
  const modal=document.getElementById('setupModal');
  if(!modal)return;
  const fixedHead=modal.querySelector('.modal-fixed-head');
  let live=document.getElementById('setupSelectionLive');
  if(!live&&fixedHead){live=document.createElement('div');live.id='setupSelectionLive';live.setAttribute('role','status');live.setAttribute('aria-live','polite');fixedHead.appendChild(live)}
  let hideTimer=0;
  const cleanLabel=value=>String(value||'').replace(/\s+/g,' ').trim();
  const uiLang=()=>((document.documentElement.lang||'id').toLowerCase().startsWith('ja')?'ja':'id');
  function cardFor(kind){
    if(kind==='book')return modal.querySelector('#setupBookGrid .option-card.active');
    if(kind==='material')return modal.querySelector('#setupMaterialGrid .option-card.active');
    if(kind==='chapter')return modal.querySelector('#setupChapterGrid .category-button.active');
    return null;
  }
  function cardLabel(card,fallback){
    if(!card)return cleanLabel(fallback);
    const strong=card.querySelector('.wk-category-copy strong,strong');if(strong?.textContent?.trim())return cleanLabel(strong.textContent);
    const copy=card.querySelector('div');
    if(copy){const clone=copy.cloneNode(true);clone.querySelectorAll('small').forEach(n=>n.remove());const text=cleanLabel(clone.textContent);if(text)return text}
    return cleanLabel(card.dataset.setupMaterial||card.dataset.setupBook||card.dataset.setupChapter||fallback);
  }
  function showLive(kind,label){
    if(!live)return;
    const ja=uiLang()==='ja';
    const type=ja?({book:'本',material:'教材カテゴリー',chapter:'課'}[kind]||'項目'):({book:'Buku',material:'Kategori materi',chapter:'Bab'}[kind]||'Pilihan');
    const suffix=ja?' を選択':' dipilih';
    live.innerHTML='<span class="wk-selection-check" aria-hidden="true"></span><span><strong>'+type+(ja?'：':': ')+'</strong>'+label+suffix+'</span>';
    live.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer=setTimeout(()=>live?.classList.remove('is-visible'),720);
  }
  window.__wikaruSetupSelectionFeedback=function(kind,value,options){
    const card=cardFor(kind);
    if(card){
      card.classList.remove('wk-selection-confirm');void card.offsetWidth;card.classList.add('wk-selection-confirm');
      setTimeout(()=>card.classList.remove('wk-selection-confirm'),300);
      showLive(kind,cardLabel(card,value));
    }
    const reduced=document.documentElement.dataset.wkMotion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(options&&options.autoAdvance===false)return 0;
    return reduced?90:(kind==='material'?340:300);
  };
  modal.addEventListener('click',event=>{
    if(event.target.closest('#prevSetupStep,#nextSetupStep')){
      clearTimeout(window.__wikaruSetupAutoAdvanceTimer);window.__wikaruSetupAutoAdvanceTimer=0;
    }
  },true);
  window.__WIKARU_SETUP_SELECTION_HEALTHCHECK=()=>({
    build:'CATEGORY_SELECTION_FEEDBACK_V2_LIGHT',
    step:modal.querySelector('.step-block.active')?.dataset.setupStep||null,
    activeMaterials:modal.querySelectorAll('#setupMaterialGrid .option-card.active').length,
    activeChapters:modal.querySelectorAll('#setupChapterGrid .category-button.active').length,
    liveReady:!!live,
    pendingAutoAdvance:!!window.__wikaruSetupAutoAdvanceTimer
  });
})();

/* source-script: wikaru-b45-hospital-reference-enhancement */
(function(){
  "use strict";
  const OVERVIEW_IMAGE = "https://iili.io/CL63i37.png";
  function active(){
    try{
      return typeof state !== "undefined"
        && /^Minna no Nihongo II/i.test(String(state.setup?.book || ""))
        && String(state.setup?.materialCategory || "").trim().toLowerCase() === "kata-kata referensi dan informasi"
        && String(state.setup?.chapter || "") === "Bab 45";
    }catch(_){ return false; }
  }
  function escLocal(value){
    return String(value ?? "").replace(/[&<>"']/g,function(ch){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];});
  }
  function decorateHome(){
    const figure = document.getElementById("homeMainReferenceImage");
    const isActive = active();
    document.body.classList.toggle("b45-hospital-home-active", isActive);
    if(figure) figure.hidden = !isActive;
  }
  function decorate(){
    decorateHome();
    const existing = document.getElementById("bab45HospitalReferenceOverview");
    if(!active()){
      existing?.remove();
      return;
    }
    const content = document.querySelector("#materialPage .content-card");
    const grid = document.getElementById("materialGrid");
    if(!content || !grid) return;
    const lang = (typeof state !== "undefined" && state.lang === "ja") ? "ja" : "id";
    const title = content.querySelector(":scope > h2");
    const desc = content.querySelector(":scope > p");
    if(title) title.textContent = lang === "ja" ? "第45課・病院" : "Kata-Kata Referensi dan Informasi — Bab 45 — Rumah Sakit";
    if(desc) desc.textContent = lang === "ja"
      ? "病院の診療科、受付・会計、診察・検査、入退院、処方箋や薬の種類など34語を、画像、ひらがな、ローマ字、意味、品詞、例文、メモと一緒に学びます。"
      : "Pelajari 34 kosakata bertema 病院 — Rumah Sakit, mulai dari bagian rumah sakit, pendaftaran dan pembayaran, pemeriksaan dan tindakan medis, rawat inap, dokumen pasien, hingga jenis obat. Setiap kartu dilengkapi gambar, cara baca, romaji, arti, contoh kalimat, dan catatan singkat.";
    if(!existing){
      const section = document.createElement("section");
      section.id = "bab45HospitalReferenceOverview";
      section.className = "b45-hospital-reference-overview";
      section.innerHTML = `
        <div class="b45-hospital-reference-copy">
          <span class="b45-hospital-reference-kicker"><i class="fa-solid fa-hospital"></i> Minna no Nihongo II · Bab 45</span>
          <h3><span class="jp">病院</span> · Rumah Sakit</h3>
          <p>${lang === "ja"
            ? "まず参考画像で病院内の場所と語彙の全体像を確認してから、下のカードで一語ずつ学びます。参考画像はこの教材閲覧ページだけに表示され、各語彙カードには個別のイラストが使われます。"
            : "Lihat gambar referensi untuk mengenali bagian dan istilah yang ada di rumah sakit, lalu pelajari kosakatanya satu per satu melalui kartu di bawah. Gambar referensi hanya ditampilkan di halaman ini; setiap kosakata memiliki gambar tersendiri."}</p>
          <div class="b45-hospital-reference-stats">
            <span><i class="fa-solid fa-list"></i> 34 ${lang === "ja" ? "語" : "kosakata"}</span>
            <span><i class="fa-solid fa-book-open"></i> 34 Kosakata</span>
            <span><i class="fa-regular fa-comments"></i> 0 Percakapan</span>
            <span><i class="fa-solid fa-align-left"></i> 0 Bacaan</span>
          </div>
        </div>
        <figure class="b45-hospital-reference-figure">
          <a href="${escLocal(OVERVIEW_IMAGE)}" target="_blank" rel="noopener noreferrer" aria-label="${lang === "ja" ? "病院の参考画像を開く" : "Buka gambar referensi rumah sakit"}">
            <img src="${escLocal(OVERVIEW_IMAGE)}" alt="${lang === "ja" ? "第45課 病院 参考画像" : "Gambar referensi Bab 45 — Rumah Sakit"}" loading="eager" decoding="async" referrerpolicy="no-referrer">
          </a>
          <figcaption>${lang === "ja" ? "参考画像：病院。クリックすると原寸で開きます。" : "Gambar referensi Bab 45 — Rumah Sakit. Klik gambar untuk melihat ukuran penuh."}</figcaption>
        </figure>`;
      const toolbar = content.querySelector(".material-toolbar");
      if(toolbar) content.insertBefore(section, toolbar);
      else content.insertBefore(section, grid);
    }
  }

  if(typeof renderMaterial === "function"){
    const previousRenderMaterialBab45Hospital = renderMaterial;
    renderMaterial = function(){
      const result = previousRenderMaterialBab45Hospital.apply(this, arguments);
      try{ decorate(); }catch(err){ console.warn("Bab45 hospital reference:", err); }
      return result;
    };
  }

  if(typeof refreshHome === "function"){
    const previousRefreshHomeBab45Hospital = refreshHome;
    refreshHome = function(){
      const result = previousRefreshHomeBab45Hospital.apply(this, arguments);
      try{ decorateHome(); }catch(err){ console.warn("Bab45 hospital home:", err); }
      return result;
    };
  }

  if(typeof setupLabel === "function"){
    const previousSetupLabelBab45Hospital = setupLabel;
    setupLabel = function(){
      const base = previousSetupLabelBab45Hospital.apply(this, arguments);
      return active() ? `${base} • ${typeof state !== "undefined" && state.lang === "ja" ? "病院" : "病院 / Rumah Sakit"}` : base;
    };
  }

  try{
    setTimeout(function(){
      decorateHome();
      if(typeof state !== "undefined" && state.page === "material") decorate();
    },0);
  }catch(_){}
})();

/* source-script: wikaru-bab50-postal-reference-module */
(function(){
  "use strict";
  if(window.__wikaruBab50PostalReferenceReady) return;
  window.__wikaruBab50PostalReferenceReady = true;

  const SOURCE_IMAGE = "https://iili.io/CD0TfpV.png";
  const CATEGORY_NAME = "Kata-Kata Referensi dan Informasi";
  const raw = [
    {no:1,sectionCategory:"Kosakata",displayTerm:"封筒",kanji:"封筒",kana:"ふうとう",romaji:"fuutou",indonesia:"amplop",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Wadah kertas untuk surat atau dokumen",exampleJa:"大事な書類を白い封筒に入れました。",exampleReading:"Daiji na shorui o shiroi fuutou ni iremashita.",exampleId:"Saya memasukkan dokumen penting ke dalam amplop putih.",catatan:"封筒 adalah amplop tertutup. Untuk surat biasa, alamat penerima ditulis di bagian depan dan data pengirim di bagian belakang."},
    {no:2,sectionCategory:"Kosakata",displayTerm:"はがき",kanji:"",kana:"はがき",romaji:"hagaki",indonesia:"kartu pos",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Kartu untuk mengirim pesan singkat tanpa amplop",exampleJa:"旅先から祖母にはがきを送りました。",exampleReading:"Tabisaki kara sobo ni hagaki o okurimashita.",exampleId:"Saya mengirim kartu pos kepada nenek dari tempat perjalanan.",catatan:"はがき dipakai untuk pesan singkat. Satu sisi dapat berisi alamat, sedangkan sisi lain dapat berisi pesan atau gambar."},
    {no:3,sectionCategory:"Kosakata",displayTerm:"宛名",kanji:"宛名",kana:"あてな",romaji:"atena",indonesia:"nama dan alamat penerima",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Informasi tujuan surat",exampleJa:"宛名が間違っていないか確認してください。",exampleReading:"Atena ga machigatte inai ka kakunin shite kudasai.",exampleId:"Silakan periksa apakah nama dan alamat penerima sudah benar.",catatan:"宛名 bukan hanya nama orang. Dalam pengiriman surat, kata ini dapat mencakup nama serta alamat tujuan."},
    {no:4,sectionCategory:"Kosakata",displayTerm:"差出人",kanji:"差出人",kana:"さしだしにん",romaji:"sashidashinin",indonesia:"pengirim",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Orang yang mengirim surat atau paket",exampleJa:"封筒の裏に差出人の住所を書きます。",exampleReading:"Fuutou no ura ni sashidashinin no juusho o kakimasu.",exampleId:"Alamat pengirim ditulis di bagian belakang amplop.",catatan:"差出人 adalah pihak yang mengirim. Tulis nama dan alamatnya agar kiriman dapat dikembalikan bila tidak terkirim."},
    {no:5,sectionCategory:"Kosakata",displayTerm:"受取人",kanji:"受取人",kana:"うけとりにん",romaji:"uketorinin",indonesia:"penerima",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Orang yang menerima surat atau paket",exampleJa:"受取人の名前は大きく、はっきり書きましょう。",exampleReading:"Uketorinin no namae wa ookiku, hakkiri kakimashou.",exampleId:"Mari menulis nama penerima dengan besar dan jelas.",catatan:"受取人 berarti orang yang menerima barang atau surat. Pada dokumen pengiriman, istilah ini menunjukkan pihak tujuan."},
    {no:6,sectionCategory:"Kosakata",displayTerm:"住所",kanji:"住所",kana:"じゅうしょ",romaji:"juusho",indonesia:"alamat",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Tempat tinggal atau lokasi tujuan",exampleJa:"新しい住所を会社に知らせました。",exampleReading:"Atarashii juusho o kaisha ni shirasemashita.",exampleId:"Saya memberi tahu perusahaan tentang alamat baru saya.",catatan:"Alamat Jepang biasanya ditulis dari wilayah yang lebih besar ke bagian yang lebih kecil jika memakai format Jepang."},
    {no:7,sectionCategory:"Kosakata",displayTerm:"氏名",kanji:"氏名",kana:"しめい",romaji:"shimei",indonesia:"nama lengkap",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Nama keluarga dan nama diri",exampleJa:"申込書に住所と氏名を記入しました。",exampleReading:"Moushikomisho ni juusho to shimei o kinyuu shimashita.",exampleId:"Saya mengisi alamat dan nama lengkap pada formulir pendaftaran.",catatan:"氏名 adalah istilah resmi untuk nama lengkap dan sering muncul pada formulir, surat, serta dokumen pengiriman."},
    {no:8,sectionCategory:"Kosakata",displayTerm:"郵便番号",kanji:"郵便番号",kana:"ゆうびんばんごう",romaji:"yuubin bangou",indonesia:"nomor kode pos",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Kode wilayah untuk pengiriman pos",exampleJa:"郵便番号は七桁で書いてください。",exampleReading:"Yuubin bangou wa nanaketa de kaite kudasai.",exampleId:"Silakan menulis kode pos dengan tujuh angka.",catatan:"Kode pos Jepang terdiri dari tujuh angka dan sering ditulis dengan tanda hubung, misalnya 100-0001."},
    {no:9,sectionCategory:"Kosakata",displayTerm:"様",kanji:"様",kana:"さま",romaji:"sama",indonesia:"Bapak / Ibu / Saudara; sapaan hormat setelah nama penerima",typeCategory:"Kata Benda",typeDetail:"Akhiran sapaan hormat / Digunakan setelah nama penerima",exampleJa:"個人に送る封筒には、名前の後ろに「様」を付けます。",exampleReading:"Kojin ni okuru fuutou ni wa, namae no ushiro ni “sama” o tsukemasu.",exampleId:"Pada amplop untuk seseorang, tambahkan “sama” setelah namanya.",catatan:"様 ditulis setelah nama penerima untuk menunjukkan hormat. Jangan menulis 様 setelah 先生; gunakan nama + 先生."},
    {no:10,sectionCategory:"Kosakata",displayTerm:"先生",kanji:"先生",kana:"せんせい",romaji:"sensei",indonesia:"guru / dosen / dokter; sapaan profesi",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Gelar sapaan untuk profesi tertentu",exampleJa:"田中先生には、宛名を「田中昭子先生」と書きます。",exampleReading:"Tanaka-sensei ni wa, atena o “Tanaka Akiko-sensei” to kakimasu.",exampleId:"Untuk Tanaka-sensei, nama penerima ditulis “Tanaka Akiko Sensei”.",catatan:"Untuk guru, dosen, atau dokter, 先生 dapat dipakai setelah nama sebagai pengganti 様."},
    {no:11,sectionCategory:"Kosakata",displayTerm:"表",kanji:"表",kana:"おもて",romaji:"omote",indonesia:"bagian depan",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Sisi depan amplop atau kartu",exampleJa:"封筒の表に受取人の住所があります。",exampleReading:"Fuutou no omote ni uketorinin no juusho ga arimasu.",exampleId:"Alamat penerima berada di bagian depan amplop.",catatan:"表 adalah sisi utama yang terlihat. Pada amplop, sisi ini biasanya digunakan untuk data penerima dan perangko."},
    {no:12,sectionCategory:"Kosakata",displayTerm:"裏",kanji:"裏",kana:"うら",romaji:"ura",indonesia:"bagian belakang",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Sisi belakang amplop atau kartu",exampleJa:"封をした日を封筒の裏に小さく書きました。",exampleReading:"Fuu o shita hi o fuutou no ura ni chiisaku kakimashita.",exampleId:"Saya menulis kecil tanggal penutupan surat di bagian belakang amplop.",catatan:"裏 adalah sisi belakang. Data pengirim biasanya ditempatkan di sisi ini pada amplop vertikal."},
    {no:13,sectionCategory:"Kosakata",displayTerm:"縦書き",kanji:"縦書き",kana:"たてがき",romaji:"tategaki",indonesia:"penulisan vertikal",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Cara menulis dari atas ke bawah",exampleJa:"年賀状の宛名を縦書きで書きました。",exampleReading:"Nengajou no atena o tategaki de kakimashita.",exampleId:"Saya menulis alamat kartu Tahun Baru secara vertikal.",catatan:"Dalam 縦書き, baris dibaca dari atas ke bawah dan urutannya bergerak dari kanan ke kiri."},
    {no:14,sectionCategory:"Kosakata",displayTerm:"横書き",kanji:"横書き",kana:"よこがき",romaji:"yokogaki",indonesia:"penulisan horizontal",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Cara menulis mendatar",exampleJa:"海外の住所は横書きのほうが読みやすいです。",exampleReading:"Kaigai no juusho wa yokogaki no hou ga yomiyasui desu.",exampleId:"Alamat luar negeri lebih mudah dibaca jika ditulis horizontal.",catatan:"横書き dibaca mendatar. Format ini umum untuk alamat berhuruf Latin dan kiriman internasional."},
    {no:15,sectionCategory:"Kosakata",displayTerm:"切手",kanji:"切手",kana:"きって",romaji:"kitte",indonesia:"perangko",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Bukti pembayaran biaya kirim surat",exampleJa:"コンビニで百十円の切手を買いました。",exampleReading:"Konbini de hyaku juu-en no kitte o kaimashita.",exampleId:"Saya membeli perangko 110 yen di minimarket.",catatan:"Tempelkan 切手 pada posisi yang ditentukan. Nilai perangko harus sesuai dengan jenis dan berat kiriman."},
    {no:16,sectionCategory:"Kosakata",displayTerm:"郵便局",kanji:"郵便局",kana:"ゆうびんきょく",romaji:"yuubinkyoku",indonesia:"kantor pos",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Tempat melayani surat, paket, dan layanan pos",exampleJa:"昼休みに駅前の郵便局へ行きます。",exampleReading:"Hiruyasumi ni ekimae no yuubinkyoku e ikimasu.",exampleId:"Saat istirahat siang, saya pergi ke kantor pos di depan stasiun.",catatan:"Di 郵便局, Anda dapat menimbang kiriman, membeli perangko, memilih layanan, dan meminta bukti pengiriman."},
    {no:17,sectionCategory:"Kosakata",displayTerm:"郵便ポスト",kanji:"郵便ポスト",kana:"ゆうびんぽすと",romaji:"yuubin posuto",indonesia:"kotak pos",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Kotak untuk memasukkan surat yang akan dikirim",exampleJa:"駅の東口に赤い郵便ポストがあります。",exampleReading:"Eki no higashiguchi ni akai yuubin posuto ga arimasu.",exampleId:"Ada kotak pos merah di pintu timur stasiun.",catatan:"Periksa jadwal pengambilan pada kotak pos. Paket besar atau layanan khusus sebaiknya dibawa ke loket."},
    {no:18,sectionCategory:"Kosakata",displayTerm:"荷物",kanji:"荷物",kana:"にもつ",romaji:"nimotsu",indonesia:"barang bawaan / paket",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Barang yang dibawa atau dikirim",exampleJa:"この荷物は北海道の友人に送ります。",exampleReading:"Kono nimotsu wa Hokkaidou no yuujin ni okurimasu.",exampleId:"Paket ini akan saya kirim kepada teman di Hokkaido.",catatan:"荷物 dapat berarti barang bawaan atau barang kiriman. Maknanya ditentukan oleh konteks kalimat."},
    {no:19,sectionCategory:"Kosakata",displayTerm:"速達",kanji:"速達",kana:"そくたつ",romaji:"sokutatsu",indonesia:"layanan kirim cepat",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Layanan pos yang diprioritaskan",exampleJa:"締め切りが近いので、書類を速達で出しました。",exampleReading:"Shimekiri ga chikai node, shorui o sokutatsu de dashimashita.",exampleId:"Karena tenggat sudah dekat, saya mengirim dokumen dengan layanan cepat.",catatan:"速達 digunakan ketika kiriman perlu sampai lebih cepat daripada layanan biasa. Biayanya ditambahkan pada ongkos dasar."},
    {no:20,sectionCategory:"Kosakata",displayTerm:"書留",kanji:"書留",kana:"かきとめ",romaji:"kakitome",indonesia:"surat tercatat / kiriman terdaftar",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Layanan kiriman dengan catatan penerimaan",exampleJa:"大切な証明書を書留で送りました。",exampleReading:"Taisetsu na shoumeisho o kakitome de okurimashita.",exampleId:"Saya mengirim sertifikat penting sebagai surat tercatat.",catatan:"書留 memberi catatan pengiriman dan biasanya dapat dilacak. Pilihan tepat bergantung pada isi serta tingkat perlindungan yang diperlukan."},
    {no:21,sectionCategory:"Kosakata",displayTerm:"追跡番号",kanji:"追跡番号",kana:"ついせきばんごう",romaji:"tsuiseki bangou",indonesia:"nomor pelacakan",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Nomor untuk memeriksa perjalanan kiriman",exampleJa:"追跡番号を家族にメッセージで送りました。",exampleReading:"Tsuiseki bangou o kazoku ni messeeji de okurimashita.",exampleId:"Saya mengirim nomor pelacakan kepada keluarga melalui pesan.",catatan:"Simpan 追跡番号 sampai kiriman diterima. Nomor ini diperlukan saat memeriksa status atau bertanya kepada petugas."},
    {no:22,sectionCategory:"Kosakata",displayTerm:"送り状",kanji:"送り状",kana:"おくりじょう",romaji:"okurijou",indonesia:"formulir / label pengiriman",typeCategory:"Kata Benda",typeDetail:"Kata Benda / Dokumen yang ditempelkan pada paket",exampleJa:"送り状に電話番号も書いてください。",exampleReading:"Okurijou ni denwa bangou mo kaite kudasai.",exampleId:"Silakan tulis juga nomor telepon pada label pengiriman.",catatan:"送り状 memuat data pengirim, penerima, dan kadang-kadang isi paket. Tulis dengan jelas agar petugas dapat memprosesnya."},
    {no:23,sectionCategory:"Kosakata",displayTerm:"書きます",kanji:"書きます",kana:"かきます",romaji:"kakimasu",indonesia:"menulis",typeCategory:"Kata Kerja Kelompok I",typeDetail:"Kata Kerja Kelompok I / Membuat tulisan / Transitif",transitivity:"Transitif",exampleJa:"黒いペンで部屋番号を書きます。",exampleReading:"Kuroi pen de heya bangou o kakimasu.",exampleId:"Saya menulis nomor kamar dengan pena hitam.",catatan:"Benda atau informasi yang ditulis memakai partikel を, misalnya 住所を書きます."},
    {no:24,sectionCategory:"Kosakata",displayTerm:"送ります",kanji:"送ります",kana:"おくります",romaji:"okurimasu",indonesia:"mengirim",typeCategory:"Kata Kerja Kelompok I",typeDetail:"Kata Kerja Kelompok I / Mengirim barang, surat, atau data / Transitif",transitivity:"Transitif",exampleJa:"明日の朝、契約書を本社へ送ります。",exampleReading:"Ashita no asa, keiyakusho o honsha e okurimasu.",exampleId:"Besok pagi, saya akan mengirim kontrak ke kantor pusat.",catatan:"Barang yang dikirim ditandai dengan を. Tujuan dapat ditandai dengan に atau へ."},
    {no:25,sectionCategory:"Kosakata",displayTerm:"貼ります",kanji:"貼ります",kana:"はります",romaji:"harimasu",indonesia:"menempelkan",typeCategory:"Kata Kerja Kelompok I",typeDetail:"Kata Kerja Kelompok I / Menempelkan sesuatu pada permukaan / Transitif",transitivity:"Transitif",exampleJa:"封筒の左上に切手を貼りました。",exampleReading:"Fuutou no hidariue ni kitte o harimashita.",exampleId:"Saya menempelkan perangko di kiri atas amplop.",catatan:"Benda yang ditempel memakai を, sedangkan tempat menempel memakai に: 切手を封筒に貼ります."},
    {no:26,sectionCategory:"Kosakata",displayTerm:"入れます",kanji:"入れます",kana:"いれます",romaji:"iremasu",indonesia:"memasukkan",typeCategory:"Kata Kerja Kelompok II",typeDetail:"Kata Kerja Kelompok II / Memasukkan sesuatu ke dalam wadah / Transitif",transitivity:"Transitif",exampleJa:"返信用の封筒も中に入れておきます。",exampleReading:"Henshin-you no fuutou mo naka ni irete okimasu.",exampleId:"Saya juga memasukkan amplop balasan ke dalamnya.",catatan:"Benda yang dimasukkan memakai を dan tempatnya memakai に: 書類を封筒に入れます."},
    {no:27,sectionCategory:"Kosakata",displayTerm:"包みます",kanji:"包みます",kana:"つつみます",romaji:"tsutsumimasu",indonesia:"membungkus",typeCategory:"Kata Kerja Kelompok I",typeDetail:"Kata Kerja Kelompok I / Membungkus benda / Transitif",transitivity:"Transitif",exampleJa:"割れやすい皿を厚い紙で包みました。",exampleReading:"Wareyasui sara o atsui kami de tsutsumimashita.",exampleId:"Saya membungkus piring yang mudah pecah dengan kertas tebal.",catatan:"Benda yang dibungkus memakai を. Bahan pembungkus memakai で, misalnya 紙で包みます."},
    {no:28,sectionCategory:"Kosakata",displayTerm:"届きます",kanji:"届きます",kana:"とどきます",romaji:"todokimasu",indonesia:"sampai / terkirim",typeCategory:"Kata Kerja Kelompok I",typeDetail:"Kata Kerja Kelompok I / Kiriman sampai dengan sendirinya sebagai keadaan / Intransitif",transitivity:"Intransitif",exampleJa:"母からの小包が夕方に届きました。",exampleReading:"Haha kara no kozutsumi ga yuugata ni todokimashita.",exampleId:"Paket kecil dari ibu sampai pada sore hari.",catatan:"届きます berfokus pada kiriman yang sampai, sehingga benda yang sampai biasanya memakai が."},
    {no:29,sectionCategory:"Kosakata",displayTerm:"届けます",kanji:"届けます",kana:"とどけます",romaji:"todokemasu",indonesia:"mengantarkan / menyampaikan",typeCategory:"Kata Kerja Kelompok II",typeDetail:"Kata Kerja Kelompok II / Membawa sesuatu sampai kepada penerima / Transitif",transitivity:"Transitif",exampleJa:"配達員が荷物を玄関まで届けてくれました。",exampleReading:"Haitatsuin ga nimotsu o genkan made todokete kuremashita.",exampleId:"Petugas pengantar mengantarkan paket sampai ke pintu masuk.",catatan:"届けます membutuhkan pelaku yang mengantarkan. Barang yang diantar memakai を."},
    {no:30,sectionCategory:"Kosakata",displayTerm:"受け取ります",kanji:"受け取ります",kana:"うけとります",romaji:"uketorimasu",indonesia:"menerima",typeCategory:"Kata Kerja Kelompok I",typeDetail:"Kata Kerja Kelompok I / Menerima barang atau dokumen / Transitif",transitivity:"Transitif",exampleJa:"受付で海外からの書留を受け取りました。",exampleReading:"Uketsuke de kaigai kara no kakitome o uketorimashita.",exampleId:"Saya menerima surat tercatat dari luar negeri di resepsionis.",catatan:"Barang yang diterima memakai を. Orang asal pengiriman dapat ditandai dengan から."},
    {no:31,sectionCategory:"Kosakata",displayTerm:"記入します",kanji:"記入します",kana:"きにゅうします",romaji:"kinyuu shimasu",indonesia:"mengisi secara tertulis",typeCategory:"Kata Kerja Kelompok III",typeDetail:"Kata Kerja Kelompok III / Mengisi kolom formulir / Transitif",transitivity:"Transitif",exampleJa:"青い欄に受取人の電話番号を記入します。",exampleReading:"Aoi ran ni uketorinin no denwa bangou o kinyuu shimasu.",exampleId:"Saya mengisi nomor telepon penerima pada kolom biru.",catatan:"記入します dipakai ketika menulis informasi ke dalam formulir atau kolom yang telah tersedia."},
    {no:32,sectionCategory:"Kosakata",displayTerm:"正確な",kanji:"正確な",kana:"せいかくな",romaji:"seikaku na",indonesia:"tepat / akurat",typeCategory:"Kata Sifat-na",typeDetail:"Kata Sifat-na / Tidak mengandung kesalahan",exampleJa:"国際郵便には正確な住所が必要です。",exampleReading:"Kokusai yuubin ni wa seikaku na juusho ga hitsuyou desu.",exampleId:"Alamat yang akurat diperlukan untuk kiriman internasional.",catatan:"Di depan kata benda gunakan 正確な, misalnya 正確な情報. Di akhir kalimat gunakan 正確です."},
    {no:33,sectionCategory:"Kosakata",displayTerm:"重い",kanji:"重い",kana:"おもい",romaji:"omoi",indonesia:"berat",typeCategory:"Kata Sifat-i",typeDetail:"Kata Sifat-i / Memiliki bobot besar",exampleJa:"この箱は重いので、二人で運びましょう。",exampleReading:"Kono hako wa omoi node, futari de hakobimashou.",exampleId:"Kotak ini berat, jadi mari membawanya berdua.",catatan:"重い adalah kata sifat-i. Berat kiriman dapat memengaruhi ongkos serta jenis layanan yang tersedia."},
    {no:34,sectionCategory:"Percakapan",displayTerm:"この封筒を速達でお願いします。",kanji:"この封筒を速達でお願いします。",kana:"このふうとうをそくたつでおねがいします。",romaji:"kono fuutou o sokutatsu de onegai shimasu.",indonesia:"Tolong kirim amplop ini dengan layanan cepat.",typeCategory:"Ungkapan",typeDetail:"Percakapan / Meminta layanan kirim cepat",exampleJa:"客：この封筒を速達でお願いします。\n局員：はい、重さを量ります。",exampleReading:"Kyaku: Kono fuutou o sokutatsu de onegai shimasu. Kyokuin: Hai, omosa o hakarimasu.",exampleId:"Pelanggan: Tolong kirim amplop ini dengan layanan cepat. Petugas: Baik, saya akan menimbang beratnya.",catatan:"Pola ～でお願いします dipakai untuk memilih layanan atau cara pengiriman dengan sopan."},
    {no:35,sectionCategory:"Percakapan",displayTerm:"切手はどこで買えますか。",kanji:"切手はどこで買えますか。",kana:"きってはどこでかえますか。",romaji:"kitte wa doko de kaemasu ka.",indonesia:"Di mana saya bisa membeli perangko?",typeCategory:"Ungkapan",typeDetail:"Percakapan / Menanyakan tempat membeli perangko",exampleJa:"旅行者：切手はどこで買えますか。\n案内係：向かいの郵便局で買えます。",exampleReading:"Ryokousha: Kitte wa doko de kaemasu ka. Annaigakari: Mukai no yuubinkyoku de kaemasu.",exampleId:"Pelancong: Di mana saya bisa membeli perangko? Petugas informasi: Bisa dibeli di kantor pos seberang.",catatan:"どこで menanyakan tempat terjadinya kegiatan. 買えます adalah bentuk potensial dari 買います."},
    {no:36,sectionCategory:"Percakapan",displayTerm:"海外へ送りたいんですが。",kanji:"海外へ送りたいんですが。",kana:"かいがいへおくりたいんですが。",romaji:"kaigai e okuritain desu ga.",indonesia:"Saya ingin mengirimnya ke luar negeri.",typeCategory:"Ungkapan",typeDetail:"Percakapan / Menyampaikan kebutuhan dengan halus",exampleJa:"客：海外へ送りたいんですが。\n局員：国と内容品を教えてください。",exampleReading:"Kyaku: Kaigai e okuritain desu ga. Kyokuin: Kuni to naiyouhin o oshiete kudasai.",exampleId:"Pelanggan: Saya ingin mengirimnya ke luar negeri. Petugas: Tolong beri tahu negara tujuan dan isi kiriman.",catatan:"～たいんですが dipakai untuk membuka permintaan atau konsultasi dengan nada yang lebih halus."},
    {no:37,sectionCategory:"Percakapan",displayTerm:"いつごろ届きますか。",kanji:"いつごろ届きますか。",kana:"いつごろとどきますか。",romaji:"itsu goro todokimasu ka.",indonesia:"Kira-kira kapan akan sampai?",typeCategory:"Ungkapan",typeDetail:"Percakapan / Menanyakan perkiraan waktu tiba",exampleJa:"客：いつごろ届きますか。\n局員：通常は三日ほどです。",exampleReading:"Kyaku: Itsu goro todokimasu ka. Kyokuin: Tsuujou wa mikka hodo desu.",exampleId:"Pelanggan: Kira-kira kapan akan sampai? Petugas: Biasanya sekitar tiga hari.",catatan:"ごろ menunjukkan perkiraan waktu, sedangkan ほど dapat menunjukkan perkiraan lama waktu atau jumlah."},
    {no:38,sectionCategory:"Percakapan",displayTerm:"追跡番号を教えてください。",kanji:"追跡番号を教えてください。",kana:"ついせきばんごうをおしえてください。",romaji:"tsuiseki bangou o oshiete kudasai.",indonesia:"Tolong beri tahu nomor pelacakannya.",typeCategory:"Ungkapan",typeDetail:"Percakapan / Meminta informasi pelacakan",exampleJa:"受取人：追跡番号を教えてください。\n差出人：今、写真を送ります。",exampleReading:"Uketorinin: Tsuiseki bangou o oshiete kudasai. Sashidashinin: Ima, shashin o okurimasu.",exampleId:"Penerima: Tolong beri tahu nomor pelacakannya. Pengirim: Saya kirim fotonya sekarang.",catatan:"～を教えてください adalah permintaan sopan untuk meminta informasi."},
    {no:39,sectionCategory:"Percakapan",displayTerm:"こちらにご記入ください。",kanji:"こちらにご記入ください。",kana:"こちらにごきにゅうください。",romaji:"kochira ni gokinyuu kudasai.",indonesia:"Silakan isi di sini.",typeCategory:"Ungkapan",typeDetail:"Percakapan / Petunjuk sopan dari petugas",exampleJa:"局員：こちらにご記入ください。\n客：電話番号も必要ですか。",exampleReading:"Kyokuin: Kochira ni gokinyuu kudasai. Kyaku: Denwa bangou mo hitsuyou desu ka.",exampleId:"Petugas: Silakan isi di sini. Pelanggan: Apakah nomor telepon juga diperlukan?",catatan:"ご記入ください adalah bentuk sopan yang sering dipakai petugas untuk meminta pelanggan mengisi formulir."},
    {no:40,sectionCategory:"Bacaan",displayTerm:"封筒の表に、受取人の住所と氏名を書きます。",kanji:"封筒の表に、受取人の住所と氏名を書きます。",kana:"ふうとうのおもてに、うけとりにんのじゅうしょとしめいをかきます。",romaji:"fuutou no omote ni, uketorinin no juusho to shimei o kakimasu.",indonesia:"Di bagian depan amplop, tulis alamat dan nama lengkap penerima.",typeCategory:"Kalimat Informasi",typeDetail:"Bacaan / Tata letak bagian depan amplop",exampleJa:"封筒の表に、受取人の住所と氏名を書き、右上に切手を貼ります。",exampleReading:"Fuutou no omote ni, uketorinin no juusho to shimei o kaki, migiue ni kitte o harimasu.",exampleId:"Di bagian depan amplop, tulis alamat dan nama lengkap penerima, lalu tempelkan perangko di kanan atas.",catatan:"Pada amplop vertikal Jepang, alamat penerima biasanya ditulis lebih kecil daripada nama penerima."},
    {no:41,sectionCategory:"Bacaan",displayTerm:"封筒の裏に、差出人の住所と氏名を書きます。",kanji:"封筒の裏に、差出人の住所と氏名を書きます。",kana:"ふうとうのうらに、さしだしにんのじゅうしょとしめいをかきます。",romaji:"fuutou no ura ni, sashidashinin no juusho to shimei o kakimasu.",indonesia:"Di bagian belakang amplop, tulis alamat dan nama lengkap pengirim.",typeCategory:"Kalimat Informasi",typeDetail:"Bacaan / Tata letak bagian belakang amplop",exampleJa:"差出人の情報があれば、配達できないときに返送できます。",exampleReading:"Sashidashinin no jouhou ga areba, haitatsu dekinai toki ni hensou dekimasu.",exampleId:"Jika informasi pengirim tersedia, kiriman dapat dikembalikan saat tidak bisa diantar.",catatan:"Jangan lupa kode pos pengirim. Informasi lengkap membantu proses pengembalian kiriman."},
    {no:42,sectionCategory:"Bacaan",displayTerm:"郵便番号は、決められた枠の中に書きます。",kanji:"郵便番号は、決められた枠の中に書きます。",kana:"ゆうびんばんごうは、きめられたわくのなかにかきます。",romaji:"yuubin bangou wa, kimerareta waku no naka ni kakimasu.",indonesia:"Kode pos ditulis di dalam kotak yang telah disediakan.",typeCategory:"Kalimat Informasi",typeDetail:"Bacaan / Cara menulis kode pos",exampleJa:"数字が枠から出ないように、郵便番号を一字ずつ書きましょう。",exampleReading:"Suuji ga waku kara denai you ni, yuubin bangou o ichiji zutsu kakimashou.",exampleId:"Mari menulis setiap angka kode pos agar tidak keluar dari kotaknya.",catatan:"Tulis angka dengan jelas. Jika tidak ada kotak khusus, kode pos tetap dapat ditulis sebelum alamat."},
    {no:43,sectionCategory:"Bacaan",displayTerm:"先生に送るときは、名前の後ろに「先生」と書きます。",kanji:"先生に送るときは、名前の後ろに「先生」と書きます。",kana:"せんせいにおくるときは、なまえのうしろに「せんせい」とかきます。",romaji:"sensei ni okuru toki wa, namae no ushiro ni “sensei” to kakimasu.",indonesia:"Saat mengirim kepada guru, tulis “先生” setelah namanya.",typeCategory:"Kalimat Informasi",typeDetail:"Bacaan / Sapaan untuk guru",exampleJa:"「山田花子先生」のように書き、「先生様」とは書きません。",exampleReading:"“Yamada Hanako-sensei” no you ni kaki, “sensei-sama” to wa kakimasen.",exampleId:"Tulislah seperti “Yamada Hanako Sensei” dan jangan menulis “Sensei-sama”.",catatan:"先生 sudah berfungsi sebagai gelar hormat, sehingga tidak perlu ditambah 様."},
    {no:44,sectionCategory:"Bacaan",displayTerm:"海外宛ての住所は、国名を最後の行に大文字で書きます。",kanji:"海外宛ての住所は、国名を最後の行に大文字で書きます。",kana:"かいがいあてのじゅうしょは、こくめいをさいごのぎょうにおおもじでかきます。",romaji:"kaigai ate no juusho wa, kokumei o saigo no gyou ni oomooji de kakimasu.",indonesia:"Untuk alamat luar negeri, tulis nama negara dengan huruf kapital pada baris terakhir.",typeCategory:"Kalimat Informasi",typeDetail:"Bacaan / Alamat internasional",exampleJa:"日本からインドネシアへ送るときは、最後に「INDONESIA」と書きます。",exampleReading:"Nihon kara Indoneshia e okuru toki wa, saigo ni “INDONESIA” to kakimasu.",exampleId:"Saat mengirim dari Jepang ke Indonesia, tulis “INDONESIA” pada bagian terakhir.",catatan:"Gunakan huruf Latin yang jelas untuk alamat internasional. Pastikan negara tujuan mudah terlihat."},
    {no:45,sectionCategory:"Bacaan",displayTerm:"追跡番号は、配達が終わるまで保管します。",kanji:"追跡番号は、配達が終わるまで保管します。",kana:"ついせきばんごうは、はいたつがおわるまでほかんします。",romaji:"tsuiseki bangou wa, haitatsu ga owaru made hokan shimasu.",indonesia:"Simpan nomor pelacakan sampai proses pengantaran selesai.",typeCategory:"Kalimat Informasi",typeDetail:"Bacaan / Menyimpan bukti pengiriman",exampleJa:"問題があったときのために、送り状の写真も残しておきましょう。",exampleReading:"Mondai ga atta toki no tame ni, okurijou no shashin mo nokoshite okimashou.",exampleId:"Untuk berjaga-jaga jika ada masalah, simpan juga foto label pengiriman.",catatan:"Nomor pelacakan dan bukti pengiriman membantu ketika status kiriman perlu diperiksa atau dilaporkan."}
  ];

  let currentLang = "id";

  function escPostal(value){
    return String(value ?? "").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
  }
  const entries = raw.map(item=>({
    id:`mnii-b50-ref-postal-${String(item.no).padStart(3,"0")}`,
    course:"Minna no Nihongo II", book:"Minna no Nihongo II (2nd Edition)", bookJa:"みんなの日本語 II（第2版）",
    category:CATEGORY_NAME, materialCategory:CATEGORY_NAME, chapter:"Bab 50", chapterNumber:50,
    favorite:false, quizEnabled:false, isFiction:false, section:item.sectionCategory,
    sourceGroup:item.no <= 14 ? "Dari Gambar" : "Pengayaan",
    useGroup:item.no <= 14 ? "Gambar utama" : item.sectionCategory === "Percakapan" ? "Ungkapan" : item.sectionCategory === "Bacaan" ? "Bacaan" : item.no <= 22 ? "Layanan pos" : "Tindakan dan sifat",
    topic:"封筒・はがきの宛名の書き方", image:"", imageAlt:`Materi pos ${item.displayTerm} — ${item.indonesia}`,
    speech:item.kana || item.displayTerm, tag:`Minna no Nihongo II / ${CATEGORY_NAME} / Bab 50 / ${item.sectionCategory}`,
    examples:[{ja:item.exampleJa,reading:item.exampleReading,id:item.exampleId}], note:item.catatan, ...item
  }));
  window.__WIKARU_BAB50_POSTAL_REFERENCE = entries;

  function decorateHome(isActive=false,lang="id"){
    currentLang = lang === "ja" ? "ja" : "id";
    const ja = currentLang === "ja";
    const wasPostalHome = document.body.classList.contains("postal50-home-active");
    document.body.classList.remove("postal50-home-active");
    const figure = document.getElementById("homeMainReferenceImage");
    if(figure && (isActive || wasPostalHome)) figure.hidden = true;
    if(isActive){
      const desc = document.getElementById("homeContinueDescription");
      if(desc) desc.textContent = ja
        ? "封筒とはがきの宛名、郵便局で使うことば、窓口での会話、送り方を、参考画像と45項目の教材で学びます。"
        : "Pelajari alamat surat dan kartu pos melalui gambar referensi, 45 materi, percakapan di loket, format penulisan, serta langkah pengiriman.";
    }
  }

  function guideHtml(lang=currentLang,context={}){
    const ja = lang === "ja";
    const favorites = new Set(Array.isArray(context.favorites) ? context.favorites : []);
    const counts = Object.fromEntries(["Kosakata","Percakapan","Bacaan"].map(section=>[section,entries.filter(v=>v.sectionCategory===section).length]));
    const sourceItems = entries.filter(v=>v.sourceGroup === "Dari Gambar");
    const extraItems = entries.filter(v=>v.sourceGroup !== "Dari Gambar");
    const cardHtml = item=>{
      const sectionClass = item.sectionCategory === "Bacaan" ? "reading" : item.sectionCategory === "Percakapan" ? "talk" : "";
      const readingLine = item.kana && item.kana !== item.displayTerm ? `<div class="useful41-reading jp">${escPostal(item.kana)}</div>` : "";
      const transitivity = item.transitivity ? `<span class="useful41-tag">${escPostal(item.transitivity)}</span>` : "";
      const favorite = favorites.has(item.id);
      const search = [item.displayTerm,item.kanji,item.kana,item.romaji,item.indonesia,item.typeCategory,item.typeDetail,item.transitivity,item.useGroup,item.catatan].join(" ").toLowerCase();
      return `<article class="useful41-card" data-postal50-card data-section="${escPostal(item.sectionCategory)}" data-source="${escPostal(item.sourceGroup)}" data-search="${escPostal(search)}">
        <div class="useful41-card-top"><div><span class="useful41-card-index">#${String(item.no).padStart(2,"0")} · ${escPostal(item.sourceGroup.toUpperCase())}</span><div class="jp-term">${escPostal(item.displayTerm)}</div>${readingLine}<div class="useful41-romaji">${escPostal(item.romaji)}</div></div></div>
        <div class="useful41-meaning">${escPostal(item.indonesia)}</div>
        <div class="useful41-tags"><span class="useful41-tag ${sectionClass}">${escPostal(item.sectionCategory)}</span><span class="useful41-tag">${escPostal(item.typeCategory)}</span>${transitivity}<span class="useful41-tag">${escPostal(item.useGroup)}</span></div>
        <div class="useful41-actions" aria-label="Aksi materi"><button type="button" class="icon-btn" data-speak-id="${escPostal(item.id)}" title="Dengarkan" aria-label="Dengarkan ${escPostal(item.displayTerm)}"><i class="fa-solid fa-volume-high"></i></button><button type="button" class="icon-btn ${favorite?"active":""}" data-fav="${escPostal(item.id)}" title="Favorit" aria-label="Ubah status favorit ${escPostal(item.displayTerm)}"><i class="${favorite?"fa-solid":"fa-regular"} fa-star"></i></button><button type="button" class="icon-btn" data-example-material="${escPostal(item.id)}" title="Contoh kalimat" aria-label="Buka contoh kalimat ${escPostal(item.displayTerm)}"><i class="fa-regular fa-message"></i></button><button type="button" class="icon-btn" data-note-material="${escPostal(item.id)}" title="Catatan kosakata" aria-label="Buka catatan ${escPostal(item.displayTerm)}"><i class="fa-regular fa-note-sticky"></i></button></div>
      </article>`;
    };
    return `<section class="useful41-hero">
      <div class="useful41-hero-copy"><span class="useful41-kicker"><i class="fa-solid fa-envelope-open-text"></i> Minna no Nihongo II（第2版） · ${ja?"参考語彙・情報 · 第50課":`${CATEGORY_NAME} · Bab 50`}</span><h3 class="jp">封筒・はがきの宛名の書き方 <span>${ja?"封筒・はがきに住所を書く方法":"Cara Menulis Alamat pada Amplop dan Kartu Pos"}</span></h3><p class="useful41-lead">${ja?"参考画像で宛名の位置を確認し、郵便の語彙、窓口での会話、送り方を学びます。":"Amati nama penerima, alamat, kode pos, dan data pengirim pada gambar. Setelah itu, pelajari kosakata pos, percakapan di loket, serta bacaan yang dapat dipakai saat mengirim surat atau paket."}</p><div class="useful41-focus"><i class="fa-solid fa-image"></i><div><strong>${ja?"学び方。":"Cara belajar."}</strong> ${ja?"画像を見たあと、カテゴリーを選び、例文とメモで使い方を確認してください。":"Amati gambar, pilih kategori yang ingin dipelajari, lalu buka contoh kalimat dan catatan pada setiap kartu. Pada kata kerja, perhatikan kelompok serta label Transitif atau Intransitif."}</div></div><div class="useful41-stats"><span class="useful41-stat">${entries.length} ${ja?"項目":"materi"}</span><span class="useful41-stat">${sourceItems.length} ${ja?"画像から":"dari gambar"}</span><span class="useful41-stat">${extraItems.length} ${ja?"追加教材":"materi tambahan"}</span><span class="useful41-stat">${counts.Kosakata} Kosakata</span><span class="useful41-stat">${counts.Percakapan} Percakapan</span><span class="useful41-stat">${counts.Bacaan} Bacaan</span><span class="useful41-stat no-quiz"><i class="fa-solid fa-ban"></i> ${ja?"クイズなし":"Tanpa kuis"}</span></div></div>
      <figure class="useful41-source"><div class="useful41-source-head"><span class="useful41-source-badge"><i class="fa-regular fa-image"></i> ${ja?"第50課の参考画像":"Gambar referensi Bab 50"}</span><a class="useful41-source-full" href="${SOURCE_IMAGE}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${ja?"原寸で開く":"Buka ukuran penuh"}</a></div><a class="useful41-source-link" href="${SOURCE_IMAGE}" target="_blank" rel="noopener noreferrer" aria-label="${ja?"参考画像を開く":"Buka gambar referensi Bab 50"}"><img src="${SOURCE_IMAGE}" alt="${ja?"封筒とはがきの宛名の書き方":"Cara menulis alamat pada amplop dan kartu pos"}" loading="eager" decoding="async" referrerpolicy="no-referrer"></a><figcaption><span>${ja?"画像は教材ページに表示されます。":"Gambar utama ditampilkan pada halaman Jelajah Materi."}</span><span>${ja?"クリックすると原寸で開きます。":"Klik gambar untuk melihat ukuran penuh."}</span></figcaption></figure>
    </section>
    <section class="useful41-panel"><div class="useful41-panel-head"><div><span class="useful41-eyebrow"><i class="fa-solid fa-layer-group"></i> ${ja?"主な教材と追加教材":"Materi utama & tambahan"}</span><h3>${ja?"語彙・会話・読み物":"Kosakata, Percakapan & Bacaan"}</h3><p>${ja?"日本語、読み方、ローマ字、意味、品詞、例文、メモを確認できます。":"Setiap kartu menampilkan bentuk Jepang, cara baca, romaji, arti Indonesia, kategori, jenis kata, contoh kalimat, dan catatan sederhana."}</p></div><span class="useful41-count-note">${entries.length} ${ja?"項目":"materi"}</span></div>
      <div class="useful41-search"><div class="useful41-searchbox"><i class="fa-solid fa-magnifying-glass"></i><input id="postal50Search" type="search" placeholder="${ja?"表記・読み方・意味・品詞を検索…":"Cari kanji/kana, romaji, arti, layanan, atau jenis kata…"}" autocomplete="off" aria-label="Cari materi Bab 50"></div><button class="useful41-filter active" type="button" data-postal50-filter="all">Semua (${entries.length})</button><button class="useful41-filter" type="button" data-postal50-filter="source">Dari Gambar (${sourceItems.length})</button><button class="useful41-filter" type="button" data-postal50-filter="extra">Pengayaan (${extraItems.length})</button><button class="useful41-filter" type="button" data-postal50-filter="Kosakata">Kosakata (${counts.Kosakata})</button><button class="useful41-filter" type="button" data-postal50-filter="Percakapan">Percakapan (${counts.Percakapan})</button><button class="useful41-filter" type="button" data-postal50-filter="Bacaan">Bacaan (${counts.Bacaan})</button></div>
      <div id="postal50Cards" class="useful41-grid">${entries.map(cardHtml).join("")}</div><div id="postal50Empty" class="empty hidden" style="margin-top:14px"><h3>Tidak ada materi yang cocok</h3><p>Coba kata kunci yang lebih singkat atau pilih filter lain.</p></div>
    </section>
    <section class="useful41-panel"><div class="useful41-panel-head"><div><span class="useful41-eyebrow"><i class="fa-solid fa-pen-ruler"></i> ${ja?"住所の書き方":"Panduan praktis"}</span><h3>${ja?"住所の書き方":"Format Penulisan Alamat"}</h3><p>${ja?"用途に合わせて、縦書き・横書き・国際郵便を使い分けます。":"Pilih format yang sesuai untuk amplop vertikal, kartu pos, amplop horizontal, atau kiriman internasional."}</p></div><span class="useful41-count-note">4 format</span></div><div class="postal50-format-grid">
      <article class="postal50-format-card"><strong>1. Amplop vertikal Jepang</strong><span class="jp">表：受取人　／　裏：差出人</span><p>Tulis penerima di depan dan pengirim di belakang. Buat nama penerima lebih besar daripada alamat.</p><div class="postal50-address-sample">〒530-0000\n大阪府大阪市北区梅田五丁目七-五\n松本 正 様</div></article>
      <article class="postal50-format-card"><strong>2. Kartu pos</strong><span class="jp">受取人を右側、差出人を左下</span><p>Letakkan penerima di sisi kanan dan pengirim di kiri bawah. Untuk guru, gunakan 先生 sebagai pengganti 様.</p><div class="postal50-address-sample">田中 昭子 先生\n東京都文京区本郷六丁目二〇-一</div></article>
      <article class="postal50-format-card"><strong>3. Amplop horizontal</strong><span class="jp">郵便番号 → 住所 → 氏名</span><p>Tulis dari kiri ke kanan: kode pos, alamat, lalu nama. Nama perusahaan dan bagian dapat ditulis sebelum nama penerima.</p><div class="postal50-address-sample">〒100-0001\n東京都千代田区千代田1-1\n株式会社みらい　営業部　佐藤様</div></article>
      <article class="postal50-format-card"><strong>4. Kiriman internasional</strong><span class="jp">AIR MAIL / PAR AVION</span><p>Gunakan huruf Latin yang jelas dan tulis negara tujuan dengan huruf kapital pada baris terakhir.</p><div class="postal50-address-sample">AUSTIN RAMIREZ\nJl. Melati No. 10, Jakarta 10110\nINDONESIA</div></article>
    </div></section>
    <section class="useful41-panel"><div class="useful41-panel-head"><div><span class="useful41-eyebrow"><i class="fa-solid fa-route"></i> ${ja?"発送の流れ":"Alur pengiriman"}</span><h3>${ja?"郵便局から送る手順":"Langkah Mengirim dari Kantor Pos"}</h3><p>${ja?"迷ったときは、窓口で内容と希望を伝えましょう。":"Jika ragu, bawa kiriman ke loket dan jelaskan tujuan, isi, serta kecepatan yang dibutuhkan."}</p></div><span class="useful41-count-note">6 langkah</span></div><div class="postal50-step-grid">${[["宛名を書く","Tulis nama, alamat, kode pos, dan sapaan penerima dengan jelas."],["中身を確認する","Pastikan isinya boleh dikirim, tidak bocor, dan sesuai dengan aturan tujuan."],["しっかり包む","Bungkus benda rapuh dan tutup amplop atau kotak dengan kuat."],["窓口へ持って行く","Bawa ke loket untuk ditimbang, terutama paket dan kiriman internasional."],["サービスを選ぶ","Pilih layanan biasa, 速達, 書留, atau layanan internasional sesuai kebutuhan."],["控えを保管する","Simpan kuitansi, foto 送り状, dan 追跡番号 sampai barang diterima."]].map((step,index)=>`<article class="postal50-step-card"><span class="postal50-step-no">${index+1}</span><strong class="jp">${step[0]}</strong><p>${step[1]}</p></article>`).join("")}</div></section>
    <section class="useful41-panel postal50-locator"><div class="postal50-locator-copy"><span class="useful41-eyebrow"><i class="fa-solid fa-location-dot"></i> ${ja?"現在地から検索":"Pencarian berdasarkan lokasi"}</span><h3>${ja?"近くの郵便局を探す":"Temukan Kantor Pos Terdekat"}</h3><p>${ja?"位置情報は検索リンクの作成だけに使われ、保存されません。":"Lokasi hanya digunakan untuk membuat tautan pencarian peta dan tidak disimpan. Jika izin lokasi tidak diberikan, gunakan pencarian umum."}</p></div><div class="postal50-locator-actions"><button class="btn" type="button" id="postal50LocateBtn"><i class="fa-solid fa-location-crosshairs"></i><span>${ja?"現在地を使う":"Gunakan lokasi saya"}</span></button><a class="btn secondary" id="postal50GenericMap" href="https://www.google.com/maps/search/?api=1&amp;query=Japan%20Post%20office" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-map-location-dot"></i><span>${ja?"地図で検索":"Cari di peta"}</span></a></div><div class="postal50-location-status" id="postal50LocationStatus" role="status" aria-live="polite"></div></section>`;
  }

  function decorateMaterial(isActive=false,lang="id",context={}){
    currentLang = lang === "ja" ? "ja" : "id";
    document.body.classList.toggle("postal50-reference-active",isActive);
    if(!isActive) return;
    const content = document.querySelector("#materialPage .content-card");
    const grid = document.getElementById("materialGrid");
    if(!content || !grid) return;
    const ja = currentLang === "ja";
    const title = content.querySelector(":scope > h2");
    const desc = content.querySelector(":scope > p");
    if(title) title.textContent = ja ? "第50課・封筒とはがきの宛名" : "Bab 50 · 封筒・はがきの宛名 — Alamat Surat dan Kartu Pos";
    if(desc) desc.textContent = ja ? "参考画像、郵便の語彙、窓口会話、読み物、住所の書き方、発送手順を45項目で学びます。このカテゴリーにはクイズがありません。" : "Pelajari gambar referensi, kosakata pos, percakapan di loket, bacaan, format alamat, dan langkah pengiriman melalui 45 materi. Kategori ini tidak memiliki kuis.";
    document.body.classList.add("material-only-reference","postal50-reference-active");
    const toolbar = content.querySelector(".material-toolbar");
    if(toolbar){toolbar.classList.add("hidden");toolbar.style.setProperty("display","none","important");toolbar.style.setProperty("visibility","hidden","important");toolbar.style.setProperty("pointer-events","none","important");}
    const notice = document.querySelector("#materialPage .notice");
    if(notice){notice.classList.add("hidden");notice.style.setProperty("display","none","important");}
    grid.className = "useful41-wrap salon44-wrap";
    grid.innerHTML = guideHtml(currentLang,context);
    let activeFilter = "all";
    const applyFilter = ()=>{
      const query = String(document.getElementById("postal50Search")?.value || "").normalize("NFKC").trim().toLowerCase();
      let shown = 0;
      grid.querySelectorAll("[data-postal50-card]").forEach(card=>{
        let filterOk = true;
        if(activeFilter === "source") filterOk = card.dataset.source === "Dari Gambar";
        else if(activeFilter === "extra") filterOk = card.dataset.source !== "Dari Gambar";
        else if(activeFilter !== "all") filterOk = card.dataset.section === activeFilter;
        const show = filterOk && (!query || String(card.dataset.search || "").includes(query));
        card.classList.toggle("hidden",!show);
        if(show) shown++;
      });
      document.getElementById("postal50Empty")?.classList.toggle("hidden",shown > 0);
    };
    document.getElementById("postal50Search")?.addEventListener("input",applyFilter);
    grid.querySelectorAll("[data-postal50-filter]").forEach(button=>button.addEventListener("click",()=>{
      activeFilter = button.dataset.postal50Filter || "all";
      grid.querySelectorAll("[data-postal50-filter]").forEach(other=>other.classList.toggle("active",other===button));
      applyFilter();
    }));
  }

  document.addEventListener("click",event=>{
    const button = event.target.closest?.("#postal50LocateBtn");
    if(!button) return;
    const status = document.getElementById("postal50LocationStatus");
    const map = document.getElementById("postal50GenericMap");
    const ja = currentLang === "ja";
    if(!navigator.geolocation){
      if(status) status.textContent = ja ? "このブラウザーでは位置情報を使えません。地図検索を使ってください。" : "Browser ini tidak mendukung lokasi. Silakan gunakan tombol Cari di peta.";
      return;
    }
    button.disabled = true;
    if(status) status.textContent = ja ? "現在地を確認しています…" : "Mendeteksi lokasi Anda…";
    navigator.geolocation.getCurrentPosition(position=>{
      const lat = Number(position.coords.latitude).toFixed(6);
      const lng = Number(position.coords.longitude).toFixed(6);
      const href = `https://www.google.com/maps/search/%E9%83%B5%E4%BE%BF%E5%B1%80/@${lat},${lng},14z`;
      if(map){ map.href=href; map.querySelector("span").textContent=ja?"近い郵便局を見る":"Lihat kantor pos terdekat"; map.focus(); }
      if(status) status.textContent = ja ? `現在地（${lat}, ${lng}）を基準に検索リンクを作りました。位置情報は保存されません。` : `Lokasi terdeteksi (${lat}, ${lng}). Tautan peta sudah diarahkan ke kantor pos di sekitar Anda; lokasi tidak disimpan.`;
      button.disabled=false;
    },error=>{
      const messages = {1:ja?"位置情報の許可がありません。地図検索を使ってください。":"Izin lokasi tidak diberikan. Gunakan tombol Cari di peta.",2:ja?"現在地を取得できません。もう一度試してください。":"Lokasi tidak dapat ditemukan. Coba lagi atau gunakan pencarian peta.",3:ja?"位置情報の確認がタイムアウトしました。":"Pendeteksian lokasi terlalu lama. Silakan coba lagi."};
      if(status) status.textContent = messages[error.code] || (ja?"位置情報を取得できませんでした。":"Lokasi tidak dapat dideteksi.");
      button.disabled=false;
    },{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
  },true);

  function install(attempt=0){
    const api = window.__WIKARU_EXTENSION_API;
    if(api?.installBab50Postal){
      api.installBab50Postal({entries,decorateHome,decorateMaterial});
      return;
    }
    if(attempt < 120) setTimeout(()=>install(attempt+1),50);
    else console.warn("Bab 50 postal: aplikasi utama belum siap.");
  }
  install();
})();
