/* 인챈트(트리거형) 15종 + 스펠 부가 조항 전수 검사
 *   node tools/test_ench.js
 *
 * 왜 이 파일이 있나 — 한때 엔진이 **모든 인챈트를 얼굴 피해로만** 처리했다. 15종 중 12종이
 * 인쇄된 규칙과 달랐고, 어둠 덱의 'HP 지불' 5종은 대가를 아예 안 치렀다. 예산표가 무의미했다.
 * 여기서는 **카드에 찍힌 문구대로 도는가**만 본다.
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  const ench=Object.entries(pool).filter(([,c])=>c.k==='en');

  ok('인챈트는 전부 트리거형', ench.every(([,c])=>c.tg&&c.fx),
     ench.map(([n,c])=>`${n}(${c.tg})`).join(' · '));
  /* 같은 효과를 가진 카드를 만들지 말 것 — 한때 2코 인챈트 넷이 전부 "HP +4" 로 똑같았다 */
  const sigs=ench.map(([,c])=>`${c.tg}/${c.fx}/${c.v}/${c.ch}`);
  ok('똑같은 인챈트 없음', new Set(sigs).size===sigs.length,
     `${sigs.length}종 중 서로 다른 조합 ${new Set(sigs).size}가지`);

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  /* 데이터의 fx 키가 엔진에 전부 있는가 — 새 인챈트를 만들고 한쪽만 고치면 조용히 안 돈다 */
  const miss=await p.evaluate(()=>Object.values(POOL).filter(c=>c.k==='en')
    .map(c=>c.fx).filter((x,i,a)=>a.indexOf(x)===i).filter(k=>!ENCHFX[k]));
  ok('fx 키가 엔진에 있다', miss.length===0, miss.length?`엔진에 없음: ${miss}`:'전부 짝이 맞는다');

  const R=await p.evaluate(async()=>{
    SPEED=40; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.me.deck=['검사','창병','석벽','돌덩이','가시병','기사'];S.tide=null;S.over=false;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const en=(pl,n)=>{const c=POOL[n];S[pl].board.push({name:n,kind:'en',v:c.v,charge:c.ch});};
    const hp=(pl,i)=>{const u=S[pl].board[i];return u&&u.insts[0]?u.insts[0].hp:0;};
    const mana=n=>{S.me.lands=Array(n).fill(0)
      .map(()=>({name:'심연',els:['dark','fire','water','nature','steel','earth','light'],
                 used:false,entering:false}));};

    // ── 턴 종료 트리거 8종
    reset(); S.me.hp=30; en('me','성화'); fireEnch('me','end'); o.성화=S.me.hp-30;
    reset(); en('me','조수의 인장'); fireEnch('me','end'); o.인장=60-S.ai.hp;
    reset(); put('ai','검사'); put('ai','창병'); en('me','불의 제단'); fireEnch('me','end');
    o.제단=[hp('ai',0),hp('ai',1)];
    reset(); put('ai','창병'); const a0=S.ai.board[0].a; en('me','해무'); fireEnch('me','end');
    o.해무=[a0,S.ai.board[0].a];
    reset(); put('me','검사'); en('me','생명의 샘'); fireEnch('me','end');
    o.생명의샘=[S.me.board[0].a,hp('me',0)];
    reset(); put('me','검사'); en('me','병기고'); fireEnch('me','end'); o.병기고=S.me.board[0].hard;
    reset(); en('me','고대 제단'); fireEnch('me','end'); o.고대제단=60-S.ai.hp;
    // ── 조건 트리거
    reset(); put('me','검사'); en('me','흡혈 의식'); S.me.hp=30;
    S.me.board[0].insts[0].hp=0; cleanup('me'); o.흡혈의식=S.me.hp-30;
    reset(); put('me','검사'); put('ai','창병'); en('me','연쇄 발화');
    S.me.board[0].insts[0].hp=0; cleanup('me'); o.연쇄발화=hp('ai',0);
    reset(); en('me','대지의 축복'); put('me','검사');
    const nu=S.me.board.find(u=>u.kind==='cr'); o.축복=[nu.a,nu.insts[0].hp];
    reset(); en('me','빛의 장막'); S.me.hp=30; put('me','검사'); o.장막=S.me.hp-30;
    reset(); en('me','전열 구축'); put('ai','창병'); o.전열=hp('ai',0);
    reset(); put('me','검사'); en('me','강철 의지');
    const w=S.me.board[0]; hurt(w,w.insts[0],2); o.강철의지=[w.insts[0].hp,w.insts[0].mh];
    reset(); put('ai','창병'); en('me','피의 성배'); put('me','망령'); o.성배=hp('ai',0);

    // ── 스펠 부가 조항
    reset(); mana(6); put('ai','창병'); pay('me','피의 못'); o.피의못=60-S.me.hp;
    reset(); mana(6); pay('me','금단의 지식'); o.금단=60-S.me.hp;
    reset(); put('ai','창병'); S.me.hp=40; resolveOnFoe('me','심판',0); o.심판=S.me.hp-40;
    /* 소이탄 — 즉시 파괴가 아니라 **상대 몸에 연소 5를 심는다**(대상이 반대편으로 뒤집혔다) */
    reset(); put('ai','창병'); resolveOnFoe('me','소이탄',0);
    o.소이탄=[S.ai.board[0].burn, modeOf('소이탄')];
    reset(); put('ai','창병'); put('me','검사'); resolveOnFoe('me','포식',0);
    o.포식=[S.me.board[0].a,hp('me',0)];
    reset(); put('ai','강철수호'); const s0=hp('ai',0); resolveOnFoe('me','쐐기',0);
    o.쐐기=[s0,hp('ai',0)];
    reset(); put('ai','기사'); resolveOnFoe('me','가시덩쿨',0); o.덩쿨1=hp('ai',0);
    reset(); put('ai','기사'); ['검사','창병','석벽'].forEach(n=>put('me',n));
    resolveOnFoe('me','가시덩쿨',0); o.덩쿨3=hp('ai',0);
    reset(); let h0=S.me.hand.length; resolveInstant('me','폐허 발굴'); o.발굴0=S.me.hand.length-h0;
    reset(); put('me','검사'); h0=S.me.hand.length; resolveInstant('me','폐허 발굴');
    o.발굴1=S.me.hand.length-h0;
    reset(); put('me','기사'); h0=S.me.hand.length; resolveOnMine('me','용해',0);
    o.용해=[hp('me',0),S.me.hand.length-h0];
    reset(); put('me','기사'); const ka=S.me.board[0].a; o.분신=[ka,aoeVal('me','분신')];
    reset(); put('me','불씨정령'); put('me','화염정령'); o.연쇄폭발=aoeVal('me','연쇄 폭발');
    reset(); put('ai','창병'); resolveSummon('me','밀물의 부름',0); o.부름=!!S.tide;
    return o;
  });

  ok('턴 종료 트리거 7종', R.성화===4&&R.인장===4&&R.제단[0]===2&&R.해무[1]===R.해무[0]-2
     &&R.생명의샘[0]===3&&R.병기고===1&&R.고대제단===2,
     `성화 +${R.성화} · 인장 ${R.인장} · 제단 ${R.제단} · 해무 ATK ${R.해무[0]}→${R.해무[1]}`
     +` · 샘 ${R.생명의샘} · 병기고 경화${R.병기고} · 고대제단 ${R.고대제단}`);
  ok('소멸 트리거', R.흡혈의식===3&&R.연쇄발화===1, `흡혈 의식 +${R.흡혈의식} · 연쇄 발화 → 창병 ${R.연쇄발화}`);
  ok('소환 트리거', R.축복[0]===3&&R.축복[1]===6&&R.장막===3,
     `대지의 축복 ${R.축복.join('/')} · 빛의 장막 +${R.장막}`);
  ok('상대 소환 트리거', R.전열===1, `전열 구축 → 상대 창병 ${R.전열}`);
  ok('피해 트리거', R.강철의지[0]===R.강철의지[1], `강철 의지 — 맞자마자 ${R.강철의지[0]}/${R.강철의지[1]} 로 복구`);
  ok('HP 지불 트리거', R.성배===1, `망령의 대가 4 지불 → 피의 성배가 창병에 3 (${R.성배} 남음)`);

  ok('HP 지불 스펠', R.피의못===8&&R.금단===14, `피의 못 −${R.피의못} · 금단의 지식 −${R.금단}`);
  ok('요격 뒤 조항', R.심판===8&&R.포식[0]===4,
     `심판 +${R.심판} 회복 · 포식 버프 ${R.포식.join('/')}`);
  ok('상대에게 심는 부여', R.소이탄[0]===5&&R.소이탄[1]==='target',
     `소이탄 → 창병 연소 ${R.소이탄[0]} · modeOf ${R.소이탄[1]} (내 편이 아니라 상대를 겨눈다)`);
  ok('경화 무시', R.쐐기[1]===R.쐐기[0]-2, `강철수호(경화 1)에 ${R.쐐기[0]}→${R.쐐기[1]} — 2 그대로 들어갔다`);
  ok('조건부 피해', R.덩쿨3<R.덩쿨1, `가시덩쿨 — 내 개체 0일 때 ${R.덩쿨1} · 3개체일 때 ${R.덩쿨3}`);
  ok('조건부 드로우', R.발굴0===3&&R.발굴1===1, `폐허 발굴 — 크리처 0 → ${R.발굴0}장 · 1 → ${R.발굴1}장`);
  ok('자해 드로우', R.용해[1]===2&&R.용해[0]>0, `용해 — 기사 HP ${R.용해[0]} · ${R.용해[1]}장`);
  ok('분신 = 제물 ATK', R.분신[1]===R.분신[0], `기사 ATK ${R.분신[0]} → 광역 ${R.분신[1]}`);
  ok('연쇄 폭발 = 3+연소수', R.연쇄폭발===5, `연소 2종 → ${R.연쇄폭발}`);
  ok('밀물의 부름 바운스', R.부름, '소환 뒤 되돌릴 대상을 고르게 한다');

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
