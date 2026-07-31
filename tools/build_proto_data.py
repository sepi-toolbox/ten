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


# 태그·키워드 용어집 — 카드 본문에는 이름만 찍고, 설명은 확대 화면 옆 패널에 붙인다.
# 키는 카드 본문에 찍히는 이름의 첫 낱말(예: "연소 3" → "연소").
GLOSSARY = {
    # 태그 (스탯 가중치가 달라지는 배타적 속성)
    "수호":   ["태그", "이 개체가 살아 있는 동안 우리 편이 받는 공격을 대신 받는다. 왼쪽 수호부터 순서대로."],
    "비행":   ["태그", "비행이 없는 수호는 이 개체를 막지 못한다. 공격도 지상 수호를 무시한다."],
    "비행·수호": ["태그", "공중과 지상 공격을 모두 막는다. 비행 공격도 이 개체가 대신 받는다."],
    "관통":   ["태그", "상대 수호를 완전히 무시하고 플레이어를 직접 때린다. 대신 체력 가중치가 낮다."],
    # 불
    "연소":   ["불", "적힌 턴 수가 지나면 스스로 소멸한다. 수명을 파는 대신 스탯을 1.5배 받는다."],
    "폭산":   ["불", "이 개체가 소멸할 때 적 전체에 적힌 만큼 피해를 준다. 연소와 함께 쓰면 알아서 터진다."],
    # 물
    "환류":   ["물", "소멸할 때 무덤이 아니라 손으로 돌아온다. 소환 시 효과를 다시 쓸 수 있다."],
    "밀물":   ["물", "소환할 때 적힌 코스트 이하의 상대 크리처 1개체를 손으로 되돌린다."],
    # 자연
    "증식":   ["자연", "내 턴이 끝날 때 같은 슬롯에 자신을 하나 더 만든다. 스탯은 절반만 받는다."],
    "성장":   ["자연", "내 턴이 끝날 때마다 적힌 만큼 커진다. 괄호 안 횟수까지만 자란다."],
    # 강철
    "경화":   ["강철", "받는 피해를 적힌 만큼 줄인다. 상대의 저코스트 요격을 헛돌게 만든다."],
    "연마":   ["강철", "내 턴이 끝날 때 +1/+2 커진다. 3회까지. 한 개체를 위협으로 키우는 수단."],
    # 대지
    "진형":   ["대지", "슬롯 1~3번에 있을 때만 체력을 적힌 만큼 더 받는다. 앞자리를 지키는 값."],
    # 어둠
    "대가":   ["어둠", "소환할 때 내 HP를 적힌 만큼 지불한다. HP 8 = 마나 1로 환산해 그만큼 강하다."],
    "흡혈":   ["어둠", "이 개체가 공격할 때마다 내 HP를 적힌 만큼 회복한다."],
    # 빛
    "가호":   ["빛", "처음 파괴될 때 그 파괴를 무효로 하고 살아남는다. 제거 한 장을 헛돌게 한다."],
    "축복":   ["빛", "소환할 때 내 HP를 적힌 만큼 회복한다."],
    # 기타
    "토큰":   ["기타", "스펠이 만들어 낸 개체. 손으로 돌아가지 않고, 덱에도 들어가지 않는다."],
}


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
    fpath = os.path.join(DATA, "frames.json")
    frames = json.load(open(fpath, encoding="utf-8")) if os.path.exists(fpath) else {}
    opath = os.path.join(DATA, "orbs.json")
    orbs = json.load(open(opath, encoding="utf-8")) if os.path.exists(opath) else {}
    poolblock = ("/* POOL_START */\nconst POOL=" + j(pool)
                 + ";\nconst GLOSSARY=" + j(GLOSSARY)
                 + ";\nconst FRAMES=" + j(frames)
                 + ";\nconst ORBS=" + j(orbs) + ";\n/* POOL_END */")
    if "/* POOL_START */" in html:
        html = re.sub(r"/\* POOL_START \*/.*?/\* POOL_END \*/", lambda m: poolblock,
                      html, count=1, flags=re.S)
    else:
        html = re.sub(r"const POOL=\{.*?\n\};", lambda m: poolblock, html, count=1, flags=re.S)

    open(PROTO, "w", encoding="utf-8").write(html)
    print(f"injected: POOL {len(pool)}종 · 덱 {len(dk)}개 · 지형 {len(lands)}종 · 프레임 {len(frames)}장 · 오브 {len(orbs)}종")


if __name__ == "__main__":
    main()
