#!/usr/bin/env python3
"""
data/의 CSV·rules.json을 읽어 뷰어를 생성한다:
  - tools/card_editor.html   (비주얼 카드 디자이너: 아트·프레임·이름·설명·스탯 + 실시간 예산 검산)
  - tools/card_gallery.html  (카드 갤러리: 프레임 + 벡터 아트)

두 뷰어는 동일한 아트 라이브러리(MOTIFS)를 공유한다 — 이 파일에서 한 번만 정의하고
빌드 시 __MOTIFS__ 자리에 주입한다. 데이터가 바뀌면 다시 돌려 최신값으로 굽는다.

  python3 tools/build_editor.py
"""
import base64
import csv
import io
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def embed_images(cards, width=480, quality=82):
    """카드의 image 경로(assets/art/*.png)를 표시용 data URI(JPEG)로 치환.
    파일이 없으면 빈 문자열 → 템플릿이 SVG 폴백. 자립형 HTML을 위해 임베드한다."""
    try:
        from PIL import Image
    except ImportError:
        return  # Pillow 없으면 경로만 유지(로컬 서빙 시 사용)
    cache = {}
    for c in cards:
        path = c.get("image") or ""
        if not path:
            continue
        full = os.path.join(ROOT, path)
        if not os.path.exists(full):
            c["image"] = ""
            continue
        if path not in cache:
            im = Image.open(full).convert("RGB")
            if im.width > width:
                im = im.resize((width, round(im.height * width / im.width)))
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=quality)
            cache[path] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
        c["image"] = cache[path]

# ---- 속성 팔레트 (프레임 색) ----
ELEMENTS = {
    "fire":   {"ko": "불",   "c": "#C1462E"},
    "water":  {"ko": "물",   "c": "#2A6FB5"},
    "nature": {"ko": "자연", "c": "#3F8B3A"},
    "steel":  {"ko": "강철", "c": "#6B7686"},
    "earth":  {"ko": "대지", "c": "#8A6A33"},
    "dark":   {"ko": "어둠", "c": "#5B3E86"},
    "light":  {"ko": "빛",   "c": "#C9A227"},
}

# ---- 카드 타입 아이콘 (이름 왼쪽. fill=currentColor) ----
TYPEICONS = {
    # 크리처 — 투구 쓴 병사
    "cr": '<path d="M50 8c-13 0-22 9-22 21v9c0 4 2 7 5 9l-3 8c-1 3 1 6 4 6h32c3 0 5-3 4-6l-3-8c3-2 5-5 5-9v-9c0-12-9-21-22-21zM39 30h22v6H39z"/>'
          '<path d="M26 62c-8 3-13 11-13 20v6c0 2 2 4 4 4h66c2 0 4-2 4-4v-6c0-9-5-17-13-20l-9-3-15 12-15-12z"/>',
    # 스펠 — 4방향 섬광
    "sp": '<path d="M50 4l9 28 28 9-28 9-9 28-9-28-28-9 28-9z"/><circle cx="20" cy="22" r="5"/><circle cx="80" cy="78" r="4"/>',
    # 인챈트 — 룬 크리스탈
    "en": '<path d="M50 6l26 22-10 44-16 22-16-22-10-44z"/>',
}

# ---- 공유 아트 라이브러리 (semantic key → inner SVG, stroke=currentColor) ----
MOTIFS = {
    "shield": '<path d="M50 14 L80 25 V50 C80 71 66 82 50 88 C34 82 20 71 20 50 V25 Z"/>',
    "wings": '<path d="M50 30 L50 78"/><path d="M50 40 C34 30 20 34 14 46 C30 46 42 44 50 52"/><path d="M50 40 C66 30 80 34 86 46 C70 46 58 44 50 52"/>',
    "wall": '<rect x="20" y="30" width="60" height="44" rx="2"/><path d="M20 52 H80 M50 30 V52 M35 52 V74 M65 52 V74"/>',
    "sword": '<path d="M50 16 L50 66"/><path d="M38 60 L62 60"/><path d="M44 84 L56 84 M50 66 V84"/>',
    "hawk": '<path d="M50 40 C30 20 14 30 18 40 C34 40 44 46 50 56 C56 46 66 40 82 40 C86 30 70 20 50 40Z"/><path d="M50 56 L50 74"/>',
    "spear": '<path d="M50 16 L50 84"/><path d="M50 16 L40 34 M50 16 L60 34"/><path d="M40 50 L60 50"/>',
    "griffin": '<path d="M30 44 C20 30 30 22 40 30"/><circle cx="40" cy="42" r="4" fill="currentColor" stroke="none"/><path d="M44 40 L58 36 L50 46"/><path d="M40 48 C40 68 60 74 74 60 C60 66 52 60 52 50"/><path d="M52 50 C66 40 80 46 84 56"/>',
    "helmet": '<path d="M32 44 C32 26 68 26 68 44 V60 C68 76 32 76 32 60 Z"/><path d="M50 30 V22 M44 52 H60 M40 44 L44 44"/>',
    "wyvern": '<path d="M24 40 C40 34 44 44 50 44 C56 44 60 34 76 40 C64 46 60 54 50 54 C40 54 36 46 24 40Z"/><path d="M50 54 C50 70 40 78 30 80 M50 54 C50 68 58 74 66 76"/>',
    "banner": '<path d="M30 20 V84"/><path d="M30 24 H74 L64 38 L74 52 H30"/>',
    "axe": '<path d="M50 18 L50 82"/><path d="M50 24 C28 24 24 46 40 50 C30 40 42 34 50 40"/><path d="M50 24 C72 24 76 46 60 50 C70 40 58 34 50 40"/>',
    "arrow": '<path d="M18 82 L82 18"/><path d="M82 18 L62 22 M82 18 L78 38"/><path d="M18 82 L28 72 M18 82 L32 78 M18 82 L22 68"/>',
    "thrust": '<path d="M16 84 L84 16"/><path d="M84 16 L66 20 L80 34"/><path d="M30 62 L38 70"/>',
    "exec": '<path d="M46 20 L46 84"/><path d="M46 26 C24 26 22 50 42 52 C30 42 40 34 46 40 C52 34 62 42 50 52 C70 50 68 26 46 26Z"/>',
    "firerain": '<path d="M28 26 L22 44 M50 22 L44 42 M72 26 L66 44"/><path d="M50 84 C40 84 34 76 40 66 C42 72 46 70 46 64 C54 68 60 76 50 84Z"/>',
    "burst": '<circle cx="50" cy="50" r="14"/><path d="M50 12 V26 M50 74 V88 M12 50 H26 M74 50 H88 M24 24 L34 34 M66 66 L76 76 M76 24 L66 34 M34 66 L24 76"/>',
    "flame": '<path d="M50 78 C36 78 28 66 38 52 C41 60 47 58 46 50 C58 54 66 66 62 74 C60 78 55 78 50 78Z"/><path d="M40 86 H60"/>',
    "flag": '<path d="M34 16 V86"/><path d="M34 20 H78 L68 34 L78 48 H34"/>',
    "awaken": '<path d="M50 84 V40"/><path d="M32 56 L50 38 L68 56"/><path d="M50 30 L50 16 M38 24 L34 18 M62 24 L66 18"/>',
    "star": '<path d="M50 16 L59 40 L84 40 L64 56 L72 82 L50 66 L28 82 L36 56 L16 40 L41 40 Z"/>',
}


def motifs_js():
    """__MOTIFS__ 자리에 넣을 JS 객체 리터럴 (S()는 템플릿에서 정의)."""
    lines = [f"  {k}: S('{v}')," for k, v in MOTIFS.items()]
    return "{\n" + "\n".join(lines) + "\n}"


def load_csv(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(row, *fields):
    for f in fields:
        try:
            row[f] = int(row[f])
        except (ValueError, KeyError, TypeError):
            row[f] = 0
    return row


def main():
    rules = json.load(open(os.path.join(DATA, "rules.json"), encoding="utf-8"))
    creatures = [num(r, "cost", "atk", "hp", "copies") for r in load_csv("creatures.csv")]
    spells = [num(r, "cost", "value", "copies") for r in load_csv("spells.csv")]
    enchants = [num(r, "cost", "effect_value", "charge", "copies") for r in load_csv("enchants.csv")]

    embed_images(creatures + spells + enchants)
    blob = {"rules": rules, "creatures": creatures, "spells": spells, "enchants": enchants}
    data_json = json.dumps(blob, ensure_ascii=False)
    mot = motifs_js()

    svg_open = '<svg viewBox="0 0 100 100" fill="currentColor">'
    icons = "{" + ",".join(
        "{k}: '{o}{v}</svg>'".format(k=k, o=svg_open, v=v) for k, v in TYPEICONS.items()
    ) + "}"
    els = json.dumps(ELEMENTS, ensure_ascii=False)

    for name in ("card_editor", "card_gallery"):
        tpl = os.path.join(HERE, f"{name}.template.html")
        if not os.path.exists(tpl):
            continue
        html = open(tpl, encoding="utf-8").read()
        html = (html.replace("__MOTIFS__", mot).replace("__TYPEICONS__", icons)
                    .replace("__ELEMENTS__", els).replace("__DATA__", data_json))
        with open(os.path.join(HERE, f"{name}.html"), "w", encoding="utf-8") as f:
            f.write(html)
        print(f"wrote tools/{name}.html")
    print(f"cards: crea={len(creatures)} spell={len(spells)} enchant={len(enchants)} | motifs={len(MOTIFS)}")


if __name__ == "__main__":
    main()
