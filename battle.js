// battle.js - 균들과 싸우기

const BATTLE_STAGES = [
  { stage: 1,  name: "새내기 균",       gyunCount: 3,  gyunHp: 30,  gyunDmg: 5,  gyunSpeed: 1.2, coin: 10,  color: '#88cc88' },
  { stage: 2,  name: "성난 균",         gyunCount: 4,  gyunHp: 50,  gyunDmg: 8,  gyunSpeed: 1.4, coin: 20,  color: '#aacc66' },
  { stage: 3,  name: "날뛰는 균",       gyunCount: 5,  gyunHp: 80,  gyunDmg: 12, gyunSpeed: 1.6, coin: 35,  color: '#ccaa44' },
  { stage: 4,  name: "격노한 균",       gyunCount: 6,  gyunHp: 120, gyunDmg: 16, gyunSpeed: 1.8, coin: 50,  color: '#cc8844' },
  { stage: 5,  name: "불꽃 균",         gyunCount: 6,  gyunHp: 180, gyunDmg: 22, gyunSpeed: 2.0, coin: 70,  color: '#ee6633' },
  { stage: 6,  name: "얼음 균",         gyunCount: 7,  gyunHp: 250, gyunDmg: 28, gyunSpeed: 2.1, coin: 90,  color: '#44aaee' },
  { stage: 7,  name: "번개 균",         gyunCount: 8,  gyunHp: 340, gyunDmg: 35, gyunSpeed: 2.3, coin: 120, color: '#ffee33' },
  { stage: 8,  name: "암흑 균",         gyunCount: 9,  gyunHp: 460, gyunDmg: 45, gyunSpeed: 2.5, coin: 160, color: '#aa44ff' },
  { stage: 9,  name: "초월 균",         gyunCount: 10, gyunHp: 600, gyunDmg: 58, gyunSpeed: 2.8, coin: 220, color: '#ff44aa' },
  { stage: 10, name: "👑 최종 균 👑",   gyunCount: 1,  gyunHp: 3000,gyunDmg: 80, gyunSpeed: 2.0, coin: 500, color: '#ffd700', isBoss: true },
];

let battleState = {
  active: false,
  stage: 1,
  wave: 1,
  playerHp: 100,
  playerMaxHp: 100,
  playerLevel: 1,
  playerExp: 0,
  playerCoins: 0,
  playerX: 0,        
  playerY: 0,        
  attackCooldown: 0,
  enemies: [],
  particles: [],
  damageTexts: [],
  isAttacking: false,
  attackAnim: 0,
  gameOver: false,
  stageClear: false,
  allClear: false,
};

function resetBattle() {
  if (typeof BloodKnightSkill !== 'undefined') BloodKnightSkill.resetForBattle();
  if (typeof resetSkillStateForBattle === 'function') resetSkillStateForBattle();
  if (typeof resetItemEffectsForBattle === 'function') resetItemEffectsForBattle();
  if (typeof BloodKnightSkill !== 'undefined') BloodKnightSkill.resetForBattle();
  const saved = JSON.parse(localStorage.getItem('gyun_battle') || '{}');
  const canvas = document.getElementById('battleCanvas');
  const px = battleState.playerX, py = battleState.playerY;
  battleState = {
    active: true,
    stage: 1,
    playerHp: 100,
    playerMaxHp: 100,
    playerLevel: saved.level || 1,
    playerExp: saved.exp || 0,
    playerCoins: saved.coins || 0,
    playerX: canvas.width * 0.2 - 30,
    playerY: canvas.height * 0.5 - 30,
    attackCooldown: 0,
    enemies: [],
    particles: [],
    damageTexts: [],
    isAttacking: false,
    attackAnim: 0,
    gameOver: false,
    stageClear: false,
    allClear: false,
  };
  // 변이 보너스 적용 (최대HP)
  if (typeof getMutationMaxHpBonus === 'function') {
    battleState.playerMaxHp += getMutationMaxHpBonus();
    battleState.playerHp = Math.min(battleState.playerHp, battleState.playerMaxHp);
  }
  spawnWave();
  updateBattleHUD();
  document.getElementById('b-next-btn').style.display = battleState.stageClear ? 'block' : 'none';
  document.getElementById('b-retry-btn').style.display = battleState.gameOver ? 'block' : 'none';
}

function saveBattleData() {
  localStorage.setItem('gyun_battle', JSON.stringify({
    level: battleState.playerLevel,
    exp: battleState.playerExp,
    coins: battleState.playerCoins,
  }));
}

function spawnWave() {
  const stageData = BATTLE_STAGES[battleState.stage - 1];
  battleState.enemies = [];
  const canvas = document.getElementById('battleCanvas');
  const W = canvas.width, H = canvas.height;

  for (let i = 0; i < stageData.gyunCount; i++) {
    battleState.enemies.push({
      x: W * 0.55 + Math.random() * W * 0.35,
      y: H * 0.15 + Math.random() * H * 0.6,
      hp: stageData.gyunHp,
      maxHp: stageData.gyunHp,
      dmg: stageData.gyunDmg,
      speed: stageData.gyunSpeed,
      color: stageData.color,
      name: stageData.name,
      isBoss: stageData.isBoss || false,
      size: stageData.isBoss ? 60 : 28 + Math.random() * 10,
      attackTimer: Math.random() * 120,
      wobble: Math.random() * Math.PI * 2,
    });
  }
}

function playerAttack() {
  // 모든 직업 평타 허용
  // 무력화 중이면 공격 불가
  const atkMult = (typeof getAttackMultiplier === 'function') ? getAttackMultiplier() : 1;
  if (atkMult === 0) return;
  
  if (battleState.attackCooldown > 0 || battleState.gameOver || battleState.stageClear) return;

  const stageData = BATTLE_STAGES[battleState.stage - 1];
  const baseDmg = 15
    + (battleState.playerLevel - 1) * 5
    + (typeof getUpgradeAtkBonus === 'function' ? getUpgradeAtkBonus() : 0)
    + (typeof getMutationAtkBonus === 'function' ? getMutationAtkBonus() : 0);
  const skillMult = (typeof getSkillAtkMultiplier === 'function') ? getSkillAtkMultiplier() : 1.0;
  const mutMult = (typeof getMutationDamageMultiplier === 'function') ? getMutationDamageMultiplier() : 1.0;
  const dmg = calcFinalPlayerDamage(Math.floor((baseDmg + Math.random() * 10) * atkMult * skillMult * mutMult));

  battleState.isAttacking = true;
  battleState.attackAnim = 15;
  battleState.attackCooldown = 30;

  if (battleState.enemies.length > 0) {
    const canvas = document.getElementById('battleCanvas');
    const px = canvas.width * 0.2, py = canvas.height * 0.5;
    let closest = battleState.enemies.reduce((a, b) =>
      Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b
    );

    closest.hp -= dmg;
    // 균 동화 흡혈
    if (typeof processGyunSyncHeal === 'function') processGyunSyncHeal(dmg);

    battleState.damageTexts.push({
      x: closest.x, y: closest.y - closest.size,
      text: `-${dmg}`, color: '#ff4444', life: 60, vy: -2,
    });

    for (let i = 0; i < 6; i++) {
      battleState.particles.push({
        x: closest.x, y: closest.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30, color: closest.color, size: 4,
      });
    }

    if (closest.hp <= 0) {
      const expGain = calcFinalExpGain(stageData.isBoss ? 100 : 10 + battleState.stage * 3);
      battleState.playerExp += expGain;
      battleState.playerCoins += Math.floor(stageData.coin / stageData.gyunCount);

      const expNeeded = battleState.playerLevel * 50;
      if (battleState.playerExp >= expNeeded) {
        battleState.playerExp -= expNeeded;
        battleState.playerLevel++;
        battleState.playerMaxHp += 20;
        battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
        battleState.damageTexts.push({
          x: canvas.width * 0.2, y: canvas.height * 0.3,
          text: '레벨업!', color: '#ffd700', life: 90, vy: -1,
        });
      }

      // 흡혈 반응
      if (typeof tryVampireOnKill === 'function') tryVampireOnKill();
      // 폭발 반응
      if (typeof tryExplodeOnHit === 'function') tryExplodeOnHit(closest);

      battleState.enemies = battleState.enemies.filter(e => e !== closest);

      for (let i = 0; i < 15; i++) {
        battleState.particles.push({
          x: closest.x, y: closest.y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 45, color: '#ffaa00', size: 6,
        });
      }

      saveBattleData();

      // 변이: 처치 회복
      if (typeof getMutationOnKillHeal === 'function') {
        const heal = getMutationOnKillHeal();
        if (heal > 0) {
          battleState.playerHp = Math.min(battleState.playerHp + heal, battleState.playerMaxHp);
          battleState.damageTexts.push({
            x: canvas.width * 0.2, y: canvas.height * 0.5 - 40,
            text: `🩸 +${heal}`, color: '#fca5a5', life: 60, vy: -1.2,
          });
        }
      }

      if (battleState.enemies.length === 0) {
        if (battleState.stage >= 10) {
          battleState.allClear = true;
          battleState.active = false;
        } else {
          battleState.stageClear = true;
          battleState.active = false;
        }
      }
    }
  }

  updateBattleHUD();
}

function nextStage() {
  battleState.stage++;
  const bonus = (typeof getMutationStageClearHealBonus === 'function') ? getMutationStageClearHealBonus() : 0;
  battleState.playerHp = Math.min(battleState.playerHp + 30 + bonus, battleState.playerMaxHp);
  battleState.stageClear = false;
  battleState.active = true;
  spawnWave();
  updateBattleHUD();
}

function retryBattle() {
  resetBattle();
}

function updateBattleHUD() {
  document.getElementById('b-stage').textContent = battleState.stage;
  document.getElementById('b-level').textContent = battleState.playerLevel;
  document.getElementById('b-coins').textContent = battleState.playerCoins;
  document.getElementById('b-hp-bar').style.width = (battleState.playerHp / battleState.playerMaxHp * 100) + '%';
  document.getElementById('b-hp-text').textContent = `${battleState.playerHp}/${battleState.playerMaxHp}`;
  const expNeeded = battleState.playerLevel * 50;
  document.getElementById('b-exp-bar').style.width = (battleState.playerExp / expNeeded * 100) + '%';
  document.getElementById('b-next-btn').style.display = battleState.stageClear ? 'block' : 'none';
  document.getElementById('b-retry-btn').style.display = battleState.gameOver ? 'block' : 'none';
}

function battleLoop() {
  if (!inBattle) return;
  const canvas = document.getElementById('battleCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // 업데이트
  if (battleState.active) {
    // 쿨다운
    if (battleState.attackCooldown > 0) battleState.attackCooldown--;
    if (battleState.attackAnim > 0) battleState.attackAnim--;
    else battleState.isAttacking = false;

    // 적 이동 & 공격
    const px = battleState.playerX, py = battleState.playerY;

    // 금서술사 지속 효과 업데이트
    if (typeof updateForbiddenEffects === 'function') updateForbiddenEffects();
    // 광신도 출혈 효과 업데이트
    if (typeof updateBleedEffects === 'function') updateBleedEffects();

    // 시간 정지 중이면 적 행동 스킵
    const frozen = (typeof isTimeStopActive === 'function') && isTimeStopActive();

    for (const e of battleState.enemies) {
      e.wobble += 0.05;

      if (frozen) continue;

      // 혼란 상태면 랜덤 이동
      if (e.confused) {
        e.x += (Math.random() - 0.5) * e.speed * 2;
        e.y += (Math.random() - 0.5) * e.speed * 2;
        continue;
      }

      const dx = px - e.x, dy = py - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 80) {
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
      }

      // 적 공격
      e.attackTimer--;
      if (e.attackTimer <= 0 && dist < 100) {
        e.attackTimer = 90;
        const actualDmg = (typeof applyItemDefense === 'function') ? applyItemDefense(e.dmg) : e.dmg;
        // 금서술사 무적 체크
        const invincible = ((typeof isForbiddenInvincible === 'function') && isForbiddenInvincible())
                          || ((typeof isSkillInvincible === 'function') && isSkillInvincible());
        const upgradeMult = (typeof getUpgradeIncomingMultiplier === 'function') ? getUpgradeIncomingMultiplier() : 1.0;
        const mutInMult = (typeof getMutationIncomingMultiplier === 'function') ? getMutationIncomingMultiplier() : 1.0;
        const incomingDmg = calcFinalIncomingDamage(Math.floor(actualDmg * upgradeMult * mutInMult));
        // 반격 반응
        if (typeof tryCounterOnHit === 'function') tryCounterOnHit();
        if (invincible) {
          battleState.damageTexts.push({
            x: px, y: py - 40,
            text: '무적!', color: '#ffd700', life: 30, vy: -1.5,
          });
        } else if (actualDmg > 0) {
          battleState.playerHp -= incomingDmg;
          battleState.damageTexts.push({
            x: px, y: py - 40,
            text: `-${actualDmg}`, color: '#ff8888', life: 60, vy: -1.5,
          });
        }
        if (battleState.playerHp <= 0) {
          battleState.playerHp = 0;
          const revived = (typeof tryGyunCoreRevive === 'function') ? tryGyunCoreRevive() : false;
          if (!revived) {
            battleState.gameOver = true;
            battleState.active = false;
          }
        }
        updateBattleHUD();
      }
    }

    // 금서 열람실 효과 업데이트
    updateReadingRoomEffects();
    // 금단 스킬 업데이트
    if (typeof updateSkillEnergy  === 'function') updateSkillEnergy();
    if (typeof updateSkillTimers  === 'function') updateSkillTimers();

    // 스킬 발사체 업데이트
    updateSkillProjectiles();
    // 아이템 효과 업데이트
    if (typeof updateItemEffects === 'function') updateItemEffects();

    // 파티클 업데이트
    for (const p of battleState.particles) {
      p.x += p.vx; p.y += p.vy; p.life--;
    }
    battleState.particles = battleState.particles.filter(p => p.life > 0);

    // 데미지 텍스트 업데이트
    for (const t of battleState.damageTexts) {
      t.y += t.vy; t.life--;
    }
    battleState.damageTexts = battleState.damageTexts.filter(t => t.life > 0);
  }

  // 그리기
  ctx.clearRect(0, 0, W, H);

  // 배경
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  // 바닥
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, H * 0.75, W, H * 0.25);
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, H * 0.75); ctx.lineTo(W, H * 0.75); ctx.stroke();

  // 파티클
  for (const p of battleState.particles) {
    ctx.globalAlpha = p.life / 45;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 적 그리기
  for (const e of battleState.enemies) {
    const wobbleY = Math.sin(e.wobble) * 4;
    const s = e.size;

    // 그림자
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + s + 5, s * 0.7, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 몸통
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y + wobbleY, s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = e.isBoss ? 4 : 2;
    ctx.stroke();

    // 눈
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(e.x - s*0.3, e.y + wobbleY - s*0.2, s*0.15, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + s*0.3, e.y + wobbleY - s*0.2, s*0.15, 0, Math.PI*2); ctx.fill();

    // 화난 눈썹
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.x - s*0.45, e.y + wobbleY - s*0.38); ctx.lineTo(e.x - s*0.15, e.y + wobbleY - s*0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e.x + s*0.45, e.y + wobbleY - s*0.38); ctx.lineTo(e.x + s*0.15, e.y + wobbleY - s*0.3); ctx.stroke();

    // HP바
    const barW = s * 2.2;
    ctx.fillStyle = '#333';
    ctx.fillRect(e.x - barW/2, e.y + wobbleY - s - 18, barW, 8);
    ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#4ade80' : e.hp / e.maxHp > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(e.x - barW/2, e.y + wobbleY - s - 18, barW * (e.hp / e.maxHp), 8);

    // 보스 이름
    if (e.isBoss) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.name, e.x, e.y + wobbleY - s - 25);
    }
  }

  const px = battleState.playerX, py = battleState.playerY;
  const attackOffset = battleState.isAttacking ? 30 : 0;

  // 그림자
  ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(px, py + 38, 25, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // 몸통
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.arc(px, py, 30, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 3; ctx.stroke();

  // 눈
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(px - 10, py - 8, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 10, py - 8, 5, 0, Math.PI * 2); ctx.fill();

  // 웃음
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px, py + 2, 12, 0.1, Math.PI - 0.1); ctx.stroke();

  // 데미지 텍스트
  for (const t of battleState.damageTexts) {
    ctx.globalAlpha = t.life / 60;
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.text.includes('레벨') ? 22 : 18}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  // 공격 쿨다운 표시
  if (battleState.attackCooldown > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(W*0.05, H*0.82, (W*0.25) * (1 - battleState.attackCooldown/30), 8);
  }

  // 금서 열람실 오버레이
  drawReadingRoomDistortion(ctx, W, H);
  drawReadingRoomStunOverlay(ctx, W, H);
  drawReadingRoomStatusHUD(ctx, W, H);
  if (typeof drawUpgradeStatusHUD === 'function') drawUpgradeStatusHUD(ctx, W, H);
  if (typeof drawSkillStateHUD === 'function') drawSkillStateHUD(ctx, W, H);

  // 게임오버
  if (battleState.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 48px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💀 전멸 💀', W/2, H/2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Noto Sans KR", sans-serif';
    ctx.fillText('균들에게 패배했습니다...', W/2, H/2 + 20);
  }

  // 스테이지 클리어
  if (battleState.stageClear) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 42px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`✨ ${battleState.stage - 1}스테이지 클리어! ✨`, W/2, H/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Noto Sans KR", sans-serif';
    ctx.fillText('다음 스테이지로 진행하시겠습니까?', W/2, H/2 + 30);
  }

  // 전체 클리어
  if (battleState.allClear) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 38px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑 모든 균을 처치했다! 👑', W/2, H/2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Noto Sans KR", sans-serif';
    ctx.fillText(`획득 코인: ${battleState.playerCoins}`, W/2, H/2 + 10);
    ctx.fillText(`최종 레벨: ${battleState.playerLevel}`, W/2, H/2 + 45);
  }

  requestAnimationFrame(battleLoop);
}

window.addEventListener('keydown', (e) => {
  if (!inBattle) return;

  // 일반 공격 (직업 없음 또는 금서술사)
  if (e.code === 'Space' || e.key === 'z' || e.key === 'Z') {
    e.preventDefault();
    
    playerAttack();
    if (playerJob.current === '검사') {
      swordSlash();
    } else if (playerJob.current === '마검사' && battleState.playerLevel >= 50) {
      castLightning();
    }
  }

  // F키 스킬
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    
    if (playerJob.current === '마법사') {
      castFireball();
    } else if (playerJob.current === '마검사') {
      castFireball();
    } else if (playerJob.current === '전사') {
      swordSlash();
    } else if (playerJob.current === '균 숭배자') {
      instantKill();
    } else if (playerJob.current === '광신도') {
      fanaticJudgement();
    } else if (playerJob.current === '혈검사') {
      bloodRampage();
    } else if (playerJob.current === '금서술사') {
      forbiddenPage();
    }
  }

  // Q키 - 균즙 사용
  if (e.key === 'q' || e.key === 'Q') {
    e.preventDefault();
    if (typeof gyunJuiceCount !== 'undefined' && gyunJuiceCount > 0) {
      gyunJuiceCount--;
      battleState.playerHp = Math.min(battleState.playerHp + 60, battleState.playerMaxHp);
      updateBattleHUD();
      if (typeof showItemToast === 'function')
        showItemToast('🧪 균즙 사용!', `HP +60 회복 | 남은 수량: ${gyunJuiceCount}개`, '#4ade80');
    } else {
      if (typeof showItemToast === 'function')
        showItemToast('🧪 균즙 없음', '상인에게서 구매하세요!', '#f87171');
    }
  }

  // R키 - 광폭 균 공생체 발동
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    if (typeof berserkCount !== 'undefined' && berserkCount > 0
        && !itemEffects.berserkActive && itemEffects.berserkDisableTimer === 0) {
      berserkCount--;
      itemEffects.berserkActive = true;
      itemEffects.berserkTimer = 60 * 15;
      if (typeof showItemToast === 'function')
        showItemToast('🔥 광폭 발동!', `공격력 2배! 15초 후 5초 무력화 | 남은 수량: ${berserkCount}개`, '#f97316');
    } else if (itemEffects.berserkActive) {
      if (typeof showItemToast === 'function')
        showItemToast('🔥 이미 발동 중!', `${Math.ceil(itemEffects.berserkTimer/60)}초 남음`, '#f97316');
    } else if (itemEffects.berserkDisableTimer > 0) {
      if (typeof showItemToast === 'function')
        showItemToast('💤 무력화 중', `${Math.ceil(itemEffects.berserkDisableTimer/60)}초 후 사용 가능`, '#9ca3af');
    } else {
      if (typeof showItemToast === 'function')
        showItemToast('🔥 광폭 공생체 없음', '상인에게서 구매하세요!', '#f87171');
    }
  }
  
  // 이동
  if (e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp') {
    e.preventDefault();
    battleState.playerY = Math.max(battleState.playerY - (typeof getUpgradeFinalMoveSpeed === 'function' ? getUpgradeFinalMoveSpeed() : 15), 0);
  }
  if (e.key === 's' || e.key === 'S' || e.code === 'ArrowDown') {
    e.preventDefault();
    battleState.playerY = Math.min(battleState.playerY + (typeof getUpgradeFinalMoveSpeed === 'function' ? getUpgradeFinalMoveSpeed() : 15), document.getElementById('battleCanvas').height - 60);
  }
  if (e.key === 'a' || e.key === 'A' || e.code === 'ArrowLeft') {
    e.preventDefault();
    battleState.playerX = Math.max(battleState.playerX - (typeof getUpgradeFinalMoveSpeed === 'function' ? getUpgradeFinalMoveSpeed() : 15), 0);
  }
  if (e.key === 'd' || e.key === 'D' || e.code === 'ArrowRight') {
    e.preventDefault();
    battleState.playerX = Math.min(battleState.playerX + (typeof getUpgradeFinalMoveSpeed === 'function' ? getUpgradeFinalMoveSpeed() : 15), document.getElementById('battleCanvas').width - 60);
  }
});