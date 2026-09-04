/* Wikaru first-use quiz guide v1 — one guide per user and quiz type. */
(() => {
  "use strict";

  if (window.__WIKARU_QUIZ_GUIDE_V1) return;
  window.__WIKARU_QUIZ_GUIDE_V1 = true;

  const VERSION = "v1";
  const MODES = new Set(["study","listening","shadowing","speed","number","marker","duration","counter"]);
  const memorySeen = new Set();
  let root = null;
  let activeMode = "study";
  let priorFocus = null;
  let pausedByGuide = false;
  let pendingContinue = null;
  let suppressAutoMode = "";

  const COPY = {
    id: {
      study:{title:"Mode Belajar",lead:"Pelajari setiap kartu dengan tenang, lalu nilai pemahamanmu dengan jujur.",tip:"Pilihan Benar atau Salah membantu Wikaru menyiapkan latihan berikutnya.",steps:[["fa-eye","Amati pertanyaan","Baca sisi depan kartu, lalu pikirkan jawabannya terlebih dahulu."],["fa-rotate","Balik kartu","Ketuk atau klik kartu untuk melihat jawaban, cara baca, dan arti."],["fa-circle-check","Nilai pemahaman","Pilih Benar jika sudah paham, atau Salah jika kartu perlu diulang."]]},
      listening:{title:"Dengar & Tebak",lead:"Latih telinga dengan mendengarkan pelafalan sebelum melihat jawabannya.",tip:"Gunakan headphone dan jangan buru-buru membalik kartu agar latihan mendengar lebih efektif.",steps:[["fa-headphones","Dengarkan audio","Fokus pada bunyi, panjang vokal, dan perubahan pelafalan."],["fa-brain","Tebak kosakata","Ucapkan atau pikirkan jawabannya sebelum membuka kartu."],["fa-rotate","Periksa jawaban","Balik kartu, dengarkan ulang, lalu pilih Benar atau Salah."]]},
      shadowing:{title:"Shadowing",lead:"Tirukan pelafalan Jepang sedekat mungkin dengan contoh suara yang diputar.",tip:"Jika mikrofon tidak tersedia, kamu tetap dapat berlatih dengan mendengar dan menirukan secara manual.",steps:[["fa-volume-high","Dengar contoh","Perhatikan ritme, intonasi, dan panjang pendek bunyi."],["fa-microphone-lines","Tirukan langsung","Ucapkan kembali tanpa jeda panjang setelah suara contoh."],["fa-wave-square","Periksa hasil","Lihat respons mikrofon atau nilai sendiri setelah membuka jawaban."]]},
      speed:{title:"Tantangan Cepat",lead:"Uji daya ingat dengan batas waktu pada setiap kartu.",tip:"Utamakan ketepatan. Ketuk timer di bagian atas jika kamu perlu berhenti sementara.",steps:[["fa-stopwatch","Perhatikan timer","Sisa waktu setiap kartu selalu terlihat di bagian atas halaman kuis."],["fa-bolt","Jawab dengan sigap","Pikirkan jawaban, balik kartu, lalu tentukan hasilnya."],["fa-chart-line","Jaga konsistensi","Kecepatan dan ketepatan akan tercatat dalam ringkasan latihan."]]},
      number:{title:"Kuis Kata Bilangan",lead:"Berlatih membaca angka Jepang melalui ketikan atau jawaban suara.",tip:"Mulai mengetik akan menghentikan mikrofon agar kedua metode jawaban tidak saling mengganggu.",steps:[["fa-arrow-right-arrow-left","Ikuti arah soal","Perhatikan apakah soal meminta angka ke hiragana atau sebaliknya."],["fa-keyboard","Ketik atau ucapkan","Gunakan hiragana untuk cara baca, atau digit untuk jawaban angka."],["fa-3","Maksimal tiga percobaan","Periksa petunjuk setelah salah dan perbaiki jawaban sebelum percobaan habis."]]},
      marker:{title:"Kuis Penanda Waktu",lead:"Latih jam, menit, hari, tanggal, dan bacaan khusus dalam beberapa bentuk soal.",tip:"Bahasa pengenalan suara mengikuti bentuk jawaban yang sedang diminta.",steps:[["fa-clock","Kenali jenis waktu","Perhatikan kelompok dan bentuk soal pada bagian atas kartu."],["fa-microphone","Jawab dengan tepat","Ketik jawaban atau gunakan suara sesuai bahasa yang ditampilkan."],["fa-lightbulb","Pelajari pengecualian","Gunakan petunjuk untuk bacaan menit, tanggal, dan bentuk khusus."]]},
      duration:{title:"Kuis Durasi & Jangka Waktu",lead:"Fokus pada lama waktu: jam, hari, minggu, bulan, dan tahun.",tip:"Bedakan penanda waktu kejadian dengan durasi berlangsungnya suatu kegiatan.",steps:[["fa-hourglass-half","Baca konteks durasi","Perhatikan unit waktu dan bentuk yang diminta pada soal."],["fa-keyboard","Masukkan jawaban","Ketik atau ucapkan cara baca Jepang yang sesuai."],["fa-rotate-right","Ulangi perubahan bunyi","Catat bentuk khusus yang masih salah untuk ditinjau kembali."]]},
      counter:{title:"Kuis Kata Bantu Bilangan",lead:"Latih pemilihan penghitung Jepang melalui flashcard atau kalimat rumpang.",tip:"Pada mode kalimat rumpang, periksa hasil pengenalan suara sebelum menekan Periksa Jawaban.",steps:[["fa-layer-group","Lihat kelompok benda","Perhatikan benda dan kata bantu bilangan yang sedang diuji."],["fa-pen-to-square","Isi bentuk yang benar","Jawab dalam hiragana melalui ketikan atau suara Jepang."],["fa-circle-check","Periksa dan lanjutkan","Baca umpan balik, lalu lanjutkan setelah memahami perubahan bunyinya."]]}
    },
    ja: {
      study:{title:"学習モード",lead:"カードを落ち着いて確認し、自分の理解度を正直に記録します。",tip:"正解・不正解の記録は、次回の適応型練習に使用されます。",steps:[["fa-eye","問題を見る","カードの表を読み、まず自分で答えを考えます。"],["fa-rotate","カードをめくる","カードをクリックして答え、読み方、意味を確認します。"],["fa-circle-check","理解度を記録","覚えていれば正解、復習が必要なら不正解を選びます。"]]},
      listening:{title:"聞いて当てる",lead:"答えを見る前に発音を聞き、耳から語彙を思い出します。",tip:"ヘッドホンを使い、すぐにカードをめくらず音に集中しましょう。",steps:[["fa-headphones","音声を聞く","長音や発音の変化に注意して聞きます。"],["fa-brain","語彙を考える","カードを開く前に答えを言うか頭で考えます。"],["fa-rotate","答えを確認","カードをめくり、もう一度聞いて正誤を記録します。"]]},
      shadowing:{title:"シャドーイング",lead:"お手本の音声に続いて、できるだけ近い発音でまねします。",tip:"マイクが使えない場合も、聞いてまねする練習は続けられます。",steps:[["fa-volume-high","お手本を聞く","リズム、イントネーション、音の長さを確認します。"],["fa-microphone-lines","すぐにまねする","お手本のあとに間を空けず発音します。"],["fa-wave-square","結果を確認","音声認識または自己評価で理解度を記録します。"]]},
      speed:{title:"スピード挑戦",lead:"各カードの制限時間内に、記憶と正確さを試します。",tip:"速さより正確さを優先し、必要なときは一時停止を使えます。",steps:[["fa-stopwatch","時間を見る","操作パネルでカードごとの残り時間を確認します。"],["fa-bolt","すばやく答える","答えを考え、カードをめくって正誤を選びます。"],["fa-chart-line","安定して続ける","速さと正確さは結果に記録されます。"]]},
      number:{title:"数詞クイズ",lead:"入力または音声で、日本語の数字の読み方を練習します。",tip:"入力を始めると、音声回答との競合を防ぐためマイクが停止します。",steps:[["fa-arrow-right-arrow-left","問題の方向を見る","数字からひらがな、または逆方向か確認します。"],["fa-keyboard","入力または発話","読み方はひらがな、数値は数字で答えます。"],["fa-3","3回まで挑戦","ヒントを確認し、3回以内に答えを修正します。"]]},
      marker:{title:"時の表現クイズ",lead:"時刻、分、曜日、日付、特別な読み方を練習します。",tip:"音声認識の言語は、求められる答えに合わせて切り替わります。",steps:[["fa-clock","時間の種類を見る","カード上部のグループと問題形式を確認します。"],["fa-microphone","正しく答える","表示された言語に合わせて入力または発話します。"],["fa-lightbulb","例外を覚える","分や日付などの特別な読み方をヒントで確認します。"]]},
      duration:{title:"時間・期間クイズ",lead:"時間、日、週、月、年など、継続する長さを練習します。",tip:"出来事の時点を表す言葉と、続いた期間を区別しましょう。",steps:[["fa-hourglass-half","期間を見る","問題の単位と求められる形を確認します。"],["fa-keyboard","答えを入力","正しい日本語の読み方を入力または発話します。"],["fa-rotate-right","音の変化を復習","間違えた特別な形をもう一度確認します。"]]},
      counter:{title:"助数詞クイズ",lead:"フラッシュカードや穴埋め文で、日本語の助数詞を練習します。",tip:"穴埋めでは、確認ボタンを押す前に音声認識の結果を確認してください。",steps:[["fa-layer-group","物のグループを見る","対象の物と助数詞の種類を確認します。"],["fa-pen-to-square","正しい形を入れる","ひらがな入力または日本語音声で答えます。"],["fa-circle-check","確認して進む","フィードバックを読み、音の変化を理解して次へ進みます。"]]}
    }
  };

  const STEP_ICON_MAP = Object.freeze({
    "fa-eye":"guide","fa-rotate":"direction","fa-circle-check":"understand",
    "fa-headphones":"hana","fa-brain":"understand","fa-volume-high":"hana",
    "fa-microphone-lines":"speech","fa-wave-square":"statistics","fa-stopwatch":"timer",
    "fa-bolt":"understand","fa-chart-line":"statistics","fa-arrow-right-arrow-left":"direction",
    "fa-keyboard":"notes","fa-3":"chapter","fa-clock":"timer","fa-microphone":"speech",
    "fa-lightbulb":"understand","fa-hourglass-half":"timer","fa-rotate-right":"direction",
    "fa-layer-group":"section","fa-pen-to-square":"notes"
  });
  function guideIconMarkup(fontAwesomeClass){
    const key=STEP_ICON_MAP[fontAwesomeClass] || "guide";
    return window.WIKARU_ICON_ASSETS?.markup?.(key,"wk-guide-step-mark") || `<i class="fa-solid ${fontAwesomeClass}" aria-hidden="true"></i>`;
  }

  function language() { return String(document.documentElement.lang || "id").startsWith("ja") ? "ja" : "id"; }
  function ui(idText,jaText) { return language() === "ja" ? jaText : idText; }
  function normalizeMode(value) { return MODES.has(value) ? value : "study"; }
  function modeCopy(mode) { return COPY[language()][normalizeMode(mode)] || COPY[language()].study; }
  function identity() {
    const session = window.WIKARU_APP?.getSession?.() || {};
    const raw = `${session.username || "guest"}|${session.group || session.role || "default"}`.toLowerCase();
    return encodeURIComponent(raw).slice(0,120);
  }
  function storageKey(mode) { return `wikaru_quiz_guide_${VERSION}_${identity()}_${normalizeMode(mode)}`; }
  function isSeen(mode) {
    const key = storageKey(mode);
    if (memorySeen.has(key)) return true;
    try { return localStorage.getItem(key) === "seen"; } catch (_) { return false; }
  }
  function markSeen(mode) {
    const key = storageKey(mode);
    memorySeen.add(key);
    try { localStorage.setItem(key,"seen"); } catch (_) {}
  }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement("section");
    root.className = "wk-quiz-guide";
    root.id = "wikaruQuizGuide";
    root.hidden = true;
    root.setAttribute("role","dialog");
    root.setAttribute("aria-modal","true");
    root.setAttribute("aria-labelledby","wkQuizGuideTitle");
    root.innerHTML = `
      <div class="wk-quiz-guide-backdrop" aria-hidden="true"></div>
      <article class="wk-quiz-guide-card" tabindex="-1">
        <button class="wk-quiz-guide-close" type="button" data-qg-close aria-label="${ui("Tutup petunjuk","ガイドを閉じる")}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <header class="wk-quiz-guide-head">
          <figure class="wk-quiz-guide-mascot"><img src="./assets/generated/seal-guide-clean-v39u1.png?v=20260903-v39u1" alt="${ui("Maskot anjing laut Wikaru","Wikaruのアザラシマスコット")}" width="512" height="512" decoding="async"></figure>
          <div class="wk-quiz-guide-heading-copy"><span class="wk-quiz-guide-kicker"><i class="fa-solid fa-circle-question" aria-hidden="true"></i><span data-qg-kicker></span></span><h2 class="wk-quiz-guide-title" id="wkQuizGuideTitle"></h2></div>
        </header>
        <p class="wk-quiz-guide-lead"></p>
        <div class="wk-quiz-guide-steps"></div>
        <aside class="wk-quiz-guide-tip"><span class="wk-quiz-guide-tip-icon" aria-hidden="true">${window.WIKARU_ICON_ASSETS?.markup?.("understand","wk-guide-tip-mark") || '<i class="fa-solid fa-lightbulb"></i>'}</span><span class="wk-quiz-guide-tip-copy"></span></aside>
        <footer class="wk-quiz-guide-actions"><button class="wk-quiz-guide-button" type="button" data-qg-later></button><button class="wk-quiz-guide-button primary" type="button" data-qg-continue></button></footer>
      </article>`;
    document.body.appendChild(root);
    root.addEventListener("click",event => {
      if (event.target.closest("[data-qg-close],[data-qg-later]")) closeGuide(false);
      if (event.target.closest("[data-qg-continue]")) closeGuide(true);
    });
    root.addEventListener("keydown",trapFocus);
    return root;
  }

  function maybePauseQuiz() {
    const page = document.getElementById("quizPage");
    const button = document.getElementById("pauseBtn");
    if (!page?.classList.contains("active") || !button || document.body.matches(".number-quiz-active,.marker-quiz-active,.duration-quiz-active,.counter-quiz-active")) return false;
    const label = button.textContent.trim().toLowerCase();
    if (/lanjut|resume|再開/.test(label)) return false;
    button.click();
    return true;
  }

  function resumeQuizIfNeeded() {
    if (!pausedByGuide) return;
    pausedByGuide = false;
    const button = document.getElementById("pauseBtn");
    const label = button?.textContent.trim().toLowerCase() || "";
    if (/lanjut|resume|再開/.test(label)) button.click();
  }

  function render(mode,{firstRun=false,intercepted=false}={}) {
    const panel = ensureRoot();
    const data = modeCopy(mode);
    panel.dataset.mode = normalizeMode(mode);
    panel.querySelector("[data-qg-kicker]").textContent = firstRun ? ui("Petunjuk pertama kali","初回ガイド") : ui("Petunjuk kuis","クイズガイド");
    panel.querySelector(".wk-quiz-guide-title").textContent = data.title;
    panel.querySelector(".wk-quiz-guide-lead").textContent = data.lead;
    panel.querySelector(".wk-quiz-guide-tip-copy").textContent = data.tip;
    panel.querySelector(".wk-quiz-guide-steps").innerHTML = data.steps.map(([icon,title,copy],index) => `<article class="wk-quiz-guide-step"><span class="wk-quiz-guide-step-icon">${guideIconMarkup(icon)}</span><strong>${index + 1}. ${title}</strong><p>${copy}</p></article>`).join("");
    panel.querySelector("[data-qg-later]").textContent = intercepted ? ui("Lewati dulu","あとで") : ui("Tutup","閉じる");
    panel.querySelector("[data-qg-continue]").textContent = intercepted ? ui("Mengerti, mulai","わかった、開始") : ui("Mengerti","わかりました");
    panel.querySelector("[data-qg-continue]").hidden = !firstRun && !intercepted;
    panel.querySelector("[data-qg-close]").setAttribute("aria-label",ui("Tutup petunjuk","ガイドを閉じる"));
    panel.querySelector(".wk-quiz-guide-mascot img").alt = ui("Maskot anjing laut Wikaru","Wikaruのアザラシマスコット");
  }

  function showGuide(mode,{firstRun=false,intercepted=false,onContinue=null,pause=true}={}) {
    const panel = ensureRoot();
    if (!panel.hidden) return;
    activeMode = normalizeMode(mode);
    pendingContinue = typeof onContinue === "function" ? onContinue : null;
    priorFocus = document.activeElement;
    pausedByGuide = pause ? maybePauseQuiz() : false;
    render(activeMode,{firstRun,intercepted});
    panel.hidden = false;
    document.body.classList.add("wk-quiz-guide-open");
    requestAnimationFrame(() => panel.querySelector(".wk-quiz-guide-card")?.focus({preventScroll:true}));
  }

  function closeGuide(continueAction) {
    const panel = ensureRoot();
    if (panel.hidden) return;
    const callback = pendingContinue;
    pendingContinue = null;
    if (continueAction) markSeen(activeMode);
    panel.hidden = true;
    document.body.classList.remove("wk-quiz-guide-open");
    resumeQuizIfNeeded();
    if (continueAction && callback) callback();
    else if (priorFocus?.isConnected) priorFocus.focus({preventScroll:true});
    priorFocus = null;
  }

  function trapFocus(event) {
    if (event.key === "Escape") { event.preventDefault(); closeGuide(false); return; }
    if (event.key !== "Tab") return;
    const focusable = [...root.querySelectorAll("button:not([hidden]):not(:disabled),[tabindex='0']")].filter(node => node.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function triggerMode(trigger) {
    if (trigger.matches("[data-start-number-quiz]")) return "number";
    if (trigger.matches("[data-start-marker-quiz]")) return "marker";
    if (trigger.matches("[data-start-duration-quiz]")) return "duration";
    if (trigger.matches("[data-counter-start]")) return "counter";
    if (trigger.matches("[data-quiz-mode-pick]")) return normalizeMode(trigger.dataset.quizModePick);
    const selected = document.getElementById("modeSelect")?.value;
    let stored = "";
    try { stored = localStorage.getItem("wikaru_quiz_mode") || ""; } catch (_) {}
    return normalizeMode(selected || stored || "study");
  }

  function ensureHelpButton() {
    let button = document.getElementById("wkQuizHelpButton");
    if (button) return button;
    button = document.createElement("button");
    button.id = "wkQuizHelpButton";
    button.className = "wk-quiz-help";
    button.type = "button";
    button.hidden = true;
    button.innerHTML = '<i class="fa-solid fa-circle-question" aria-hidden="true"></i><span></span>';
    button.addEventListener("click",() => showGuide(activeMode,{firstRun:false,pause:true}));
    const page = document.getElementById("quizPage");
    let slot = document.getElementById("wkQuizHelpSlot");
    if (!slot && page) {
      slot = document.createElement("div");
      slot.id = "wkQuizHelpSlot";
      slot.className = "wk-quiz-help-slot";
      const grid = page.querySelector(":scope > .quiz-grid");
      page.insertBefore(slot, grid || page.firstChild);
    }
    (slot || page || document.body).appendChild(button);
    updateHelpButton();
    return button;
  }

  function updateHelpButton() {
    const button = ensureHelpButton();
    button.querySelector("span").textContent = ui("Petunjuk kuis","遊び方");
    button.setAttribute("aria-label",ui(`Buka petunjuk ${modeCopy(activeMode).title}`,`${modeCopy(activeMode).title}のガイドを開く`));
  }

  function syncHelpVisibility() {
    const button = ensureHelpButton();
    const page = document.getElementById("quizPage");
    button.hidden = !(page?.classList.contains("active") && !page.hidden);
  }

  function bind() {
    ensureRoot();
    ensureHelpButton();
    syncHelpVisibility();

    document.addEventListener("click",event => {
      const trigger = event.target.closest?.("#startQuizFromSettings,[data-start-number-quiz],[data-start-marker-quiz],[data-start-duration-quiz],[data-counter-start],[data-quiz-mode-pick]");
      if (!trigger) return;
      if (trigger.dataset.wkQuizGuideBypass === "1") { delete trigger.dataset.wkQuizGuideBypass; return; }
      const mode = triggerMode(trigger);
      if (isSeen(mode)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showGuide(mode,{firstRun:true,intercepted:true,pause:trigger.matches("[data-quiz-mode-pick]"),onContinue:() => {
        suppressAutoMode = mode;
        trigger.dataset.wkQuizGuideBypass = "1";
        trigger.click();
      }});
    },true);

    document.addEventListener("wikaru:quiz-started",event => {
      const mode = normalizeMode(event.detail?.mode);
      activeMode = mode;
      updateHelpButton();
      requestAnimationFrame(syncHelpVisibility);
      if (suppressAutoMode === mode) { suppressAutoMode = ""; return; }
      if (!isSeen(mode)) showGuide(mode,{firstRun:true,intercepted:false,pause:true});
    });

    document.addEventListener("click",event => {
      if (event.target.closest?.("[data-page],.bottom-item,#homeBtn,#materialBtn,#resultBtn")) requestAnimationFrame(syncHelpVisibility);
    });
    const quizPage = document.getElementById("quizPage");
    if (quizPage) new MutationObserver(syncHelpVisibility).observe(quizPage,{attributes:true,attributeFilter:["class","hidden"]});
    new MutationObserver(() => {
      updateHelpButton();
      if (root && !root.hidden) render(activeMode,{firstRun:!isSeen(activeMode),intercepted:Boolean(pendingContinue)});
    }).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  }

  window.WikaruQuizGuide = Object.freeze({
    open(mode=activeMode){ showGuide(normalizeMode(mode),{firstRun:false,pause:true}); },
    reset(mode=activeMode){
      const key = storageKey(mode);
      memorySeen.delete(key);
      try { localStorage.removeItem(key); } catch (_) {}
    },
    modes:Object.freeze([...MODES])
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",bind,{once:true});
  else bind();
})();
