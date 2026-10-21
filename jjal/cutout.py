# 짤 누끼: 인물은 rembg로 오리고, 자막 상자는 사각형 그대로 살림 → assets/jjal/cut/<id>.png (투명 PNG, 여백 잘라냄)
# catalog 항목에 "cut": {"crop": [x,y,w,h], "keep": [[x,y,w,h], …]}  (모두 0~1 비율. crop은 원본 기준, keep은 crop한 뒤 기준)
#   crop: 두 칸짜리 짤에서 한 칸만 쓸 때 | keep: 자막 상자처럼 배경째 살릴 사각형
# 확인용: out/cut-debug/<id>.jpg (왼쪽 = 원본에 keep 표시, 오른쪽 = 검정 바탕에 누끼)
# 실행: python jjal/cutout.py yoo-shock park-ruined   (MODEL=birefnet-portrait 기본)
import json, os, sys
from PIL import Image, ImageDraw
from rembg import new_session, remove

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat = json.load(open(os.path.join(root, "jjal/catalog.json"), encoding="utf-8"))["items"]
session = new_session(os.environ.get("MODEL", "birefnet-portrait"))
os.makedirs(os.path.join(root, "assets/jjal/cut"), exist_ok=True)
os.makedirs(os.path.join(root, "out/cut-debug"), exist_ok=True)

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
    boxes = [(round(x * W), round(y * H), round((x + w) * W), round((y + h) * H)) for x, y, w, h in cfg.get("keep", [])]
    for b in boxes:
        alpha.paste(255, b)
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
