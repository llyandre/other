import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const js=read("assets/js/app-management.js");
const css=read("assets/css/app-management.css");
const html=read("index.html");
const sw=read("sw.js");
const workflow=read(".github/workflows/quality-audit.yml");
const playwright=read("qa/playwright.config.mjs");
const lighthouse=JSON.parse(read("qa/lighthouserc.json"));
const schema=read("supabase/schema.sql");

const syntax=spawnSync(process.execPath,["--input-type=module","--check"],{input:js,encoding:"utf8"});
assert(syntax.status===0,`Syntax app management gagal: ${syntax.stderr||syntax.stdout}`);
assert(html.includes("assets/css/app-management.css")&&html.includes("assets/js/app-management.js"),"Modul app management belum dimuat HTML");
assert(js.includes('const BACKUP_FORMAT = "wikaru-local-backup"'),"Format backup tidak memiliki identitas");
assert(js.includes("MAX_BACKUP_BYTES = 8 * 1024 * 1024"),"Batas ukuran backup hilang");
assert(js.includes('digest("SHA-256"'),"Backup tidak memakai checksum SHA-256");
assert(js.indexOf("parsed.checksum !==")<js.indexOf("pendingBackup = parsed"),"Data diterima sebelum checksum lolos");
assert(js.includes("BLOCKED_KEYS")&&js.includes("minna_bab23_deviceId")&&js.includes("minna_bab23_pendingCloudResults")&&js.includes("minna_bab23_adminAttempt"),"Kunci sensitif belum dikecualikan");
assert(!/localStorage\.clear\s*\(/.test(js),"Backup dapat menghapus seluruh origin storage");
assert(js.includes("const previous = new Map()")&&js.includes("previous.set(key,localStorage.getItem(key))"),"Rollback impor tidak tersedia");
assert(js.includes('worker.postMessage({type:"SKIP_WAITING"})'),"Update tidak menunggu tindakan pengguna");
assert(sw.includes("wikaru-static-v39u1-20260903"),"Cache aset v39 belum aktif");
assert(sw.includes('type==="SKIP_WAITING"'),"Service worker tidak menerima persetujuan update");
assert(sw.includes("then(()=>self.skipWaiting())"),"Migrasi v34 harus mengaktifkan service worker segera agar cache UI lama dibersihkan");
assert(sw.includes("assets/js/app-management.js")&&sw.includes("assets/css/app-management.css"),"App management belum tersedia offline");
assert(css.includes("@media(max-width:767px)")&&css.includes("prefers-reduced-motion")&&css.includes('html[data-theme="dark"]'),"UI management belum lengkap responsif/dark/reduced-motion");
assert(workflow.includes("@playwright/test@1.55.0")&&workflow.includes("@lhci/cli@0.14.0"),"Tool audit browser belum dipin versinya");
assert(workflow.includes("actions/setup-node@v4")&&workflow.includes("node-version: 22"),"Versi Node workflow belum dipin");
assert(workflow.includes("actions/setup-python@v5")&&workflow.includes("lxml==6.1.1"),"Parser HTML workflow belum direproduksi secara eksplisit");
assert(playwright.includes('name:"desktop"')&&playwright.includes('name:"ipad"')&&playwright.includes('name:"mobile"'),"Tiga viewport Playwright belum tersedia");
assert(lighthouse.ci.assert.assertions["categories:performance"][1].minScore>=0.90,"Target performance Lighthouse di bawah 90");
assert(lighthouse.ci.assert.assertions["categories:accessibility"][1].minScore>=0.95,"Target accessibility Lighthouse di bawah 95");
assert(schema.includes("alter table public.wikaru_quiz_results enable row level security"),"RLS hasil kuis belum aktif");
assert(schema.includes("owner_id = auth.uid()")&&schema.includes("public.is_wikaru_admin()"),"Policy peserta/admin Supabase tidak lengkap");
assert(schema.includes("revoke all on table public.wikaru_quiz_results from public, anon"),"Role anon masih mendapat akses tabel langsung");

console.log(JSON.stringify({status:"PASS",updateConsent:true,backupChecksum:"SHA-256",backupMaxMiB:8,blockedDeviceKeys:4,rollback:true,playwrightViewports:3,lighthouseTargets:{performance:90,accessibility:95},supabaseRlsPrepared:true}));
