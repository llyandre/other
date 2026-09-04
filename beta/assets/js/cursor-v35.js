/* Wikaru GitHub deploy v38 — eight distinct seal cursors for fine pointers only. */
(() => {
  "use strict";
  if (window.__WIKARU_CURSOR_GITHUB_V38) return;
  window.__WIKARU_CURSOR_GITHUB_V38 = true;

  const KEY = "wikaru_cursor_github_v38";
  const LEGACY_KEYS = ["wikaru_cursor_github_v37", "wikaru_cursor_github_v36"];
  const STATES = Object.freeze(["normal", "happy", "hover", "click", "loading", "typing", "success", "sleep"]);
  const fine = matchMedia("(hover:hover) and (pointer:fine), (any-hover:hover) and (any-pointer:fine)");
  const touchFirst = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  let enabled = true;
  let ready = false;
  let state = "normal";
  let lockedUntil = 0;
  let idleTimer = 0;

  try {
    const saved = localStorage.getItem(KEY) ?? LEGACY_KEYS.map(key => localStorage.getItem(key)).find(value => value !== null);
    enabled = saved !== "0";
  } catch (_) {}

  const capable = () => fine.matches && !touchFirst;
  const stateFor = target => {
    if (!(target instanceof Element)) return "normal";
    if (target.closest(':disabled,[aria-disabled="true"],.disabled')) return "sleep";
    if (target.closest('input,textarea,[contenteditable="true"],[role="textbox"]')) return "typing";
    if (target.closest('a,button,select,label,[role="button"],[role="link"],[data-action],[data-page],.clickable')) return "hover";
    return "normal";
  };
  const setState = (next, hold = 0) => {
    if (Date.now() < lockedUntil && !hold) return;
    state = STATES.includes(next) ? next : "normal";
    if (hold) lockedUntil = Date.now() + hold;
    document.documentElement.dataset.wkCursorState = state;
  };
  const armSleep = () => {
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => setState("sleep"), 90000);
  };
  const update = () => {
    const active = enabled && ready && capable();
    document.documentElement.classList.toggle("wk-cursor-v38-enabled", active);
    const button = document.getElementById("mascotCursorV38Btn");
    if (button) {
      button.setAttribute("aria-checked", String(enabled));
      const status = button.querySelector("[data-v38-cursor-state]");
      if (status) status.textContent = !capable() ? "Khusus mouse" : active ? "Aktif" : "Nonaktif";
    }
  };
  const ensureMenu = () => {
    const menu = document.querySelector("#userDropdown .profile-menu-scroll,#userDropdown");
    if (!menu || document.getElementById("mascotCursorV38Btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "mascotCursorV38Btn";
    button.className = "drop-item";
    button.setAttribute("role", "menuitemcheckbox");
    button.innerHTML = '<i class="fa-solid fa-arrow-pointer" aria-hidden="true"></i><span>Cursor maskot</span><span class="fiction-state" data-v38-cursor-state></span>';
    button.addEventListener("click", event => {
      event.preventDefault();
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? "1" : "0"); } catch (_) {}
      update();
    });
    menu.appendChild(button);
    update();
  };
  const preload = () => Promise.all(STATES.map(name => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = reject;
    image.src = new URL(`../cursor/seal-cursor-${name}-v38.png`, import.meta.url).href;
  })));
  const boot = () => {
    setState("normal");
    ensureMenu();
    preload().then(() => { ready = true; update(); }).catch(() => { ready = false; update(); });
    document.addEventListener("pointermove", event => {
      if (event.pointerType === "touch" || !capable()) return;
      if (Date.now() >= lockedUntil) setState(stateFor(event.target));
      armSleep();
    }, { passive: true });
    document.addEventListener("pointerdown", event => {
      if (event.pointerType !== "touch" && enabled && ready && capable()) setState("click", 160);
    }, { passive: true });
    document.addEventListener("pointerup", event => {
      lockedUntil = 0;
      if (event.pointerType !== "touch") setState(stateFor(event.target));
    }, { passive: true });
    document.addEventListener("click", event => {
      if (event.target.closest?.("#correctBtn,.btn.good")) setState("happy", 700);
      if (event.target.closest?.("#userMenuBtn")) requestAnimationFrame(ensureMenu);
    }, true);
    document.addEventListener("wikaru:cursor-loading", () => setState("loading"));
    document.addEventListener("wikaru:cursor-happy", () => setState("happy", 700));
    document.addEventListener("wikaru:cursor-success", () => setState("success", 760));
    document.addEventListener("wikaru:quiz-finished", () => setState("success", 900));
    fine.addEventListener?.("change", update);
    armSleep();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
