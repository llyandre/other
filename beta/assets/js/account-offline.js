/* Wikaru account, CAPTCHA, pronunciation feedback, and explicit offline chapters. */
(() => {
  "use strict";
  if (window.__WIKARU_ACCOUNT_OFFLINE_V1) return;
  window.__WIKARU_ACCOUNT_OFFLINE_V1 = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const config = window.WIKARU_RUNTIME_CONFIG || {};
  const OFFLINE_KEY = "wikaru_offline_chapters_v1";
  const HISTORY_KEY = "minna_bab23_history";
  const QUEUE_KEY = "minna_bab23_pendingCloudResults";
  let modal = null;
  let previousFocus = null;
  let turnstilePromise = null;
  let captchaRequest = null;

  const isJa = () => String(document.documentElement.lang || "id").startsWith("ja");
  const copy = (id, ja) => isJa() ? ja : id;
  const safeJson = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
    catch (_) { return fallback; }
  };

  function loadTurnstile() {
    if (!config.turnstileSiteKey) return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstilePromise) return turnstilePromise;
    turnstilePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile || null);
      script.onerror = () => reject(new Error("turnstile-load-failed"));
      document.head.appendChild(script);
    });
    return turnstilePromise;
  }

  async function getCaptchaToken() {
    if (!config.turnstileSiteKey) return "";
    if (captchaRequest) return captchaRequest;
    captchaRequest = new Promise(async (resolve, reject) => {
      try {
        const api = await loadTurnstile();
        if (!api) return resolve("");
        const layer = document.createElement("section");
        layer.className = "wk-captcha-layer";
        layer.setAttribute("role", "dialog");
        layer.setAttribute("aria-modal", "true");
        layer.innerHTML = `<div class="wk-captcha-card"><span class="wk-feature-kicker">${copy("PEMERIKSAAN KEAMANAN","セキュリティ確認")}</span><h2>${copy("Pastikan kamu bukan robot","ロボットではないことを確認")}</h2><p>${copy("Selesaikan pemeriksaan singkat agar akun anonim tidak disalahgunakan.","匿名アカウントの不正利用を防ぐため、簡単な確認を完了してください。")}</p><div data-captcha-host></div><button type="button" data-captcha-cancel>${copy("Batal","キャンセル")}</button></div>`;
        document.body.appendChild(layer);
        const finish = (value, error) => {
          layer.remove();
          captchaRequest = null;
          error ? reject(error) : resolve(value || "");
        };
        $("[data-captcha-cancel]", layer).addEventListener("click", () => finish("", new Error("captcha-cancelled")));
        api.render($("[data-captcha-host]", layer), {
          sitekey: config.turnstileSiteKey,
          theme: document.body.classList.contains("dark") ? "dark" : "light",
          callback: token => finish(token),
          "error-callback": () => finish("", new Error("captcha-verification-failed")),
          "expired-callback": () => finish("", new Error("captcha-expired"))
        });
      } catch (error) { captchaRequest = null; reject(error); }
    });
    return captchaRequest;
  }

  window.WIKARU_CAPTCHA = Object.freeze({
    configured: Boolean(config.turnstileSiteKey),
    provider: config.captchaProvider || "turnstile",
    getToken: getCaptchaToken
  });

  function offlineIds() {
    const rows = safeJson(OFFLINE_KEY, []);
    return Array.isArray(rows) ? rows.map(Number).filter(number => number >= 1 && number <= 50) : [];
  }

  async function serviceWorkerMessage(type, detail = {}) {
    if (!("serviceWorker" in navigator)) throw new Error("service-worker-unsupported");
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) throw new Error("service-worker-not-ready");
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => reject(new Error("service-worker-timeout")), 25_000);
      channel.port1.onmessage = event => {
        clearTimeout(timeout);
        event.data?.ok ? resolve(event.data) : reject(new Error(event.data?.error || "offline-operation-failed"));
      };
      worker.postMessage({ type, ...detail }, [channel.port2]);
    });
  }

  function ensureMenuButton() {
    const menu = $("#userDropdown .profile-menu-scroll");
    if (!menu || $("#wikaruAccountOfflineBtn")) return;
    const button = document.createElement("button");
    button.className = "drop-item";
    button.id = "wikaruAccountOfflineBtn";
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.innerHTML = '<i class="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i><span data-account-offline-label></span><span class="wk-menu-dot" aria-hidden="true"></span>';
    const divider = $(".profile-menu-divider", menu);
    menu.insertBefore(button, divider || null);
    button.addEventListener("click", openModal);
    updateCopy();
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("section");
    modal.id = "wikaruAccountOfflineModal";
    modal.className = "wk-feature-modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "wikaruFeatureTitle");
    modal.innerHTML = `
      <article class="wk-feature-card" tabindex="-1">
        <button class="wk-feature-close" type="button" data-feature-close aria-label="Tutup"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <span class="wk-feature-kicker" data-feature-kicker></span>
        <h2 id="wikaruFeatureTitle" data-feature-title></h2>
        <p class="wk-feature-lead" data-feature-lead></p>
        <div class="wk-feature-grid">
          <section class="wk-feature-pane wk-account-pane">
            <span class="wk-feature-icon"><i class="fa-regular fa-envelope"></i></span>
            <div><h3 data-account-title></h3><p data-account-copy></p></div>
            <form data-magic-form>
              <label for="wikaruSyncEmail" data-email-label></label>
              <div class="wk-inline-field"><input id="wikaruSyncEmail" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="nama@email.com"><button type="submit" data-magic-submit></button></div>
            </form>
            <p class="wk-feature-status" data-account-status role="status" aria-live="polite"></p>
          </section>
          <section class="wk-feature-pane wk-offline-pane">
            <span class="wk-feature-icon"><i class="fa-solid fa-cloud-arrow-down"></i></span>
            <div><h3 data-offline-title></h3><p data-offline-copy></p></div>
            <div class="wk-chapter-toolbar"><button type="button" data-select-current></button><button type="button" data-clear-selection></button></div>
            <div class="wk-chapter-grid" data-chapter-grid></div>
            <div class="wk-offline-actions"><button type="button" class="primary" data-download-selected></button><button type="button" data-remove-selected></button></div>
            <p class="wk-feature-status" data-offline-status role="status" aria-live="polite"></p>
          </section>
        </div>
        <aside class="wk-security-note"><i class="fa-solid fa-shield-halved"></i><span data-captcha-status></span></aside>
      </article>`;
    document.body.appendChild(modal);
    const grid = $("[data-chapter-grid]", modal);
    for (let chapter = 1; chapter <= 50; chapter += 1) {
      const label = document.createElement("label");
      label.className = "wk-chapter-choice";
      label.innerHTML = `<input type="checkbox" value="${chapter}"><span>${copy("Bab", "第")} ${chapter}${isJa() ? "課" : ""}</span>`;
      grid.appendChild(label);
    }
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest("[data-feature-close]")) closeModal();
      if (event.target.closest("[data-select-current]")) selectCurrentChapter();
      if (event.target.closest("[data-clear-selection]")) $$("input", grid).forEach(input => { input.checked = false; });
      if (event.target.closest("[data-download-selected]")) updateOffline("CACHE_CHAPTERS");
      if (event.target.closest("[data-remove-selected]")) updateOffline("REMOVE_CHAPTERS");
    });
    $("[data-magic-form]", modal).addEventListener("submit", sendMagicLink);
    modal.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
    updateCopy();
    return modal;
  }

  function selectedChapters() {
    return $$("[data-chapter-grid] input:checked", modal).map(input => Number(input.value));
  }

  function selectCurrentChapter() {
    const value = String($("#chapterSelect")?.value || $("#currentChapter")?.textContent || "");
    const match = value.match(/\d+/);
    const chapter = Math.min(50, Math.max(1, Number(match?.[0] || 1)));
    const input = $(`[data-chapter-grid] input[value="${chapter}"]`, modal);
    if (input) input.checked = true;
  }

  async function updateOffline(type) {
    const status = $("[data-offline-status]", modal);
    const chapters = selectedChapters();
    if (!chapters.length) {
      status.textContent = copy("Pilih minimal satu bab.", "少なくとも1課を選んでください。");
      status.dataset.state = "error";
      return;
    }
    status.textContent = type === "CACHE_CHAPTERS" ? copy("Mengunduh bab pilihan…", "選択した課を保存しています…") : copy("Menghapus unduhan…", "保存データを削除しています…");
    status.dataset.state = "busy";
    try {
      await serviceWorkerMessage(type, { chapters });
      const before = new Set(offlineIds());
      chapters.forEach(chapter => type === "CACHE_CHAPTERS" ? before.add(chapter) : before.delete(chapter));
      localStorage.setItem(OFFLINE_KEY, JSON.stringify([...before].sort((a, b) => a - b)));
      reflectOfflineChoices();
      status.textContent = type === "CACHE_CHAPTERS"
        ? copy(`${chapters.length} bab siap dibuka tanpa internet.`, `${chapters.length}課をオフラインで利用できます。`)
        : copy(`${chapters.length} unduhan bab dihapus.`, `${chapters.length}課の保存データを削除しました。`);
      status.dataset.state = "success";
    } catch (error) {
      status.textContent = copy("Unduhan belum berhasil. Pastikan aplikasi Wikaru sudah terpasang dan koneksi internet aktif.", "保存できませんでした。接続とアプリの状態を確認してください。");
      status.dataset.state = "error";
    }
  }

  function reflectOfflineChoices() {
    const saved = new Set(offlineIds());
    $$(".wk-chapter-choice", modal || document).forEach(label => label.classList.toggle("is-downloaded", saved.has(Number($("input", label)?.value))));
  }

  async function sendMagicLink(event) {
    event.preventDefault();
    const status = $("[data-account-status]", modal);
    const email = String($("#wikaruSyncEmail", modal).value || "").trim();
    status.textContent = copy("Mengirim tautan aman…", "安全なリンクを送信しています…");
    status.dataset.state = "busy";
    try {
      if (!window.WIKARU_CLOUD?.signInWithMagicLink) throw new Error("cloud-not-ready");
      await window.WIKARU_CLOUD.signInWithMagicLink(email);
      status.textContent = copy("Tautan masuk terkirim. Buka email di perangkat tujuan, lalu tekan tautannya.", "ログインリンクを送信しました。利用する端末でメールのリンクを開いてください。");
      status.dataset.state = "success";
    } catch (error) {
      status.textContent = error?.message === "magic-link-email-invalid" ? copy("Alamat email belum benar.", "メールアドレスを確認してください。") : copy("Tautan belum dapat dikirim. Tunggu sebentar lalu coba lagi.", "リンクを送信できませんでした。しばらくしてから再試行してください。");
      status.dataset.state = "error";
    }
  }

  function queueLocalHistoryForPermanentAccount() {
    const history = safeJson(HISTORY_KEY, []);
    const pending = safeJson(QUEUE_KEY, []);
    if (!Array.isArray(history) || !history.length) return;
    const merged = [...history, ...(Array.isArray(pending) ? pending : [])];
    const unique = [...new Map(merged.filter(row => row?.localId).map(row => [row.localId, row])).values()].slice(0, 500);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(unique));
    document.dispatchEvent(new CustomEvent("wikaru:sync-queue", { detail: { pending: unique.length } }));
    window.setTimeout(() => window.WIKARU_FLUSH_PENDING_RESULTS?.(), 800);
  }

  function updateAccountStatus() {
    if (!modal) return;
    const status = window.WIKARU_CLOUD?.status?.();
    const output = $("[data-account-status]", modal);
    if (status?.authenticated && !status.anonymous) {
      output.textContent = copy("Akun permanen aktif. Progres lokal sedang diselaraskan.", "永久アカウントが有効です。学習データを同期しています。");
      output.dataset.state = "success";
    }
  }

  function openModal() {
    const root = ensureModal();
    previousFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("wk-feature-open");
    reflectOfflineChoices();
    updateAccountStatus();
    requestAnimationFrame(() => $(".wk-feature-card", root)?.focus());
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("wk-feature-open");
    previousFocus?.focus?.();
  }

  function updateCopy() {
    const menuLabel = $("[data-account-offline-label]");
    if (menuLabel) menuLabel.textContent = copy("Sinkronisasi & offline", "同期とオフライン");
    if (!modal) return;
    $("[data-feature-kicker]", modal).textContent = copy("BELAJAR TANPA TERPUTUS", "学習を途切れさせない");
    $("[data-feature-title]", modal).textContent = copy("Akun dan materi offline", "アカウントとオフライン教材");
    $("[data-feature-lead]", modal).textContent = copy("Bawa progres ke perangkat lain dan simpan bab yang penting untuk belajar saat koneksi terbatas.", "進捗を別の端末に同期し、必要な課を保存してオフラインでも学べます。");
    $("[data-account-title]", modal).textContent = copy("Sinkronisasi lintas perangkat", "端末間で同期");
    $("[data-account-copy]", modal).textContent = copy("Opsional. Masuk melalui tautan email; progres lokal tetap tersedia di perangkat ini.", "任意です。メールリンクでログインしても、この端末のローカル進捗は残ります。");
    $("[data-email-label]", modal).textContent = copy("Email untuk Magic Link", "マジックリンク用メール");
    $("[data-magic-submit]", modal).textContent = copy("Kirim tautan", "リンクを送信");
    $("[data-offline-title]", modal).textContent = copy("Unduh bab untuk offline", "課をオフライン保存");
    $("[data-offline-copy]", modal).textContent = copy("Hanya data teks bab yang disimpan. Ribuan gambar eksternal tidak diunduh otomatis agar penyimpanan tetap ringan.", "容量を抑えるため、課のテキストデータのみ保存し、外部画像は一括保存しません。");
    $("[data-select-current]", modal).textContent = copy("Pilih bab aktif", "現在の課を選択");
    $("[data-clear-selection]", modal).textContent = copy("Kosongkan", "選択解除");
    $("[data-download-selected]", modal).textContent = copy("Unduh pilihan", "選択を保存");
    $("[data-remove-selected]", modal).textContent = copy("Hapus unduhan", "保存を削除");
    $("[data-captcha-status]", modal).textContent = config.turnstileSiteKey
      ? copy("Perlindungan CAPTCHA Turnstile aktif untuk pembuatan akun anonim.", "匿名アカウント作成時のTurnstile保護が有効です。")
      : copy("Fondasi CAPTCHA sudah siap. Masukkan Turnstile Site Key di runtime-config.js setelah Secret Key diaktifkan pada dashboard Supabase.", "CAPTCHAの準備は完了しています。SupabaseでSecret Keyを設定後、runtime-config.jsにTurnstile Site Keyを入力してください。");
  }

  function normalizeSpeech(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replace(/[ァ-ン]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60)).replace(/[^\p{L}\p{N}]+/gu, "");
  }
  function editDistance(left, right) {
    const a = [...normalizeSpeech(left)], b = [...normalizeSpeech(right)];
    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
    return previous[b.length] || 0;
  }
  function pronunciationScore(heard, target, confidence = 0) {
    const left = normalizeSpeech(heard), right = normalizeSpeech(target);
    if (!left || !right) return 0;
    const similarity = 1 - editDistance(left, right) / Math.max(left.length, right.length, 1);
    const certainty = Number.isFinite(Number(confidence)) && Number(confidence) > 0 ? Number(confidence) : similarity;
    return Math.round(Math.max(0, Math.min(1, similarity * .84 + certainty * .16)) * 100);
  }
  function showPronunciation(detail) {
    const micBox = $("#micBox") || $("#quizPage .mic-box") || $("#quizPage .speech-box");
    if (!micBox) return;
    let feedback = $("#wkPronunciationFeedback");
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.id = "wkPronunciationFeedback";
      feedback.className = "wk-pronunciation-feedback";
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      micBox.appendChild(feedback);
    }
    const score = pronunciationScore(detail.heard, detail.target, detail.confidence);
    const level = score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "fair" : "retry";
    const labels = isJa()
      ? { excellent:"とても自然です", good:"よく聞き取れました", fair:"もう少しゆっくり", retry:"もう一度発音しましょう" }
      : { excellent:"Sangat alami", good:"Pelafalan jelas", fair:"Coba lebih perlahan", retry:"Ulangi pelafalannya" };
    feedback.dataset.level = level;
    feedback.innerHTML = `<span class="wk-pronunciation-ring" style="--score:${score}"><strong>${score}</strong><small>/100</small></span><span><strong>${labels[level]}</strong><small>${copy(`Terdengar: ${detail.heard || "—"}`, `聞こえた音: ${detail.heard || "—"}`)}</small></span>`;
  }

  function bind() {
    ensureMenuButton();
    document.addEventListener("wikaru:language-changed", updateCopy);
    document.addEventListener("wikaru:cloud-auth", updateAccountStatus);
    document.addEventListener("wikaru:permanent-auth-ready", () => { queueLocalHistoryForPermanentAccount(); updateAccountStatus(); });
    document.addEventListener("wikaru:pronunciation-result", event => showPronunciation(event.detail || {}));
    new MutationObserver(ensureMenuButton).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true }); else bind();
})();
