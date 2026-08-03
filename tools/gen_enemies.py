#!/usr/bin/env python3
"""
원정(로그라이크) 모드의 **적 명단과 적별 덱**을 만든다. → data/enemies.json

구조 (2026-08 확정)
  속성 7종 × (일반 3 · 정예 1 · 보스 1) = 35명.
  적마다 **난이도 단계 3개**의 덱을 따로 들고 있다. 진행도가 오르면 같은 적이라도
  더 무거운 덱과 더 많은 강화 카드를 들고 나온다.

  체력도 난이도를 따라 오른다 — 기본 일반 20 · 정예 30 · 보스 60, 층당 가산.
  (플레이어 HP는 원정 내내 이어지므로 적 체력만 이렇게 낮게 잡는다. 슬레이 더 스파이어 방식)

덱은 손으로 35×3=105개를 적지 않는다. **아키타입(곡선 + 선호도)** 에서 뽑아내고
결과를 JSON에 그대로 굳혀 둔다 — 뽑는 규칙은 여기서 고치고, 결과는 데이터로 검토한다.

  python3 tools/gen_enemies.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")

# ── 아키타입 ────────────────────────────────────────────────
# 코스트별 매수(합 23). 한 종당 2장 상한이라 1코·6코는 종이 2개뿐 → 최대 4장.
CURVES = {
    "rush":  {1: 4, 2: 7, 3: 6, 4: 4, 5: 2, 6: 0},
    "swarm": {1: 4, 2: 6, 3: 6, 4: 4, 5: 2, 6: 1},
    "spell": {1: 3, 2: 5, 3: 5, 4: 4, 5: 4, 6: 2},
    "wall":  {1: 2, 2: 4, 3: 5, 4: 5, 5: 5, 6: 2},
    "fatty": {1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 3},
    "boss":  {1: 2, 2: 4, 3: 4, 4: 5, 5: 5, 6: 3},
}
ARCH_KO = {"rush": "속공", "swarm": "군세", "spell": "주문", "wall": "방벽",
           "fatty": "거물", "boss": "보스"}
CAP = {1: 4, 2: 8, 3: 8, 4: 8, 5: 8, 6: 4}     # 코스트별 뽑을 수 있는 최대 매수
COPY = 2                                        # 동명 상한

# 난이도 단계별 곡선 이동 — 저코 n장을 고코로 옮긴다
BAND_SHIFT = [0, 2, 4]
# 난이도 단계 × 등급별 강화 카드 매수
OVER_N = {"normal": [0, 2, 4], "elite": [4, 6, 8], "boss": [8, 9, 10]}
# 층 → 난이도 단계 경계 (0~2층=1단계 · 3~6층=2단계 · 7층~=3단계)
BANDS = [0, 3, 7]
# 등급별 체력 [기본, 층당 가산]
HP = {"normal": [20, 1.5], "elite": [30, 2.0], "boss": [60, 2.0]}


# 난이도 단계 → 희귀도 선호. 단계가 오를수록 상위 희귀도를 더 많이 집는다.
# (아키타입 점수에 그대로 더한다 — 점수 1은 '이 카드가 조금 더 잘 맞는다' 정도의 크기다)
RAR_BONUS = {
    0: {"common":  0.6, "uncommon":  0.0, "rare": -0.9, "legendary": -1.8},
    1: {"common":  0.0, "uncommon":  0.5, "rare":  0.6, "legendary":  0.0},
    2: {"common": -0.6, "uncommon":  0.3, "rare":  1.2, "legendary":  2.4},
}


def score(c, arch, band=None):
    """이 카드가 아키타입에 얼마나 맞는가. band 를 주면 희귀도 선호를 더한다."""
    base = _arch_score(c, arch)
    if band is None:
        return base
    return base + RAR_BONUS[band].get(c.get("r") or "common", 0.0)


def _arch_score(c, arch):
    kw = c.get("kw") or ""
    cr, sp, en = c["k"] == "cr", c["k"] == "sp", c["k"] == "en"
    a, h = c.get("a", 0), c.get("h", 0)
    g, f, p = bool(c.get("g")), bool(c.get("f")), bool(c.get("p"))
    swarmy = ("증식" in kw) or (c.get("mode") == "summon")
    if arch == "rush":
        return 3 * cr + 1.2 * a - 0.4 * h + (1.0 if (f or p) else 0) - (1.5 if g else 0)
    if arch == "swarm":
        return 2.5 * cr + 3.0 * swarmy + 0.7 * a - 0.2 * h
    if arch == "spell":
        return 3.5 * sp + 2.0 * en + 0.5 * cr + 0.2 * a
    if arch == "wall":
        return 2.0 * cr + 3.0 * g + 0.8 * h + 0.2 * a
    if arch == "fatty":
        return 2.0 * cr + 0.55 * (a + h)
    if arch == "boss":
        return 1.5 * cr + 1.2 * sp + 0.45 * (a + h) + 1.0 * g
    return 0.0


def shift_curve(curve, n):
    """저코 n장을 고코로 옮긴다 (난이도 단계).

    ⚠ 무조건 1코부터 빼서 6코에 몰아주면 **아키타입이 뭉개진다**
    (속공 덱이 1코 0장 · 6코 4장이 되는 식). 그래서 빼는 쪽도 주는 쪽도
    그 아키타입이 원래 갖고 있던 비중에 비례해서 움직인다 — 곡선은 무거워지되 모양은 남는다.
    """
    cv = dict(curve)
    if n <= 0:
        return cv

    def spread(buckets, total, sign):
        w = {c: max(cv.get(c, 0), 0) for c in buckets}
        if sign > 0:                      # 주는 쪽 — 0인 칸도 조금은 받게
            w = {c: w[c] + 1 for c in buckets}
        s = sum(w.values()) or 1
        share = {c: int(total * w[c] / s) for c in buckets}
        while sum(share.values()) < total:        # 나머지는 비중 큰 칸부터
            c = max(buckets, key=lambda x: (w[x] - share[x] * s / total, x))
            share[c] += 1
        return share

    take = spread((1, 2, 3), n, -1)
    for c, k in take.items():
        cv[c] = max(0, cv.get(c, 0) - k)
    give = spread((4, 5, 6), n, +1)
    left = 0
    for c, k in give.items():
        room = CAP[c] - cv.get(c, 0)
        put = min(k, room)
        cv[c] = cv.get(c, 0) + put
        left += k - put
    for c in (5, 4, 3):                    # 상한에 막힌 몫은 아래로 흘린다
        while left > 0 and cv.get(c, 0) < CAP[c]:
            cv[c] = cv.get(c, 0) + 1
            left -= 1
    return cv


def build_deck(pool, kinds, arch, band):
    """아키타입 곡선대로 23장을 고른다. 못 채운 몫은 이웃 코스트로 흘린다."""
    curve = shift_curve(CURVES[arch], BAND_SHIFT[band])
    by_cost = {}
    for n in kinds:
        by_cost.setdefault(pool[n]["c"], []).append(n)
    for c in by_cost:
        by_cost[c].sort(key=lambda n: (-score(pool[n], arch, band), n))

    picked = {}

    def take(cost, want):
        """이 코스트에서 want장을 뽑고, 못 뽑은 수를 돌려준다."""
        for n in by_cost.get(cost, []):
            while want > 0 and picked.get(n, 0) < COPY:
                picked[n] = picked.get(n, 0) + 1
                want -= 1
            if want == 0:
                break
        return want

    left = 0
    for cost in (1, 2, 3, 4, 5, 6):
        left += take(cost, curve.get(cost, 0))
    # 남은 몫 — 아키타입 선호가 높은 순으로 아무 코스트에서나 채운다
    if left:
        rest = sorted(kinds, key=lambda n: (-score(pool[n], arch, band), pool[n]["c"], n))
        for n in rest:
            while left > 0 and picked.get(n, 0) < COPY:
                picked[n] = picked.get(n, 0) + 1
                left -= 1
            if left == 0:
                break

    return picked


def to_list(picked, pool):
    return sorted(([n, c] for n, c in picked.items()),
                  key=lambda x: (pool[x[0]]["c"], x[0]))


def apply_over(picked, over_pool, tier, band, pool):
    """강화 카드로 치환. 비싼 카드부터 바꿔야 체감이 크다."""
    k = OVER_N[tier][band]
    if not k:
        return picked
    out = dict(picked)
    order = sorted(out, key=lambda n: (-pool[n]["c"], n))
    for n in order:
        if k <= 0:
            break
        o = "강화 " + n
        if o not in over_pool:
            continue
        move = min(out[n], k)
        out[n] -= move
        if out[n] == 0:
            del out[n]
        out[o] = out.get(o, 0) + move
        k -= move
    return out


# ── 적 명단 ─────────────────────────────────────────────────
# (id접미, 이름, 등급, 아키타입, 아트 모티프, 한 줄 소개)
ROSTER = {
    "fire": [
        ("goblin",  "사나운 고블린",   "normal", "rush",  "sword",
         "작고 빠르고 겁이 없다. 불붙은 몸으로 달려든다."),
        ("arson",   "잿불 방화범",     "normal", "swarm", "firerain",
         "제 몸에 불을 붙여 던진다. 꺼지기 전에 하나라도 더."),
        ("karin",   "화염술사 카린",   "normal", "spell", "burst",
         "손끝에서 불을 쏜다. 보드를 비우고 시작한다."),
        ("grok",    "용암 대장 그록",  "elite",  "fatty", "axe",
         "느리지만 한 대가 무겁다. 버티면 진다."),
        ("ignis",   "겁화룡 이그니스", "boss",   "boss",  "wyvern",
         "화산 그 자체. 판이 길어질수록 불리하다."),
    ],
    "water": [
        ("newt",    "늪지 도롱뇽떼",   "normal", "swarm", "thrust",
         "죽어도 손으로 돌아온다. 끝없이 다시 온다."),
        ("morgan",  "해적 선장 모르간", "normal", "spell", "flag",
         "때린 걸 되돌린다. 템포를 훔치는 자."),
        ("coral",   "산호 파수꾼",     "normal", "wall",  "shield",
         "깨지지 않는 벽. 밀어붙일 수단이 없으면 길어진다."),
        ("naia",    "심해 무녀 나이아", "elite",  "spell", "star",
         "판을 읽고 지운다. 결정타를 아껴야 한다."),
        ("tiamat",  "해신 티아마트",   "boss",   "boss",  "wyvern",
         "조수를 부린다. 내 보드가 계속 손으로 돌아간다."),
    ],
    "nature": [
        ("wolves",  "굶주린 늑대 무리", "normal", "rush",  "arrow",
         "숫자로 덤빈다. 초반에 밀리면 회복이 안 된다."),
        ("spore",   "포자 마녀",       "normal", "swarm", "awaken",
         "한 마리가 둘이 되고 둘이 넷이 된다. 광역이 답."),
        ("warden",  "늙은 나무지기",   "normal", "wall",  "wall",
         "가만히 서서 자란다. 오래 두면 손을 못 댄다."),
        ("silvan",  "덩굴군주 실반",   "elite",  "fatty", "griffin",
         "매 턴 커진다. 지금 못 잡으면 나중엔 못 잡는다."),
        ("yggdra",  "세계수 이그드라", "boss",   "boss",  "banner",
         "숲 전체가 적. 자라기 전에 끝내야 한다."),
    ],
    "steel": [
        ("rusty",   "녹슨 파수병",     "normal", "wall",  "shield",
         "낡았지만 단단하다. 잔공격이 통하지 않는다."),
        ("bran",    "용병대장 브란",   "normal", "rush",  "sword",
         "칼을 계속 벼린다. 한 놈이 위협으로 자란다."),
        ("miner",   "파쇄 광부",       "normal", "spell", "axe",
         "부수는 데 특화됐다. 내 인챈트가 오래 못 산다."),
        ("captain", "강철 기사단장",   "elite",  "fatty", "helmet",
         "중장비로 밀고 들어온다. 경화 앞에서 잔딜은 무의미."),
        ("ironhold", "요새 아이언홀드", "boss",  "boss",  "wall",
         "성벽이 걸어온다. 뚫을 한 방이 필요하다."),
    ],
    "earth": [
        ("golem",   "돌덩이 골렘",     "normal", "wall",  "wall",
         "앞자리에 서면 더 단단해진다. 진형을 깨야 한다."),
        ("karg",    "산적 두목 카르그", "normal", "rush",  "spear",
         "수호를 무시하고 얼굴을 때린다. 막을 수가 없다."),
        ("foreman", "채석장 감독",     "normal", "swarm", "helmet",
         "인부를 계속 부른다. 머릿수로 밀어붙인다."),
        ("brutan",  "공성 대장 브루탄", "elite",  "fatty", "thrust",
         "관통 거물. 벽을 세워도 소용없다."),
        ("terra",   "대지의 군주 테라", "boss",   "boss",  "banner",
         "땅이 흔들린다. 앞열이 통째로 날아간다."),
    ],
    "dark": [
        ("wraith",  "굶주린 망령",     "normal", "rush",  "exec",
         "제 피를 태워 달려든다. 빠르고 얇다."),
        ("bats",    "흡혈박쥐 무리",   "normal", "swarm", "wings",
         "때릴수록 회복한다. 오래 끌면 못 이긴다."),
        ("digger",  "시체 도굴꾼",     "normal", "spell", "awaken",
         "죽은 것을 값싸게 쓴다. 소모전에 강하다."),
        ("mord",    "흑기사 모르드",   "elite",  "fatty", "helmet",
         "HP를 내주고 괴물을 꺼낸다. 위협이 앞선다."),
        ("balak",   "피의 군주 발라크", "boss",   "boss",  "exec",
         "제 목숨을 연료로 쓴다. 체력이 곧 화력이다."),
    ],
    "light": [
        ("acolyte", "신전 시종",       "normal", "swarm", "star",
         "숫자와 축복. 조금씩 회복하며 늘어난다."),
        ("squad",   "성전사 소대",     "normal", "wall",  "shield",
         "방패를 겹쳐 세운다. 정직하게 단단하다."),
        ("healer",  "순회 치유사",     "normal", "spell", "awaken",
         "계속 회복한다. 화력이 모자라면 이길 수 없다."),
        ("seraph",  "심판자 세라핌",   "elite",  "fatty", "wings",
         "한 번 죽어도 살아난다. 제거 한 장이 헛돈다."),
        ("archon",  "광휘의 대천사",   "boss",   "boss",  "hawk",
         "빛으로 지운다. 회복과 가호를 동시에 뚫어야 한다."),
    ],
}
# ── 손으로 짠 고정 덱 ────────────────────────────────────────
# 아키타입 점수로 자동 생성하는 대신 **덱을 통째로 지정**한다. 컨셉이 분명한 적에게 쓴다.
# ⚠ 골격은 그대로 지켜야 한다 — 23장 · 커브 1코3·2코5·3코5·4코4·5코4·6코2 · 동명 2장 상한.
#    난이도 단계별 강화 카드 치환(apply_over)은 고정 덱에도 그대로 걸린다.
# ⚠ 지형을 여러 종류 쓸 수 있다. 프로토타입의 rgFight 가 `lands` 를 보고 그대로 깐다.
# ── 적별 고정 덱 ────────────────────────────────────────────
# `cards` 는 **난이도 단계별 목록**이다(0=1단계 · 1=2단계 · 2=3단계).
# 적어 두지 않은 단계는 바로 앞 단계를 그대로 쓴다.
#
# ⚠⚠ **고정 덱에는 '강화 카드' 치환(apply_over)을 걸지 않는다.** 강화 카드는
#    "같은 카드인데 수치만 큰 것" 이라 컨셉 덱에서는 단계가 올라도 하는 일이 안 변한다.
#    대신 단계마다 **새 카드를 넣어** 덱이 무엇을 하는지 자체를 바꾼다.
# ⚠ 플레이어 골격(20종 · 커브 1코3~6코2)을 따르지 않는다 — 컨셉이 곧 커브다.
#    동명 2장 상한도 적용하지 않는다(기본 지형 17장과 같은 취급).
# ⚠⚠ 2026-08 **고정 적 덱 5종을 통째로 비웠다.**
#   사나운 고블린 · 잿불 방화범 · 화염술사 카린 · 용암 대장 그록 · 겁화룡 이그니스.
#   불 덱을 전면 교체하면서 이 덱들이 쓰던 카드(홍염·이그니스·용의 숨결·도화선·불사조의 깃털·
#   고블린 전차·화염 아귀 …)가 카드째 사라졌다. 카드가 없는 고정 덱은 빈 덱이 되므로 같이 내렸다.
#   ⚠ 장치는 그대로 살아 있다 — 여기에 다시 항목을 적으면 그날로 돌아온다.
#     항목 형태: {"name":…, "lands":[(지형,장수)…], "cards":{밴드:[(카드,장수)…]}, "opener":…}
#     빈 dict 이면 모든 적이 **생성 덱**(속성 카드 풀에서 뽑아 만든 덱)을 쓴다.
FIXED = {}


def fixed_cards(fx, band):
    """고정 덱의 단계별 카드 목록. 적어 두지 않은 단계는 앞 단계를 그대로 쓴다."""
    tbl = fx["cards"]
    for b in range(band, -1, -1):
        if b in tbl:
            return tbl[b]
    raise KeyError("고정 덱에 1단계 목록이 없다")


def main():
    pool = json.load(open(os.path.join(DATA, "cards.json"), encoding="utf-8"))["pool"]
    decks = json.load(open(os.path.join(DATA, "decks.json"), encoding="utf-8"))
    rpath = os.path.join(DATA, "rogue.json")
    over_pool = json.load(open(rpath, encoding="utf-8"))["over"] if os.path.exists(rpath) else {}

    out = []
    for el, rows in ROSTER.items():
        kinds = [n for n, _ in decks[el]["cards"]]
        land = next(n for n, _ in decks[el]["lands"])
        for (sid, name, tier, arch, art, desc) in rows:
            eid = f"{el}_{sid}"
            fx = FIXED.get(eid)
            variants = []
            for band in range(3):
                if fx:
                    # 고정 덱은 강화 카드 치환을 받지 않는다 — 단계별 카드 목록이 그 역할을 한다
                    picked = {n: c for n, c in fixed_cards(fx, band)}
                else:
                    picked = apply_over(build_deck(pool, kinds, arch, band),
                                        over_pool, tier, band, pool)
                variants.append(to_list(picked, {**pool, **over_pool}))
            ent = {
                "id": eid, "el": el, "tier": tier, "name": name,
                "style": ARCH_KO[arch], "arch": arch, "art": art, "desc": desc,
                "land": land, "decks": variants,
            }
            if fx:
                ent["lands"] = [list(x) for x in fx["lands"]]
                ent["fixed"] = 1
                # 첫 패 보정 — 카드 효과가 아니라 '이 적은 늘 이걸 쥐고 시작한다' 는 규칙이다
                if fx.get("opener"):
                    ent["opener"] = fx["opener"]
            out.append(ent)
            n0 = sum(c for _, c in variants[0])
            assert n0 == 23, f"{name} 1단계 {n0}장"

    data = {"list": out, "hp": HP, "bands": BANDS, "overN": OVER_N}
    path = os.path.join(DATA, "enemies.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    print(f"적 {len(out)}명 (속성 7 × 일반3·정예1·보스1) → {path} "
          f"({os.path.getsize(path)/1024:.0f} KB)")
    for el in ROSTER:
        row = [e for e in out if e["el"] == el]
        print(f"  {el:<7} " + " · ".join(f"{e['name']}({e['style']})" for e in row))
    # 표본
    e = out[0]
    print(f"\n  표본 — {e['name']} 난이도 3단계 덱:")
    for n, c in e["decks"][2]:
        print(f"    {n} ×{c}")


if __name__ == "__main__":
    main()
