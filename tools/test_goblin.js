/* 고블린 카드 묶음 — 속공 · 전차 삼킴 · 고블린 요새 · 도화선 · 희생 드로우 · 화염포
 *   node tools/test_goblin.js
 * ⚠ '사나운 고블린' 은 gen_enemies 의 FIXED 로 **손으로 짠 덱**을 쓰는 첫 적이다.
 *   자동 생성 덱과 달리 지형 구성까지 지정하므로 그 경로도 함께 본다. */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(22)+' '+d); };

  // 0) 고정 덱 데이터 — 골격(23장)과 지형 구성
  const en=JSON.parse(fs.readFileSync(path.join(ROOT,'data','enemies.json'),'utf8'));
  const gob=en.list.find(e=>e.id==='fire_goblin');
  const n0=gob.decks[0].reduce((s,[,c])=>s+c,0);
  ok('고정 덱 23장', !!gob.fixed&&n0===23, `${gob.name} · ${n0}장 · 지형 ${JSON.stringify(gob.lands)}`);
  ok('덱이 고블린으로 찬다',
     gob.decks[0].filter(([n])=>/고블린|와이번|용암 정령|도화선|파이어 볼트/.test(n)).length>=8,
     gob.decks[0].filter(([n])=>/고블린/.test(n)).map(([n,c])=>`${n}×${c}`).join(' · '));

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  const R=await p.evaluate(async()=>{
    SPEED=40; const out={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.me.noecho={};S.tide=null;S.rush=null;S.over=false;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};

    reset(); put('me','화염정령'); put('me','고블린 지휘관');
    out.rushWait=!!S.rush; out.rushList=S.rush?S.rush.list.slice():[];
    const f0=S.ai.hp; if(S.rush)rushAttack('me',S.rush.list[0]);
    out.rushDmg=f0-S.ai.hp; out.rushSick=S.me.board[0].sick;

    reset(); put('me','화염정령'); put('me','고블린 전차');
    const ch=S.me.board.find(u=>u&&u.name==='고블린 전차');
    out.ate=ch&&ch.ate; out.boardAfterEat=S.me.board.filter(Boolean).map(u=>u.name);
    ch.insts[0].hp=0; cleanup('me');
    out.boardAfterDeath=S.me.board.filter(Boolean).map(u=>u.name);

    reset(); put('me','화염정령');
    const b0=[S.me.board[0].a,S.me.board[0].burn];
    resolveOnMine('me','도화선',0);
    out.fuse=[b0,[S.me.board[0].a,S.me.board[0].burn]];

    reset(); put('me','용암 정령'); S.me.deck=['불씨정령','잿불새','작열병'];
    const h0=S.me.hand.length; resolveOnMine('me','불사조의 깃털',0);
    out.sac=[S.me.board.filter(Boolean).length, S.me.hand.length-h0];

    reset(); playLand('me','고블린 요새');
    out.fortMana=manaLeft('me'); out.fortLands=S.me.lands.length;
    S.turn=2; startTurn('me');
    out.fortBoard=S.me.board.filter(Boolean).map(u=>u.name);

    reset(); put('me','화염정령'); put('ai','검사'); put('ai','창병');
    S.me.board.push({name:'고블린 화염포',kind:'en',v:POOL['고블린 화염포'].v,charge:5});
    const before=S.me.board[0].insts[0].hp+S.ai.board[0].insts[0].hp+S.ai.board[1].insts[0].hp;
    await drainEnchants('me');
    const after=['me','ai'].reduce((s,side)=>s+S[side].board
      .reduce((t,u)=>t+(u&&u.kind==='cr'&&u.insts[0]?u.insts[0].hp:0),0),0);
    out.cannon=[before,after];
    return out;
  });

  ok('속공 = 즉시 공격', R.rushWait&&R.rushDmg>0&&R.rushSick,
     `대기 → 지정 → ${R.rushDmg} 피해 · 그 개체는 이번 턴 정규 공격 제외`);
  ok('전차 = 아군을 삼킨다', R.ate==='화염정령'&&R.boardAfterEat.length===1,
     `${R.ate} 을(를) 삼킴 → 판에 전차만 남음`);
  ok('전차 소멸 = 되돌려 놓음', R.boardAfterDeath.join()==='화염정령',
     `전차가 죽자 ${R.boardAfterDeath.join()} 복귀`);
  ok('도화선 = 버프 + 연소 부여', R.fuse[1][0]===R.fuse[0][0]+5&&R.fuse[1][1]===R.fuse[0][1]+3,
     `${R.fuse[0][0]}/연소${R.fuse[0][1]} → ${R.fuse[1][0]}/연소${R.fuse[1][1]} (연소는 더해진다)`);
  ok('깃털 = 희생하고 2장', R.sac[0]===0&&R.sac[1]===2, `제물 1 · 드로우 ${R.sac[1]}장`);
  ok('요새 = 자원 0 · 매 턴 소환', R.fortMana===0&&R.fortLands===1&&R.fortBoard[0]==='고블린 폭탄병',
     `지형 1장인데 마나 ${R.fortMana} · 턴 시작에 ${R.fortBoard.join()}`);
  ok('화염포 = 양쪽 무작위', R.cannon[0]-R.cannon[1]===5,
     `충전 5 → 총 체력 ${R.cannon[0]} → ${R.cannon[1]} (아군도 맞는다)`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
