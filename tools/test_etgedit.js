#!/usr/bin/env node
/* 카드 에디터 검사 — prototype/etg/edit.html
 *
 * ⚠⚠ 에디터의 값어치는 **미리보기가 실제 카드와 같다**는 데 있다. 여기서 어긋나기
 *   시작하면 고친 결과를 눈으로 못 믿게 되고, 그러면 에디터를 쓸 이유가 없어진다.
 *   그래서 이 검사는 '버튼이 있나' 가 아니라 **에디터에서 고친 것이 게임에 그대로
 *   나타나는가**(end-to-end)를 본다.
 *
 * ⚠ 개조는 localStorage 에 남는다. 같은 origin(file://) 을 쓰는 한 페이지를 옮겨도
 *   그대로 살아 있어야 한다 — 그게 이 기능의 전부다.
 */
const pw = require('playwright');
const path = require('path');
const EDIT = 'file://' + path.join(__dirname, '..', 'prototype', 'etg', 'edit.html');
const GAME = 'file://' + path.join(__dirname, '..', 'prototype', 'etg', 'index.html');

let bad = 0;
const ok = (name, cond, note) => {
  console.log(`${cond ? '✅' : '❌'} ${name.padEnd(30)} ${note === undefined ? '' : note}`);
  if (!cond) bad++;
};

(async () => {
  const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 402, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e && e.stack || e).slice(0, 220)));

  const openEdit = async () => { await p.goto(EDIT); await p.waitForFunction(() => window.EDDBG); };
  const openGame = async () => { await p.goto(GAME); await p.waitForFunction(() => window.ETGDBG); };

  await openEdit();

  /* ── 1) 뜨고, 카드가 다 보인다 ─────────────────────────────────────── */
  const boot = await p.evaluate(() => ({
    cards: document.querySelectorAll('.gcard').length,
    tabs: document.querySelectorAll('.edtabs button').length,
    ver: document.getElementById('ver').textContent,
    /* ⚠ 에디터는 **판을 열면 안 된다** — 같은 엔진을 쓰되 게임은 시작하지 않는다 */
    started: !!window.ETGDBG.G,
    play: window.ETG.cards.filter(c => !c.up && window.ETGDBG.playable(c)).length,
    mark: window.ETG.cards.filter(c => !c.up && window.ETGDBG.playable(c)
                                       && /^Mark of /.test(c.en)).length,
  }));
  /* ⚠ 장수를 숫자로 박아 두지 않는다 — 카드를 빼면 여기가 먼저 거짓으로 실패한다.
     대신 **에디터 목록과 게임이 같은 카드를 본다**(playable 한 벌)는 것을 잰다. */
  ok('에디터가 뜬다', boot.cards === boot.play && boot.cards > 200
     && boot.tabs === 4 && /^v\d/.test(boot.ver),
     `${boot.cards}장(놀 수 있는 카드 ${boot.play}장) · 탭 ${boot.tabs} · ${boot.ver}`);
  /* ⚠⚠ 문장 카드(Mark of X) 12장은 기둥과 완전히 같아 목록에서 뺐다. 에디터에도 안 떠야
     한다 — 못 노는 카드를 고치게 두면 고쳐도 판에 안 나온다. */
  ok('문장 카드는 어디에도 안 뜬다', boot.mark === 0, `문장 카드 ${boot.mark}장`);
  ok('에디터는 판을 열지 않는다', boot.started === false, boot.started ? '판이 떴다' : '안 열림');

  /* ── 2) 미리보기가 게임과 **같은 규격**이다 ────────────────────────
     ⚠ 여기가 어긋나면 에디터를 믿을 수 없다. 본편 공식(cw*(.03+.079*1.3*3))으로
       계산한 고정 텍스트 박스인지, 일러스트 자리를 안 먹는지를 잰다. */
  const spec = await p.evaluate(() => {
    const D = window.ETGDBG;
    window.EDDBG.openCard(D.BYNAME['Crimson Dragon'].code);
    const c = document.querySelector('.prevwrap .tcard');
    const cw = c.getBoundingClientRect().width;
    const body = c.querySelector('.tbody').getBoundingClientRect().height;
    const art = c.querySelector('.tart').getBoundingClientRect().height;
    window.EDDBG.closeSheet();
    return { cw, body, art, want: cw * (0.03 + 0.079 * 1.3 * 3), min: cw * 0.30 };
  });
  ok('미리보기 텍스트 박스가 본편 공식', Math.abs(spec.body - spec.want) < 1.5,
     `상자 ${spec.body.toFixed(1)}px · 공식 ${spec.want.toFixed(1)}px`);
  ok('미리보기가 일러스트를 안 먹는다', spec.art >= spec.min - 0.5,
     `그림 ${spec.art.toFixed(1)}px ≥ ${spec.min.toFixed(1)}px`);

  /* ── 3) 고친 것이 **게임에 그대로** 나온다 ────────────────────────── */
  const code = await p.evaluate(() => {
    const D = window.ETGDBG, E = window.EDDBG;
    const c = D.BYNAME['Fire Spirit'];
    E.putCard(c.code, 'ko', '불꽃 요정');
    E.putCard(c.code, 'atk', 3);
    E.putCard(c.code, 'cost', 4);
    E.put('el', '6', '화염');
    E.put('flag', 'airborne', '날개');
    E.put('sk', 'growth', '+{A}|+{H} 만큼 자란다');
    return c.code;
  });
  await openGame();
  const g = await p.evaluate(c => {
    const D = window.ETGDBG, card = D.CARD[c];
    const d = document.createElement('div');
    d.innerHTML = D.etgCardHTML(card, { size: 'md' });
    const d2 = document.createElement('div');
    d2.innerHTML = D.etgCardHTML(D.BYNAME['Fire Bolt'], { size: 'md' });
    const pips = [...d2.querySelectorAll('.teff .elp')];
    return { ko: card.ko, atk: card.atk, cost: card.cost, el6: D.ELKO[6],
             txt: d.querySelector('.teff').textContent.trim(),
             bolt: d2.querySelector('.teff').textContent.trim(),
             /* v0.35.0 — 글 속의 속성은 글자가 아니라 **구슬**이다. 이름은 구슬에 붙는다. */
             boltPips: pips.map(i => i.getAttribute('title')),
             boltColor: pips.length ? pips[0].style.getPropertyValue('--ec').trim() : '' };
  }, code);
  ok('이름을 고치면 게임에도 그대로', g.ko === '불꽃 요정', g.ko);
  ok('수치를 고치면 게임에도 그대로', g.atk === 3 && g.cost === 4, `${g.cost}비용 ${g.atk}공격`);
  ok('키워드가 카드 글까지 간다', /날개/.test(g.txt) && !/비행/.test(g.txt), g.txt);
  /* ⚠ v0.31.0 부터 카드 글은 **카드마다 한 줄**(원문을 옮긴 kotxt)이다.
     속성 이름은 글 안에 `[불]` 같은 자리가 있는 카드에서만 바뀌고,
     능력 글(SK 설명)은 카드 앞면이 아니라 **확대창**에 나온다.
     ⚠⚠ v0.35.0 부터 그 자리는 **글자가 아니라 속성 구슬**이다. 그러니 여기서 재야 하는 것은
       "글에 '화염' 이라고 적혔나" 가 아니라 **구슬이 새 이름을 달고 있나** 다.
       글자로 재면 구슬로 바뀐 순간 거짓으로 실패한다. */
  ok('속성 구슬이 새 이름을 단다',
     g.el6 === '화염' && g.boltPips.length > 0 && g.boltPips.every(t => t === '화염')
     && !/화염/.test(g.bolt),
     `구슬 ${g.boltPips.length}개 · ${g.boltPips[0]} · ${g.boltColor}`);

  /* ── 4) 판에서도 그 이름으로 논다 ──────────────────────────────────
     ⚠ 카드 글만 바뀌고 실제 판이 옛 이름을 쓰면 반쪽이다. 소환해서 확인한다. */
  const play = await p.evaluate(c => {
    const D = window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)), 6);
    const u = D.summon(D.G.me, c);
    D.render();
    return { name: u.c.ko, atk: u.atk,
             onBoard: (document.querySelector('#myBoard .tname') || {}).textContent || '' };
  }, code);
  ok('판 위에서도 고친 이름·수치', play.name === '불꽃 요정' && play.atk === 3
     && play.onBoard === '불꽃 요정', `${play.onBoard} ${play.atk}공격`);

  /* ── 5) 설명 통째 갈아 끼우기 · 비우면 되돌아온다 ─────────────────── */
  await openEdit();
  const txt = await p.evaluate(c => {
    const D = window.ETGDBG, E = window.EDDBG;
    const read = () => { const d = document.createElement('div');
      d.innerHTML = D.etgCardHTML(D.CARD[c], { size: 'md' });
      return d.querySelector('.teff').textContent.trim(); };
    E.putCard(c, 'txt', '내가 새로 쓴 글이다');
    const over = read();
    E.putCard(c, 'txt', '');
    return { over, back: read() };
  }, code);
  ok('설명을 통째로 갈아 끼운다', txt.over === '내가 새로 쓴 글이다', txt.over);
  ok('비우면 원래 카드 글로 돌아온다', /아블레이즈/.test(txt.back), txt.back);

  /* ── 6) 원본은 안 고쳐진다 — 되돌리면 처음 그대로 ────────────────── */
  const rev = await p.evaluate(c => {
    const D = window.ETGDBG;
    D.setMod({}); D.saveMod(); D.applyMod();
    const card = D.CARD[c];
    return { ko: card.ko, atk: card.atk, cost: card.cost,
             el6: D.ELKO[6], flag: D.FLAGKO.airborne, sk: D.SK.growth.d };
  }, code);
  ok('전부 되돌리면 원본 그대로',
     rev.ko === '불의 정령' && rev.atk === 0 && rev.cost === 2
     && rev.el6 === '불' && rev.flag === '비행' && /얻는다/.test(rev.sk),
     `${rev.ko} ${rev.cost}비용 ${rev.atk}공격 · ${rev.el6} · ${rev.flag}`);

  /* ── 7) 내보낸 글을 그대로 다시 넣으면 같은 상태가 된다 ──────────── */
  const round = await p.evaluate(c => {
    const D = window.ETGDBG, E = window.EDDBG;
    E.putCard(c, 'ko', '가나다'); E.put('el', '3', '무게');
    const json = JSON.stringify(D.MODREF);
    D.setMod({}); D.applyMod();
    const wiped = D.CARD[c].ko;
    D.setMod(JSON.parse(json)); D.saveMod(); D.applyMod();
    return { json, wiped, back: D.CARD[c].ko, el3: D.ELKO[3] };
  }, code);
  ok('내보내고 다시 가져오면 그대로',
     round.wiped === '불의 정령' && round.back === '가나다' && round.el3 === '무게',
     `${round.wiped} → ${round.back} · ${round.el3}`);

  /* ── 8) 숫자를 바꿨는데 설명에 옛 값이 남아 있으면 짚어 준다 ─────── */
  const warn = await p.evaluate(() => {
    const D = window.ETGDBG, E = window.EDDBG;
    D.setMod({}); D.applyMod();
    const c = D.BYNAME['Fire Bolt'].code;          /* 설명에 숫자가 들어 있는 카드 */
    E.putCard(c, 'cost', 9);
    E.openCard(c);
    const has = !!document.querySelector('#sheetin .warn');
    E.closeSheet();
    D.setMod({}); D.saveMod(); D.applyMod();
    return has;
  });
  ok('숫자와 설명이 어긋나면 짚어 준다', warn === true, warn ? '경고 뜸' : '경고 없음');

  /* ── 9) 개조가 없으면 원본과 한 글자도 다르지 않다 ────────────────── */
  const clean = await p.evaluate(() => {
    const D = window.ETGDBG;
    D.setMod({}); D.saveMod(); D.applyMod();
    let diff = 0;
    for (const code in D.ORIG.card) {
      const c = D.CARD[code], o = D.ORIG.card[code];
      for (const f in o) if (c[f] !== o[f]) diff++;
      if (c.txt !== undefined) diff++;
    }
    return diff;
  });
  ok('개조가 없으면 원본 그대로', clean === 0, `어긋난 값 ${clean}개`);

  if (errs.length) { bad++; console.log('   ERR', errs.slice(0, 3)); }
  console.log(bad ? `❌ ${bad}건 실패` : '✅ 전부 통과');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
