/* Wikaru question page composition — mirrors the approved desktop/iPad/mobile concept. */
(() => {
  "use strict";
  if (window.__WIKARU_QUESTION_PAGE_FINAL_V1) return;
  window.__WIKARU_QUESTION_PAGE_FINAL_V1 = true;
  const $=(selector,root=document)=>root.querySelector(selector);
  const isJa=()=>String(document.documentElement.lang||"id").startsWith("ja");
  const VOICE_COPY_ID={
    hanamama:"Hangat & keibuan",
    momokawaii:"Manis & ceria",
    renikebo:"Rendah & memikat",
    kaitodandy:"Tenang & berwibawa"
  };
  let queued=false;

  function ensureCardTools(){
    const wrap=$("#quizPage .quiz-card-wrap"),flash=$("#flashcard"),hear=$("#hearBtn"),example=$("#exampleBtn");
    if(!wrap||!flash||!hear||!example)return;
    let tools=$("#wkQuestionCardTools");
    if(!tools){
      tools=document.createElement("div");tools.id="wkQuestionCardTools";tools.className="wk-question-card-tools";
      tools.innerHTML='<figure class="wk-question-seal" aria-hidden="true"><img src="./assets/generated/seal-guide-clean-v39u1.png?v=20260903-v39u1" alt="" width="512" height="512" decoding="async"></figure><div class="wk-question-audio-slot"></div>';
      flash.appendChild(tools);
      tools.addEventListener("click",event=>event.stopPropagation());
    }
    const audioSlot=$(".wk-question-audio-slot",tools);
    if(hear.parentElement!==audioSlot)audioSlot.appendChild(hear);
    let exampleSlot=$("#wkQuestionExampleSlot");
    if(!exampleSlot){exampleSlot=document.createElement("div");exampleSlot.id="wkQuestionExampleSlot";exampleSlot.className="wk-question-example-slot";wrap.appendChild(exampleSlot);}
    if(example.parentElement!==exampleSlot)exampleSlot.appendChild(example);
  }

  function ensureVoiceHeading(){
    const card=$("#voiceProfileCard");if(!card)return;
    let heading=$("#wkQuestionVoiceHeading");
    if(!heading){
      heading=document.createElement("header");heading.id="wkQuestionVoiceHeading";heading.className="wk-question-voice-heading";
      heading.innerHTML='<span class="wk-question-voice-copy"><strong></strong><small></small></span><button type="button" class="wk-question-voice-toggle" aria-expanded="false" aria-label="Tampilkan semua pilihan suara"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>';
      card.prepend(heading);
    }
    const toggle=$(".wk-question-voice-toggle",heading);
    if(toggle&&!toggle.dataset.bound){
      toggle.dataset.bound="true";
      toggle.addEventListener("click",()=>{
        const expanded=card.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded",String(expanded));
        toggle.setAttribute("aria-label",expanded?"Sembunyikan pilihan suara":"Tampilkan semua pilihan suara");
      });
    }
    const active=$("#voicePresetSwitcher [aria-pressed='true']")||$("#voicePresetSwitcher .active");
    $("strong",heading).textContent=isJa()?"教材の声を選ぶ":"Pilih suara materi";
    $("small",heading).textContent=active
      ? `${$("span",active)?.textContent||""} · ${$("small",active)?.textContent||""}`
      : (isJa()?"花お姉さん · やさしく包み込む声":"Hana Onee-san · Dewasa, lembut, dan keibuan");
  }

  function refineVoiceCards(){
    if(isJa())return;
    document.querySelectorAll("#voicePresetSwitcher [data-voice-preset]").forEach(button=>{
      const description=VOICE_COPY_ID[button.dataset.voicePreset];
      const small=$("small",button);
      if(description&&small)small.textContent=description;
    });
  }

  function refineHeader(){
    const source=$("#cardCounter"),target=$("#wkQuizCounter");
    if(!source||!target)return;
    const match=source.textContent.match(/(\d+)\s*(?:\/|dari)\s*(\d+)/i);
    if(match)target.textContent=isJa()?`カード ${match[1]} / ${match[2]}`:`Kartu ${match[1]} dari ${match[2]}`;
  }

  function refineCopy(){
    const speechHelp=$("#speechHelp");if(speechHelp)speechHelp.textContent=isJa()?"マイクをオンにすると、声で答えられます。":"Aktifkan mikrofon untuk menjawab dengan suara.";
    const featureTitle=$("#micBox [data-i18n='speechFeature']");if(featureTitle)featureTitle.textContent=isJa()?"音声回答":"Fungsi Bicara";
    const micSwitch=$("#micSwitch");if(micSwitch)micSwitch.setAttribute("aria-pressed",String(micSwitch.classList.contains("on")));
    const modeHint=$("#quizModeHint");
    if(modeHint&&!modeHint.textContent.trim())modeHint.textContent=isJa()?"答えを考えてからカードを開きましょう。":"Pikirkan jawabannya sebelum membuka kartu.";
  }

  function apply(){
    queued=false;ensureCardTools();refineVoiceCards();ensureVoiceHeading();refineHeader();refineCopy();
    const help=$("#wkQuizHelpSlot");if(help)help.removeAttribute("aria-hidden");
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}
  function bind(){
    apply();
    const page=$("#quizPage");if(page)new MutationObserver(schedule).observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:["class","aria-pressed"]});
    document.addEventListener("wikaru:voice-preset-changed",schedule);
    document.addEventListener("wikaru:language-changed",schedule);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})();
