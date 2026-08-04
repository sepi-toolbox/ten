/* 연출 — 단말마 부활 오오라 · 환류 손패 생성 · 주문 발사체
 *   node tools/test_castfx.js
 *
 * 왜 이 파일이 있나 — 연출은 **틀려도 검사가 안 죽는다.** 오오라가 안 뜨고 발사체가
 * 한쪽에서만 날아가도 게임은 멀쩡히 돌아가서, 눈으로 볼 때까지 아무도 모른다.
 * 그래서 '무엇이 화면에 붙었는가' 를 직접 센다.
 */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(900);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{SPEED=1;setDeck('dark');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(350);
  const reset=()=>p.evaluate(()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];
    S.me.hand=[];S.ai.hand=[];S.me.shown={};S.ai.shown={};S.me.echoAt=-1;S.ai.echoAt=-1;
    S.me.noecho={};S.ai.noecho={};S.busy=false;render();});

  /* ── 1) 단말마 부활 — 보라 오오라 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('me','구울',0); placeCreature('me','스컬 기마병',1);
    S.me.board[1].insts.forEach(i=>{i.hp=0;}); cleanup('me'); render(); });
  await p.waitForTimeout(120);
  const rev=await p.evaluate(()=>[...document.querySelectorAll('.slot.revived')]
    .map(e=>e.parentElement.id+'/'+e.dataset.idx));
  /* ⚠ **죽은 그 자리**에 붙어야 한다. 슬롯 번호가 아니라 개체에 단 표시라 자리가 밀려도 따라간다. */
  ok('부활 = 보라 오오라', rev.length===1&&rev[0]==='myBoard/1', rev.join(', ')||'(안 붙음)');
  /* 그냥 소환한 몸에는 안 붙는다 — 소환(spawned)과 부활은 색으로 갈린다 */
  await reset();
  await p.evaluate(()=>{ placeCreature('me','구울',0); render(); });
  await p.waitForTimeout(80);
  ok('그냥 소환엔 안 붙음', (await p.evaluate(()=>document.querySelectorAll('.slot.revived').length))===0, '');
  /* 시간이 지나면 걷힌다 */
  await p.waitForTimeout(1100);
  ok('오오라는 걷힌다', (await p.evaluate(()=>document.querySelectorAll('.slot.revived').length))===0, '');

  /* ── 2) 환류 — 손패에 일렁이며 생기고, 상대 것도 앞면 ── */
  await reset();
  await p.evaluate(()=>{ S.ai.hand=['구울','좀비']; echoToHand('ai','전기 해파리');
    echoToHand('me','전기 해파리'); render(); });
  await p.waitForTimeout(120);
  const eh=await p.evaluate(()=>({
    앞면:[...document.querySelectorAll('#foeHand .hcw.open .tname')].map(e=>e.textContent),
    뒷면:document.querySelectorAll('#foeHand .hcw.back').length,
    일렁:document.querySelectorAll('.hcw.echoin').length}));
  ok('상대 환류는 앞면으로', eh.앞면.join()==='전기 해파리'&&eh.뒷면===2,
     `앞면 [${eh.앞면}] · 뒷면 ${eh.뒷면}장`);
  ok('양쪽 다 일렁인다', eh.일렁===2, `${eh.일렁}장`);
  /* ⚠ 낸 뒤에는 스스로 지워져야 한다 — 지우는 자리를 따로 두면 splice 하는 곳 하나를 빠뜨린다 */
  await p.evaluate(()=>{ S.ai.hand=S.ai.hand.filter(n=>n!=='전기 해파리'); render(); });
  await p.waitForTimeout(80);
  const gone=await p.evaluate(()=>({열림:document.querySelectorAll('#foeHand .hcw.open').length,
                                    표시:JSON.stringify(S.ai.shown)}));
  ok('내고 나면 표시가 지워짐', gone.열림===0&&/"전기 해파리":0/.test(gone.표시),
     `앞면 ${gone.열림}장 · shown ${gone.표시}`);
  /* 뽑아 온 카드는 그냥 뒷면이다 */
  await reset();
  await p.evaluate(()=>{ S.ai.hand=['전기 해파리']; render(); });
  await p.waitForTimeout(80);
  ok('그냥 든 패는 뒷면', (await p.evaluate(()=>document.querySelectorAll('#foeHand .hcw.open').length))===0, '');

  /* ── 3) 주문 발사체 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('ai','구울',0); render(); });
  await p.waitForTimeout(80);
  const fly=p.evaluate(()=>castBolt('me',boltTarget('ai',0),'파이어 애로우'));
  await p.waitForTimeout(140);
  const mid=await p.evaluate(()=>{ const e=document.querySelector('.bolt');
    if(!e)return null; const r=e.getBoundingClientRect();
    return {n:document.querySelectorAll('.bolt').length, z:+getComputedStyle(e).zIndex,
            y:Math.round(r.top)}; });
  ok('발사체가 날아간다', !!mid&&mid.n===1, mid?`${mid.n}개 · y ${mid.y}`:'(안 뜸)');
  /* ⚠ 처리 가리개(.busy z-140) 위여야 보인다 — 아래면 쏘는 내내 딤에 가려 안 보인다 */
  ok('가리개보다 위에 뜬다', !!mid&&mid.z>140, mid?`z-index ${mid.z}`:'');
  await fly; await p.waitForTimeout(450);
  ok('맞고 사라진다', (await p.evaluate(()=>document.querySelectorAll('.bolt').length))===0, '');
  /* 피해 주문만 쏜다 — 요격·바운스는 안 쏜다 */
  const nofly=await p.evaluate(async()=>{ await castBolt('me',boltTarget('ai',0),'사신의 수확');
    return document.querySelectorAll('.bolt').length; });
  ok('피해 주문만 쏜다', nofly===0, `요격 주문 발사체 ${nofly}개`);
  /* 본체를 겨눠도 날아간다 */
  const face=p.evaluate(()=>castBolt('me',boltTarget('ai',FACE),'화염구'));
  await p.waitForTimeout(140);
  ok('본체도 겨눈다', (await p.evaluate(()=>document.querySelectorAll('.bolt').length))===1, '');
  await face;

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
