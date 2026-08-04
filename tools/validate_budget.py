#!/usr/bin/env python3
"""
TEN — 카드 데이터 검산 게이트. 통과하면 exit 0, 하나라도 어긋나면 exit 1.

세 가지를 본다.

  1) 예산   설계 정본(gen_decks.py의 DECKS) 140종이 전부 예산 안에 있는가
  2) 동기화 data/의 CSV·JSON이 설계와 정확히 일치하는가 (승격 후 드리프트 감지)
  3) 덱     속성별 덱이 카드 23 + 지형 17 = 40장인가, 동명 2장 상한을 지키는가

데이터를 고쳤으면 tools/promote_decks.py 를 다시 돌린 뒤 이 검산을 통과시킨다.
"""
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

import gen_decks as G           # noqa: E402
import promote_decks as P       # noqa: E402


def load_csv(name):
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_json(name):
    path = os.path.join(DATA, name)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    problems = []
    print("=" * 72)
    print("TEN 검산 — 예산 · 동기화 · 덱")
    print("=" * 72)

    # ── 1) 예산 ───────────────────────────────────────────────
    over = []
    n_cr = n_sp = n_en = 0
    for el, deck in G.DECKS.items():
        for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
            n_cr += 1
            spent, bud, dv, _ = G.check_creature(c, tag, a, h, keys, nm)
            # 적 전용 = 애초에 균형을 안 맞춘 카드 · 지형산물 = 값을 지형이 이미 냈다
            if nm in G.NOBUDGET:
                continue
            if dv > 0:
                over.append(f"{G.KO[el]} {nm} 크리처 소모 {spent} > 예산 {bud}")
            if tag in ("수호", "비행수호") and c > 1 and a > c - 1:
                over.append(f"{G.KO[el]} {nm} 수호 ATK 캡 초과 ({a} > {c-1})")
        for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
            n_sp += 1
            vv, rr, dv = G.check_spell(kind, val, ref, adj, nm)
            if nm in G.NOBUDGET:
                continue
            if dv > 0:
                over.append(f"{G.KO[el]} {nm} 스펠 {G.fmt(vv)} > 기준 {G.fmt(rr)}")
        for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
            n_en += 1
            eff, tgt, dv = G.check_enchant(c, dr, E, C, scope, nm)
            if nm in G.NOBUDGET:
                continue
            if dv > 2:
                over.append(f"{G.KO[el]} {nm} 인챈트 {eff:.0f} > 예산 {tgt}")
    total = n_cr + n_sp + n_en
    print(f"\n[1] 예산  크리처 {n_cr} · 스펠 {n_sp} · 인챈트 {n_en} = {total}종")
    print(f"    초과 {len(over)}건" + ("" if not over else ":"))
    for m in over[:12]:
        print(f"      ✗ {m}")
    problems += over

    # ── 1-b) 희귀도 ───────────────────────────────────────────
    # 희귀도를 올려 놓기만 하고 스탯을 안 올린 카드를 알려 준다(실패는 아니고 '여유').
    rc = {r: 0 for r in G.RARS}
    slack = []
    for el, deck in G.DECKS.items():
        for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
            rc[G.rar(nm)] += 1
            spent, bud, dv, _ = G.check_creature(c, tag, a, h, keys, nm)
            if G.rar(nm) != "common" and dv < 0:
                slack.append(f"{nm}({G.RARKO[G.rar(nm)]}) 예산 {bud} 중 {spent} 사용 — {-dv} 남음")
        for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
            rc[G.rar(nm)] += 1
            vv, rr, dv = G.check_spell(kind, val, ref, adj, nm)
            if G.rar(nm) != "common" and isinstance(rr, (int, float)) and dv < 0:
                slack.append(f"{nm}({G.RARKO[G.rar(nm)]}) 기준 {G.fmt(rr)} 중 {G.fmt(vv)} — 여유 {G.fmt(-dv)}")
        for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
            rc[G.rar(nm)] += 1
            eff, tgt, dv = G.check_enchant(c, dr, E, C, scope, nm)
            if G.rar(nm) != "common" and dv < -2:
                slack.append(f"{nm}({G.RARKO[G.rar(nm)]}) 예산 {tgt} 중 {eff:.0f} — 여유 {-dv:.0f}")
    dist = " · ".join(f"{G.RARKO[r]} {rc[r]}" for r in G.RARS)
    print(f"\n[1-b] 희귀도  {dist}")
    print("      배수 " + " · ".join(f"{G.RARKO[r]} ×{G.RARMULT[r]:.2f}" for r in G.RARS))
    if slack:
        print(f"      ⓘ 예산이 남는 카드 {len(slack)}종 (실패 아님 — 올린 만큼 안 쓴 것):")
        for m in slack[:10]:
            print(f"        · {m}")

    # ── 2) 동기화 ─────────────────────────────────────────────
    csvs = {"creatures.csv": load_csv("creatures.csv"),
            "spells.csv": load_csv("spells.csv"),
            "enchants.csv": load_csv("enchants.csv")}
    cards = load_json("cards.json")
    decks = load_json("decks.json")
    rules = load_json("rules.json") or {}
    target = rules.get("constants", {}).get("deck_size", 40)

    missing = [k for k, v in csvs.items() if v is None]
    if cards is None:
        missing.append("cards.json")
    if decks is None:
        missing.append("decks.json")
    if missing:
        problems.append("데이터 파일 없음: " + ", ".join(missing))
        print(f"\n[2] 동기화  ✗ 파일 없음: {', '.join(missing)}")
        print("    → python3 tools/promote_decks.py 를 먼저 실행하세요.")
    else:
        drift = []
        n_data = sum(len(v) for v in csvs.values())
        if n_data != total:
            drift.append(f"CSV {n_data}종 ≠ 설계 {total}종")
        pool = cards.get("pool", {})
        if len(pool) != total:
            drift.append(f"cards.json POOL {len(pool)}종 ≠ 설계 {total}종")
        want = {}
        for el, deck in G.DECKS.items():
            for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
                want[nm] = ("cr", c, G.color_req(c), el, a, h)
            for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
                want[nm] = ("sp", c, G.color_req(c), el, None, None)
            for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
                want[nm] = ("en", c, G.color_req(c), el, None, None)
        for nm, w in want.items():
            g = pool.get(nm)
            if not g:
                drift.append(f"{nm}: POOL에 없음")
                continue
            if g["c"] != w[1] or g["cc"] != w[2] or g.get("el") != w[3]:
                drift.append(f"{nm}: 코스트/유색/속성 불일치")
            if w[0] == "cr" and (g.get("a") != w[4] or g.get("h") != w[5]):
                drift.append(f"{nm}: 스탯 불일치 (POOL {g.get('a')}/{g.get('h')} ≠ 설계 {w[4]}/{w[5]})")
        print(f"\n[2] 동기화  CSV {n_data}종 · POOL {len(pool)}종 · 덱 {len(decks)}개")
        print(f"    불일치 {len(drift)}건" + ("" if not drift else ":"))
        for m in drift[:12]:
            print(f"      ✗ {m}")
        problems += drift

    # ── 3) 덱 ─────────────────────────────────────────────────
    print("\n[3] 덱")
    if decks:
        cap = rules.get("constants", {}).get("copies_max", 2)
        # ⚠ 기본 지형은 속성마다 **여러 종**일 수 있다(불·물은 세 종) → 목록을 펼친다.
        basics = {n for ns in P.BASIC_LAND.values() for n in ns}
        for el, d in decks.items():
            nc = sum(cp for _, cp in d["cards"])
            nl = sum(cp for _, cp in d["lands"])
            bad = [nm for nm, cp in d["cards"] if cp > cap and nm not in basics]
            ok = (nc + nl == target) and not bad
            print(f"    {'✓' if ok else '✗'} {G.KO[el]:<3} {d['name']:<10} "
                  f"카드 {nc} + 지형 {nl} = {nc+nl}")
            if nc + nl != target:
                problems.append(f"{G.KO[el]} 덱 {nc+nl}장 ≠ {target}")
            if bad:
                problems.append(f"{G.KO[el]} 동명 {cap}장 초과: {', '.join(bad)}")
        print(f"    (기본 지형은 동명 상한 예외 — 단색 덱은 기본 지형 {P.LAND_COUNT}장)")

    print("\n" + "=" * 72)
    if problems:
        print(f"❌ 검산 실패 — 문제 {len(problems)}건")
        sys.exit(1)
    print(f"✅ 통과 — {total}종 예산 이내 · 데이터 동기화 · 7덱 모두 {target}장")


if __name__ == "__main__":
    main()
