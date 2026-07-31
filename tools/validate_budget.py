#!/usr/bin/env python3
"""
TEN — 카드 데이터 예산 검산기.

밸런스 시트의 '예산 검산'을 코드로 옮긴 것. data/ 의 CSV/JSON을 읽어
예산 공식 대비 각 카드의 편차와 판정을 출력하고, 예산 초과 카드가 있거나
덱 사이즈가 목표와 다르면 종료 코드 1을 반환한다. (CI 게이트로 사용 가능)

예산 공식:  P(n) = round(a·n + b + (n−1)² · k)  +  태그 예산 보정
스탯 소모:  일반 2A+H · 수호 2A+2H · 비행 4A+H · 비행수호 4A+2H
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def load_json(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def load_csv(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return list(csv.DictReader(f))


def creature_budget(cost, tag, budget):
    a, b, k = budget["a"], budget["b"], budget["k"]
    base = int(a * cost + b + (cost - 1) ** 2 * k + 0.5)
    return base


def main():
    rules = load_json("rules.json")
    budget = rules["budget"]
    tags = rules["tags"]
    creatures = load_csv("creatures.csv")
    spells = load_csv("spells.csv")
    enchants = load_csv("enchants.csv")

    problems = 0
    print("=" * 68)
    print("TEN 예산 검산")
    print("=" * 68)

    print("\n[크리처]  코스트  태그      ATK/HP   소모P  예산P  편차  판정")
    print("-" * 68)
    for c in creatures:
        cost, tag = int(c["cost"]), c["tag"]
        atk, hp = int(c["atk"]), int(c["hp"])
        w = tags[tag]
        spent = w["atk_w"] * atk + w["hp_w"] * hp
        bud = creature_budget(cost, tag, budget) + w["budget_adj"]
        dev = spent - bud
        if dev > 0:
            verdict, problems = "초과", problems + 1
        elif dev < 0:
            verdict = "미달"
        else:
            verdict = "적정"
        # 수호 ATK 캡: 코스트-1 초과 시 경고(만능 카드 방지)
        cap_warn = " ⚠ATK캡" if tag in ("guard", "flyguard") and atk > cost - 1 and cost > 1 else ""
        print(f"  {c['name']:<6}  {cost:^4}   {tag:<8} {atk:>3}/{hp:<3}  {spent:>4}  {bud:>4}  {dev:>+4}  {verdict}{cap_warn}")

    print("\n[스펠]  코스트  분류    수치  기준티어  판정")
    print("-" * 68)
    tier = {t["cost"]: t for t in rules["spell_tier"]}
    for s in spells:
        cost, mode, val = int(s["cost"]), s["mode"], int(s["value"])
        t = tier.get(cost, {})
        ref = {"dmg": t.get("single"), "aoe": t.get("aoe"), "direct": t.get("direct")}.get(mode)
        if ref is None:
            verdict = "기준없음"
        elif val > ref:
            verdict, problems = "초과", problems + 1
        elif val < ref:
            verdict = "미달"
        else:
            verdict = "적정"
        print(f"  {s['name']:<6}  {cost:^4}   {mode:<6} {val:>4}   {str(ref):>4}     {verdict}")

    print("\n[인챈트]  코스트  소모타입     E×C  총산출T  예산T  판정")
    print("-" * 68)
    ct = {r["cost"]: r for r in rules["cost_budget"]}
    for e in enchants:
        if int(e["copies"] or 0) == 0:
            continue  # 미채용(잠정) 카드는 검산 대상에서 제외
        cost = int(e["cost"])
        ev, ch = int(e["effect_value"]), int(e["charge"])
        total = ev * ch
        bud_t = ct.get(cost, {}).get("enchant_t")
        dev = total - bud_t if bud_t is not None else 0
        verdict = "적정" if dev == 0 else ("초과" if dev > 0 else "미달")
        if dev > 0:
            problems += 1
        print(f"  {e['name']:<6}  {cost:^4}   {e['drain_type']:<10} {ev}×{ch}   {total:>4}    {str(bud_t):>4}   {verdict}")

    # 덱 사이즈 검산
    deck = sum(int(c["copies"]) for c in creatures) + \
        sum(int(s["copies"]) for s in spells) + \
        sum(int(e["copies"]) for e in enchants)
    target = rules["constants"]["deck_size"]
    print("\n" + "=" * 68)
    print(f"덱 총 카드 수: {deck} / 목표 {target}  →  {'OK' if deck == target else '불일치!'}")
    if deck != target:
        problems += 1
    print(f"예산 초과/불일치 항목: {problems}")
    print("=" * 68)

    if problems:
        print("\n❌ 검산 실패 — 위 항목을 확인하세요.")
        sys.exit(1)
    print("\n✅ 모든 카드가 예산 범위 내. 덱 사이즈 일치.")


if __name__ == "__main__":
    main()
