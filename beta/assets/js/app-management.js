/* Wikaru app management v1 — safe update prompt and verified local backup. */
(() => {
  "use strict";

  if (window.__WIKARU_APP_MANAGEMENT_V1) return;
  window.__WIKARU_APP_MANAGEMENT_V1 = true;

  const BACKUP_FORMAT = "wikaru-local-backup";
  const BACKUP_VERSION = 1;
  const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
  const DISMISS_KEY = "wikaru_update_dismissed_session";
  const BLOCKED_KEYS = new Set([
    "minna_bab23_adminAttempt",
    "minna_bab23_adminLastLogin",
    "minna_bab23_deviceId",
    "minna_bab23_pendingCloudResults"
  ]);
  let backupRoot = null;
  let updateRoot = null;
  let pendingBackup = null;
  let previousFocus = null;
  let reloadOnControllerChange = false;
  const watchedRegistrations = new WeakSet();
  const watchedWorkers = new WeakSet();

  function language() {
    return String(document.documentElement.lang || "id").startsWith("ja") ? "ja" : "id";
  }

  function text(idText,jaText) { return language() === "ja" ? jaText : idText; }

  function isAllowedKey(key) {
    const value = String(key || "");
    return value.length > 0 && value.length <= 180 && (value.startsWith("minna_bab23") || value.startsWith("wikaru_")) && !BLOCKED_KEYS.has(value);
  }

  function storageKeys() {
    const result = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (isAllowedKey(key)) result.push(key);
      }
    } catch (_) {}
    return result.sort();
  }

  function canonicalData(data) {
    return JSON.stringify(Object.keys(data).sort().map(key => [key,data[key]]));
  }

  async function sha256(value) {
    if (!globalThis.crypto?.subtle) throw new Error(text("Pemeriksaan checksum tidak didukung browser ini.","このブラウザーはチェックサム検証に対応していません。"));
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256",bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,"0")).join("");
  }

  function safeDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function downloadBlob(blob,name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  function setBackupStatus(message,type="") {
    const status = backupRoot?.querySelector("[data-backup-status]");
    if (!status) return;
    status.textContent = message;
    status.className = `wk-backup-status${type ? ` is-${type}` : ""}`;
  }

  function updateBackupCopy() {
    const root = backupRoot;
    if (!root) return;
    root.querySelector("[data-backup-kicker]").textContent = text("DATA BELAJAR LOKAL","ローカル学習データ");
    root.querySelector("[data-backup-title]").textContent = text("Backup progres Wikaru","Wikaru学習データのバックアップ");
    root.querySelector("[data-backup-lead]").textContent = text("Simpan progres, riwayat, favorit, pengaturan, dan jadwal belajar ke satu file JSON yang dapat dipulihkan di browser lain.","進捗、履歴、お気に入り、設定、学習予定をJSONファイルに保存し、別のブラウザーで復元できます。");
    root.querySelector("[data-backup-info]").textContent = text("Data sensitif perangkat, antrean cloud, dan status percobaan admin tidak ikut diekspor. File impor wajib lolos checksum sebelum dipakai.","端末固有情報、クラウド待機列、管理者試行状態は書き出されません。読み込み前にチェックサムを検証します。");
    root.querySelector("[data-backup-export-label]").textContent = text("Unduh backup","バックアップを保存");
    root.querySelector("[data-backup-import-label]").textContent = text("Pilih file backup","バックアップを選択");
    root.querySelector("[data-backup-cancel]").textContent = text("Batal","キャンセル");
    root.querySelector("[data-backup-restore]").textContent = text("Pulihkan data","データを復元");
    root.querySelector("[data-backup-close]").setAttribute("aria-label",text("Tutup backup progres","バックアップを閉じる"));
  }

  function ensureBackupRoot() {
    if (backupRoot) return backupRoot;
    backupRoot = document.createElement("section");
    backupRoot.className = "wk-backup-modal";
    backupRoot.id = "wikaruBackupModal";
    backupRoot.hidden = true;
    backupRoot.setAttribute("role","dialog");
    backupRoot.setAttribute("aria-modal","true");
    backupRoot.setAttribute("aria-labelledby","wikaruBackupTitle");
    backupRoot.innerHTML = `
      <article class="wk-backup-card" tabindex="-1">
        <button class="wk-backup-close" type="button" data-backup-close><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <span class="wk-backup-kicker"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span data-backup-kicker></span></span>
        <h2 id="wikaruBackupTitle" data-backup-title></h2>
        <p class="wk-backup-lead" data-backup-lead></p>
        <div class="wk-backup-info"><i class="fa-solid fa-lock" aria-hidden="true"></i><span data-backup-info></span></div>
        <div class="wk-backup-actions">
          <button class="wk-manage-button primary" type="button" data-backup-export><i class="fa-solid fa-download" aria-hidden="true"></i><span data-backup-export-label></span></button>
          <label class="wk-backup-file-label" role="button" tabindex="0"><i class="fa-solid fa-file-import" aria-hidden="true"></i><span data-backup-import-label></span><input type="file" accept="application/json,.json" data-backup-file aria-label="${text("Pilih file backup Wikaru","Wikaruバックアップファイルを選択")}"></label>
        </div>
        <div class="wk-backup-preview" data-backup-preview hidden>
          <strong data-backup-preview-title></strong><p data-backup-preview-copy></p>
          <div class="wk-backup-preview-actions"><button class="wk-manage-button" type="button" data-backup-cancel></button><button class="wk-manage-button primary" type="button" data-backup-restore></button></div>
        </div>
        <p class="wk-backup-status" data-backup-status role="status" aria-live="polite"></p>
      </article>`;
    document.body.appendChild(backupRoot);
    updateBackupCopy();
    backupRoot.addEventListener("click",event => {
      if (event.target === backupRoot || event.target.closest("[data-backup-close]")) closeBackup();
      if (event.target.closest("[data-backup-export]")) exportBackup();
      if (event.target.closest("[data-backup-cancel]")) clearBackupPreview();
      if (event.target.closest("[data-backup-restore]")) restoreBackup();
    });
    backupRoot.querySelector("[data-backup-file]").addEventListener("change",event => inspectBackupFile(event.target.files?.[0]));
    backupRoot.querySelector(".wk-backup-file-label").addEventListener("keydown",event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      backupRoot.querySelector("[data-backup-file]").click();
    });
    backupRoot.addEventListener("keydown",trapBackupFocus);
    return backupRoot;
  }

  function ensureBackupMenu() {
    const menu = document.querySelector("#userDropdown .profile-menu-scroll");
    if (!menu || document.getElementById("wikaruBackupBtn")) return;
    const button = document.createElement("button");
    button.className = "drop-item";
    button.id = "wikaruBackupBtn";
    button.type = "button";
    button.setAttribute("role","menuitem");
    button.innerHTML = '<i class="fa-solid fa-box-archive" aria-hidden="true"></i><span data-backup-menu-label></span>';
    const divider = menu.querySelector(".profile-menu-divider");
    menu.insertBefore(button,divider || null);
    updateMenuCopy();
  }

  function updateMenuCopy() {
    const label = document.querySelector("#wikaruBackupBtn [data-backup-menu-label]");
    if (label) label.textContent = text("Backup progres","進捗をバックアップ");
    updateBackupCopy();
    updateUpdateCopy();
  }

  function openBackup() {
    const root = ensureBackupRoot();
    previousFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("wk-backup-open");
    clearBackupPreview();
    setBackupStatus(text("Backup hanya disimpan ketika Anda menekan tombol unduh.","保存ボタンを押したときだけバックアップが作成されます。"));
    requestAnimationFrame(() => root.querySelector(".wk-backup-card")?.focus());
  }

  function closeBackup() {
    if (!backupRoot || backupRoot.hidden) return;
    backupRoot.hidden = true;
    document.body.classList.remove("wk-backup-open");
    pendingBackup = null;
    previousFocus?.focus?.();
  }

  function trapBackupFocus(event) {
    if (event.key === "Escape") { event.preventDefault(); closeBackup(); return; }
    if (event.key !== "Tab") return;
    const controls = [...backupRoot.querySelectorAll('button:not(:disabled),label,input:not(:disabled),[tabindex="0"]')].filter(node => !node.closest("[hidden]"));
    if (!controls.length) return;
    const first = controls[0],last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  async function exportBackup() {
    try {
      setBackupStatus(text("Menyiapkan backup…","バックアップを準備しています…"));
      const data = {};
      for (const key of storageKeys()) {
        const value = localStorage.getItem(key);
        if (typeof value === "string") data[key] = value;
      }
      const exportedAt = new Date().toISOString();
      const checksum = await sha256(canonicalData(data));
      const payload = {format:BACKUP_FORMAT,version:BACKUP_VERSION,exportedAt,itemCount:Object.keys(data).length,checksum:`sha256:${checksum}`,data};
      const date = exportedAt.slice(0,10);
      downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),`wikaru-backup-${date}.json`);
      setBackupStatus(text(`Backup berhasil dibuat (${payload.itemCount} bagian data).`,`バックアップを作成しました（${payload.itemCount}件）。`),"success");
    } catch (error) {
      setBackupStatus(error?.message || text("Backup gagal dibuat.","バックアップを作成できませんでした。"),"error");
    }
  }

  function clearBackupPreview() {
    pendingBackup = null;
    const preview = backupRoot?.querySelector("[data-backup-preview]");
    if (preview) preview.hidden = true;
    const input = backupRoot?.querySelector("[data-backup-file]");
    if (input) input.value = "";
  }

  async function inspectBackupFile(file) {
    clearBackupPreview();
    if (!file) return;
    try {
      if (file.size <= 0 || file.size > MAX_BACKUP_BYTES) throw new Error(text("Ukuran file backup tidak valid (maksimal 8 MB).","バックアップは8MB以下にしてください。"));
      const parsed = JSON.parse(await file.text());
      if (parsed?.format !== BACKUP_FORMAT || parsed?.version !== BACKUP_VERSION || !parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) throw new Error(text("Format file bukan backup Wikaru yang didukung.","対応しているWikaruバックアップではありません。"));
      const entries = Object.entries(parsed.data);
      if (entries.length > 300 || entries.some(([key,value]) => !isAllowedKey(key) || typeof value !== "string")) throw new Error(text("Isi backup memiliki kunci atau nilai yang tidak diizinkan.","バックアップに許可されていない項目があります。"));
      const checksum = await sha256(canonicalData(parsed.data));
      if (parsed.checksum !== `sha256:${checksum}`) throw new Error(text("Checksum tidak cocok. File mungkin rusak atau telah diubah.","チェックサムが一致しません。ファイルが破損または変更されています。"));
      pendingBackup = parsed;
      const date = safeDate(parsed.exportedAt);
      const dateLabel = date ? new Intl.DateTimeFormat(language() === "ja" ? "ja-JP" : "id-ID",{dateStyle:"medium",timeStyle:"short"}).format(date) : text("tanggal tidak tersedia","日時不明");
      const preview = backupRoot.querySelector("[data-backup-preview]");
      preview.hidden = false;
      preview.querySelector("[data-backup-preview-title]").textContent = text("Backup valid dan siap dipulihkan","有効なバックアップです");
      preview.querySelector("[data-backup-preview-copy]").textContent = text(`${entries.length} bagian data • dibuat ${dateLabel}. Data saat ini hanya ditimpa untuk kunci yang ada di backup.`,`${entries.length}件 • ${dateLabel}に作成。バックアップ内の項目だけを上書きします。`);
      setBackupStatus(text("Periksa ringkasan lalu tekan Pulihkan data.","内容を確認して「データを復元」を押してください。"));
    } catch (error) {
      setBackupStatus(error?.message || text("File backup tidak dapat dibaca.","バックアップを読み込めません。"),"error");
    }
  }

  function restoreBackup() {
    if (!pendingBackup) return;
    const previous = new Map();
    const entries = Object.entries(pendingBackup.data);
    try {
      for (const [key] of entries) previous.set(key,localStorage.getItem(key));
      for (const [key,value] of entries) localStorage.setItem(key,value);
      localStorage.setItem("wikaru_backup_last_import",new Date().toISOString());
      pendingBackup = null;
      setBackupStatus(text("Data berhasil dipulihkan. Wikaru akan dimuat ulang…","データを復元しました。Wikaruを再読み込みします…"),"success");
      window.setTimeout(() => location.reload(),700);
    } catch (error) {
      for (const [key,value] of previous) {
        try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key,value); } catch (_) {}
      }
      setBackupStatus(text("Pemulihan dibatalkan dan data sebelumnya dikembalikan.","復元を中止し、以前のデータに戻しました。"),"error");
    }
  }

  function ensureUpdateRoot() {
    if (updateRoot) return updateRoot;
    updateRoot = document.createElement("aside");
    updateRoot.className = "wk-update-notice";
    updateRoot.id = "wikaruUpdateNotice";
    updateRoot.setAttribute("role","status");
    updateRoot.setAttribute("aria-live","polite");
    updateRoot.innerHTML = `
      <span class="wk-update-icon" aria-hidden="true"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
      <div class="wk-update-copy"><strong data-update-title></strong><p data-update-copy></p></div>
      <div class="wk-update-actions"><button class="wk-manage-button" type="button" data-update-later></button><button class="wk-manage-button primary" type="button" data-update-now></button></div>`;
    document.body.appendChild(updateRoot);
    updateUpdateCopy();
    updateRoot.addEventListener("click",event => {
      if (event.target.closest("[data-update-later]")) dismissUpdate();
      if (event.target.closest("[data-update-now]")) applyUpdate();
    });
    return updateRoot;
  }

  function updateUpdateCopy() {
    if (!updateRoot) return;
    updateRoot.querySelector("[data-update-title]").textContent = text("Versi baru Wikaru siap","Wikaruの新しいバージョンがあります");
    updateRoot.querySelector("[data-update-copy]").textContent = text("Selesaikan aktivitasmu, lalu perbarui untuk memakai versi terbaru.","学習を終えてから、最新版に更新してください。");
    updateRoot.querySelector("[data-update-later]").textContent = text("Nanti","あとで");
    updateRoot.querySelector("[data-update-now]").textContent = text("Perbarui","更新する");
  }

  function showUpdate(registration) {
    try { if (sessionStorage.getItem(DISMISS_KEY) === "1") return; } catch (_) {}
    const root = ensureUpdateRoot();
    root._registration = registration;
    requestAnimationFrame(() => root.classList.add("is-visible"));
  }

  function dismissUpdate() {
    try { sessionStorage.setItem(DISMISS_KEY,"1"); } catch (_) {}
    updateRoot?.classList.remove("is-visible");
  }

  async function applyUpdate() {
    const registration = updateRoot?._registration || await navigator.serviceWorker?.getRegistration?.();
    const worker = registration?.waiting;
    if (!worker) { registration?.update?.(); return; }
    reloadOnControllerChange = true;
    const button = updateRoot.querySelector("[data-update-now]");
    button.disabled = true;
    button.textContent = text("Memperbarui…","更新中…");
    worker.postMessage({type:"SKIP_WAITING"});
  }

  function watchRegistration(registration) {
    if (!registration || watchedRegistrations.has(registration)) return;
    watchedRegistrations.add(registration);
    if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration);
    const watchInstalling = installing => {
      if (!installing || watchedWorkers.has(installing)) return;
      watchedWorkers.add(installing);
      installing.addEventListener("statechange",() => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) showUpdate(registration);
      });
    };
    watchInstalling(registration.installing);
    registration.addEventListener("updatefound",() => {
      watchInstalling(registration.installing);
    });
  }

  async function checkForUpdate() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return null;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return null;
      watchRegistration(registration);
      await registration.update();
      return registration;
    } catch (_) { return null; }
  }

  function bind() {
    ensureBackupRoot();
    ensureBackupMenu();
    document.addEventListener("click",event => {
      if (!event.target.closest?.("#wikaruBackupBtn")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openBackup();
    },true);
    new MutationObserver(() => { ensureBackupMenu(); updateMenuCopy(); }).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange",() => {
        if (!reloadOnControllerChange) return;
        reloadOnControllerChange = false;
        location.reload();
      });
      window.addEventListener("load",() => window.setTimeout(checkForUpdate,700),{once:true});
    }
  }

  window.WikaruBackup = Object.freeze({open:openBackup,export:exportBackup,isAllowedKey});
  window.WikaruUpdateManager = Object.freeze({check:checkForUpdate});

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",bind,{once:true});
  else bind();
})();
