import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const client = read("assets/js/supabase-client.js");
const app = read("assets/js/app.js");
const enhancements = read("assets/js/enhancements.js");
const html = read("index.html");
const sw = read("sw.js");
const schema = read("supabase/schema.sql");

for (const [file, source] of [["supabase-client.js", client], ["app.js", app]]) {
  const syntax = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source, encoding: "utf8" });
  assert(syntax.status === 0, `Syntax ${file} gagal: ${syntax.stderr || syntax.stdout}`);
}

assert(client.includes('url: "https://aiystwombsmsbqbjflgb.supabase.co"'), "Project URL Supabase salah");
assert(client.includes('publishableKey: "sb_publishable_'), "Publishable Key Supabase tidak ditemukan");
assert(client.includes('adminEmail: "lakssanavisch@gmail.com"'), "Email pengelola Supabase salah");
assert(client.includes("@supabase/supabase-js@2.112.4/+esm"), "SDK Supabase tidak dipin ke versi yang diaudit");
assert(!/service[_-]?role|sb_secret_|secret[_-]?key/i.test(client), "Secret Supabase tidak boleh berada di frontend");
assert(!/ADMIN_PASSWORD|sha256Hex|firebaseConfig|initializeApp\s*\(/.test(app), "Autentikasi frontend lama masih aktif");
assert(!/firebase/i.test([client, app, enhancements, html, sw].join("\n")), "Referensi Firebase masih berada di runtime produksi");

for (const symbol of [
  "initializeSupabase", "ensureParticipantSession", "signInWikaruAdmin", "signOutWikaruAdmin",
  "saveCloudResult", "fetchParticipantResults", "fetchAdminResults", "deleteAllCloudResults"
]) assert(app.includes(symbol), `Integrasi ${symbol} tidak terhubung ke aplikasi`);
assert(app.includes("if(!state.session && status.authenticated && !status.anonymous)"), "Sesi pengelola persisten tidak dibersihkan ketika UI sudah logout");
assert(app.includes("await signOutWikaruAdmin();"), "Pembersihan sesi pengelola tidak terhubung");

const saveResultStart = app.indexOf("async function saveResult(result)");
const saveResultEnd = app.indexOf("function resultTextMap", saveResultStart);
const saveFlow = app.slice(saveResultStart, saveResultEnd);
assert(saveFlow.indexOf("setLocalResults(local)") < saveFlow.indexOf("queueCloudResult(result)"), "Hasil tidak disimpan lokal sebelum masuk antrean cloud");
assert(saveFlow.indexOf("queueCloudResult(result)") < saveFlow.indexOf("syncOneResult(result)"), "Sinkronisasi dapat berjalan sebelum antrean aman");
assert(saveFlow.includes("catch(e)") && saveFlow.includes('toast(t("localOnly"))'), "Fallback lokal saat Supabase gagal hilang");

assert(html.includes("https://cdn.jsdelivr.net"), "CSP belum mengizinkan SDK Supabase yang dipin");
assert(html.includes("https://aiystwombsmsbqbjflgb.supabase.co"), "CSP belum mengizinkan REST Supabase");
assert(html.includes("wss://aiystwombsmsbqbjflgb.supabase.co"), "CSP belum mengizinkan Realtime Supabase");
assert(!html.includes("*.supabase.co"), "CSP Supabase terlalu luas");
assert(sw.includes("wikaru-static-v39u1-20260903") && sw.includes("assets/js/supabase-client.js"), "Service worker belum meng-cache klien Supabase");

assert(schema.includes("alter table public.wikaru_quiz_results enable row level security"), "RLS tabel hasil belum aktif");
assert(schema.includes("alter table public.wikaru_quiz_results force row level security"), "FORCE RLS tabel hasil belum aktif");
assert(schema.includes("owner_id uuid not null default auth.uid()"), "Kepemilikan hasil tidak diturunkan dari UID login");
assert(schema.includes("unique (owner_id, local_id)"), "Idempotensi hasil cloud belum dijamin");
assert(schema.includes("owner_id = auth.uid()"), "Policy peserta tidak memeriksa UID");
assert(schema.includes("public.is_wikaru_admin()"), "Policy pengelola tidak memeriksa tabel admin");
assert(schema.includes("revoke all on table public.wikaru_quiz_results from public, anon"), "Role publik/anon masih mendapat hak tabel langsung");
assert(schema.includes("grant select, insert, update, delete on table public.wikaru_quiz_results to authenticated"), "Role authenticated belum memperoleh hak yang dibatasi RLS");
assert((schema.match(/create policy /g) || []).length === 5, "Jumlah policy RLS berubah");

const cssHashes = {
  "assets/css/app-management.css": "e183f2d6f336221049de1a07ea73462a9ffd5a6615f6e932385a5a119eaddb40",
  "assets/css/app.css": "1f43c01da99ccb671954a953019704ed58b79b7a7c70efa0c2020dfa3cf6f827",
  "assets/css/asset-system.css": "a8786bbfa613b7754d01af2f8e34b01a70d3637e64b99639ec050b1a7055183b",
  "assets/css/learning-hub.css": "1006080bb8f765ca4560e55d0b1439134c5204e3ca602f8c9f76ac07335aa0a1",
  "assets/css/mascot.css": "43f600dd55182d0f7adbaa1f640ae1247c8393e91066d1fec3dbe5dfeff32c70",
  "assets/css/quiz-guide.css": "a313553f3fa04b4b42aed1c9ebc02d0652f41dffeef34f7bf9784611e6df2efb"
};
for (const [file, expected] of Object.entries(cssHashes)) {
  assert(sha(fs.readFileSync(path.join(root, file))) === expected, `Tampilan berubah: ${file}`);
}

const treeHash = directory => {
  const hash = crypto.createHash("sha256");
  const files = fs.readdirSync(path.join(root, directory)).filter(file => fs.statSync(path.join(root, directory, file)).isFile()&&!file.includes("v35")).sort();
  for (const file of files) {
    hash.update(file); hash.update("\0"); hash.update(fs.readFileSync(path.join(root, directory, file))); hash.update("\0");
  }
  return hash.digest("hex");
};
const assetTrees = {
  "assets/profile": "402116e1f9bcd9ba1e5d044f2c665b213647afe4f3c5761d5fe0988362389d34",
  "assets/mascot": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "assets/region": "6d33d65c54fe8bfb05289bbe7819b375ab4134ffd01228e8fb36ee0571b1af08",
  "assets/icons": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "assets/cursor": "f092f745aef5dafe6cdbc7a3dd1befcd90afc55872e9c77fd8f79ac08f3b6ddf"
};
for (const [directory, expected] of Object.entries(assetTrees)) {
  assert(treeHash(directory) === expected, `Aset visual berubah: ${directory}`);
}

console.log(JSON.stringify({
  status: "PASS",
  provider: "supabase",
  auth: ["anonymous-participant", "password-admin", "database-admin-role"],
  rlsPolicies: 5,
  localFirstFallback: true,
  productionSecretsInFrontend: 0,
  visualAssets: "v39-reference-icons",
  sdk: "@supabase/supabase-js@2.112.4"
}));
