import assert from "node:assert/strict";
import {buildParticipantReport,buildAdminReport,WIKARU_REPORT_LOGO_SVG} from "../assets/js/pdf-reports.js";

const exactLogoPath="M15 21.5 23.2 44 31.8 27.4 40.4 44 49 21.5";
const detail={number:1,japanese:"食べる",kana:"たべる",reading:"taberu",meaning:"makan",correct:true,time:"00:12",category:"Bab 6 / Kata Kerja"};
const participant=buildParticipantReport({
  documentTitle:"hasil_test.pdf",heading:"Hasil Latihan - Minna no Nihongo I",language:"id",participant:"Ayu <script>",group:"Jembrana",
  book:"Minna no Nihongo I",material:"Bab 6 / Kosakata",generatedAt:"30 Agustus 2026 10.00",total:10,correct:9,wrong:1,score:90,minimum:75,duration:"05:20",details:[detail]
});
const participantJa=buildParticipantReport({...{
  documentTitle:"test_ja.pdf",heading:"学習結果",language:"ja",participant:"あゆ",group:"ジュンブラナ",book:"みんなの日本語 I",material:"第6課",generatedAt:"2026/8/30 10:00",total:10,correct:9,wrong:1,score:90,minimum:75,duration:"05:20",details:[detail]
}});
const admin=buildAdminReport({
  documentTitle:"audit_admin.pdf",language:"id",generatedAt:"30 Agustus 2026 10.00",minimum:75,
  results:[
    {participant:"Ayu",group:"Jembrana",material:"Minna I · Bab 6",date:"30 Agustus 2026",total:10,correct:9,wrong:1,score:90,duration:"05:20",details:[detail]},
    {participant:"Budi",group:"Badung",material:"Minna I · Bab 7",date:"29 Agustus 2026",total:10,correct:6,wrong:4,score:60,duration:"07:10",details:[{...detail,correct:false}]},
    {participant:"Ayu",group:"Jembrana",material:"Minna I · Bab 8",date:"28 Agustus 2026",total:10,correct:8,wrong:2,score:80,duration:"06:10",details:[detail]}
  ]
});

for(const [name,html] of [["participant",participant],["participant-ja",participantJa],["admin",admin]]){
  assert.match(html,/<!doctype html>/i,`${name}: dokumen HTML hilang`);
  assert.equal((html.match(new RegExp(exactLogoPath.replaceAll(".","\\."),"g"))||[]).length,2,`${name}: logo website tidak muncul tepat dua kali`);
  assert.equal((html.match(/<svg\b/g)||[]).length,2,`${name}: ada SVG visual selain logo Wikaru`);
  assert.doesNotMatch(html,/<img\b/i,`${name}: laporan memuat aset gambar selain logo`);
  assert.doesNotMatch(html,/https?:\/\//i,`${name}: laporan masih bergantung pada aset eksternal`);
  assert.doesNotMatch(html,/mascot|avatar|profile-icon|wikaru-modal-quiz-final-polish/i,`${name}: aset/UI aplikasi bocor ke laporan`);
  assert.match(html,/<thead>/i,`${name}: header tabel berulang hilang`);
  assert.match(html,/thead\{display:table-header-group\}/,`${name}: aturan pagination tabel hilang`);
  assert.match(html,/@media print/,`${name}: stylesheet cetak hilang`);
}

assert.ok(WIKARU_REPORT_LOGO_SVG.includes(exactLogoPath),"Path SVG tidak identik dengan logo website");
assert.match(participant,/data-report-kind="participant"/);
assert.match(participant,/@page\{size:A4 portrait/);
assert.match(participant,/Laporan Hasil Peserta/);
assert.match(participant,/Skor Akhir/);
assert.match(participant,/Rincian Jawaban/);
assert.match(participant,/Ayu &lt;script&gt;/,"Data peserta belum di-escape");
assert.doesNotMatch(participant,/Ayu <script>/,"Data peserta dapat menyuntikkan HTML");
const hostileTitle=buildParticipantReport({documentTitle:"</script><script>alert(1)</script>",language:"id",details:[]});
assert.doesNotMatch(hostileTitle,/<script>alert\(1\)<\/script>/,"Judul dokumen dapat memutus blok script cetak");
assert.match(hostileTitle,/\\u003C\/script\\u003E/,"Judul berbahaya belum diserialisasi aman");
assert.match(participantJa,/lang="ja"/);
assert.match(participantJa,/参加者学習レポート/);
assert.match(participantJa,/解答詳細/);

assert.match(admin,/data-report-kind="admin"/);
assert.match(admin,/@page\{size:A4 landscape/);
assert.match(admin,/Laporan Audit Admin/);
assert.match(admin,/Riwayat Pengerjaan Peserta/);
assert.match(admin,/>2<\/strong><\/div><div class="admin-kpi"><span>Pengerjaan<\/span><strong>3</,"KPI peserta unik/pengerjaan salah");
assert.match(admin,/<span>Rata-rata Skor<\/span><strong>77</,"Rata-rata admin salah");
assert.equal((admin.match(/class="detail-page"/g)||[]).length,3,"Lampiran detail tidak sama dengan jumlah pengerjaan");
assert.match(admin,/style="width:100\.0%"/,"Distribusi skor tidak dihitung dari data nyata");

console.log(JSON.stringify({status:"PASS",participantPortrait:true,adminLandscape:true,exactWebsiteLogo:true,externalAssets:0,participantLanguage:["id","ja"],adminAttempts:3,appendices:3}));
