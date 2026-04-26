// npc.js - NPC 상호작용 시스템

const NPCDialogues = {
  'npc-1': {
    name: '🧑 상인',
    type: 'shop',
    dialogues: [
      '안녕하세요! 반갑습니다.',
      '좋은 물건들이 많이 들어왔어요.',
      '혹시 뭔가 필요하신 게 있으신가요?',
      '다음에 또 봐요!'
    ]
  },
  'npc-2': {
    name: '🧙 마법사',
    type: 'jobchange',
    jobs: ['마법사'],
    dialogues: [
      '오오, 손님이시군요.',
      '마법의 신비로운 세계에 오신 것을 환영합니다.',
      '혹시 마법을 배우고 싶으신가요?',
      '행운을 빕니다!'
    ]
  },
  'npc-3': {
    name: '⚔️ 전사',
    type: 'jobchange',
    jobs: ['검사'],
    dialogues: [
      '흠, 누군가!',
      '나는 많은 전투를 거쳐 왔네.',
      '너도 강해지고 싶은가?',
      '강해지거라!'
    ]
  },
  'npc-4': {
    name: '김 산',
    dialogues: [
      '안녕! 음식을 좋아하니?',
      '나는 온 세상을 음식으로 표현해.',
      '함께 밥을 먹어 볼래?',
      '다시 만나자!'
    ]
  },
  'npc-5': {
    name: '김영훈',
    dialogues: [
      '쉬잇! 조용히 해주세요.',
      '저기에 여자가 지나간단 말입니다..',
      '여자를 보고 싶으신가요?',
      '예쁜 여자를 보면 알려주세요!'
    ]
  },
  'npc-dark-1': {
    name: 'ERROR',
    dialogues: [
      '우우우우...',
      '누구냐... 넌...',
      '심연의 어둠 속에서 헤맸나...',
      '사라져라...'
    ]
  },
  'npc-dark-2': {
    name: '마검사',
    type: 'jobchange',
    jobs: ['마검사'],
    dialogues: [
      '깍깍깍! 반갑군.',
      '밤의 수호자 나를 만났군.',
      '뭘 원하는가?',
      '깍깍! 사라져라!'
    ]
  },
  'npc-dark-3': {
    name: '균 숭배자',
    type: 'jobchange',
    jobs: ['균 숭배자'],
    dialogues: [
      '운명의 실을 봐라...',
      '너의 미래는 어두워 보이는군...',
      '균의 가호를 받고 싶은��?',
      '가거라, 균의 신도여...'
    ]
  },
  'cult-priest': {
    name: '🩸 대사제',
    type: 'jobchange',
    jobs: ['광신도'],
    dialogues: [
      '균의 빛이 너를 인도했구나...',
      '나는 균의 뜻을 대리하는 자...',
      '심판을 내릴 준비가 되었는가?',
      '가라... 균의 심판자여...'
    ]
  },
  'cult-fanatic1': {
    name: '🗣️ 속삭이는 자',
    dialogues: [
      '쉿... 들리는가...',
      '균의 목소리가... 속삭인다...',
      '너도 곧 듣게 될 것이다...',
      '쉿...'
    ]
  },
  'cult-fanatic2': {
    name: '🩸 피의 기사',
    type: 'jobchange',
    jobs: ['혈검사'],
    dialogues: [
      '...피 냄새가 나는군.',
      '이 검은 피를 먹고 자랐다.',
      '네 피로 각성할 준비가 됐나?',
      '싸우면 싸울수록 강해질 것이다...'
    ]
  },
  'cult-whisperer': {
    name: '📖 금단의 학자',
    type: 'jobchange',
    jobs: ['금서술사'],
    dialogues: [
      '...이 책을 펼치지 마라.',
      '금지된 지식은 대가를 요구한다.',
      '그래도 원하는가? 이 힘을...',
      '후회하지 않길 바란다...'
    ]
  },
  'cult-eyes': {
    name: '👁️ 관찰자',
    dialogues: [
      '...보고 있다.',
      '너의 모든 행동을...',
      '균이 지켜보고 있다...',
      '...'
    ]
  },

  // ===== 금서 도서관 NPC =====
  'lib-archivist': {
    name: '📚 기록자',
    dialogues: [
      '..들어왔군.',
      '읽는 순간, 되돌릴 수 없습니다.',
      '경고는 했습니다.',
      '...앞으로 가지 마세요.'
    ]
  },
  'lib-researcher': {
    name: '🕯️ 금서 연구자',
    dialogues: [
      '오, 새로운 독자가 왔군.',
      '이 몸에 새겨진 글자들... 모두 금서에서 나왔지.',
      '지식은 힘이야. 하지만 대가가 있어.',
      '관심 있으면... 계속 안으로 들어가게.'
    ]
  },
  'lib-lost-reader': {
    name: '🧍 잃어버린 독자',
    dialogues: [
      '이 페이지… 끝이 없어요…',
      '...',
      '처음부터 다시... 처음부터 다시...',
      '이 페이지… 끝이 없어요…'
    ]
  },
  'lib-seal-keeper': {
    name: '🗝️ 봉인 관리자',
    dialogues: [
      '.',
      '..',
      '...',
      '통과할 수 없다.'
    ]
  },
  'lib-unknown': {
    name: '???',
    dialogues: [
      '...',
      '너도,',
      '읽혔다.',
      '...'
    ]
  },
  'mad-researcher': {
    name: '🕯️ 미쳐버린 연구자',
    dialogues: [
      '읽고 싶지 않다면… 이미 늦었습니다.',
      '이 책들은… 스스로 읽히길 원하거든요.',
      '저도 처음엔 그냥 구경만 하려 했어요.',
      '지금은… 멈출 수가 없네요.'
    ]
  },
  'skill-master': {
    name: '✨ 스킬 관리자',
    dialogues: [
      '금단의 힘에 관심이 있는가.',
      '강하다. 하지만 조건이 있다.',
      '남용하면 스스로 무너진다.',
      '해금할 준비가 됐다면… 코인을 내라.'
    ]
  }
};


let currentNPC = null;
let npcDialogueIndex = 0;

function getNPC(npcId) {
  return NPCDialogues[npcId] || null;
}

function openNPCDialogue(npcId) {
  currentNPC = npcId;
  npcDialogueIndex = 0;
  
  const npc = getNPC(npcId);
  if (!npc) return;

  if (npc.type === 'shop') {
    openShop();
  } else if (npc.type === 'jobchange') {
    const level = (typeof battleState !== 'undefined') ? battleState.playerLevel : 1;
    showJobChangeUI(npcId, level);
  } else {
    displayNPCDialogue();
  }
}

function displayNPCDialogue() {
  if (!currentNPC) return;
  
  const npc = getNPC(currentNPC);
  if (!npc) return;

  const dialogue = npc.dialogues[npcDialogueIndex];
  
  const dialogueBox = document.getElementById('npc-dialogue-box');
  const dialogueName = document.getElementById('npc-dialogue-name');
  const dialogueText = document.getElementById('npc-dialogue-text');
  const jobChangeButtons = document.getElementById('npc-job-buttons');
  const dialogueFooter = document.getElementById('npc-dialogue-footer');
  
  if (dialogueBox && dialogueName && dialogueText) {
    dialogueName.textContent = npc.name;
    dialogueText.innerHTML = dialogue;
    if (jobChangeButtons) jobChangeButtons.style.display = 'none';
    if (dialogueFooter) dialogueFooter.style.display = 'block';
    dialogueBox.style.display = 'block';
  }
}

function showJobChangeUI(npcId, playerLevel) {
  const npc = getNPC(npcId);
  if (!npc || !npc.jobs) {
    displayNPCDialogue();
    return;
  }

  const dialogueBox = document.getElementById('npc-dialogue-box');
  const dialogueName = document.getElementById('npc-dialogue-name');
  const dialogueText = document.getElementById('npc-dialogue-text');
  const jobChangeButtons = document.getElementById('npc-job-buttons');
  const dialogueFooter = document.getElementById('npc-dialogue-footer');

  if (!dialogueBox || !jobChangeButtons) return;

  dialogueName.textContent = npc.name;
  
  let message = '';
  let canChange = false;

  for (const job of npc.jobs) {
    if (canChangeJob(job, playerLevel)) {
      canChange = true;
      message += `✓ ${job}로 전직 가능합니다!`;
    } else {
      message += getJobChangeMessage(job, playerLevel);
    }
  }

  dialogueText.innerHTML = message.replace(/\n/g, '<br>');

  jobChangeButtons.innerHTML = '';
  
  for (const job of npc.jobs) {
    if (canChangeJob(job, playerLevel)) {
      const btn = document.createElement('button');
      btn.className = 'npc-job-btn';
      btn.textContent = `${job}로 전직`;
      btn.onclick = () => confirmJobChange(job, playerLevel);
      jobChangeButtons.appendChild(btn);
    }
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'npc-job-btn cancel';
  cancelBtn.textContent = '돌아가기';
  cancelBtn.onclick = closeNPCDialogue;
  jobChangeButtons.appendChild(cancelBtn);

  if (canChange) {
    jobChangeButtons.style.display = 'flex';
    if (dialogueFooter) dialogueFooter.style.display = 'none';
  } else {
    jobChangeButtons.style.display = 'none';
    if (dialogueFooter) dialogueFooter.style.display = 'block';
  }
  
  dialogueBox.style.display = 'block';
}

function confirmJobChange(job, playerLevel) {
  if (canChangeJob(job, playerLevel)) {
    changeJob(job);
    alert(`축하합니다! ${job}로 전직했습니다! 🎉`);
    closeNPCDialogue();
    if (typeof updateBattleHUD === 'function') updateBattleHUD();
  } else {
    alert('조건을 충족하지 못했습니다.');
  }
}

function nextNPCDialogue() {
  if (!currentNPC) return;
  
  const npc = getNPC(currentNPC);
  if (!npc) return;

  npcDialogueIndex++;
  
  if (npcDialogueIndex >= npc.dialogues.length) {
    closeNPCDialogue();
  } else {
    displayNPCDialogue();
  }
}

function closeNPCDialogue() {
  const dialogueBox = document.getElementById('npc-dialogue-box');
  if (dialogueBox) {
    dialogueBox.style.display = 'none';
  }
  currentNPC = null;
  npcDialogueIndex = 0;
}
// ===================================================
// ===== 상점 시스템 =====
// ===================================================

// 아이템 인벤토리 상태
const shopInventory = {
  gyunCore: 0,        // 균 핵 (부활 아이템, 최대 1개)
};

// 아이템 효과 상태 (전투 중 지속 효과)
let itemEffects = {
  armor: 0,               // 균 갑옷 스택 수
  sporeCloakActive: false, // 포자 망토 장착 여부
  berserkActive: false,    // 광폭 균 공생체 활성화 여부
  berserkTimer: 0,         // 광폭 지속 틱
  berserkDisableTimer: 0,  // 광폭 종료 후 무력화 틱
  kitCooldown: 0,          // 자가증식 키트 쿨다운
  gyunCoreOwned: false,    // 균 핵 보유 여부
  gyunCoreUsed: false,     // 이번 전투에서 사용됐는지
};

const SHOP_ITEMS = [
  {
    id: 'gyun_juice',
    name: '촉촉한 균즙',
    icon: '🧪',
    desc: 'HP 60 회복 | 전투 중 Q 키로 사용',
    cost: 40,
    canBuy: () => true,
    buyLimit: 99,
    onBuy: () => {
      gyunJuiceCount++;
      showItemToast('🧪 촉촉한 균즙 획득', `보유 ${gyunJuiceCount}개 | Q 키로 사용!`, '#4ade80');
    }
  },
  {
    id: 'gyun_armor',
    name: '균 갑옷',
    icon: '🛡️',
    desc: '받는 피해 35% 감소 (중첩 불가)',
    cost: 120,
    canBuy: () => itemEffects.armor === 0,
    buyLimit: 1,
    onBuy: () => {
      itemEffects.armor = 1;
      showItemToast('🛡️ 균 갑옷 장착', '받는 피해 35% 감소!', '#60a5fa');
    }
  },
  {
    id: 'spore_cloak',
    name: '포자 망토',
    icon: '🌫️',
    desc: '10% 확률로 피해 완전 무시',
    cost: 180,
    canBuy: () => !itemEffects.sporeCloakActive,
    buyLimit: 1,
    onBuy: () => {
      itemEffects.sporeCloakActive = true;
      showItemToast('🌫️ 포자 망토 장착', '10% 확률로 피해 무시!', '#a78bfa');
    }
  },
  {
    id: 'berserk_gyun',
    name: '광폭 균 공생체',
    icon: '🔥',
    desc: '15초간 공격력 2배 → 종료 후 5초 무력화\n전투 중 R 키로 사용',
    cost: 200,
    canBuy: () => !itemEffects.berserkActive && itemEffects.berserkDisableTimer === 0,
    buyLimit: 99,
    onBuy: () => {
      berserkCount++;
      showItemToast('🔥 광폭 균 공생체 획득', `보유 ${berserkCount}개 | R 키로 발동!`, '#f97316');
    }
  },
  {
    id: 'auto_kit',
    name: '자가증식 균 키트',
    icon: '⚗️',
    desc: 'HP 30% 이하 시 자동 발동 → HP 40% 회복\n발동 후 60초 쿨다운',
    cost: 250,
    canBuy: () => itemEffects.kitCooldown === 0,
    buyLimit: 99,
    onBuy: () => {
      // 구매 즉시 대기 상태로 등록 (자동 발동 감시 시작)
      showItemToast('⚗️ 자가증식 균 키트', 'HP 30% 이하 시 자동 발동 대기 중', '#34d399');
    }
  },
  {
    id: 'gyun_core',
    name: '균 핵',
    icon: '💎',
    desc: '사망 시 HP 50%로 부활 (1회용)',
    cost: 500,
    canBuy: () => !itemEffects.gyunCoreOwned,
    buyLimit: 1,
    onBuy: () => {
      itemEffects.gyunCoreOwned = true;
      itemEffects.gyunCoreUsed = false;
      showItemToast('💎 균 핵 획득', '다음 사망 시 자동 부활!', '#fbbf24');
    }
  },
];

// 자가증식 키트 보유 수량 (구매할 때마다 +1)
let autoKitCount = 0;
// 균즙 보유 수량
let gyunJuiceCount = 0;
// 광폭 공생체 보유 수량
let berserkCount = 0;

// 아이템 구매 횟수 추적
const itemPurchaseCount = {};

function openShop() {
  const box = document.getElementById('shop-dialogue-box');
  if (!box) return;
  renderShop();
  box.style.display = 'block';
}

function closeShop() {
  const box = document.getElementById('shop-dialogue-box');
  if (box) box.style.display = 'none';
  currentNPC = null;
}

function renderShop() {
  const coins = (typeof battleState !== 'undefined') ? battleState.playerCoins : 0;
  document.getElementById('shop-coins').textContent = coins;

  const container = document.getElementById('shop-items');
  container.innerHTML = '';

  // 활성 효과 표시
  const activeEffects = getActiveEffectsSummary();
  if (activeEffects.length > 0) {
    const effectsDiv = document.createElement('div');
    effectsDiv.style.cssText = 'background:rgba(255,255,255,0.05);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:0.85rem;';
    effectsDiv.innerHTML = '<div style="color:#ffd700;margin-bottom:4px;font-size:0.8rem;">✦ 활성 효과</div>' +
      activeEffects.map(e => `<div style="color:${e.color}">${e.text}</div>`).join('');
    container.appendChild(effectsDiv);
  }

  for (const item of SHOP_ITEMS) {
    const canAfford = coins >= item.cost;
    const canBuy = item.canBuy() && canAfford;

    const btn = document.createElement('button');
    btn.className = 'shop-item-btn';
    btn.disabled = !canBuy;

    const owned = getItemOwnedLabel(item.id);
    btn.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:2px;flex:1;text-align:left;">
        <div style="font-size:1rem;">${item.icon} ${item.name}${owned ? ` <span style="color:#4ade80;font-size:0.8rem;">${owned}</span>` : ''}</div>
        <div style="color:rgba(255,255,255,0.5);font-size:0.8rem;white-space:pre-line;">${item.desc}</div>
      </div>
      <div style="color:${canAfford ? '#ffd700' : '#f87171'};font-size:0.95rem;flex-shrink:0;margin-left:12px;">🪙${item.cost}</div>
    `;

    btn.onclick = () => {
      if (!item.canBuy() || battleState.playerCoins < item.cost) return;
      battleState.playerCoins -= item.cost;
      saveBattleData();

      // 자가증식 키트는 수량 증가
      if (item.id === 'auto_kit') autoKitCount++;

      item.onBuy();
      renderShop(); // 갱신
    };

    container.appendChild(btn);
  }
}

function getItemOwnedLabel(id) {
  if (id === 'gyun_juice') return gyunJuiceCount > 0 ? `[${gyunJuiceCount}개]` : '';
  if (id === 'gyun_armor') return itemEffects.armor ? '[장착 중]' : '';
  if (id === 'spore_cloak') return itemEffects.sporeCloakActive ? '[장착 중]' : '';
  if (id === 'gyun_core') return itemEffects.gyunCoreOwned ? (itemEffects.gyunCoreUsed ? '[사용됨]' : '[보유]') : '';
  if (id === 'auto_kit') return autoKitCount > 0 ? `[${autoKitCount}개]` : '';
  if (id === 'berserk_gyun') return itemEffects.berserkActive ? '[발동 중]' : (berserkCount > 0 ? `[${berserkCount}개]` : '');
  return '';
}

function getActiveEffectsSummary() {
  const effects = [];
  if (gyunJuiceCount > 0) effects.push({ text: `🧪 균즙 ${gyunJuiceCount}개 보유 — Q 키로 사용`, color: '#4ade80' });
  if (itemEffects.armor) effects.push({ text: '🛡️ 균 갑옷 — 피해 35% 감소', color: '#60a5fa' });
  if (itemEffects.sporeCloakActive) effects.push({ text: '🌫️ 포자 망토 — 10% 피해 무시', color: '#a78bfa' });
  if (berserkCount > 0 && !itemEffects.berserkActive) effects.push({ text: `🔥 광폭 공생체 ${berserkCount}개 보유 — R 키로 발동`, color: '#f97316' });
  if (itemEffects.berserkActive) effects.push({ text: `🔥 광폭 공생체 — 공격력 2배 (${Math.ceil(itemEffects.berserkTimer/60)}초 남음)`, color: '#f97316' });
  if (itemEffects.berserkDisableTimer > 0) effects.push({ text: `💤 무력화 중 (${Math.ceil(itemEffects.berserkDisableTimer/60)}초)`, color: '#9ca3af' });
  if (autoKitCount > 0 && itemEffects.kitCooldown === 0) effects.push({ text: `⚗️ 자가증식 키트 대기 중 (${autoKitCount}개)`, color: '#34d399' });
  if (itemEffects.kitCooldown > 0) effects.push({ text: `⚗️ 균 키트 쿨다운 (${Math.ceil(itemEffects.kitCooldown/60)}초)`, color: '#9ca3af' });
  if (itemEffects.gyunCoreOwned && !itemEffects.gyunCoreUsed) effects.push({ text: '💎 균 핵 — 부활 대기', color: '#fbbf24' });
  return effects;
}

// 토스트 알림
function showItemToast(title, desc, color) {
  let toast = document.getElementById('item-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'item-toast';
    toast.style.cssText = `
      position:fixed;top:80px;right:20px;z-index:20000;
      background:rgba(10,10,30,0.95);border-radius:14px;padding:14px 20px;
      font-family:'Jua',sans-serif;min-width:220px;pointer-events:none;
      box-shadow:0 4px 24px rgba(0,0,0,0.5);
      transition:opacity 0.4s;
    `;
    document.body.appendChild(toast);
  }
  toast.style.borderLeft = `4px solid ${color}`;
  toast.innerHTML = `<div style="color:${color};font-size:1rem;margin-bottom:4px;">${title}</div><div style="color:rgba(255,255,255,0.7);font-size:0.85rem;">${desc}</div>`;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ===== 전투 중 아이템 효과 처리 (매 프레임 호출 필요) =====
function updateItemEffects() {
  // 광폭 타이머
  if (itemEffects.berserkActive) {
    itemEffects.berserkTimer--;
    if (itemEffects.berserkTimer <= 0) {
      itemEffects.berserkActive = false;
      itemEffects.berserkDisableTimer = 60 * 5; // 5초 무력화
      showItemToast('💤 광폭 종료', '5초간 무력화...', '#9ca3af');
    }
  }

  // 무력화 타이머
  if (itemEffects.berserkDisableTimer > 0) {
    itemEffects.berserkDisableTimer--;
    if (itemEffects.berserkDisableTimer === 0) {
      showItemToast('✅ 무력화 해제', '다시 싸울 수 있다!', '#4ade80');
    }
  }

  // 자가증식 키트 쿨다운
  if (itemEffects.kitCooldown > 0) {
    itemEffects.kitCooldown--;
  }

  // 자가증식 키트 자동 발동
  if (
    autoKitCount > 0 &&
    itemEffects.kitCooldown === 0 &&
    battleState.playerHp > 0 &&
    battleState.playerHp / battleState.playerMaxHp <= 0.3
  ) {
    autoKitCount--;
    const healAmt = Math.floor(battleState.playerMaxHp * 0.4);
    battleState.playerHp = Math.min(battleState.playerHp + healAmt, battleState.playerMaxHp);
    itemEffects.kitCooldown = 60 * 60; // 60초 쿨다운
    showItemToast('⚗️ 자가증식 균 키트 발동!', `HP +${healAmt} 회복 | 60초 쿨다운`, '#34d399');
    if (typeof updateBattleHUD === 'function') updateBattleHUD();
  }
}

// 피해 계산 시 아이템 효과 적용 (battle.js에서 호출)
function applyItemDefense(rawDamage) {
  // 무력화 중이면 아이템 효과 없음 (단, 방어구는 유지)
  let dmg = rawDamage;

  // 포자 망토: 10% 확률로 완전 무시
  if (itemEffects.sporeCloakActive && Math.random() < 0.10) {
    showItemToast('🌫️ 포자 망토 발동!', '피해를 완전히 무시했다!', '#a78bfa');
    return 0;
  }

  // 균 갑옷: 35% 감소
  if (itemEffects.armor) {
    dmg = Math.floor(dmg * 0.65);
  }

  return dmg;
}

// 공격력 배율 반환 (battle.js에서 호출)
function getAttackMultiplier() {
  if (itemEffects.berserkDisableTimer > 0) return 0; // 무력화: 공격 불가
  if (itemEffects.berserkActive) return 2.0;
  return 1.0;
}

// 플레이어 사망 시 균 핵 부활 처리 (battle.js에서 호출)
function tryGyunCoreRevive() {
  if (itemEffects.gyunCoreOwned && !itemEffects.gyunCoreUsed) {
    itemEffects.gyunCoreUsed = true;
    itemEffects.gyunCoreOwned = false;
    battleState.playerHp = Math.floor(battleState.playerMaxHp * 0.5);
    battleState.gameOver = false;
    battleState.active = true;
    showItemToast('💎 균 핵 발동!', 'HP 50%로 부활했다!', '#fbbf24');
    if (typeof updateBattleHUD === 'function') updateBattleHUD();
    return true;
  }
  return false;
}

// 전투 시작 시 효과 초기화 (균 핵은 유지)
function resetItemEffectsForBattle() {
  const keepCore = itemEffects.gyunCoreOwned;
  const keepCoreDead = itemEffects.gyunCoreUsed;
  itemEffects = {
    armor: 0,
    sporeCloakActive: false,
    berserkActive: false,
    berserkTimer: 0,
    berserkDisableTimer: 0,
    kitCooldown: 0,
    gyunCoreOwned: keepCore,
    gyunCoreUsed: keepCoreDead,
  };
}