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

원정 모드 적 덱도 같은 데이터(ENEMY)로 보여 준다 — 적마다 난이도 단계별 덱이 3벌씩 들어 있다.

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
<!-- 앱(PWA) — 게임과 **별개의 앱**으로 깔린다. scope 가 /cards/ 라 홈 화면 아이콘도 따로 생긴다. -->
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#120d09">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TEN 카드">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
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
/* 효과 태그 줄 — 고른 태그의 규칙 설명을 바로 아래에 한 줄로 편다(용어집과 같은 문장) */
.chip.tg{font-family:'Gothic A1',sans-serif;font-size:12px;letter-spacing:0;padding:6px 11px;min-height:32px}
.tagdesc{font-family:'Gowun Batang',serif;font-size:12.5px;line-height:1.6;color:var(--gold);
  opacity:.9;margin:-4px 0 12px;padding:9px 12px;border-radius:6px;
  border:1px solid var(--rule);border-left:3px solid var(--dot,var(--gold));background:#150e08;display:none}
.tagdesc b{color:var(--gold-bright)}
.tagdesc.on{display:block}

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
/* 주력 카드 — 게임의 '적 조우' 화면이 보여 주는 그 넷. 맨 앞에 세우고 표를 단다. */
.cell.core .tcard{border-color:var(--gold-bright);
  box-shadow:0 0 0 1px var(--gold-bright),0 4px 16px rgba(242,212,136,.28)}
.cell.core::before{content:'주력';position:absolute;top:-7px;left:-3px;z-index:6;
  font-family:'Cinzel',serif;font-size:9.5px;font-weight:700;letter-spacing:.12em;
  padding:1px 7px;border-radius:10px;border:1px solid var(--gold-bright);
  background:linear-gradient(180deg,#3a2a12,#241809);color:var(--gold-bright)}
.cell .cdecks{margin-top:4px;font-family:'Gothic A1',sans-serif;font-size:9px;font-weight:700;
  letter-spacing:.02em;color:var(--gold);opacity:.7;text-align:center;line-height:1.4}
:root{--cardw:clamp(112px,15vw,150px)}
@media (max-width:520px){ :root{--cardw:clamp(104px,30vw,140px)} .cgrid{gap:12px 8px} }

/* 상단 모드 탭 */
.tabs{display:flex;gap:0;margin:0 0 14px;border-bottom:1px solid var(--rule)}
.tabs button{font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:.1em;
  background:none;border:none;border-bottom:2px solid transparent;color:var(--ink-faint);
  padding:9px 16px;cursor:pointer;min-height:40px}
.tabs button.on{color:var(--gold-bright);border-bottom-color:var(--gold-bright)}

/* 적 한 명 */
.foe{margin:20px 0 6px;padding-top:16px;border-top:1px solid var(--rule)}
.foehd{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}
.foehd .nm{font-family:'Gowun Batang',serif;font-weight:700;font-size:19px;color:#fff}
.foehd .tag{font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:.12em;
  padding:2px 9px;border-radius:11px;border:1px solid var(--c,var(--gold));color:var(--c,var(--gold));
  align-self:center;white-space:nowrap}
.foehd .tag.t{border-color:var(--bronze);color:var(--gold)}
.foehd .tag.boss{background:linear-gradient(180deg,#3a2a12,#241809);color:var(--gold-bright);
  border-color:var(--gold-bright)}
.foedesc{font-family:'Gowun Batang',serif;font-size:12.5px;line-height:1.7;color:var(--parch-2);
  opacity:.85;margin-top:7px;max-width:70ch}
.foestat{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
.foestat span{font-family:'Cinzel',serif;font-size:10.5px;font-weight:700;letter-spacing:.06em;
  padding:3px 10px;border-radius:4px;border:1px solid var(--rule);color:var(--gold);
  background:rgba(20,14,8,.5)}
.foestat span b{color:#fff}
.foestat span.hp{border-color:#c04a3f;color:#f0a89f}
.foestat span.ovr{border-color:var(--gold-bright);color:var(--gold-bright)}

.empty2{font-family:'Gowun Batang',serif;color:var(--ink-faint);padding:30px 0;text-align:center}
/* 확대 — 프로토타입의 .zoom 을 그대로 쓴다 */
.zoom{cursor:pointer}
/* 앱 설치 줄 */
.inst{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 14px;
  padding:9px 12px;border:1px solid var(--rule);border-radius:8px;background:rgba(20,14,8,.5)}
.inst .t{font-family:'Gowun Batang',serif;font-size:11.5px;color:var(--parch-2);opacity:.85;flex:1;min-width:170px}
.inst button{font-family:'Cinzel',serif;font-size:12px;font-weight:700;letter-spacing:.08em;
  padding:8px 16px;border-radius:20px;cursor:pointer;min-height:38px;
  border:1px solid var(--gold-bright);background:linear-gradient(180deg,var(--gold),#8a6a24);color:#1a1206}
.inst.off{display:none}
/* 앱으로 열면 상단 안전영역만큼 내려 준다 */
@media (display-mode:standalone){ .cwrap{padding-top:calc(18px + env(safe-area-inset-top))} }
</style>
</head>
<body>
<div class="cwrap">
  <h1>TEN — 카드 목록</h1>
  <div class="csub"><span id="tot"></span> &nbsp;·&nbsp; <a href="../prototype/">게임으로</a></div>

  <div class="inst" id="inst"><span class="t" id="instHow"></span>
    <button id="instBtn" style="display:none">앱으로 설치</button></div>

  <div class="tabs">
    <button id="tabCard" class="on">카드 목록</button>
    <button id="tabFoe">적 덱 (원정)</button>
  </div>

  <div class="cbar" id="elBar"></div>
  <div class="cbar" id="row2">
    <span class="lbl2" id="row2lbl">종류</span>
    <span id="kBar" style="display:contents"></span>
    <input class="csearch" id="q" placeholder="이름·효과 검색">
  </div>
  <div class="cbar" id="bandBar" style="display:none"></div>
  <div class="cbar" id="tagBar"></div>
  <div class="tagdesc" id="tagDesc"></div>
  <div class="cbar" id="rarBar"></div>

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
/* 강화 카드(ROGUE.over)는 적 덱에만 나온다 — 카드 목록의 '전체 N종' 은 기본 카드만 센다.
   ⚠ 합치기 **전에** 기본 목록을 떠 둔다. 게임도 같은 자리에서 Object.assign 한다. */
const BASE=Object.keys(POOL).slice();
if(typeof ROGUE!=='undefined'&&ROGUE.over)Object.assign(POOL,ROGUE.over);
if(typeof GROWN!=='undefined')Object.assign(POOL,GROWN);   /* 성장·진형 상위 몸 — 덱 밖 */

/* ── 원정 적 ── */
const FOES=(typeof ENEMY!=='undefined'&&ENEMY.list)?ENEMY.list:[];
const FOEHP=(typeof ENEMY!=='undefined'&&ENEMY.hp)?ENEMY.hp:{normal:[20,1.5],elite:[30,2],boss:[60,2]};
const FOEBANDS=(typeof ENEMY!=='undefined'&&ENEMY.bands)?ENEMY.bands:[0,3,7];
const FOEOVER=(typeof ENEMY!=='undefined'&&ENEMY.overN)?ENEMY.overN:{};
const FLOORS=((typeof ROGUE!=='undefined'&&ROGUE.config&&ROGUE.config.floors)||11)-1;
const TIERKO={normal:'일반',elite:'정예',boss:'보스'};
/* 단계별 층 구간 — bands=[0,3,7] 이면 0~2 · 3~6 · 7~마지막 */
function bandRange(b){ return [FOEBANDS[b], (b+1<FOEBANDS.length?FOEBANDS[b+1]-1:FLOORS)]; }
function foeHpFor(tier,floor){ const [a,per]=FOEHP[tier]||FOEHP.normal; return Math.round(a+per*floor); }
function landsFor(n){ return Math.max(8, Math.round(n*17/23)); }

const KINDS=[['all','전체'],['cr','크리처'],['sp','스펠'],['en','인챈트'],['land','지형']];
const RARS=['common','uncommon','rare','legendary'];
const RARCOL={common:'#9aa6b4',uncommon:'#35a35a',rare:'#3b7fd4',legendary:'#e08a17'};
const rarCount=r=>BASE.filter(n=>((POOL[n]||{}).r||'common')===r).length;

/* ── 크리처 효과 태그 ─────────────────────────────────────────────
   크리처가 지는 효과는 두 갈래다.
     1) **배타 태그** — 스탯 가중치를 바꾸는 수호·비행·관통. 데이터에서는 g/f/p 플래그.
     2) **키워드**   — 속성마다 하나씩 가진 메커니즘. 데이터에서는 `kw` 문자열 한 줄
                       ("연소 3 · 폭산 2" 처럼 ' · ' 로 이어 붙는다).
   ⚠ 목록을 여기에 다시 적지 않는다. **정본은 GLOSSARY**(build_proto_data.py) 이고
      순서도 거기 순서(태그 → 속성별 → 기타)를 그대로 쓴다. 두 벌이 되면 반드시 어긋난다.
   ⚠ `kw` 의 머리 낱말이 GLOSSARY 에 없으면 그 카드만의 **고유 효과**다
      ("소환 시 …", "소멸 시 …"). 이것도 한 칸으로 묶어 걸러 볼 수 있게 한다. */
const TAGFLAG=[['g','수호'],['f','비행'],['p','관통']];
function tagsOf(n){
  const c=POOL[n];
  if(!c||c.k!=='cr')return [];
  const t=[];
  TAGFLAG.forEach(([k,ko])=>{ if(c[k])t.push(ko); });
  (c.kw||'').split('·').map(s=>s.trim()).filter(s=>s&&s!=='—').forEach(s=>{
    const head=s.split(/[\s+]/)[0];
    t.push(GLOSSARY[head]?head:'고유');
  });
  return t.filter((x,i)=>t.indexOf(x)===i);
}
const TAGEXTRA=[['고유','이 카드에만 있는 1회성 효과. 소환·소멸 순간에 한 번 발동한다.'],
                ['없음','태그도 키워드도 없는 순수 스탯 크리처. 예산을 전부 공/체에 쓴다.']];
/* GLOSSARY 순서 그대로 → 실제로 카드에 붙은 것만 남긴다(비행·수호 조합, 토큰 등은 빠진다) */
const TAGS=(()=>{
  const cnt={}, all=BASE.filter(n=>(POOL[n]||{}).k==='cr');
  all.forEach(n=>tagsOf(n).forEach(t=>cnt[t]=(cnt[t]||0)+1));
  cnt['없음']=all.filter(n=>!tagsOf(n).length).length;
  const ko2el={}; Object.keys(EL).forEach(e=>ko2el[EL[e].ko]=e);
  const rows=Object.keys(GLOSSARY).filter(k=>cnt[k]).map(k=>{
    const [grp,desc]=GLOSSARY[k];
    return {k, grp, desc, n:cnt[k], c:(EL[ko2el[grp]]||{}).c||'#c9a24b'};
  });
  TAGEXTRA.forEach(([k,desc])=>{ if(cnt[k])rows.push({k,grp:'기타',desc,n:cnt[k],c:'#8f7b52'}); });
  return rows;
})();
const CRN=BASE.filter(n=>(POOL[n]||{}).k==='cr').length;

let F={mode:'card',el:'all',k:'all',q:'',band:0,r:'all',t:'all'};

function elChip(el,on){
  const e=EL[el]||{};
  return `<button class="chip${on?' on':''}" data-el="${el}" style="--dot:${e.c||'#c9a24b'}">`
    +`<i></i>${e.ko||'전체'}<span class="n">${countOf(el)}</span></button>`;
}
function countOf(el){
  if(F.mode==='foe')return el==='all'?FOES.length:FOES.filter(e=>e.el===el).length;
  if(el==='all')return BASE.length+Object.keys(LANDS).length;
  const d=DECKS[el]; return d?(d.list||[]).length+poolOnlyOf(el).length:0;
}
const TIERS=[['all','전체'],['normal','일반'],['elite','정예'],['boss','보스']];
function renderBars(){
  const foe=F.mode==='foe';
  document.getElementById('elBar').innerHTML=
    `<button class="chip${F.el==='all'?' on':''}" data-el="all">전체<span class="n">${countOf('all')}</span></button>`
    +Object.keys(DECKS).map(el=>elChip(el,F.el===el)).join('');
  document.getElementById('row2lbl').textContent=foe?'등급':'종류';
  document.getElementById('kBar').innerHTML=(foe?TIERS:KINDS).map(([k,ko])=>
    `<button class="chip${F.k===k?' on':''}" data-k="${k}">${ko}</button>`).join('');
  document.getElementById('q').placeholder=foe?'적 이름·설명 검색':'이름·효과 검색';
  /* 희귀도 줄 — 카드 목록에서만 쓴다(적 덱은 등급 필터가 그 자리를 쓴다) */
  const rb=document.getElementById('rarBar');
  rb.style.display=foe?'none':'flex';
  if(!foe)rb.innerHTML='<span class="lbl2">희귀도</span>'
    +`<button class="chip${F.r==='all'?' on':''}" data-r="all">전체<span class="n">${BASE.length}</span></button>`
    +RARS.map(r=>`<button class="chip${F.r===r?' on':''}" data-r="${r}" style="--dot:${RARCOL[r]}">`
      +`<i></i>${RARKO[r]}<span class="n">${rarCount(r)}</span></button>`).join('');
  /* 효과 태그 줄 — 크리처에게만 붙는 것이라 카드 목록에서만 쓴다 */
  const tb=document.getElementById('tagBar'), td=document.getElementById('tagDesc');
  tb.style.display=foe?'none':'flex';
  td.classList.toggle('on',!foe&&F.t!=='all');
  if(!foe){
    tb.innerHTML='<span class="lbl2">효과 태그</span>'
      +`<button class="chip tg${F.t==='all'?' on':''}" data-t="all">전체<span class="n">크리처 ${CRN}</span></button>`
      +TAGS.map(t=>`<button class="chip tg${F.t===t.k?' on':''}" data-t="${t.k}" `
        +`title="${t.desc.replace(/"/g,'&quot;')}" style="--dot:${t.c}">`
        +`<i></i>${t.k}<span class="n">${t.n}</span></button>`).join('');
    const cur=TAGS.find(t=>t.k===F.t);
    if(cur)td.innerHTML=`<b>${cur.k}</b> <span style="opacity:.6">(${cur.grp})</span> — ${cur.desc}`,
      td.style.setProperty('--dot',cur.c);
  }
  const bb=document.getElementById('bandBar');
  bb.style.display=foe?'flex':'none';
  if(foe)bb.innerHTML='<span class="lbl2">난이도</span>'+[0,1,2].map(b=>{
    const [lo,hi]=bandRange(b);
    return `<button class="chip${F.band===b?' on':''}" data-b="${b}">${b+1}단계`
      +`<span class="n">${lo}~${hi}층</span></button>`;}).join('');
  document.querySelectorAll('#elBar .chip').forEach(b=>b.onclick=()=>{F.el=b.dataset.el;draw();});
  document.querySelectorAll('#kBar .chip').forEach(b=>b.onclick=()=>{F.k=b.dataset.k;draw();});
  document.querySelectorAll('#bandBar .chip').forEach(b=>b.onclick=()=>{F.band=+b.dataset.b;draw();});
  document.querySelectorAll('#rarBar .chip').forEach(b=>b.onclick=()=>{F.r=b.dataset.r;draw();});
  document.querySelectorAll('#tagBar .chip').forEach(b=>b.onclick=()=>{F.t=b.dataset.t;draw();});
  document.getElementById('tabCard').classList.toggle('on',!foe);
  document.getElementById('tabFoe').classList.toggle('on',foe);
}

/* ── 적 한 명 ── */
function foeSection(e){
  const c=(EL[e.el]||{}).c||'#c9a24b';
  const cards=(e.decks[F.band]||e.decks[0]||[]).slice();
  const n=cards.reduce((a,[,k])=>a+k,0);
  const lands=landsFor(n);
  const over=cards.filter(([x])=>(POOL[x]||{}).over).reduce((a,[,k])=>a+k,0);
  const [lo,hi]=bandRange(F.band);
  /* '주력 카드' 는 게임의 적 조우 화면(rgEnter)과 **같은 정의** — 코스트가 높은 순 4장.
     정의를 바꾸려면 프로토타입의 rgEnter 와 함께 고칠 것. */
  const CORE_N=4;
  const core=cards.slice().sort((a,b)=>{
    const ca=(POOL[a[0]]||{}).c||0, cb=(POOL[b[0]]||{}).c||0;
    return cb-ca||a[0].localeCompare(b[0]);}).slice(0,CORE_N).map(x=>x[0]);
  const rest=cards.filter(([x])=>!core.includes(x)).sort((a,b)=>{
    const ca=(POOL[a[0]]||{}).c||0, cb=(POOL[b[0]]||{}).c||0;
    return ca-cb||a[0].localeCompare(b[0]);});
  /* 주력 → 지형 → 나머지(코스트 순) */
  const rows=cards.filter(([x])=>core.includes(x))
    .sort((a,b)=>core.indexOf(a[0])-core.indexOf(b[0]))
    .map(r=>[r[0],r[1],true])
    .concat([[e.land,lands,false]]).concat(rest.map(r=>[r[0],r[1],false]));
  return `<div class="foe" style="--c:${c}">
    <div class="foehd">
      <span class="nm">${e.name}</span>
      <span class="tag">${(EL[e.el]||{}).ko}</span>
      <span class="tag t${e.tier==='boss'?' boss':''}">${TIERKO[e.tier]||e.tier}</span>
      ${e.style&&e.style!==TIERKO[e.tier]?`<span class="tag t">${e.style}</span>`:''}
    </div>
    <div class="foedesc">${e.desc||''}</div>
    <div class="foestat">
      <span class="hp">HP <b>${foeHpFor(e.tier,lo)}~${foeHpFor(e.tier,hi)}</b> · ${lo}~${hi}층</span>
      <span>덱 <b>${n+lands}</b>장 · 카드 ${n} + 지형 ${lands}</span>
      ${over?`<span class="ovr">강화 <b>${over}</b>장</span>`:''}
    </div>
    <div class="cgrid">${rows.map(([x,k,cr])=>cellHTML(x,k,cr)).join('')}</div>
  </div>`;
}
function foeHit(e){
  if(F.el!=='all'&&e.el!==F.el)return false;
  if(F.k!=='all'&&e.tier!==F.k)return false;
  if(!F.q)return true;
  return (e.name+' '+(e.desc||'')+' '+(e.style||'')).toLowerCase().includes(F.q);
}
function kindOf(n){ return LANDS[n]?'land':(POOL[n]||{}).k; }
function hit(n){
  if(F.k!=='all'&&kindOf(n)!==F.k)return false;
  /* 효과 태그를 좁히면 크리처만 남는다 — 스펠·인챈트·지형은 이 태그를 지지 않는다 */
  if(F.t!=='all'){
    if((POOL[n]||{}).k!=='cr')return false;
    const t=tagsOf(n);
    if(F.t==='없음'?t.length:!t.includes(F.t))return false;
  }
  /* 지형은 희귀도 개념 밖이다 — 희귀도를 좁히면 지형은 빠진다 */
  if(F.r!=='all'&&(LANDS[n]||((POOL[n]||{}).r||'common')!==F.r))return false;
  if(!F.q)return true;
  const c=POOL[n]||{};
  return (n+' '+(c.kw||'')+' '+(c.d||'')).toLowerCase().includes(F.q);
}
function cellHTML(n,copies,core){
  const html=LANDS[n]?landCardHTML(n,'md'):tcardHTML(n,{size:'md'});
  /* 덱별로 묶어 보여 주므로 소속 표시는 **두 덱 이상**일 때만 의미가 있다. 아니면 군더더기다. */
  const d=DECKOF[n]||[];
  /* 적 덱 보기에서는 '어느 속성 덱에 들어가는가' 가 의미 없다(강화 카드는 아예 안 들어간다) */
  const rr=LANDS[n]?null:((POOL[n]||{}).r||'common');
  const decks=F.mode==='foe'?''
    :(d.length>1?d.map(([e,c])=>`${(EL[e]||{}).ko||e}×${c}`).join(' · ')
      :(d.length?(rr&&rr!=='common'?`<span style="color:${RARCOL[rr]}">${RARKO[rr]}</span>`:'')
        :'덱 미수록'));
  return `<div class="cell${core?' core':''}" data-n="${n}">${copies?`<span class="cnum">×${copies}</span>`:''}`
    +`${html}${decks?`<div class="cdecks">${decks}</div>`:''}</div>`;
}
/* 그 속성에 속하지만 **어느 덱에도 안 실린** 카드(gen_decks 의 매수 0).
   골격을 안 건드리고 새로 만들어 본 카드들이다 — 목록에서 빠지면 만든 걸 볼 수가 없다. */
function poolOnlyOf(el){
  return BASE.filter(n=>{ const c=POOL[n]||{};
    return c.el===el&&!LANDS[n]&&!(DECKOF[n]||[]).length; }).map(n=>[n,0]);
}
function section(el){
  const d=DECKS[el]; if(!d)return '';
  /* 지형이 먼저 오도록 정렬한다(덱 목록의 첫 항목이 지형) — 그 뒤는 코스트 순. */
  const rows=(d.list||[]).concat(poolOnlyOf(el)).filter(([n])=>hit(n)).slice().sort((a,b)=>{
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
  const extra=rows.filter(([,x])=>!x).length;
  return `<div class="dsec" style="--c:${c}">
    <h2><span class="ko">${(EL[el]||{}).ko}</span>${d.name}
      <span class="cnt">${rows.length-extra}종 · ${total}장${extra?` · 덱 미수록 ${extra}종`:''}</span></h2>
    <div class="core">${d.core||''}</div>
    <div class="cgrid">${rows.map(([n,cnt])=>cellHTML(n,cnt)).join('')}</div>
  </div>`;
}
const ORD={normal:0,elite:1,boss:2};
function draw(){
  renderBars();
  const box=document.getElementById('list');
  let h='';
  if(F.mode==='foe'){
    /* 속성 → 등급(일반·정예·보스) 순으로 늘어놓는다 */
    const list=FOES.filter(foeHit).slice().sort((a,b)=>{
      const ea=Object.keys(DECKS).indexOf(a.el), eb=Object.keys(DECKS).indexOf(b.el);
      return ea-eb||ORD[a.tier]-ORD[b.tier]||a.name.localeCompare(b.name);});
    h=list.map(foeSection).join('');
    document.getElementById('tot').innerHTML=
      `원정 적 <b>${FOES.length}</b>명 · 일반 21 · 정예 7 · 보스 7 · 난이도 3단계`;
  }else{
    h=(F.el==='all'?Object.keys(DECKS).map(section).join(''):section(F.el));
    document.getElementById('tot').innerHTML=
      `카드 <b>${BASE.length}</b>종 + 지형 <b>${Object.keys(LANDS).length}</b>종 · 속성 덱 7종`;
  }
  box.innerHTML=h||'<div class="empty2">조건에 맞는 것이 없습니다.</div>';
  box.querySelectorAll('.cell').forEach(el=>el.onclick=()=>openZoom(el.dataset.n));
}
function setMode(m){ F.mode=m; F.k='all'; F.q=''; F.t='all'; document.getElementById('q').value=''; draw(); }
document.getElementById('tabCard').onclick=()=>setMode('card');
document.getElementById('tabFoe').onclick=()=>setMode('foe');
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

/* ── 앱(PWA) 설치 ────────────────────────────────────────────────
   게임과 **캐시 이름이 다른** 서비스워커를 쓴다(cards/sw.js). 같은 이름이면
   한쪽이 activate 될 때 다른 쪽 캐시를 지워 버린다. */
/* 새 판이 올라오면 바로 반영한다. 뷰어는 잃을 상태가 없으므로 **묻지 않고 새로고침**한다.
   ⚠ 브라우저는 알아서 갱신을 확인하지 않는다 — reg.update() 로 직접 찔러야 한다.
   ⚠ 첫 설치에도 controllerchange 가 뜨므로, 등록 전에 컨트롤러가 있었는지를 기억해 둔다. */
let RELOADING=false;
function hardReload(){
  if(RELOADING)return; RELOADING=true;
  const z=document.getElementById('zoom'); if(z)z.classList.remove('on');
  location.reload();
}
if('serviceWorker' in navigator&&location.protocol!=='file:')
  addEventListener('load',()=>{
    /* ⚠ updateViaCache:'none' 이 없으면 브라우저가 HTTP 캐시의 옛 sw.js 와 비교해 갱신을 놓친다 */
    navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
      const poke=()=>{ try{ reg.update(); }catch(e){} };
      setInterval(poke,10*60*1000);
      addEventListener('visibilitychange',()=>{ if(!document.hidden)poke(); });
      addEventListener('online',poke);
      /* 첫 설치와 갱신을 구분한다 — updatefound 시점에 이미 컨트롤러가 있었으면 갱신이다.
         뷰어는 잃을 상태가 없으므로 **묻지 않고 바로** 새로고침한다. */
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing; if(!nw)return;
        const hadCtrl=!!navigator.serviceWorker.controller;
        nw.addEventListener('statechange',()=>{ if(nw.state==='activated'&&hadCtrl)hardReload(); });
      });
      poke();
    }).catch(()=>{});
  });
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let INSTALLP=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();INSTALLP=e;syncInstall();});
addEventListener('appinstalled',()=>{INSTALLP=null;syncInstall();});
function syncInstall(){
  const box=document.getElementById('inst');
  const b=document.getElementById('instBtn'), h=document.getElementById('instHow');
  if(standalone()){ box.classList.add('off'); return; }
  box.classList.remove('off');
  if(INSTALLP){ b.style.display='';
    h.textContent='홈 화면에 추가하면 주소창 없이 열리고, 오프라인에서도 카드를 볼 수 있습니다.'; return; }
  b.style.display='none';
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  h.textContent=ios
    ? '사파리에서 공유 버튼(⬆) → "홈 화면에 추가" — 게임과 별개의 앱으로 깔립니다.'
    : '브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치" — 게임과 별개의 앱으로 깔립니다.';
}
document.getElementById('instBtn').onclick=async()=>{
  if(!INSTALLP)return;
  INSTALLP.prompt(); await INSTALLP.userChoice; INSTALLP=null; syncInstall();
};
syncInstall();
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
