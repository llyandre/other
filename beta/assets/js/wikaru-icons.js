/* Wikaru Kotoba Marks v39 — 16 transparent marks extracted from the approved reference. */
(() => {
  "use strict";
  if (window.WIKARU_ICON_ASSETS) return;

  const ASSET_BASE = "./assets/icons/wikaru/";
  const ASSET_VERSION = "?v=20260903-v39u1";
  const VALID = new Set(["identity","notes","hana","momo","ren","kaito","statistics","understand","direction","shuffle","chapter","section","word-type","speech","timer","guide"]);
  const VOICE = {hanamama:"hana",momokawaii:"momo",renikebo:"ren",kaitodandy:"kaito"};

  function iconName(name){ return VALID.has(name) ? name : "guide"; }
  function markup(name,className=""){
    const key=iconName(name);
    return `<img class="wk-kotoba-icon ${className}" data-wk-icon="${key}" src="${ASSET_BASE}${key}-64.png${ASSET_VERSION}" alt="" width="64" height="64" loading="eager" decoding="async" aria-hidden="true">`;
  }
  function shell(node,name){
    if(!node) return;
    const key=iconName(name);
    node.classList.add("wk-kotoba-shell");
    let icon=node.querySelector(":scope > .wk-kotoba-icon");
    if(icon?.dataset.wkIcon===key) return;
    icon?.remove();
    node.insertAdjacentHTML(node.matches("button") ? "afterbegin" : "beforeend",markup(key));
  }
  function heading(node,name){
    if(!node) return;
    const key=iconName(name);
    let mark=node.querySelector(":scope > .wk-kotoba-heading-mark");
    if(!mark){
      mark=document.createElement("span");
      mark.className="wk-kotoba-heading-mark";
      mark.setAttribute("aria-hidden","true");
      node.prepend(mark);
    }
    shell(mark,key);
  }
  function currentVoice(){
    const value=document.getElementById("voicePresetSelect")?.value || "hanamama";
    return VOICE[value] || "hana";
  }
  function decorate(selector,name,root=document){
    root.querySelectorAll?.(selector).forEach(node=>shell(node,name));
  }
  function apply(root=document){
    const q=(selector,scope=root)=>scope.querySelector?.(selector);
    const qa=(selector,scope=root)=>Array.from(scope.querySelectorAll?.(selector)||[]);

    shell(q("#loginModal .login-icon"),"identity");
    heading(q("#materialPage .content-card > h2"),"notes");
    heading(q('#materialPage aside h3[data-i18n="studyStats"]'),"statistics");
    const materialNotice=q("#materialPage .notice");
    if(materialNotice){
      const icon=materialNotice.querySelector(":scope > .wk-kotoba-icon");
      if(!icon) materialNotice.querySelector(":scope > i")?.insertAdjacentHTML("afterend",markup("understand"));
    }

    const quizSteps=["direction","shuffle","chapter","section","word-type"];
    qa("#quizSettingsModal [data-quiz-step]").forEach((step,index)=>shell(step.querySelector("h3 .soft-step-icon"),quizSteps[index]||"chapter"));
    const setupSteps=["direction","chapter","section","word-type"];
    qa("#setupModal [data-setup-step]").forEach((step,index)=>shell(step.querySelector("h3 .soft-step-icon"),setupSteps[index]||"chapter"));
    qa('#quizSettingsModal [data-shuffle="true"] .option-soft-icon').forEach(node=>shell(node,"shuffle"));
    qa('#quizSettingsModal [data-shuffle="false"] .option-soft-icon').forEach(node=>shell(node,"chapter"));

    qa("[data-voice-preset]").forEach(button=>{
      const key=VOICE[button.dataset.voicePreset]||"hana";
      shell(button,key);
    });
    qa("[data-marker-voice],[data-duration-voice]").forEach(button=>{
      const preset=button.dataset.markerVoice||button.dataset.durationVoice||"hanamama";
      shell(button,VOICE[preset]||"hana");
    });
    shell(q("#voiceProfileCard .voice-profile-icon"),currentVoice());
    shell(q("#micBox .mic-icon"),"speech");
    shell(q("#exampleBtn"),"notes");

    const timer=q("#timerText");
    const metric=timer?.closest(".metric");
    if(metric && !metric.querySelector(":scope > .timer-pebble-mark")){
      const mark=document.createElement("span");
      mark.className="timer-pebble-mark";
      mark.setAttribute("aria-hidden","true");
      mark.innerHTML=markup("timer");
      metric.prepend(mark);
    }
    qa(".wk-question-limit-badge").forEach(badge=>{
      if(!badge.querySelector(":scope > .wk-kotoba-icon")) badge.insertAdjacentHTML("afterbegin",markup("timer"));
    });
    shell(q("#wkQuestionTimer"),"timer");
    shell(q("#wkQuizSettings"),"guide");

    shell(q("#wkQuizHelpButton"),"guide");
    const kicker=q(".wk-quiz-guide-kicker");
    if(kicker && !kicker.querySelector(":scope > .wk-kotoba-icon")) kicker.querySelector(":scope > i")?.insertAdjacentHTML("afterend",markup("guide"));

    qa(".example-modal-head").forEach(head=>{
      const title=head.querySelector("h2")?.textContent||"";
      if(/Catatan Kosakata|語彙メモ/i.test(title)) shell(head.querySelector(".example-icon"),"notes");
    });

    heading(q("#learningPage .wk-learning-head h2"),"understand");
    heading(q("#resultPage .result-head h2"),"statistics");
    heading(q("#adminPage .admin-title-row h2"),"statistics");
    shell(q("#pdfFilterModal .kana-icon"),"statistics");

    /* Apply only the reference-approved marks to matching semantic controls. */
    decorate(".top-nav [data-page='material'],.bottom-nav [data-page='material']","chapter");
    decorate(".top-nav [data-action='openQuizSettings'],.bottom-nav [data-action='openQuizSettings']","understand");
    decorate(".top-nav [data-page='result'],.bottom-nav [data-page='result'],#bottomResultBtn","statistics");
    decorate("#userMenuBtn,#openLogin","identity");
    decorate("#changeLanguage,#languageToggle,[data-action='changeLanguage']","direction");
    decorate("#changeCategory,[data-action='changeCategory']","section");
    decorate("#openQuizSettings,#startQuizBtn,[data-action='openQuizSettings']","understand");
    decorate("#seeMaterialBtn,[data-page='material']","chapter");
    decorate("#resetAdminFilter,#resetPdfFilter","shuffle");
    decorate("#loginModal .field-label","identity");
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply(document);});
  }
  window.WIKARU_ICON_ASSETS=Object.freeze({assetBase:ASSET_BASE,version:ASSET_VERSION,names:Object.freeze([...VALID]),markup,apply:schedule});
  document.addEventListener("wikaru:voice-preset-changed",schedule);
  document.addEventListener("change",event=>{if(event.target?.id==="voicePresetSelect") schedule();});
  document.addEventListener("click",event=>{
    if(event.target.closest?.("[data-action='openQuizSettings'],#openLogin,#userMenuBtn,[data-voice-preset],[data-marker-voice],[data-duration-voice]")) requestAnimationFrame(schedule);
  },true);
  const start=()=>{
    apply(document);
    const app=document.querySelector(".app")||document.body;
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();
