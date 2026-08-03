#!/usr/bin/env python3
"""
로그라이크 모드 데이터를 만든다. → data/rogue.json

만드는 것
  1) **강화 카드** — 기존 140종을 예산 곡선 위로 끌어올린 변형판.
     정예 보상(+15%)과 적 덱의 난이도 조절에 쓴다. 밸런스를 일부러 깨는 카드이므로
     `validate_budget.py`의 검산 대상이 아니다(별도 파일로 분리한 이유).
  2) **이벤트** — 선택지형. 카드 제거에 비중을 둔다(덱 압축이 로그라이크의 핵심 자원).
  3) **상점·보상·지도 설정값**.

  python3 tools/gen_rogue.py
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

import gen_decks as G          # noqa: E402
import promote_decks as P      # noqa: E402

OVER = 1.15                    # 정예 보상 = 밸런스보다 15% 강하게
PREFIX = "강화 "


def scale_stats(tag, a, h, mult):
    """예산을 mult배로 올리고 ATK/HP 비율을 유지한 채 정수로 떨어뜨린다."""
    aw, hw, _ = G.W[tag]
    spent = aw * a + hw * h
    want = spent * mult
    best, bd = (a, h), 1e9
    for na in range(a, a + 8):
        for nh in range(h, h + 12):
            d = abs(aw * na + hw * nh - want)
            if d < bd or (d == bd and na + nh < best[0] + best[1]):
                bd, best = d, (na, nh)
    return best


def make_over(el, deck):
    """이 속성 카드들의 강화판. 이름 앞에 '강화 '를 붙인다."""
    out = {}
    for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
        na, nh = scale_stats(tag, a, h, OVER)
        if (na, nh) == (a, h):
            nh += 1
        e = {"c": c, "k": "cr", "cc": G.color_req(c), "a": na, "h": nh, "el": el,
             "kw": G.check_creature(c, tag, a, h, keys, nm)[3], "over": 1, "base": nm,
             "r": G.rar(nm)}
        en = P.TAG_EN[tag]
        if en in ("guard", "flyguard"):
            e["g"] = 1
        if en in ("fly", "flyguard"):
            e["f"] = 1
        if en == "pierce":
            e["p"] = 1
        out[PREFIX + nm] = e
    for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
        mode = P.MODE_EN[kind]
        if mode in ("kill", "bounce"):
            nc, nv = max(1, c - 1), val          # 값이 없는 효과는 코스트를 깎는다
        else:
            nc, nv = c, math.ceil(val * OVER)
        out[PREFIX + nm] = {"c": nc, "k": "sp", "cc": G.color_req(nc), "mode": mode,
                            "v": nv, "el": el, "d": rule, "over": 1, "base": nm,
                            "r": G.rar(nm)}
    for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
        e = {"c": c, "k": "en", "cc": G.color_req(c),
             "v": math.ceil(E * OVER), "ch": C, "el": el,
             "d": rule, "over": 1, "base": nm, "r": G.rar(nm)}
        # ⚠ 트리거·효과를 **반드시 물려받아야** 한다. 빠뜨리면 강화 인챈트가 전부
        #   기본값(얼굴 피해)으로 떨어져 인쇄된 규칙과 다르게 돈다.
        tg = G.ENCH_TRIG.get(nm)
        if tg:
            e["tg"], e["fx"] = tg
        out[PREFIX + nm] = e
    return out


# ── 이벤트 ────────────────────────────────────────────────────
# kind: remove(카드 제거) · gold · heal · maxhp · addcard · upgrade · none
# 카드 제거가 로그라이크에서 가장 값나가는 자원이라 비중을 높였다.
EVENTS = [
    {"id": "spring", "name": "정화의 샘", "art": "star",
     "text": "맑은 물이 고인 샘. 들여다보면 덱의 무게가 덜어질 것 같다.",
     "opts": [{"t": "카드 1장을 덱에서 제거한다", "do": [["remove", 1]]},
              {"t": "물만 마시고 간다 — HP 12 회복", "do": [["heal", 12]]}]},
    {"id": "forge", "name": "버려진 대장간", "art": "sword",
     "text": "불은 꺼졌지만 모루는 아직 뜨겁다.",
     "opts": [{"t": "쓸모없는 카드를 녹인다 — 1장 제거", "do": [["remove", 1]]},
              {"t": "고철을 팔아 치운다 — 45골드", "do": [["gold", 45]]}]},
    {"id": "peddler", "name": "떠돌이 상인", "art": "flag",
     "text": "\"짐이 무거우면 멀리 못 가지. 두 장쯤 덜어 줄까?\"",
     "opts": [{"t": "40골드를 내고 카드 2장 제거", "cost": 40, "do": [["remove", 2]]},
              {"t": "80골드에 카드 1장을 산다", "cost": 80, "do": [["addcard", 1]]},
              {"t": "그냥 지나간다", "do": []}]},
    {"id": "altar", "name": "피의 제단", "art": "exec",
     "text": "제단은 피를 원한다. 대가는 확실히 치른다.",
     "opts": [{"t": "HP 10을 바친다 — 카드 1장 제거", "hp": 10, "do": [["remove", 1]]},
              {"t": "HP 10을 바친다 — 최대 HP +6", "hp": 10, "do": [["maxhp", 6]]},
              {"t": "돌아선다", "do": []}]},
    {"id": "relic", "name": "수상한 유물", "art": "burst",
     "text": "손을 대면 무언가 일어난다. 좋은 쪽일지는 모르겠다.",
     "opts": [{"t": "만져 본다 — 70골드", "do": [["gold", 70]]},
              {"t": "부숴 버린다 — 최대 HP +8", "do": [["maxhp", 8]]}]},
    {"id": "library", "name": "고대 서고", "art": "awaken",
     "text": "먼지 쌓인 서가. 쓸 만한 장이 몇 남았다.",
     "opts": [{"t": "한 권 챙긴다 — 카드 3장 중 1장", "do": [["addcard", 1]]},
              {"t": "필요 없는 장을 태운다 — 카드 1장 제거", "do": [["remove", 1]]}]},
    {"id": "camp", "name": "야영지", "art": "flame",
     "text": "모닥불 앞. 쉬거나, 장비를 손볼 수 있다.",
     "opts": [{"t": "쉰다 — HP 30 회복", "do": [["heal", 30]]},
              {"t": "짐을 정리한다 — 카드 1장 제거", "do": [["remove", 1]]},
              {"t": "무기를 벼린다 — 덱의 카드 1장을 강화", "do": [["upgrade", 1]]}]},
    {"id": "trainer", "name": "노병의 수련장", "art": "banner",
     "text": "\"쓸 줄 아는 놈 하나가 어설픈 셋보다 낫다.\"",
     "opts": [{"t": "한 장을 벼린다 — 카드 1장 강화", "do": [["upgrade", 1]]},
              {"t": "둘을 버리고 하나를 벼린다 — 2장 제거 후 1장 강화",
               "do": [["remove", 2], ["upgrade", 1]]}]},
    {"id": "ruin", "name": "무너진 성소", "art": "wall",
     "text": "돌더미 사이로 쓸 만한 것이 보인다. 들어가면 다칠 것 같다.",
     "opts": [{"t": "파고든다 — HP 12 잃고 카드 2장 제거", "hp": 12, "do": [["remove", 2]]},
              {"t": "겉만 훑는다 — 30골드", "do": [["gold", 30]]}]},
    {"id": "gambler", "name": "노름꾼", "art": "flag",
     "text": "\"패를 줄일수록 손이 가벼워진다는 거, 알지?\"",
     "opts": [{"t": "60골드를 건다 — 카드 3장 제거", "cost": 60, "do": [["remove", 3]]},
              {"t": "판을 뜬다", "do": []}]},
]

CONFIG = {
    "floors": 11,                 # 마지막 층이 보스
    "width": 4,                   # 층당 최대 노드 수
    "startHp": 60,
    "startGold": 60,
    "rewardChoices": 3,
    "gold": {"normal": [22, 36], "elite": [50, 75]},
    "eliteOverChance": 0.6,       # 정예 보상 3장 중 강화 카드가 섞일 확률
    # 보상·상점에 카드가 뜰 상대 가중치. 합이 100일 필요는 없다(비율만 본다).
    # 정예·보스를 잡으면 상위 희귀도 쪽으로 기운다 — 레전더리를 보는 게 '사건'이 되게.
    "rarityWeights": {
        "normal": {"common": 60, "uncommon": 26, "rare": 11, "legendary": 3},
        "elite":  {"common": 34, "uncommon": 30, "rare": 25, "legendary": 11},
        "shop":   {"common": 48, "uncommon": 28, "rare": 18, "legendary": 6},
    },
    "enemyOver": {                # 층수 → 적 덱에 섞이는 강화 카드 수
        "normalBase": 0, "normalPerFloor": 0.55,
        "eliteBonus": 4, "bossBonus": 7},
    "shop": {"cards": 5, "removeBase": 60, "removeStep": 35,
             "priceBase": 26, "pricePerCost": 12, "overMult": 1.9},
    "nodeWeights": {"normal": 54, "elite": 15, "event": 19, "shop": 12},
}


def main():
    over = {}
    for el, deck in G.DECKS.items():
        over.update(make_over(el, deck))
    out = {"over": over, "events": EVENTS, "config": CONFIG, "overPct": round((OVER - 1) * 100)}
    path = os.path.join(DATA, "rogue.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"강화 카드 {len(over)}종 · 이벤트 {len(EVENTS)}개 → {path} "
          f"({os.path.getsize(path)/1024:.0f} KB)")
    # 표본 출력
    for nm in list(over)[:3]:
        c = over[nm]
        base = G.DECKS[c["el"]]
        print(f"  {nm:<16} {c['c']}코 " +
              (f"{c['a']}/{c['h']}" if c["k"] == "cr" else f"v={c.get('v')}"))


if __name__ == "__main__":
    main()
