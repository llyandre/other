const assert = (condition, message) => { if (!condition) throw new Error(message); };

class ClassList {
  constructor(owner) { this.owner = owner; this.values = new Set(); }
  add(...values) { values.forEach(value => this.values.add(value)); }
  remove(...values) { values.forEach(value => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = new ClassList(this);
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.isConnected = false;
    this.textContent = "";
    this._html = "";
    this._nodes = new Map();
  }
  set className(value) { this._className = value; String(value).split(/\s+/).filter(Boolean).forEach(item => this.classList.add(item)); }
  get className() { return this._className || ""; }
  set innerHTML(value) {
    this._html = String(value);
    if (this._html.includes("wk-mascot-close")) {
      const kicker = new FakeElement("p");
      kicker.className = "wk-mascot-kicker";
      const title = new FakeElement("h2");
      title.className = "wk-mascot-title";
      const message = new FakeElement("p");
      message.className = "wk-mascot-message";
      const image = new FakeElement("img");
      const close = new FakeElement("button");
      close.className = "wk-mascot-close";
      close.disabled = true;
      const countdown = new FakeElement("span");
      countdown.className = "wk-mascot-countdown";
      countdown.textContent = "5";
      close._nodes.set(".wk-mascot-countdown", countdown);
      this._nodes.set(".wk-mascot-kicker", kicker);
      this._nodes.set(".wk-mascot-title", title);
      this._nodes.set(".wk-mascot-message", message);
      this._nodes.set(".wk-mascot-art img", image);
      this._nodes.set(".wk-mascot-close", close);
      this._nodes.set(".wk-mascot-countdown", countdown);
    }
  }
  get innerHTML() { return this._html; }
  appendChild(child) { child.parentNode = this; child.isConnected = true; this.children.push(child); return child; }
  replaceChildren(...children) { this.children.forEach(child => { child.isConnected = false; child.parentNode = null; }); this.children = []; children.forEach(child => this.appendChild(child)); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; this.isConnected = false; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, listener) { const list = this.listeners.get(type) || []; list.push(listener); this.listeners.set(type, list); }
  click() { for (const listener of this.listeners.get("click") || []) listener({ target: this }); }
  querySelector(selector) { return this._nodes.get(selector) || null; }
  querySelectorAll() { return []; }
  getClientRects() { return [{ width: 100, height: 40 }]; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40 }; }
  focus() { fakeDocument.activeElement = this; }
}

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const documentListeners = new Map();
const fakeDocument = {
  readyState: "complete",
  visibilityState: "visible",
  activeElement: null,
  documentElement: { lang: "id", classList: new ClassList(null) },
  body: new FakeElement("body"),
  createElement: tag => new FakeElement(tag),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(type, listener) { const list = documentListeners.get(type) || []; list.push(listener); documentListeners.set(type, list); },
  dispatchEvent(event) { for (const listener of documentListeners.get(event.type) || []) listener(event); return true; }
};
fakeDocument.body.isConnected = true;

const local = new MemoryStorage();
const session = new MemoryStorage();
local.setItem("wikaru_mascot_v1_onboarding_completed", "completed");
local.setItem("wikaru_mascot_v1_eye_20_20_20_enabled", "yes");
session.setItem("wikaru_mascot_v1_active_ms", String(60 * 60 * 1000));
session.setItem("wikaru_mascot_v1_eye_20_20_20_block", "3");
const intervals = [];
const mutationObservers = [];
let perfNow = 0;
const windowListeners = new Map();
const fakeWindow = {
  setInterval(callback, delay) { const timer = { callback, delay, active: true }; intervals.push(timer); return timer; },
  clearInterval(timer) { if (timer) timer.active = false; },
  setTimeout(callback) { callback(); return 1; },
  addEventListener(type, listener) { const list = windowListeners.get(type) || []; list.push(listener); windowListeners.set(type, list); }
};

Object.assign(globalThis, {
  window: fakeWindow,
  document: fakeDocument,
  localStorage: local,
  sessionStorage: session,
  location: { search: "" },
  innerWidth: 1440,
  innerHeight: 900,
  scrollY: 0,
  scrollTo: () => {},
  performance: { now: () => perfNow },
  matchMedia: () => ({ matches: true }),
  MutationObserver: class {
    constructor(callback) { this.callback = callback; mutationObservers.push(this); }
    observe() {}
    disconnect() {}
  },
  ResizeObserver: class { observe() {} disconnect() {} }
});

await import(`../assets/js/mascot.js?runtime=${Date.now()}`);
await Promise.resolve();

assert(fakeWindow.WikaruMascot?.version === "v1", "API maskot tidak aktif");
const root = fakeDocument.body.children.find(child => child.id === "wikaruMascotRoot");
assert(root, "Root notifikasi tidak dibuat");

const activeTimer = intervals[0];
activeTimer.callback();
assert(root.children.length === 1, "Notifikasi satu jam tidak muncul");
const hourCard = root.children[0];
assert(hourCard.dataset.expression === "welcome", "Pengingat satu jam harus memakai ekspresi ramah");
fakeDocument.documentElement.lang = "ja";
mutationObservers.forEach(observer => observer.callback([]));
assert(hourCard.querySelector(".wk-mascot-title").textContent.includes("一時間"), "Judul satu jam tidak berubah ke bahasa Jepang");
assert(hourCard.querySelector(".wk-mascot-message").textContent.includes("5分"), "Durasi jeda Jepang tidak tampil");
const hourClose = hourCard.querySelector(".wk-mascot-close");
const hourCountdownTimer = intervals.at(-1);
for (let index = 0; index < 5; index += 1) hourCountdownTimer.callback();
hourClose.click();
assert(root.children.length === 0, "Pengingat satu jam tidak dapat ditutup manual");

fakeDocument.documentElement.lang = "id";
mutationObservers.forEach(observer => observer.callback([]));
perfNow += 20 * 60 * 1000;
activeTimer.callback();
assert(root.children.length === 1, "Pengingat mata opsional tidak muncul pada menit ke-80");
const eyeCard = root.children[0];
mutationObservers.forEach(observer => observer.callback([]));
assert(eyeCard.querySelector(".wk-mascot-title").textContent.includes("20-20-20"), "Isi pengingat mata salah");
const eyeClose = eyeCard.querySelector(".wk-mascot-close");
const eyeCountdownTimer = intervals.at(-1);
for (let index = 0; index < 5; index += 1) eyeCountdownTimer.callback();
eyeClose.click();

perfNow += 40 * 60 * 1000;
activeTimer.callback();
assert(root.children.length === 1, "Notifikasi pengingat dua jam tidak muncul");
const restCard = root.children[0];
assert(restCard.dataset.expression === "rest-angry", "Ekspresi marah salah");
fakeDocument.documentElement.lang = "ja";
mutationObservers.forEach(observer => observer.callback([]));
assert(restCard.querySelector(".wk-mascot-title").textContent.includes("二時間"), "Judul notifikasi aktif tidak berubah ke bahasa Jepang");
assert(restCard.querySelector(".wk-mascot-message").textContent.includes("10分間"), "Durasi istirahat Jepang tidak tampil");
fakeDocument.documentElement.lang = "id";
mutationObservers.forEach(observer => observer.callback([]));
assert(restCard.querySelector(".wk-mascot-title").textContent.includes("dua jam"), "Judul notifikasi aktif tidak kembali ke bahasa Indonesia");
const restClose = restCard.querySelector(".wk-mascot-close");
assert(restClose.disabled, "Notifikasi dapat ditutup sebelum lima detik");
restClose.click();
assert(root.children.length === 1, "Notifikasi tertutup sebelum lima detik");
const countdownTimer = intervals.at(-1);
for (let index = 0; index < 5; index += 1) countdownTimer.callback();
assert(!restClose.disabled, "Tombol tutup tidak aktif setelah lima detik");
restClose.click();
assert(root.children.length === 0, "Penutupan manual tidak bekerja");

fakeDocument.dispatchEvent({
  type: "wikaru:quiz-finished",
  detail: { result: { localId: "runtime-perfect", scorePercent: 100, kkmStatus: "Lulus" } }
});
assert(root.children.length === 1, "Notifikasi hasil kuis tidak muncul");
assert(root.children[0].dataset.expression === "perfect", "Nilai sempurna tidak memakai ekspresi bahagia sekali");

console.log(JSON.stringify({
  status: "PASS",
  manualCloseLockedMs: 5000,
  oneHourBreakMinutes: 5,
  twoHourBreakMinutes: 10,
  eye202020Optional: true,
  angryRestReminder: true,
  liveLanguageSwitch: true,
  perfectScoreEvent: true,
  duplicateGuardStored: JSON.parse(local.getItem("wikaru_mascot_v1_quiz_results")).includes("runtime-perfect")
}));
