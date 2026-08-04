/* 확대창 겹쳐 보기 — 넘기려는 손짓이 창을 닫지 않는가 (게임 + 카드 뷰어)
 *   node tools/test_swipe.js
 *
 * 왜 이 파일이 있나 — '아무 곳이나 누르면 닫힘' 을 document 의 **캡처** 단계에 걸어 뒀는데,
 * 캡처는 바깥에서 안으로 내려오므로 겹친 카드(.zstack) 의 stopPropagation 보다 **먼저** 돈다.
 * 그래서 성장·삼킴·되살아남 카드를 넘겨 보려고 손을 대면 그 순간 창이 닫혀 뒷면을
 * 아예 볼 수 없었다. 여기서는 **넘겨지는가 + 안 닫히는가 + 밖을 누르면 닫히는가** 셋만 본다.
 */
const path=require('path'), fs=require('fs'), http=require('http');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.png':'image/png',
  '.webmanifest':'application/manifest+json','.json':'application/json'};
const srv=http.createServer((q,r)=>{
  let f=decodeURIComponent(q.url.split('?')[0]); if(f.endsWith('/'))f+='index.html';
  const fp=path.join(ROOT,f);
  if(!fs.existsSync(fp)){r.writeHead(404);return r.end('');}
  r.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
  r.end(fs.readFileSync(fp));});

/* 스와이프 = 카드 위에서 눌러 가로로 끌고 뗀다 */
async function swipe(p,sel,dx){
  const b=await p.locator(sel).boundingBox();
  const y=b.y+b.height*0.45;
  await p.mouse.move(b.x+b.width*0.5,y);
  await p.mouse.down();
  await p.mouse.move(b.x+b.width*0.5+dx,y,{steps:6});
  await p.mouse.up();
  await p.waitForTimeout(320);
}

(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  await new Promise(res=>srv.listen(8746,res));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:430,height:844}});

  /* ── 게임 ─────────────────────────────────────────────── */
  const g=await ctx.newPage();
  const gerr=[]; g.on('pageerror',e=>gerr.push(e.message));
  await g.goto('http://localhost:8746/prototype/?dev=1'); await g.waitForTimeout(900);
  await g.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await g.waitForTimeout(400);

  /* 겹쳐 보여 줄 짝이 실제로 몇 종인가 — 성장·진형·되살아남 */
  const pairs=await g.evaluate(()=>Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&grownPeer(n))
    .map(n=>`${n}→${grownPeer(n)}`));
  ok('겹쳐 볼 짝이 있다', pairs.length>=10, `${pairs.length}종 — ${pairs.slice(0,3).join(' · ')}…`);

  /* ⚠ '작열 좀비' 는 불 전면 교체 때 지운 카드다 → showZoom 이 null 을 만나 크래시했다.
     겹쳐 볼 짝이 있는 카드 중 지금 살아 있는 것으로 바꾼다 — 묘목(성장 → 성장한 묘목). */
  await g.evaluate(()=>{ showZoom('묘목',null,null,false); });
  await g.waitForTimeout(200);
  const g0=await g.evaluate(()=>({on:document.getElementById('zoom').classList.contains('on'),
    stack:!!document.querySelector('.zstack'),
    앞:document.querySelector('.zfront .tname').textContent,
    뒤:document.querySelector('.zback .tname').textContent,
    안내:document.querySelector('.zswipe').textContent.trim()}));
  ok('게임 — 뒤에 겹친다', g0.on&&g0.stack&&g0.앞==='묘목'&&g0.뒤==='성장한 묘목',
     `${g0.앞} ↔ ${g0.뒤} · "${g0.안내}"`);

  await g.waitForTimeout(400);                 /* 닫기 감시가 붙는 60ms 를 확실히 지난다 */
  await swipe(g,'.zstack',60);
  const g1=await g.evaluate(()=>({on:document.getElementById('zoom').classList.contains('on'),
    flip:document.querySelector('.zstack')?document.querySelector('.zstack').classList.contains('flip'):null,
    안내:document.querySelector('.zswipe')?document.querySelector('.zswipe').textContent.trim():''}));
  ok('게임 — 넘겨도 안 닫힌다', g1.on&&g1.flip===true,
     `창 유지 ${g1.on} · 뒷면 ${g1.flip} · "${g1.안내}"`);

  await swipe(g,'.zstack',-60);                /* 되돌리기 */
  const g2=await g.evaluate(()=>({on:document.getElementById('zoom').classList.contains('on'),
    flip:document.querySelector('.zstack')&&document.querySelector('.zstack').classList.contains('flip')}));
  ok('게임 — 되돌리기', g2.on&&g2.flip===false, '한 번 더 넘기면 앞면으로');

  await g.mouse.click(20,760);                 /* 카드 **밖** */
  await g.waitForTimeout(250);
  ok('게임 — 밖을 누르면 닫힌다',
     !(await g.evaluate(()=>document.getElementById('zoom').classList.contains('on'))), '');

  /* 짝이 없는 카드는 예전 그대로 — 아무 데나 눌러 닫힌다 */
  await g.evaluate(()=>{ showZoom('검사',null,null,false); });
  await g.waitForTimeout(400);
  await g.mouse.click(215,420);
  await g.waitForTimeout(250);
  ok('겹치지 않은 카드는 그대로',
     !(await g.evaluate(()=>document.getElementById('zoom').classList.contains('on'))),
     '짝이 없으면 카드를 눌러도 닫힌다');

  /* ── 카드 뷰어 ────────────────────────────────────────── */
  const v=await ctx.newPage();
  const verr=[]; v.on('pageerror',e=>verr.push(e.message));
  await v.goto('http://localhost:8746/cards/'); await v.waitForTimeout(1200);
  await v.evaluate(()=>openZoom('묘목')); await v.waitForTimeout(250);
  const v0=await v.evaluate(()=>({on:document.getElementById('zoom').classList.contains('on'),
    앞:document.querySelector('.zfront .tname')&&document.querySelector('.zfront .tname').textContent,
    뒤:document.querySelector('.zback .tname')&&document.querySelector('.zback .tname').textContent}));
  ok('뷰어 — 뒤에 겹친다', v0.on&&v0.앞==='묘목'&&v0.뒤==='성장한 묘목',
     `${v0.앞} ↔ ${v0.뒤}`);
  await swipe(v,'.zstack',60);
  const v1=await v.evaluate(()=>({on:document.getElementById('zoom').classList.contains('on'),
    flip:document.querySelector('.zstack')&&document.querySelector('.zstack').classList.contains('flip')}));
  ok('뷰어 — 넘겨도 안 닫힌다', v1.on&&v1.flip===true, `창 유지 ${v1.on} · 뒷면 ${v1.flip}`);
  await v.mouse.click(20,780); await v.waitForTimeout(250);
  ok('뷰어 — 밖을 누르면 닫힌다',
     !(await v.evaluate(()=>document.getElementById('zoom').classList.contains('on'))), '');
  /* 성장 카드도 같은 장치를 쓰는가 (회귀) */
  await v.evaluate(()=>openZoom('묘목')); await v.waitForTimeout(250);
  const v2=await v.evaluate(()=>({뒤:document.querySelector('.zback .tname')
    &&document.querySelector('.zback .tname').textContent}));
  ok('뷰어 — 성장 상위 몸', v2.뒤==='성장한 묘목', `묘목 ↔ ${v2.뒤}`);

  if(gerr.length||verr.length){bad++;console.log('   ERR',gerr.concat(verr).slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); srv.close(); process.exit(bad?1:0);
})();
