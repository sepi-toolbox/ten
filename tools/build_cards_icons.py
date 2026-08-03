#!/usr/bin/env python3
"""
카드 뷰어용 앱 아이콘을 만든다. (멱등)

  python3 tools/build_cards_icons.py

게임 아이콘(prototype/icon-*.png)과 **한눈에 구분돼야** 한다 —
홈 화면에 둘 다 깔리는데 똑같이 생기면 어느 쪽이 게임인지 알 수 없다.
그래서 게임은 마름모 하나, 뷰어는 **부채꼴로 펼친 카드 세 장**으로 나눴다.
색은 희귀도 팔레트(회색·초록·파랑·주황) 중 파랑 계열을 테두리에 써서 금색 게임 아이콘과 대비시킨다.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "cards")

BG = (18, 13, 9, 255)
GOLD = (201, 162, 75, 255)
GOLD_HI = (242, 212, 136, 255)
PARCH = (236, 224, 196, 255)
BLUE = (59, 127, 212, 255)


def font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def rounded(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def draw_icon(size, maskable=False):
    """maskable=True 면 안전영역(가운데 80%) 안으로 그림을 몰아넣는다."""
    S = 4                                   # 4배로 그리고 줄여서 계단을 없앤다
    im = Image.new("RGBA", (size * S, size * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    W = size * S
    pad = W * 0.02 if maskable else W * 0.012
    rad = W * 0.22

    # 바탕 + 테두리
    rounded(d, (pad, pad, W - pad, W - pad), rad, fill=BG)
    if not maskable:
        rounded(d, (W * 0.035, W * 0.035, W * 0.965, W * 0.965),
                rad * 0.86, outline=GOLD, width=int(W * 0.022))

    # 부채꼴 카드 세 장 — 가운데가 앞, 좌우가 뒤로 기울어 겹친다
    inner = 0.80 if maskable else 1.0
    cw, ch = W * 0.30 * inner, W * 0.42 * inner
    cx, cy = W * 0.5, W * 0.455
    for ang, dx, dy, front in ((-24, -W * 0.145, W * 0.035, False),
                               (24, W * 0.145, W * 0.035, False),
                               (0, 0, -W * 0.015, True)):
        card = Image.new("RGBA", (int(cw), int(ch)), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        edge = GOLD_HI if front else BLUE
        cd.rounded_rectangle((0, 0, cw - 1, ch - 1), radius=cw * 0.11,
                             fill=PARCH, outline=edge, width=int(cw * 0.085))
        # 앞장에만 희귀도 보석(마름모)을 얹는다
        if front:
            g = cw * 0.30
            gx, gy = cw / 2, ch * 0.52
            cd.polygon([(gx, gy - g / 2), (gx + g / 2, gy), (gx, gy + g / 2), (gx - g / 2, gy)],
                       fill=GOLD, outline=BG)
        card = card.rotate(ang, resample=Image.BICUBIC, expand=True)
        im.alpha_composite(card, (int(cx + dx - card.width / 2), int(cy + dy - card.height / 2)))

    # 아래 글자
    if not maskable:
        f = font(int(W * 0.135))
        t = "CARDS"
        bb = d.textbbox((0, 0), t, font=f)
        d.text(((W - (bb[2] - bb[0])) / 2, W * 0.795), t, font=f, fill=PARCH)

    return im.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [("icon-192.png", 192, False), ("icon-512.png", 512, False),
            ("icon-maskable.png", 512, True), ("apple-touch-icon.png", 180, False)]
    for name, size, mask in jobs:
        draw_icon(size, mask).save(os.path.join(OUT, name))
    print("카드 뷰어 아이콘 4종 생성: " + ", ".join(n for n, _, _ in jobs))


if __name__ == "__main__":
    main()
