from __future__ import annotations

from pathlib import Path
from math import ceil

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A3, A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
OUTPUT.mkdir(parents=True, exist_ok=True)

PARTICIPANT_PDF = OUTPUT / "Preview_Laporan_Peserta_Wikaru.pdf"
ADMIN_PDF = OUTPUT / "Preview_Laporan_Admin_Wikaru.pdf"
TYPOGRAPHY_PDF = OUTPUT / "Preview_5_Konsep_Font_Wikaru.pdf"

NAVY = HexColor("#243B73")
NAVY_2 = HexColor("#35549D")
NAVY_SOFT = HexColor("#EEF2FA")
INK = HexColor("#171917")
MUTED = HexColor("#657069")
LINE = HexColor("#DDE2DB")
PAPER = HexColor("#F7F7F2")
GREEN = HexColor("#63785D")
GREEN_SOFT = HexColor("#ECF2E9")
RED = HexColor("#E84B3C")
RED_SOFT = HexColor("#FCECE9")
AMBER = HexColor("#A56E1B")
AMBER_SOFT = HexColor("#FFF4DA")
WHITE = colors.white

pdfmetrics.registerFont(TTFont("WikaruSans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("WikaruSans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("WikaruRounded", "/opt/codex/runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype/NotoSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("WikaruHumanist", "/opt/codex/runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype/LinBiolinum_RB_G.ttf"))
pdfmetrics.registerFont(TTFont("WikaruEditorial", "/opt/codex/runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype/LinLibertine_RB_G.ttf"))
pdfmetrics.registerFont(TTFont("WikaruMono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"))
pdfmetrics.registerFont(TTFont("WikaruSoft", "/opt/codex/runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype/Carlito-Bold.ttf"))
pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))

styles = getSampleStyleSheet()
BODY = ParagraphStyle("Body", parent=styles["BodyText"], fontName="WikaruSans", fontSize=8.2, leading=11, textColor=INK)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=7.1, leading=9, textColor=MUTED)
TINY = ParagraphStyle("Tiny", parent=BODY, fontSize=6.4, leading=8, textColor=MUTED)
JP = ParagraphStyle("JP", parent=BODY, fontName="HeiseiKakuGo-W5", fontSize=8.2, leading=10.5, textColor=INK)
TITLE = ParagraphStyle("Title", parent=BODY, fontName="WikaruSans-Bold", fontSize=20, leading=23, textColor=INK)
ADMIN_TITLE = ParagraphStyle("AdminTitle", parent=TITLE, fontSize=19, leading=22)
SECTION = ParagraphStyle("Section", parent=BODY, fontName="WikaruSans-Bold", fontSize=11, leading=13, textColor=NAVY)
WHITE_BOLD = ParagraphStyle("WhiteBold", parent=BODY, fontName="WikaruSans-Bold", fontSize=7, leading=9, textColor=WHITE)
CELL = ParagraphStyle("Cell", parent=BODY, fontSize=7, leading=9)
CELL_SMALL = ParagraphStyle("CellSmall", parent=BODY, fontSize=6.2, leading=7.8)
CELL_JP = ParagraphStyle("CellJP", parent=JP, fontSize=7.4, leading=9)


def p(text: object, style: ParagraphStyle = BODY) -> Paragraph:
    value = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(value, style)


def draw_logo(canvas, x: float, y: float, size: float) -> None:
    """Exact geometry from the website SVG, drawn as vector PDF paths."""
    canvas.saveState()
    canvas.translate(x, y)
    scale = size / 64
    canvas.scale(scale, scale)
    canvas.setFillColor(NAVY)
    canvas.roundRect(2, 2, 60, 60, 18, stroke=0, fill=1)
    mark = canvas.beginPath()
    # SVG uses a downward Y axis; PDF uses an upward Y axis.
    mark.moveTo(15, 64 - 21.5)
    mark.lineTo(23.2, 64 - 44)
    mark.lineTo(31.8, 64 - 27.4)
    mark.lineTo(40.4, 64 - 44)
    mark.lineTo(49, 64 - 21.5)
    canvas.setStrokeColor(WHITE)
    canvas.setLineWidth(5.2)
    canvas.setLineCap(1)
    canvas.setLineJoin(1)
    canvas.drawPath(mark, stroke=1, fill=0)
    canvas.setFillColor(RED)
    canvas.circle(44.8, 64 - 16.5, 4.2, stroke=0, fill=1)
    canvas.restoreState()


class BrandHeader(Flowable):
    def __init__(self, width: float, report_type: str):
        super().__init__()
        self.width = width
        self.report_type = report_type
        self.height = 17 * mm

    def wrap(self, avail_width, avail_height):
        return avail_width, self.height

    def draw(self):
        c = self.canv
        draw_logo(c, 0, 2.2 * mm, 12 * mm)
        c.setFillColor(NAVY)
        c.setFont("WikaruSans-Bold", 17)
        c.drawString(15.5 * mm, 10.3 * mm, "Wikaru")
        c.setFillColor(MUTED)
        c.setFont("WikaruSans", 6.5)
        c.drawString(15.5 * mm, 6.3 * mm, "Belajar Bahasa Jepang Lebih Mudah")
        label_width = c.stringWidth(self.report_type, "WikaruSans-Bold", 6.8) + 9 * mm
        c.setFillColor(NAVY_SOFT)
        c.roundRect(self.width - label_width, 6.3 * mm, label_width, 7 * mm, 3.5 * mm, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont("WikaruSans-Bold", 6.8)
        c.drawCentredString(self.width - label_width / 2, 8.7 * mm, self.report_type)
        c.setStrokeColor(NAVY)
        c.setLineWidth(1.4)
        c.line(0, 1 * mm, self.width, 1 * mm)


class ScoreCard(Flowable):
    def __init__(self, score: int, status: str, width: float = 34 * mm, height: float = 34 * mm):
        super().__init__()
        self.score = score
        self.status = status
        self.width = width
        self.height = height

    def wrap(self, avail_width, avail_height):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(NAVY)
        c.roundRect(0, 0, self.width, self.height, 4 * mm, stroke=0, fill=1)
        c.setFillColor(HexColor("#D8E1FF"))
        c.setFont("WikaruSans-Bold", 6.5)
        c.drawCentredString(self.width / 2, self.height - 7 * mm, "SKOR AKHIR")
        c.setFillColor(WHITE)
        c.setFont("WikaruSans-Bold", 25)
        c.drawCentredString(self.width / 2, self.height / 2 - 1.5 * mm, str(self.score))
        c.setFillColor(WHITE)
        c.roundRect(7 * mm, 3.5 * mm, self.width - 14 * mm, 5.8 * mm, 2.9 * mm, stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont("WikaruSans-Bold", 6)
        c.drawCentredString(self.width / 2, 5.6 * mm, self.status.upper())


class DistributionChart(Flowable):
    def __init__(self, counts: list[tuple[str, int]], width: float, height: float = 33 * mm):
        super().__init__()
        self.counts = counts
        self.width = width
        self.height = height

    def wrap(self, avail_width, avail_height):
        return min(self.width, avail_width), self.height

    def draw(self):
        c = self.canv
        maximum = max([count for _, count in self.counts] + [1])
        c.setFillColor(WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(0, 0, self.width, self.height, 3 * mm, stroke=1, fill=1)
        c.setFillColor(NAVY)
        c.setFont("WikaruSans-Bold", 7.2)
        c.drawString(4 * mm, self.height - 6 * mm, "DISTRIBUSI SKOR")
        start_y = self.height - 11 * mm
        track_x = 17 * mm
        track_width = self.width - 27 * mm
        for index, (label, count) in enumerate(self.counts):
            y = start_y - index * 4.3 * mm
            c.setFillColor(MUTED)
            c.setFont("WikaruSans", 5.8)
            c.drawString(4 * mm, y + 0.4 * mm, label)
            c.setFillColor(HexColor("#E9ECE7"))
            c.roundRect(track_x, y, track_width, 2 * mm, 1 * mm, stroke=0, fill=1)
            c.setFillColor(NAVY_2)
            c.roundRect(track_x, y, track_width * count / maximum, 2 * mm, 1 * mm, stroke=0, fill=1)
            c.setFillColor(INK)
            c.setFont("WikaruSans-Bold", 5.8)
            c.drawRightString(self.width - 4 * mm, y + 0.4 * mm, str(count))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 9 * mm, doc.pagesize[0] - doc.rightMargin, 9 * mm)
    canvas.setFont("WikaruSans", 6.2)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 5.8 * mm, "Wikaru - Laporan dibuat otomatis")
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 5.8 * mm, f"Halaman {doc.page}")
    canvas.restoreState()


def make_doc(path: Path, pagesize, margins: tuple[float, float, float, float]):
    left, right, top, bottom = margins
    doc = BaseDocTemplate(
        str(path), pagesize=pagesize, leftMargin=left, rightMargin=right,
        topMargin=top, bottomMargin=bottom, title=path.stem, author="Wikaru",
        subject="Preview laporan Wikaru dengan data contoh",
    )
    frame = Frame(left, bottom, pagesize[0] - left - right, pagesize[1] - top - bottom, id="content")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])
    return doc


VOCABULARY = [
    ("食べる", "たべる", "taberu", "makan", True, "00:12", "Bab 6 / Kata Kerja"),
    ("飲む", "のむ", "nomu", "minum", True, "00:09", "Bab 6 / Kata Kerja"),
    ("見る", "みる", "miru", "melihat", True, "00:11", "Bab 6 / Kata Kerja"),
    ("聞く", "きく", "kiku", "mendengar", False, "00:18", "Bab 6 / Kata Kerja"),
    ("読む", "よむ", "yomu", "membaca", True, "00:10", "Bab 6 / Kata Kerja"),
    ("書く", "かく", "kaku", "menulis", True, "00:13", "Bab 6 / Kata Kerja"),
    ("買う", "かう", "kau", "membeli", True, "00:08", "Bab 6 / Kata Kerja"),
    ("撮る", "とる", "toru", "memotret", False, "00:21", "Bab 6 / Kata Kerja"),
    ("会う", "あう", "au", "bertemu", True, "00:07", "Bab 6 / Kata Kerja"),
    ("切る", "きる", "kiru", "memotong", True, "00:10", "Bab 7 / Kata Kerja"),
    ("送る", "おくる", "okuru", "mengirim", True, "00:11", "Bab 7 / Kata Kerja"),
    ("貸す", "かす", "kasu", "meminjamkan", True, "00:14", "Bab 7 / Kata Kerja"),
    ("借りる", "かりる", "kariru", "meminjam", True, "00:15", "Bab 7 / Kata Kerja"),
    ("教える", "おしえる", "oshieru", "mengajar", False, "00:24", "Bab 7 / Kata Kerja"),
    ("習う", "ならう", "narau", "belajar", True, "00:09", "Bab 7 / Kata Kerja"),
    ("電話", "でんわ", "denwa", "telepon", True, "00:08", "Bab 7 / Kosakata"),
    ("手", "て", "te", "tangan", True, "00:07", "Bab 7 / Kosakata"),
    ("箸", "はし", "hashi", "sumpit", True, "00:09", "Bab 7 / Kosakata"),
    ("住む", "すむ", "sumu", "tinggal", True, "00:11", "Bab 8 / Kata Kerja"),
    ("働く", "はたらく", "hataraku", "bekerja", True, "00:14", "Bab 8 / Kata Kerja"),
    ("休む", "やすむ", "yasumu", "beristirahat", False, "00:19", "Bab 8 / Kata Kerja"),
    ("勉強する", "べんきょうする", "benkyou suru", "belajar", True, "00:16", "Bab 8 / Kata Kerja"),
    ("終わる", "おわる", "owaru", "selesai", True, "00:10", "Bab 8 / Kata Kerja"),
    ("行く", "いく", "iku", "pergi", True, "00:08", "Bab 5 / Kata Kerja"),
    ("来る", "くる", "kuru", "datang", True, "00:07", "Bab 5 / Kata Kerja"),
    ("帰る", "かえる", "kaeru", "pulang", False, "00:18", "Bab 5 / Kata Kerja"),
    ("スーパー", "スーパー", "suupaa", "supermarket", True, "00:09", "Bab 5 / Tempat"),
    ("銀行", "ぎんこう", "ginkou", "bank", True, "00:08", "Bab 5 / Tempat"),
    ("郵便局", "ゆうびんきょく", "yuubinkyoku", "kantor pos", True, "00:12", "Bab 5 / Tempat"),
    ("図書館", "としょかん", "toshokan", "perpustakaan", True, "00:10", "Bab 5 / Tempat"),
]


def participant_table_rows(items):
    rows = [[p("NO", WHITE_BOLD), p("KOSAKATA", WHITE_BOLD), p("CARA BACA", WHITE_BOLD), p("ARTI", WHITE_BOLD), p("STATUS", WHITE_BOLD), p("WAKTU", WHITE_BOLD), p("KATEGORI", WHITE_BOLD)]]
    for index, (kanji, kana, romaji, meaning, correct, spent, category) in enumerate(items, 1):
        status_style = ParagraphStyle("status", parent=CELL_SMALL, fontName="WikaruSans-Bold", textColor=GREEN if correct else RED)
        rows.append([
            p(index, CELL_SMALL),
            Paragraph(f"{kanji}<br/><font name='HeiseiKakuGo-W5' size='6' color='#657069'>{kana}</font>", CELL_JP),
            p(romaji, CELL_SMALL), p(meaning, CELL_SMALL), p("BENAR" if correct else "SALAH", status_style),
            p(spent, CELL_SMALL), p(category, CELL_SMALL),
        ])
    return rows


def build_participant():
    doc = make_doc(PARTICIPANT_PDF, A4, (15 * mm, 15 * mm, 13 * mm, 15 * mm))
    width = A4[0] - 30 * mm
    story = [BrandHeader(width, "LAPORAN HASIL PESERTA"), Spacer(1, 4 * mm)]
    title_block = Table([
        [p("Hasil Latihan - Minna no Nihongo I", TITLE), p("DATA CONTOH", ParagraphStyle("badge", parent=SMALL, fontName="WikaruSans-Bold", alignment=TA_RIGHT, textColor=NAVY))],
        [p("Rekaman hasil pembelajaran peserta", SMALL), p("30 Agustus 2026, 20.30", ParagraphStyle("date", parent=SMALL, alignment=TA_RIGHT))],
    ], colWidths=[width * .7, width * .3])
    title_block.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    story.extend([title_block, Spacer(1, 4 * mm)])

    identity_data = [
        [p("NAMA PESERTA", TINY), p("GRUP", TINY)], [p("Ayu Lestari", ParagraphStyle("identity", parent=BODY, fontName="WikaruSans-Bold")), p("Jembrana", ParagraphStyle("identity2", parent=BODY, fontName="WikaruSans-Bold"))],
        [p("BUKU", TINY), p("CAKUPAN MATERI", TINY)], [p("Minna no Nihongo I", BODY), p("Bab 5-8 / Kosakata dan Kata Kerja", BODY)],
    ]
    identity = Table(identity_data, colWidths=[(width - 39 * mm) * .5] * 2, rowHeights=[5 * mm, 8 * mm, 5 * mm, 10 * mm])
    identity.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), .6, LINE), ("INNERGRID", (0, 0), (-1, -1), .4, LINE), ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FBFCF9")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    hero = Table([[identity, ScoreCard(83, "Lulus")]], colWidths=[width - 39 * mm, 34 * mm], hAlign="LEFT")
    hero.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (0, 0), 5 * mm), ("RIGHTPADDING", (1, 0), (1, 0), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    story.extend([hero, Spacer(1, 3.5 * mm)])

    metrics = [("TOTAL SOAL", "30", NAVY), ("BENAR", "25", GREEN), ("SALAH", "5", RED), ("KKM", "75", AMBER), ("WAKTU BELAJAR", "05:46", NAVY)]
    metric_cells = []
    for label, value, accent in metrics:
        cell = Table([[p(label, TINY)], [p(value, ParagraphStyle(f"metric-{label}", parent=BODY, fontName="WikaruSans-Bold", fontSize=13, leading=15, textColor=accent))]], colWidths=[width / 5 - 3])
        cell.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), .6, LINE), ("BACKGROUND", (0, 0), (-1, -1), WHITE), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        metric_cells.append(cell)
    metric_table = Table([metric_cells], colWidths=[width / 5] * 5)
    metric_table.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    story.extend([metric_table, Spacer(1, 3.5 * mm)])

    recommendation = Table([[p("→", ParagraphStyle("arrow", parent=BODY, fontName="WikaruSans-Bold", fontSize=14, alignment=TA_CENTER, textColor=WHITE)), Paragraph("<b>Langkah Berikutnya</b><br/>Hasil sudah baik. Tinjau kembali lima jawaban yang salah agar pemahaman makin stabil.", ParagraphStyle("recommend", parent=SMALL, textColor=NAVY))]], colWidths=[10 * mm, width - 10 * mm])
    recommendation.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), NAVY), ("BACKGROUND", (1, 0), (1, 0), NAVY_SOFT), ("BOX", (0, 0), (-1, -1), .6, HexColor("#D8DEEF")), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story.extend([recommendation, Spacer(1, 5 * mm), p("Rincian Jawaban", SECTION), p("30 jawaban - data contoh untuk melihat layout cetak", SMALL), Spacer(1, 2.5 * mm)])
    table = Table(participant_table_rows(VOCABULARY), colWidths=[8 * mm, 29 * mm, 23 * mm, 30 * mm, 17 * mm, 17 * mm, width - 124 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("GRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, HexColor("#FAFBF8")]), ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    doc.build(story)


def admin_summary_cards(width):
    data = [("PESERTA", "8", NAVY), ("PENGERJAAN", "10", NAVY), ("RATA-RATA", "82", NAVY), ("LULUS", "7", GREEN), ("PERLU DUKUNGAN", "3", RED)]
    cells = []
    for label, value, accent in data:
        card = Table([[p(label, TINY)], [p(value, ParagraphStyle(f"admin-{label}", parent=BODY, fontName="WikaruSans-Bold", fontSize=15, textColor=accent))]], colWidths=[width / 5 - 5])
        card.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), .6, LINE), ("BACKGROUND", (0, 0), (-1, -1), WHITE), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        cells.append(card)
    outer = Table([cells], colWidths=[width / 5] * 5)
    outer.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 2.5), ("RIGHTPADDING", (0, 0), (-1, -1), 2.5), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    return outer


ADMIN_RESULTS = [
    ("Ayu Lestari", "Jembrana", "Minna I - Bab 6-7", "30 Agu 2026, 20.30", 18, 15, 3, 83),
    ("Budi Santoso", "Badung", "Minna I - Bab 8", "30 Agu 2026, 19.45", 20, 19, 1, 95),
    ("Citra Dewi", "Singaraja", "Minna I - Bab 9", "30 Agu 2026, 18.20", 10, 8, 2, 80),
    ("Dewa Putra", "Umum", "Minna I - Bab 10", "30 Agu 2026, 16.05", 20, 14, 6, 70),
    ("Eka Maharani", "Jembrana", "Minna I - Bab 11", "29 Agu 2026, 21.12", 10, 10, 0, 100),
    ("Fajar Pratama", "Badung", "Minna II - Bab 26", "29 Agu 2026, 20.44", 20, 17, 3, 85),
    ("Gita Laras", "Singaraja", "Minna II - Bab 27", "29 Agu 2026, 18.11", 10, 9, 1, 90),
    ("Hendra Wijaya", "Umum", "Minna II - Bab 28", "29 Agu 2026, 15.38", 20, 13, 7, 65),
    ("Ayu Lestari", "Jembrana", "Minna I - Bab 8", "28 Agu 2026, 19.50", 10, 8, 2, 80),
    ("Citra Dewi", "Singaraja", "Minna I - Bab 10", "28 Agu 2026, 17.22", 10, 7, 3, 70),
]


def admin_audit_table(width):
    header = [p(value, WHITE_BOLD) for value in ["NO", "NAMA PESERTA", "GRUP", "MATERI", "WAKTU PENGERJAAN", "TOTAL", "BENAR", "SALAH", "SKOR", "STATUS"]]
    rows = [header]
    for index, (name, group, material, date, total, correct, wrong, score) in enumerate(ADMIN_RESULTS, 1):
        passed = score >= 75
        status = ParagraphStyle(f"admin-status-{index}", parent=CELL_SMALL, fontName="WikaruSans-Bold", textColor=GREEN if passed else RED)
        rows.append([p(index, CELL_SMALL), p(name, CELL_SMALL), p(group, CELL_SMALL), p(material, CELL_SMALL), p(date, CELL_SMALL), p(total, CELL_SMALL), p(correct, CELL_SMALL), p(wrong, CELL_SMALL), p(score, ParagraphStyle(f"score-{index}", parent=CELL_SMALL, fontName="WikaruSans-Bold", textColor=NAVY)), p("LULUS" if passed else "PERLU BELAJAR", status)])
    columns = [8 * mm, 31 * mm, 21 * mm, 43 * mm, 34 * mm, 15 * mm, 15 * mm, 15 * mm, 15 * mm, width - 197 * mm]
    table = Table(rows, colWidths=columns, repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("GRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, HexColor("#FAFBF8")]), ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, -1), 4.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5)]))
    return table


def appendix_table(items, width):
    table = Table(participant_table_rows(items), colWidths=[8 * mm, 27 * mm, 23 * mm, 31 * mm, 17 * mm, 17 * mm, width - 123 * mm], repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("GRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, HexColor("#FAFBF8")]), ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    return table


def build_admin():
    page = landscape(A4)
    doc = make_doc(ADMIN_PDF, page, (13 * mm, 13 * mm, 12 * mm, 15 * mm))
    width = page[0] - 26 * mm
    story = [BrandHeader(width, "LAPORAN AUDIT ADMIN"), Spacer(1, 3 * mm)]
    title_block = Table([
        [p("Laporan Audit Admin", ADMIN_TITLE), p("DATA CONTOH", ParagraphStyle("admin-badge", parent=SMALL, fontName="WikaruSans-Bold", alignment=TA_RIGHT, textColor=NAVY))],
        [p("Seluruh riwayat pengerjaan tersimpan", SMALL), p("Dibuat 30 Agustus 2026, 20.35", ParagraphStyle("admin-date", parent=SMALL, alignment=TA_RIGHT))],
    ], colWidths=[width * .68, width * .32])
    title_block.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    story.extend([title_block, Spacer(1, 3.5 * mm), admin_summary_cards(width), Spacer(1, 3.5 * mm)])
    overview = Table([
        [p("CAKUPAN LAPORAN", TINY), p("Seluruh riwayat pengerjaan tersimpan", BODY)],
        [p("KKM", TINY), p("75", BODY)],
        [p("KETERANGAN", TINY), p("KPI dan distribusi dihitung dari data nyata saat PDF dibuat.", BODY)],
    ], colWidths=[31 * mm, width * .54 - 31 * mm])
    overview.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), .6, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("BACKGROUND", (0, 0), (-1, -1), PAPER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    charts = DistributionChart([("0-59", 0), ("60-69", 1), ("70-79", 2), ("80-89", 4), ("90-100", 3)], width * .42)
    overview_row = Table([[overview, charts]], colWidths=[width * .56, width * .44])
    overview_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    story.extend([overview_row, Spacer(1, 4 * mm), p("Riwayat Pengerjaan Peserta", SECTION), p("10 pengerjaan - data contoh untuk melihat layout audit", SMALL), Spacer(1, 2.5 * mm), admin_audit_table(width)])

    for name, group, material, date, total, correct, wrong, score in ADMIN_RESULTS[:2]:
        story.append(PageBreak())
        story.extend([
            BrandHeader(width, "LAMPIRAN RINCIAN JAWABAN"), Spacer(1, 3 * mm),
            Table([[p(f"Lampiran Rincian - {name}", SECTION), p(str(score), ParagraphStyle(f"appendix-score-{name}", parent=ADMIN_TITLE, alignment=TA_RIGHT, textColor=NAVY))], [p(f"{material} - {date}", SMALL), p("LULUS" if score >= 75 else "PERLU BELAJAR", ParagraphStyle(f"appendix-status-{name}", parent=SMALL, fontName="WikaruSans-Bold", alignment=TA_RIGHT, textColor=GREEN if score >= 75 else RED))]], colWidths=[width * .8, width * .2], style=TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2), ("VALIGN", (0, 0), (-1, -1), "TOP")])),
            Spacer(1, 2 * mm),
            Table([[Paragraph(f"GRUP: <b>{group}</b>", SMALL), Paragraph(f"TOTAL: <b>{total}</b>", SMALL), Paragraph(f"BENAR: <b>{correct}</b>", SMALL), Paragraph(f"SALAH: <b>{wrong}</b>", SMALL), Paragraph("WAKTU: <b>03:34</b>", SMALL)]], colWidths=[width / 5] * 5, style=TableStyle([("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("BACKGROUND", (0, 0), (-1, -1), PAPER), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)])),
            Spacer(1, 3 * mm), appendix_table(VOCABULARY[:12], width),
        ])
    doc.build(story)


def tracked_text(canvas, text: str, x: float, y: float, font: str, size: float, spacing: float, color=INK):
    canvas.setFillColor(color)
    canvas.setFont(font, size)
    cursor = x
    for character in text:
        canvas.drawString(cursor, y, character)
        cursor += canvas.stringWidth(character, font, size) + spacing


def typography_card(canvas, x, y, width, height, number, title, descriptor, font_name, variant):
    canvas.setFillColor(WHITE)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.8)
    canvas.roundRect(x, y, width, height, 13, stroke=1, fill=1)

    canvas.setFillColor(NAVY_SOFT)
    canvas.roundRect(x + 20, y + height - 34, 28, 17, 8.5, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont("WikaruSans-Bold", 7)
    canvas.drawCentredString(x + 34, y + height - 28.3, f"0{number}")
    canvas.setFont("WikaruSans-Bold", 9)
    canvas.drawString(x + 58, y + height - 29, title.upper())
    canvas.setFillColor(MUTED)
    canvas.setFont("WikaruSans", 6.8)
    canvas.drawRightString(x + width - 20, y + height - 29, descriptor)

    logo_size = 50 if variant != 5 else 56
    logo_y = y + height - 105 if variant != 5 else y + 65
    draw_logo(canvas, x + 23, logo_y, logo_size)
    word_x = x + 88
    word_y = y + height - 82 if variant != 5 else y + 96

    if variant == 1:
        canvas.setFillColor(NAVY)
        canvas.setFont(font_name, 31)
        canvas.drawString(word_x, word_y, "Wikaru")
        word_width = canvas.stringWidth("Wikaru", font_name, 31)
        canvas.setStrokeColor(RED)
        canvas.setLineWidth(3)
        canvas.line(word_x, word_y - 8, word_x + word_width * .34, word_y - 8)
        jp_font, jp_y = "HeiseiKakuGo-W5", y + 50
    elif variant == 2:
        canvas.setFillColor(NAVY)
        canvas.setFont(font_name, 33)
        canvas.drawString(word_x, word_y, "Wikaru")
        word_width = canvas.stringWidth("Wikaru", font_name, 33)
        canvas.setFillColor(RED)
        canvas.circle(word_x + word_width + 8, word_y + 22, 3.5, stroke=0, fill=1)
        canvas.setFillColor(NAVY_SOFT)
        canvas.roundRect(word_x, y + 42, 166, 23, 11.5, stroke=0, fill=1)
        jp_font, jp_y = "HeiseiKakuGo-W5", y + 49
    elif variant == 3:
        canvas.setFillColor(NAVY)
        canvas.setFont(font_name, 35)
        canvas.drawString(word_x, word_y, "Wikaru")
        canvas.setStrokeColor(RED)
        canvas.setLineWidth(1.5)
        canvas.line(word_x - 8, word_y - 4, word_x - 8, word_y + 30)
        jp_font, jp_y = "HeiseiMin-W3", y + 50
    elif variant == 4:
        tracked_text(canvas, "WIKARU", word_x, word_y + 2, font_name, 26, 3.3, NAVY)
        canvas.setFillColor(RED)
        canvas.rect(word_x, word_y - 8, 34, 3, stroke=0, fill=1)
        jp_font, jp_y = "HeiseiKakuGo-W5", y + 50
    else:
        canvas.setFillColor(NAVY)
        canvas.setFont(font_name, 42)
        canvas.drawString(word_x, word_y, "wikaru")
        word_width = canvas.stringWidth("wikaru", font_name, 42)
        canvas.setStrokeColor(NAVY_2)
        canvas.setLineWidth(1.4)
        canvas.line(word_x, word_y - 10, word_x + word_width + 105, word_y - 10)
        canvas.setFillColor(RED)
        canvas.circle(word_x + word_width + 105, word_y - 10, 5, stroke=0, fill=1)
        jp_font, jp_y = "HeiseiKakuGo-W5", y + 57

    canvas.setFillColor(NAVY if variant != 3 else INK)
    canvas.setFont(jp_font, 10 if variant != 3 else 11)
    japanese = "日本語をもっとやさしく"
    canvas.drawString(word_x, jp_y, japanese)
    canvas.setFillColor(MUTED)
    canvas.setFont("WikaruSans", 7.2)
    canvas.drawString(word_x, jp_y - 17, "Belajar Bahasa Jepang Lebih Mudah")


def build_typography_concepts():
    page = landscape(A3)
    canvas = pdfcanvas.Canvas(str(TYPOGRAPHY_PDF), pagesize=page, pageCompression=1)
    width, height = page
    canvas.setTitle("Lima Konsep Font Style Wikaru")
    canvas.setAuthor("Wikaru")
    canvas.setSubject("Konsep wordmark bilingual Indonesia dan Jepang")
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)

    draw_logo(canvas, 47, height - 97, 42)
    canvas.setFillColor(NAVY)
    canvas.setFont("WikaruSans-Bold", 22)
    canvas.drawString(102, height - 62, "Lima Konsep Font Style Wikaru")
    canvas.setFillColor(MUTED)
    canvas.setFont("WikaruSans", 8.5)
    canvas.drawString(102, height - 80, "Wordmark bilingual Indonesia - Jepang | konsep visual, belum diterapkan ke website")
    canvas.setFillColor(RED)
    canvas.roundRect(width - 184, height - 81, 134, 26, 13, stroke=0, fill=1)
    canvas.setFillColor(WHITE)
    canvas.setFont("WikaruSans-Bold", 8)
    canvas.drawCentredString(width - 117, height - 71.5, "PILIH 1 KONSEP")

    margin, gap = 48, 16
    card_width = (width - 2 * margin - gap) / 2
    card_height = 190
    top_y = height - 310
    typography_card(canvas, margin, top_y, card_width, card_height, 1, "Kaku Modern", "bersih - tegas - paling aman", "WikaruRounded", 1)
    typography_card(canvas, margin + card_width + gap, top_y, card_width, card_height, 2, "Maru Friendly", "ramah - bulat - mudah diingat", "WikaruSoft", 2)
    second_y = top_y - card_height - gap
    typography_card(canvas, margin, second_y, card_width, card_height, 3, "Mincho Editorial", "berkelas - tenang - akademis", "WikaruEditorial", 3)
    typography_card(canvas, margin + card_width + gap, second_y, card_width, card_height, 4, "Gakushuu Grid", "ritmis - sistematis - digital", "WikaruMono", 4)
    final_y = 42
    typography_card(canvas, margin, final_y, width - 2 * margin, 176, 5, "Horizon Signature", "hangat - khas - paling orisinal", "WikaruHumanist", 5)

    canvas.setFillColor(MUTED)
    canvas.setFont("WikaruSans", 6.8)
    canvas.drawRightString(width - margin, 22, "Logo memakai bentuk W Wikaru asli; yang berubah hanya sistem tipografi dan lockup.")
    canvas.save()


if __name__ == "__main__":
    build_participant()
    build_admin()
    build_typography_concepts()
    print(PARTICIPANT_PDF)
    print(ADMIN_PDF)
    print(TYPOGRAPHY_PDF)
