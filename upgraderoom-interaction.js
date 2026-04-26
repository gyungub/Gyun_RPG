// upgraderoom-interaction.js
// 업그레이드 제실 헌납 효과를 실제 게임 시스템에 연결

// ===== 업그레이드 수치 로드 (항상 최신값) =====
function getUpgrades() {
  return JSON.parse(localStorage.getItem('gyun_upgrades') || '{}');
}

// ===== 1. 공격력 보너스 =====
// battle.js playerAttack()의 baseDmg에 더해줌
function getUpgradeAtkBonus() {
  return (getUpgrades().atk || 0) * 8;
}

// ===== 2. 이동속도 보너스 =====
// battle.js 이동 처리에서 기본 15에 더해줌
function getUpgradeMoveSpeed() {
  return (getUpgrades().speed || 0) * 1.5;
}

// ===== 3. 쿨타임 비율 =====
// 스킬 쿨타임에 곱해줌 (0.5 ~ 1.0)
function getUpgradeCooldownRatio() {
  return Math.max(0.5, 1 - (getUpgrades().cooldown || 0) * 0.08);
}

// ===== 4. 변이 강화 상태 =====
function getUpgradeMutation() {
  const s = getUpgrades();
  return {
    explode: !!s.explode,
    counter: !!s.counter,
    vampire: !!s.vampire,
  };
}

// ===== 5. 폭발 반응 처리 =====
// battle.js에서 적에게 데미지 줄 때 호출
// 20% 확률로 주변 적에게 추가 폭발 데미지
function tryExplodeOnHit(hitEnemy) {
  if (!getUpgradeMutation().explode) return;
  if (Math.random() > 0.2) return;

  const explodeDmg = 25 + battleState.playerLevel * 2;
  const explodeRange = 120;

  battleState.damageTexts.push({
    x: hitEnemy.x, y: hitEnemy.y - hitEnemy.size - 20,
    text: `💥 폭발! -${explodeDmg}`,
    color: '#fb923c', life: 70, vy: -2.5,
  });

  for (let i = battleState.enemies.length - 1; i >= 0; i--) {
    const e = battleState.enemies[i];
    const dist = Math.hypot(e.x - hitEnemy.x, e.y - hitEnemy.y);
    if (dist > explodeRange) continue;

    e.hp -= explodeDmg;

    // 폭발 파티클
    for (let k = 0; k < 6; k++) {
      battleState.particles.push({
        x: e.x, y: e.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30, color: '#fb923c', size: 5,
      });
    }

    if (e.hp <= 0) {
      battleState.playerExp  += calcFinalExpGain(15 + battleState.stage * 3);
      battleState.playerCoins += 15;
      battleState.enemies.splice(i, 1);
      if (typeof checkStageClear === 'function') checkStageClear();
    }
  }
}

// ===== 6. 피격 반격 처리 =====
// battle.js에서 플레이어가 피격당할 때 호출
// 30% 확률로 가장 가까운 적에게 즉각 반격
function tryCounterOnHit() {
  const mutation = getUpgradeMutation();
  if (!mutation.counter) return;
  if (Math.random() > 0.3) return;

  if (!battleState.enemies.length) return;

  const px = battleState.playerX, py = battleState.playerY;
  const closest = battleState.enemies.reduce((a, b) =>
    Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b
  );

  const counterDmg = Math.floor((20 + battleState.playerLevel * 3) * getReadingRoomAtkMultiplier());
  closest.hp -= counterDmg;

  battleState.damageTexts.push({
    x: closest.x, y: closest.y - closest.size,
    text: `⚔️ 반격! -${counterDmg}`,
    color: '#f43f5e', life: 70, vy: -2.5,
  });

  for (let k = 0; k < 8; k++) {
    battleState.particles.push({
      x: closest.x, y: closest.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30, color: '#f43f5e', size: 5,
    });
  }

  if (closest.hp <= 0) {
    battleState.playerExp   += calcFinalExpGain(15 + battleState.stage * 3);
    battleState.playerCoins += 15;
    battleState.enemies = battleState.enemies.filter(e => e !== closest);
    if (typeof checkStageClear === 'function') checkStageClear();
  }

  if (typeof saveBattleData  === 'function') saveBattleData();
  if (typeof updateBattleHUD === 'function') updateBattleHUD();
}

// ===== 7. 흡혈 반응 처리 =====
// battle.js에서 적 처치 시 호출
function tryVampireOnKill() {
  if (!getUpgradeMutation().vampire) return;

  const healAmount = Math.floor(battleState.playerMaxHp * 0.03);
  battleState.playerHp = Math.min(
    battleState.playerHp + healAmount,
    battleState.playerMaxHp
  );

  battleState.damageTexts.push({
    x: battleState.playerX, y: battleState.playerY - 40,
    text: `🩸 흡혈 +${healAmount}`,
    color: '#dc143c', life: 60, vy: -1.5,
  });

  if (typeof updateBattleHUD === 'function') updateBattleHUD();
}

// ===== 8. 피격 데미지에 폭발 패널티 적용 =====
// 폭발 변이 해금 시 받는 피해 +10%
function getUpgradeIncomingMultiplier() {
  if (getUpgradeMutation().explode) return 1.1;
  return 1.0;
}

// ===== 9. 이동속도에 반격 패널티 적용 =====
// 반격 변이 해금 시 이동속도 -10%
function getUpgradeFinalMoveSpeed() {
  let base = 15 + getUpgradeMoveSpeed();
  if (getUpgradeMutation().counter) base *= 0.9;

  // 혈검사 보너스도 포함
  if (typeof getBloodKnightMoveSpeed === 'function') {
    base += getBloodKnightMoveSpeed();
  }
  // 변이(심부) 보너스도 포함
  if (typeof getMutationBattleMoveBonus === 'function') {
    base += getMutationBattleMoveBonus();
  }
  if (typeof getMutationMoveMultiplier === 'function') {
    base *= getMutationMoveMultiplier();
  }
  return Math.max(5, Math.floor(base));
}

// ===== 10. 업그레이드 HUD (전투 화면 우하단) =====
function drawUpgradeStatusHUD(ctx, vw, vh) {
  const s = getUpgrades();
  const mutation = getUpgradeMutation();

  // 활성 변이만 표시
  const activeLines = [];
  if (mutation.explode) activeLines.push({ icon: '💥', text: '폭발 반응', color: '#fb923c' });
  if (mutation.counter) activeLines.push({ icon: '⚔️', text: '피격 반격', color: '#f43f5e' });
  if (mutation.vampire) activeLines.push({ icon: '🩸', text: '흡혈 반응', color: '#dc143c' });

  // 수치 강화
  if (s.atk > 0)      activeLines.push({ icon: '⚔️', text: `공격력 +${s.atk * 8}`, color: '#ef4444' });
  if (s.hp > 0)       activeLines.push({ icon: '❤️', text: `체력 +${s.hp * 30}`,   color: '#f87171' });
  if (s.cooldown > 0) activeLines.push({ icon: '⚡', text: `쿨타임 -${Math.round(s.cooldown * 8)}%`, color: '#a78bfa' });
  if (s.speed > 0)    activeLines.push({ icon: '💨', text: `이동속도 +${(s.speed * 1.5).toFixed(1)}`, color: '#38bdf8' });

  if (activeLines.length === 0) return;

  const panelW = 180, lineH = 22;
  const panelH = activeLines.length * lineH + 14;
  const px2 = 14, py2 = vh - panelH - 100;

  ctx.save();
  ctx.fillStyle = 'rgba(8,0,16,0.82)';
  ctx.fillRect(px2, py2, panelW, panelH);
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
  ctx.strokeRect(px2, py2, panelW, panelH);

  ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
  ctx.textBaseline = 'middle';

  for (let i = 0; i < activeLines.length; i++) {
    const line = activeLines[i];
    const ly = py2 + 10 + i * lineH;
    ctx.fillStyle = line.color;
    ctx.textAlign = 'left';
    ctx.fillText(`${line.icon} ${line.text}`, px2 + 10, ly);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}