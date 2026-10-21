# 짤 누끼: 인물은 rembg로 오리고, 자막 상자는 사각형 그대로 살림 → assets/jjal/cut/<id>.png (투명 PNG, 여백 잘라냄)
# catalog 항목에 "cut": {"crop": [x,y,w,h], "keep": [{"box": [x,y,w,h], "shape": "round", "r": .03}, …]}
#   (모두 0~1 비율. crop은 원본 기준, keep은 crop한 뒤 기준. r은 폭 기준)
#   crop: 두 칸짜리 짤에서 한 칸만 쓸 때 | drop: [[x,y,w,h], …] 인물 누끼에 딸려 온 배경을 지울 사각형 (keep보다 먼저) | keep: 자막을 살릴 자리. shape:
#     rect | round(둥근 상자 자막) | ellipse(구름 말풍선) | text(상자 없는 글자 자막: 칸 테두리 색과 다른 픽셀만 남김, t=문턱.
#     "color": [r,g,b] 를 주면 그 글자색(색상 ±tol, 0~255 눈금)과, 그 바로 옆의 밝은 픽셀(글자 속·외곽선)만 남김 — 배경이 얼룩덜룩할 때)
# 확인용: out/cut-debug/<id>.jpg (왼쪽 = 원본에 keep 표시, 오른쪽 = 검정 바탕에 누끼)
# 실행: python jjal/cutout.py yoo-shock park-ruined   (MODEL=birefnet-portrait 기본)
import json, os, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter
from rembg import new_session, remove

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat = json.load(open(os.path.join(root, "jjal/catalog.json"), encoding="utf-8"))["items"]
session = new_session(os.environ.get("MODEL", "birefnet-portrait"))
os.makedirs(os.path.join(root, "assets/jjal/cut"), exist_ok=True)
os.makedirs(os.path.join(root, "out/cut-debug"), exist_ok=True)

def far(reg, color):
    # 채널별 차이 중 가장 큰 값 (밝기로 섞으면 분홍과 베이지처럼 색이 다른데도 가깝게 나옴)
    r, g, b = ImageChops.difference(reg, Image.new("RGB", reg.size, tuple(color))).split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b)


def text_mask(im, b, t, color=None, tol=18):
    # 칸 테두리 픽셀의 중간값을 배경색으로 보고, 그 색에서 t 이상 떨어진 픽셀(글자·외곽선·반짝이)만 남김
    reg = im.crop(b)
    w, h = reg.size
    px = reg.load()
    edge = [px[i, 0] for i in range(w)] + [px[i, h - 1] for i in range(w)] + [px[0, j] for j in range(h)] + [px[w - 1, j] for j in range(h)]
    bg = [sorted(c[i] for c in edge)[len(edge) // 2] for i in range(3)]
    diff = far(reg, bg)
    m = diff.point(lambda v: 255 if v > t else 0)
    if color:
        # 글자색은 색상(hue)과 채도로 찾음 — RGB 거리로 보면 칙칙한 배경 분홍빛도 걸림
        th = Image.new("RGB", (1, 1), tuple(color)).convert("HSV").getpixel((0, 0))[0]
        h, sat, val = reg.convert("HSV").split()
        hue_ok = h.point(lambda v: 255 if min(abs(v - th), 256 - abs(v - th)) < tol else 0)
        main = ImageChops.multiply(ImageChops.multiply(hue_ok, sat.point(lambda v: 255 if v > 100 else 0)), val.point(lambda v: 255 if v > 90 else 0))
        near = main.filter(ImageFilter.MaxFilter(7))
        r, g, b2 = reg.split()
        white = ImageChops.darker(ImageChops.darker(r, g), b2).point(lambda v: 255 if v > 175 else 0)
        m = ImageChops.lighter(main, ImageChops.multiply(near, white))
        return paste_full(im, b, m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8)))
    return paste_full(im, b, m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1)))


def paste_full(im, b, m):
    full = Image.new("L", im.size, 0)
    full.paste(m, b[:2])
    return full


for id in sys.argv[1:]:
    m = next(x for x in cat if x["id"] == id)
    cfg = m.get("cut", {})
    im = Image.open(os.path.join(root, "assets", m["image"])).convert("RGB")
    W, H = im.size
    if "crop" in cfg:
        x, y, w, h = cfg["crop"]
        im = im.crop((round(x * W), round(y * H), round((x + w) * W), round((y + h) * H)))
        W, H = im.size
    alpha = remove(im, session=session, only_mask=True, post_process_mask=True).convert("L")
    for x, y, w, h in cfg.get("drop", []):
        alpha.paste(0, (round(x * W), round(y * H), round((x + w) * W), round((y + h) * H)))
    keeps = [k if isinstance(k, dict) else {"box": k} for k in cfg.get("keep", [])]
    boxes = []
    for k in keeps:
        x, y, w, h = k["box"]
        b = (round(x * W), round(y * H), round((x + w) * W), round((y + h) * H))
        boxes.append(b)
        shape = k.get("shape", "rect")
        if shape == "text":
            alpha = ImageChops.lighter(alpha, text_mask(im, b, k.get("t", 60), k.get("color"), k.get("tol", 18)))
            continue
        mk = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(mk)
        if shape == "round": d.rounded_rectangle(b, radius=round(k.get("r", .02) * W), fill=255)
        elif shape == "ellipse": d.ellipse(b, fill=255)
        else: d.rectangle(b, fill=255)
        alpha = ImageChops.lighter(alpha, mk.filter(ImageFilter.GaussianBlur(1)))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    out = out.crop(alpha.point(lambda v: 255 if v > 24 else 0).getbbox())
    out.save(os.path.join(root, f"assets/jjal/cut/{id}.png"), optimize=True)

    dbg = Image.new("RGB", (W * 2, H), "#0e0f10")
    left = im.copy()
    d = ImageDraw.Draw(left)
    for b in boxes:
        d.rectangle(b, outline="#1fd8a4", width=max(2, W // 200))
    dbg.paste(left, (0, 0))
    dbg.paste(out, (W + (W - out.width) // 2, H - out.height), out)
    dbg.save(os.path.join(root, f"out/cut-debug/{id}.jpg"), quality=85)
    print(id, im.size, "→", out.size)
