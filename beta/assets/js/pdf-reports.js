const WEBSITE_LOGO = `<svg viewBox="0 0 64 64" role="img" aria-label="Wikaru"><rect x="2" y="2" width="60" height="60" rx="18" fill="currentColor"/><path d="M15 21.5 23.2 44 31.8 27.4 40.4 44 49 21.5" fill="none" stroke="white" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="44.8" cy="16.5" r="4.2" fill="#E84B3C"/></svg>`;

const escapeHtml = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const finiteNumber = (value, fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, finiteNumber(value)));
const scriptString = value => JSON.stringify(String(value)).replaceAll("<", "\\u003C").replaceAll(">", "\\u003E").replaceAll("&", "\\u0026");
const languagePack = language => {
  const japanese = language === "ja";
  return japanese ? {
    language:"ja", brandTagline:"日本語をもっとやさしく", report:"学習レポート", print:"PDF保存 / 印刷",
    generated:"作成日時", automatic:"Wikaru が自動生成したレポート", page:"ページ",
    participantReport:"参加者学習レポート", adminReport:"管理者監査レポート", finalScore:"最終スコア",
    participant:"名前", group:"グループ", book:"教科書", material:"学習範囲", date:"日時",
    total:"問題数", correct:"正解", wrong:"不正解", duration:"学習時間", minimum:"最低到達基準",
    passed:"合格", needsWork:"要復習", answerDetails:"解答詳細", answerSummary:"学習結果の記録",
    number:"番号", japanese:"単語", reading:"読み方", meaning:"意味", status:"状態", time:"時間", category:"カテゴリー",
    recommendation:"次のステップ", recommendationGreat:"すばらしい結果です。間違えた項目だけを短く復習し、この調子を続けましょう。",
    recommendationGood:"よくできました。間違えた項目をもう一度確認すると、さらに安定します。",
    recommendationReview:"苦手な項目を少しずつ復習してから、同じ範囲にもう一度挑戦しましょう。",
    overview:"全体概要", participants:"参加者", attempts:"実施回数", average:"平均スコア", passedAttempts:"合格回数", support:"要支援",
    distribution:"スコア分布", auditTable:"参加者の実施履歴", lastDate:"実施日時", result:"スコア", appendix:"解答詳細資料",
    noData:"保存された結果はありません。", reportScope:"保存されているすべての実施履歴", filter:"レポート範囲"
  } : {
    language:"id", brandTagline:"Belajar Bahasa Jepang Lebih Mudah", report:"Laporan Pembelajaran", print:"Simpan / Cetak PDF",
    generated:"Dibuat pada", automatic:"Laporan dibuat otomatis oleh Wikaru", page:"Halaman",
    participantReport:"Laporan Hasil Peserta", adminReport:"Laporan Audit Admin", finalScore:"Skor Akhir",
    participant:"Nama peserta", group:"Grup", book:"Buku", material:"Cakupan materi", date:"Tanggal",
    total:"Total Soal", correct:"Benar", wrong:"Salah", duration:"Waktu Belajar", minimum:"KKM",
    passed:"Lulus", needsWork:"Perlu Belajar Lagi", answerDetails:"Rincian Jawaban", answerSummary:"Rekaman hasil pembelajaran",
    number:"No", japanese:"Kosakata", reading:"Cara Baca", meaning:"Arti", status:"Status", time:"Waktu", category:"Kategori",
    recommendation:"Langkah Berikutnya", recommendationGreat:"Hasil sangat baik. Ulangi singkat jawaban yang masih salah dan pertahankan konsistensi belajar.",
    recommendationGood:"Hasil sudah baik. Tinjau kembali jawaban yang salah agar pemahaman makin stabil.",
    recommendationReview:"Pelajari kembali bagian yang masih sulit, lalu coba ulang cakupan yang sama secara bertahap.",
    overview:"Ringkasan Utama", participants:"Peserta", attempts:"Pengerjaan", average:"Rata-rata Skor", passedAttempts:"Pengerjaan Lulus", support:"Perlu Dukungan",
    distribution:"Distribusi Skor", auditTable:"Riwayat Pengerjaan Peserta", lastDate:"Waktu Pengerjaan", result:"Skor", appendix:"Lampiran Rincian Jawaban",
    noData:"Belum ada hasil yang tersimpan.", reportScope:"Seluruh riwayat pengerjaan tersimpan", filter:"Cakupan laporan"
  };
};

function sharedShell({documentTitle, language, kind, body}){
  const tx = languagePack(language);
  const isAdmin = kind === "admin";
  const pageSize = isAdmin ? "A4 landscape" : "A4 portrait";
  return `<!doctype html>
<html lang="${tx.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    :root{--navy:#243B73;--navy-2:#35549D;--navy-soft:#EEF2FA;--ink:#171917;--muted:#657069;--line:#DDE2DB;--paper:#F7F7F2;--green:#63785D;--green-soft:#ECF2E9;--red:#E84B3C;--red-soft:#FCECE9;--amber:#A56E1B;--amber-soft:#FFF4DA}
    *{box-sizing:border-box}
    html{background:#E7EAE5;color:var(--ink);font-family:"Plus Jakarta Sans","Noto Sans JP","Yu Gothic UI","Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{margin:0;background:#E7EAE5;font-size:10px;line-height:1.5}
    button{font:inherit}.print-toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 18px;background:rgba(23,25,23,.94);color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.18)}
    .toolbar-brand{display:flex;align-items:center;gap:10px}.toolbar-brand svg{width:34px;height:34px;color:var(--navy)}.toolbar-brand strong{display:block;font-size:13px}.toolbar-brand small{display:block;opacity:.72;font-size:9px}
    .print-button{min-height:38px;border:0;border-radius:11px;padding:0 16px;background:#fff;color:var(--navy);font-weight:800;cursor:pointer}
    .report-page{position:relative;width:${isAdmin ? "297mm" : "210mm"};min-height:${isAdmin ? "210mm" : "297mm"};margin:18px auto;padding:${isAdmin ? "12mm 13mm 15mm" : "14mm 15mm 17mm"};background:#fff;box-shadow:0 18px 55px rgba(29,39,32,.15)}
    .report-header{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:13px;align-items:center;padding-bottom:11px;border-bottom:2px solid var(--navy)}
    .report-header svg{width:46px;height:46px;color:var(--navy)}.brand-name{font-size:21px;font-weight:850;line-height:1;letter-spacing:-.045em;color:var(--navy)}.brand-tagline{margin-top:4px;font-size:8.5px;color:var(--muted)}
    .report-kind{max-width:210px;padding:7px 10px;border-radius:999px;background:var(--navy-soft);color:var(--navy);font-size:8.5px;font-weight:800;text-align:center}
    .report-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin:15px 0 11px}.report-title-row h1{margin:0;font-size:${isAdmin ? "24px" : "23px"};line-height:1.16;letter-spacing:-.035em;color:var(--ink)}
    .report-title-row p{max-width:450px;margin:4px 0 0;color:var(--muted)}.generated-block{flex:0 0 auto;text-align:right;color:var(--muted);font-size:8.5px}.generated-block strong{display:block;margin-top:2px;color:var(--ink);font-size:9.5px}
    .status-pill{display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:3px 8px;border-radius:999px;font-size:8px;font-weight:800;white-space:nowrap}.status-pill.ok{background:var(--green-soft);color:#465F42}.status-pill.no{background:var(--red-soft);color:#B13D33}.status-pill.pass{background:var(--green-soft);color:#465F42}.status-pill.review{background:var(--amber-soft);color:#865910}
    .section-title{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:17px 0 8px}.section-title h2{margin:0;color:var(--navy);font-size:14px;line-height:1.25;letter-spacing:-.015em}.section-title p{margin:0;color:var(--muted);font-size:8.5px}
    table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff;font-size:8.2px}
    thead{display:table-header-group}tfoot{display:table-footer-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{padding:6px 6px;text-align:left;vertical-align:top;border-right:1px solid var(--line);border-bottom:1px solid var(--line);overflow-wrap:anywhere}th:last-child,td:last-child{border-right:0}tbody tr:last-child td{border-bottom:0}
    th{background:var(--navy);color:#fff;font-size:7.4px;line-height:1.25;text-transform:uppercase;letter-spacing:.025em;font-weight:800}tbody tr:nth-child(even){background:#FAFBF8}.jp-text{font-family:"Noto Sans JP","Yu Gothic UI",sans-serif;font-weight:700}.subtext{display:block;margin-top:2px;color:var(--muted);font-size:7.5px;font-weight:500}
    .page-footer{position:fixed;z-index:2;left:${isAdmin ? "13mm" : "15mm"};right:${isAdmin ? "13mm" : "15mm"};bottom:6mm;display:flex;justify-content:space-between;gap:12px;padding-top:4px;border-top:1px solid var(--line);color:#77817B;font-size:7.5px}.page-footer strong{color:var(--navy)}.page-number:after{content:counter(page)}
    .participant-hero{display:grid;grid-template-columns:minmax(0,1fr) 122px;gap:14px;align-items:stretch}.identity-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border:1px solid var(--line);border-radius:13px;background:linear-gradient(145deg,#fff,#FAFBF8);overflow:hidden}.identity-item{padding:10px 12px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.identity-item:nth-child(2n){border-right:0}.identity-item:nth-last-child(-n+2){border-bottom:0}.identity-item span{display:block;color:var(--muted);font-size:7.8px}.identity-item strong{display:block;margin-top:2px;color:var(--ink);font-size:9.2px;line-height:1.35}
    .score-card{display:grid;align-content:center;justify-items:center;border-radius:14px;padding:10px;background:linear-gradient(150deg,var(--navy),#314F92);color:#fff;text-align:center}.score-card span{font-size:8px;opacity:.8}.score-card strong{font-size:34px;line-height:1;margin:5px 0 7px;letter-spacing:-.06em}.score-card .status-pill{background:#fff;color:var(--navy)}
    .metric-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:11px 0}.metric{position:relative;min-height:57px;padding:9px 10px;border:1px solid var(--line);border-radius:11px;background:#fff;overflow:hidden}.metric:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--navy)}.metric.correct:before{background:var(--green)}.metric.wrong:before{background:var(--red)}.metric.minimum:before{background:var(--amber)}.metric span{display:block;color:var(--muted);font-size:7.5px}.metric strong{display:block;margin-top:5px;font-size:15px;line-height:1.1;color:var(--ink)}
    .recommendation{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;margin-top:11px;padding:10px 12px;border:1px solid #D8DEEF;border-radius:11px;background:var(--navy-soft);break-inside:avoid}.recommendation-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:var(--navy);color:#fff;font-size:14px;font-weight:900}.recommendation strong{display:block;color:var(--navy);font-size:9px}.recommendation p{margin:2px 0 0;color:#465269;font-size:8.2px}
    .participant-table th:nth-child(1),.participant-table td:nth-child(1){width:5%}.participant-table th:nth-child(2),.participant-table td:nth-child(2){width:16%}.participant-table th:nth-child(3),.participant-table td:nth-child(3){width:13%}.participant-table th:nth-child(4),.participant-table td:nth-child(4){width:20%}.participant-table th:nth-child(5),.participant-table td:nth-child(5){width:10%}.participant-table th:nth-child(6),.participant-table td:nth-child(6){width:9%}
    .admin-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:11px 0 13px}.admin-kpi{min-height:62px;padding:9px 10px;border:1px solid var(--line);border-radius:11px;background:linear-gradient(180deg,#fff,#FAFBF8)}.admin-kpi span{display:block;color:var(--muted);font-size:7.5px}.admin-kpi strong{display:block;margin-top:5px;color:var(--navy);font-size:18px;line-height:1}.admin-kpi.pass strong{color:var(--green)}.admin-kpi.review strong{color:var(--red)}
    .admin-overview{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(230px,.7fr);gap:11px;align-items:stretch;margin-bottom:12px}.overview-note{padding:11px 12px;border-radius:11px;border:1px solid var(--line);background:var(--paper)}.overview-note dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 12px;margin:0}.overview-note dt{color:var(--muted)}.overview-note dd{margin:0;color:var(--ink);font-weight:700}.distribution{padding:10px 12px;border:1px solid var(--line);border-radius:11px}.distribution-title{margin-bottom:7px;color:var(--navy);font-size:8.5px;font-weight:800}.bar-row{display:grid;grid-template-columns:34px minmax(0,1fr) 20px;gap:7px;align-items:center;margin:4px 0;color:var(--muted);font-size:7.5px}.bar-track{height:6px;border-radius:999px;background:#E9ECE7;overflow:hidden}.bar-fill{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--navy),#5D78BC)}.bar-row strong{color:var(--ink);text-align:right}
    .admin-table{font-size:7.4px}.admin-table th,.admin-table td{padding:5px}.admin-table th:nth-child(1),.admin-table td:nth-child(1){width:3.5%}.admin-table th:nth-child(2),.admin-table td:nth-child(2){width:12%}.admin-table th:nth-child(3),.admin-table td:nth-child(3){width:8%}.admin-table th:nth-child(4),.admin-table td:nth-child(4){width:25%}.admin-table th:nth-child(5),.admin-table td:nth-child(5){width:13%}.admin-table th:nth-child(6),.admin-table td:nth-child(6),.admin-table th:nth-child(7),.admin-table td:nth-child(7),.admin-table th:nth-child(8),.admin-table td:nth-child(8){width:6%}
    .empty-report{display:grid;place-items:center;min-height:95px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);background:var(--paper)}
    .detail-page{break-before:page;page-break-before:always;padding-top:2px}.detail-heading{display:flex;align-items:end;justify-content:space-between;gap:14px;margin:0 0 8px;padding-bottom:7px;border-bottom:1px solid var(--line)}.detail-heading h2{margin:0;color:var(--navy);font-size:14px}.detail-heading p{margin:2px 0 0;color:var(--muted)}.detail-score{font-size:20px;font-weight:850;color:var(--navy);white-space:nowrap}.detail-metrics{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}.detail-metrics span{padding:4px 7px;border-radius:999px;background:var(--paper);border:1px solid var(--line);color:var(--muted);font-size:7.5px}.detail-metrics strong{color:var(--ink)}
    @media(max-width:900px){.report-page{width:calc(100% - 16px);min-height:auto;margin:8px;padding:18px}.report-header{grid-template-columns:42px minmax(0,1fr)}.report-kind{grid-column:1/-1;justify-self:start}.participant-hero,.admin-overview{grid-template-columns:1fr}.score-card{min-height:120px}.metric-grid,.admin-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.identity-card{grid-template-columns:1fr}.identity-item{border-right:0}.identity-item:nth-last-child(-n+2){border-bottom:1px solid var(--line)}.identity-item:last-child{border-bottom:0}.table-wrap{overflow-x:auto}.page-footer{display:none}}
    @page{size:${pageSize};margin:${isAdmin ? "12mm 13mm 15mm" : "14mm 15mm 17mm"}}
    @media print{html,body{background:#fff}body{font-size:9px}.print-toolbar{display:none!important}.report-page{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}.page-footer{display:flex}.report-header,.section-title,.recommendation,.admin-summary,.admin-overview,.detail-heading,.detail-metrics{break-inside:avoid;page-break-inside:avoid}.table-wrap{overflow:visible}.admin-table{font-size:7.2px}}
  </style>
</head>
<body>
  <div class="print-toolbar"><div class="toolbar-brand">${WEBSITE_LOGO}<div><strong>Wikaru</strong><small>${tx.brandTagline}</small></div></div><button class="print-button" type="button" onclick="window.print()">${escapeHtml(tx.print)}</button></div>
  <main class="report-page" data-report-kind="${kind}">
    <header class="report-header">${WEBSITE_LOGO}<div><div class="brand-name">Wikaru</div><div class="brand-tagline">${tx.brandTagline}</div></div><div class="report-kind">${escapeHtml(isAdmin ? tx.adminReport : tx.participantReport)}</div></header>
    ${body}
  </main>
  <footer class="page-footer"><span><strong>Wikaru</strong> · ${tx.automatic}</span><span>${tx.page} <span class="page-number"></span></span></footer>
  <script>(function(){document.title=${scriptString(documentTitle)};var ready=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();ready.then(function(){setTimeout(function(){window.print()},500)});})();<\/script>
</body>
</html>`;
}

function statusPill(isCorrect, tx){
  return `<span class="status-pill ${isCorrect ? "ok" : "no"}">${escapeHtml(isCorrect ? tx.correct : tx.wrong)}</span>`;
}

export function buildParticipantReport(input={}){
  const tx = languagePack(input.language);
  const score = clamp(input.score, 0, 100);
  const passed = score >= finiteNumber(input.minimum, 75);
  const recommendation = score >= 90 ? tx.recommendationGreat : score >= finiteNumber(input.minimum, 75) ? tx.recommendationGood : tx.recommendationReview;
  const details = Array.isArray(input.details) ? input.details : [];
  const rows = details.map((detail, index)=>`<tr>
    <td>${finiteNumber(detail.number, index + 1)}</td>
    <td class="jp-text">${escapeHtml(detail.japanese || "-")}<span class="subtext">${escapeHtml(detail.kana || "")}</span></td>
    <td>${escapeHtml(detail.reading || "-")}</td>
    <td>${escapeHtml(detail.meaning || "-")}</td>
    <td>${statusPill(Boolean(detail.correct), tx)}</td>
    <td>${escapeHtml(detail.time || "-")}</td>
    <td>${escapeHtml(detail.category || "-")}</td>
  </tr>`).join("");
  const generated = escapeHtml(input.generatedAt || input.date || "-");
  const body = `
    <div class="report-title-row"><div><h1>${escapeHtml(input.heading || tx.participantReport)}</h1><p>${tx.answerSummary}</p></div><div class="generated-block">${tx.generated}<strong>${generated}</strong></div></div>
    <section class="participant-hero">
      <div class="identity-card">
        <div class="identity-item"><span>${tx.participant}</span><strong>${escapeHtml(input.participant || "-")}</strong></div>
        <div class="identity-item"><span>${tx.group}</span><strong>${escapeHtml(input.group || "-")}</strong></div>
        <div class="identity-item"><span>${tx.book}</span><strong>${escapeHtml(input.book || "-")}</strong></div>
        <div class="identity-item"><span>${tx.material}</span><strong>${escapeHtml(input.material || "-")}</strong></div>
      </div>
      <div class="score-card"><span>${tx.finalScore}</span><strong>${Math.round(score)}</strong><span class="status-pill ${passed ? "pass" : "review"}">${passed ? tx.passed : tx.needsWork}</span></div>
    </section>
    <div class="metric-grid">
      <div class="metric"><span>${tx.total}</span><strong>${finiteNumber(input.total)}</strong></div>
      <div class="metric correct"><span>${tx.correct}</span><strong>${finiteNumber(input.correct)}</strong></div>
      <div class="metric wrong"><span>${tx.wrong}</span><strong>${finiteNumber(input.wrong)}</strong></div>
      <div class="metric minimum"><span>${tx.minimum}</span><strong>${finiteNumber(input.minimum, 75)}</strong></div>
      <div class="metric"><span>${tx.duration}</span><strong>${escapeHtml(input.duration || "-")}</strong></div>
    </div>
    <div class="recommendation"><span class="recommendation-mark">→</span><div><strong>${tx.recommendation}</strong><p>${escapeHtml(recommendation)}</p></div></div>
    <div class="section-title"><div><h2>${tx.answerDetails}</h2><p>${tx.answerSummary}</p></div><p>${details.length} ${tx.total.toLowerCase()}</p></div>
    <div class="table-wrap"><table class="participant-table"><thead><tr><th>${tx.number}</th><th>${tx.japanese}</th><th>${tx.reading}</th><th>${tx.meaning}</th><th>${tx.status}</th><th>${tx.time}</th><th>${tx.category}</th></tr></thead><tbody>${rows || `<tr><td colspan="7">${tx.noData}</td></tr>`}</tbody></table></div>`;
  return sharedShell({documentTitle:input.documentTitle || input.heading || tx.participantReport, language:input.language, kind:"participant", body});
}

function scoreDistribution(results){
  const bins=[{label:"0–59",min:0,max:59},{label:"60–69",min:60,max:69},{label:"70–79",min:70,max:79},{label:"80–89",min:80,max:89},{label:"90–100",min:90,max:100}];
  const counts=bins.map(bin=>results.filter(row=>row.score>=bin.min&&row.score<=bin.max).length);
  const maximum=Math.max(1,...counts);
  return bins.map((bin,index)=>({label:bin.label,count:counts[index],width:(counts[index]/maximum)*100}));
}

export function buildAdminReport(input={}){
  const tx = languagePack(input.language);
  const results = (Array.isArray(input.results) ? input.results : []).map((row,index)=>({
    ...row, index:index+1, score:clamp(row.score,0,100), total:finiteNumber(row.total), correct:finiteNumber(row.correct), wrong:finiteNumber(row.wrong), details:Array.isArray(row.details)?row.details:[]
  }));
  const minimum=finiteNumber(input.minimum,75);
  const uniqueParticipants=new Set(results.map(row=>`${String(row.participant||"").trim().toLocaleLowerCase()}\u001f${String(row.group||"").trim().toLocaleLowerCase()}`)).size;
  const average=results.length ? Math.round(results.reduce((sum,row)=>sum+row.score,0)/results.length) : 0;
  const passed=results.filter(row=>row.score>=minimum).length;
  const needsSupport=results.length-passed;
  const bars=scoreDistribution(results).map(bar=>`<div class="bar-row"><span>${bar.label}</span><span class="bar-track"><span class="bar-fill" style="width:${bar.width.toFixed(1)}%"></span></span><strong>${bar.count}</strong></div>`).join("");
  const rows=results.map(row=>`<tr>
    <td>${row.index}</td><td><strong>${escapeHtml(row.participant||"-")}</strong></td><td>${escapeHtml(row.group||"-")}</td><td>${escapeHtml(row.material||"-")}</td><td>${escapeHtml(row.date||"-")}</td>
    <td>${row.total}</td><td>${row.correct}</td><td>${row.wrong}</td><td><strong>${Math.round(row.score)}</strong></td><td><span class="status-pill ${row.score>=minimum?"pass":"review"}">${row.score>=minimum?tx.passed:tx.needsWork}</span></td>
  </tr>`).join("");
  const appendices=results.map(row=>`<section class="detail-page">
    <div class="detail-heading"><div><h2>${tx.appendix} · ${escapeHtml(row.participant||"-")}</h2><p>${escapeHtml(row.material||"-")} · ${escapeHtml(row.date||"-")}</p></div><div class="detail-score">${Math.round(row.score)}</div></div>
    <div class="detail-metrics"><span>${tx.group}: <strong>${escapeHtml(row.group||"-")}</strong></span><span>${tx.total}: <strong>${row.total}</strong></span><span>${tx.correct}: <strong>${row.correct}</strong></span><span>${tx.wrong}: <strong>${row.wrong}</strong></span><span>${tx.duration}: <strong>${escapeHtml(row.duration||"-")}</strong></span></div>
    <table><thead><tr><th>${tx.number}</th><th>${tx.japanese}</th><th>${tx.reading}</th><th>${tx.meaning}</th><th>${tx.status}</th><th>${tx.time}</th><th>${tx.category}</th></tr></thead><tbody>${row.details.map((detail,index)=>`<tr><td>${finiteNumber(detail.number,index+1)}</td><td class="jp-text">${escapeHtml(detail.japanese||"-")}<span class="subtext">${escapeHtml(detail.kana||"")}</span></td><td>${escapeHtml(detail.reading||"-")}</td><td>${escapeHtml(detail.meaning||"-")}</td><td>${statusPill(Boolean(detail.correct),tx)}</td><td>${escapeHtml(detail.time||"-")}</td><td>${escapeHtml(detail.category||"-")}</td></tr>`).join("")||`<tr><td colspan="7">${tx.noData}</td></tr>`}</tbody></table>
  </section>`).join("");
  const generated=escapeHtml(input.generatedAt||"-");
  const body=`
    <div class="report-title-row"><div><h1>${tx.adminReport}</h1><p>${tx.reportScope}</p></div><div class="generated-block">${tx.generated}<strong>${generated}</strong></div></div>
    <section class="admin-summary">
      <div class="admin-kpi"><span>${tx.participants}</span><strong>${uniqueParticipants}</strong></div><div class="admin-kpi"><span>${tx.attempts}</span><strong>${results.length}</strong></div><div class="admin-kpi"><span>${tx.average}</span><strong>${average}</strong></div><div class="admin-kpi pass"><span>${tx.passedAttempts}</span><strong>${passed}</strong></div><div class="admin-kpi review"><span>${tx.support}</span><strong>${needsSupport}</strong></div>
    </section>
    <section class="admin-overview"><div class="overview-note"><dl><dt>${tx.filter}</dt><dd>${tx.reportScope}</dd><dt>${tx.minimum}</dt><dd>${minimum}</dd><dt>${tx.generated}</dt><dd>${generated}</dd></dl></div><div class="distribution"><div class="distribution-title">${tx.distribution}</div>${bars}</div></section>
    <div class="section-title"><div><h2>${tx.auditTable}</h2><p>${tx.overview}</p></div><p>${results.length} ${tx.attempts.toLowerCase()}</p></div>
    <div class="table-wrap">${results.length?`<table class="admin-table"><thead><tr><th>${tx.number}</th><th>${tx.participant}</th><th>${tx.group}</th><th>${tx.material}</th><th>${tx.lastDate}</th><th>${tx.total}</th><th>${tx.correct}</th><th>${tx.wrong}</th><th>${tx.result}</th><th>${tx.status}</th></tr></thead><tbody>${rows}</tbody></table>`:`<div class="empty-report">${tx.noData}</div>`}</div>
    ${appendices}`;
  return sharedShell({documentTitle:input.documentTitle||tx.adminReport,language:input.language,kind:"admin",body});
}

export const WIKARU_REPORT_LOGO_SVG = WEBSITE_LOGO;
