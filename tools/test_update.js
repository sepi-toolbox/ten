/* 새 판 자동 적용 — 앱(PWA)이 스스로 새 버전을 감지해 새로고침하는가
 *   node tools/test_update.js
 *
 * 실제 배포를 흉내 낸다: 로컬 서버가 sw.js 의 CACHE 이름 뒤에 값을 하나 더 붙여 주면
 * 그게 '새 판을 올린 것' 이다(배포 시 build_pages.py 가 내용 해시를 찍는 것과 같은 효과).
 *
 * ⚠ 이 검사는 **진짜 서비스워커가 필요**하다 → file:// 이 아니라 http 로 띄운다.
 * ⚠ 게임은 전투 중에 새로고침하면 판이 날아간다 — '미뤘다가 안전해지면 적용' 까지 본다.
 */
const path=require('path'), fs=require('fs'), http=require('http');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.png':'image/png',
  '.webmanifest':'application/manifest+json','.json':'application/json'};
let BUMP='';
const srv=http.createServer((q,r)=>{
  let f=decodeURIComponent(q.url.split('?')[0]); if(f.endsWith('/'))f+='index.html';
  const fp=path.join(ROOT,f);
  if(!fs.existsSync(fp)){r.writeHead(404);return r.end('');}
  let body=fs.readFileSync(fp);
  if(f.endsWith('sw.js')&&BUMP)                       /* = 새 판을 올린 상황 */
    body=Buffer.from(String(body).replace(/const CACHE = '([^']+)'/,`const CACHE = '$1-h${BUMP}'`));
  r.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream',
                   'Cache-Control':'no-cache'});
  r.end(body);});

(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  await new Promise(res=>srv.listen(8744,res));
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:430,height:844}});
  const deploy=()=>{ BUMP=String(Date.now()%100000); };
  const bump=p=>p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();
    if(r)await r.update();});

  // ── 카드 뷰어 — 잃을 상태가 없으니 묻지 않고 바로 새로고침
  const v=await ctx.newPage();
  await v.goto('http://localhost:8744/cards/'); await v.waitForTimeout(2500);
  ok('뷰어 SW 등록', await v.evaluate(()=>!!navigator.serviceWorker.controller), 'controller 확보');
  let vReload=false; v.on('load',()=>{vReload=true;});
  deploy(); await bump(v); await v.waitForTimeout(4500);
  ok('뷰어 자동 새로고침', vReload, '새 sw.js 를 받자 곧바로 다시 그렸다');

  // ── 게임 — 전투 중에는 미루고 칩만, 안전해지면 적용
  const g=await ctx.newPage();
  await g.goto('http://localhost:8744/prototype/?dev=1'); await g.waitForTimeout(2500);
  await g.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await g.waitForTimeout(600);
  let gReload=false; g.on('load',()=>{gReload=true;});
  deploy(); await bump(g); await g.waitForTimeout(5000);
  const mid=await g.evaluate(()=>({v:NEWVER, safe:updateSafe(),
    chip:document.getElementById('newver').classList.contains('on')}));
  ok('전투 중엔 미룬다', mid.v&&!mid.safe&&mid.chip&&!gReload,
     `새 버전 감지 ${mid.v} · 안전 ${mid.safe} · 알림 칩 ${mid.chip} · 새로고침 ${gReload}`);
  await g.evaluate(()=>{S.over=true;});          /* 승패 화면 = 잃을 게 없다 */
  await g.waitForTimeout(7000);
  ok('안전해지면 적용', gReload, '전투가 끝나자 스스로 새로고침');

  if(bad===0)console.log('✅ 전부 통과'); else console.log(`❌ ${bad}건 실패`);
  await b.close(); srv.close(); process.exit(bad?1:0);
})();
