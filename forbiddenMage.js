// forbiddenMage.js - 금서술사 (禁書術士) — 금단의 학자
// 능력: 금단의 페이지 (액티브)
// 레벨 제한: 50Lv | 쿨타임: 25초
// 5가지 효과 중 랜덤 1개 발동, 일정 확률로 2개 동시 발동

const ForbiddenSkill = {
  cooldown: 25000,
  lastUsed: 0,
  dualProcChance: 0.25, // 25% 확률로 2개 동시 발동

  // 시간 정지 상태
  timeStop: { active: false, timer: 0 },
  // 혼란 상태
  confusion: { active: false, timer: 0 },
  // 무적 + 공격력 5배
  godMode: { active: false, timer: 0 },
  // 보스 봉인
  bossSeal: { active: false, timer: 0 },

  canUse() {
    return Date.now() - this.lastUsed >= this.cooldown;
  },

  getRemainingCooldown() {
    const remaining = this.cooldown - (Date.now() - this.lastUsed);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }
};

const FORBIDDEN_EFFECTS = [
  { id: 'massKill',   name: '📖 절멸의 페이지', color: '#ff1493', desc: '맵 전체 즉사!' },
  { id: 'timeStop',   name: '📖 시간 정지',     color: '#00d4ff', desc: '5초간 시간 정지!' },
  { id: 'confusion',  name: '📖 혼란의 주문',   color: '#a78bfa', desc: '적 전체 혼란!' },
  { id: 'godMode',    name: '📖 금단의 힘',     color: '#ffd700', desc: '공격력 5배 + 무적 5초!' },
  { id: 'bossSeal',   name: '📖 봉인의 페이지', color: '#4ade80', desc: '보스 능력 봉인!' },
];

function forbiddenPage() {
  if (playerJob.current !== '금서술사') return;
  if (battleState.playerLevel < 50) return;

  if (!ForbiddenSkill.canUse()) {
    battleState.damageTexts.push({
      x: battleState.playerX, y: battleState.playerY - 60,
      text: `쿨타임 ${ForbiddenSkill.getRemainingCooldown()}초`,
      color: '#ff4444', life: 40, vy: -1.5,
    });
    return;
  }

  ForbiddenSkill.lastUsed = Date.now();

  const px = battleState.playerX;
  const py = battleState.playerY;

  // 발동 이펙트 — 마법진
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 / 40) * i;
    battleState.particles.push({
      x: px + Math.cos(angle) * 80,
      y: py + Math.sin(angle) * 80,
      vx: Math.cos(angle) * -3,
      vy: Math.sin(angle) * -3,
      life: 50,
      color: Math.random() > 0.5 ? '#a78bfa' : '#7c3aed',
      size: 4 + Math.random() * 3,
    });
  }

  // 효과 선택 — 랜덤 1개, 25% 확률로 2개
  const shuffled = [...FORBIDDEN_EFFECTS].sort(() => Math.random() - 0.5);
  const effectCount = Math.random() < ForbiddenSkill.dualProcChance ? 2 : 1;
  const selectedEffects = shuffled.slice(0, effectCount);

  if (effectCount === 2) {
    battleState.damageTexts.push({
      x: px, y: py - 80,
      text: '✨ 이중 발동! ✨',
      color: '#ffd700', life: 100, vy: -1,
    });
  }

  battleState.damageTexts.push({
    x: px, y: py - 55,
    text: '📖 금단의 페이지 📖',
    color: '#7c3aed', life: 100, vy: -2,
  });

  for (const effect of selectedEffects) {
    applyForbiddenEffect(effect);
  }

  saveBattleData();
  updateBattleHUD();
}

function applyForbiddenEffect(effect) {
  const px = battleState.playerX;
  const py = battleState.playerY;

  battleState.damageTexts.push({
    x: px + (Math.random() - 0.5) * 40,
    y: py - 35 - Math.random() * 20,
    text: effect.desc,
    color: effect.color, life: 90, vy: -1.5,
  });

  switch (effect.id) {
    case 'massKill':
      // 맵 전체 즉사
      for (let i = battleState.enemies.length - 1; i >= 0; i--) {
        const e = battleState.enemies[i];

        if (e.isBoss) {
          // 보스는 최대HP 50% 데미지
          const dmg = Math.floor(e.maxHp * 0.5);
          e.hp -= dmg;
          battleState.damageTexts.push({
            x: e.x, y: e.y - e.size,
            text: `-${dmg}`,
            color: '#ff1493', life: 70, vy: -2,
          });
          if (e.hp <= 0) {
            battleState.playerExp += 100 + battleState.stage * 10;
            battleState.playerCoins += 50;
            battleState.enemies.splice(i, 1);
          }
        } else {
          // 일반 적 즉사
          for (let k = 0; k < 15; k++) {
            battleState.particles.push({
              x: e.x, y: e.y,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 40,
              color: '#ff1493',
              size: 6,
            });
          }
          battleState.damageTexts.push({
            x: e.x, y: e.y - e.size,
            text: '절멸!',
            color: '#ff1493', life: 70, vy: -2.5,
          });
          battleState.playerExp += 20 + battleState.stage * 5;
          battleState.playerCoins += 25;
          battleState.enemies.splice(i, 1);
        }
      }
      checkForbiddenStageClear();
      break;

    case 'timeStop':
      // 시간 정지 5초 (300프레임)
      ForbiddenSkill.timeStop.active = true;
      ForbiddenSkill.timeStop.timer = 300;

      for (let i = 0; i < 20; i++) {
        battleState.particles.push({
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: 0, vy: 0,
          life: 60,
          color: '#00d4ff',
          size: 3 + Math.random() * 4,
        });
      }
      break;

    case 'confusion':
      // 적 전체 혼란 5초 — 서로 공격
      ForbiddenSkill.confusion.active = true;
      ForbiddenSkill.confusion.timer = 300;

      for (const e of battleState.enemies) {
        e.confused = true;
        e.confusionTimer = 300;

        battleState.damageTexts.push({
          x: e.x, y: e.y - e.size - 15,
          text: '💫 혼란',
          color: '#a78bfa', life: 60, vy: -1,
        });
      }
      break;

    case 'godMode':
      // 공격력 5배 + 무적 5초
      ForbiddenSkill.godMode.active = true;
      ForbiddenSkill.godMode.timer = 300;

      for (let i = 0; i < 20; i++) {
        battleState.particles.push({
          x: px, y: py,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 50,
          color: '#ffd700',
          size: 5 + Math.random() * 5,
        });
      }
      break;

    case 'bossSeal':
      // 보스 능력 일부 봉인 — 데미지 80% 감소, 속도 50% 감소, 10초
      ForbiddenSkill.bossSeal.active = true;
      ForbiddenSkill.bossSeal.timer = 600;

      for (const e of battleState.enemies) {
        if (e.isBoss) {
          e.sealed = true;
          e.sealTimer = 600;
          e.originalDmg = e.originalDmg || e.dmg;
          e.originalSpeed = e.originalSpeed || e.speed;
          e.dmg = Math.floor(e.originalDmg * 0.2);
          e.speed = e.originalSpeed * 0.5;

          battleState.damageTexts.push({
            x: e.x, y: e.y - e.size - 20,
            text: '🔒 봉인!',
            color: '#4ade80', life: 80, vy: -1.5,
          });
        }
      }
      break;
  }

  // 레벨업 체크
  let expNeeded = battleState.playerLevel * 50;
  while (battleState.playerExp >= expNeeded) {
    battleState.playerExp -= expNeeded;
    battleState.playerLevel++;
    battleState.playerMaxHp += 20;
    battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
    expNeeded = battleState.playerLevel * 50;
  }
}

function checkForbiddenStageClear() {
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

// battleLoop에서 매 프레임 호출 — 금서술사 지속 효과 업데이트
function updateForbiddenEffects() {
  if (playerJob.current !== '금서술사') return;

  // 시간 정지 처리
  if (ForbiddenSkill.timeStop.active) {
    ForbiddenSkill.timeStop.timer--;
    if (ForbiddenSkill.timeStop.timer <= 0) {
      ForbiddenSkill.timeStop.active = false;
    }
  }

  // 혼란 처리 — 적끼리 공격
  if (ForbiddenSkill.confusion.active) {
    ForbiddenSkill.confusion.timer--;
    if (ForbiddenSkill.confusion.timer <= 0) {
      ForbiddenSkill.confusion.active = false;
      for (const e of battleState.enemies) {
        e.confused = false;
      }
    } else {
      // 혼란 중: 적끼리 서로 공격
      for (const e of battleState.enemies) {
        if (e.confused && e.confusionTimer > 0) {
          e.confusionTimer--;

          // 매 90프레임마다 근처 적 공격
          if (e.confusionTimer % 90 === 0 && battleState.enemies.length > 1) {
            const others = battleState.enemies.filter(o => o !== e);
            if (others.length > 0) {
              const target = others[Math.floor(Math.random() * others.length)];
              const confDmg = Math.floor(e.dmg * 0.5);
              target.hp -= confDmg;

              battleState.damageTexts.push({
                x: target.x, y: target.y - target.size,
                text: `-${confDmg} 💫`,
                color: '#a78bfa', life: 50, vy: -2,
              });

              if (target.hp <= 0) {
                battleState.playerExp += 20 + battleState.stage * 5;
                battleState.playerCoins += 25;
                battleState.enemies = battleState.enemies.filter(en => en !== target);
                checkForbiddenStageClear();
              }
            }
          }

          if (e.confusionTimer <= 0) {
            e.confused = false;
          }
        }
      }
    }
  }

  // 무적 + 공격력 5배 처리
  if (ForbiddenSkill.godMode.active) {
    ForbiddenSkill.godMode.timer--;
    if (ForbiddenSkill.godMode.timer <= 0) {
      ForbiddenSkill.godMode.active = false;
    }
  }

  // 보스 봉인 해제
  if (ForbiddenSkill.bossSeal.active) {
    ForbiddenSkill.bossSeal.timer--;
    if (ForbiddenSkill.bossSeal.timer <= 0) {
      ForbiddenSkill.bossSeal.active = false;
      for (const e of battleState.enemies) {
        if (e.sealed) {
          e.sealed = false;
          e.dmg = e.originalDmg || e.dmg;
          e.speed = e.originalSpeed || e.speed;
        }
      }
    }
  }
}

// 금서술사 무적 체크
function isForbiddenInvincible() {
  return playerJob.current === '금서술사' && ForbiddenSkill.godMode.active;
}

// 금서술사 공격력 배율
function getForbiddenDamageMultiplier() {
  if (playerJob.current !== '금서술사') return 1;
  return ForbiddenSkill.godMode.active ? 5 : 1;
}

// 시간 정지 체크
function isTimeStopActive() {
  return playerJob.current === '금서술사' && ForbiddenSkill.timeStop.active;
}
