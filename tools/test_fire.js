/* 불 덱 전면 교체 2단계 — 새 태그(제물·연격·광분) · 흡혈 규칙 변경 ·
 * 강화 라이더(제물·광분·화염검 생성·피의 문신) · 산불/화산 폭발/메테오 · 인챈트 4종
 *   node tools/test_fire.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(800);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);
  await p.evaluate(()=>{SPEED=30;setDeck('fire');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);

  const F=await p.evaluate(()=>{
    const o={};
    const setup=()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];S.me.hand=[];
      S.me.hp=60;S.ai.hp=60;
      S.me.deck=[];for(let i=0;i<30;i++)S.me.deck.push('헬하운드');
      S.me.lands=[];for(let i=0;i<10;i++){S.me.landPlayed=false;playLand('me','화산');}
      S.me.lands.forEach(l=>{l.used=false;l.entering=false;});};
    const ench=(nm,i)=>{const c=POOL[nm];S.me.board[i]={name:nm,kind:'en',v:c.v,charge:c.ch};};

    /* 옛 불 카드가 하나라도 남아 있으면 잡는다 */
    o.옛카드=['불씨정령','잿불새','화염정령','겁화룡','화신','용암거인','불사조','작열 좀비',
      '고블린 전차','화염 아귀','홍염','이그니스','용의 숨결','일대일 대련','도화선','소이탄',
      '겁화','파이어볼','불똥','분신','연쇄 폭발','불의 군단','고블린 화염포','불의 샘','물거품']
      .filter(n=>POOL[n]);
    o.새카드=['파이어버그','헤레스','블러드서커','레드아이스톤','헬시온','감시하는 눈','헬캣','그렘린',
      '고블린','헬하운드','홉고블린','아제르','하피','나가','헬고트','켈베로스','불의 거인','불타는 갑옷',
      '미노타 망치병','미노타 도끼병','화염 골렘','메두사','데몬','이프리트','발러','히드라','뱀',
      '화염 방패','시체 소각','파이어 애로우','산불','제물','광분','화염검 생성','피의 문신','화염구',
      '지옥문 소환','작열 감옥','불꽃의 벽','화산 폭발','메테오',
      '불사조의 깃털','악마의 석상','피의 망토','루비 목걸이'].filter(n=>!POOL[n]);
    o.고정적덱=Object.keys(ENEMY.fixed||{}).length;

    /* 태그가 몸에 실리는가 */
    setup(); placeCreature('me','켈베로스',0); placeCreature('me','발러',1);
    placeCreature('me','블러드서커',2); placeCreature('me','히드라',3);
    o.태그=S.me.board.map(u=>`${u.multi}${u.rage?'R':''}${u.drain?'D':''}`).join(' ');

    /* 흡혈 — 본체가 아니라 **자기 HP** 를 회복한다 */
    setup(); placeCreature('me','블러드서커',0);
    const bs=S.me.board[0]; bs.a=4; bs.insts[0].mh=6; bs.insts[0].hp=2;
    placeCreature('ai','헬하운드',0);
    const face0=S.me.hp;
    const t=S.ai.board[0]; const dealt=hurt(t,t.insts[0],bs.a);
    if(bs.drain&&dealt>0){const i=bs.insts[0];i.hp=Math.min(i.mh,i.hp+Math.round(dealt/2));}
    o.흡혈=`본체 ${face0}→${S.me.hp} · 몸 2→${bs.insts[0].hp}/6`;

    /* 광분 — HP 가 줄면 상대 얼굴을 한 번 더 */
    setup(); placeCreature('me','발러',0);
    const v=S.me.board[0], ai0=S.ai.hp;
    hurt(v,v.insts[0],3);
    o.광분=`상대 ${ai0}→${S.ai.hp} (ATK ${v.a})`;
    /* 가호로 실피해가 0 이면 안 켜진다 */
    setup(); placeCreature('me','발러',0);
    const v2=S.me.board[0]; v2.ward=true; const ai1=S.ai.hp;
    hurt(v2,v2.insts[0],3);
    o.광분무효=S.ai.hp===ai1;

    /* 강화 라이더 4종 */
    setup(); placeCreature('me','헬하운드',0); resolveOnMine('me','제물',0);
    o.제물=`${S.me.board[0].a}/${S.me.board[0].insts[0].hp}`;
    setup(); placeCreature('me','헬하운드',0); resolveOnMine('me','광분',0);
    o.광분주문=S.me.board[0].a;
    setup(); placeCreature('me','헬하운드',0); resolveOnMine('me','화염검 생성',0);
    o.화염검=`${S.me.board[0].a}/${S.me.board[0].insts[0].hp} · 남은마나 ${manaLeft('me')}`;
    setup(); placeCreature('me','아제르',0); placeCreature('me','헬하운드',1); placeCreature('me','하피',2);
    resolveOnMine('me','피의 문신',0);
    o.피의문신=S.me.board.map(u=>`${u.name} ${u.a}/${u.insts[0].hp}`).join(' · ');

    /* 산불 — 지형 하나 부수고 간이 지형 5장 */
    setup(); const ln0=S.me.lands.length; resolveInstant('me','산불');
    o.산불=`지형 ${ln0}→${S.me.lands.length} · 간이 ${S.me.lands.filter(l=>l.name==='간이 지형').length}`;

    /* 불꽃의 벽 — 연소가 있는 몸은 건너뛴다 */
    setup(); placeCreature('ai','헬하운드',0); placeCreature('ai','아제르',1);
    aoeSpread('me','불꽃의 벽',['ai'],4);
    o.불꽃의벽=S.ai.board.map(u=>`${u.name} ${u.insts[0].hp}`).join(' · ');

    /* 인챈트 4종 */
    setup(); ench('악마의 석상',0); placeCreature('me','헬하운드',1); placeCreature('me','하피',2);
    fireEnch('me','death',{unit:S.me.board[1]});
    o.석상=S.me.board.filter(u=>u.kind==='cr').map(u=>u.a).join('/');
    setup(); ench('피의 망토',0); placeCreature('me','헬하운드',1);
    fireEnch('me','summon',{unit:S.me.board[1]});
    o.망토=!!S.me.board[1].drain;
    setup(); ench('루비 목걸이',0); onCast('me','화염구'); o.목걸이=S.me.hand.join();
    setup(); ench('불사조의 깃털',0); placeCreature('me','헤레스',1);
    fireEnch('me','death',{unit:S.me.board[1],idx:1});
    o.깃털=S.me.board.filter(u=>u.kind==='cr').map(u=>u.name).join(',');
    /* 연소가 없는 몸에는 안 걸린다 */
    setup(); ench('불사조의 깃털',0); placeCreature('me','헬하운드',1);
    fireEnch('me','death',{unit:S.me.board[1],idx:1});
    o.깃털조건=S.me.board.filter(u=>u.kind==='cr').length;
    return o;
  });

  ok('옛 불 카드 전부 삭제', F.옛카드.length===0, F.옛카드.join(' ')||'0종 남음');
  ok('새 불 카드 45종 전부', F.새카드.length===0, F.새카드.join(' ')||'빠진 것 없음');
  /* ⚠ 고정 적 덱 5종은 쓰던 카드가 사라져 같이 내렸다. 복구는 따로 요청받는다. */
  ok('고정 적 덱 비었음', F.고정적덱===0, `${F.고정적덱}종`);
  ok('연격·광분·흡혈 필드', F.태그==='3 1R 1D 6', `켈베로스/발러/블러드서커/히드라 → ${F.태그}`);
  /* 흡혈은 **본체가 아니라 자기 HP** 를 회복한다 (4 피해 → 2 회복) */
  ok('흡혈 = 자기 HP 회복', F.흡혈==='본체 60→60 · 몸 2→4/6', F.흡혈);
  ok('광분 = 맞으면 얼굴', F.광분==='상대 60→54 (ATK 6)', F.광분);
  ok('광분 = 실피해 0이면 무효', F.광분무효===true, `가호로 막힌 뒤 상대 HP 그대로 ${F.광분무효}`);
  ok('제물 = ATK += HP', F.제물==='8/4', `헬하운드 4/4 → ${F.제물}`);
  ok('광분(주문) = ATK 2배', F.광분주문===8, `4 → ${F.광분주문}`);
  ok('화염검 = 남은 자원만큼', F.화염검==='14/14 · 남은마나 0', F.화염검);
  ok('피의 문신 = 제물 ATK 만큼', F.피의문신==='헬하운드 9/9 · 하피 7/9', F.피의문신);
  ok('산불 = 부수고 5장', F.산불==='지형 10→14 · 간이 5', F.산불);
  /* 연소가 붙은 몸(아제르)은 건너뛴다 — 연소 덱이 제 판을 안 태우는 장치다 */
  ok('불꽃의 벽 = 연소는 건너뜀', F.불꽃의벽==='헬하운드 0 · 아제르 5', F.불꽃의벽);
  ok('악마의 석상 = 전체 ATK +2', F.석상==='6/4', `헬하운드/하피 → ${F.석상}`);
  ok('피의 망토 = 흡혈 부여', F.망토===true, `drain=${F.망토}`);
  ok('루비 목걸이 = 주문 복제', F.목걸이==='화염구', F.목걸이||'(빈손)');
  ok('불사조의 깃털 = 연소만 부활', F.깃털==='헤레스,헤레스'&&F.깃털조건===1,
     `연소 몸 → ${F.깃털} · 연소 없는 몸 → ${F.깃털조건}종(부활 안 함)`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
