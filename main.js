// ========== 기본 설정 ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let VW = window.innerWidth, VH = window.innerHeight;
canvas.width = VW;
canvas.height = VH;

Input.init();
let map = new GameMap('main');
const player = new Player(1180, 700);

// ========== 게임 상태 ==========
let curZone = null;
let inGacha = false;
let inWorship = false;
let inBattle = false;
let currentMapId = 'main';

let collection = {};
let inventory = {};
let autoRollInterval = null;

// ========== 데이터 저장/로드 ==========
function saveData() {
  localStorage.setItem('gyun_collection', JSON.stringify(collection));
  localStorage.setItem('gyun_inventory', JSON.stringify(inventory));
}
function loadData() {
  const sc = localStorage.getItem('gyun_collection');
  const si = localStorage.getItem('gyun_inventory');
  if (sc) collection = JSON.parse(sc);
  if (si) inventory = JSON.parse(si);
}

// ========== 뽑기 ==========
function getRandomCharacter() {
  let random = Math.random();
  for (const char of characters) { random -= char.chance; if (random <= 0) return char; }
  return characters[characters.length - 1];
}
function pull() {
  const char = getRandomCharacter();
  const isDuplicate = !!collection[char.name];

  collection[char.name] = true;
  inventory[char.name] = (inventory[char.name] || 0) + 1;
  saveData();
  displayResult(char);

  // 중복 뽑기 시 균 조각 지급
  if (isDuplicate) {
    const fragmentMap = {
      '일반':1,'희귀':2,'초희귀':3,'에픽':5,
      '신화':8,'전설':12,'초월':20,'시크릿':50,
    };
    const amount = fragmentMap[char.grade] || 1;
    addGyunFragment(amount);
    if (typeof showItemToast === 'function') {
      showItemToast(`🔮 균 조각 +${amount}`, `${char.name} 중복 — 조각으로 전환됨`, '#c4b5fd');
    }
  }

  if (document.getElementById('collection').style.display === 'block') renderCollection();
  if (document.getElementById('inventory').style.display === 'block') renderInventory();
  if (char.grade === '시크릿') {
    if (char.name.includes('Abyssal')) secretCutsceneEffect();
    else if (char.name.includes('Lord')) lordOfDepthsCutscene();
    else secretCutsceneEffect();
  }
}
function displayResult(char) {
  document.getElementById('result').innerHTML = `
    <div class="result-card grade-${char.grade}">
      <img src="${char.img}" class="result-img" onerror="this.style.display='none'">
      <h2 class="grade-${char.grade}">【${char.grade}】 ${char.name}</h2>
      <p style="color:rgba(255,255,255,0.7)">${char.desc}</p>
    </div>`;
}
function startAutoRoll() { if (autoRollInterval) return; autoRollInterval = setInterval(pull, 900); }
function stopAutoRoll()  { if (autoRollInterval) { clearInterval(autoRollInterval); autoRollInterval = null; } }

// ========== 도감 ==========
function toggleCollection() {
  const panel = document.getElementById('collection');
  document.getElementById('inventory').style.display = 'none';
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  if (panel.style.display === 'block') renderCollection();
}
function renderCollection() {
  const gradeOrder = ['시크릿','초월','전설','신화','에픽','초희귀','희귀','일반'];
  const sorted = [...characters].sort((a,b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade));
  let html = '';
  for (const char of sorted) {
    const obtained = !!collection[char.name];
    let btn = '';
    if (obtained && char.grade === '시크릿') {
      const fn = char.name.includes('Lord') ? 'lordOfDepthsCutscene()' : 'secretCutsceneEffect()';
      btn = `<button class="cutscene-btn" onclick="${fn}">컷씬</button>`;
    }
    html += `<div class="char-entry grade-${char.grade}">
      <span><strong class="grade-${char.grade}">【${char.grade}】</strong> ${obtained ? char.name : '???'}</span>
      <div class="char-entry-right">${btn}<span class="${obtained?'obtained':'not-obtained'}">${obtained?'보유':'미보유'}</span></div>
    </div>`;
  }
  const count = Object.keys(collection).length;
  document.getElementById('collection-list').innerHTML =
    `<p style="margin-bottom:15px;color:#ffd700;font-weight:bold;">도감: ${count}/${characters.length} (${((count/characters.length)*100).toFixed(1)}%)</p>${html}`;
}

// ========== 가방 ==========
function toggleInventory() {
  const panel = document.getElementById('inventory');
  document.getElementById('collection').style.display = 'none';
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  if (panel.style.display === 'block') renderInventory();
}
function renderInventory() {
  const gradeOrder = ['시크릿','초월','전설','신화','에픽','초희귀','희귀','일반'];
  const owned = characters.filter(c => inventory[c.name] > 0).sort((a,b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade));
  if (!owned.length) { document.getElementById('inventory-list').innerHTML = '<p style="color:rgba(255,255,255,0.5);">아직 보유한 캐릭터가 없습니다.</p>'; return; }
  const total = Object.values(inventory).reduce((s,n) => s+n, 0);
  let html = `<p style="margin-bottom:15px;color:#ffd700;">총 보유: ${total}개</p>`;
  for (const char of owned) {
    html += `<div class="char-entry grade-${char.grade}">
      <span><strong class="grade-${char.grade}">【${char.grade}】</strong> ${char.name}</span>
      <span style="color:#4ade80;">${inventory[char.name]}개</span>
    </div>`;
  }
  document.getElementById('inventory-list').innerHTML = html;
}

// ========== 화면 열기/닫기 ==========
function closeGacha()  { document.getElementById('gacha-screen').style.display='none'; inGacha=false; stopAutoRoll(); }
function openWorship() { document.getElementById('worship-screen').style.display='block'; inWorship=true; loadWorshipData(); }
function closeWorship(){ document.getElementById('worship-screen').style.display='none'; inWorship=false; }
function openBattle()  {
  document.getElementById('battle-screen').style.display='block'; inBattle=true;
  const bc = document.getElementById('battleCanvas');
  bc.width = window.innerWidth; bc.height = window.innerHeight;
  resetBattle(); battleLoop();
}
function closeBattle() {
  document.getElementById('battle-screen').style.display='none';
  inBattle=false; battleState.active=false;
}

// ========== 맵 변경 ==========
function changeMap(mapId) {
  currentMapId = mapId;
  if      (mapId === 'cult')         map = new CultHeadquarters();
  else if (mapId === 'centralaltar') map = new CentralAltar();
  else if (mapId === 'altar-faith')  map = new AltarFaithDepth();
  else if (mapId === 'altar-mutation') map = new AltarMutationDepth();
  else if (mapId === 'altar-abyss')  map = new AltarAbyssDepth();
  else if (mapId === 'altar-truth')  map = new AltarTruthDepth();
  else if (mapId === 'library')      map = new ForbiddenLibrary();
  else if (mapId === 'readingroom')  { map = new ReadingRoom(); saveReadingRoomRef(); }
  else if (mapId === 'sealedroom')   map = new SealedRoom();
  else if (mapId === 'upgraderoom')  map = new UpgradeRoom();
  else if (mapId === 'skillroom')    map = new SkillRoom();
  else if (mapId === 'secret')       map = new GameMap('secret');
  else                               map = new GameMap(mapId);
  player.x = 1180;
  player.y = 700;
}

// ========== 미니맵 ==========
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function drawMinimap() {
  const mw=140, mh=90, mx=VW-mw-14, my=14;
  const sx=mw/map.width, sy=mh/map.height;
  ctx.save(); ctx.globalAlpha=0.85;
  ctx.fillStyle='#111'; roundRect(ctx,mx-2,my-2,mw+4,mh+4,8); ctx.fill();
  ctx.fillStyle='#c8a96e';
  for (const p of map.paths) ctx.fillRect(mx+p.x*sx,my+p.y*sy,Math.max(1,p.w*sx),Math.max(1,p.h*sy));
  for (const z of map.zones) { ctx.fillStyle=z.color; ctx.fillRect(mx+z.x*sx,my+z.y*sy,Math.max(2,z.w*sx),Math.max(2,z.h*sy)); }
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mx+player.cx*sx,my+player.cy*sy,3,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1; ctx.restore();
}

// ========== 게임 루프 ==========
function loop() {
  if (inGacha || inWorship || inBattle) { requestAnimationFrame(loop); return; }

  // 열람실 기절 중 이동 불가
  if (!(map instanceof ReadingRoom && map.isStunned())) {
    player.update(map);
  }
  curZone = map.getZone(player.x, player.y, player.w, player.h);

  // 열람실 책 라벨 업데이트
  if (map instanceof ReadingRoom) {
    const nearBook = map.getNearbyBook(player.cx, player.cy);
    for (const book of map.books) book.showLabel = (book === nearBook);
  }

  const camX = Math.max(0, Math.min(map.width - VW, player.cx - VW/2));
  const camY = Math.max(0, Math.min(map.height - VH, player.cy - VH/2));

  ctx.clearRect(0, 0, VW, VH);
  map.draw(ctx, camX, camY, VW, VH);
  player.draw(ctx, camX, camY);
  drawMinimap();

  // 제목
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(12,12,165,36);
  ctx.fillStyle='#fde68a'; ctx.font="bold 18px 'Noto Sans KR',sans-serif";
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText('🌍 균균 월드',22,30);
  ctx.restore();

  // 존 안내
  if (curZone) {
    const txt = curZone.label + '  —  F 키로 입장';
    const pw=340, ph=44, px=(VW-pw)/2, py=VH-80;
    ctx.save();
    ctx.globalAlpha=0.92; ctx.fillStyle='#1a1a2e';
    roundRect(ctx,px,py,pw,ph,10); ctx.fill();
    ctx.strokeStyle=curZone.color; ctx.lineWidth=2;
    roundRect(ctx,px,py,pw,ph,10); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle='#fff';
    ctx.font="bold 15px 'Noto Sans KR',sans-serif";
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(txt, VW/2, py+ph/2);
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

// ========== 키 입력 ==========
window.addEventListener('keydown', (e) => {
  // ===== E키 — NPC 대화 =====
  if (e.key.toLowerCase() === 'e' && !inGacha && !inWorship && !inBattle) {
    if (map.npcs) {
      for (const npc of map.npcs) {
        if (npc.hidden) continue;
        const px = player.x + player.w/2, py = player.y + player.h/2;
        const nx = npc.x + npc.w/2,       ny = npc.y + npc.h/2;
        if (Math.hypot(px-nx, py-ny) < 120) {
          if (npc.id === 'upgrade-priest' && map instanceof UpgradeRoom) {
            map.openUI();
          } else if (npc.id === 'skill-master' && map instanceof SkillRoom) {
            map.openUI();
          } else if (npc.id === 'altar-keeper' && map instanceof CentralAltar) {
            map.openUI();
          } else if (npc.id === 'mutation-surgeon' && map instanceof AltarMutationDepth) {
            map.openUI();
          } else {
            openNPCDialogue(npc.id);
          }
          break;
        }
      }
    }
  }

  // ===== Q키 — 책 읽기 (열람실) =====
  if ((e.key === 'q' || e.key === 'Q') && !inBattle && !inGacha && !inWorship) {
    if (map instanceof ReadingRoom) {
      if (map.isStunned()) return;
      const book = map.getNearbyBook(player.cx, player.cy);
      if (book) map.readBook(book);
    }
  }

  // ===== 전투 중 금단 스킬 (숫자키 1~5) =====
  if (inBattle) {
    const skillKeys = { '1':'rampage', '2':'timeWarp', '3':'voidHand', '4':'gyunSync', '5':'liberation' };
    const skillId = skillKeys[e.key];
    if (skillId && typeof useSkillById === 'function') {
      useSkillById(skillId);
    }
  }

  // ===== F키 — 존 입장 =====
  if (e.key.toLowerCase() === 'f' && curZone && !inGacha && !inWorship && !inBattle) {
    if (map instanceof UpgradeRoom && map.showUI) return;
    if (map instanceof SkillRoom   && map.showUI) return;
    if (map instanceof CentralAltar && map.showUI) return;

    if      (curZone.id === 'gacha' || curZone.id === 'secret-gacha') {
      document.getElementById('gacha-screen').style.display='block'; inGacha=true;
    }
    else if (curZone.id === 'worship')            openWorship();
    else if (curZone.id === 'secret-worship')     changeMap('cult');
    else if (curZone.id === 'battle' || curZone.id === 'secret-battle') openBattle();
    else if (curZone.id === 'secret')             changeMap('secret');
    else if (curZone.id === 'return')             changeMap('main');
    else if (curZone.id === 'forbidden-library')  changeMap('library');
    else if (curZone.id === 'lib-return')         changeMap('cult');
    else if (curZone.id === 'lib-reading-room')   changeMap('readingroom');
    else if (curZone.id === 'reading-return')     changeMap('library');
    else if (curZone.id === 'lib-sealed-zone')    changeMap('sealedroom');
    else if (curZone.id === 'sealed-return')      changeMap('library');
    else if (curZone.id === 'upgrade-room')       changeMap('upgraderoom');
    else if (curZone.id === 'upgrade-return')     changeMap('cult');
    else if (curZone.id === 'skill-room')         changeMap('skillroom');
    else if (curZone.id === 'skill-return')       changeMap('cult');
    else if (curZone.id === 'main-altar')         changeMap('centralaltar');
    else if (curZone.id === 'altar-return')       changeMap('cult');
    else if (curZone.id === 'altar-route-faith')  changeMap('altar-faith');
    else if (curZone.id === 'altar-route-mutation') changeMap('altar-mutation');
    else if (curZone.id === 'altar-route-abyss')  changeMap('altar-abyss');
    else if (curZone.id === 'altar-route-truth')  changeMap('altar-truth');
    else if (curZone.id === 'altar-depth-return') changeMap('centralaltar');
    else alert(curZone.label + ' 기능은 아직 준비 중입니다!');
  }

  // ===== ESC =====
  if (e.key === 'Escape') {
    if (inGacha)  closeGacha();
    if (inWorship) closeWorship();
    if (inBattle) closeBattle();
    if (map instanceof UpgradeRoom && map.showUI) map.closeUI();
    if (map instanceof SkillRoom   && map.showUI) map.closeUI();
    if (map instanceof CentralAltar && map.showUI) map.closeUI();
    if (map instanceof AltarMutationDepth && map.showUI) map.closeUI();
  }
});

// ===== 마우스 클릭 — UI 버튼 =====
window.addEventListener('click', (e) => {
  if (map instanceof UpgradeRoom && map.showUI) map.handleClick(e.clientX, e.clientY);
  if (map instanceof SkillRoom   && map.showUI) map.handleClick(e.clientX, e.clientY);
  if (map instanceof CentralAltar && map.showUI) map.handleClick(e.clientX, e.clientY);
  if (map instanceof AltarMutationDepth && map.showUI) map.handleClick(e.clientX, e.clientY);
});

// ========== 창 크기 조정 ==========
window.addEventListener('resize', () => {
  VW = window.innerWidth; VH = window.innerHeight;
  canvas.width = VW; canvas.height = VH;
});

// ========== 게임 시작 ==========
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadJobData();
});

