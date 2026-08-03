#!/usr/bin/env python3
"""
카드 뷰어 페이지(cards/index.html)를 만든다. (멱등)

  python3 tools/build_cards_page.py

핵심 원칙 — **카드는 프로토타입이 그리는 것을 그대로 쓴다.**
뷰어용으로 카드를 다시 그리지 않는다. 규격이 두 벌이 되면 반드시 어긋난다
(예전 tools/card_gallery.html 이 실제로 그렇게 낡아 버렸다).
그래서 prototype/index.html 에서 아래를 **잘라다 붙인다**:

  <style>…</style>                  카드 CSS 전부 (게임 레이아웃은 뒤에서 덮어쓴다)
  /* ELEM_START … ELEM_END */       EL(속성) · CE(카드→속성) · TI(타입 아이콘)
  /* ART_START … ART_END */         ART(일러스트)
  /* POOL_START … POOL_END */       POOL · GLOSSARY · FRAMES · ORBS · ROGUE · ENEMY
  /* LAND_START … LAND_END */       LANDS · DECKS
  /* CARDJS_START … CARDJS_END */   frameKey/frameVars/frameCardHTML/tcardHTML
  landCardHTML / glossaryFor        (이름으로 찾아 함수 한 덩어리씩)

프로토타입의 카드 마크업이 바뀌면 이 스크립트를 다시 돌리기만 하면 된다.
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROTO = os.path.join(ROOT, "prototype", "index.html")
OUT = os.path.join(ROOT, "cards", "index.html")


def block(src, name):
    """/* NAME_START */ … /* NAME_END */ 사이를 통째로 가져온다."""
    m = re.search(r"/\* %s_START \*/(.*?)/\* %s_END \*/" % (name, name), src, re.S)
    if not m:
        raise SystemExit(f"마커 {name}_START/END 를 찾지 못했다 — 프로토타입 구조가 바뀌었나?")
    return m.group(1).strip()


def func(src, name):
    """`function name(` 부터 그 함수의 닫는 중괄호(열 0의 '}')까지."""
    i = src.index("function %s(" % name)
    j = src.index("\n}", i)
    return src[i:j + 2]


def head_style(src):
    """⚠ 프로토타입에는 `<noscript><style>…</style></noscript>` 가 **먼저** 나온다.
    첫 <style> 만 집으면 그 한 줄짜리 예비 스타일만 가져와 카드가 통째로 민무늬로 나온다
    (실제로 그렇게 만들었다가 잡았다). 모든 <style> 을 이어 붙인다."""
    blocks = re.findall(r"<style>(.*?)</style>", src, re.S)
    if not blocks:
        raise SystemExit("<style> 을 찾지 못했다")
    return "\n".join(blocks)


PAGE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="dark only">
<title>TEN — 카드 목록</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&family=Gowun+Batang:wght@400;700&family=Gothic+A1:wght@400;700;900&display=swap" rel="stylesheet">
<style>
/* ── 프로토타입에서 그대로 가져온 카드 CSS ─────────────────────────
   ⚠ 손대지 말 것. 여기를 고치면 게임과 카드 규격이 어긋난다.
      바꿀 일이 있으면 prototype/index.html 을 고치고 이 스크립트를 다시 돌린다. */
__PROTO_CSS__
</style>
<style>
/* ── 뷰어 전용 덮어쓰기 ───────────────────────────────────────────
   프로토타입 CSS 는 '한 화면에서 끝나는 게임 판'을 전제로 html/body 를 잠근다.
   목록은 세로로 길게 스크롤해야 하므로 그 부분만 되돌린다. */
html,body{overflow:visible;height:auto;touch-action:auto}
body{padding:0;display:block}
.cwrap{max-width:1240px;margin:0 auto;padding:18px 14px calc(40px + env(safe-area-inset-bottom))}

h1{font-family:'Cinzel Decorative','Cinzel',serif;font-weight:900;font-size:26px;
  letter-spacing:.04em;color:var(--gold-bright);text-shadow:0 0 18px rgba(242,212,136,.35)}
.csub{font-family:'Cinzel',serif;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--gold);opacity:.75;margin:5px 0 16px}
.csub a{color:var(--gold-bright)}

/* 필터 줄 */
.cbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.cbar .lbl2{margin-right:2px}
.chip{font-family:'Cinzel',serif;font-size:11.5px;font-weight:700;letter-spacing:.08em;
  padding:7px 13px;border-radius:20px;cursor:pointer;white-space:nowrap;
  border:1px solid var(--rule);background:rgba(20,14,8,.6);color:var(--gold);
  display:inline-flex;align-items:center;gap:6px;min-height:36px}
.chip:hover{border-color:var(--gold)}
.chip.on{background:linear-gradient(180deg,#3a2a12,#241809);border-color:var(--gold-bright);color:var(--gold-bright)}
.chip i{width:9px;height:9px;border-radius:50%;background:var(--dot,var(--gold));display:inline-block}
.chip .n{font-family:'Gothic A1',sans-serif;font-size:10px;opacity:.65;font-weight:700}
.csearch{flex:1;min-width:150px;font-family:'Gowun Batang',serif;font-size:13px;
  padding:8px 12px;border-radius:20px;border:1px solid var(--rule);
  background:rgba(10,7,4,.7);color:var(--parch);min-height:36px}
.csearch::placeholder{color:var(--ink-faint)}

/* 덱 묶음 */
.dsec{margin:22px 0 8px;padding-top:14px;border-top:1px solid var(--rule)}
.dsec h2{font-family:'Cinzel',serif;font-weight:700;font-size:15px;letter-spacing:.12em;
  color:var(--c,var(--gold-bright));display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.dsec h2 .ko{font-family:'Gowun Batang',serif;font-size:17px;font-weight:700;color:#fff;letter-spacing:0}
.dsec h2 .cnt{font-family:'Gothic A1',sans-serif;font-size:10.5px;font-weight:700;
  color:var(--gold);opacity:.7;letter-spacing:.04em}
.dsec .core{font-family:'Gowun Batang',serif;font-size:12px;line-height:1.7;
  color:var(--parch-2);opacity:.85;margin-top:6px;max-width:70ch}

/* 카드 격자 — 카드 폭은 --cardw 하나가 정한다(게임과 같은 규격) */
.cgrid{display:grid;gap:14px 10px;margin-top:14px;
  grid-template-columns:repeat(auto-fill,minmax(var(--cardw),1fr));justify-items:center}
.cell{width:var(--cardw);cursor:pointer;position:relative}
.cell .tcard{--cw:var(--cardw)}
.cell:hover .tcard{border-color:var(--gold-bright);box-shadow:0 6px 18px rgba(0,0,0,.6)}
.cell .cnum{position:absolute;top:-6px;right:-4px;z-index:5;
  font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:.04em;
  padding:1px 6px;border-radius:10px;border:1px solid var(--bronze);
  background:rgba(8,5,3,.92);color:var(--gold-bright)}
.cell .cdecks{margin-top:4px;font-family:'Gothic A1',sans-serif;font-size:9px;font-weight:700;
  letter-spacing:.02em;color:var(--gold);opacity:.7;text-align:center;line-height:1.4}
:root{--cardw:clamp(112px,15vw,150px)}
@media (max-width:520px){ :root{--cardw:clamp(104px,30vw,140px)} .cgrid{gap:12px 8px} }

.empty2{font-family:'Gowun Batang',serif;color:var(--ink-faint);padding:30px 0;text-align:center}
/* 확대 — 프로토타입의 .zoom 을 그대로 쓴다 */
.zoom{cursor:pointer}
</style>
</head>
<body>
<div class="cwrap">
  <h1>TEN — 카드 목록</h1>
  <div class="csub">전체 <b id="tot">0</b>종 · 속성 덱 7종 &nbsp;·&nbsp; <a href="../prototype/">게임으로</a></div>

  <div class="cbar" id="elBar"></div>
  <div class="cbar">
    <span class="lbl2">종류</span>
    <span id="kBar" style="display:contents"></span>
    <input class="csearch" id="q" placeholder="이름·효과 검색">
  </div>

  <div id="list"></div>
</div>
<div class="zoom" id="zoom"></div>

<script>
__PROTO_JS__

/* ── 뷰어 ───────────────────────────────────────────────────────── */
/* 카드가 어느 덱에 몇 장 들어가는지 미리 뒤집어 둔다 (카드 → [[덱, 장수], …]) */
/* DECKS[el].list = [[카드이름, 장수], …] 이고 지형도 같은 목록에 들어 있다. */
const DECKOF={};
Object.keys(DECKS).forEach(el=>{
  (DECKS[el].list||[]).forEach(([n,c])=>{ (DECKOF[n]=DECKOF[n]||[]).push([el,c]); });
});
const KINDS=[['all','전체'],['cr','크리처'],['sp','스펠'],['en','인챈트'],['land','지형']];
let F={el:'all',k:'all',q:''};

function elChip(el,on){
  const e=EL[el]||{};
  return `<button class="chip${on?' on':''}" data-el="${el}" style="--dot:${e.c||'#c9a24b'}">`
    +`<i></i>${e.ko||'전체'}<span class="n">${countOf(el)}</span></button>`;
}
function countOf(el){
  if(el==='all')return Object.keys(POOL).length+Object.keys(LANDS).length;
  const d=DECKS[el]; return d?(d.list||[]).length:0;
}
function renderBars(){
  document.getElementById('elBar').innerHTML=
    `<button class="chip${F.el==='all'?' on':''}" data-el="all">전체<span class="n">${countOf('all')}</span></button>`
    +Object.keys(DECKS).map(el=>elChip(el,F.el===el)).join('');
  document.getElementById('kBar').innerHTML=KINDS.map(([k,ko])=>
    `<button class="chip${F.k===k?' on':''}" data-k="${k}">${ko}</button>`).join('');
  document.querySelectorAll('#elBar .chip').forEach(b=>b.onclick=()=>{F.el=b.dataset.el;draw();});
  document.querySelectorAll('#kBar .chip').forEach(b=>b.onclick=()=>{F.k=b.dataset.k;draw();});
}
function kindOf(n){ return LANDS[n]?'land':(POOL[n]||{}).k; }
function hit(n){
  if(F.k!=='all'&&kindOf(n)!==F.k)return false;
  if(!F.q)return true;
  const c=POOL[n]||{};
  return (n+' '+(c.kw||'')+' '+(c.d||'')).toLowerCase().includes(F.q);
}
function cellHTML(n,copies){
  const html=LANDS[n]?landCardHTML(n,'md'):tcardHTML(n,{size:'md'});
  /* 덱별로 묶어 보여 주므로 소속 표시는 **두 덱 이상**일 때만 의미가 있다. 아니면 군더더기다. */
  const d=DECKOF[n]||[];
  const decks=d.length>1?d.map(([e,c])=>`${(EL[e]||{}).ko||e}×${c}`).join(' · ')
             :(d.length?'':'덱 미수록');
  return `<div class="cell" data-n="${n}">${copies?`<span class="cnum">×${copies}</span>`:''}`
    +`${html}${decks?`<div class="cdecks">${decks}</div>`:''}</div>`;
}
function section(el){
  const d=DECKS[el]; if(!d)return '';
  /* 지형이 먼저 오도록 정렬한다(덱 목록의 첫 항목이 지형) — 그 뒤는 코스트 순. */
  const rows=(d.list||[]).filter(([n])=>hit(n)).slice().sort((a,b)=>{
    const la=LANDS[a[0]]?0:1, lb=LANDS[b[0]]?0:1;
    if(la!==lb)return la-lb;
    const ca=(POOL[a[0]]||{}).c||0, cb=(POOL[b[0]]||{}).c||0;
    if(ca!==cb)return ca-cb;
    const ka={cr:0,sp:1,en:2}, A=ka[(POOL[a[0]]||{}).k]??3, B=ka[(POOL[b[0]]||{}).k]??3;
    return A-B||a[0].localeCompare(b[0]);
  });
  if(!rows.length)return '';
  const c=(EL[el]||{}).c||'#c9a24b';
  const total=rows.reduce((a,[,x])=>a+x,0);
  return `<div class="dsec" style="--c:${c}">
    <h2><span class="ko">${(EL[el]||{}).ko}</span>${d.name}
      <span class="cnt">${rows.length}종 · ${total}장</span></h2>
    <div class="core">${d.core||''}</div>
    <div class="cgrid">${rows.map(([n,cnt])=>cellHTML(n,cnt)).join('')}</div>
  </div>`;
}
function draw(){
  renderBars();
  const box=document.getElementById('list');
  let h='';
  if(F.el==='all'){
    h=Object.keys(DECKS).map(section).join('');
  } else {
    h=section(F.el);
  }
  box.innerHTML=h||'<div class="empty2">조건에 맞는 카드가 없습니다.</div>';
  document.getElementById('tot').textContent=Object.keys(POOL).length+Object.keys(LANDS).length;
  box.querySelectorAll('.cell').forEach(el=>el.onclick=()=>openZoom(el.dataset.n));
}
/* 확대 — 게임의 확대 화면과 같은 규격(lg) + 용어 설명 */
function openZoom(n){
  const z=document.getElementById('zoom');
  const card=LANDS[n]?landCardHTML(n,'lg'):tcardHTML(n,{size:'lg'});
  z.innerHTML=`<div class="zwrap">${card}${LANDS[n]?'':glossaryFor(n,null)}</div>`
    +'<div class="zhint">아무 곳이나 눌러 닫기</div>';
  z.classList.add('on');
}
document.getElementById('zoom').onclick=()=>{
  const z=document.getElementById('zoom'); z.classList.remove('on'); z.innerHTML='';
};
document.getElementById('q').oninput=e=>{F.q=e.target.value.trim().toLowerCase();draw();};
draw();
</script>
</body>
</html>
"""


def main():
    src = open(PROTO, encoding="utf-8").read()
    css = head_style(src)
    js = "\n".join([
        block(src, "ELEM"),
        block(src, "ART"),
        block(src, "POOL"),
        block(src, "LAND"),
        "const isLand=n=>!!LANDS[n];",
        block(src, "CARDJS"),
        func(src, "landCardHTML"),
        func(src, "glossaryFor"),
    ])
    out = PAGE.replace("__PROTO_CSS__", css).replace("__PROTO_JS__", js)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(out)
    kb = len(out.encode("utf-8")) / 1024
    print(f"카드 뷰어 생성: cards/index.html ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
