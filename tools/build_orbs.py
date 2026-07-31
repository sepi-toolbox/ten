#!/usr/bin/env python3
"""
자원 동그라미 시트(마젠타 배경)를 잘라 투명 PNG 8종으로 만든다.

DALL·E는 투명 배경을 못 만들기 때문에 순수 마젠타(#FF00FF)로 받아서 여기서 키잉한다.
가장자리에 남는 마젠타 물듦(스필)도 같이 뺀다.

  python3 tools/build_orbs.py <시트.png>

출력: assets/orbs/<키>.png + data/orbs.json (data URI)
순서: 불 · 물 · 자연 · 강철 · 대지 · 어둠 · 빛 · 무색
"""
import base64
import io
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUTDIR = os.path.join(ROOT, "assets", "orbs")
OUTJSON = os.path.join(ROOT, "data", "orbs.json")
KEYS = ["fire", "water", "nature", "steel", "earth", "dark", "light", "generic"]
SIZE = 72          # 확대 카드에서 코스트 동그라미가 ~19px이라 72면 충분


def chroma_key(im, near=95.0, far=165.0):
    """마젠타(#FF00FF) 배경만 투명하게.

    R·B가 높고 G가 낮다는 식으로 판정하면 **빨강·보라 오브까지 배경으로 먹는다**
    (실제로 불·어둠 오브가 까맣게 뭉갰다). 그래서 순수 마젠타와의 RGB 거리로 본다.
      거리 < near  → 배경(투명) · 거리 > far → 완전 불투명 · 사이는 부드럽게.
    """
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dist = np.sqrt((255 - r) ** 2 + g ** 2 + (255 - b) ** 2)
    alpha = np.clip((dist - near) / (far - near), 0, 1) * 255

    # 스필 제거는 경계 부근에서만 — 초록을 기준으로 R·B의 과잉만 깎는다
    edge = 1 - np.clip((dist - near) / (far - near), 0, 1)
    edge = (edge * (alpha > 8))[..., None]
    lim = np.stack([np.minimum(r, g + 55), g, np.minimum(b, g + 55)], axis=-1)
    rgb = np.clip(a * (1 - edge) + lim * edge, 0, 255).astype(np.uint8)

    return Image.fromarray(np.dstack([rgb, alpha.astype(np.uint8)]), "RGBA")


def cell_box(alpha, x0, y0, x1, y1):
    """셀 안에서 알파가 있는 영역의 바운딩 박스."""
    sub = alpha[y0:y1, x0:x1]
    ys = np.where(sub.max(axis=1) > 40)[0]
    xs = np.where(sub.max(axis=0) > 40)[0]
    if not len(ys) or not len(xs):
        return None
    return (x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1)


def main():
    if len(sys.argv) < 2:
        print("사용법: build_orbs.py <시트.png>")
        sys.exit(1)
    im = Image.open(sys.argv[1])
    keyed = chroma_key(im)
    W, H = keyed.size
    alpha = np.asarray(keyed)[..., 3]
    cols, rows = 4, 2                     # 시트 배치 (4열 × 2행)
    if "--cols" in sys.argv:
        cols = int(sys.argv[sys.argv.index("--cols") + 1])
    if "--rows" in sys.argv:
        rows = int(sys.argv[sys.argv.index("--rows") + 1])
    ordered = []
    for r in range(rows):
        for c in range(cols):
            box = cell_box(alpha, round(W * c / cols), round(H * r / rows),
                           round(W * (c + 1) / cols), round(H * (r + 1) / rows))
            if box:
                ordered.append(box)
    print(f"시트 {im.size} · {cols}×{rows} 격자에서 {len(ordered)}개 검출")
    if len(ordered) != len(KEYS):
        print(f"⚠ {len(KEYS)}개가 아닙니다 — --cols/--rows 를 확인하세요.")

    os.makedirs(OUTDIR, exist_ok=True)
    data = {}
    for i, (x0, y0, x1, y1) in enumerate(ordered[:8]):
        key = KEYS[i] if i < len(KEYS) else f"orb{i}"
        pad = round((x1 - x0) * 0.04)
        crop = keyed.crop((max(0, x0 - pad), max(0, y0 - pad),
                           min(W, x1 + pad), min(H, y1 + pad)))
        side = max(crop.size)
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
        sq = sq.resize((SIZE, SIZE), Image.LANCZOS)
        sq.save(os.path.join(OUTDIR, f"{key}.png"))
        buf = io.BytesIO()
        sq.save(buf, "PNG", optimize=True)
        data[key] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
        print(f"  {key:<8} 원본 {x1-x0}×{y1-y0} → {SIZE}px")

    with open(OUTJSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"\n{len(data)}종 → {OUTDIR} · {OUTJSON} ({os.path.getsize(OUTJSON)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
