/* 피해 연출 — 연소·폭발·광분이 **눈에 보이게** 한 발씩 지나가는가
 * ⚠ 이 셋은 동기 코드(endStep · onDeath · hurt)에서 한꺼번에 처리된다. 예전에는 숫자만
 *   툭 바뀌고 아무 일도 없었던 것처럼 스쳐 지나갔다. 상태는 즉시 바꾸되 연출만 큐에
 *   쌓아 뒀다가(FXQ) 나중에 한 발씩 띄운다.
 *   node tools/test_burnfx.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'\u2705':'\u274c')+' '+k.padEnd(24)+' '+d); };
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(800);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);
  await p.evaluate(()=>{SPEED=1;setDeck('fire');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);

  /* ── 연소는 **왼쪽부터 한 개체씩** 순서대로 끝난다 ─────────────
     ⚠ 한 몸이 타고·죽고·폭발까지 끝난 뒤에 다음 칸으로 간다. 예전에는 전부 한꺼번에
       처리하고 연출만 몰아 띄워서, 무엇이 무엇을 죽였는지 순서가 안 읽혔다. */
  const SEQ=await p.evaluate(async()=>{
    S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[]; S.ai.hp=60; FXQ=[];
    LOGSEQ=[];
    placeCreature('me','\ud5e4\ub808\uc2a4',0);   /* 연소1 */
    placeCreature('me','\ud5ec\uc2dc\uc628',1);   /* 연소1 + 폭발 — 여기서 죽는다 */
    placeCreature('me','\uc544\uc81c\ub974',2);   /* 연소2 */
    S.me.board[1].insts[0].hp=1;
    const t=performance.now();
    await endStep('me');
    const ms=Math.round(performance.now()-t);
    const line=[...document.querySelectorAll('#log div')].map(e=>e.textContent.trim())
      .filter(t=>/연소|폭발/.test(t));
    return {ms, 순서:line.slice(-4), 상대HP:S.ai.hp};
  });
  /* 헤레스(0번) → 헬시온(1번, 죽고 폭발) → 아제르(2번). 폭발이 아제르보다 **앞**이어야 한다 */
  const ord=SEQ.순서.join(' | ');
  ok('왼쪽부터 차례로', /헤레스[^|]*연소/.test(SEQ.순서[0]||'')
     &&/헬시온[^|]*연소/.test(SEQ.순서[1]||'')
     &&/헬시온[^|]*폭발/.test(SEQ.순서[2]||'')
     &&/아제르[^|]*연소/.test(SEQ.순서[3]||''), ord);
  ok('죽음·폭발이 그 자리에서', SEQ.상대HP===58, `상대 HP 60→${SEQ.상대HP} (헬시온 폭발 2)`);
  ok('한 개체씩 시간을 쓴다', SEQ.ms>=500, `endStep ${SEQ.ms}ms`);

  /* 피해가 없으면 시간을 안 쓴다 */
  const idle0=await p.evaluate(async()=>{
    S.gen=(S.gen||0)+1; S.me.board=[]; FXQ=[];
    const t=performance.now(); await endStep('me'); return Math.round(performance.now()-t);
  });
  ok('빈 판이면 안 기다린다', idle0<120, `${idle0}ms`);

  /* 턴을 넘기면 저절로 흘러간다 — 숫자 팝업과 칸 번쩍임이 실제로 화면에 뜬다 */
  await p.evaluate(()=>{
    S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[]; FXQ=[];
    S.busy=false; S.over=false; S.active='me';
    ['\ud5e4\ub808\uc2a4','\ud5ec\ucea3','\uc544\uc81c\ub974'].forEach((n,i)=>placeCreature('me',n,i));
    S.me.board.forEach(u=>u.sick=true); render();
  });
  await p.evaluate(()=>{const e=document.getElementById('end'); if(!e.disabled)e.click();});
  let pop=0, flash=false;
  for(let i=0;i<45;i++){
    const st=await p.evaluate(()=>({p:document.querySelectorAll('.hitpop').length,
      f:document.querySelectorAll('.slot.fxhit').length}));
    pop=Math.max(pop,st.p); if(st.f)flash=true;
    await p.waitForTimeout(60);
  }
  ok('턴 종료에 저절로 보인다', pop>0&&flash, `숫자 팝업 최대 ${pop}개 · 칸 번쩍임 ${flash}`);

  /* 폭발 — 죽으면서 상대 얼굴에. 정보줄이 번쩍여야 어디로 갔는지 읽힌다 */
  await p.evaluate(()=>{
    S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[]; S.ai.hp=60; FXQ=[];
    S.busy=false; S.over=false; S.active='me';
    placeCreature('me','\ud5ec\uc2dc\uc628',0); placeCreature('me','\ud5ec\uc2dc\uc628',1);
    S.me.board.forEach(u=>{u.sick=true;u.insts[0].hp=1;}); render();
  });
  const hp0=await p.evaluate(()=>S.ai.hp);
  await p.evaluate(()=>{const e=document.getElementById('end'); if(!e.disabled)e.click();});
  let struck=false;
  for(let i=0;i<45;i++){
    if(await p.evaluate(()=>!!document.querySelector('#foeBar.struck')))struck=true;
    await p.waitForTimeout(60);
  }
  const hp1=await p.evaluate(()=>S.ai.hp);
  ok('폭발이 얼굴에 보인다', hp1<hp0&&struck, `상대 HP ${hp0}→${hp1} · 정보줄 번쩍임 ${struck}`);

  /* 피해가 없으면 시간을 안 쓴다 — 아무 일도 없는 턴이 느려지면 안 된다 */
  await p.evaluate(()=>{FXQ=[];});
  const t1=Date.now(); await p.evaluate(()=>flushFx()); const idle=Date.now()-t1;
  ok('피해 없으면 안 기다린다', idle<120, `${idle}ms`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`\u274c ${bad}건 실패`:'\u2705 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
