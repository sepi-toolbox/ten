#!/usr/bin/env python3
"""
견본 덱 140종을 실제 카드 데이터로 승격한다.

gen_decks.py의 DECKS(설계 정본)를 읽어 엔진/에디터가 쓰는 데이터 테이블을 만든다.

출력:
  data/creatures.csv  data/spells.csv  data/enchants.csv
  data/cards.json     프로토타입 POOL
  data/decks.json     속성별 40장 덱리스트 (지형 17 + 카드 23)

  python3 tools/promote_decks.py
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

import gen_decks as G  # noqa: E402

TAG_EN = {"일반": "normal", "수호": "guard", "비행": "fly",
          "비행수호": "flyguard", "관통": "pierce"}

# 스펠 분류 → 엔진 모드
MODE_EN = {"단일": "dmg", "광역": "aoe", "직접": "direct", "요격": "kill",
           "바운스": "bounce", "드로우": "draw", "회복": "heal",
           "강화": "buff", "소환": "summon", "파쇄": "shatter", "부여": "grant"}
DRAIN_EN = {"지속형": "persistent", "발동형": "triggered", "사용형": "active"}

# 속성별 기본 지형 (단색 덱은 기본 지형 17장)
BASIC_LAND = {"fire": "화산", "water": "심해", "nature": "수림", "steel": "대장간",
              "earth": "고원", "dark": "심연", "light": "성소"}
LAND_COUNT = 17

# 아트 모티프 — 이름 우선, 없으면 태그/분류로 폴백
ART_BY_NAME = {
    "불씨정령": "flame", "잿불새": "hawk", "작열병": "burst", "화염정령": "flame",
    "불꽃광대": "burst", "화염조": "wyvern", "재의 수호자": "shield", "용암거인": "helmet",
    "불사조": "wings", "화신": "flame", "겁화룡": "wyvern",
    "여울정령": "star", "파도술사": "star", "산호방벽": "wall", "조수술사": "star",
    "해무령": "wings", "해류지기": "hawk", "심해수호": "shield", "심연룡": "wyvern",
    "만조의 수호자": "shield", "소용돌이 정령": "burst", "해신": "awaken",
    "가시넝쿨": "arrow", "묘목": "star", "번식체": "star", "숲지기": "shield",
    "그리핀": "griffin", "고목": "wall", "포자군체": "burst", "대수호자": "shield",
    "덩굴군주": "spear", "숲의 여왕": "banner", "세계수": "awaken",
    "파수병": "shield", "방벽병": "wall", "검사": "sword", "연마병": "sword",
    "강철수호": "shield", "중장병": "helmet", "기사": "helmet", "파쇄병": "axe",
    "요새병": "wall", "단조장인": "sword", "철벽": "wall",
    "돌덩이": "wall", "가시병": "spear", "채석공": "axe", "석벽": "wall",
    "창병": "spear", "성문지기": "shield", "돌파병": "spear", "장군": "banner",
    "공성탑": "wall", "지진술사": "burst", "공성귀": "axe",
    "망령": "wings", "피의광신도": "axe", "흡혈박쥐": "wings", "흑기사": "helmet",
    "흡혈귀": "exec", "그림자 습격자": "wings", "시체 수확자": "axe",
    "피의 군주": "banner", "어둠의 수호": "shield", "심연의 사제": "awaken", "파괴자": "axe",
    "빛의 시종": "star", "성전사": "shield", "사제": "star", "치유사": "star",
    "빛의 매": "hawk", "수호천사": "wings", "성직기사": "helmet", "천공수호": "wings",
    "성기사": "wings", "심판자": "sword", "대천사": "awaken",
}
ART_FALLBACK_CR = {"수호": "shield", "비행": "wings", "비행수호": "wings",
                   "관통": "spear", "일반": "sword"}
ART_FALLBACK_SP = {"단일": "thrust", "광역": "firerain", "요격": "exec", "바운스": "star",
                   "드로우": "awaken", "회복": "star", "강화": "banner",
                   "소환": "flag", "파쇄": "axe", "부여": "flag"}


# 생성 아트(assets/art/*.png) 재배정 — 파일 20장을 주제가 맞는 카드에 붙인다.
# (옛 20종 중 이름이 살아남은 카드는 원래 그림을 그대로 쓴다)
ART_IMAGE = {
    "CR01": ["파수병", "돌덩이", "성전사"],          # 방패 수호
    "CR02": ["흡혈박쥐", "빛의 매", "여울정령"],       # 작은 날개
    "CR03": ["방벽병", "산호방벽", "묘목"],           # 방벽
    "CR04": ["검사", "연마병", "심판자"],             # 검
    "CR05": ["잿불새", "해무령", "가시넝쿨"],          # 매
    "CR06": ["석벽", "요새병", "철벽", "고목"],        # 돌벽
    "CR07": ["창병", "가시병", "돌파병", "덩굴군주"],   # 창
    "CR08": ["그리핀", "화염조", "해류지기"],          # 그리핀
    "CR09": ["기사", "중장병", "흑기사", "성직기사"],   # 투구
    "CR10": ["겁화룡", "심연룡", "용암거인"],          # 와이번
    "CR11": ["장군", "숲의 여왕", "피의 군주", "공성탑"],  # 군기
    "CR12": ["파괴자", "시체 수확자", "공성귀", "파쇄병"],  # 도끼
    "SP01": ["가시", "자갈", "불똥", "쐐기", "정화의 빛"],   # 화살 — 1코 저코 요격
    "SP02": ["관통 사격", "가시덩쿨", "피의 계약", "주조"],   # 창격 — 2코 시그니처
    "SP03": ["잠식", "매몰", "분쇄추", "포식", "심판", "소이탄", "심연으로"],  # 처형 — 고코 요격
    "SP04": ["겁화", "천벌", "산사태", "대해일", "강철 폭풍", "흡혈 파도", "함몰"],  # 화염비 — 광역
    "SP05": ["연쇄 폭발", "분신", "낙석"],             # 소멸 — 폭발
    "EN01": ["성화", "불의 제단", "고대 제단", "생명의 샘"],
    "EN02": ["병기고", "전열 구축", "대지의 축복", "조수의 인장"],
    "EN03": ["피의 성배", "연쇄 발화", "해무", "강철 의지", "흡혈 의식", "빛의 장막"],
}
IMG_BY_NAME = {nm: f"assets/art/{k}.png" for k, names in ART_IMAGE.items() for nm in names}


def image_for(name):
    path = IMG_BY_NAME.get(name, "")
    return path if path and os.path.exists(os.path.join(ROOT, path)) else ""


def art_for(name, kind, tag):
    if name in ART_BY_NAME:
        return ART_BY_NAME[name]
    if kind == "creature":
        return ART_FALLBACK_CR.get(tag, "sword")
    if kind == "spell":
        return ART_FALLBACK_SP.get(tag, "burst")
    return "flame"


def write_csv(path, rows, fields):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})


def main():
    creatures, spells, enchants = [], [], []
    pool, decks = {}, {}
    nc = ns = ne = 0

    for el, deck in G.DECKS.items():
        entries = []

        for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
            sp, bd, dv, text = G.check_creature(c, tag, a, h, keys, nm)
            nc += 1
            en_tag = TAG_EN[tag]
            cc = G.color_req(c)
            creatures.append(dict(
                id=f"CR{nc:03d}", name=nm, cost=c, tag=en_tag, atk=a, hp=h, copies=cp,
                cost_color=cc, cost_generic=c - cc, element=el,
                art=art_for(nm, "creature", tag), desc=text, image=image_for(nm),
                rarity=G.rar(nm),
                budget_p=bd, verdict="적정" if dv == 0 else str(dv), note=""))
            e = {"c": c, "k": "cr", "cc": cc, "a": a, "h": h, "el": el,
                 "kw": text, "copies": cp}
            if nm in G.FOEONLY:      # 적 전용 — 뷰어 표시 · 원정 보상 제외
                e["foe"] = 1
            # 희귀도는 커먼이 아닐 때만 적는다(기본값이 커먼) — 데이터가 불필요하게 커지지 않게
            if G.rar(nm) != "common":
                e["r"] = G.rar(nm)
            if en_tag in ("guard", "flyguard"):
                e["g"] = 1
            if en_tag in ("fly", "flyguard"):
                e["f"] = 1
            if en_tag == "pierce":
                e["p"] = 1
            pool[nm] = e
            # 매수 0 = 카드 풀에만 두고 덱에는 안 싣는다(골격을 안 건드리고 새 카드를 시험할 때)
            if cp:
                entries.append([nm, cp])

        for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
            ns += 1
            cc = G.color_req(c)
            mode = MODE_EN[kind]
            spells.append(dict(
                id=f"SP{ns:03d}", name=nm, cost=c, mode=mode, value=val, copies=cp,
                cost_color=cc, cost_generic=c - cc, element=el,
                art=art_for(nm, "spell", kind), desc=rule, image=image_for(nm),
                rarity=G.rar(nm), note=""))
            pool[nm] = {"c": c, "k": "sp", "cc": cc, "mode": mode, "v": val,
                        "el": el, "d": rule, "copies": cp}
            if nm in G.FOEONLY:      # 적 전용 — 뷰어가 '적 전용' 으로 찍고 보상에도 안 낸다
                pool[nm]["foe"] = 1
            # 인챈트는 트리거형이다 — 언제 발동하고 무엇을 하는지를 데이터로 싣는다
            tg = G.ENCH_TRIG.get(nm)
            if tg:
                pool[nm]["tg"], pool[nm]["fx"] = tg
            if G.rar(nm) != "common":
                pool[nm]["r"] = G.rar(nm)
            # 매수 0 = 카드 풀에만 두고 덱에는 안 싣는다(골격을 안 건드리고 새 카드를 시험할 때)
            if cp:
                entries.append([nm, cp])

        for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
            ne += 1
            cc = G.color_req(c)
            enchants.append(dict(
                id=f"EN{ne:03d}", name=nm, cost=c, drain_type=DRAIN_EN[dr],
                effect_value=E, charge=C, target=scope, copies=cp,
                cost_color=cc, cost_generic=c - cc, element=el,
                art=art_for(nm, "enchant", dr), desc=rule, image=image_for(nm),
                rarity=G.rar(nm), note=""))
            pool[nm] = {"c": c, "k": "en", "cc": cc, "v": E, "ch": C,
                        "el": el, "d": rule, "copies": cp}
            if nm in G.FOEONLY:
                pool[nm]["foe"] = 1
            # 인챈트는 트리거형이다 — 언제 발동하고 무엇을 하는지를 데이터로 싣는다
            tg = G.ENCH_TRIG.get(nm)
            if tg:
                pool[nm]["tg"], pool[nm]["fx"] = tg
            if G.rar(nm) != "common":
                pool[nm]["r"] = G.rar(nm)
            # 매수 0 = 카드 풀에만 두고 덱에는 안 싣는다(골격을 안 건드리고 새 카드를 시험할 때)
            if cp:
                entries.append([nm, cp])

        cards = sum(cp for _, cp in entries)
        decks[el] = {
            "name": G.MECH[el][0], "core": G.MECH[el][1], "flow": G.MECH[el][2],
            "lands": [[BASIC_LAND[el], LAND_COUNT]],
            "cards": entries,
            "total": cards + LAND_COUNT,
        }
        assert cards == 23, f"{el} 카드 {cards}장 (23이어야 함)"

    write_csv(os.path.join(DATA, "creatures.csv"), creatures,
              ["id", "name", "cost", "tag", "atk", "hp", "copies", "cost_color",
               "cost_generic", "element", "art", "desc", "image", "rarity",
               "budget_p", "verdict", "note"])
    write_csv(os.path.join(DATA, "spells.csv"), spells,
              ["id", "name", "cost", "mode", "value", "copies", "cost_color",
               "cost_generic", "element", "art", "desc", "image", "rarity", "note"])
    write_csv(os.path.join(DATA, "enchants.csv"), enchants,
              ["id", "name", "cost", "drain_type", "effect_value", "charge", "target",
               "copies", "cost_color", "cost_generic", "element", "art", "desc", "image",
               "rarity", "note"])
    with open(os.path.join(DATA, "cards.json"), "w", encoding="utf-8") as f:
        json.dump({"pool": pool}, f, ensure_ascii=False, indent=1)
    with open(os.path.join(DATA, "decks.json"), "w", encoding="utf-8") as f:
        json.dump(decks, f, ensure_ascii=False, indent=1)

    dup = len(creatures) + len(spells) + len(enchants) - len(pool)
    print(f"크리처 {len(creatures)} · 스펠 {len(spells)} · 인챈트 {len(enchants)}"
          f" = {len(creatures)+len(spells)+len(enchants)}종")
    print(f"POOL {len(pool)}종 (이름 중복 {dup}건)")
    for el, d in decks.items():
        print(f"  {G.KO[el]:<3} {d['name']:<10} 카드 23 + 지형 {LAND_COUNT} = {d['total']}장")
    print("wrote: creatures.csv, spells.csv, enchants.csv, cards.json, decks.json")


if __name__ == "__main__":
    main()
