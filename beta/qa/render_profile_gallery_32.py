from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa" / "previews" / "profile-gallery-32.png"
PROFILE = ROOT / "assets" / "profile"

USERS = [
    ("kitsune.webp", "Kitsune Cerdas"), ("usagi.webp", "Usagi Tekun"),
    ("neko.webp", "Neko Ramah"), ("tanuki.webp", "Tanuki Tangguh"),
    ("tsuru.webp", "Tsuru Fokus"), ("koi.webp", "Koi Gigih"),
    ("fukurou.webp", "Fukurou Bijak"), ("book-spirit.webp", "Penjaga Buku"),
    ("lantern.webp", "Lentera Ilmu"), ("fuji-spirit.webp", "Fuji Teguh"),
    ("sakura-spirit.webp", "Sakura Ceria"), ("moon-spirit.webp", "Tsuki Tenang"),
    ("sun-spirit.webp", "Taiyō Semangat"), ("cloud-spirit.webp", "Kumo Damai"),
    ("paper-plane.webp", "Penjelajah Sora"),
    ("daruma.webp", "Daruma Pantang Menyerah"), ("onigiri.webp", "Onigiri Ceria"),
    ("sensu.webp", "Sensu Luwes"), ("take-spirit.webp", "Take Bertumbuh"),
    ("ame-spirit.webp", "Ame Sabar"), ("yuki-spirit.webp", "Yuki Jernih"),
    ("nami-spirit.webp", "Nami Berani"), ("hoshi-spirit.webp", "Hoshi Pemandu"),
    ("fude-spirit.webp", "Fude Kreatif"), ("suzume.webp", "Suzume Gesit"),
    ("kame.webp", "Kame Konsisten"), ("shiba.webp", "Shiba Setia"),
    ("kintsugi.webp", "Kintsugi Tangguh"), ("koma-spirit.webp", "Koma Seimbang"),
    ("kotoba-spirit.webp", "Kotoba Komunikatif"),
]

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)

def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def fit_text(draw, text, max_width, start=18, minimum=12):
    size = start
    while size > minimum and draw.textlength(text, font=font(size, True)) > max_width:
        size -= 1
    return font(size, True)

def title_lines(text):
    words = text.split()
    if len(text) <= 20 or len(words) < 2:
        return text
    best = 1
    target = len(text) / 2
    for index in range(1, len(words)):
        if abs(len(" ".join(words[:index])) - target) < abs(len(" ".join(words[:best])) - target):
            best = index
    return " ".join(words[:best]) + "\n" + " ".join(words[best:])

def profile_image(file_name, size):
    image = Image.open(PROFILE / file_name).convert("RGBA")
    return ImageOps.contain(image, (size, size), Image.Resampling.LANCZOS)

def default_icon(size):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((2, 2, size-2, size-2), fill="#E9EDFA", outline="#17356F", width=max(2, size//28))
    draw.ellipse((size*.35, size*.20, size*.65, size*.50), fill="#17356F")
    draw.pieslice((size*.21, size*.42, size*.79, size*.96), 180, 360, fill="#17356F")
    return image

W, H = 1800, 1190
canvas = Image.new("RGB", (W, H), "#F4F7FC")
draw = ImageDraw.Draw(canvas)
draw.ellipse((1400, -250, 1930, 280), fill="#E2EBFF")
draw.ellipse((-250, 890, 260, 1400), fill="#FFF0D2")
draw.text((72, 48), "WIKARU  •  SISTEM PROFIL FINAL", font=font(18, True), fill="#46608F")
draw.text((72, 84), "32 ikon profil yang berbeda", font=font(46, True), fill="#172033")
draw.text((72, 146), "30 avatar pengguna acak berdasarkan nama  •  1 akun default  •  1 admin khusus", font=font(19), fill="#66738B")
rounded(draw, (1456, 88, 1728, 140), 26, "#FFFFFF", "#D9E3F3")
draw.ellipse((1482, 105, 1498, 121), fill="#24B47E")
draw.text((1512, 101), "WebP transparan • lazy", font=font(14, True), fill="#38527F")

items = [(None, "Pengguna Tamu", "DEFAULT", False)]
items += [(name, title, "BARU" if index >= 15 else "", False) for index, (name, title) in enumerate(USERS)]
items += [("admin-guardian.webp", "Penjaga Utama Wikaru", "ADMIN", True)]

cols = 8
card_w, card_h, gap_x, gap_y = 198, 208, 14, 16
left, top = 72, 214

for index, (file_name, title, tag, admin) in enumerate(items):
    row, col = divmod(index, cols)
    x = left + col * (card_w + gap_x)
    y = top + row * (card_h + gap_y)
    fill = "#FFFCF2" if admin else "#FFFFFF"
    border = "#D3AA50" if admin else "#DDE5F0"
    rounded(draw, (x, y, x+card_w, y+card_h), 22, fill, border, 2 if admin else 1)
    icon = profile_image(file_name, 106) if file_name else default_icon(106)
    canvas.paste(icon, (x+46, y+18), icon)
    label = title_lines(title)
    widest = max(label.split("\n"), key=len)
    text_font = fit_text(draw, widest, card_w-24, 16, 12)
    box = draw.multiline_textbbox((0, 0), label, font=text_font, spacing=2, align="center")
    tw, th = box[2]-box[0], box[3]-box[1]
    draw.multiline_text((x+(card_w-tw)/2, y+132), label, font=text_font, fill="#172033", spacing=2, align="center")
    if tag:
        tag_fill = "#9B6B16" if admin else ("#243B73" if tag == "DEFAULT" else "#EAF1FF")
        tag_color = "#FFFFFF" if admin or tag == "DEFAULT" else "#315E9F"
        tag_width = draw.textlength(tag, font=font(10, True)) + 20
        rounded(draw, (x+(card_w-tag_width)/2, y+171, x+(card_w+tag_width)/2, y+194), 12, tag_fill)
        draw.text((x+(card_w-tag_width)/2+10, y+176), tag, font=font(10, True), fill=tag_color)

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, optimize=True)
print(OUT)
