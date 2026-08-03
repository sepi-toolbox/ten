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

USE_FRAMES = False        # True로 바꾸면 assets/frames 의 생성 프레임을 쓴다


def j(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


# 태그·키워드 용어집 — 카드 본문에는 이름만 찍고, 설명은 확대 화면 옆 패널에 붙인다.
# 키는 카드 본문에 찍히는 이름의 첫 낱말(예: "연소 3" → "연소").
GLOSSARY = {
    # ── 배타 태그(스탯 가중치가 달라진다. 셋 중 하나만) ──
    "수호":   ["태그", "이 개체가 살아 있는 동안 우리 편이 받는 공격을 대신 받는다. 왼쪽 수호부터 순서대로."],
    "비행":   ["태그", "비행이 없는 수호는 이 개체를 막지 못한다. 공격도 지상 수호를 무시한다."],
    "비행·수호": ["태그", "공중과 지상 공격을 모두 막는다. 비행 공격도 이 개체가 대신 받는다."],
    "관통":   ["태그", "상대 수호를 완전히 무시하고 플레이어를 직접 때린다. 대신 체력 가중치가 낮다."],
    # ── 불 ──
    "연소":   ["불", "내 턴이 끝날 때마다 자기 자신이 적힌 만큼 피해를 받는다. 스스로 타들어 가는 대신 스탯이 크다."],
    "폭발":   ["불", "이 개체가 소멸할 때 상대 플레이어에게 자기 ATK 만큼 피해를 준다. 보드 상황과 상관없이 반드시 들어간다."],
    "속공":   ["불", "소환할 때 내 크리처 1개체를 골라 즉시 한 번 공격시킨다. 그 개체는 이번 턴 정규 공격에서는 빠진다."],
    # ── 물 ──
    "환류":   ["물", "소멸할 때 무덤이 아니라 손으로 돌아온다. 단 한 번뿐이고, 돌아오면 이 능력은 사라진다."],
    "밀물":   ["물", "소환할 때 이 카드의 코스트 이하인 상대 크리처 1개체를 골라 손으로 되돌린다. 고를 수 있는 대상이 있으면 반드시 골라야 한다."],
    # ── 자연 ──
    "증식":   ["자연", "내 턴이 끝날 때 왼쪽 빈 슬롯에 자신을 하나 더 만든다. 단 한 번뿐이고, 복제하면 이 능력은 사라진다. 빈 슬롯이 없으면 다음 턴으로 미뤄진다."],
    "성장":   ["자연", "적힌 턴 수가 지나면 '성장한' 상위 몸으로 교체된다. 남은 턴은 카드 왼쪽 위에 표시된다."],
    # ── 강철 ──
    "경화":   ["강철", "받는 피해를 적힌 만큼 줄인다. 상대의 저코스트 요격을 헛돌게 만든다."],
    "연마":   ["강철", "내 턴이 끝날 때마다 ATK 이 1 오른다. 상한이 없다 — 오래 살수록 손댈 수 없어진다."],
    # ── 대지 ──
    "진형":   ["대지", "내 크리처가 이 개체 하나뿐이 되면 '각성한' 상위 몸으로 교체된다. 판이 비었을 때 켜지는 역전 장치."],
    "육중":   ["대지", "소환한 턴에는 공격하지 않는다. 한 턴을 파는 대신 같은 코스트보다 몸이 크다."],
    # ── 어둠 ──
    "대가":   ["어둠", "소환할 때 내 HP를 적힌 만큼 지불한다. HP 8 = 마나 1로 환산해 그만큼 강하다."],
    "흡혈":   ["어둠", "이 개체가 공격해 입힌 피해의 **절반**만큼 내 HP를 회복한다(반올림). 막히면 회복도 없다."],
    # ── 빛 ──
    "가호":   ["빛", "처음 받는 피해를 통째로 무효로 한다. 단 한 번뿐이고, 유지되는 동안 노랗게 빛난다."],
    "축복":   ["빛", "소환할 때 내 HP를 적힌 만큼 회복한다."],
    # ── 기타 ──
    "연합":   ["물", "이 크리처가 공격하면 **같은 이름의 아군이 모두 한 번씩 따라 공격**한다. "
              "따라 친 공격은 다시 연합을 부르지 않는다. 혼자 서 있으면 아무 일도 없다."],
    "면역":   ["기타", "HP가 **아예 줄지 않는다**. 가호(첫 피해 1회)와 달리 끝이 없다. "
              "수호와 양립하지 않는다 — 면역을 얻으면 수호가 풀린다."],
    "소멸":   ["기타", "스펠이 만들어 낸 임시 지형. 다음 내 턴에 한 번 쓰고 사라진다."],
    "개전":   ["기타", "덱에 있기만 하면 **게임이 시작될 때** 스스로 발동한다(첫 패를 뽑기 전). "
              "크리처·인챈트는 판에 놓이고, 스펠은 즉시 발동한다 — 대상은 무작위다. 손에 잡히지 않는다."],
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
        e = {"els": els, "dual": int(r.get("tapped") or 0)}
        # rich = 한 장이 자원을 **둘** 낸다. 마나 계산이 '지형 수' 가 아니라 'n 의 합' 이 된다.
        if r.get("kind") == "rich":
            e["n"] = 2
            e["r"] = "legendary"
            e["max"] = 1                      # 덱에 1장만
            e["note"] = r.get("note", "")
        # extra = **턴당 지형 1장 제한을 안 먹는다.** 대신 놓을 때 자원 2를 낸다.
        if r.get("kind") == "extra":
            e["extra"] = 1
            e["pay"] = 2
            e["r"] = "rare"
            e["note"] = r.get("note", "")
        # temp = 소멸 지형. 스펠이 만들어 내고, 내 턴 시작마다 수명이 하나씩 준다.
        if r.get("kind") == "temp":
            e["temp"] = 2
            e["note"] = r.get("note", "")
        # 효과가 있는 특수 지형은 전부 레어다
        if r.get("kind") == "special":
            e["r"] = "rare"
        # 특수 지형 — 자원을 만들지 않고 다른 일을 한다. `sp` 가 그 종류다.
        # ⚠ els 가 비면 카드 색·자원 pip 이 없어지므로 `home`(테마 속성)을 따로 실어 준다.
        if r.get("kind") == "special":
            e["sp"] = r["name"]
            e["home"] = r.get("element") or "fire"
            e["note"] = r.get("note", "")
        # 모든 지형에 속성을 싣는다 — 원정 보상이 '이 속성의 지형' 을 골라야 하기 때문이다.
        # ⚠ 특수 지형은 els 가 비어서 자원 색으로는 속성을 알 수 없다. 그래서 csv 의 element 가 정본.
        e["el"] = r.get("element") or (els[0] if els else "fire")
        lands[r["name"]] = e

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
    # 생성 프레임 사용 여부. False면 카드는 기존 CSS 벡터 카드로 그려진다.
    # (2026-07: 생성 프레임이 이름판을 뱃지로 덮고 효과문 판이 얕아 글자가 겹쳐 되돌림)
    frames = {}
    if USE_FRAMES:
        fpath = os.path.join(DATA, "frames.json")
        frames = json.load(open(fpath, encoding="utf-8")) if os.path.exists(fpath) else {}
    opath = os.path.join(DATA, "orbs.json")
    orbs = json.load(open(opath, encoding="utf-8")) if os.path.exists(opath) else {}
    rpath = os.path.join(DATA, "rogue.json")
    rogue = json.load(open(rpath, encoding="utf-8")) if os.path.exists(rpath) else {}
    epath = os.path.join(DATA, "enemies.json")
    enemies = json.load(open(epath, encoding="utf-8")) if os.path.exists(epath) else {}
    # 성장·진형이 갈아입는 상위 몸(tools/gen_grown.py). 덱에는 안 들어가고 필드에서만 나온다.
    gpath = os.path.join(DATA, "grown.json")
    grown = json.load(open(gpath, encoding="utf-8")) if os.path.exists(gpath) else {}
    poolblock = ("/* POOL_START */\nconst POOL=" + j(pool)
                 + ";\nconst GLOSSARY=" + j(GLOSSARY)
                 + ";\nconst FRAMES=" + j(frames)
                 + ";\nconst ORBS=" + j(orbs)
                 + ";\nconst ROGUE=" + j(rogue)
                 + ";\nconst GROWN=" + j(grown)
                 + ";\nconst ENEMY=" + j(enemies) + ";\n/* POOL_END */")
    if "/* POOL_START */" in html:
        html = re.sub(r"/\* POOL_START \*/.*?/\* POOL_END \*/", lambda m: poolblock,
                      html, count=1, flags=re.S)
    else:
        html = re.sub(r"const POOL=\{.*?\n\};", lambda m: poolblock, html, count=1, flags=re.S)

    open(PROTO, "w", encoding="utf-8").write(html)
    n_over = len(rogue.get("over", {}))
    n_foe = len(enemies.get("list", []))
    print(f"injected: POOL {len(pool)}종 · 덱 {len(dk)}개 · 지형 {len(lands)}종 · 프레임 {len(frames)}장 "
          f"· 오브 {len(orbs)}종 · 강화 {n_over}종 · 적 {n_foe}명")


if __name__ == "__main__":
    main()
