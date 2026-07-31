#!/usr/bin/env python3
"""
TEN — 밸런스 시트(ten_balance.xlsx)를 엔진용 데이터 테이블로 변환한다.

출력물:
  data/rules.json      규칙 상수 + 예산 공식 계수 + 태그 가중치
  data/creatures.csv   크리처 카드 테이블
  data/spells.csv      스펠 카드 테이블
  data/enchants.csv    인챈트 카드 테이블
  data/cards.json      프로토타입 엔진(POOL)이 바로 읽는 통합 카드 데이터

밸런스 시트가 여전히 단일 원본(source of truth)이다.
값을 수정한 뒤 이 스크립트를 다시 돌리면 데이터 테이블이 재생성된다.
"""
import csv
import json
import os
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
XLSX = os.path.join(DATA, "ten_balance.xlsx")

TAG_MAP = {"일반": "normal", "수호": "guard", "비행": "fly", "비행수호": "flyguard"}
SPELL_MODE = {"단일": "dmg", "광역": "aoe", "직접": "direct"}
DRAIN_MAP = {"지속형": "persistent", "발동형": "triggered", "사용형": "active"}

# 카드명 → 속성 (잠정 배정: 아트·테마 기준. docs/element_design.html 참조)
DEFAULT_ELEMENT = {
    "파수병": "steel", "방벽병": "steel", "검사": "steel", "창병": "steel", "기사": "steel",
    "석벽": "earth", "장군": "earth", "창격": "earth", "군기": "earth",
    "파괴자": "dark", "처형": "dark", "소멸": "dark", "성화": "dark",
    "잔날개": "water", "전투매": "water",
    "그리핀": "nature", "화살": "nature",
    "와이번": "fire", "화염비": "fire",
    "각성": "light",
}

# 카드명 → 기본 아트 모티프 (에디터/갤러리 공유 라이브러리 키)
DEFAULT_ART = {
    "파수병": "shield", "잔날개": "wings", "방벽병": "wall", "검사": "sword",
    "전투매": "hawk", "석벽": "wall", "창병": "spear", "그리핀": "griffin",
    "기사": "helmet", "와이번": "wyvern", "장군": "banner", "파괴자": "axe",
    "화살": "arrow", "창격": "thrust", "처형": "exec", "화염비": "firerain",
    "소멸": "burst", "성화": "flame", "군기": "flag", "각성": "awaken",
}


def load_existing_design():
    """기존 CSV의 art/desc/image를 id 기준으로 보존 (xlsx 편집 시 시각 설정 유지)."""
    design = {}
    for fn in ("creatures.csv", "spells.csv", "enchants.csv"):
        path = os.path.join(DATA, fn)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if r.get("id"):
                    design[r["id"]] = {"art": r.get("art", ""), "desc": r.get("desc", ""), "image": r.get("image", ""), "element": r.get("element", "")}
    return design


def apply_design(rows, existing, fallback):
    for r in rows:
        prev = existing.get(r["id"], {})
        r["art"] = prev.get("art") or DEFAULT_ART.get(r["name"]) or fallback(r)
        r["desc"] = prev.get("desc", "")
        r["element"] = prev.get("element") or DEFAULT_ELEMENT.get(r["name"], "steel")
        # 생성 아트: 보존값 우선, 없으면 assets/art/<id>.png 존재 시 자동 연결
        default_img = f"assets/art/{r['id']}.png"
        r["image"] = prev.get("image") or (default_img if os.path.exists(os.path.join(ROOT, default_img)) else "")
    return rows


def clean(row):
    row = list(row)
    while row and row[-1] is None:
        row.pop()
    return row


def load():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    return {ws.title: [clean(r) for r in ws.iter_rows(values_only=True)] for ws in wb.worksheets}


def parse_rules(rows):
    rules = {"constants": {}, "budget": {}, "tags": {}, "cost_budget": [], "spell_tier": []}
    labelmap = {
        "시작 HP": "start_hp", "마나 상한": "mana_cap", "보드 슬롯": "board_slots",
        "스택 상한": "stack_max", "덱 사이즈": "deck_size",
    }
    budgetmap = {
        "a (선형 계수)": "a", "b (기본값)": "b", "k (지수 계수)": "k",
        "인챈트 a": "enchant_a", "인챈트 b": "enchant_b",
    }
    section = None
    for r in rows:
        if not r:
            continue
        key = r[0]
        if key in labelmap and len(r) > 1:
            rules["constants"][labelmap[key]] = r[1]
        elif key in budgetmap and len(r) > 1:
            rules["budget"][budgetmap[key]] = r[1]
        elif key in TAG_MAP and len(r) >= 4 and isinstance(r[1], (int, float)):
            rules["tags"][TAG_MAP[key]] = {"atk_w": r[1], "hp_w": r[2], "budget_adj": r[3]}
        elif key == "코스트별 예산 (자동 계산)":
            section = "cost"
        elif key == "스펠 기준 티어 (직접 입력)":
            section = "spell"
        elif section == "cost" and isinstance(key, int):
            rules["cost_budget"].append({"cost": key, "creature_p": r[1], "enchant_t": r[3] if len(r) > 3 else None})
        elif section == "spell" and isinstance(key, int):
            rules["spell_tier"].append({
                "cost": key,
                "single": r[1] if len(r) > 1 else None,
                "aoe": r[2] if len(r) > 2 else None,
                "direct": r[3] if len(r) > 3 else None,
            })
    return rules


def parse_creatures(rows):
    out = []
    for r in rows:
        if r and isinstance(r[0], str) and r[0].startswith("CR"):
            out.append({
                "id": r[0], "name": r[1], "cost": r[2], "tag": TAG_MAP.get(r[3], r[3]),
                "atk": r[4], "hp": r[5], "copies": r[6],
                "budget_p": r[8], "verdict": r[10], "note": r[12] if len(r) > 12 else "",
            })
    return out


def parse_spells(rows):
    out = []
    for r in rows:
        if r and isinstance(r[0], str) and r[0].startswith("SP"):
            out.append({
                "id": r[0], "name": r[1], "cost": r[2], "mode": SPELL_MODE.get(r[3], r[3]),
                "value": r[4], "copies": r[5], "note": r[9] if len(r) > 9 else "",
            })
    return out


def parse_enchants(rows):
    out = []
    for r in rows:
        if r and isinstance(r[0], str) and r[0].startswith("EN"):
            out.append({
                "id": r[0], "name": r[1], "cost": r[2], "drain_type": DRAIN_MAP.get(r[3], r[3]),
                "effect_value": r[4], "charge": r[5], "target": r[6], "copies": r[7],
                "note": r[12] if len(r) > 12 else "",
            })
    return out


def write_csv(path, rows, fields):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, "") for k in fields})


def spell_text(s):
    """스펠 효과문을 mode/value에서 생성 (설계 메모 note와 구분)."""
    v = s["value"]
    return {"dmg": f"크리처 1개체에 {v} 피해",
            "aoe": f"적 전체 개체에 {v} 피해",
            "direct": f"플레이어에게 {v} 피해 · 수호 무시"}.get(s["mode"], "")


def build_pool(creatures, spells, enchants):
    """프로토타입 index.html 의 POOL 구조와 동일한 통합 카드 사전."""
    pool = {}
    for c in creatures:
        e = {"c": c["cost"], "k": "cr", "a": c["atk"], "h": c["hp"], "copies": c["copies"]}
        if c["tag"] in ("guard", "flyguard"):
            e["g"] = 1
        if c["tag"] in ("fly", "flyguard"):
            e["f"] = 1
        pool[c["name"]] = e
    for s in spells:
        pool[s["name"]] = {"c": s["cost"], "k": "sp", "mode": s["mode"],
                            "v": s["value"], "copies": s["copies"], "d": spell_text(s)}
    for en in enchants:
        if not en["copies"]:  # 미채용(잠정) 카드는 풀에서 제외
            continue
        pool[en["name"]] = {"c": en["cost"], "k": "en", "v": en["effect_value"],
                            "ch": en["charge"], "copies": en["copies"], "d": en["note"]}
    return pool


def main():
    sheets = load()
    rules = parse_rules(sheets["규칙상수"])
    creatures = parse_creatures(sheets["크리처"])
    spells = parse_spells(sheets["스펠"])
    enchants = parse_enchants(sheets["인챈트"])

    existing = load_existing_design()
    apply_design(creatures, existing, lambda r: "shield" if r["tag"] in ("guard", "flyguard") else ("hawk" if r["tag"] == "fly" else "sword"))
    apply_design(spells, existing, lambda r: "burst")
    apply_design(enchants, existing, lambda r: "flame")

    with open(os.path.join(DATA, "rules.json"), "w", encoding="utf-8") as f:
        json.dump(rules, f, ensure_ascii=False, indent=2)

    write_csv(os.path.join(DATA, "creatures.csv"), creatures,
              ["id", "name", "cost", "tag", "atk", "hp", "copies", "element", "art", "desc", "image", "budget_p", "verdict", "note"])
    write_csv(os.path.join(DATA, "spells.csv"), spells,
              ["id", "name", "cost", "mode", "value", "copies", "element", "art", "desc", "image", "note"])
    write_csv(os.path.join(DATA, "enchants.csv"), enchants,
              ["id", "name", "cost", "drain_type", "effect_value", "charge", "target", "copies", "element", "art", "desc", "image", "note"])

    pool = build_pool(creatures, spells, enchants)
    with open(os.path.join(DATA, "cards.json"), "w", encoding="utf-8") as f:
        json.dump({"pool": pool}, f, ensure_ascii=False, indent=2)

    deck = sum(c["copies"] for c in creatures) + sum(s["copies"] for s in spells) + \
        sum(en["copies"] for en in enchants)
    print(f"crea={len(creatures)} spell={len(spells)} enchant={len(enchants)} deck_total={deck}")
    print("wrote: rules.json, creatures.csv, spells.csv, enchants.csv, cards.json")


if __name__ == "__main__":
    main()
