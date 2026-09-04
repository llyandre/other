/* Wikaru v39 — applies the approved reference visuals to the live application DOM. */
(() => {
  "use strict";
  if (window.__WIKARU_DEPLOY_V39) return;
  window.__WIKARU_DEPLOY_V39 = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const BUILD = "20260903-v39u1";
  const SEAL_UPRIGHT = `./assets/generated/seal-guide-clean-v39u1.png?v=${BUILD}`;
  const MASCOT_BY_EXPRESSION = Object.freeze({
    welcome:`./assets/mascot/v38/seal-welcome-v38.png?v=${BUILD}`,
    "sad-week":`./assets/mascot/v38/seal-sad-week-v38.png?v=${BUILD}`,
    "sad-month":`./assets/mascot/v38/seal-sad-month-v38.png?v=${BUILD}`,
    "sad-year":`./assets/mascot/v38/seal-sad-year-v38.png?v=${BUILD}`,
    "pass-kkm":`./assets/mascot/v38/seal-pass-kkm-v38.png?v=${BUILD}`,
    perfect:`./assets/mascot/v38/seal-perfect-v38.png?v=${BUILD}`,
    streak:`./assets/mascot/v38/seal-streak-v38.png?v=${BUILD}`,
    "rest-angry":`./assets/mascot/v38/seal-rest-angry-v38.png?v=${BUILD}`
  });
  const REGION_ASSETS = Object.freeze({
    Jembrana: `./assets/region-icons/jembrana-128.png?v=${BUILD}`,
    Singaraja: `./assets/region-icons/singaraja-128.png?v=${BUILD}`,
    Badung: `./assets/region-icons/badung-128.png?v=${BUILD}`,
    Umum: `./assets/region-icons/umum-128.png?v=${BUILD}`
  });
  const REGION_ORDER = Object.freeze(["Badung", "Jembrana", "Singaraja", "Umum"]);
  const REGION_KEY = Object.freeze({Badung:"badung",Jembrana:"jembrana",Singaraja:"singaraja",Umum:"umum"});
  const VOICES = Object.freeze({
    hanamama: ["Hana Onee-san", "Hangat & keibuan", "hana"],
    momokawaii: ["Momo Kawaii", "Manis & ceria", "momo"],
    renikebo: ["Ren Ikebo", "Rendah & memikat", "ren"],
    kaitodandy: ["Kaito Dandy", "Tenang & berwibawa", "kaito"]
  });
  let queued = false;

  function isJapanese() {
    return String(document.documentElement.lang || "id").startsWith("ja");
  }

  function ensureHeader() {
    const page = $("#quizPage");
    const grid = $("#quizPage>.quiz-grid");
    if (!page || !grid) return;
    let header = $("#wkQuizMobileHead");
    if (!header) {
      header = document.createElement("header");
      header.id = "wkQuizMobileHead";
      header.className = "wk-quiz-mobile-head";
      header.innerHTML = `
        <button type="button" class="wk-quiz-head-btn" id="wkQuizExit" aria-label="Keluar dari kuis"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
        <span class="wk-quiz-head-mark" aria-hidden="true">あ</span>
        <div class="wk-quiz-head-copy"><strong id="wkQuizTitle">Kuis Kosakata</strong><small id="wkQuizSubtitle">Pilih jawaban yang paling tepat</small></div>
        <div class="wk-question-progress"><strong id="wkQuizCounter">Kartu 1 dari 1</strong><div class="wk-quiz-head-progress" aria-label="Progres kuis"><span id="wkQuizProgress"></span></div></div>
        <button type="button" class="wk-question-timer" id="wkQuestionTimer" aria-label="Jeda atau lanjutkan timer"><i class="fa-regular fa-clock" aria-hidden="true"></i><span><small>Sisa waktu</small><strong id="wkQuestionTimerText">00:30</strong></span></button>
        <button type="button" class="wk-quiz-head-btn" id="wkQuizSettings" aria-label="Petunjuk kuis"><i class="fa-regular fa-circle-question" aria-hidden="true"></i></button>`;
      page.insertBefore(header, grid);
    }
    const exit = $("#wkQuizExit");
    if (exit && !exit.dataset.wk34Bound) {
      exit.dataset.wk34Bound = "true";
      exit.addEventListener("click", () => {
        if (window.WIKARU_APP?.openPage) window.WIKARU_APP.openPage("home");
        else $("[data-page='home']")?.click();
      });
    }
    const help = $("#wkQuizSettings");
    if (help && !help.dataset.wk34Bound) {
      help.dataset.wk34Bound = "true";
      help.addEventListener("click", () => {
        if (window.WikaruQuizGuide?.open) window.WikaruQuizGuide.open("study");
        else $("#wkQuizHelpButton")?.click();
      });
    }
    const timer = $("#wkQuestionTimer");
    if (timer && !timer.dataset.wk34Bound) {
      timer.dataset.wk34Bound = "true";
      timer.addEventListener("click", () => $("#pauseBtn")?.click());
    }
  }

  function ensureAnswerRow() {
    const panel = $("#quizPage .control-panel");
    const correct = $("#correctBtn");
    const wrong = $("#wrongBtn");
    if (!panel || !correct || !wrong) return;
    const row = correct.closest(".control-row") || correct.parentElement;
    if (!row || !row.contains(wrong)) return;
    row.classList.add("quiz-answer-row");
    if (row.parentElement !== panel) panel.appendChild(row);
  }

  function ensureCardTools() {
    const wrap = $("#quizPage .quiz-card-wrap");
    const flash = $("#flashcard");
    const hear = $("#hearBtn");
    const example = $("#exampleBtn");
    if (!wrap || !flash || !hear || !example) return;
    let tools = $("#wkQuestionCardTools");
    if (!tools) {
      tools = document.createElement("div");
      tools.id = "wkQuestionCardTools";
      tools.className = "wk-question-card-tools";
      tools.innerHTML = `<figure class="wk-question-seal" aria-hidden="true"><img src="${SEAL_UPRIGHT}" alt="" width="512" height="512" decoding="async"></figure><div class="wk-question-audio-slot"></div>`;
      flash.appendChild(tools);
      tools.addEventListener("click", event => event.stopPropagation());
    }
    const seal = $(".wk-question-seal img", tools);
    if (seal && !seal.src.includes(BUILD)) seal.src = SEAL_UPRIGHT;
    const audio = $(".wk-question-audio-slot", tools);
    if (audio && hear.parentElement !== audio) audio.appendChild(hear);
    let exampleSlot = $("#wkQuestionExampleSlot");
    if (!exampleSlot) {
      exampleSlot = document.createElement("div");
      exampleSlot.id = "wkQuestionExampleSlot";
      exampleSlot.className = "wk-question-example-slot";
      wrap.appendChild(exampleSlot);
    }
    if (example.parentElement !== exampleSlot) exampleSlot.appendChild(example);
  }

  function ensureVoiceControls() {
    const card = $("#voiceProfileCard");
    const select = $("#voicePresetSelect");
    if (!card) return;
    let root = $("#voicePresetSwitcher");
    if (!root) {
      root = document.createElement("div");
      root.id = "voicePresetSwitcher";
      root.className = "wk8-voice-switcher";
      root.setAttribute("role", "group");
      card.appendChild(root);
    }
    if (!root.children.length) {
      root.innerHTML = Object.entries(VOICES).map(([value, copy]) => `<button type="button" class="wk8-voice-choice" data-voice-preset="${value}" aria-pressed="false"><span>${copy[0]}</span><small>${copy[1]}</small></button>`).join("");
    }
    $$("[data-voice-preset]", root).forEach(button => {
      const value = button.dataset.voicePreset;
      const copy = VOICES[value];
      if (!copy) return;
      let icon = $(".wk-v34-voice-icon", button);
      if (!icon) {
        icon = document.createElement("img");
        icon.className = "wk-v34-voice-icon";
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        button.prepend(icon);
      }
      const expected = `./assets/icons/wikaru/${copy[2]}-64.png?v=${BUILD}`;
      if (!icon.src.includes(`${copy[2]}.png?v=${BUILD}`)) icon.src = expected;
      const title = $("span", button);
      const note = $("small", button);
      if (title && title.textContent !== copy[0]) title.textContent = copy[0];
      if (note && !isJapanese() && note.textContent !== copy[1]) note.textContent = copy[1];
      if (!button.dataset.wk34Bound) {
        button.dataset.wk34Bound = "true";
        button.addEventListener("click", () => {
          if (select) {
            select.value = value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
          }
          $$("[data-voice-preset]", root).forEach(item => {
            const active = item.dataset.voicePreset === value;
            item.classList.toggle("active", active);
            item.setAttribute("aria-pressed", String(active));
          });
          schedule();
        });
      }
    });
    const selected = select?.value || $("[data-voice-preset][aria-pressed='true']", root)?.dataset.voicePreset || "hanamama";
    $$("[data-voice-preset]", root).forEach(button => {
      const active = button.dataset.voicePreset === selected;
      button.classList.toggle("active", active);
      if (button.getAttribute("aria-pressed") !== String(active)) button.setAttribute("aria-pressed", String(active));
    });

    let heading = $("#wkQuestionVoiceHeading");
    if (!heading) {
      heading = document.createElement("header");
      heading.id = "wkQuestionVoiceHeading";
      heading.className = "wk-question-voice-heading";
      heading.innerHTML = `<span class="wk-question-voice-copy"><strong></strong><small></small></span><button type="button" class="wk-question-voice-toggle" aria-expanded="false" aria-label="Tampilkan semua pilihan suara"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>`;
      card.prepend(heading);
    }
    const active = $("[data-voice-preset][aria-pressed='true']", root) || $("[data-voice-preset]", root);
    const headingTitle = $("strong", heading);
    const headingNote = $("small", heading);
    const headingTitleValue = isJapanese() ? "教材の声を選ぶ" : "Pilih suara materi";
    const headingNoteValue = active ? `${$("span", active)?.textContent || ""} · ${$("small", active)?.textContent || ""}` : "";
    if (headingTitle && headingTitle.textContent !== headingTitleValue) headingTitle.textContent = headingTitleValue;
    if (headingNote && headingNote.textContent !== headingNoteValue) headingNote.textContent = headingNoteValue;
    const toggle = $(".wk-question-voice-toggle", heading);
    if (toggle && !toggle.dataset.wk34Bound) {
      toggle.dataset.wk34Bound = "true";
      toggle.addEventListener("click", () => {
        const expanded = card.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(expanded));
      });
    }
  }

  function textFrom(selector, root) {
    return $(selector, root)?.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  function syncQuestionStack() {
    const front = $("#frontQuestion");
    const answer = $("#answerArea");
    if (!front || !answer || front.querySelector(".audio-first-cue,.shadowing-cue,.quiz-front-image-wrap")) return;
    if ($(".wk-v34-vocab-stack", front)) return;
    const primary = $(".answer-main", answer);
    const japanese = primary?.classList.contains("jp")
      ? primary.textContent.trim()
      : textFrom(".quiz-answer-detail.kanji strong", answer) || textFrom(".quiz-answer-detail.kana strong", answer);
    const romaji = textFrom(".quiz-answer-detail.romaji strong", answer);
    const meaning = textFrom(".quiz-answer-detail.meaning strong", answer) || (!primary?.classList.contains("jp") ? primary?.textContent?.trim() || "" : "");
    if (!japanese || !romaji || !meaning) return;
    const signature = `${japanese}|${romaji}|${meaning}`;
    if (front.dataset.wk34Signature === signature) return;
    const stack = document.createElement("span");
    stack.className = "wk-v34-vocab-stack";
    const jp = document.createElement("strong");
    jp.className = "jp";
    jp.textContent = japanese;
    const reading = document.createElement("b");
    reading.className = "romaji";
    reading.textContent = romaji;
    const translation = document.createElement("span");
    translation.className = "meaning";
    translation.textContent = meaning;
    stack.append(jp, reading, translation);
    front.replaceChildren(stack);
    front.className = "question-text wk-v34-question-stack";
    front.dataset.wk34Signature = signature;
  }

  function syncQuizMeta() {
    const sourceCounter = $("#cardCounter")?.textContent || "";
    const match = sourceCounter.match(/(\d+)\s*(?:\/|dari)\s*(\d+)/i);
    const targetCounter = $("#wkQuizCounter");
    if (match && targetCounter) {
      const value = isJapanese() ? `カード ${match[1]} / ${match[2]}` : `Kartu ${match[1]} dari ${match[2]}`;
      if (targetCounter.textContent !== value) targetCounter.textContent = value;
    }
    const timer = $("#timerText")?.textContent?.trim();
    const targetTimer = $("#wkQuestionTimerText");
    if (timer && targetTimer && targetTimer.textContent !== timer) targetTimer.textContent = timer;
    const progress = $("#quizProgress");
    const targetProgress = $("#wkQuizProgress");
    if (progress && targetProgress) {
      const width = progress.style.width || `${progress.getAttribute("aria-valuenow") || 0}%`;
      if (targetProgress.style.width !== width) targetProgress.style.width = width;
    }
    const label = $("#quizLabel");
    const hint = $("#flipHint")?.textContent || "";
    let direction = isJapanese() ? "日本語 → 意味" : "Kana → Arti";
    if (/kosakata Jepang|日本語を表示/i.test(hint)) direction = isJapanese() ? "意味 → 日本語" : "Arti → Kana";
    else if (/cara baca|読み方/i.test(hint)) direction = isJapanese() ? "漢字 → 読み" : "Kanji → Cara baca";
    if (label && label.textContent !== direction) label.textContent = direction;
    const title = $("#wkQuizTitle");
    const subtitle = $("#wkQuizSubtitle");
    const titleValue = isJapanese() ? "語彙クイズ" : "Kuis Kosakata";
    const subtitleValue = isJapanese() ? "最も適切な答えを選びましょう" : "Pilih jawaban yang paling tepat";
    if (title && title.textContent !== titleValue) title.textContent = titleValue;
    if (subtitle && subtitle.textContent !== subtitleValue) subtitle.textContent = subtitleValue;
  }

  function ensureLoginArtwork() {
    const iconHost = $("#loginModal .login-icon");
    if (iconHost && !$(".wk-v34-ui-icon", iconHost)) {
      const icon = document.createElement("img");
      icon.className = "wk-v34-ui-icon";
      icon.src = `./assets/icons/wikaru/identity-64.png?v=${BUILD}`;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      iconHost.replaceChildren(icon);
    }
    const grid = $("#groupGrid");
    if (!grid?.children.length) return;
    const cards = new Map($$("[data-group]", grid).map(card => [card.dataset.group, card]));
    const currentOrder = $$("[data-group]", grid).map(card => card.dataset.group).join("|");
    if (currentOrder !== REGION_ORDER.filter(name => cards.has(name)).join("|")) {
      REGION_ORDER.forEach(name => { const card = cards.get(name); if (card) grid.appendChild(card); });
    }
    REGION_ORDER.forEach(name => {
      const card = cards.get(name);
      if (!card) return;
      let shell = $(".region-icon-shell", card);
      if (!shell) {
        shell = document.createElement("div");
        shell.className = "region-icon-shell";
        shell.setAttribute("aria-hidden", "true");
        card.prepend(shell);
      }
      let image = $(".wikaru-region-image", shell);
      if (!image) {
        image = document.createElement("img");
        image.className = "wikaru-region-image";
        image.alt = "";
        image.width = 128;
        image.height = 128;
        shell.appendChild(image);
      }
      if (!image.src.includes(REGION_ASSETS[name].split("/").pop().split("?")[0])) image.src = REGION_ASSETS[name];
      const key = REGION_KEY[name];
      image.srcset = `./assets/region-icons/${key}-64.png?v=${BUILD} 64w, ./assets/region-icons/${key}-128.png?v=${BUILD} 128w`;
      image.sizes = "(max-width:760px) 64px, 82px";
    });
    const title = $("#loginModalTitle");
    const description = $("#loginModal .login-head p");
    if (title && !isJapanese() && title.textContent !== "Masuk sebagai Peserta") title.textContent = "Masuk sebagai Peserta";
    if (description && !isJapanese() && description.textContent !== "Masukkan nama dan pilih wilayah agar progres latihan tersimpan rapi.") description.textContent = "Masukkan nama dan pilih wilayah agar progres latihan tersimpan rapi.";
    const groupLabel = $("#groupLabel");
    const groupHelp = $("#groupHelp");
    if (groupLabel && !isJapanese() && groupLabel.textContent.trim() !== "Grup / Wilayah") groupLabel.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i> Grup / Wilayah';
    if (groupHelp && !isJapanese() && groupHelp.textContent !== "Pilih wilayah peserta untuk menyimpan laporan latihan.") groupHelp.textContent = "Pilih wilayah peserta untuk menyimpan laporan latihan.";
  }

  function cleanMascotArtwork() {
    $$(".wk-mascot-notice").forEach(card => {
      const image = $(".wk-mascot-art img", card);
      if (!image) return;
      const expression = card.dataset.expression || "welcome";
      const source = MASCOT_BY_EXPRESSION[expression] || SEAL_UPRIGHT;
      if (!image.src.includes(source.split("/").pop())) image.src = source;
    });
    const guideImage = $(".wk-quiz-guide-mascot img");
    if (guideImage && !guideImage.src.includes(`seal-guide-clean-v39u1.png?v=${BUILD}`)) guideImage.src = SEAL_UPRIGHT;
  }

  function updateMicCopy() {
    const title = $("#micBox [data-i18n='speechFeature']");
    const help = $("#speechHelp");
    if (title && !isJapanese() && title.textContent !== "Fungsi Bicara") title.textContent = "Fungsi Bicara";
    if (help && !isJapanese() && help.textContent !== "Aktifkan mikrofon untuk menjawab dengan suara.") help.textContent = "Aktifkan mikrofon untuk menjawab dengan suara.";
  }

  function apply() {
    queued = false;
    document.documentElement.classList.add("wk-v39-deployed");
    ensureHeader();
    ensureAnswerRow();
    ensureCardTools();
    ensureVoiceControls();
    syncQuestionStack();
    syncQuizMeta();
    ensureLoginArtwork();
    cleanMascotArtwork();
    updateMicCopy();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function bind() {
    apply();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "aria-pressed", "style", "src"] });
    document.addEventListener("wikaru:quiz-started", schedule);
    document.addEventListener("wikaru:voice-preset-changed", schedule);
    document.addEventListener("wikaru:language-changed", schedule);
    window.addEventListener("pageshow", schedule);
    [80, 260, 720, 1600].forEach(delay => window.setTimeout(schedule, delay));
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        registration?.update?.();
        registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
      }).catch(() => {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
