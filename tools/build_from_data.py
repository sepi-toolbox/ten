#!/usr/bin/env python3
"""
카드 에디터가 내보낸 ten_data.json 을 받아 data/의 산출물을 재생성한다.
(에디터로 편집한 경우의 파이프라인. 스프레드시트로 편집했다면 extract_cards.py를 쓴다.)

  python3 tools/build_from_data.py <ten_data.json>

생성물: data/creatures.csv · spells.csv · enchants.csv · cards.json
id가 비어 있으면 CR/SP/EN 접두사로 자동 부여한다.
rules는 편집 대상이 아니므로 입력 파일의 rules는 무시하고 data/rules.json을 유지한다.
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def write_csv(path, rows, fields):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k, "") for k in fields})


def autoid(rows, prefix):
    for n, r in enumerate(rows, 1):
        if not r.get("id"):
            r["id"] = f"{prefix}{n:02d}"
    return rows


def annotate_creatures(rows, rules):
    """예산 검산 컬럼(budget_p, verdict)을 재계산해 채운다 — CSV를 리치하게 유지."""
    b, tags = rules["budget"], rules["tags"]
    for r in rows:
        cost, tag = int(r["cost"]), r["tag"]
        w = tags.get(tag, tags["normal"])
        budget = int(b["a"] * cost + b["b"] + (cost - 1) ** 2 * b["k"] + 0.5) + w["budget_adj"]
        spent = w["atk_w"] * int(r["atk"]) + w["hp_w"] * int(r["hp"])
        dev = spent - budget
        r["budget_p"] = budget
        r["verdict"] = "적정" if dev == 0 else ("초과" if dev > 0 else "미달")
    return rows


def build_pool(creatures, spells, enchants):
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
                           "v": s["value"], "copies": s["copies"], "d": s.get("note", "")}
    for en in enchants:
        if int(en.get("copies") or 0) == 0:
            continue  # 미채용 카드는 게임 풀에서 제외
        pool[en["name"]] = {"c": en["cost"], "k": "en", "v": en["effect_value"],
                            "ch": en["charge"], "copies": en["copies"], "d": en.get("note", "")}
    return pool


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: python3 tools/build_from_data.py <ten_data.json>")
    d = json.load(open(sys.argv[1], encoding="utf-8"))
    rules = json.load(open(os.path.join(DATA, "rules.json"), encoding="utf-8"))
    creatures = annotate_creatures(autoid(d["creatures"], "CR"), rules)
    spells = autoid(d["spells"], "SP")
    enchants = autoid(d["enchants"], "EN")

    write_csv(os.path.join(DATA, "creatures.csv"), creatures,
              ["id", "name", "cost", "tag", "atk", "hp", "copies", "budget_p", "verdict", "note"])
    write_csv(os.path.join(DATA, "spells.csv"), spells,
              ["id", "name", "cost", "mode", "value", "copies", "note"])
    write_csv(os.path.join(DATA, "enchants.csv"), enchants,
              ["id", "name", "cost", "drain_type", "effect_value", "charge", "target", "copies", "note"])

    pool = build_pool(creatures, spells, enchants)
    with open(os.path.join(DATA, "cards.json"), "w", encoding="utf-8") as f:
        json.dump({"pool": pool}, f, ensure_ascii=False, indent=2)

    deck = sum(c["copies"] for c in creatures) + sum(s["copies"] for s in spells) + \
        sum(e["copies"] for e in enchants)
    print(f"crea={len(creatures)} spell={len(spells)} enchant={len(enchants)} deck_total={deck}")
    print("wrote: creatures.csv, spells.csv, enchants.csv, cards.json")


if __name__ == "__main__":
    main()
