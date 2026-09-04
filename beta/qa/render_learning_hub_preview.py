from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"output"/"previews"/"Wikaru_Smart_Learning_Preview.png"
OUT.parent.mkdir(parents=True,exist_ok=True)

W,H=2100,1400
BG="#F1F2EE"; SURFACE="#FFFFFF"; MUTED="#6A706B"; INK="#171917"; NAVY="#243B73"; NAVY2="#1B2F60"; SOFT="#E9EDFA"; LINE="#E2E4DD"; RED="#E84B3C"; GREEN="#278B62"; GREEN_SOFT="#E3F4EC"; GOLD="#D49327"; GOLD_SOFT="#FFF3D9"
canvas=Image.new("RGB",(W,H),BG)
draw=ImageDraw.Draw(canvas)
regular_path="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
bold_path="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def font(size,bold=False): return ImageFont.truetype(bold_path if bold else regular_path,size)
def rr(box,r,fill,outline=None,width=1): draw.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=width)
def shadow(box,r=24,blur=18,offset=(0,10),alpha=36):
    layer=Image.new("RGBA",canvas.size,(0,0,0,0));d=ImageDraw.Draw(layer);x1,y1,x2,y2=box;d.rounded_rectangle((x1+offset[0],y1+offset[1],x2+offset[0],y2+offset[1]),radius=r,fill=(25,34,39,alpha));layer=layer.filter(ImageFilter.GaussianBlur(blur));canvas.paste(layer,(0,0),layer)
def txt(x,y,value,size=22,color=INK,bold=False,anchor=None): draw.text((x,y),value,font=font(size,bold),fill=color,anchor=anchor)
def wrap_text(value,max_width,size,bold=False):
    f=font(size,bold);words=value.split();lines=[];line=""
    for word in words:
        trial=(line+" "+word).strip()
        if draw.textlength(trial,font=f)<=max_width:line=trial
        else:
            if line:lines.append(line)
            line=word
    if line:lines.append(line)
    return lines
def paragraph(x,y,value,max_width,size=18,color=MUTED,bold=False,gap=1.35):
    for line in wrap_text(value,max_width,size,bold):txt(x,y,line,size,color,bold);y+=int(size*gap)
    return y
def pill(x,y,label,fill=SOFT,color=NAVY,w=None):
    width=w or int(draw.textlength(label,font=font(14,True)))+30;rr((x,y,x+width,y+34),17,fill);txt(x+15,y+9,label,14,color,True);return width
def brand(x,y,scale=1):
    size=int(46*scale);rr((x,y,x+size,y+size),int(14*scale),NAVY);draw.line((x+10*scale,y+15*scale,x+16*scale,y+33*scale,x+23*scale,y+21*scale,x+30*scale,y+33*scale,x+36*scale,y+15*scale),fill="white",width=max(2,int(4*scale)),joint="curve");draw.ellipse((x+32*scale,y+8*scale,x+39*scale,y+15*scale),fill=RED);txt(x+size+12,y+5*scale,"Wikaru",int(23*scale),NAVY,True)
def progress(x,y,w,value,color=NAVY,bg=LINE,h=8):
    rr((x,y,x+w,y+h),h//2,bg);rr((x,y,x+int(w*value),y+h),h//2,color)

txt(60,45,"Wikaru — Pusat Belajar Pribadi",42,NAVY,True)
txt(60,101,"Preview responsif • fitur belajar pintar • tampilan terang",20,MUTED)
pill(1740,55,"FINAL REVIEW",NAVY,"#FFFFFF",280)

def desktop_frame():
    x,y,w,h=60,160,1250,1160
    shadow((x,y,x+w,y+h),28,24,(0,14),42);rr((x,y,x+w,y+h),28,SURFACE)
    rr((x,y,x+w,y+74),28,SURFACE);draw.rectangle((x,y+48,x+w,y+74),fill=SURFACE);draw.line((x,y+74,x+w,y+74),fill=LINE,width=2)
    brand(x+28,y+14,.92)
    for i,label in enumerate(["Beranda","Materi","Belajar"]):txt(x+470+i*115,y+28,label,16,NAVY if i==0 else MUTED,i==0)
    pill(x+w-208,y+19,"Profil",SOFT,NAVY,150)
    cx=x+34;cy=y+103
    pill(cx,cy,"BERANDA  /  PUSAT BELAJAR",SOFT,NAVY,270)
    txt(cx,cy+53,"Pusat Belajar Pribadi",38,INK,True)
    txt(cx,cy+103,"Satu tempat untuk menentukan latihan yang paling berguna hari ini.",17,MUTED)
    rr((x+w-220,cy+46,x+w-34,cy+96),15,SURFACE,LINE,2);txt(x+w-198,cy+62,"Mode Fokus",16,NAVY,True)
    hy=cy+145;hero_w=755;hero_h=265
    rr((cx,hy,cx+hero_w,hy+hero_h),24,NAVY2)
    pill(cx+28,hy+26,"MISI BELAJAR HARI INI","#344D83","#E6ECFF",214)
    txt(cx+28,hy+81,"10 menit untuk menjaga",30,"#FFFFFF",True);txt(cx+28,hy+119,"ingatan tetap kuat",30,"#FFFFFF",True)
    paragraph(cx+28,hy+164,"Mulai dari kosakata yang perlu diulang, lalu tutup dengan tantangan singkat.",490,14,"#D9E2F7")
    txt(cx+28,hy+226,"1 dari 4 langkah selesai",12,"#E8EDFF",True);txt(cx+655,hy+226,"25%",12,"#FFFFFF",True);progress(cx+28,hy+248,675,.25,"#FFFFFF","#435A87",8)
    ox=cx+hero_w+16;mw=395
    for i,(value,label,color,soft) in enumerate([("3","Review jatuh tempo",GOLD,GOLD_SOFT),("8","Perlu dikuatkan",RED,"#FCECE9"),("24","Kosakata dikuasai",GREEN,GREEN_SOFT),("2","Tantangan sempurna",NAVY,SOFT)]):
        bx=ox+(i%2)*(mw//2+8);by=hy+(i//2)*133;rr((bx,by,bx+mw//2,by+125),18,SURFACE,LINE);rr((bx+16,by+16,bx+52,by+52),11,soft);draw.ellipse((bx+28,by+28,bx+40,by+40),fill=color);txt(bx+16,by+70,value,25,INK,True);txt(bx+16,by+101,label,10,MUTED,True)
    sy=hy+282;rr((cx,sy,x+w-34,sy+92),18,SURFACE,LINE);rr((cx+17,sy+18,cx+59,sy+60),13,SOFT);txt(cx+30,sy+29,"?",18,NAVY,True);txt(cx+73,sy+17,"Pencarian pintar",17,INK,True);txt(cx+73,sy+44,"Kanji, kana, romaji, arti Indonesia, atau nomor bab",11,MUTED);rr((cx+470,sy+19,x+w-55,sy+71),14,"#F3F4EF",LINE);txt(cx+492,sy+36,"Cari: tabemasu, makan, Bab 6...",13,MUTED)
    ty=sy+108;rr((cx,ty,x+w-34,ty+57),15,SURFACE,LINE);tabs=["Misi","Buku Kesalahan","Review 1–3–7","Peta Bab","Percakapan","Ringkasan"]
    tx=cx+7
    for i,label in enumerate(tabs):
        tw=[105,175,154,118,139,120][i]
        if i==0:rr((tx,ty+7,tx+tw,ty+50),11,SOFT)
        txt(tx+18,ty+21,label,12,NAVY if i==0 else MUTED,True);tx+=tw+7
    py=ty+73;txt(cx,py,"Empat langkah, satu sesi yang terarah",26,INK,True);rr((x+w-230,py-5,x+w-34,py+42),14,NAVY);txt(x+w-206,py+9,"Latihan adaptif",14,"#FFFFFF",True)
    cards_y=py+62;card_gap=10;card_w=(w-68-3*card_gap)//4
    details=[("01","Review terjadwal","5 kata","Ulang kosakata pada jadwal 1–3–7 hari."),("02","Kuatkan kelemahan","3 kata","Prioritaskan kata yang paling sering salah."),("03","Latihan mendengar","3 kata","Dengar sebelum membuka jawaban."),("04","Tantangan singkat","7 kata","Tutup sesi dengan latihan adaptif.")]
    for i,(no,title,count,copy) in enumerate(details):
        bx=cx+i*(card_w+card_gap);rr((bx,cards_y,bx+card_w,cards_y+208),17,"#F7F7F3",LINE);rr((bx+15,cards_y+15,bx+49,cards_y+49),10,SURFACE);txt(bx+32,cards_y+32,no,12,NAVY,True,"mm");txt(bx+card_w-18,cards_y+24,count,10,MUTED,True,"ra");txt(bx+15,cards_y+75,title,16,INK,True);paragraph(bx+15,cards_y+103,copy,card_w-30,11,MUTED);rr((bx+15,cards_y+160,bx+card_w-15,cards_y+195),11,SURFACE,LINE);txt(bx+card_w/2,cards_y+177,"Mulai",11,NAVY,True,"mm")
    pill(x+20,y+h-46,"DESKTOP 1440 PX",NAVY,"#FFFFFF",178)

def tablet_frame():
    x,y,w,h=1360,160,680,570
    shadow((x,y,x+w,y+h),26,20,(0,12),35);rr((x,y,x+w,y+h),26,SURFACE)
    brand(x+24,y+16,.72);pill(x+w-128,y+18,"Profil",SOFT,NAVY,102)
    cx=x+24;cy=y+85
    pill(cx,cy,"PUSAT BELAJAR",SOFT,NAVY,154);txt(cx,cy+47,"Misi belajar hari ini",28,INK,True)
    hy=cy+90;rr((cx,hy,x+w-24,hy+180),21,NAVY2);pill(cx+20,hy+18,"HARI INI","#344D83","#FFFFFF",90);txt(cx+20,hy+63,"10 menit untuk menjaga ingatan",24,"#FFFFFF",True);txt(cx+20,hy+100,"1 dari 4 langkah selesai",12,"#DCE5FF");progress(cx+20,hy+131,w-88,.25,"#FFFFFF","#435A87",8)
    my=hy+195
    for i,(v,label) in enumerate([("3","Review"),("8","Perlu dilatih"),("24","Dikuasai"),("2","Sempurna")]):
        bx=cx+i*((w-48)//4);rr((bx,my,bx+145,my+83),15,"#F7F7F3",LINE);txt(bx+14,my+15,v,21,INK,True);txt(bx+14,my+51,label,10,MUTED,True)
    ty=my+98;rr((cx,ty,x+w-24,ty+48),14,SURFACE,LINE);txt(cx+18,ty+16,"Misi",12,NAVY,True);txt(cx+101,ty+16,"Kesalahan",12,MUTED,True);txt(cx+216,ty+16,"Review",12,MUTED,True);txt(cx+305,ty+16,"Peta Bab",12,MUTED,True);txt(cx+409,ty+16,"Percakapan",12,MUTED,True)
    pill(x+18,y+h-42,"IPAD 1024 PX",NAVY,"#FFFFFF",147)

def mobile_frame():
    x,y,w,h=1490,775,410,555
    shadow((x,y,x+w,y+h),32,22,(0,12),40);rr((x,y,x+w,y+h),32,SURFACE)
    rr((x,y,x+w,y+61),32,SURFACE);draw.rectangle((x,y+38,x+w,y+61),fill=SURFACE);brand(x+17,y+12,.62);rr((x+w-53,y+13,x+w-15,y+51),13,SOFT);draw.ellipse((x+w-41,y+24,x+w-27,y+38),fill=NAVY)
    cx=x+16;cy=y+79
    pill(cx,cy,"PUSAT BELAJAR",SOFT,NAVY,148);txt(cx,cy+45,"Misi hari ini",27,INK,True)
    hy=cy+85;rr((cx,hy,x+w-16,hy+176),20,NAVY2);pill(cx+18,hy+16,"4 LANGKAH","#344D83","#FFFFFF",108);txt(cx+18,hy+58,"10 menit untuk",24,"#FFFFFF",True);txt(cx+18,hy+90,"menjaga ingatan",24,"#FFFFFF",True);txt(cx+18,hy+132,"25% selesai",11,"#E8EDFF",True);progress(cx+18,hy+153,w-68,.25,"#FFFFFF","#435A87",8)
    my=hy+190
    for i,(v,label,color) in enumerate([("3","Review",GOLD),("8","Perlu dilatih",RED),("24","Dikuasai",GREEN),("2","Sempurna",NAVY)]):
        bx=cx+(i%2)*189;by=my+(i//2)*77;rr((bx,by,bx+177,by+66),14,"#F7F7F3",LINE);draw.ellipse((bx+13,by+14,bx+31,by+32),fill=color);txt(bx+42,by+10,v,18,INK,True);txt(bx+42,by+38,label,9,MUTED,True)
    ty=my+164;rr((cx,ty,x+w-16,ty+45),13,SOFT);txt(cx+16,ty+14,"Misi",11,NAVY,True);txt(cx+81,ty+14,"Kesalahan",11,MUTED,True);txt(cx+179,ty+14,"Review",11,MUTED,True);txt(cx+249,ty+14,"Peta Bab",11,MUTED,True)
    rr((cx,ty+59,x+w-16,ty+112),14,NAVY);txt(x+w/2,ty+86,"Mulai latihan adaptif",12,"#FFFFFF",True,"mm")
    pill(x+18,y+h-42,"MOBILE 390 PX",NAVY,"#FFFFFF",150)

desktop_frame();tablet_frame();mobile_frame()
canvas.save(OUT,optimize=True)
print(OUT)
