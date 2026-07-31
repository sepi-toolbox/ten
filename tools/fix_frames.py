#!/usr/bin/env python3
"""
생성기가 뱉은 프레임 시트를 실제 카드 규격(5:7)으로 바로잡는다.

DALL·E는 캔버스 비율을 골라 쓸 수 없어서 격자에 카드를 욱여넣으며 눌러 버린다.
이 스크립트는 눌린 프레임을 살린다. 카드 전체를 세로로 늘리면 장식이 같이
길어지므로, **일러스트 창(가장 어두운 가로 띠)만 늘려서** 전체를 5:7로 맞춘다.
테두리·이름판·능력치 띠의 장식 비율은 그대로 유지된다.

  python3 tools/fix_frames.py <시트.png> --cols 7 --rows 4 --out assets/frames
  python3 tools/fix_frames.py <시트.png> --cols 2 --rows 2 --el fire

출력: assets/frames/frame-<속성>-<타입>.png  (--cols/--rows 순서대로 이름 붙임)
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

ELS = ["fire", "water", "nature", "steel", "earth", "dark", "light"]
TYPES = ["cr", "sp", "en", "ld"]
TARGET = 5 / 7          # 카드 가로/세로


def split_grid(im, cols, rows):
    """검은 거터를 찾아 격자를 자른다. 못 찾으면 균등 분할로 떨어진다."""
    a = np.asarray(im.convert("L")).astype(float)
    H, W = a.shape

    def cuts(profile, n):
        dark = profile < 18
        runs, st = [], None
        for i, d in enumerate(dark):
            if d and st is None:
                st = i
            elif not d and st is not None:
                runs.append((st, i))
                st = None
        if st is not None:
            runs.append((st, len(dark)))
        runs = [r for r in runs if r[1] - r[0] >= 2]
        inner = [r for r in runs if r[0] > len(dark) * .02 and r[1] < len(dark) * .98]
        inner.sort(key=lambda r: r[1] - r[0], reverse=True)
        inner = sorted(inner[:n - 1])
        if len(inner) != n - 1:
            return None
        return [(r[0] + r[1]) // 2 for r in inner]

    xc = cuts(a.mean(axis=0), cols)
    yc = cuts(a.mean(axis=1), rows)
    xs = [0] + (xc or [round(W * i / cols) for i in range(1, cols)]) + [W]
    ys = [0] + (yc or [round(H * i / rows) for i in range(1, rows)]) + [H]
    print(f"  격자: {'거터 탐지' if xc else '균등분할'}(가로) · "
          f"{'거터 탐지' if yc else '균등분할'}(세로)")
    return xs, ys


def trim_black(im, thr=18):
    """카드 주변 검은 여백을 잘라낸다."""
    a = np.asarray(im.convert("L")).astype(float)
    rows = np.where(a.mean(axis=1) > thr)[0]
    colsx = np.where(a.mean(axis=0) > thr)[0]
    if not len(rows) or not len(colsx):
        return im
    return im.crop((colsx[0], rows[0], colsx[-1] + 1, rows[-1] + 1))


def art_band(im):
    """가장 크고 어두운 가로 띠 = 일러스트 창. (시작행, 끝행) 반환."""
    a = np.asarray(im.convert("L")).astype(float)
    H = a.shape[0]
    m, s = a.mean(axis=1), a.std(axis=1)
    flat_dark = (m < 85) & (s < 42)
    best, st = None, None
    for i, d in enumerate(list(flat_dark) + [False]):
        if d and st is None:
            st = i
        elif not d and st is not None:
            if best is None or i - st > best[1] - best[0]:
                best = (st, i)
            st = None
    if best is None or best[1] - best[0] < H * 0.08:
        return None
    return best


def to_ratio(im):
    """일러스트 창만 늘려 카드를 5:7로 만든다."""
    W, H = im.size
    want_h = round(W / TARGET)
    if want_h <= H:
        return im.resize((W, want_h), Image.LANCZOS), "축소(균등)"
    band = art_band(im)
    if band is None:
        return im.resize((W, want_h), Image.LANCZOS), "균등 확대(창 못 찾음)"
    t, b = band
    grow = want_h - H
    out = Image.new("RGB", (W, want_h))
    out.paste(im.crop((0, 0, W, t)), (0, 0))
    out.paste(im.crop((0, t, W, b)).resize((W, (b - t) + grow), Image.LANCZOS), (0, t))
    out.paste(im.crop((0, b, W, H)), (0, b + grow))
    return out, f"창만 +{grow}px 확대 (장식 비율 보존)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--cols", type=int, default=7)
    ap.add_argument("--rows", type=int, default=4)
    ap.add_argument("--el", help="속성 하나짜리 시트일 때 그 속성 이름")
    ap.add_argument("--out", default=os.path.join(ROOT, "assets", "frames"))
    a = ap.parse_args()

    im = Image.open(a.sheet).convert("RGB")
    print(f"시트 {im.size} → {a.cols}×{a.rows} = {a.cols*a.rows}칸")
    xs, ys = split_grid(im, a.cols, a.rows)
    os.makedirs(a.out, exist_ok=True)

    n = 0
    for r in range(a.rows):
        for c in range(a.cols):
            cell = trim_black(im.crop((xs[c], ys[r], xs[c + 1], ys[r + 1])))
            before = cell.width / cell.height
            fixed, how = to_ratio(cell)
            if a.el:                      # 속성 1개 × 4타입 (2×2)
                el, k = a.el, TYPES[r * a.cols + c]
            else:                         # 7속성 × 4타입
                el, k = ELS[c], TYPES[r]
            path = os.path.join(a.out, f"frame-{el}-{k}.png")
            fixed.save(path)
            n += 1
            print(f"  {el:<7}{k}  {cell.size} 비율 {before:.3f} → "
                  f"{fixed.size} 비율 {fixed.width/fixed.height:.3f}  · {how}")
    print(f"\n{n}장 저장 → {a.out}")
    print("목표 비율 0.714 (5:7)")


if __name__ == "__main__":
    main()
