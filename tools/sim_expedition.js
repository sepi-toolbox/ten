/* 원정 모드 전투 길이·난이도 실측기 (Playwright headless)
 *   node tools/sim_expedition.js '[["normal",0]]'
 * ⚠ 느리다 — 전투 연출을 실제로 다 돌리기 때문에 한 판에 1~2분씩 걸린다.
 *   케이스를 인자로 좁혀서 돌릴 것. 기본값(4케이스)은 10분 이상 잡아야 한다.
 * 적 등급 × 층별로 몇 턴 만에 끝나는지, 내가 얼마나 깎이는지를 잰다.
 * 적 체력(기본 일반 20 · 정예 30 · 보스 60)을 조정할 때 이 숫자를 보고 판단한다. */
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const FILE = 'file://' + path.join(__dirname, '..', 'prototype', 'index.html');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1020, height: 1400 } });
  const errs = []; p.on('pageerror', e => errs.push('ERR: ' + e.message));
  await p.goto(FILE); await p.waitForTimeout(600);
  await p.click('#keepBtn').catch(() => {}); await p.waitForTimeout(150);

  const out = await p.evaluate(async () => {
    SPEED = 400;
    const res = [];
    const cases = [['normal', 0], ['normal', 8], ['elite', 3], ['boss', 10]];
    RG.el = 'nature'; RG.map = rgMakeMap();
    for (const [tier, floor] of cases) {
      const pool = FOES.filter(x => x.tier === tier && x.el !== 'nature');
      let T = 0, W = 0, D = 0; const N = 2;
      for (let k = 0; k < N; k++) {
        const e = pool[k % pool.length];
        const nd = { t: tier, e: e.id, hp: foeHpFor(tier, floor), band: bandOf(floor) };
        RG.on = false; RG.hp = 60; RG.maxhp = 60; RG.floor = floor; RG.at = 0;
        RG.deck = [];
        DECKS.nature.list.filter(([x]) => !LANDS[x])
          .forEach(([x, c]) => { for (let i = 0; i < c; i++) RG.deck.push(x); });
        rgFight(tier, e, nd);
        const kb = document.getElementById('keepBtn'); if (kb) kb.click();
        let t = 0;
        while (t < 20 && S.me.hp > 0 && S.ai.hp > 0) {
          const P = S.me;
          const li = P.hand.findIndex(x => isLand(x));
          if (li >= 0 && !P.landPlayed) { playLand('me', P.hand[li]); P.hand.splice(li, 1); }
          for (let pass = 0; pass < 3; pass++) for (let i = 0; i < P.hand.length; i++) {
            const nm = P.hand[i], c = POOL[nm];
            if (!c || isLand(nm) || !canPay('me', nm)) continue;
            const md = modeOf(nm), idx = autoIdx(md, nm);
            if (md === 'instant') { S.sel = i; S.mode = md; castSelectedInstant(); i--; continue; }
            if (idx < 0) continue;
            S.sel = i; S.mode = md; clickSlot(md === 'target' ? 'ai' : 'me', idx); i--;
          }
          await endTurn(); t++;
          let g = 0; while (S.busy && g++ < 250) await new Promise(r => setTimeout(r, 3));
        }
        T += t; if (S.ai.hp <= 0) W++; D += Math.max(0, 60 - S.me.hp); S.over = true;
      }
      res.push(`${tier.padEnd(6)} ${String(floor).padStart(2)}층 · 적HP ${String(foeHpFor(tier, floor)).padStart(3)}`
        + ` → 평균 ${(T / N).toFixed(1)}턴 · 격파 ${W}/${N} · 내 피해 ${(D / N).toFixed(1)}`);
    }
    return res;
  });
  out.forEach(x => console.log(' ', x));
  console.log('ERRORS:', errs.slice(0, 3));
  await b.close();
})();
