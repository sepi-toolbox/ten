#!/usr/bin/env python3
"""엘리멘츠 대전 앱 아이콘을 만든다. (멱등)

  python3 tools/build_etg_icons.py

⚠ 게임(prototype/icon-*.png)·카드 뷰어(cards/icon-*.png)와 **한눈에 갈려야** 한다 —
  홈 화면에 셋 다 깔릴 수 있는데 비슷하게 생기면 어느 게 뭔지 알 수가 없다.
    게임   = 금색 마름모 하나
    뷰어   = 부채꼴로 펼친 카드 세 장(파란 테)
    엘리멘츠 = **열두 갈래 색 고리**(12속성) — 이 게임의 정체가 곧 12속성이다.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "prototype", "etg")

BG = (18, 13, 9, 255)
PARCH = (236, 224, 196, 255)
# prototype/etg 의 ELC 와 같은 12속성 색(무색 제외)
ELC = ["#a578e0", "#7d8fa2", "#b0762e", "#8a6a3a", "#57ab3c", "#c04a3f",
       "#4d6fd4", "#e0c65e", "#4fb8d8", "#d99a2b", "#6b5a80", "#4fd1c0"]


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_icon(size, maskable=False):
    S = 4                                   # 4배로 그리고 줄여서 계단을 없앤다
    W = size * S
    im = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = W * 0.02 if maskable else W * 0.012
    d.rounded_rectangle((pad, pad, W - pad, W - pad), radius=W * 0.22, fill=BG)

    inner = 0.80 if maskable else 1.0
    cx = cy = W * 0.5
    r_out = W * 0.40 * inner
    r_in = W * 0.255 * inner
    # 열두 갈래 색 고리 — 한 조각씩 제 속성 색으로
    for i, c in enumerate(ELC):
        a0 = -90 + i * 30 + 1.6
        a1 = -90 + (i + 1) * 30 - 1.6
        d.pieslice((cx - r_out, cy - r_out, cx + r_out, cy + r_out),
                   a0, a1, fill=rgb(c))
    d.ellipse((cx - r_in, cy - r_in, cx + r_in, cy + r_in), fill=BG)

    # 가운데 글자 — 뷰어의 'CARDS' 와 같은 자리 감각
    if not maskable:
        f = font(int(W * 0.30))
        t = "E"
        bb = d.textbbox((0, 0), t, font=f)
        d.text((cx - (bb[2] - bb[0]) / 2 - bb[0], cy - (bb[3] - bb[1]) / 2 - bb[1]),
               t, font=f, fill=PARCH)
    return im.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [("icon-192.png", 192, False), ("icon-512.png", 512, False),
            ("icon-maskable.png", 512, True), ("apple-touch-icon.png", 180, False)]
    for name, size, mask in jobs:
        draw_icon(size, mask).save(os.path.join(OUT, name))
    print("엘리멘츠 아이콘 4종 생성: " + ", ".join(n for n, _, _ in jobs))


if __name__ == "__main__":
    main()
