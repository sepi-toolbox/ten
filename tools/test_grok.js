/* 용암 대장 그록 묶음 — 자원 2 지형 · 깎이는 비용 · 연소 부여 제거 · 첫 패 보정
 *   node tools/test_grok.js
 *
 * 여기서 엔진이 새로 배운 것 넷:
 *   화염의 원천 : 지형 **한 장이 자원을 둘** 낸다 → 마나 계산이 '장수' 가 아니라 '합' 이 된다
 *   용암거인   : 인쇄 비용이 곧 비용이 아니다 — 이번 판에 소멸한 크리처 수만큼 깎인다
 *   소이탄     : '부여' 인데 **상대**를 겨눈다(연소 5 = 지연 제거)
 *   첫 패 보정  : 이 적은 늘 화염의 원천을 쥐고 시작한다(카드 효과가 아니다)
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };

  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  ok('용암거인 = 8코 인쇄', pool['용암거인'].c===8&&/비용 -1/.test(pool['용암거인'].kw),
     `${pool['용암거인'].c}코 ${pool['용암거인'].a}/${pool['용암거인'].h} — ${pool['용암거인'].kw}`);
  ok('소이탄 = 연소 부여', pool['소이탄'].c===4&&pool['소이탄'].mode==='grant'
     &&/상대 크리처 1개체에 연소 5 부여/.test(pool['소이탄'].d),
     `${pool['소이탄'].c}코 · ${pool['소이탄'].d}`);
  ok('불의 군단 = 넷으로', /2\/1 화염정령 4개체/.test(pool['불의 군단'].d), pool['불의 군단'].d);
  ok('겁화 → 파이어볼', pool['겁화'].copies===0&&pool['파이어볼'].copies===1,
     '5코 겁화가 빠지고 3코 파이어볼이 들어왔다');

  const foes=JSON.parse(fs.readFileSync(path.join(ROOT,'data','enemies.json'),'utf8')).list;
  const grok=foes.find(e=>e.id==='fire_grok');
  const nm=b=>grok.decks[b].map(x=>x[0]);
  ok('그록 = 거물 고정 덱', !!grok.fixed&&[0,1,2].every(b=>
       grok.decks[b].reduce((s,x)=>s+x[1],0)===23)
     &&nm(0).every(n=>['파이어볼','고블린 방패병','불의 군단','소이탄','겁화룡','용암거인'].includes(n))
     &&nm(0).every(n=>!/^강화 /.test(n)),
     `${nm(0).length}종 23장 — ${nm(0).join(' · ')}`);
  ok('그록 지형 = 원천 1장', JSON.stringify(grok.lands)==='[["화산",16],["화염의 원천",1]]'
     &&grok.opener==='화염의 원천',
     `${JSON.stringify(grok.lands)} · 첫 패 보정 ${grok.opener}`);

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  const R=await p.evaluate(async()=>{
    SPEED=40; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.me.deck=['검사','창병','석벽','돌덩이','가시병','기사'];
      S.dead=0;S.tide=null;S.over=false;S.busy=false;S.sel=null;S.mode=null;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const land=(n,k)=>{for(let i=0;i<k;i++)
      S.me.lands.push({name:n,els:LANDS[n].els.slice(),n:LANDS[n].n,used:false,entering:false});};

    /* ── 화염의 원천 — 한 장이 자원 둘 */
    reset(); land('화산',3);
    o.기본마나=manaLeft('me');
    reset(); land('화염의 원천',1); land('화산',2);
    o.원천={마나:manaLeft('me'), 불:colorLeft('me','fire'), 지형:S.me.lands.length};
    /* 3마나 카드를 원천 1 + 화산 2 로 낸다 — 지형 장수(3)가 아니라 자원 합(4)이 기준 */
    o.원천.낼수있나=canPay('me','화염정령');
    pay('me','화염정령');
    o.원천.남은마나=manaLeft('me');
    /* 작은 지형부터 쓴다 — 2짜리를 1 값에 태워 버리지 않는다 */
    reset(); land('화염의 원천',1); land('화산',2);
    pay('me','불씨정령');                       /* 1코 */
    o.낭비={남은:manaLeft('me'), 원천살아있나:!S.me.lands.find(l=>l.n===2).used};

    /* ── 용암거인 — 소멸한 크리처 수만큼 깎인다 */
    reset(); land('화산',9);
    o.거인=[costOf('me','용암거인')];
    S.dead=3; o.거인.push(costOf('me','용암거인'));
    S.dead=7; o.거인.push(costOf('me','용암거인'));
    S.dead=99; o.거인.push(costOf('me','용암거인'));   /* 최소 1 */
    /* 실제로 죽으면 자동으로 센다 */
    reset(); put('me','검사'); put('ai','창병');
    S.me.board[0].insts[0].hp=0; cleanup('me');
    S.ai.board[0].insts[0].hp=0; cleanup('ai');
    o.카운터=S.dead;                              /* 양쪽 다 센다 */

    /* ── 소이탄 — 상대에게 연소 5 */
    reset(); put('ai','화염정령');
    o.소이탄={모드:modeOf('소이탄'), 전:S.ai.board[0].burn};
    resolveOnFoe('me','소이탄',0);
    o.소이탄.후=S.ai.board[0].burn;
    endStep('ai');                               /* 상대 턴 종료 = 연소가 돈다 */
    o.소이탄.남은체력=S.ai.board[0]?S.ai.board[0].insts[0].hp:0;

    /* ── 불의 군단 — 2/1 넷 */
    reset(); resolveSummon('me','불의 군단',0);
    o.군단=S.me.board.filter(Boolean).map(u=>`${u.a}/${u.insts[0].hp}`);
    return o;
  });

  ok('원천 = 자원 2', R.기본마나===3&&R.원천.마나===4&&R.원천.불===4&&R.원천.지형===3,
     `화산 3장 = ${R.기본마나} · 원천1+화산2(지형 ${R.원천.지형}장) = ${R.원천.마나}마나`);
  ok('자원 합으로 지불', R.원천.낼수있나&&R.원천.남은마나===1,
     `3코 지불 후 ${R.원천.남은마나} 남음`);
  ok('작은 지형부터 쓴다', R.낭비.남은===3&&R.낭비.원천살아있나,
     '1코를 화산으로 냈다 — 자원 2짜리를 태워 버리지 않는다');
  ok('용암거인 = 깎이는 비용', R.거인.join()==='8,5,1,1',
     `소멸 0/3/7/99 → ${R.거인.join(' · ')}코 (3개체에서 본전 · 최소 1)`);
  ok('소멸 카운터는 양쪽', R.카운터===2, `내 검사 + 상대 창병 = ${R.카운터}`);
  ok('소이탄 = 상대에게 부여', R.소이탄.모드==='target'&&R.소이탄.전===2&&R.소이탄.후===7
     &&R.소이탄.남은체력===0,
     `modeOf ${R.소이탄.모드} · 화염정령 연소 ${R.소이탄.전}→${R.소이탄.후} → 턴 끝에 소멸`);
  ok('불의 군단 = 2/1 넷', R.군단.join()==='2/1,2/1,2/1,2/1', R.군단.join(' · '));

  /* ── 첫 패 보정 + AI ─────────────────────────────────────── */
  const A=await p.evaluate(async()=>{
    const o={};
    const e=FOES.find(x=>x.id==='fire_grok');
    /* rgFight 를 흉내 낸다 — 고정 덱 + 지형 + 첫 패 보정 */
    EOPEN=e.opener;
    EDECK=e.decks[0].map(([n,c])=>[n,c]).concat(e.lands.map(([n,c])=>[n,c]));
    let hit=0;
    for(let k=0;k<12;k++){
      S.ai.deck=buildDeck(EDECK); S.ai.hand=[];
      dealHand('ai');
      if(S.ai.hand.includes('화염의 원천'))hit++;
    }
    o.첫패=hit;
    o.손패수=S.ai.hand.length;
    EOPEN=null; EDECK=null;

    /* 소이탄 — 두 턴 안에 죽을 몸에만 쓴다 */
    const setup=(hand,foe)=>{
      S.ai.hand=hand.slice(); S.ai.deck=[]; S.ai.board=[]; S.me.board=[];
      S.ai.lands=Array(9).fill(0).map(()=>({name:'화산',els:['fire'],used:false,entering:false}));
      S.ai.landPlayed=true; S.over=false; S.dead=0;
      (foe||[]).forEach(n=>placeCreature('me',n,S.me.board.length));
    };
    setup(['소이탄'],['용암거인']);              /* 체력 12 — 연소 5로는 두 턴에 못 죽인다 */
    await aiTurn();
    o.아낀다={손:S.ai.hand.length, 연소:(S.me.board[0]||{}).burn};
    setup(['소이탄'],['화염정령']);              /* 체력 5 — 심으면 곧 탄다 */
    /* ⚠ 대상이 붙었는지를 **즉시** 본다 — aiTurn 뒤에 턴 종료가 돌면 그 몸이 사라져 못 읽는다 */
    const before=S.me.board[0].burn;
    await aiTurn();
    o.쓴다={손:S.ai.hand.length, 전:before,
            후:(S.me.board[0]||{}).burn, 죽음:!S.me.board[0]};
    return o;
  });
  ok('첫 패에 늘 원천', A.첫패===12&&A.손패수===7,
     `12판 중 ${A.첫패}판 — 손패 ${A.손패수}장은 그대로`);
  ok('AI — 안 죽을 몸엔 안 쓴다', A.아낀다.손===1&&A.아낀다.연소===3,
     `용암거인(체력 12)에는 소이탄을 아낀다 (연소 ${A.아낀다.연소} 그대로)`);
  ok('AI — 탈 몸에는 쓴다', A.쓴다.손===0&&(A.쓴다.후===7||A.쓴다.죽음),
     `화염정령(체력 5) 연소 ${A.쓴다.전} → ${A.쓴다.죽음?'심자마자 타 죽음':A.쓴다.후}`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
