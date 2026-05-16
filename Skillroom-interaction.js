// skillroom-interaction.js
// 금단의 스킬실 스킬 효과를 실제 전투에 연결
// 전투 중 숫자키 1~5로 스킬 사용

// ===== 전역 스킬 상태 저장소 =====
// 맵이 바뀌어도 유지됨
window.SKILL_STATE = window.SKILL_STATE || {
  // 균의 폭주
  rampage: {
    active:      false,
    timer:       0,       // 남은 프레임 (5초 = 300f)
    invincTimer: 0,       // 무적 남은 프레임 (2초 = 120f)
    lastUsed:    0,       // Date.now()
    cooldown:    20000,   // 20초
  },
  // 시간 왜곡
  timeWarp: {
    usedThisBattle: false,
  },
  // 공허의 손
  voidHand: {
    lastUsed: 0,
    cooldown: 30000,
  },
  // 균 동화
  gyunSync: {
    active:       false,
    healedSoFar:  0,
  },
  // 자아 해방
  liberation: {
    active: false,
    timer:  0,       // 남은 프레임 (10초 = 600f)
  },
  // 에너지
  energy:    100,
  maxEnergy: 100,
  energyRegenTimer: 0,
};

// ===== 해금 여부 확인 =====
function isSkillUnlocked(skillId) {
  const s = JSON.parse(localStorage.getItem('gyun_skill_states') || '{}');
  return !!s[skillId]?.unlocked;
}

// ===== 전투 시작 시 초기화 =====
function resetSkillStateForBattle() {
  const SS = window.SKILL_STATE;
  SS.timeWarp.usedThisBattle = false;
  SS.gyunSync.active      = false;
  SS.gyunSync.healedSoFar = 0;
  SS.liberation.active    = false;
  SS.liberation.timer     = 0;
  SS.rampage.active       = false;
  SS.rampage.timer        = 0;
  SS.rampage.invincTimer  = 0;
}

// ===== 에너지 자동 회복 (매 프레임 호출) =====
function updateSkillEnergy() {
  const SS = window.SKILL_STATE;
  if (SS.energy >= SS.maxEnergy) return;
  SS.energyRegenTimer++;
  if (SS.energyRegenTimer >= 120) { // 2초마다 +5
    SS.energyRegenTimer = 0;
    SS.energy = Math.min(SS.maxEnergy, SS.energy + 5);
  }
}

// ===== 스킬 타이머 업데이트 (매 프레임 호출) =====
function updateSkillTimers() {
  const SS = window.SKILL_STATE;

  // 균의 폭주
  if (SS.rampage.active) {
    SS.rampage.timer--;
    if (SS.rampage.timer <= 0) {
      SS.rampage.active = false;
      SS.rampage.invincTimer = 120; // 2초 무적 시작
      pushBattleText('폭주 종료 — 무적 2초', '#ef4444');
    }
  }
  if (SS.rampage.invincTimer > 0) SS.rampage.invincTimer--;

  // 자아 해방
  if (SS.liberation.active) {
    SS.liberation.timer--;
    if (SS.liberation.timer <= 0) {
      SS.liberation.active = false;
      pushBattleText('자아 해방 종료.', '#fbbf24');
    }
  }
}

// ===== 유틸: 전투 텍스트 추가 =====
function pushBattleText(text, color) {
  if (typeof battleState === 'undefined') return;
  battleState.damageTexts.push({
    x: battleState.playerX,
    y: battleState.playerY - 60,
    text, color, life: 100, vy: -2,
  });
}

// ===== 스킬 사용 =====
function useSkillById(skillId) {
  if (!isSkillUnlocked(skillId)) {
    pushBattleText('스킬 미해금', '#9ca3af');
    return;
  }
  if (typeof battleState === 'undefined' || !battleState.active) return;

  const SS = window.SKILL_STATE;
  const now = Date.now();

  switch (skillId) {

    // 1. 균의 폭주 — 공격력 2배 5초, 종료 후 2초 무적
    case 'rampage': {
      const remaining = SS.rampage.cooldown - (now - SS.rampage.lastUsed);
      if (remaining > 0) {
        pushBattleText(`쿨타임 ${Math.ceil(remaining/1000)}초`, '#9ca3af');
        return;
      }
      if (SS.rampage.active) {
        pushBattleText('이미 발동 중', '#9ca3af');
        return;
      }
      SS.rampage.lastUsed    = now;
      SS.rampage.active      = true;
      SS.rampage.timer       = 300; // 5초
      SS.rampage.invincTimer = 0;

      pushBattleText('💥 균의 폭주!', '#ef4444');

      // 파티클
      for (let i = 0; i < 20; i++) {
        battleState.particles.push({
          x: battleState.playerX, y: battleState.playerY,
          vx: (Math.random()-0.5)*14, vy: (Math.random()-0.5)*14,
          life: 40, color: '#ef4444', size: 6,
        });
      }
      break;
    }

    // 2. 시간 왜곡 — 모든 스킬 쿨타임 초기화 (전투당 1회)
    case 'timeWarp': {
      if (SS.timeWarp.usedThisBattle) {
        pushBattleText('이번 전투에서 이미 사용함', '#9ca3af');
        return;
      }
      SS.timeWarp.usedThisBattle = true;

      // 모든 스킬 쿨타임 초기화
      if (typeof skillState !== 'undefined') {
        skillState.lastFireballTime  = 0;
        skillState.lastLightningTime = 0;
        skillState.lastSwordWaveTime = 0;
        skillState.lastInstakillTime = 0;
      }
      if (typeof BloodKnightSkill !== 'undefined') BloodKnightSkill.lastUsed = 0;
      if (typeof FanaticSkill     !== 'undefined') FanaticSkill.lastUsed     = 0;
      if (typeof ForbiddenSkill   !== 'undefined') ForbiddenSkill.lastUsed   = 0;
      SS.rampage.lastUsed  = 0;
      SS.voidHand.lastUsed = 0;

      pushBattleText('⏱️ 시간 왜곡! 쿨타임 초기화!', '#38bdf8');

      for (let i = 0; i < 15; i++) {
        battleState.particles.push({
          x: battleState.playerX + (Math.random()-0.5)*100,
          y: battleState.playerY + (Math.random()-0.5)*100,
          vx: 0, vy: -1,
          life: 60, color: '#38bdf8', size: 4,
        });
      }
      break;
    }

    // 3. 공허의 손 — 적 5마리 이상일 때 전체 큰 피해
    case 'voidHand': {
      const remaining = SS.voidHand.cooldown - (now - SS.voidHand.lastUsed);
      if (remaining > 0) {
        pushBattleText(`쿨타임 ${Math.ceil(remaining/1000)}초`, '#9ca3af');
        return;
      }
      if (battleState.enemies.length < 5) {
        pushBattleText('적이 5마리 이상이어야 한다', '#9ca3af');
        return;
      }

      SS.voidHand.lastUsed = now;
      const dmg = Math.floor((80 + battleState.playerLevel * 5) * getSkillAtkMultiplier());
      pushBattleText(`🖐️ 공허의 손! -${dmg}`, '#a78bfa');

      for (let i = battleState.enemies.length - 1; i >= 0; i--) {
        const e = battleState.enemies[i];
        e.hp -= dmg;

        battleState.damageTexts.push({
          x: e.x, y: e.y - e.size,
          text: `-${dmg}`, color: '#a78bfa', life: 70, vy: -2.5,
        });
        for (let k = 0; k < 8; k++) {
          battleState.particles.push({
            x: e.x, y: e.y,
            vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
            life: 35, color: '#a78bfa', size: 5,
          });
        }

        if (e.hp <= 0) {
          battleState.playerExp   += calcFinalExpGain(20 + battleState.stage * 5);
          battleState.playerCoins += 25;
          if (typeof tryVampireOnKill === 'function') tryVampireOnKill();
          battleState.enemies.splice(i, 1);
        }
      }

      if (typeof checkStageClear  === 'function') checkStageClear();
      if (typeof saveBattleData   === 'function') saveBattleData();
      if (typeof updateBattleHUD  === 'function') updateBattleHUD();
      break;
    }

    // 4. 균 동화 — 공격 시 HP 흡수 (최대HP 30%까지)
    case 'gyunSync': {
      SS.gyunSync.active = !SS.gyunSync.active;
      if (SS.gyunSync.active) {
        SS.gyunSync.healedSoFar = 0;
        pushBattleText('🩸 균 동화 활성화', '#4ade80');
      } else {
        pushBattleText('균 동화 해제', '#9ca3af');
      }
      break;
    }

    // 5. 자아 해방 — 에너지 100% 필요, 10초간 모든 스킬 강화
    case 'liberation': {
      if (SS.energy < SS.maxEnergy) {
        pushBattleText(`에너지 부족 (${SS.energy}/${SS.maxEnergy})`, '#9ca3af');
        return;
      }
      if (SS.liberation.active) {
        pushBattleText('이미 발동 중', '#9ca3af');
        return;
      }
      SS.energy = 0;
      SS.liberation.active = true;
      SS.liberation.timer  = 600; // 10초
      pushBattleText('✨ 자아 해방!', '#fbbf24');

      for (let i = 0; i < 25; i++) {
        battleState.particles.push({
          x: battleState.playerX, y: battleState.playerY,
          vx: (Math.random()-0.5)*16, vy: (Math.random()-0.5)*16,
          life: 50, color: i%2===0 ? '#fbbf24' : '#a78bfa', size: 7,
        });
      }
      break;
    }
  }
}

// ===== 균 동화 흡혈 처리 — 플레이어가 적에게 데미지 줄 때 호출 =====
function processGyunSyncHeal(damage) {
  const SS = window.SKILL_STATE;
  if (!SS.gyunSync.active) return;
  if (typeof battleState === 'undefined') return;

  const maxHeal = Math.floor(battleState.playerMaxHp * 0.3);
  if (SS.gyunSync.healedSoFar >= maxHeal) {
    SS.gyunSync.active = false;
    pushBattleText('균 동화 한도 도달 — 해제', '#9ca3af');
    return;
  }

  const heal = Math.min(Math.floor(damage * 0.15), maxHeal - SS.gyunSync.healedSoFar);
  SS.gyunSync.healedSoFar += heal;
  battleState.playerHp = Math.min(battleState.playerHp + heal, battleState.playerMaxHp);

  battleState.damageTexts.push({
    x: battleState.playerX, y: battleState.playerY - 30,
    text: `🩸 +${heal}`, color: '#4ade80', life: 50, vy: -1.5,
  });

  if (typeof updateBattleHUD === 'function') updateBattleHUD();
}

// ===== 수치 조회 =====

// 공격력 배율 (폭주 2배, 자아 해방 1.5배 중첩)
function getSkillAtkMultiplier() {
  const SS = window.SKILL_STATE;
  let mult = 1.0;
  if (SS.rampage.active)    mult *= 2.0;
  if (SS.liberation.active) mult *= 1.5;
  return mult;
}

// 무적 여부 (폭주 종료 후 2초)
function isSkillInvincible() {
  return window.SKILL_STATE.rampage.invincTimer > 0;
}

// 스킬 쿨타임 배율 (자아 해방 중 쿨타임 50% 감소)
function getSkillCooldownMultiplier() {
  if (window.SKILL_STATE.liberation.active) return 0.5;
  return 1.0;
}

// ===== HUD 그리기 =====
function drawSkillStateHUD(ctx, vw, vh) {
  const SS = window.SKILL_STATE;
  const now = Date.now();

  const lines = [];

  // 에너지 바 항상 표시
  // 활성 효과
  if (SS.rampage.active) {
    lines.push({ text: `💥 폭주 ${Math.ceil(SS.rampage.timer/60)}초`, color: '#ef4444' });
  }
  if (SS.rampage.invincTimer > 0) {
    lines.push({ text: `🛡️ 무적 ${Math.ceil(SS.rampage.invincTimer/60)}초`, color: '#fbbf24' });
  }
  if (SS.gyunSync.active) {
    const maxHeal = typeof battleState !== 'undefined' ? Math.floor(battleState.playerMaxHp * 0.3) : 0;
    lines.push({ text: `🩸 균 동화 ${SS.gyunSync.healedSoFar}/${maxHeal}`, color: '#4ade80' });
  }
  if (SS.liberation.active) {
    lines.push({ text: `✨ 자아 해방 ${Math.ceil(SS.liberation.timer/60)}초`, color: '#fbbf24' });
  }
  if (SS.timeWarp.usedThisBattle) {
    lines.push({ text: '⏱️ 시간 왜곡 사용됨', color: '#38bdf8' });
  }

  // 쿨타임 표시
  const rampRem = Math.max(0, SS.rampage.cooldown - (now - SS.rampage.lastUsed));
  const voidRem = Math.max(0, SS.voidHand.cooldown - (now - SS.voidHand.lastUsed));
  if (rampRem > 0 && !SS.rampage.active) lines.push({ text: `💥 폭주 ${Math.ceil(rampRem/1000)}초`, color: '#6b7280' });
  if (voidRem > 0)                        lines.push({ text: `🖐️ 공허 ${Math.ceil(voidRem/1000)}초`, color: '#6b7280' });

  // 에너지
  const energyRatio = SS.energy / SS.maxEnergy;
  const panelW = 190;
  const panelH = lines.length * 22 + 42;
  const px2 = vw - panelW - 14;
  const py2 = vh - panelH - 14;

  ctx.save();
  ctx.fillStyle = 'rgba(8,0,16,0.85)';
  ctx.fillRect(px2, py2, panelW, panelH);
  ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 1.5;
  ctx.strokeRect(px2, py2, panelW, panelH);

  // 에너지 바
  ctx.fillStyle = '#374151';
  ctx.fillRect(px2+10, py2+10, panelW-20, 10);
  ctx.fillStyle = energyRatio >= 1 ? '#fbbf24' : '#c026d3';
  ctx.fillRect(px2+10, py2+10, (panelW-20)*energyRatio, 10);
  ctx.strokeStyle = '#4c1d95'; ctx.lineWidth=1;
  ctx.strokeRect(px2+10, py2+10, panelW-20, 10);
  ctx.fillStyle = '#e9d5ff';
  ctx.font = "10px 'Noto Sans KR', sans-serif";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`에너지 ${SS.energy}/${SS.maxEnergy}`, px2 + panelW/2, py2+26);
  ctx.textBaseline = 'alphabetic';

  // 스킬 상태 라인
  ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
  ctx.textBaseline = 'middle';
  for (let i = 0; i < lines.length; i++) {
    const ly = py2 + 38 + i * 22;
    ctx.fillStyle = lines[i].color;
    ctx.textAlign = 'left';
    ctx.fillText(lines[i].text, px2+10, ly);
  }

  // 키 가이드 (하단)
  ctx.fillStyle = '#374151';
  ctx.font = "9px 'Noto Sans KR', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('1:폭주 2:시간왜곡 3:공허 4:동화 5:해방', px2+panelW/2, py2+panelH-4);

  ctx.restore();
}