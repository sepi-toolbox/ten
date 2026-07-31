#!/usr/bin/env python3
"""
data/cards.json · decks.json · lands.csv 를 프로토타입에 주입한다. (멱등)

교체 대상 마커
  /* ELEM_START */ … /* ELEM_END */   EL(속성 팔레트) · CE(카드→속성) · TI(타입 아이콘)
  /* LAND_START */ … /* LAND_END */   LANDS · DECKS(속성별 덱리스트) · POOLDATA
  const POOL={ … };                   → POOL = POOLDATA 로 대체

  python3 tools/build_proto_data.py
"""
import csv
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
PROTO = os.path.join(ROOT, "prototype", "index.html")


def j(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def main():
    pool = json.load(open(os.path.join(DATA, "cards.json"), encoding="utf-8"))["pool"]
    decks = json.load(open(os.path.join(DATA, "decks.json"), encoding="utf-8"))
    with open(os.path.join(DATA, "lands.csv"), encoding="utf-8") as f:
        landrows = list(csv.DictReader(f))

    lands = {}
    for r in landrows:
        els = [e for e in (r.get("produces", ""), r.get("produces2", "")) if e]
        lands[r["name"]] = {"els": els, "dual": int(r.get("tapped") or 0)}

    ce = {name: c.get("el", "steel") for name, c in pool.items()}

    html = open(PROTO, encoding="utf-8").read()

    # ── ELEM 블록: CE만 교체 (EL·TI는 기존 것 유지) ─────────────
    html = re.sub(r"const CE=\{.*?\};", "const CE=" + j(ce) + ";", html, count=1, flags=re.S)

    # ── LAND 블록 전체 교체 ────────────────────────────────────
    dk = {el: {"name": d["name"], "core": d["core"], "flow": d["flow"],
               "list": [[n, c] for n, c in d["lands"]] + [[n, c] for n, c in d["cards"]]}
          for el, d in decks.items()}
    block = ("/* LAND_START */\n"
             "const LANDS=" + j(lands) + ";\n"
             "/* 속성별 단색 덱 7종 — 지형 17 + 카드 23 = 40장 (data/decks.json 생성) */\n"
             "const DECKS=" + j(dk) + ";\n"
             "let DECKEL='steel';\n"
             "let DECKLIST=DECKS[DECKEL].list;\n"
             "/* LAND_END */")
    html = re.sub(r"/\* LAND_START \*/.*?/\* LAND_END \*/", lambda m: block,
                  html, count=1, flags=re.S)

    # ── POOL 교체 ──────────────────────────────────────────────
    poolblock = "/* POOL_START */\nconst POOL=" + j(pool) + ";\n/* POOL_END */"
    if "/* POOL_START */" in html:
        html = re.sub(r"/\* POOL_START \*/.*?/\* POOL_END \*/", lambda m: poolblock,
                      html, count=1, flags=re.S)
    else:
        html = re.sub(r"const POOL=\{.*?\n\};", lambda m: poolblock, html, count=1, flags=re.S)

    open(PROTO, "w", encoding="utf-8").write(html)
    print(f"injected: POOL {len(pool)}종 · 덱 {len(dk)}개 · 지형 {len(lands)}종")


if __name__ == "__main__":
    main()
