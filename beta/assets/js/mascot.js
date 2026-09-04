/* Wikaru Seal Mascot v1 — isolated from the learning engine. */
(() => {
  "use strict";

  if (window.__WIKARU_SEAL_MASCOT_V1) return;
  window.__WIKARU_SEAL_MASCOT_V1 = true;

  const VERSION = "v1";
  const PREFIX = `wikaru_mascot_${VERSION}_`;
  const CLOSE_DELAY_MS = 5000;
  const TWENTY_MINUTES_MS = 20 * 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const ASSET_BASE = "./assets/mascot/v38/";
  const GUIDE_ASSET = "./assets/generated/seal-guide-clean-v39u1.png?v=20260903-v39u1";
  const GUIDE_PREVIEWS = Object.freeze({
    desktop: "./assets/onboarding/wikaru-desktop.webp",
    ipad: "./assets/onboarding/wikaru-ipad.webp",
    mobile: "./assets/onboarding/wikaru-mobile.webp"
  });
  const isPreview = new URLSearchParams(location.search).has("mascotPreview");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const keys = {
    lastVisit: PREFIX + "last_visit_at",
    visitDays: PREFIX + "visit_days",
    achievements: PREFIX + "achievements",
    results: PREFIX + "quiz_results",
    onboarding: PREFIX + "onboarding_completed",
    activeMs: PREFIX + "active_ms",
    hourShown: PREFIX + "hour_shown",
    eyeEnabled: PREFIX + "eye_20_20_20_enabled",
    eyeBlock: PREFIX + "eye_20_20_20_block",
    restShown: PREFIX + "rest_shown"
  };

  const imageByExpression = {
    welcome: "seal-welcome-v38.png?v=20260903-v39u1",
    "sad-week": "seal-sad-week-v38.png?v=20260903-v39u1",
    "sad-month": "seal-sad-month-v38.png?v=20260903-v39u1",
    "sad-year": "seal-sad-year-v38.png?v=20260903-v39u1",
    "pass-kkm": "seal-pass-kkm-v38.png?v=20260903-v39u1",
    perfect: "seal-perfect-v38.png?v=20260903-v39u1",
    streak: "seal-streak-v38.png?v=20260903-v39u1",
    "rest-angry": "seal-rest-angry-v38.png?v=20260903-v39u1"
  };

  const queue = [];
  let root = null;
  let activeNotice = null;
  let guide = null;
  let guideIndex = 0;
  let guideOpen = false;
  let guideStartScroll = 0;
  let priorFocus = null;
  let spotlightObserver = null;
  let pendingGuide = null;
  let sessionActiveMs = 0;

  function localGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function localSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function sessionGet(key, fallback = null) {
    try {
      const value = sessionStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function sessionSet(key, value) {
    try { sessionStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function readArray(key) {
    try {
      const parsed = JSON.parse(localGet(key, "[]"));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function language() {
    const lang = String(document.documentElement.lang || "id").toLowerCase();
    return lang.startsWith("ja") ? "ja" : "id";
  }

  function text(idText, jaText) {
    return language() === "ja" ? jaText : idText;
  }

  function dayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dayBefore(key, amount = 1) {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - amount);
    return dayKey(date);
  }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "wk-mascot-root";
    root.id = "wikaruMascotRoot";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "true");
    document.body.appendChild(root);
    return root;
  }

  function assetUrl(expression) {
    return ASSET_BASE + (imageByExpression[expression] || imageByExpression.welcome);
  }

  function expressionAlt(expression) {
    const map = {
      welcome: ["Maskot anjing laut melambaikan sirip", "手を振るアザラシのマスコット"],
      "sad-week": ["Maskot anjing laut tampak sedih", "悲しそうなアザラシのマスコット"],
      "sad-month": ["Maskot anjing laut menangis karena rindu", "寂しくて泣くアザラシのマスコット"],
      "sad-year": ["Maskot anjing laut sangat sedih", "とても悲しそうなアザラシのマスコット"],
      "pass-kkm": ["Maskot anjing laut sangat senang", "とても喜ぶアザラシのマスコット"],
      perfect: ["Maskot anjing laut melompat gembira", "喜んで跳ねるアザラシのマスコット"],
      streak: ["Maskot anjing laut bangga dengan progres belajar", "学習の継続を喜ぶアザラシのマスコット"],
      "rest-angry": ["Maskot anjing laut mengingatkan dengan tegas", "休憩を促すアザラシのマスコット"]
    };
    const pair = map[expression] || map.welcome;
    return language() === "ja" ? pair[1] : pair[0];
  }

  function definitions(extra = {}) {
    const milestone = Number(extra.milestone || 7);
    const score = Math.max(0, Math.min(100, Number(extra.score || 0)));
    return {
      week: {
        id: "return-week", kind: "week", priority: 20, expression: "sad-week", tone: "return",
        kicker: text("Aku merindukanmu", "会いたかったよ"),
        title: text("Sudah satu minggu", "一週間ぶりだね"),
        message: text("Aku kangen. Sudah satu minggu kita tidak belajar bersama.", "一週間、一緒に勉強できなくて寂しかったよ。")
      },
      month: {
        id: "return-month", kind: "month", priority: 21, expression: "sad-month", tone: "return",
        kicker: text("Aku masih menunggu", "ずっと待っていたよ"),
        title: text("Sudah satu bulan", "一か月ぶりだね"),
        message: text("Aku benar-benar kangen. Sudah satu bulan kamu tidak kembali.", "一か月会えなくて、本当に寂しかったよ。")
      },
      year: {
        id: "return-year", kind: "year", priority: 22, expression: "sad-year", tone: "return",
        kicker: text("Selamat datang kembali", "おかえりなさい"),
        title: text("Aku masih menunggumu", "ずっと待っていたよ"),
        message: text("Sudah satu tahun. Tidak apa-apa—yuk mulai lagi pelan-pelan.", "一年ぶりだね。大丈夫、また少しずつ始めよう。")
      },
      pass: {
        id: extra.resultId ? `pass-${extra.resultId}` : `pass-${Date.now()}`,
        kind: "pass", score, resultId: extra.resultId, priority: 70, expression: "pass-kkm", tone: "celebrate",
        kicker: text("Latihan selesai", "練習完了"),
        title: text(`Hebat, nilaimu ${score}%!`, `すごい、${score}点！`),
        message: text("Nilaimu sudah mencapai KKM. Pertahankan ritme belajarmu.", "合格基準を達成しました。この調子で続けよう。")
      },
      perfect: {
        id: extra.resultId ? `perfect-${extra.resultId}` : `perfect-${Date.now()}`,
        kind: "perfect", score, resultId: extra.resultId, priority: 80, expression: "perfect", tone: "celebrate",
        kicker: text("Nilai sempurna", "満点"),
        title: text("Sempurna! Semua benar!", "満点！全問正解！"),
        message: text("Kamu menjawab seluruh soal dengan tepat. Aku bangga sekali!", "すべて正解です。本当に誇らしいよ！")
      },
      streak: {
        id: `streak-${milestone}`, kind: "streak", milestone, priority: 50, expression: "streak", tone: "celebrate",
        kicker: text("Belajar konsisten", "学習継続"),
        title: text(`${milestone} hari berturut-turut!`, `${milestone}日連続！`),
        message: text("Kebiasaan kecilmu mulai menjadi kekuatan besar. Lanjutkan!", "小さな習慣が大きな力になっています。この調子！")
      },
      eye: {
        id: `eye-${Date.now()}`, kind: "eye", priority: 35, expression: "welcome", tone: "care",
        kicker: text("Jeda untuk mata", "目の休憩"),
        title: text("Aturan 20-20-20", "20-20-20ルール"),
        message: text("Lihat objek sekitar 6 meter selama 20 detik. Kedipkan mata perlahan sebelum melanjutkan.", "約6メートル先を20秒間見て、ゆっくりまばたきしてから続けましょう。")
      },
      hour: {
        id: `hour-${Date.now()}`, kind: "hour", priority: 90, expression: "welcome", tone: "health",
        kicker: text("Jeda singkat", "短い休憩"),
        title: text("Sudah satu jam", "一時間たちました"),
        message: text("Tinggalkan layar selama 5 menit. Berdiri, berjalan sebentar, dan regangkan leher serta bahumu.", "画面から5分離れましょう。立って少し歩き、首と肩を伸ばしてください。")
      },
      rest: {
        id: `rest-${Date.now()}`, kind: "rest", priority: 100, expression: "rest-angry", tone: "health",
        kicker: text("Waktunya istirahat", "休憩の時間"),
        title: text("Sudah lebih dari dua jam", "二時間以上たちました"),
        message: text("Istirahatkan mata dan tubuhmu minimal 10 menit. Tinggalkan layar dan lanjutkan setelah lebih segar.", "画面から離れて、目と体を少なくとも10分間休ませましょう。元気になってから続けてください。")
      }
    };
  }

  function localizedItem(item) {
    if (!item?.kind) return item;
    const localized = definitions(item)[item.kind];
    return localized ? { ...item, ...localized, id: item.id } : item;
  }

  function enqueue(item) {
    if (!item || !item.id) return;
    if (activeNotice?.item?.id === item.id || queue.some(entry => entry.id === item.id)) return;
    queue.push(item);
    queue.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
    pump();
  }

  function pump() {
    if (guideOpen || activeNotice || !queue.length) return;
    showNotice(queue.shift());
  }

  function showNotice(rawItem) {
    const item = localizedItem(rawItem);
    const host = ensureRoot();
    const card = document.createElement("article");
    card.className = "wk-mascot-notice";
    card.dataset.expression = item.expression;
    card.dataset.tone = item.tone || "default";
    card.setAttribute("role", item.tone === "health" ? "alert" : "status");
    card.innerHTML = `
      <figure class="wk-mascot-art"><img src="${assetUrl(item.expression)}" alt="${expressionAlt(item.expression)}" width="320" height="320" decoding="async"></figure>
      <div class="wk-mascot-copy">
        <p class="wk-mascot-kicker">${item.kicker}</p>
        <h2 class="wk-mascot-title">${item.title}</h2>
        <p class="wk-mascot-message">${item.message}</p>
      </div>
      <button class="wk-mascot-close" type="button" disabled aria-label="${text("Tunggu 5 detik sebelum menutup", "閉じるまで5秒お待ちください")}"><span class="wk-mascot-countdown" aria-hidden="true">${Math.ceil(CLOSE_DELAY_MS / 1000)}</span></button>`;
    host.replaceChildren(card);

    const closeButton = card.querySelector(".wk-mascot-close");
    const countdown = card.querySelector(".wk-mascot-countdown");
    let seconds = Math.ceil(CLOSE_DELAY_MS / 1000);
    const timer = window.setInterval(() => {
      seconds -= 1;
      if (seconds > 0) {
        countdown.textContent = String(seconds);
        closeButton.setAttribute("aria-label", text(`Tunggu ${seconds} detik sebelum menutup`, `閉じるまで${seconds}秒お待ちください`));
        return;
      }
      clearInterval(timer);
      countdown.textContent = "×";
      closeButton.disabled = false;
      closeButton.setAttribute("aria-label", text("Tutup notifikasi maskot", "マスコット通知を閉じる"));
    }, 1000);

    const close = () => {
      if (closeButton.disabled || activeNotice?.card !== card) return;
      clearInterval(timer);
      card.classList.add("is-leaving");
      window.setTimeout(() => {
        if (card.isConnected) card.remove();
        activeNotice = null;
        if (pendingGuide) {
          const options = pendingGuide;
          pendingGuide = null;
          showGuide(options);
          return;
        }
        pump();
      }, reducedMotion.matches ? 0 : 190);
    };
    closeButton.addEventListener("click", close);
    activeNotice = { item, card, close, timer };
  }

  function refreshActiveNoticeLanguage() {
    if (!activeNotice) return;
    const item = localizedItem(activeNotice.item);
    const { card } = activeNotice;
    activeNotice.item = item;
    const kicker = card.querySelector(".wk-mascot-kicker");
    const title = card.querySelector(".wk-mascot-title");
    const message = card.querySelector(".wk-mascot-message");
    const image = card.querySelector(".wk-mascot-art img");
    const closeButton = card.querySelector(".wk-mascot-close");
    const countdown = card.querySelector(".wk-mascot-countdown");
    if (kicker) kicker.textContent = item.kicker;
    if (title) title.textContent = item.title;
    if (message) message.textContent = item.message;
    if (image) image.alt = expressionAlt(item.expression);
    if (closeButton) {
      const remaining = Math.max(1, Number(countdown?.textContent) || 1);
      closeButton.setAttribute("aria-label", closeButton.disabled
        ? text(`Tunggu ${remaining} detik sebelum menutup`, `閉じるまで${remaining}秒お待ちください`)
        : text("Tutup notifikasi maskot", "マスコット通知を閉じる"));
    }
  }

  function deviceLabel() {
    if (innerWidth <= 767) return text("Tampilan mobile", "モバイル表示");
    if (innerWidth <= 1180) return text("Tampilan iPad", "iPad表示");
    return text("Tampilan desktop", "デスクトップ表示");
  }

  function guidePreview() {
    if (innerWidth <= 767) return { src: GUIDE_PREVIEWS.mobile, width: 480, height: 682 };
    if (innerWidth <= 1180) return { src: GUIDE_PREVIEWS.ipad, width: 760, height: 615 };
    return { src: GUIDE_PREVIEWS.desktop, width: 900, height: 855 };
  }

  function guideSteps() {
    return [
      {
        title: text("Selamat datang di Wikaru", "Wikaruへようこそ"),
        copy: text("Ini adalah beranda belajarmu. Sapaan, target harian, streak, dan progres terakhir dirangkum di sini.", "ここは学習ホームです。今日の目標、連続学習日数、前回の進捗を確認できます。"),
        selectors: ["#homeGreetingTitle", ".home-heading-copy", ".brand"], expression: "welcome"
      },
      {
        title: text("Pilih materi yang ingin dipelajari", "学習する教材を選ぼう"),
        copy: text("Gunakan Ganti Materi Belajar untuk memilih buku, kategori, dan Bab 1–50. Hanya materi aktif yang dimuat agar tetap ringan.", "「教材を変更」から教科書、カテゴリー、1〜50課を選べます。選択した教材だけを読み込みます。"),
        selectors: ["#homeChangeCategoryBtn", ".home-continue-card"], expression: "welcome"
      },
      {
        title: text("Belajar dengan cara yang paling nyaman", "自分に合う方法で学ぼう"),
        copy: text("Buka materi, gunakan flashcard, latihan bicara, atau mulai kuis. Hasil latihan akan tersimpan pada perangkat ini.", "教材、フラッシュカード、発音練習、クイズを選べます。結果はこの端末に保存されます。"),
        selectors: [".home-quick-actions", "#homeStartBtn", "#homeLoginBtn"], expression: "welcome"
      },
      {
        title: text("Profil dan pengaturan ada di sini", "プロフィールと設定"),
        copy: text("Buka profil untuk mengisi nama, mengganti bahasa atau kategori, melihat hasil, keluar, dan membuka kembali panduan ini.", "プロフィールから名前、言語、カテゴリー、結果、ログアウト、このガイドを開けます。"),
        selectors: ["#userMenuBtn", ".home-profile-shortcut"], expression: "welcome"
      }
    ];
  }

  function ensureGuide() {
    if (guide) return guide;
    guide = document.createElement("section");
    guide.className = "wk-guide";
    guide.id = "wikaruMascotGuide";
    guide.hidden = true;
    guide.setAttribute("role", "dialog");
    guide.setAttribute("aria-modal", "true");
    guide.setAttribute("aria-labelledby", "wkGuideTitle");
    guide.innerHTML = `
      <div class="wk-guide-backdrop" aria-hidden="true"></div>
      <div class="wk-guide-spotlight" aria-hidden="true"></div>
      <div class="wk-guide-dialog" tabindex="-1">
        <div class="wk-guide-head">
          <img class="wk-guide-mascot" src="${GUIDE_ASSET}" alt="${expressionAlt("welcome")}" width="320" height="320">
          <div><span class="wk-guide-device"><i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i><span></span></span><h2 class="wk-guide-title" id="wkGuideTitle"></h2></div>
        </div>
        <p class="wk-guide-copy"></p>
        <figure class="wk-guide-screen"><img alt="" decoding="async"><figcaption><i class="fa-regular fa-image" aria-hidden="true"></i><span>${text("Tangkapan layar asli Wikaru untuk perangkatmu.", "お使いの端末向けのWikaru実画面です。")}</span></figcaption></figure>
        <p class="wk-guide-live-note"><i class="fa-regular fa-eye" aria-hidden="true"></i><span>${text("Sorotan berikutnya menunjukkan bagian asli Wikaru pada perangkatmu.", "次のハイライトは実際の画面を示します。")}</span></p>
        <div class="wk-guide-progress" aria-label="${text("Progres panduan", "ガイドの進捗")}"></div>
        <div class="wk-guide-actions">
          <button class="wk-guide-button wk-guide-skip" type="button">${text("Lewati", "スキップ")}</button>
          <div class="wk-guide-actions-group"><button class="wk-guide-button wk-guide-prev" type="button">${text("Kembali", "戻る")}</button><button class="wk-guide-button primary wk-guide-next" type="button"></button></div>
        </div>
      </div>`;
    document.body.appendChild(guide);

    guide.querySelector(".wk-guide-skip").addEventListener("click", finishGuide);
    guide.querySelector(".wk-guide-prev").addEventListener("click", () => renderGuideStep(Math.max(0, guideIndex - 1)));
    guide.querySelector(".wk-guide-next").addEventListener("click", () => {
      const steps = guideSteps();
      if (guideIndex >= steps.length - 1) finishGuide();
      else renderGuideStep(guideIndex + 1);
    });
    guide.addEventListener("keydown", trapGuideFocus);
    return guide;
  }

  function resolveGuideTarget(step) {
    for (const selector of step.selectors) {
      const element = document.querySelector(selector);
      if (element && element.getClientRects().length) return element;
    }
    return document.querySelector("#homePage") || document.body;
  }

  function positionSpotlight(target) {
    if (!guideOpen || !guide || !target) return;
    const spot = guide.querySelector(".wk-guide-spotlight");
    const rect = target.getBoundingClientRect();
    const pad = innerWidth <= 767 ? 7 : 10;
    const left = Math.max(6, rect.left - pad);
    const top = Math.max(6, rect.top - pad);
    const right = Math.min(innerWidth - 6, rect.right + pad);
    const bottom = Math.min(innerHeight - 6, rect.bottom + pad);
    spot.style.left = `${left}px`;
    spot.style.top = `${top}px`;
    spot.style.width = `${Math.max(28, right - left)}px`;
    spot.style.height = `${Math.max(28, bottom - top)}px`;
  }

  function renderGuideStep(index) {
    const panel = ensureGuide();
    const steps = guideSteps();
    guideIndex = Math.max(0, Math.min(index, steps.length - 1));
    const step = steps[guideIndex];
    panel.dataset.step = String(guideIndex + 1);
    panel.querySelector(".wk-guide-title").textContent = step.title;
    panel.querySelector(".wk-guide-copy").textContent = step.copy;
    panel.querySelector(".wk-guide-device span").textContent = deviceLabel();
    panel.querySelector(".wk-guide-mascot").src = GUIDE_ASSET;
    panel.querySelector(".wk-guide-mascot").alt = expressionAlt(step.expression);
    const preview = guidePreview();
    const previewImage = panel.querySelector(".wk-guide-screen img");
    previewImage.src = preview.src;
    previewImage.width = preview.width;
    previewImage.height = preview.height;
    previewImage.alt = text(`Tangkapan layar asli ${deviceLabel()} Wikaru`, `Wikaru ${deviceLabel()} の実画面`);
    panel.querySelector(".wk-guide-prev").hidden = guideIndex === 0;
    panel.querySelector(".wk-guide-next").textContent = guideIndex === steps.length - 1 ? text("Selesai", "完了") : text("Berikutnya", "次へ");
    panel.querySelector(".wk-guide-progress").innerHTML = steps.map((_, dotIndex) => `<span class="wk-guide-dot${dotIndex === guideIndex ? " active" : ""}" aria-hidden="true"></span>`).join("");

    const target = resolveGuideTarget(step);
    try { target.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" }); } catch (_) {}
    window.setTimeout(() => positionSpotlight(target), reducedMotion.matches ? 0 : 260);
    if (spotlightObserver) spotlightObserver.disconnect();
    if ("ResizeObserver" in window) {
      spotlightObserver = new ResizeObserver(() => positionSpotlight(target));
      spotlightObserver.observe(target);
    }
  }

  function refreshGuideLanguage() {
    if (!guide) return;
    const note = guide.querySelector(".wk-guide-live-note span");
    const progress = guide.querySelector(".wk-guide-progress");
    const skip = guide.querySelector(".wk-guide-skip");
    const previous = guide.querySelector(".wk-guide-prev");
    if (note) note.textContent = text("Sorotan berikutnya menunjukkan bagian asli Wikaru pada perangkatmu.", "次のハイライトは実際の画面を示します。");
    if (progress) progress.setAttribute("aria-label", text("Progres panduan", "ガイドの進捗"));
    if (skip) skip.textContent = text("Lewati", "スキップ");
    if (previous) previous.textContent = text("Kembali", "戻る");
    if (guideOpen) renderGuideStep(guideIndex);
  }

  function showGuide({ replay = false } = {}) {
    if (guideOpen) return;
    if (!replay && localGet(keys.onboarding) === "completed") return;
    if (activeNotice) {
      pendingGuide = { replay };
      return;
    }
    priorFocus = document.activeElement;
    guideStartScroll = scrollY;
    guideOpen = true;
    ensureGuide().hidden = false;
    document.body.classList.add("wk-guide-open");
    renderGuideStep(0);
    window.setTimeout(() => guide.querySelector(".wk-guide-dialog")?.focus({ preventScroll: true }), 30);
  }

  function finishGuide() {
    if (!guideOpen) return;
    guideOpen = false;
    localSet(keys.onboarding, "completed");
    document.body.classList.remove("wk-guide-open");
    if (guide) guide.hidden = true;
    if (spotlightObserver) spotlightObserver.disconnect();
    spotlightObserver = null;
    try { scrollTo({ top: guideStartScroll, behavior: "auto" }); } catch (_) {}
    if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
    priorFocus = null;
    pump();
  }

  function trapGuideFocus(event) {
    if (event.key === "Escape") { event.preventDefault(); finishGuide(); return; }
    if (event.key !== "Tab") return;
    const controls = [...guide.querySelectorAll("button:not([hidden]):not(:disabled)")].filter(el => el.offsetParent !== null);
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function visitState() {
    const now = Date.now();
    const previous = Number(localGet(keys.lastVisit, "0")) || 0;
    const elapsedDays = previous > 0 && now >= previous ? Math.floor((now - previous) / DAY_MS) : 0;
    const today = dayKey();
    const days = [...new Set(readArray(keys.visitDays).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).concat(today))].sort().slice(-400);
    localSet(keys.visitDays, JSON.stringify(days));
    localSet(keys.lastVisit, String(now));
    const daySet = new Set(days);
    let streak = 0;
    let cursor = today;
    while (daySet.has(cursor) && streak < 400) {
      streak += 1;
      cursor = dayBefore(cursor);
    }
    return { firstVisit: previous === 0, elapsedDays, streak };
  }

  function enqueueReturn(elapsedDays) {
    const defs = definitions();
    if (elapsedDays >= 365) enqueue(defs.year);
    else if (elapsedDays >= 30) enqueue(defs.month);
    else if (elapsedDays >= 7) enqueue(defs.week);
  }

  function enqueueStreak(streak) {
    const milestones = [365, 100, 60, 30, 14, 7, 3];
    const milestone = milestones.find(value => streak >= value);
    if (!milestone) return;
    const seen = readArray(keys.achievements);
    const marker = `streak-${milestone}`;
    if (seen.includes(marker)) return;
    localSet(keys.achievements, JSON.stringify([...seen, marker].slice(-100)));
    enqueue(definitions({ milestone }).streak);
  }

  function onQuizFinished(result) {
    if (!result || typeof result !== "object") return;
    const resultId = String(result.localId || result.finishedAt || Date.now());
    const seen = readArray(keys.results);
    if (seen.includes(resultId)) return;
    localSet(keys.results, JSON.stringify([...seen, resultId].slice(-120)));
    const score = Math.max(0, Math.min(100, Number(result.scorePercent || 0)));
    const passed = /lulus/i.test(String(result.kkmStatus || "")) || score >= 60;
    const defs = definitions({ score, resultId });
    if (score === 100) enqueue(defs.perfect);
    else if (passed) enqueue(defs.pass);
  }

  function eyeReminderEnabled() {
    return localGet(keys.eyeEnabled, "no") === "yes";
  }

  function updateMascotMenuLabels() {
    const guideLabel = document.querySelector("#mascotGuideBtn span");
    const eyeButton = document.getElementById("mascotEyeReminderBtn");
    const eyeLabel = eyeButton?.querySelector("span:not(.fiction-state)");
    const eyeState = document.getElementById("mascotEyeReminderState");
    const enabled = eyeReminderEnabled();
    if (guideLabel) guideLabel.textContent = text("Panduan Wikaru", "Wikaruガイド");
    if (eyeLabel) eyeLabel.textContent = text("Pengingat mata 20-20-20", "目の20-20-20リマインダー");
    if (eyeState) eyeState.textContent = enabled ? text("Aktif", "オン") : text("Nonaktif", "オフ");
    if (eyeButton) {
      eyeButton.setAttribute("aria-checked", String(enabled));
      eyeButton.title = enabled
        ? text("Matikan pengingat mata setiap 20 menit", "20分ごとの目のリマインダーをオフにする")
        : text("Aktifkan pengingat mata setiap 20 menit", "20分ごとの目のリマインダーをオンにする");
    }
  }

  function toggleEyeReminder() {
    const enabled = !eyeReminderEnabled();
    localSet(keys.eyeEnabled, enabled ? "yes" : "no");
    sessionSet(keys.eyeBlock, String(Math.floor(sessionActiveMs / TWENTY_MINUTES_MS)));
    updateMascotMenuLabels();
  }

  function startActiveTimeGuard() {
    let activeMs = Math.max(0, Number(sessionGet(keys.activeMs, "0")) || 0);
    let eyeBlock = Math.max(0, Number(sessionGet(keys.eyeBlock, "0")) || 0);
    sessionActiveMs = activeMs;
    let lastTick = performance.now();
    let lastPersist = Date.now();
    const tick = () => {
      const now = performance.now();
      if (document.visibilityState === "visible") activeMs += Math.max(0, now - lastTick);
      sessionActiveMs = activeMs;
      lastTick = now;
      if (Date.now() - lastPersist >= 15000) {
        sessionSet(keys.activeMs, String(Math.round(activeMs)));
        lastPersist = Date.now();
      }
      const currentEyeBlock = Math.floor(activeMs / TWENTY_MINUTES_MS);
      if (activeMs >= TWO_HOURS_MS && sessionGet(keys.restShown) !== "yes") {
        sessionSet(keys.restShown, "yes");
        sessionSet(keys.hourShown, "yes");
        sessionSet(keys.activeMs, String(Math.round(activeMs)));
        enqueue(definitions().rest);
      } else if (activeMs >= ONE_HOUR_MS && sessionGet(keys.hourShown) !== "yes") {
        sessionSet(keys.hourShown, "yes");
        sessionSet(keys.activeMs, String(Math.round(activeMs)));
        enqueue(definitions().hour);
      }
      if (currentEyeBlock > eyeBlock) {
        eyeBlock = currentEyeBlock;
        sessionSet(keys.eyeBlock, String(eyeBlock));
        if (eyeReminderEnabled() && eyeBlock > 0 && eyeBlock % 3 !== 0) enqueue(definitions().eye);
      }
    };
    window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", () => { lastTick = performance.now(); });
    window.addEventListener("pagehide", () => {
      sessionSet(keys.activeMs, String(Math.round(activeMs)));
      sessionSet(keys.eyeBlock, String(eyeBlock));
    });
  }

  function waitForReady() {
    return new Promise(resolve => {
      const started = Date.now();
      const check = () => {
        const loader = document.getElementById("loadingScreen");
        const released = !loader || loader.hidden || loader.classList.contains("is-released") || loader.classList.contains("is-leaving") || document.documentElement.classList.contains("wikaru-ready");
        if (released || Date.now() - started > 9000) resolve();
        else window.setTimeout(check, 120);
      };
      check();
    });
  }

  function openGuideFromMenu() {
    const homeNav = document.querySelector('.nav-link[data-page="home"],.bottom-nav [data-page="home"]');
    if (homeNav) homeNav.click();
    const userButton = document.getElementById("userMenuBtn");
    if (userButton?.getAttribute("aria-expanded") === "true") userButton.click();
    window.setTimeout(() => showGuide({ replay: true }), 240);
  }

  function bindEvents() {
    document.addEventListener("wikaru:quiz-finished", event => onQuizFinished(event.detail?.result));
    document.addEventListener("click", event => {
      if (event.target.closest("#mascotEyeReminderBtn")) {
        event.preventDefault();
        event.stopPropagation();
        toggleEyeReminder();
        return;
      }
      if (event.target.closest("#mascotGuideBtn")) {
        event.preventDefault();
        event.stopPropagation();
        openGuideFromMenu();
      }
    }, true);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && activeNotice && !activeNotice.card.querySelector(".wk-mascot-close")?.disabled) activeNotice.close();
    });
    const syncLanguage = () => {
      updateMascotMenuLabels();
      refreshActiveNoticeLanguage();
      refreshGuideLanguage();
    };
    syncLanguage();
    new MutationObserver(syncLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.addEventListener("resize", () => {
      if (!guideOpen) return;
      guide.querySelector(".wk-guide-device span").textContent = deviceLabel();
      renderGuideStep(guideIndex);
    }, { passive: true });
    window.addEventListener("scroll", () => {
      if (!guideOpen) return;
      const step = guideSteps()[guideIndex];
      positionSpotlight(resolveGuideTarget(step));
    }, { passive: true });
  }

  function debugShow(name, options = {}) {
    const defs = definitions(options);
    const aliases = { week: defs.week, month: defs.month, year: defs.year, pass: defs.pass, perfect: defs.perfect, streak: defs.streak, eye: defs.eye, hour: defs.hour, rest: defs.rest };
    if (aliases[name]) enqueue({ ...aliases[name], id: `debug-${name}-${Date.now()}` });
  }

  function init() {
    if (isPreview) return;
    ensureRoot();
    bindEvents();
    startActiveTimeGuard();
    const visit = visitState();
    waitForReady().then(() => {
      if (localGet(keys.onboarding) !== "completed") {
        showGuide();
        enqueueReturn(visit.elapsedDays);
        enqueueStreak(visit.streak);
        return;
      }
      enqueueReturn(visit.elapsedDays);
      enqueueStreak(visit.streak);
      pump();
    });
  }

  window.WikaruMascot = Object.freeze({
    openGuide: () => showGuide({ replay: true }),
    show: debugShow,
    close: () => activeNotice?.close(),
    version: VERSION
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
