#!/usr/bin/env python3
"""
gen_decks.py 의 DECKS 정의를 읽어 docs/sample_decks.html 을 생성한다.
설계 데이터가 한 곳(gen_decks.py)에만 있으므로 문서는 항상 검산 결과와 일치한다.

  python3 tools/build_deck_doc.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import gen_decks as G  # noqa: E402

ELHEX = {"fire": "#C1462E", "water": "#2A6FB5", "nature": "#3F8B3A", "steel": "#6B7686",
         "earth": "#8A6A33", "dark": "#5B3E86", "light": "#B8912A"}
KINDKO = {"creature": "크리처", "spell": "스펠", "enchant": "인챈트"}


def pips(cost, el):
    cc = G.color_req(cost)
    return ("".join(f'<i class="pip {el}"></i>' for _ in range(cc))
            + "".join('<i class="pip g"></i>' for _ in range(cost - cc)))


def deck_rows(el, deck):
    out = []
    for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
        sp, bd, dv, text = G.check_creature(c, tag, a, h, keys, nm)
        out.append((c, "creature", nm, tag, f"{a}/{h}", cp, text, f"{sp}/{bd}"))
    for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
        vv, rr, dv = G.check_spell(kind, val, ref, adj, nm)
        out.append((c, "spell", nm, kind, "—", cp, rule, f"{G.fmt(vv)}/{G.fmt(rr)}"))
    for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
        eff, tgt, dv = G.check_enchant(c, dr, E, C, scope, nm)
        out.append((c, "enchant", nm, dr, f"E{E}×C{C}", cp, rule, f"{eff:.0f}/{tgt}"))
    out.sort(key=lambda r: (r[0], {"creature": 0, "spell": 1, "enchant": 2}[r[1]]))
    return out


def build():
    parts = []
    for el, deck in G.DECKS.items():
        ko = G.KO[el]
        name_m, core, flow, note = G.MECH[el]
        rows = deck_rows(el, deck)
        curve = {}
        for c, *_rest in rows:
            curve[c] = curve.get(c, 0) + _rest[4]
        cvbars = "".join(
            f'<div class="cb"><span class="cbn">{k}</span>'
            f'<span class="cbar" style="height:{curve.get(k,0)*13+4}px;background:{ELHEX[el]}"></span>'
            f'<span class="cbv">{curve.get(k,0)}</span></div>' for k in range(1, 7))

        tr = []
        for (c, kind, nm, tag, stat, cp, rule, chk) in rows:
            tr.append(
                f'<tr><td class="mono nowrap">{pips(c, el)}</td>'
                f'<td>{nm}</td>'
                f'<td><span class="kd k-{kind}">{KINDKO[kind]}</span></td>'
                f'<td class="mono">{tag}</td>'
                f'<td class="mono">{stat}</td>'
                f'<td class="mono">×{cp}</td>'
                f'<td>{rule}</td>'
                f'<td class="mono ok">{chk}</td></tr>')

        parts.append(f'''
<h2 id="{el}"><span class="n">{el.upper()} — 견본 덱</span><span class="eldot" style="background:{ELHEX[el]}"></span>{ko} · {name_m}</h2>
<div class="mech" style="--c:{ELHEX[el]}">
  <div class="mrow"><span class="mk">핵심</span><span>{core}</span></div>
  <div class="mrow"><span class="mk">흐름</span><span>{flow}</span></div>
  <div class="mrow"><span class="mk">비용</span><span>{note}</span></div>
</div>
<div class="curve">{cvbars}<div class="cnote">20종 · 23장 + 지형 17 = 40장</div></div>
<div class="tbl-scroll"><table>
<thead><tr><th>코스트</th><th>이름</th><th>구분</th><th>태그</th><th>스탯</th><th>매수</th><th>효과</th><th>소모/예산</th></tr></thead>
<tbody>{"".join(tr)}</tbody></table></div>''')

    kwrows = "".join(
        f'<tr><td>{k}</td><td class="mono">{"×"+G.fmt(m) if m != 1.0 else "—"}</td>'
        f'<td class="mono">{("+" if a > 0 else "") + str(a) if a else "—"}</td><td>{t}</td></tr>'
        for k, (m, a, t) in G.KW.items())

    return HTML.replace("__DECKS__", "".join(parts)).replace("__KW__", kwrows)


HTML = r'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<title>TEN — 속성별 견본 덱 140종</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@700;900&family=Noto+Sans+KR:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#EDEFF2;--paper-2:#E3E6EB;--ink:#141821;--ink-soft:#4A5364;--ink-faint:#8A94A6;--rule:#C6CCD6;
  --fire:#C1462E;--water:#2A6FB5;--nature:#3F8B3A;--steel:#6B7686;--earth:#8A6A33;--dark:#5B3E86;--light:#B8912A;
  --ok:#0F8A80;--bad:#B03A3F;--warn:#B87400;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Noto Sans KR',sans-serif;
  -webkit-font-smoothing:antialiased;padding:20px 16px 80px;line-height:1.7}
.wrap{max-width:1080px;margin:0 auto}
h1{font-family:'Gothic A1';font-weight:900;font-size:clamp(26px,4vw,38px);letter-spacing:-.03em;line-height:1.1}
.lede{font-size:15px;color:var(--ink-soft);font-weight:300;max-width:68ch;margin:10px 0 6px}
.meta{font-family:'JetBrains Mono';font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
h2{font-family:'Gothic A1';font-weight:900;font-size:clamp(19px,2.4vw,24px);margin:46px 0 6px;padding-top:18px;border-top:2px solid var(--ink)}
h2 .n{font-family:'JetBrains Mono';font-size:11px;font-weight:500;color:var(--ink-faint);letter-spacing:.16em;display:block;margin-bottom:6px}
.eldot{display:inline-block;width:13px;height:13px;border-radius:50%;margin-right:8px;vertical-align:baseline}
h3{font-family:'Gothic A1';font-weight:700;font-size:15px;margin:22px 0 6px}
p{font-size:14px;color:var(--ink-soft);font-weight:300;max-width:70ch}
p b,td b,li b{color:var(--ink);font-weight:700}
ul{margin:8px 0 8px 18px}li{font-size:14px;color:var(--ink-soft);font-weight:300;margin:4px 0}
table{border-collapse:collapse;width:100%;font-size:13px;margin:12px 0}
th{text-align:left;font-family:'JetBrains Mono';font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-faint);padding:0 10px 8px 0;border-bottom:1.5px solid var(--ink);white-space:nowrap}
td{padding:7px 10px 7px 0;border-bottom:1px solid var(--rule);color:var(--ink-soft);vertical-align:middle}
td:nth-child(2){color:var(--ink);font-weight:700;white-space:nowrap}
.mono{font-family:'JetBrains Mono';font-variant-numeric:tabular-nums;white-space:nowrap}
.nowrap{white-space:nowrap}
.tbl-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ok{color:var(--ok);font-weight:700}.bad{color:var(--bad);font-weight:700}.warn{color:var(--warn);font-weight:700}
.box{border:1px solid var(--rule);border-left:5px solid var(--c,var(--ink));border-radius:6px;padding:14px 18px;margin:14px 0;background:var(--paper-2)}
.box .k{font-family:'JetBrains Mono';font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--c,var(--ink));font-weight:700}
.formula{font-family:'JetBrains Mono';font-size:12.5px;font-weight:500;background:var(--ink);color:var(--paper);
  padding:12px 16px;border-radius:4px;display:block;margin:10px 0;line-height:1.95;overflow-x:auto;white-space:pre-wrap}
.formula em{color:#5fd3c4;font-style:normal}
.pip{display:inline-block;width:13px;height:13px;border-radius:50%;margin-right:2px;vertical-align:middle}
.pip.g{background:transparent;border:1.5px solid var(--ink-faint)}
.pip.fire{background:var(--fire)}.pip.water{background:var(--water)}.pip.nature{background:var(--nature)}
.pip.steel{background:var(--steel)}.pip.earth{background:var(--earth)}.pip.dark{background:var(--dark)}.pip.light{background:var(--light)}
.kd{font-family:'JetBrains Mono';font-size:9.5px;letter-spacing:.06em;padding:2px 6px;border-radius:3px;font-weight:700;white-space:nowrap}
.k-creature{background:#141821;color:#EDEFF2}
.k-spell{background:#C6CCD6;color:#141821}
.k-enchant{background:transparent;color:#141821;box-shadow:inset 0 0 0 1.5px #141821}
.mech{border-left:5px solid var(--c);background:var(--paper-2);border-radius:6px;padding:12px 16px;margin:12px 0}
.mrow{display:flex;gap:12px;font-size:13.5px;color:var(--ink-soft);font-weight:300;margin:3px 0;line-height:1.6}
.mk{font-family:'JetBrains Mono';font-size:10px;letter-spacing:.14em;color:var(--c);font-weight:700;flex:0 0 34px;padding-top:4px}
.curve{display:flex;align-items:flex-end;gap:10px;margin:16px 0 4px;padding:10px 0;border-bottom:1px solid var(--rule)}
.cb{display:flex;flex-direction:column;align-items:center;gap:3px;width:34px}
.cbar{width:22px;border-radius:2px 2px 0 0;display:block}
.cbn,.cbv{font-family:'JetBrains Mono';font-size:10px;color:var(--ink-faint)}
.cbn{order:2}
.cbv{order:-1;color:var(--ink);font-weight:700}
.cnote{font-family:'JetBrains Mono';font-size:10.5px;color:var(--ink-faint);margin-left:auto;align-self:flex-end;padding-bottom:2px}
.nav{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0}
.nav a{font-family:'JetBrains Mono';font-size:11px;font-weight:700;text-decoration:none;color:#fff;padding:5px 11px;border-radius:3px}
</style>
</head>
<body>
<div class="wrap">

<div class="meta">TEN · SAMPLE DECKS · 2026.07</div>
<h1>속성별 견본 덱 — 역디자인 140종</h1>
<p class="lede">카드를 먼저 만들고 덱을 맞추는 대신, <b>덱이 굴러가는 메커니즘을 먼저 정하고 그 덱에 들어갈 카드를 만들었다.</b> 7속성 × 20종 = 140종. 각 속성은 지형 17장을 더해 그대로 40장 단색 덱이 된다.</p>

<div class="nav">
<a href="#fire" style="background:var(--fire)">불 · 연소</a>
<a href="#water" style="background:var(--water)">물 · 환류</a>
<a href="#nature" style="background:var(--nature)">자연 · 증식</a>
<a href="#steel" style="background:var(--steel)">강철 · 경화</a>
<a href="#earth" style="background:var(--earth)">대지 · 진형</a>
<a href="#dark" style="background:var(--dark)">어둠 · 대가</a>
<a href="#light" style="background:var(--light)">빛 · 가호</a>
</div>

<h2><span class="n">00 — 공통 골격</span>7속성이 같은 뼈대를 공유한다</h2>
<p>속성마다 카드는 다르지만 <b>구성 비율과 커브는 동일</b>하다. 이렇게 하면 속성 간 강약을 비교할 때 변수가 카드 효과 하나로 줄어든다.</p>
<span class="formula">20종 = 크리처 <em>11</em> · 스펠 <em>7</em> · 인챈트 <em>2</em>
23장 = 1코 <em>3</em> · 2코 <em>5</em> · 3코 <em>5</em> · 4코 <em>4</em> · 5코 <em>4</em> · 6코 <em>2</em>   (+ 지형 17 = 40장)
종수 = 1코 2 · 2코 4 · 3코 4 · 4코 4 · 5코 4 · 6코 2
×2 채용 = 1·2·3코에서 한 종씩 — 덱의 엔진 카드</span>
<p>스펠 7장의 자리도 고정이다. <b>1코 저코스트 요격 · 2코 시그니처 A · 3코 드로우 · 3코 시그니처 B · 4코 메커니즘 페이오프 · 5코 광역 또는 대형 · 6코 고코스트 요격.</b> 요격 티어 개정(오목 곡선)에 따라 확정 파괴는 전부 6코에 있고, 저코 요격은 2피해로 소형만 잡는다.</p>

<div class="box" style="--c:var(--ok)"><div class="k">검산</div>
<p><b>140종 전원 예산 정확히 일치.</b> <span class="mono">python3 tools/gen_decks.py</span> 로 재현할 수 있다. 표의 마지막 열은 <span class="mono">소모/예산</span>이며 두 값이 같아야 한다.</p></div>

<h2><span class="n">01 — 키워드 예산표</span>키워드가 스탯을 얼마에 사는가</h2>
<p>키워드는 배수와 가감 두 종류다. <b>배수를 먼저 곱하고 가감을 나중에 더한다.</b> 배수형(연소·증식)은 카드의 존재 조건 자체를 바꾸므로 예산 전체에 곱하고, 가감형은 정액 할인이다.</p>
<div class="tbl-scroll"><table>
<thead><tr><th>키워드</th><th>배수</th><th>가감</th><th>내용</th></tr></thead>
<tbody>__KW__</tbody></table></div>
<p class="lede" style="margin-top:12px">환산 기준: <b>1마나 ≈ 크리처 예산 4</b> · <b>HP 8 지불 = 1마나</b> · <b>드로우 1장 = 1.5마나</b>. 어둠의 <b>대가 N</b>이 예산을 <b>더하는</b> 유일한 키워드다 — HP를 마나로 바꿔 쓰기 때문이다.</p>

__DECKS__

<h2><span class="n">99 — 다음 작업</span>남은 것</h2>
<ul>
<li>140종을 <b>data/creatures.csv · spells.csv · enchants.csv</b> 로 승격 — 현재는 <span class="mono">data/sample_decks.csv</span> 에만 있다.</li>
<li>프로토타입 DECKLIST를 속성별 단색 덱 7종으로 교체하고 덱 선택 UI 추가.</li>
<li>속성 간 상성 시뮬레이션 — 7×7 대전으로 승률을 뽑아 메커니즘 강도를 조정.</li>
<li>기존 20종 중 이름이 겹치는 카드(석벽·창병·장군·파괴자·그리핀·검사·기사·파수병·방벽병·성화)는 이 표를 정본으로 삼는다.</li>
</ul>

</div>
</body>
</html>
'''


def main():
    out = os.path.join(ROOT, "docs", "sample_decks.html")
    open(out, "w", encoding="utf-8").write(build())
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
