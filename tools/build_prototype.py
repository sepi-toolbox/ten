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

WIDTH = 200      # 보드 슬롯 47px · 손패 86px · 확대 260px — 200이면 충분하고 파일이 가볍다
QUALITY = 68


def load_rows():
    rows = []
    for fn in ("creatures.csv", "spells.csv", "enchants.csv"):
        with open(os.path.join(DATA, fn), encoding="utf-8") as f:
            rows += list(csv.DictReader(f))
    return rows


def inject_costs(html, rows):
    """POOL의 각 카드에 cc(유색 요구)를 주입한다. (CE는 ELEM 블록에서 이미 선언됨)"""
    import re as _re
    cc = {r["name"]: int(r.get("cost_color") or 1) for r in rows}
    html = _re.sub(r"const CARDEL=\{[^}]*\};[^\n]*\n", "", html, count=1)
    for name, v in cc.items():
        pat = _re.compile(r"(" + _re.escape(name) + r":\{c:\d+,k:'[a-z]{2}')(?!,cc:)")
        html = pat.sub(lambda m: m.group(1) + f",cc:{v}", html, count=1)
    return html


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
    html = inject_costs(html, load_rows())
    block = "/* ART_START */\nconst ART = " + json.dumps(art, ensure_ascii=False, indent=0) + ";\n/* ART_END */"
    if "/* ART_START */" in html:
        html = re.sub(r"/\* ART_START \*/.*?/\* ART_END \*/", lambda m: block, html, count=1, flags=re.S)
    else:
        html = html.replace("const POOL={", block + "\nconst POOL={", 1)
    open(PROTO, "w", encoding="utf-8").write(html)
    print(f"injected {len(art)} art images into prototype/index.html")


if __name__ == "__main__":
    main()
