import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const events = [];

globalThis.window = globalThis;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
};
globalThis.document = { dispatchEvent(event) { events.push(event); return true; } };

const database = { rows: [], sequence: 0 };
let session = null;
let authListener = null;
let clientOptions = null;

const participantKey = row => `${String(row.group_name || "-").trim().toLowerCase()}::${String(row.username || "").trim().toLowerCase()}`;
const isAdmin = () => session?.user?.id === "admin-uid" && !session?.user?.is_anonymous;
const visibleRows = () => isAdmin() ? database.rows : database.rows.filter(row => row.owner_id === session?.user?.id);

class Query {
  constructor() { this.action = "select"; this.filters = []; this.notFilters = []; this.input = null; this.max = Infinity; this.head = false; }
  select(_columns = "*", options = {}) { this.head = Boolean(options.head); return this; }
  insert(row) { this.action = "insert"; this.input = row; return this; }
  upsert(row) { this.action = "upsert"; this.input = row; return this; }
  delete() { this.action = "delete"; return this; }
  eq(column, value) { this.filters.push([column, value]); return this; }
  not(column, operator, value) { this.notFilters.push([column, operator, value]); return this; }
  order() { return this; }
  limit(value) { this.max = value; return this; }
  single() { return this.execute(true); }
  then(resolve, reject) { return this.execute(false).then(resolve, reject); }
  matches(row) {
    return this.filters.every(([column, value]) => row[column] === value)
      && this.notFilters.every(([column, operator, value]) => operator === "is" && value === null ? row[column] !== null : true);
  }
  async execute(single) {
    if (!session?.user?.id) return { data: null, error: new Error("mock-auth-required") };
    if (this.action === "insert" || this.action === "upsert") {
      const incoming = { ...this.input, owner_id: session.user.id };
      incoming.participant_key = participantKey(incoming);
      let row = database.rows.find(item => item.owner_id === incoming.owner_id && item.local_id === incoming.local_id);
      if (row && this.action === "upsert") Object.assign(row, incoming);
      else {
        row = { id: `row-${++database.sequence}`, ...incoming };
        database.rows.push(row);
      }
      return { data: single ? { ...row } : [{ ...row }], error: null };
    }
    if (this.action === "delete") {
      const allowed = new Set(visibleRows().filter(row => this.matches(row)).map(row => row.id));
      database.rows = database.rows.filter(row => !allowed.has(row.id));
      return { data: null, error: null };
    }
    const rows = visibleRows().filter(row => this.matches(row)).slice(0, this.max).map(row => ({ ...row }));
    if (this.head) return { data: null, error: null, count: rows.length };
    return { data: single ? (rows[0] || null) : rows, error: single && rows.length !== 1 ? new Error("mock-single-row") : null };
  }
}

globalThis.__WIKARU_MOCK_SDK__ = {
  createClient(url, key, options) {
    clientOptions = { url, key, options };
    return {
      auth: {
        async getSession() { return { data: { session }, error: null }; },
        onAuthStateChange(callback) { authListener = callback; return { data: { subscription: { unsubscribe() {} } } }; },
        async signInAnonymously() {
          session = { access_token: "anon-token", user: { id: "anon-uid", is_anonymous: true } };
          authListener?.("SIGNED_IN", session);
          return { data: { session }, error: null };
        },
        async signInWithPassword({ email, password }) {
          if (email !== "lakssanavisch@gmail.com" || password !== "correct-password") return { data: null, error: new Error("invalid-login") };
          session = { access_token: "admin-token", user: { id: "admin-uid", email, is_anonymous: false } };
          authListener?.("SIGNED_IN", session);
          return { data: { session }, error: null };
        },
        async signOut() {
          session = null;
          authListener?.("SIGNED_OUT", null);
          return { error: null };
        }
      },
      async rpc(name) { return name === "is_wikaru_admin" ? { data: isAdmin(), error: null } : { data: null, error: new Error("unknown-rpc") }; },
      from() { return new Query(); }
    };
  }
};

const source = fs.readFileSync(path.join(root, "assets/js/supabase-client.js"), "utf8")
  .replace("import(SUPABASE_CONFIG.sdkUrl)", "Promise.resolve(globalThis.__WIKARU_MOCK_SDK__)");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const cloud = await import(moduleUrl);

let status = await cloud.initializeSupabase({ ensureParticipant: true });
assert(status.authenticated && status.anonymous && !status.admin, "Sesi peserta anonim tidak terbentuk");
assert(clientOptions.url === "https://aiystwombsmsbqbjflgb.supabase.co", "Runtime memakai URL yang salah");
assert(clientOptions.key.startsWith("sb_publishable_"), "Runtime tidak memakai Publishable Key");
assert(clientOptions.options.auth.persistSession === true && clientOptions.options.auth.autoRefreshToken === true, "Persistensi sesi Supabase tidak aktif");

await assertRejects(() => cloud.fetchAdminResults(), "Peserta anonim dapat membaca data admin");
const saved = await cloud.saveCloudResult({
  localId: "runtime-result-1",
  username: "Ayu",
  group: "Badung",
  selectedLanguage: "id",
  selectedBook: "Minna no Nihongo I (2nd Edition)",
  selectedChapter: "Bab 1",
  totalQuestions: 10,
  correctCount: 9,
  wrongCount: 1,
  scorePercent: 90,
  totalDuration: 120,
  finishedAt: "2026-08-31T08:00:00.000Z",
  details: [{ no: 1, isCorrect: true }]
});
assert(saved.localId === "runtime-result-1" && saved.scorePercent === 90 && saved.source === "supabase", "Pemetaan hasil ke/dari Supabase berubah");
assert((await cloud.fetchParticipantResults("Ayu", "Badung")).length === 1, "Peserta tidak dapat membaca hasilnya sendiri");
assert((await cloud.fetchParticipantResults("Nama Lain", "Badung")).length === 0, "Filter identitas peserta tidak bekerja");
assert(await cloud.cloudHealthCheck(), "Health check Supabase gagal");
assert(await cloud.cloudRoundTripTest(), "Uji tulis-baca-hapus Supabase gagal");
assert(database.rows.length === 1, "Baris diagnostik tidak dibersihkan");

await assertRejects(() => cloud.signInWikaruAdmin("wrong-password"), "Password admin yang salah diterima");
await cloud.signInWikaruAdmin("correct-password");
status = cloud.cloudStatus();
assert(status.authenticated && status.admin && !status.anonymous, "Peran admin database tidak terverifikasi");
assert((await cloud.fetchAdminResults()).length === 1, "Admin tidak dapat membaca seluruh hasil");
assert(await cloud.deleteAllCloudResults(), "Admin tidak dapat menghapus hasil cloud");
assert(database.rows.length === 0, "Penghapusan admin tidak tuntas");
await cloud.signOutWikaruAdmin();
assert(!cloud.cloudStatus().authenticated, "Logout admin tidak membersihkan sesi");
assert(events.some(event => event.type === "wikaru:cloud-ready") && events.some(event => event.type === "wikaru:cloud-auth"), "Event status cloud tidak diterbitkan");

console.log(JSON.stringify({
  status: "PASS",
  scenarios: 12,
  anonymousAuth: true,
  adminAuth: true,
  roleCheck: true,
  saveReadDelete: true,
  diagnosticCleanup: true,
  eventBridge: true
}));

async function assertRejects(run, message) {
  let rejected = false;
  try { await run(); } catch { rejected = true; }
  assert(rejected, message);
}

