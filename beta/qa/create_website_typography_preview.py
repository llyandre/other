from pathlib import Path

import fitz
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

from create_pdf_previews import (
    GREEN,
    INK,
    LINE,
    MUTED,
    NAVY,
    NAVY_2,
    NAVY_SOFT,
    PAPER,
    RED,
    WHITE,
    draw_logo,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
OUTPUT.mkdir(parents=True, exist_ok=True)
PDF_PATH = OUTPUT / "Preview_5_Sistem_Tipografi_Website_Wikaru.pdf"

FONT_ROOT = Path("/opt/codex/runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/share/fonts/truetype")
pdfmetrics.registerFont(TTFont("NotoRegular", str(FONT_ROOT / "NotoSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("NotoBold", str(FONT_ROOT / "NotoSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("CarlitoRegular", str(FONT_ROOT / "Carlito-Regular.ttf")))
pdfmetrics.registerFont(TTFont("CarlitoBold", str(FONT_ROOT / "Carlito-Bold.ttf")))
pdfmetrics.registerFont(TTFont("BiolinumRegular", str(FONT_ROOT / "LinBiolinum_R_G.ttf")))
pdfmetrics.registerFont(TTFont("BiolinumBold", str(FONT_ROOT / "LinBiolinum_RB_G.ttf")))
pdfmetrics.registerFont(TTFont("LibertineRegular", str(FONT_ROOT / "LinLibertine_R_G.ttf")))
pdfmetrics.registerFont(TTFont("LibertineBold", str(FONT_ROOT / "LinLibertine_RB_G.ttf")))

SYSTEMS = [
    {
        "number": "01", "name": "Balanced Modern", "pair": "Plus Jakarta Sans + Noto Sans JP",
        "note": "Seimbang, modern, dan paling konsisten dengan Wikaru saat ini.",
        "heading": "NotoBold", "body": "NotoRegular", "jp": "HeiseiKakuGo-W5",
        "display": 29, "body_size": 9.2, "leading": 13.5, "radius": 14,
    },
    {
        "number": "02", "name": "Airy Humanist", "pair": "Manrope + Zen Kaku Gothic New",
        "note": "Lebih lega dan hangat; cocok untuk materi panjang di desktop dan iPad.",
        "heading": "CarlitoBold", "body": "CarlitoRegular", "jp": "HeiseiKakuGo-W5",
        "display": 31, "body_size": 9.7, "leading": 15, "radius": 12,
    },
    {
        "number": "03", "name": "Friendly Rounded", "pair": "Nunito Sans + M PLUS Rounded 1c",
        "note": "Ramah dan ringan tanpa dibuat kekanak-kanakan.",
        "heading": "NotoBold", "body": "NotoRegular", "jp": "HeiseiKakuGo-W5",
        "display": 28, "body_size": 9.7, "leading": 14.5, "radius": 22,
    },
    {
        "number": "04", "name": "Clear Utility", "pair": "Inter + BIZ UDPGothic",
        "note": "Paling tajam untuk kuis, tabel, angka, dan layar mobile kecil.",
        "heading": "WikaruSans-Bold", "body": "WikaruSans", "jp": "HeiseiKakuGo-W5",
        "display": 28, "body_size": 8.8, "leading": 12.5, "radius": 10,
    },
    {
        "number": "05", "name": "Editorial Learning", "pair": "Source Sans 3 + Noto Serif JP",
        "note": "Berkarakter akademis; bagus untuk materi dan laporan, lebih formal untuk UI.",
        "heading": "LibertineBold", "body": "NotoRegular", "jp": "HeiseiMin-W3",
        "display": 32, "body_size": 9.2, "leading": 14, "radius": 9,
    },
]


def paragraph(canvas, text, x, y_top, width, height, font, size, color=INK, leading=None, bold=False):
    style = ParagraphStyle(
        "preview", fontName=font, fontSize=size, leading=leading or size * 1.35,
        textColor=color, spaceAfter=0, spaceBefore=0,
    )
    flow = Paragraph(text, style)
    _, used = flow.wrap(width, height)
    flow.drawOn(canvas, x, y_top - used)
    return used


def pill(canvas, text, x, y, font, fill=NAVY_SOFT, text_color=NAVY, height=22, pad=12):
    size = 7.2
    width = canvas.stringWidth(text, font, size) + pad * 2
    canvas.setFillColor(fill)
    canvas.roundRect(x, y, width, height, height / 2, stroke=0, fill=1)
    canvas.setFillColor(text_color)
    canvas.setFont(font, size)
    canvas.drawCentredString(x + width / 2, y + 7.3, text)
    return width


def button(canvas, text, x, y, width, height, system, primary=True):
    canvas.setFillColor(NAVY if primary else WHITE)
    canvas.setStrokeColor(NAVY if primary else LINE)
    canvas.roundRect(x, y, width, height, min(system["radius"], height / 2), stroke=0 if primary else 1, fill=1)
    canvas.setFillColor(WHITE if primary else NAVY)
    canvas.setFont(system["heading"], 8.2)
    canvas.drawCentredString(x + width / 2, y + height / 2 - 2.8, text)


def vocabulary_card(canvas, x, y, width, height, system, compact=False):
    canvas.setFillColor(WHITE)
    canvas.setStrokeColor(LINE)
    canvas.roundRect(x, y, width, height, system["radius"], stroke=1, fill=1)
    canvas.setFillColor(NAVY_SOFT)
    canvas.roundRect(x + 14, y + height - 38, 48 if not compact else 42, 21, 10.5, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont(system["heading"], 6.8)
    canvas.drawCentredString(x + 38 if not compact else x + 35, y + height - 30.4, "BAB 6")
    canvas.setFont(system["jp"], 18 if not compact else 15)
    canvas.drawString(x + 14, y + height - 66, "食べる")
    canvas.setFillColor(MUTED)
    canvas.setFont(system["jp"], 7.5)
    canvas.drawString(x + 15, y + height - 81, "たべる")
    canvas.setFont(system["body"], 7.3)
    canvas.drawString(x + 14, y + 22, "taberu  •  makan")
    if not compact:
        canvas.setFillColor(RED)
        canvas.circle(x + width - 20, y + height - 27, 3.2, stroke=0, fill=1)


def quiz_card(canvas, x, y, width, height, system):
    canvas.setFillColor(WHITE)
    canvas.setStrokeColor(LINE)
    canvas.roundRect(x, y, width, height, system["radius"], stroke=1, fill=1)
    pill(canvas, "PERTANYAAN 8 / 10", x + 14, y + height - 36, system["heading"], height=20, pad=10)
    canvas.setFillColor(INK)
    canvas.setFont(system["body"], 8)
    canvas.drawString(x + 14, y + height - 47, "Apa arti dari")
    canvas.setFillColor(NAVY)
    canvas.setFont(system["jp"], 16)
    canvas.drawString(x + 14, y + 48, "聞く")
    for index, label in enumerate(["mendengar", "membaca"]):
        option_y = y + 25 - index * 21
        canvas.setFillColor(NAVY_SOFT if index == 0 else PAPER)
        canvas.roundRect(x + 14, option_y, width - 28, 18, 8, stroke=0, fill=1)
        canvas.setFillColor(NAVY if index == 0 else MUTED)
        canvas.setFont(system["body"], 6.8)
        canvas.drawString(x + 23, option_y + 5.7, label)


def desktop_mockup(canvas, x, y, width, height, system):
    canvas.setFillColor(WHITE)
    canvas.setStrokeColor(LINE)
    canvas.roundRect(x, y, width, height, 16, stroke=1, fill=1)
    canvas.setFillColor(PAPER)
    canvas.roundRect(x + 1, y + height - 54, width - 2, 53, 15, stroke=0, fill=1)
    draw_logo(canvas, x + 17, y + height - 44, 31)
    canvas.setFillColor(NAVY)
    canvas.setFont("WikaruSans-Bold", 11)
    canvas.drawString(x + 56, y + height - 29, "Wikaru")
    nav = ["Beranda", "Materi", "Kuis", "Tentang"]
    cursor = x + width - 238
    for item in nav:
        canvas.setFillColor(NAVY if item == "Beranda" else MUTED)
        canvas.setFont(system["body"], 6.7)
        canvas.drawString(cursor, y + height - 29, item)
        cursor += 49

    content_x = x + 28
    content_top = y + height - 82
    pill(canvas, "LANJUTKAN BELAJAR", content_x, content_top - 4, system["heading"], height=20, pad=10)
    heading_top = content_top - 34
    heading_height = paragraph(canvas, "Lanjutkan perjalanan<br/>belajarmu", content_x, heading_top, width * .56, 95, system["heading"], system["display"], INK, system["display"] * 1.05)
    japanese_y = heading_top - heading_height - 18
    canvas.setFillColor(NAVY)
    canvas.setFont(system["jp"], 12)
    canvas.drawString(content_x, japanese_y, "今日も少しずつ、前へ。")
    body_top = japanese_y - 20
    body_height = paragraph(canvas, "Pelajari kosakata dan pola kalimat secara bertahap. Tampilan yang nyaman membuat sesi belajar panjang tetap ringan dibaca.", content_x, body_top, width * .53, 60, system["body"], system["body_size"], MUTED, system["leading"])
    japanese_body_y = body_top - body_height - 8
    canvas.setFillColor(INK)
    canvas.setFont(system["jp"], 7.8)
    canvas.drawString(content_x, japanese_body_y, "語彙と文型を、無理なく少しずつ学びましょう。")
    button_y = japanese_body_y - 47
    button(canvas, "Mulai Kuis", content_x, button_y, 105, 31, system, True)
    button(canvas, "Buka Materi", content_x + 115, button_y, 112, 31, system, False)

    card_y = y + 27
    vocabulary_card(canvas, content_x, card_y, 190, 118, system)
    quiz_card(canvas, content_x + 205, card_y, 208, 118, system)
    scale_x = x + width - 220
    scale_y = content_top - 16
    canvas.setFillColor(PAPER)
    canvas.roundRect(scale_x, scale_y - 190, 190, 190, system["radius"], stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont(system["heading"], 8)
    canvas.drawString(scale_x + 16, scale_y - 22, "HIERARKI TIPOGRAFI")
    samples = [("Display", system["display"]), ("Judul halaman", 20), ("Judul kartu", 14), ("Isi bacaan", system["body_size"]), ("Label & tombol", 7.2)]
    cursor_y = scale_y - 48
    for label, size in samples:
        canvas.setFillColor(MUTED)
        canvas.setFont(system["body"], 6)
        canvas.drawString(scale_x + 16, cursor_y, label)
        canvas.setFillColor(INK)
        canvas.setFont(system["heading"] if size >= 14 else system["body"], min(size, 18))
        canvas.drawRightString(scale_x + 172, cursor_y, f"Aa  {size:g}")
        cursor_y -= 28


def mobile_mockup(canvas, x, y, width, height, system):
    canvas.setFillColor(WHITE)
    canvas.setStrokeColor(LINE)
    canvas.roundRect(x, y, width, height, 24, stroke=1, fill=1)
    draw_logo(canvas, x + 18, y + height - 45, 29)
    canvas.setFillColor(NAVY)
    canvas.setFont("WikaruSans-Bold", 10)
    canvas.drawString(x + 54, y + height - 30, "Wikaru")
    canvas.setFillColor(NAVY_SOFT)
    canvas.circle(x + width - 31, y + height - 29, 13, stroke=0, fill=1)
    canvas.setFillColor(NAVY)
    canvas.setFont(system["heading"], 6)
    canvas.drawCentredString(x + width - 31, y + height - 31, "AY")
    content_x = x + 20
    top = y + height - 76
    pill(canvas, "LANJUTKAN BELAJAR", content_x, top, system["heading"], height=18, pad=8)
    heading_top = top - 20
    heading_height = paragraph(canvas, "Belajar sedikit,<br/>maju setiap hari", content_x, heading_top, width - 40, 78, system["heading"], max(20, system["display"] * .72), INK, max(22, system["display"] * .77))
    japanese_y = heading_top - heading_height - 15
    canvas.setFillColor(NAVY)
    canvas.setFont(system["jp"], 9.2)
    canvas.drawString(content_x, japanese_y, "今日も少しずつ、前へ。")
    body_top = japanese_y - 22
    body_height = paragraph(canvas, "Ukuran teks tetap nyaman pada layar sempit tanpa membuat kartu terasa penuh.", content_x, body_top, width - 40, 62, system["body"], max(8.4, system["body_size"] * .92), MUTED, system["leading"] * .9)
    button(canvas, "Mulai Kuis", content_x, body_top - body_height - 46, width - 40, 31, system, True)
    vocabulary_card(canvas, content_x, y + 67, width - 40, 110, system, True)
    canvas.setFillColor(PAPER)
    canvas.roundRect(x + 14, y + 13, width - 28, 39, 19, stroke=0, fill=1)
    for index, label in enumerate(["Beranda", "Materi", "Kuis", "Profil"]):
        center = x + 45 + index * ((width - 90) / 3)
        canvas.setFillColor(NAVY if index == 0 else MUTED)
        canvas.setFont(system["body"], 5.8)
        canvas.drawCentredString(center, y + 28, label)


def build_preview():
    page = landscape(A3)
    width, height = page
    canvas = pdfcanvas.Canvas(str(PDF_PATH), pagesize=page, pageCompression=1)
    canvas.setTitle("Lima Sistem Tipografi Website Wikaru")
    canvas.setAuthor("Wikaru")
    canvas.setSubject("Perbandingan font Indonesia dan Jepang untuk seluruh UI website")
    for index, system in enumerate(SYSTEMS):
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, width, height, stroke=0, fill=1)
        draw_logo(canvas, 45, height - 92, 38)
        canvas.setFillColor(NAVY)
        canvas.setFont("WikaruSans-Bold", 19)
        canvas.drawString(96, height - 58, f"Konsep {system['number']} - {system['name']}")
        canvas.setFillColor(INK)
        canvas.setFont("WikaruSans-Bold", 9)
        canvas.drawString(96, height - 77, system["pair"])
        canvas.setFillColor(MUTED)
        canvas.setFont("WikaruSans", 7.4)
        canvas.drawString(340, height - 77, system["note"])
        pill(canvas, "SISTEM FONT WEBSITE", width - 205, height - 82, "WikaruSans-Bold", fill=RED, text_color=WHITE, height=25, pad=14)

        desktop_mockup(canvas, 44, 72, 785, 645, system)
        mobile_mockup(canvas, 852, 72, 295, 645, system)
        canvas.setFillColor(MUTED)
        canvas.setFont("WikaruSans", 6.2)
        canvas.drawString(47, 42, "Simulasi mencakup heading, paragraf, teks Jepang, tombol, navigasi, kartu materi, dan kuis.")
        canvas.drawRightString(width - 45, 42, f"{index + 1} / {len(SYSTEMS)}")
        canvas.showPage()
    canvas.save()


if __name__ == "__main__":
    build_preview()
    print(PDF_PATH)
