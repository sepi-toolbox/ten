#!/usr/bin/env node
/* 엘리멘츠 카드·능력 전부를 한 장의 md 로 뽑는다 — 컨셉 논의용 자료.
 *
 *   node tools/dump_etg_md.js            → docs/etg_cards.md
 *   node tools/dump_etg_md.js --mod      → 개조(localStorage)까지 반영… 은 못 한다.
 *                                          개조본은 에디터의 '주고받기 → 내려받기' 로 뽑을 것.
 *
 * ■ 왜 스크립트로 뽑나
 *   손으로 옮겨 적으면 그 순간부터 카드 데이터와 문서가 갈라진다. 성권이 에디터로
 *   이름·수치·글을 바꾸는 게 이 게임의 전제인데, 문서가 옛 값을 들고 있으면
 *   **AI 한테 틀린 자료를 주고 컨셉을 논의하게 된다.** 그래서 늘 다시 뽑는다.
 *
 * ■ 어디서 읽나
 *   카드는 data.js, 능력 설명은 엔진의 SK 표에서 읽는다. 낱말집(FLAGKO/FLAGDEF/KINDKO)도
 *   엔진 것을 그대로 쓴다 — 여기서 베껴 적으면 곧 어긋난다.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const FILE = 'file://' + path.join(__dirname, '..', 'prototype', 'etg', 'index.html');
const OUT = path.join(__dirname, '..', 'docs', 'etg_cards.md');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(FILE);
  await p.waitForFunction(() => window.ETGDBG && window.ETG);

  const D = await p.evaluate(() => {
    const G = window.ETGDBG;
    const sk = {};
    for (const id in G.SK) sk[id] = { t: G.SK[id].t || null, d: G.SK[id].d || '' };
    return {
      els: window.ETG.els, elko: G.ELKO, src: window.ETG.src, ver: G.VERSION,
      cards: window.ETG.cards, sk,
      /* ⚠ 데이터에는 남아 있지만 **덱에 못 넣는** 카드가 있다(문장 카드 12장·토큰).
         문서가 그걸 실으면 밖에서 보는 사람은 쓸 수 있는 줄 안다. 갈라서 싣는다. */
      out: window.ETG.cards.filter(c => !c.up && !G.playable(c))
        .map(c => ({ ko: c.ko, en: c.en, el: c.el })),
      flagko: G.FLAGKO, flagdef: G.FLAGDEF, kindko: G.KINDKO,
    };
  });
  await b.close();
  if (errs.length) { console.error('❌ 페이지 오류', errs.slice(0, 3)); process.exit(1); }

  /* ── 표에 넣을 값 다듬기 ─────────────────────────────────────────────
     ⚠ md 표 안에서 `|` 와 줄바꿈은 표를 깨뜨린다. 카드 글에 둘 다 들어 있다. */
  const cell = s => String(s == null ? '' : s)
    .replace(/\r?\n+/g, ' ').replace(/\|/g, '/').trim();
  const TGTKO = { cr: '크리처', mycr: '내 크리처', foecr: '상대 크리처', pm: '기물',
                  foepm: '상대 기물', crw: '크리처·무기', any: '아무거나' };

  /* 표에 싣는 것은 **실제로 덱에 넣을 수 있는 카드**만이다 */
  const base = D.cards.filter(c => !c.up && !D.out.some(o => o.en === c.en));
  const byCode = {}; D.cards.forEach(c => { byCode[c.code] = c; });

  /* 강화판은 따로 싣지 않는다 — 수치만 다르고 컨셉이 같아서 논의에 방해만 된다.
     대신 '강화하면 무엇이 달라지나' 를 한 줄로 붙인다. */
  const upNote = c => {
    const u = c.upcode && byCode[c.upcode];
    if (!u) return '';
    const d = [];
    if (u.cost !== c.cost) d.push(`비용 ${c.cost}→${u.cost}`);
    if (u.atk !== c.atk || u.hp !== c.hp) d.push(`${c.atk}/${c.hp}→${u.atk}/${u.hp}`);
    const a = c.sk.map(s => s.id).join(','), b2 = u.sk.map(s => s.id).join(',');
    if (a !== b2) d.push(`능력 ${b2 || '없음'}`);
    if (u.ko !== c.ko) d.push(`이름 ${u.ko}`);
    return d.join(' · ');
  };

  const cost = c => (c.cost ? `${c.cost}${c.costel ? ` ${D.elko[c.costel]}` : ''}` : '0');
  const stat = c => (c.kind === 'creature' || c.kind === 'weapon' ? `${c.atk}/${c.hp}`
                     : (c.hp ? `-/${c.hp}` : '—'));

  let s = '';
  s += '# 엘리멘츠 카드·능력 전서\n\n';
  s += `자동 생성 문서다 — 손으로 고치지 말 것. \`node tools/dump_etg_md.js\` 로 다시 뽑는다.\n\n`;
  s += `- 판: **${D.ver}** · 기준 데이터: ${D.src}\n`;
  /* ⚠ 강화판 수를 (전체 - 기본) 로 세면 안 된다 — 뺀 카드가 강화판으로 둔갑한다 */
  const ups = D.cards.filter(c => c.up).length;
  s += `- 기본 카드 **${base.length}장** (강화판 ${ups}장은 표에 싣지 않고 "강화" 칸에 차이만 적었다)\n`;
  s += `- 능력 **${Object.keys(D.sk).length}종**\n`;
  if (D.out.length) {
    s += `- 데이터에는 있지만 **덱에 못 넣는 카드 ${D.out.length}장**은 표에서 뺐다: `
       + D.out.map(o => `${o.ko}(${o.en})`).join(', ') + '\n';
    s += '  <br><sub>문장 카드 12장은 자기 속성 기둥과 비용·능력·표식이 한 글자도 다르지 않다. '
       + '원작에서 둘을 갈라놓은 것은 희귀도뿐이었는데(님프와 같은 최상위 등급) '
       + '이 판에는 희귀도도 수집도 없어 완전한 중복이라 뺐다. 나머지는 능력이 만들어 내는 토큰이다.</sub>\n';
  }
  s += '\n';
  s += '## 이 게임이 어떻게 굴러가나 (표를 읽기 전에)\n\n';
  s += [
    '자원은 **퀀텀**이라고 부르고 12속성이 각각 따로 쌓인다. 마나 총량 하나가 아니라 색깔별 통이 열둘이다.',
    '자원은 땅이 아니라 **기둥·진자 카드**가 만든다. 기둥은 자기 속성 1/턴, 양자 기둥은 무작위 3속성 1씩.',
    '덱과 별개로 **문장(mark)** 을 하나 정하고, 그 속성 퀀텀이 매 턴 1씩 들어온다. 파편 카드들은 문장이 자기 속성이면 더 세진다.',
    '자리는 크리처 · 기물 · 무기 1 · 방패 1 로 나뉜다. 무기와 방패는 한 장씩만 놓이고 새로 내면 조용히 교체된다.',
    '막기(블록) 같은 건 없다. 크리처는 매 턴 상대 얼굴을 때리고, **방패**가 그 피해를 줄이거나 걸러 낸다.',
  ].map(x => `- ${x}`).join('\n') + '\n\n';

  s += '## 낱말집 (카드에 붙는 표식)\n\n| 표식 | 뜻 |\n|---|---|\n';
  for (const k in D.flagko) {
    const def = D.flagdef[k];
    if (!def) continue;
    s += `| ${D.flagko[k]} | ${cell(def)} |\n`;
  }
  s += '\n';

  /* ── 속성별 카드 표 ─────────────────────────────────────────────── */
  s += '## 속성별 카드\n\n';
  for (let el = 0; el < D.elko.length; el++) {
    const cs = base.filter(c => c.el === el);
    if (!cs.length) continue;
    const n = k => cs.filter(c => c.kind === k).length;
    s += `### ${el}. ${D.elko[el]} (${D.els[el]}) — ${cs.length}장\n\n`;
    s += `크리처 ${n('creature')} · 주문 ${n('spell')} · 기물 ${n('perm')} · 무기 ${n('weapon')} · 방패 ${n('shield')}\n\n`;
    s += '| 이름 | 원어 | 종류 | 비용 | 공/체 | 표식 | 효과 | 강화 |\n|---|---|---|---|---|---|---|---|\n';
    /* 기둥·진자를 맨 위로, 그다음 종류별로 — 읽는 사람이 자원부터 보게 한다 */
    const ord = { perm: 0, creature: 1, spell: 2, weapon: 3, shield: 4 };
    cs.sort((a, b2) => {
      const pa = a.flags.includes('pillar') ? -1 : 0, pb = b2.flags.includes('pillar') ? -1 : 0;
      return pa - pb || ord[a.kind] - ord[b2.kind] || a.cost - b2.cost || a.ko.localeCompare(b2.ko);
    });
    for (const c of cs) {
      const fl = c.flags.filter(f => D.flagko[f] && f !== 'stackable' && f !== 'additive')
        .map(f => D.flagko[f]).join(' ');
      s += `| **${cell(c.ko)}** | ${cell(c.en)} | ${D.kindko[c.kind]} | ${cost(c)} | ${stat(c)} `
         + `| ${fl} | ${cell(c.kotxt)} | ${cell(upNote(c))} |\n`;
    }
    s += '\n';
  }

  /* ── 능력 사전 ───────────────────────────────────────────────────
     ⚠ 카드 글은 '무엇을 하는가' 를 사람 말로 적은 것이고, 여기는 **엔진이 실제로 무엇을
       구현했는가** 다. 컨셉을 뜯어고칠 때 필요한 건 뒤쪽이다. */
  s += '## 능력 사전 (엔진이 실제로 구현한 것)\n\n';
  s += '카드 글이 "사람이 읽는 말" 이라면 이쪽은 **판정 단위**다. `대상`이 비어 있으면 겨냥 없이 그냥 터진다.\n\n';
  const used = {};
  base.forEach(c => c.sk.forEach(x => { (used[x.id] = used[x.id] || []).push(c.ko); }));
  s += '| 능력 | 대상 | 하는 일 | 쓰는 카드 |\n|---|---|---|---|\n';
  for (const id of Object.keys(D.sk).sort()) {
    const k = D.sk[id];
    if (!k.d) continue;
    const cards = used[id] || [];
    s += `| \`${id}\` | ${k.t ? (TGTKO[k.t] || k.t) : ''} | ${cell(k.d)} `
       + `| ${cards.length ? cell(cards.join(', ')) : '(강화판·토큰 전용)'} |\n`;
  }
  s += '\n';

  /* ── 속성마다 되풀이되는 자리 ─────────────────────────────────── */
  s += '## 속성마다 되풀이되는 자리\n\n';
  s += '컨셉을 갈아엎을 때 **이 뼈대를 그대로 두고 채워 넣는 것**이 제일 안전하다.\n\n';
  s += '| 속성 | 기둥 | 무기 | 방패 | 님프(8비) | 파편 | 용(10비 이상) |\n|---|---|---|---|---|---|---|\n';
  for (let el = 1; el < D.elko.length; el++) {
    const cs = base.filter(c => c.el === el);
    const pick = f => cs.filter(f).map(c => c.ko).join(', ') || '—';
    s += `| ${D.elko[el]} `
       + `| ${pick(c => c.flags.includes('pillar'))} `
       + `| ${pick(c => c.kind === 'weapon')} `
       + `| ${pick(c => c.kind === 'shield')} `
      /* ⚠ 이름 조각으로 고르면 엉뚱한 게 딸려 온다 — Dragonfly(잠자리)가 용으로,
         Nymph's Tears(주문)가 님프로, Shard Golem 이 파편으로 잡혔다. 끝말로 못 박는다. */
       + `| ${pick(c => /Nymph/.test(c.en) && c.kind === 'creature')} `
       + `| ${pick(c => /^Shard of /.test(c.en))} `
       + `| ${pick(c => /\bDragon$/.test(c.en))} |\n`;
  }
  s += '\n';

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, s, 'utf8');
  console.log(`docs/etg_cards.md 생성: 카드 ${base.length}장 · 능력 ${Object.keys(D.sk).length}종 · ${Math.round(s.length / 1024)}KB`);
})();
