// bloodKnight.js - 혈검사 (血劍士) — 피의 기사
// 능력: 피의 폭주 (액티브)
// 레벨 제한: 45Lv | 쿨타임: 12초

const BloodKnightSkill = {
  cooldown: 12000,
  lastUsed: 0,
  killStacks: 0,
  bonusAttackSpeed: 0,
  bonusMoveSpeed: 0,

  canUse() {
    return Date.now() - this.lastUsed >= this.cooldown;
  },

  getRemainingCooldown() {
    const remaining = this.cooldown - (Date.now() - this.lastUsed);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  },

  resetForBattle() {
    this.killStacks = 0;
    this.bonusAttackSpeed = 0;
    this.bonusMoveSpeed = 0;
  }
};

function bloodRampage() {
  if (playerJob.current !== '혈검사') return;
  if (battleState.playerLevel < 45) return;

  if (!BloodKnightSkill.canUse()) {
    battleState.damageTexts.push({
      x: battleState.playerX, y: battleState.playerY - 60,
      text: `쿨타임 ${BloodKnightSkill.getRemainingCooldown()}초`,
      color: '#ff4444', life: 40, vy: -1.5,
    });
    return;
  }

  const hpCost = Math.floor(battleState.playerHp * 0.3);
  if (battleState.playerHp <= hpCost + 1) {
    battleState.damageTexts.push({
      x: battleState.playerX, y: battleState.playerY - 60,
      text: 'HP 부족!',
      color: '#ff4444', life: 40, vy: -1.5,
    });
    return;
  }

  BloodKnightSkill.lastUsed = Date.now();
  battleState.playerHp -= hpCost;

  // 소모 HP 비례 공격력 배율 (최대 3배 이상)
  const hpRatio = hpCost / battleState.playerMaxHp;
  const damageMultiplier = 1.5 + (hpRatio * 8);

  const px = battleState.playerX;
  const py = battleState.playerY;

  battleState.damageTexts.push({
    x: px, y: py - 50,
    text: `🩸 피의 폭주 (x${damageMultiplier.toFixed(1)}) 🩸`,
    color: '#dc143c', life: 100, vy: -2,
  });

  battleState.damageTexts.push({
    x: px, y: py - 30,
    text: `-${hpCost} HP`,
    color: '#8b0000', life: 60, vy: -1,
  });

  for (let i = 0; i < 25; i++) {
    battleState.particles.push({
      x: px, y: py,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 16,
      life: 50,
      color: Math.random() > 0.3 ? '#dc143c' : '#8b0000',
      size: 5 + Math.random() * 5,
    });
  }

  const baseDmg = 30 + battleState.playerLevel * 3;
  const finalDmg = Math.floor(baseDmg * damageMultiplier);

  for (let i = battleState.enemies.length - 1; i >= 0; i--) {
    const e = battleState.enemies[i];
    e.hp -= finalDmg;

    battleState.damageTexts.push({
      x: e.x, y: e.y - e.size,
      text: `-${finalDmg}`,
      color: '#dc143c', life: 70, vy: -2.5,
    });

    for (let k = 0; k < 8; k++) {
      battleState.particles.push({
        x: e.x, y: e.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 35,
        color: '#dc143c',
        size: 4,
      });
    }

    if (e.hp <= 0) {
      BloodKnightSkill.killStacks++;

      // HP 회복 (처치당 최대HP의 10%)
      const healAmount = Math.floor(battleState.playerMaxHp * 0.10);
      battleState.playerHp = Math.min(battleState.playerHp + healAmount, battleState.playerMaxHp);

      battleState.damageTexts.push({
        x: px, y: py - 20,
        text: `+${healAmount} HP 흡혈`,
        color: '#4ade80', life: 50, vy: -1.5,
      });

      // 영구 누적 — 공격속도 / 이동속도 증가
      BloodKnightSkill.bonusAttackSpeed += 2;
      BloodKnightSkill.bonusMoveSpeed += 0.5;

      if (BloodKnightSkill.killStacks % 3 === 0) {
        battleState.damageTexts.push({
          x: px, y: py - 70,
          text: `⚔️ 폭주 ${BloodKnightSkill.killStacks}스택!`,
          color: '#ff6347', life: 80, vy: -1,
        });
      }

      for (let k = 0; k < 20; k++) {
        battleState.particles.push({
          x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          life: 45,
          color: Math.random() > 0.5 ? '#dc143c' : '#ffd700',
          size: 7,
        });
      }

      const expGain = 20 + battleState.stage * 5;
      battleState.playerExp += expGain;
      battleState.playerCoins += 25;
      battleState.enemies.splice(i, 1);
    }
  }

  let expNeeded = battleState.playerLevel * 50;
  while (battleState.playerExp >= expNeeded) {
    battleState.playerExp -= expNeeded;
    battleState.playerLevel++;
    battleState.playerMaxHp += 20;
    battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
    expNeeded = battleState.playerLevel * 50;
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

  saveBattleData();
  updateBattleHUD();
}

function getBloodKnightMoveSpeed() {
  if (playerJob.current !== '혈검사') return 0;
  return BloodKnightSkill.bonusMoveSpeed;
}

function getBloodKnightAttackBonus() {
  if (playerJob.current !== '혈검사') return 0;
  return BloodKnightSkill.bonusAttackSpeed;
}
