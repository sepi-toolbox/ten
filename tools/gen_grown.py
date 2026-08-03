#!/usr/bin/env python3
"""
성장·진형이 갈아입는 **상위 몸**을 자동으로 만든다. (멱등)

  python3 tools/gen_grown.py            # 표만 출력
  python3 tools/gen_grown.py --write    # data/grown.json 갱신

왜 자동 생성인가 — 기존 카드로 매핑하면(묘목 → 고목) 이름·일러스트가 통째로 바뀌어
"내 카드가 뭐가 됐지?" 가 되고, 카드마다 예산 편차도 제멋대로가 된다.
여기서는 **원본 한 장에 상위 몸 한 장**을 고정 규칙으로 붙인다.

  성장 N  →  "성장한 <이름>"   (N턴 뒤 교체)
  진형    →  "각성한 <이름>"   (내 크리처가 나 하나뿐일 때 교체)

  예산 = (cbase + 태그 보정) × 희귀도 배수 × GROW_MULT(1.5)
  ⚠ 원본의 **키워드 배수·가감은 빼고** 계산한다. 상위 몸은 성장/진형 키워드를 잃기 때문이다.
     (연소처럼 남는 키워드는 그대로 물려주고 예산에도 반영한다.)
  스탯은 원본의 ATK:HP 비율을 지킨 채 예산에 꽉 차게 맞춘다 — 원형을 알아볼 수 있어야 한다.

⚠ 상위 몸은 **덱에도 카드 풀 개수에도 들어가지 않는다.** 필드와 확대창에서만 보인다
   (원정의 강화 카드 ROGUE.over 와 같은 취급). 뷰어의 '카드 N종' 도 여기를 뺀 수다.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import gen_decks as G   # noqa: E402

OUT = os.path.join(ROOT, "data", "grown.json")
PREFIX = {"성장": "성장한", "진형": "각성한"}


def grow_key(keys):
    """이 크리처가 상위 몸을 갖는가 → ('성장'|'진형', 남은 키워드) 또는 None."""
    for k in keys:
        if k == "진형":
            return "진형", [x for x in keys if x != k]
        if k.startswith("성장"):
            return "성장", [x for x in keys if x != k]
    return None


def fit(bud, tag, a, h, cost):
    """예산 안에서 원본 비율을 지키며 가장 꽉 채우는 (ATK, HP).

    ⚠ 수호는 ATK 캡(코스트−1)이 있지만 상위 몸은 **캡을 한 단계 올려** 잡는다
       (원본 캡을 그대로 두면 예산을 HP 로만 쏟아 벽만 두꺼워진다).
    ⚠ ATK 0 인 원본(가시넝쿨·묘목)도 상위 몸은 최소 1 을 준다 — 안 그러면 성장해도
       아무 일이 안 일어나 보인다.
    """
    aw, hw, _ = G.W[tag]
    ratio = a / (a + h) if (a + h) else 0.18
    cap = cost if tag in ("수호", "비행수호") else 99   # 원본 캡(코스트−1)에서 한 단계만 올린다
    best = None
    for na in range(1, min(30, cap + 1)):
        for nh in range(1, 46):
            sp = aw * na + hw * nh
            if sp > bud:
                continue
            r2 = na / (na + nh)
            score = (bud - sp) * 3 + abs(r2 - ratio) * 26
            if best is None or score < best[0]:
                best = (score, na, nh)
    return best[1], best[2]


def build():
    out = {}
    rows = []
    for el, deck in G.DECKS.items():
        for (name, cost, tag, a, h, cp, keys) in deck["creatures"]:
            gk = grow_key(keys)
            if not gk:
                continue
            kind, rest = gk
            aw, hw, tadj = G.W[tag]
            mult, adj, text = G.kw_resolve(rest, cost)
            bud = round((G.cbase(cost) + tadj) * mult * G.rmult(name) * G.GROW_MULT) + adj
            na, nh = fit(bud, tag, a, h, cost)
            gname = f"{PREFIX[kind]} {name}"
            c = {"c": cost, "k": "cr", "cc": G.color_req(cost), "a": na, "h": nh,
                 "el": el, "kw": text, "grown": 1, "base": name, "from": kind}
            if tag in ("수호", "비행수호"):
                c["g"] = 1
            if tag in ("비행", "비행수호"):
                c["f"] = 1
            if tag == "관통":
                c["p"] = 1
            if G.rar(name) != "common":
                c["r"] = G.rar(name)
            out[gname] = c
            rows.append((el, name, f"{a}/{h}", gname, f"{na}/{nh}",
                         aw * na + hw * nh, bud, kind, text))
    return out, rows


def main():
    out, rows = build()
    print(f"{'속성':6} {'원본':12} {'원본스탯':7} {'상위 몸':16} {'스탯':7} {'소모/예산':10} 남은 키워드")
    print("-" * 92)
    for el, name, st, gname, gst, sp, bud, kind, text in rows:
        print(f"{el:6} {name:12} {st:7} {gname:16} {gst:7} {sp:>4}/{bud:<5} {text}")
    print(f"\n상위 몸 {len(out)}종 ({sum(1 for r in rows if r[7]=='성장')} 성장 · "
          f"{sum(1 for r in rows if r[7]=='진형')} 진형)")
    if "--write" in sys.argv:
        json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"→ {OUT}")


if __name__ == "__main__":
    main()
