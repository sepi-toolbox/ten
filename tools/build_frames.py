#!/usr/bin/env python3
"""
assets/frames/*.png 를 카드에 붙일 수 있는 형태로 가공한다.

프레임 이미지마다 띠 위치가 조금씩 다르므로 **좌표를 실측해서** 뽑는다.
글자·아트는 이 좌표에 맞춰 얹힌다. (프롬프트에 적은 % 는 참고값일 뿐,
실제로 그려진 위치가 정본이다.)

하는 일
  1. 일러스트 창(가장 크고 어두운 사각형)을 찾아 **투명하게 뚫는다** → 아트가 뒤에서 비친다
  2. 이름판 · 코스트 자리 · 효과문 판 · 능력치 소켓 좌표를 실측
  3. 웹용으로 축소해 data URI + 좌표를 data/frames.json 에 저장

  python3 tools/build_frames.py
"""
import base64
import io
import json
import os
import re

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "assets", "frames")
OUT = os.path.join(ROOT, "data", "frames.json")
WIDTH = 260          # 확대 카드가 260px이므로 딱 맞다
COLORS = 128         # 팔레트 양자화 — 28장이라 용량이 중요하다


def pct(v, total):
    return round(v / total * 100, 2)


def find_art(a):
    """일러스트 창 = 카드 한가운데의 크고 균일하게 어두운 사각형.
    바깥 검은 배경에 붙잡히지 않도록 **중앙에서 출발해** 바깥으로 넓힌다."""
    H, W = a.shape
    cx0, cx1 = int(W * .35), int(W * .65)
    core = a[:, cx0:cx1]
    m, s = core.mean(axis=1), core.std(axis=1)
    dark = (m < 95) & (s < 40)

    # 세로 중앙(35~75%)에서 시작해 위아래로 넓힌다
    seed = None
    for y in range(int(H * .35), int(H * .75)):
        if dark[y]:
            seed = y
            break
    if seed is None:
        return None
    y0 = y1 = seed
    while y0 > 0 and dark[y0 - 1]:
        y0 -= 1
    while y1 < H - 1 and dark[y1 + 1]:
        y1 += 1
    if y1 - y0 < H * .12:
        return None

    # 가로: 그 띠 안에서 중앙 픽셀부터 좌우로 넓힌다
    band = a[y0:y1 + 1].mean(axis=0)
    cx = W // 2
    if band[cx] > 110:
        return None
    x0 = x1 = cx
    while x0 > 0 and band[x0 - 1] < 110:
        x0 -= 1
    while x1 < W - 1 and band[x1 + 1] < 110:
        x1 += 1
    if x1 - x0 < W * .4:
        return None
    return int(x0), int(y0), int(x1 + 1), int(y1 + 1)


# 타입별 레이아웃 상수
#   statMode: two=양끝 소켓 2개(공/체) · right=효과문 판 오른쪽 아래 뱃지 1개(충전) · none
LAYOUT = {
    "cr": {"statMode": "two",   "inset": 1.6},
    "sp": {"statMode": "none",  "inset": 1.6},
    "en": {"statMode": "right", "inset": 1.6},
    "ld": {"statMode": "none",  "inset": 1.6},
}


def light_runs(a, minh=0.028):
    """좌우 테두리를 뺀 가운데 띠에서 밝은(양피지) 구간을 찾는다. [(top%,bot%)]
    프레임마다 양피지 밝기가 달라서 임계값은 그 프레임 자체에서 뽑는다."""
    H, W = a.shape
    m = a[:, int(W * .30):int(W * .70)].mean(axis=1)
    thr = max(70.0, float(np.percentile(m, 90)) * 0.68)
    light = m > thr
    out, st = [], None
    for i, d in enumerate(list(light) + [False]):
        if d and st is None:
            st = i
        elif not d and st is not None:
            if i - st >= H * minh:
                out.append((st / H * 100, i / H * 100))
            st = None
    return out


# 이름판·코스트 자리는 아트 창 위쪽에 붙는다. 타입마다 위치가 일정하므로
# 아트 창 상단을 기준으로 잡는다(밝기 검출은 뱃지에 끊겨 불안정했다).
ANCHOR = {                    # (이름판 top offset, 이름판 높이, 코스트 top offset, 코스트 높이)
    "cr": (-14.6, 5.2, -9.6, 8.4),
    "sp": (-7.6, 6.2, 0.0, 0.0),
    "en": (-7.6, 6.2, 0.0, 0.0),
    "ld": (-8.4, 6.6, 0.0, 0.0),
}


def bands(artpct, kind, runs):
    """아트 창 기준으로 이름·코스트를, 검출한 양피지 띠로 효과문·능력치를 잡는다."""
    ax, ay, aw, ah = artpct
    ab = ay + ah
    nOff, nH, cOff, cH = ANCHOR[kind]
    name = [round(max(3.0, ay + nOff), 2), round(nH, 2)]
    cost = [round(ay + cOff, 2), round(cH, 2)] if cH else [0.0, 0.0]

    below = [r for r in runs if r[0] >= ab - 3]
    if below:
        rt, rb = max(below, key=lambda r: r[1] - r[0])
    else:
        rt, rb = ab + 1, 95.0

    mode = LAYOUT[kind]["statMode"]
    stat = [round(rb, 2), round(max(6.0, 98.0 - rb), 2)] if mode == "two" else [0.0, 0.0]
    return {"mode": mode, "name": name, "cost": cost,
            "rules": [round(rt, 2), round(rb - rt, 2)], "stat": stat}


def punch(im, art):
    """일러스트 창을 투명하게 뚫는다."""
    x0, y0, x1, y1 = art
    im = im.convert("RGBA")
    px = im.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            px[x, y] = (0, 0, 0, 0)
    return im


def main():
    files = sorted(f for f in os.listdir(SRC) if f.endswith(".png"))
    out = {}
    for f in files:
        key = re.sub(r"^frame-|\.png$", "", f)
        kind = key.split("-")[-1]
        if kind not in LAYOUT:
            continue
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        W, H = im.size
        a = np.asarray(im.convert("L")).astype(float)
        art = find_art(a)
        if art is None:
            print(f"  ! {key}: 일러스트 창을 못 찾음 — 건너뜀")
            continue
        x0, y0, x1, y1 = art
        holed = punch(im, art)
        if holed.width > WIDTH:
            holed = holed.resize((WIDTH, round(holed.height * WIDTH / holed.width)),
                                 Image.LANCZOS)
        holed = holed.quantize(colors=COLORS, method=Image.FASTOCTREE)
        buf = io.BytesIO()
        holed.save(buf, "PNG", optimize=True)
        uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

        ins = LAYOUT[kind]["inset"]
        artpct = [pct(x0, W) + ins, pct(y0, H) + ins,
                  pct(x1 - x0, W) - ins * 2, pct(y1 - y0, H) - ins * 2]
        artpct = [round(v, 2) for v in artpct]
        rec = {"art": artpct, "img": uri}
        rec.update(bands(artpct, kind, light_runs(a)))
        out[key] = rec
        print(f"  {key:<12} 아트 {artpct}  이름 {rec['name']}  코스트 {rec['cost']}  "
              f"효과 {rec['rules']}  능력치 {rec['stat']}")

    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump(out, fp, ensure_ascii=False)
    print(f"\n{len(out)}장 → {OUT} ({os.path.getsize(OUT)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
