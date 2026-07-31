#!/usr/bin/env python3
"""
프로토타입(prototype/index.html)에 카드 아트를 주입한다.

data/의 image 경로를 읽어 카드명 → data URI 사전(ART)을 만들고,
index.html의 /* ART_START */ ~ /* ART_END */ 사이를 교체한다. (멱등)

  python3 tools/build_prototype.py
"""
import base64
import csv
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
PROTO = os.path.join(ROOT, "prototype", "index.html")

WIDTH = 300      # 보드 슬롯·손패는 작으므로 축소
QUALITY = 78


def load_rows():
    rows = []
    for fn in ("creatures.csv", "spells.csv", "enchants.csv"):
        with open(os.path.join(DATA, fn), encoding="utf-8") as f:
            rows += list(csv.DictReader(f))
    return rows


def main():
    from PIL import Image
    art = {}
    for r in load_rows():
        path = r.get("image") or ""
        if not path:
            continue
        full = os.path.join(ROOT, path)
        if not os.path.exists(full):
            continue
        im = Image.open(full).convert("RGB")
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=QUALITY)
        art[r["name"]] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    html = open(PROTO, encoding="utf-8").read()
    block = "/* ART_START */\nconst ART = " + json.dumps(art, ensure_ascii=False) + ";\n/* ART_END */"
    if "/* ART_START */" in html:
        html = re.sub(r"/\* ART_START \*/.*?/\* ART_END \*/", lambda m: block, html, count=1, flags=re.S)
    else:
        html = html.replace("const POOL={", block + "\nconst POOL={", 1)
    open(PROTO, "w", encoding="utf-8").write(html)
    print(f"injected {len(art)} art images into prototype/index.html")


if __name__ == "__main__":
    main()
