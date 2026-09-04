/* Wikaru v33 experience layer: PWA install, achievements, local insights,
   private diagnostics, pronunciation detail, and accessibility refinements. */
(() => {
  "use strict";
  if (window.__WIKARU_EXPERIENCE_V33) return;
  window.__WIKARU_EXPERIENCE_V33 = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const BASE = "minna_bab23";
  const SMART_PREFIX = "wikaru_smart_learning_v1_";
  const DIAGNOSTIC_KEY = "wikaru_diagnostics_v33";
  const OFFLINE_KEY = "wikaru_offline_chapters_v1";
  const runtimeConfig = window.WIKARU_RUNTIME_CONFIG || {};
  const isJa = () => String(document.documentElement.lang || "id").startsWith("ja");
  const copy = (id, ja) => isJa() ? ja : id;
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const safeJson = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
    catch (_) { return fallback; }
  };
  const safeSet = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  };
  const notify = message => window.WIKARU_APP?.notify?.(message) || window.WIKARU_SHOW_TOAST?.(message);

  function normalizeKey(value) {
    return String(value || "").normalize("NFKC").trim().toLowerCase()
      .replace(/[^a-z0-9\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff]+/giu, "-")
      .replace(/^-+|-+$/g, "").slice(0, 72) || "guest";
  }

  function cloudHomeGuard() {
    const scene = $("#homePage .home-theme-scene");
    const replacement = $("#homeMainReferenceImage");
    if (scene) scene.hidden = false;
    if (replacement) {
      replacement.hidden = true;
      replacement.setAttribute("aria-hidden", "true");
    }
  }

  function applyProductionMetadata() {
    const origin = String(runtimeConfig.productionOrigin || "").trim().replace(/\/$/, "");
    if (!/^https:\/\/[^\s]+$/i.test(origin)) return;
    let canonical = $("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${origin}/`;
    ["meta[property='og:image']", "meta[name='twitter:image']"].forEach(selector => {
      const meta = $(selector);
      if (meta) meta.content = `${origin}/assets/brand/wikaru-social-preview.png`;
    });
  }

  function applyLaunchShortcut() {
    const params = new URLSearchParams(location.search);
    const target = params.get("page");
    const action = params.get("action");
    if (target === "material") setTimeout(() => $("[data-page='material']")?.click(), 450);
    if (action === "learn") setTimeout(() => $("[data-action='openQuizSettings']")?.click(), 450);
  }

  let installPrompt = null;
  let featureModal = null;
  let previousFocus = null;

  function displayModeInstalled() {
    return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  }

  function ensureMenuControls() {
    const menu = $("#userDropdown .profile-menu-scroll");
    if (!menu) return;
    const divider = $(".profile-menu-divider", menu);
    if (!$("#wikaruInstallBtn")) {
      const install = document.createElement("button");
      install.id = "wikaruInstallBtn";
      install.className = "drop-item";
      install.type = "button";
      install.setAttribute("role", "menuitem");
      install.innerHTML = '<i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i><span data-install-label></span><span class="wk-menu-dot" data-install-dot aria-hidden="true"></span>';
      menu.insertBefore(install, divider || null);
      install.addEventListener("click", installApp);
    }
    if (!$("#wikaruDiagnosticsBtn")) {
      const diagnostics = document.createElement("button");
      diagnostics.id = "wikaruDiagnosticsBtn";
      diagnostics.className = "drop-item";
      diagnostics.type = "button";
      diagnostics.setAttribute("role", "menuitem");
      diagnostics.innerHTML = '<i class="fa-solid fa-shield-heart" aria-hidden="true"></i><span data-diagnostics-label></span><span class="fiction-state">Lokal</span>';
      menu.insertBefore(diagnostics, divider || null);
      diagnostics.addEventListener("click", openDiagnostics);
    }
    updateMenuCopy();
  }

  function updateMenuCopy() {
    const install = $("#wikaruInstallBtn");
    const installLabel = $("[data-install-label]", install || document);
    const installDot = $("[data-install-dot]", install || document);
    if (installLabel) installLabel.textContent = displayModeInstalled()
      ? copy("Wikaru sudah terpasang", "Wikaruはインストール済み")
      : copy("Pasang aplikasi Wikaru", "Wikaruアプリをインストール");
    install?.setAttribute("aria-disabled", String(displayModeInstalled()));
    installDot?.classList.toggle("is-ready", Boolean(installPrompt) && !displayModeInstalled());
    const diagnosticsLabel = $("[data-diagnostics-label]");
    if (diagnosticsLabel) diagnosticsLabel.textContent = copy("Diagnostik privat", "プライベート診断");
  }

  async function installApp(event) {
    event?.preventDefault?.();
    if (displayModeInstalled()) {
      notify(copy("Wikaru sudah terpasang di perangkat ini.", "Wikaruはこの端末にインストール済みです。"));
      return;
    }
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
      const choice = await prompt.userChoice.catch(() => null);
      updateMenuCopy();
      notify(choice?.outcome === "accepted"
        ? copy("Wikaru sedang dipasang.", "Wikaruをインストールしています。")
        : copy("Pemasangan dibatalkan. Kamu dapat mencobanya lagi dari menu profil.", "インストールをキャンセルしました。"));
      return;
    }
    notify(/iPad|iPhone|iPod/i.test(navigator.userAgent)
      ? copy("Di Safari, tekan Bagikan lalu pilih Tambahkan ke Layar Utama.", "Safariの共有から「ホーム画面に追加」を選んでください。")
      : copy("Buka menu browser lalu pilih Pasang aplikasi atau Tambahkan ke layar utama.", "ブラウザメニューからアプリをインストールしてください。"));
  }

  function currentSmartState() {
    const progress = safeJson(`${BASE}_progress`, null);
    const signature = progress?.username
      ? `${normalizeKey(progress.username)}__${normalizeKey(progress.group || "umum")}`
      : "guest";
    return safeJson(`${SMART_PREFIX}${signature}`, { sessions:[], weeklyTarget:75, perfectCount:0 });
  }

  function consecutiveDays(sessions) {
    const days = new Set((sessions || []).map(item => {
      const date = new Date(item.at || item.finishedAt || 0);
      return Number.isFinite(date.getTime()) ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "";
    }).filter(Boolean));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let index = 0; index < 366; index += 1) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (!days.has(key)) {
        if (index === 0) { cursor.setDate(cursor.getDate() - 1); continue; }
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderAchievements() {
    const grid = $("#wkAchievementGrid");
    if (!grid) return;
    const state = currentSmartState();
    const sessions = Array.isArray(state.sessions) ? state.sessions : [];
    const weekStart = new Date();
    weekStart.setHours(0,0,0,0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekly = sessions.filter(item => (Date.parse(item.at) || 0) >= weekStart.getTime());
    const total = sessions.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const correct = sessions.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
    const weeklyTotal = weekly.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const accuracy = total ? Math.round(correct / total * 100) : 0;
    const streak = consecutiveDays(sessions);
    const badges = [
      { icon:"fa-seedling", earned:sessions.length >= 1, title:copy("Langkah Pertama","最初の一歩"), detail:copy("Selesaikan satu sesi.","1回の学習を完了") },
      { icon:"fa-fire", earned:streak >= 7, title:copy("Tujuh Hari","7日連続"), detail:copy(`${streak}/7 hari beruntun`,`${streak}/7日連続`) },
      { icon:"fa-bullseye", earned:total >= 20 && accuracy >= 90, title:copy("Akurasi 90%","正答率90%"), detail:copy(`${accuracy}% dari ${total} soal`,`${total}問で${accuracy}%`) },
      { icon:"fa-calendar-check", earned:weeklyTotal >= Number(state.weeklyTarget || 75), title:copy("Target Mingguan","週間目標"), detail:copy(`${weeklyTotal}/${state.weeklyTarget || 75} soal`,`${weeklyTotal}/${state.weeklyTarget || 75}問`) },
      { icon:"fa-trophy", earned:Number(state.perfectCount || 0) >= 1, title:copy("Sempurna","満点"), detail:copy(`${Number(state.perfectCount || 0)} tantangan 100%`,`${Number(state.perfectCount || 0)}回満点`) }
    ];
    grid.innerHTML = badges.map(badge => `<article class="wk-achievement ${badge.earned ? "is-earned" : ""}"><span class="wk-achievement-icon"><i class="fa-solid ${badge.icon}" aria-hidden="true"></i></span><strong>${escapeHtml(badge.title)}</strong><small>${escapeHtml(badge.detail)}</small></article>`).join("");
    const count = badges.filter(badge => badge.earned).length;
    const output = $("#wkAchievementCount");
    if (output) output.textContent = `${count}/${badges.length}`;
  }

  function historyRows() {
    const rows = safeJson(`${BASE}_history`, []);
    return Array.isArray(rows) ? rows.filter(row => row && typeof row === "object") : [];
  }

  function scoreOf(row) {
    const direct = Number(row.scorePercent ?? row.score);
    if (Number.isFinite(direct)) return Math.max(0, Math.min(100, direct));
    const total = Number(row.totalQuestions) || 0;
    return total ? Math.round((Number(row.correctCount) || 0) / total * 100) : 0;
  }

  function renderAdminInsights() {
    const grid = $("#wkAdminInsightGrid");
    if (!grid) return;
    const rows = historyRows().sort((a,b) => (Date.parse(b.finishedAt) || 0) - (Date.parse(a.finishedAt) || 0));
    const vocabulary = new Map();
    rows.forEach(row => (Array.isArray(row.details) ? row.details : []).forEach(detail => {
      const key = String(detail.id || detail.kanji || detail.kana || detail.indonesia || "").trim();
      if (!key) return;
      const current = vocabulary.get(key) || { seen:0, wrong:0, label:detail.kanji || detail.kana || detail.indonesia || key, meaning:detail.indonesia || "" };
      current.seen += 1;
      if (detail.isCorrect === false || detail.userStatus === "Salah") current.wrong += 1;
      vocabulary.set(key, current);
    }));
    const hardest = [...vocabulary.values()].filter(item => item.seen).sort((a,b) => (b.wrong / b.seen) - (a.wrong / a.seen) || b.seen - a.seen).slice(0,3);
    const recent = rows.slice(0,3).map(scoreOf);
    const previous = rows.slice(3,6).map(scoreOf);
    const average = values => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const currentAverage = average(recent);
    const previousAverage = average(previous);
    const delta = previous.length ? currentAverage - previousAverage : 0;
    const groups = new Map();
    rows.forEach(row => {
      const group = String(row.group || row.region || "Umum").trim() || "Umum";
      const current = groups.get(group) || { total:0, scores:0 };
      current.total += 1;
      current.scores += scoreOf(row);
      groups.set(group, current);
    });
    const groupRows = [...groups.entries()].sort((a,b) => b[1].total - a[1].total).slice(0,4);
    const hardestMarkup = hardest.length
      ? `<div class="wk-admin-insight-list">${hardest.map(item => `<span><b>${escapeHtml(item.label)}</b><em>${Math.round(item.wrong / item.seen * 100)}% salah</em></span>`).join("")}</div>`
      : `<p>${copy("Belum ada detail jawaban untuk dianalisis.","分析できる回答詳細がまだありません。")}</p>`;
    const groupsMarkup = groupRows.length
      ? `<div class="wk-admin-insight-list">${groupRows.map(([name,value]) => `<span><b>${escapeHtml(name)}</b><em>${Math.round(value.scores / value.total)}% · ${value.total} sesi</em></span>`).join("")}</div>`
      : `<p>${copy("Belum ada progres wilayah yang tersimpan.","地域別の進捗はまだありません。")}</p>`;
    grid.innerHTML = `
      <article class="wk-admin-insight"><div class="wk-admin-insight-head"><span class="wk-admin-insight-icon"><i class="fa-solid fa-triangle-exclamation"></i></span><h4>${copy("Kosakata paling sulit","難しい語彙")}</h4></div>${hardestMarkup}</article>
      <article class="wk-admin-insight"><div class="wk-admin-insight-head"><span class="wk-admin-insight-icon"><i class="fa-solid fa-chart-line"></i></span><h4>${copy("Tren tiga sesi terakhir","直近3回の傾向")}</h4></div><strong>${rows.length ? `${currentAverage}%` : "—"}</strong><p>${rows.length ? copy(`${delta >= 0 ? "+" : ""}${delta} poin dibanding tiga sesi sebelumnya.`, `前の3回と比べて${delta >= 0 ? "+" : ""}${delta}ポイント。`) : copy("Belum ada hasil peserta.","参加者の結果はまだありません。")}</p></article>
      <article class="wk-admin-insight"><div class="wk-admin-insight-head"><span class="wk-admin-insight-icon"><i class="fa-solid fa-people-group"></i></span><h4>${copy("Progres per wilayah","地域別の進捗")}</h4></div>${groupsMarkup}</article>`;
  }

  function redact(value) {
    return String(value || "")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
      .replace(/https?:\/\/[^\s?#]+(?:\?[^\s#]*)?/gi, match => match.split("?")[0])
      .replace(/\b(?:token|apikey|password|secret)\s*[:=]\s*[^\s,;]+/gi, "credential=[redacted]")
      .slice(0, 320);
  }

  function diagnostics() {
    const rows = safeJson(DIAGNOSTIC_KEY, []);
    return Array.isArray(rows) ? rows : [];
  }

  function recordDiagnostic(kind, message, source = "") {
    const rows = diagnostics();
    rows.unshift({ at:new Date().toISOString(), kind:redact(kind), message:redact(message), source:redact(source) });
    safeSet(DIAGNOSTIC_KEY, rows.slice(0, 40));
  }

  function ensureDiagnosticsModal() {
    if (featureModal) return featureModal;
    featureModal = document.createElement("section");
    featureModal.id = "wikaruDiagnosticsModal";
    featureModal.className = "wk-feature-modal";
    featureModal.hidden = true;
    featureModal.setAttribute("role", "dialog");
    featureModal.setAttribute("aria-modal", "true");
    featureModal.setAttribute("aria-labelledby", "wikaruDiagnosticsTitle");
    featureModal.innerHTML = `<article class="wk-feature-card wk-diagnostic-card" tabindex="-1"><button class="wk-feature-close" type="button" data-diagnostic-close aria-label="Tutup"><i class="fa-solid fa-xmark"></i></button><span class="wk-feature-kicker">PRIVASI PERANGKAT</span><h2 id="wikaruDiagnosticsTitle">Diagnostik privat</h2><p class="wk-feature-lead">Catatan teknis disimpan hanya di browser ini. Tidak ada analitik pihak ketiga dan tidak ada data yang dikirim otomatis.</p><div class="wk-diagnostic-summary" data-diagnostic-summary></div><p class="wk-diagnostic-note">Ekspor hanya berisi versi aplikasi, kemampuan browser, status offline, dan pesan galat yang sudah disamarkan. Nama peserta, jawaban, email, dan kata sandi tidak disertakan.</p><div class="wk-diagnostic-actions"><button type="button" class="btn secondary" data-diagnostic-clear>Hapus catatan</button><button type="button" class="btn" data-diagnostic-export><i class="fa-solid fa-download"></i>Ekspor diagnostik</button></div></article>`;
    document.body.appendChild(featureModal);
    featureModal.addEventListener("click", event => {
      if (event.target === featureModal || event.target.closest("[data-diagnostic-close]")) closeDiagnostics();
      if (event.target.closest("[data-diagnostic-clear]")) {
        localStorage.removeItem(DIAGNOSTIC_KEY);
        renderDiagnostics();
        notify(copy("Catatan diagnostik dihapus.", "診断記録を削除しました。"));
      }
      if (event.target.closest("[data-diagnostic-export]")) exportDiagnostics();
    });
    featureModal.addEventListener("keydown", event => { if (event.key === "Escape") closeDiagnostics(); });
    return featureModal;
  }

  function renderDiagnostics() {
    const modal = ensureDiagnosticsModal();
    const summary = $("[data-diagnostic-summary]", modal);
    const offline = safeJson(OFFLINE_KEY, []);
    const online = navigator.onLine;
    summary.innerHTML = `<article><strong>v33</strong><span>Versi aplikasi</span></article><article><strong>${Array.isArray(offline) ? offline.length : 0}</strong><span>Bab offline</span></article><article><strong>${diagnostics().length}</strong><span>Catatan lokal</span></article><article><strong>${online ? "Online" : "Offline"}</strong><span>Status jaringan</span></article><article><strong>${"serviceWorker" in navigator ? "Siap" : "Tidak"}</strong><span>Service worker</span></article><article><strong>${window.WIKARU_CAPTCHA?.configured ? "Aktif" : "Siap isi"}</strong><span>CAPTCHA</span></article>`;
  }

  function openDiagnostics() {
    const modal = ensureDiagnosticsModal();
    previousFocus = document.activeElement;
    renderDiagnostics();
    modal.hidden = false;
    requestAnimationFrame(() => $(".wk-diagnostic-card", modal)?.focus());
  }

  function closeDiagnostics() {
    if (!featureModal || featureModal.hidden) return;
    featureModal.hidden = true;
    previousFocus?.focus?.();
  }

  function exportDiagnostics() {
    const payload = {
      app:"Wikaru",
      build:"20260902-final33",
      exportedAt:new Date().toISOString(),
      environment:{ online:navigator.onLine, language:navigator.language, platform:redact(navigator.platform), serviceWorker:"serviceWorker" in navigator, captchaConfigured:Boolean(window.WIKARU_CAPTCHA?.configured) },
      offlineChapterCount:(safeJson(OFFLINE_KEY, []) || []).length || 0,
      entries:diagnostics()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wikaru-diagnostics-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function normalizeSpeech(value) {
    return String(value || "").normalize("NFKC").toLowerCase()
      .replace(/[ァ-ン]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
      .replace(/[^\p{L}\p{N}ー]+/gu, "");
  }

  function speechUnits(value) {
    const chars = [...normalizeSpeech(value)];
    const units = [];
    const small = /[ゃゅょぁぃぅぇぉっゎー]/;
    chars.forEach(char => {
      if (small.test(char) && units.length) units[units.length - 1] += char;
      else units.push(char);
    });
    return units.slice(0, 18);
  }

  function pronunciationAnalysis(detail) {
    requestAnimationFrame(() => {
      const feedback = $("#wkPronunciationFeedback");
      if (!feedback) return;
      const old = $(".wk-pronunciation-analysis", feedback);
      old?.remove();
      const targetUnits = speechUnits(detail.target);
      const heard = normalizeSpeech(detail.heard);
      let cursor = 0;
      const states = targetUnits.map(unit => {
        const at = heard.indexOf(unit, cursor);
        if (at < 0) return { unit, match:false };
        cursor = at + unit.length;
        return { unit, match:true };
      });
      const seed = [...normalizeSpeech(detail.heard || detail.target)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const bars = Array.from({ length:16 }, (_, index) => 2 + ((seed + index * 7) % 8));
      const analysis = document.createElement("div");
      analysis.className = "wk-pronunciation-analysis";
      analysis.innerHTML = `<span class="wk-pronunciation-wave" aria-label="Visual ritme ucapan">${bars.map((bar,index) => `<i style="--bar:${bar};--index:${index}" aria-hidden="true"></i>`).join("")}</span><span class="wk-pronunciation-units" aria-label="Kecocokan bagian pelafalan">${states.length ? states.map(state => `<span class="wk-pronunciation-unit ${state.match ? "is-match" : "is-review"}">${escapeHtml(state.unit)}</span>`).join("") : `<span class="wk-pronunciation-unit is-review">${copy("Ucapkan ulang","もう一度")}</span>`}</span>`;
      feedback.appendChild(analysis);
    });
  }

  function bindTabKeyboard() {
    const list = $(".wk-learning-tabs[role='tablist']");
    if (!list || list.dataset.wkKeyboard) return;
    list.dataset.wkKeyboard = "true";
    list.addEventListener("keydown", event => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      const tabs = $$('[role="tab"]', list).filter(tab => !tab.disabled);
      const current = Math.max(0, tabs.indexOf(document.activeElement));
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next]?.focus();
      tabs[next]?.click();
    });
  }

  function bind() {
    cloudHomeGuard();
    applyProductionMetadata();
    applyLaunchShortcut();
    ensureMenuControls();
    renderAchievements();
    renderAdminInsights();
    bindTabKeyboard();
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      updateMenuCopy();
    });
    window.addEventListener("appinstalled", () => { installPrompt = null; updateMenuCopy(); });
    window.addEventListener("error", event => recordDiagnostic("error", event.message, event.filename));
    window.addEventListener("unhandledrejection", event => recordDiagnostic("promise", event.reason?.message || event.reason || "Unhandled rejection"));
    document.addEventListener("wikaru:pronunciation-result", event => pronunciationAnalysis(event.detail || {}));
    document.addEventListener("wikaru:quiz-finished", () => setTimeout(() => { renderAchievements(); renderAdminInsights(); }, 0));
    document.addEventListener("wikaru:language-changed", () => { ensureMenuControls(); renderAchievements(); renderAdminInsights(); });
    $("#wkRefreshInsights")?.addEventListener("click", renderAdminInsights);
    new MutationObserver(() => { cloudHomeGuard(); ensureMenuControls(); }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once:true });
  else bind();
})();
