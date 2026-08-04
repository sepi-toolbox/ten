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

  /* 큐가 쌓이는가 — 상태는 즉시, 연출은 나중 */
  const q=await p.evaluate(()=>{
    S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[]; FXQ=[];
    ['\ud5e4\ub808\uc2a4','\ud5ec\ucea3','\uc544\uc81c\ub974'].forEach((n,i)=>placeCreature('me',n,i));
    const hp0=S.me.board.map(u=>u.insts[0].hp);
    endStep('me');                    /* 연소 자해 — 동기 */
    return {큐:FXQ.length, hp:hp0.join(',')+' → '+S.me.board.map(u=>u.insts[0].hp).join(',')};
  });
  ok('연소가 연출 큐에 쌓인다', q.큐>=3, `큐 ${q.큐}발 · HP ${q.hp}`);

  /* 실제로 띄우고 그만큼 기다리는가 */
  const t0=Date.now();
  const n=await p.evaluate(()=>flushFx());
  const dt=Date.now()-t0;
  ok('한 발씩 띄우고 기다린다', n>=3&&dt>=400, `${n}발 · ${dt}ms`);
  ok('띄우고 나면 큐가 빈다', (await p.evaluate(()=>FXQ.length))===0, '');

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
