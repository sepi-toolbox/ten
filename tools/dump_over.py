#!/usr/bin/env python3
"""예산을 넘긴 카드를 docs/budget_over.md 로 뽑는다. (멱등)

⚠ 이 목록은 **고치라는 뜻이 아니다.** 성권이 속성별 개편이 전부 끝난 뒤 한꺼번에
   검수하기로 한 것들이다. 명세대로 만든 값이라 임의로 깎으면 의도한 카드가 아니게 된다.
   validate_budget 은 여전히 이것들을 '초과' 로 세고 빨간불을 낸다 — 그게 정직한 상태다.

  python3 tools/dump_over.py
"""
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import gen_decks as G  # noqa: E402

NOTE = """## 왜 초과인가 — 값이 큰 것부터

- **악마의 석상**(2코) · **작열 감옥**(2코) — 둘 다 옛 카드가 훨씬 비싼 값에 하던 일이다.
  작열 감옥의 '연소 5 부여' 는 지운 소이탄이 **4코**에서 하던 것이고, 석상은 전체 강화 ×충전 5 다.
- **산불** · **파이어버그**(둘 다 1코) — 폭발은 가감이 `-ATK` 라 ATK 1 점이 **3** 을 먹는다
  (때리는 값 2 + 터질 때 얼굴 1). 그래서 1코 폭발 몸은 예산상 1/1 이 한계다.
- **얼음 방패** · **화염 방패**(둘 다 1코) — 화염 방패는 지우기 전에 **2코** 였다.
- **환류가 붙은 주문 셋**(수정구의 힘·허영·투명화) — 주문 환류를 크리처 환류와 같은 비율
  (제 예산의 35%)로 매긴 결과다. 이 비율을 낮추면 셋이 한꺼번에 통과한다.
- 나머지(+1) 는 눈금 하나 차이라 코스트나 수치를 한 칸만 움직이면 맞는다.
"""


def collect():
    rows = []
    for el, d in G.DECKS.items():
        for (nm, c, tag, a, h, cp, keys) in d["creatures"]:
            sp, bd, dv, txt = G.check_creature(c, tag, a, h, keys, nm)
            if dv > 0 and nm not in G.NOBUDGET:
                rows.append((G.KO[el], nm, f"{c}코 크리처", f"{a}/{h}", sp, bd, dv, txt))
        for (nm, c, kind, val, ref, adj, cp, rule) in d["spells"]:
            vv, rr, dv = G.check_spell(kind, val, ref, adj, nm)
            if dv > 0 and nm not in G.NOBUDGET:
                rows.append((G.KO[el], nm, f"{c}코 {kind}", "", vv, rr, dv, rule))
        for (nm, c, dr, E, C, sc, cp, rule) in d["enchants"]:
            eff, tgt, dv = G.check_enchant(c, dr, E, C, sc, nm)
            if dv > 2 and nm not in G.NOBUDGET:
                rows.append((G.KO[el], nm, f"{c}코 {dr}", f"E{E}×C{C}",
                             int(eff), tgt, int(dv), rule))
    rows.sort(key=lambda r: -r[6])
    return rows


def main():
    rows = collect()
    o = io.StringIO()
    o.write("# 예산 초과 기록\n\n")
    o.write("**성권이 속성별 개편이 전부 끝난 뒤 한꺼번에 검수하기로 한 목록.**\n")
    o.write("지금은 고치지 않는다 — 명세대로 만든 값이고, 임의로 깎으면 의도한 카드가 아니게 된다.\n\n")
    o.write("손으로 쓰지 않는다. `python3 tools/dump_over.py` 가 다시 만든다.\n\n")
    o.write("| 속성 | 카드 | 분류 | 수치 | 소모 | 예산 | 초과 | 규칙 |\n")
    o.write("|---|---|---|---|---:|---:|---:|---|\n")
    for el, nm, kind, st, sp, bd, dv, txt in rows:
        o.write(f"| {el} | **{nm}** | {kind} | {st} | {sp} | {bd} | **+{dv}** | {txt} |\n")
    o.write(f"\n합계 **{len(rows)}건**.\n\n")
    o.write(NOTE)
    path = os.path.join(ROOT, "docs", "budget_over.md")
    open(path, "w", encoding="utf-8").write(o.getvalue())
    print(f"✅ {len(rows)}건 → docs/budget_over.md")


if __name__ == "__main__":
    main()
