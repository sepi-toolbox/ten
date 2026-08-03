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
  /* ⚠ **기존 불 카드가 한 장이라도 섞이면 실패다.** 한 번 자동 생성 덱에 고블린을 얹었더니
     용암거인·겁화룡·소이탄 같은 옛 카드가 8장 남아 컨셉 덱이 아니게 됐다. */
  const GOB=['고블린 폭탄병','용암 정령','불사조의 깃털','고블린 지휘관','고블린 전차',
             '불꽃광대','고블린 화염포','고블린 방패병',
             '고블린 미치광이','고블린의 열의','고블린 지뢰'];
  const strays=gob.decks[0].map(([n])=>n).filter(n=>!GOB.includes(n));
  ok('고블린 카드만으로', strays.length===0,
     strays.length?`섞인 옛 카드: ${strays.join(', ')}`:`${GOB.length}종 · 4코에서 끝나는 어그로 커브`);
  /* ⚠ 고정 덱은 **강화 카드 치환을 받지 않는다.** 강화는 '같은 카드인데 수치만 큰 것' 이라
     컨셉 덱에서는 단계가 올라도 하는 일이 안 변한다 — 대신 단계마다 새 카드가 들어간다. */
  const band=[0,1,2].map(b=>gob.decks[b].map(([n])=>n));
  ok('단계마다 강화 0장', band.every(l=>l.every(n=>!/^강화 /.test(n))&&l.every(n=>GOB.includes(n))),
     band.map((l,i)=>`${i+1}단계 ${l.length}종`).join(' · '));
  ok('단계가 오르면 덱이 바뀐다',
     band[1].includes('고블린 미치광이')&&band[1].includes('고블린의 열의')
     &&!band[0].includes('고블린 미치광이')&&band[2].includes('고블린 지뢰')
     &&!band[1].includes('고블린 지뢰')&&[0,1,2].every(b=>gob.decks[b].reduce((s,[,c])=>s+c,0)===23),
     '2단계 미치광이·열의 · 3단계 지뢰 — 매 단계 23장 유지');

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

    /* 삼킴은 **정식 파괴 판정**을 지난다 — 폭발·불사조가 그대로 터져야 한다(그게 콤보다) */
    reset(); put('me','고블린 폭탄병');
    const face0=S.ai.hp; put('me','고블린 전차');
    out.mawBoom=face0-S.ai.hp;
    reset(); put('me','불사조'); put('me','고블린 전차');
    out.mawPhoenix=S.me.board.filter(Boolean).map(u=>u.name);
    const ch=S.me.board.find(u=>u&&u.ate);
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

    /* ── 2·3단계 신규 3종 ─────────────────────────────────── */
    /* 미치광이 — 12 을 1점씩 흩뿌린다. 자신은 안 맞고, 아군도 맞는다 */
    /* ⚠ 경화·가호가 있는 몸을 세우면 1 점짜리 탄이 먹히지 않아 합계가 안 맞는다 —
       방어 키워드가 없는 불 크리처로만 판을 채운다(총 체력 16 > 12 발). */
    reset(); ['불씨정령','화염정령'].forEach(n=>put('me',n));
    ['불씨정령','화염정령'].forEach(n=>put('ai',n));
    const tot=()=>['me','ai'].reduce((s,side)=>s+S[side].board
      .reduce((t,u)=>t+(u&&u.kind==='cr'&&u.insts[0]?u.insts[0].hp:0),0),0);
    const t0=tot(); put('me','고블린 미치광이');
    const mad=S.me.board.find(u=>u&&u.name==='고블린 미치광이');
    out.mad=[t0, tot(), mad?mad.insts[0].hp:0];

    /* 열의 — **토큰이 아니라 카드 그대로** 둘을 부른다(연소 1 · 폭발이 따라온다) */
    reset(); put('me','검사');
    resolveSummon('me','고블린의 열의',0);
    out.zeal=S.me.board.filter(Boolean).map(u=>
      `${u.name}${u.token?'(토큰)':''} ${u.a}/${u.insts[0].hp} b${u.burn||0}${u.boom?' 폭발':''}`);

    /* 지뢰 — 폭발이 터지면 그 값만큼 상대 크리처에게도 꽂힌다 */
    reset(); put('me','고블린 폭탄병'); put('ai','석벽');
    S.me.board.push({name:'고블린 지뢰',kind:'en',v:POOL['고블린 지뢰'].v,charge:POOL['고블린 지뢰'].ch});
    const wall0=S.ai.board[0].insts[0].hp, face1=S.ai.hp, bomb=S.me.board[0];
    bomb.insts[0].hp=0; cleanup('me');
    out.mine={얼굴:face1-S.ai.hp, 벽:[wall0, S.ai.board[0]?S.ai.board[0].insts[0].hp:0],
              충전:(S.me.board.find(u=>u&&u.kind==='en')||{charge:0}).charge};
    return out;
  });

  ok('속공 = 즉시 공격', R.rushWait&&R.rushDmg>0&&R.rushSick,
     `대기 → 지정 → ${R.rushDmg} 피해 · 그 개체는 이번 턴 정규 공격 제외`);
  /* 불사조는 이제 잿불이 아니라 **알**로 남는다(내 턴 시작에 멀쩡한 몸으로 부화) */
  ok('삼킴 = 정식 파괴 판정', R.mawBoom>0&&R.mawPhoenix.includes('불사조의 알'),
     `폭탄병을 삼키자 얼굴에 ${R.mawBoom} · 불사조를 삼키자 ${R.mawPhoenix.join()} (죽을 때 효과가 터진다)`);
  ok('전차 = 아군을 삼킨다', R.ate==='불사조', `${R.ate} 을(를) 삼킴`);
  ok('전차 소멸 = 되돌려 놓음', R.boardAfterDeath.includes('불사조'),
     `전차가 죽자 ${R.boardAfterDeath.join()} 복귀`);
  ok('도화선 = 버프 + 연소 부여', R.fuse[1][0]===R.fuse[0][0]+5&&R.fuse[1][1]===R.fuse[0][1]+3,
     `${R.fuse[0][0]}/연소${R.fuse[0][1]} → ${R.fuse[1][0]}/연소${R.fuse[1][1]} (연소는 더해진다)`);
  ok('깃털 = 희생하고 2장', R.sac[0]===0&&R.sac[1]===2, `제물 1 · 드로우 ${R.sac[1]}장`);
  ok('요새 = 자원 0 · 매 턴 소환', R.fortMana===0&&R.fortLands===1&&R.fortBoard[0]==='고블린 폭탄병',
     `지형 1장인데 마나 ${R.fortMana} · 턴 시작에 ${R.fortBoard.join()}`);
  ok('화염포 = 양쪽 무작위', R.cannon[0]-R.cannon[1]===5,
     `충전 5 → 총 체력 ${R.cannon[0]} → ${R.cannon[1]} (아군도 맞는다)`);
  /* 뒤 합계에는 미치광이 자신의 체력이 새로 들어가 있으므로 빼고 잰다 */
  ok('미치광이 = 12 를 흩뿌린다', R.mad[0]-(R.mad[1]-R.mad[2])===12&&R.mad[2]===1,
     `남 체력 ${R.mad[0]} → ${R.mad[1]-R.mad[2]} · 자신은 안 맞는다 (HP ${R.mad[2]})`);
  ok('열의 = 카드 그대로 둘', R.zeal.filter(x=>/고블린 폭탄병/.test(x)).length===2
     &&!/토큰/.test(R.zeal.join())&&/b1 폭발/.test(R.zeal.join())
     &&/^검사 /.test(R.zeal[0]),
     `${R.zeal.join(' · ')} — 오른쪽에 붙는다`);
  ok('지뢰 = 폭발 되메아리', R.mine.얼굴===2&&R.mine.벽[1]===R.mine.벽[0]-2&&R.mine.충전===5,
     `폭탄병 폭발 2 → 얼굴 ${R.mine.얼굴} · 석벽 ${R.mine.벽[0]}→${R.mine.벽[1]} · 잔여 충전 ${R.mine.충전}`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
