/* 연소 컨셉 신규 5종 — 잿불 방화범 · 화염술사 카린이 쓰는 카드가 문구대로 도는가
 *   node tools/test_burn.js
 *
 * 왜 이 파일이 있나 — 이 다섯은 **엔진에 없던 동작**을 처음 요구한 카드들이다.
 *   정령의 불꽃 : 소환 개수를 카드가 아니라 **손패**에서 센다 (그전까지 개수는 항상 문구에 박혀 있었다)
 *   불씨 살리기 : 대상을 고르지 않는 강화 (그전까지 '강화'는 전부 대상 지정이었다)
 *   화염 아귀   : **내가 스펠을 낼 때** 반응한다 (그전까지 크리처 트리거는 소환·소멸·턴종료뿐)
 *   화염 방패   : 버프와 연소 부여를 한 장에서 (도화선과 같은 장치 — 회귀 확인용)
 *   파이어볼    : 아군까지 태우는 광역 (겁화와 같은 장치 — 회귀 확인용)
 * 여기에 더해, **AI 가 이 카드들을 실제로 낼 수 있는가**까지 본다. 한때 AI 는 '강화·부여'
 * 부류를 아예 못 내서 고블린 덱의 도화선 2장이 끝까지 손에서 썩었다.
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(26)+' '+d); };

  /* 데이터 쪽 — 다섯 장이 실제로 카드 풀에 있고 매수 0(덱 미수록)인가 */
  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  const NEW=['정령의 불꽃','불씨 살리기','화염 아귀','파이어볼','화염 방패','작열 좀비','잿더미 좀비'];
  ok('신규 5종이 풀에 있다', NEW.every(n=>pool[n]),
     NEW.map(n=>`${n}(${pool[n]?pool[n].c+'코':'없음'})`).join(' · '));
  ok('전부 덱 미수록(매수 0)', NEW.every(n=>pool[n]&&pool[n].copies===0),
     '플레이어 불 덱 골격은 건드리지 않는다');

  /* 적 고정 덱 — 두 적이 이 카드들로 짜였는가 */
  const foes=JSON.parse(fs.readFileSync(path.join(ROOT,'data','enemies.json'),'utf8')).list;
  const arson=foes.find(e=>e.id==='fire_arson'), karin=foes.find(e=>e.id==='fire_karin');
  const names=e=>e.decks[0].map(x=>x[0]);
  const n23=e=>e.decks[0].reduce((s,x)=>s+x[1],0);
  ok('방화범 = 연소 8종 23장', n23(arson)===23&&names(arson).length===8
     &&names(arson).includes('정령의 불꽃')&&names(arson).includes('화염 방패')
     &&!names(arson).includes('불사조의 깃털'),
     `${names(arson).length}종 ${n23(arson)}장 — ${names(arson).join(' · ')}`);
  ok('카린 = 주문 8종 23장', n23(karin)===23&&names(karin).length===8
     &&names(karin).includes('화염 아귀')&&names(karin).includes('파이어볼')
     &&names(karin).includes('작열 좀비'),
     `${names(karin).length}종 ${n23(karin)}장 — ${names(karin).join(' · ')}`);
  /* 컨셉이 섞이지 않았는가 — 방화범 덱에 카린 전용이 들어가면 둘을 구분할 이유가 없어진다 */
  ok('두 덱이 안 겹친다', !names(arson).includes('파이어볼')&&!names(karin).includes('정령의 불꽃'),
     '방화범=자폭 물량 · 카린=주문 한 방');

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
      S.tide=null;S.over=false;S.busy=false;S.sel=null;S.mode=null;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const hp=(pl,i)=>{const u=S[pl].board[i];return u&&u.insts[0]?u.insts[0].hp:0;};
    const mana=n=>{S.me.lands=Array(n).fill(0)
      .map(()=>({name:'심연',els:['dark','fire','water','nature','steel','earth','light'],
                 used:false,entering:false}));};

    // ── 정령의 불꽃 — 패를 통째로 3/1 자폭병으로
    reset(); mana(6); S.me.hand=['정령의 불꽃','검사','창병','석벽'];
    S.sel=0; S.mode='summon'; await clickSlot('me',0);
    o.불꽃={손:S.me.hand.length, 개체:S.me.board.length,
            스탯:S.me.board.map(u=>`${u.a}/${u.insts[0].hp}`).join(','),
            연소:S.me.board.map(u=>u.burn||0), 이름:S.me.board[0]&&S.me.board[0].name};
    endStep('me');                              /* 연소 1 · HP 1 → 그 턴에 전부 타 죽는다 */
    o.불꽃.턴끝=S.me.board.filter(u=>u&&u.kind==='cr').length;

    // 패가 비어 있어도 카드는 나간다(무르지 않는다)
    reset(); mana(6); S.me.hand=['정령의 불꽃'];
    S.sel=0; S.mode='summon'; await clickSlot('me',0);
    o.빈패={손:S.me.hand.length, 개체:S.me.board.length};

    // ── 불씨 살리기 — 연소 크리처만, 대상 지정 없이, 최대치까지 올린다
    reset(); put('me','불씨정령'); put('me','화염정령'); put('me','검사');
    const b0=[hp('me',0),hp('me',1),hp('me',2)];
    o.살리기모드=modeOf('불씨 살리기');
    resolveInstant('me','불씨 살리기');
    o.살리기={전:b0, 후:[hp('me',0),hp('me',1),hp('me',2)],
              최대:S.me.board.map(u=>u.insts[0].mh)};

    // ── 화염 아귀 — 스펠을 낼 때마다 HP +1 (최대치도 같이)
    reset(); mana(9); put('me','화염 아귀');
    const a0=hp('me',0);
    pay('me','파이어 볼트'); pay('me','섬광 계시');
    const a1=hp('me',0);
    pay('me','검사');                            /* 크리처는 반응하지 않는다 */
    o.아귀={전:a0, 스펠2회:a1, 크리처뒤:hp('me',0), 최대:S.me.board[0].insts[0].mh};

    // ── 화염 방패 — +0/+5 와 연소 2 를 같이
    reset(); put('me','화염 아귀');
    resolveOnMine('me','화염 방패',0);
    o.방패={a:S.me.board[0].a, hp:hp('me',0), burn:S.me.board[0].burn};

    // ── 작열 좀비 — 죽으면 잿더미 좀비(0/3 수호)가 그 자리에 남는다
    reset(); put('me','검사'); put('me','작열 좀비'); put('me','창병');
    const z=S.me.board[1];
    o.좀비={전:`${z.a}/${z.insts[0].hp}`, burn:z.burn, rise:z.rise};
    z.insts[0].hp=0; cleanup('me');
    const ash=S.me.board[1];
    o.좀비.뒤=ash?`${ash.name} ${ash.a}/${ash.insts[0].hp}${ash.g?' 수호':''}`:'없음';
    o.좀비.자리=S.me.board.map(u=>u.name).join(',');
    /* 확대창 — 앞뒤로 서로를 가리키는가 */
    o.좀비.짝=[grownPeer('작열 좀비'), grownPeer('잿더미 좀비')];

    // ── 파이어볼 — 적 전체 4 · 내 크리처도 4
    reset(); put('ai','화염정령'); put('me','화염정령');
    S.ai.board.forEach(u=>hurtAll(u,0));
    const f0=[hp('ai',0),hp('me',0)];
    S.ai.board.forEach(u=>{if(u&&u.kind==='cr')hurtAll(u,aoeVal('me','파이어볼'));});
    spellSelfDmg('me','파이어볼');
    o.파이어볼={전:f0, 적:hp('ai',0), 나:hp('me',0)};
    return o;
  });

  ok('정령의 불꽃 = 패 → 몸', R.불꽃.손===0&&R.불꽃.개체===3&&R.불꽃.스탯==='3/1,3/1,3/1'
     &&R.불꽃.연소.every(x=>x===1),
     `패 3장 → ${R.불꽃.이름} ${R.불꽃.개체}개체 (${R.불꽃.스탯} · 연소 ${R.불꽃.연소.join('')})`);
  ok('자폭병은 그 턴에 탄다', R.불꽃.턴끝===0, `턴 종료 뒤 남은 개체 ${R.불꽃.턴끝}`);
  ok('빈 패여도 무르지 않는다', R.빈패.손===0&&R.빈패.개체===0, '손패에 되돌아오지 않는다');

  ok('불씨 살리기 = 대상 없음', R.살리기모드==='instant', `modeOf → ${R.살리기모드}`);
  ok('연소만 HP +2', R.살리기.후[0]===R.살리기.전[0]+2&&R.살리기.후[1]===R.살리기.전[1]+2
     &&R.살리기.후[2]===R.살리기.전[2],
     `불씨정령 ${R.살리기.전[0]}→${R.살리기.후[0]} · 화염정령 ${R.살리기.전[1]}→${R.살리기.후[1]}`
     +` · 검사 ${R.살리기.전[2]}→${R.살리기.후[2]} (연소 없음 → 그대로)`);
  ok('최대치도 같이 오른다', R.살리기.최대[0]===R.살리기.후[0],
     `최대 HP ${R.살리기.최대.join('/')} — 회복 상한이 아니라 몸이 커진 것`);

  ok('화염 아귀 = 스펠에 반응', R.아귀.스펠2회===R.아귀.전+4&&R.아귀.크리처뒤===R.아귀.스펠2회,
     `HP ${R.아귀.전} → 스펠 2장 뒤 ${R.아귀.스펠2회}(장당 +2) → 크리처는 반응 없음 ${R.아귀.크리처뒤}`);
  ok('화염 방패 = 버프+연소', R.방패.a===3&&R.방패.hp===6&&R.방패.burn===2,
     `화염 아귀 3/1 → ${R.방패.a}/${R.방패.hp} 연소 ${R.방패.burn}`);
  ok('작열 좀비 = 잿더미로', R.좀비.rise==='잿더미 좀비'&&/잿더미 좀비 0\/3 수호/.test(R.좀비.뒤)
     &&R.좀비.자리==='검사,잿더미 좀비,창병',
     `${R.좀비.전} 연소 ${R.좀비.burn} → ${R.좀비.뒤} · 자리 유지 [${R.좀비.자리}]`);
  ok('확대창이 짝을 가리킨다', R.좀비.짝[0]==='잿더미 좀비'&&R.좀비.짝[1]==='작열 좀비',
     `작열 좀비 ↔ ${R.좀비.짝.join(' ↔ ')}`);
  ok('파이어볼 = 양쪽 4', R.파이어볼.적===R.파이어볼.전[0]-4&&R.파이어볼.나===R.파이어볼.전[1]-4,
     `적 ${R.파이어볼.전[0]}→${R.파이어볼.적} · 나 ${R.파이어볼.전[1]}→${R.파이어볼.나}`);

  /* ── AI 가 실제로 내는가 ─────────────────────────────────────
     강화·부여 스펠은 '내 크리처를 고르는' 부류라 AI 경로가 따로 없었다. */
  const A=await p.evaluate(async()=>{
    SPEED=60; const o={};
    const setup=(hand,board)=>{
      /* ⚠ 덱을 비워 둔다 — 턴 시작 드로우가 손패 장수 판정을 흐린다 */
      S.ai.hand=hand.slice(); S.ai.deck=[]; S.ai.board=[]; S.me.board=[];
      S.ai.lands=Array(9).fill(0).map(()=>({name:'화산',els:['fire'],used:false,entering:false}));
      S.ai.landPlayed=true; S.over=false;
      board.forEach(n=>{const i=S.ai.board.length;placeCreature('ai',n,i);});
    };
    setup(['화염 방패'],['화염 아귀']);
    await aiTurn();
    o.방패={손:S.ai.hand.length, hp:S.ai.board[0]&&S.ai.board[0].insts[0].hp,
            burn:S.ai.board[0]&&S.ai.board[0].burn};
    /* 잿불 방화범 — 도화선은 **한 턴을 넘길 몸**에 먼저 간다(와이번 4/6 vs 용암 정령 3/1) */
    setup(['도화선'],['용암 정령','와이번']);
    await aiTurn();
    o.도화선={손:S.ai.hand.length,
              대상:S.ai.board.map(u=>`${u.name} ${u.a}/${u.insts[0].hp} b${u.burn||0}`)};
    /* 그런 몸이 없어도 **마지막 순위로** 남은 하수인에게 쓴다 — 손에서 썩히지 않는다 */
    setup(['도화선'],['용암 정령']);
    await aiTurn();
    o.낭비={손:S.ai.hand.length, 몸:S.ai.board[0]
      &&`${S.ai.board[0].name} ${S.ai.board[0].a}/${S.ai.board[0].insts[0].hp} b${S.ai.board[0].burn}`};
    /* 화염술사 — 파이어볼이 제 화염 아귀까지 태우면, 방패를 **먼저** 두르고 쏜다 */
    setup(['화염 방패','파이어볼'],['화염 아귀']);
    ['검사','검사','검사'].forEach(n=>{const i=S.me.board.length;placeCreature('me',n,i);});
    await aiTurn();
    o.연계={손:S.ai.hand.length, 아귀:S.ai.board[0]&&S.ai.board[0].insts[0].hp,
            내판:S.me.board.filter(Boolean).length};
    /* 방패가 없고 상대 판도 두꺼우면(안 죽으면) 제 몸을 태우면서까지 쏘지 않는다 */
    setup(['파이어볼'],['화염 아귀']);
    ['석벽','석벽','석벽'].forEach(n=>{const i=S.me.board.length;placeCreature('me',n,i);});
    await aiTurn();
    o.보류={손:S.ai.hand.length, 아귀:S.ai.board[0]&&S.ai.board[0].insts[0].hp};
    setup(['불씨 살리기'],['불씨정령','화염정령']);
    await aiTurn();
    o.살리기={손:S.ai.hand.length, hp:S.ai.board.map(u=>u.insts[0].hp)};
    setup(['불씨 살리기'],['검사']);            /* 받을 개체가 없으면 안 낸다 */
    await aiTurn();
    o.헛손질={손:S.ai.hand.length};
    return o;
  });
  /* 3/1 + 방패(+0/+5) = 6, 게다가 방패 자체가 스펠이라 화염 아귀가 한 번 더 반응해 8 이 된다 */
  ok('AI 도 강화 스펠을 낸다', A.방패.손===0&&A.방패.hp===8&&A.방패.burn===2,
     `화염 방패 → 화염 아귀 HP ${A.방패.hp} 연소 ${A.방패.burn} (방패도 스펠이라 +1 이 더 붙는다)`);
  ok('도화선은 살 몸에 먼저', A.도화선.손===0&&/와이번 9\/6 b5/.test(A.도화선.대상.join()),
     A.도화선.대상.join(' · '));
  ok('없으면 아무에게나', A.낭비.손===0&&/용암 정령 8\/1 b3/.test(A.낭비.몸||''),
     `${A.낭비.몸} — 손에서 썩히느니 얹은 ATK 만큼이라도 얼굴에 넣는다`);
  ok('방패 → 파이어볼 순서', A.연계.손===0&&A.연계.아귀>0&&A.연계.내판===0,
     `두 장 다 사용 · 화염 아귀 HP ${A.연계.아귀} 생존 · 내 판 ${A.연계.내판}종`);
  ok('못 살리면 안 쏜다', A.보류.손===1&&A.보류.아귀===1,
     '방패가 없고 상대도 안 죽는다 — 제 화염 아귀를 태우면서까지 쏘지 않는다');
  ok('AI 전체 강화', A.살리기.손===0&&A.살리기.hp.join()!=='',
     `불씨 살리기 → 연소 크리처 HP ${A.살리기.hp.join('/')}`);
  ok('받을 게 없으면 안 낸다', A.헛손질.손===1, '검사만 있을 때는 불씨 살리기를 아낀다');

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
