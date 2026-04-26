// fanatic.js - 광신도 (狂信徒) — 대사제
// 능력: 균의 심판 (액티브)
// 레벨 제한: 50Lv | 쿨타임: 45초

const FanaticSkill = {
  cooldown: 45000,
  lastUsed: 0,

  canUse() {
    return Date.now() - this.lastUsed >= this.cooldown;
  },

  getRemainingCooldown() {
    const remaining = this.cooldown - (Date.now() - this.lastUsed);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }
};

function fanaticJudgement() {
  if (playerJob.current !== '광신도') return;
  if (battleState.playerLevel < 50) return;

  if (!FanaticSkill.canUse()) {
    battleState.damageTexts.push({
      x: battleState.playerX, y: battleState.playerY - 60,
      text: `쿨타임 ${FanaticSkill.getRemainingCooldown()}초`,
      color: '#ff4444', life: 40, vy: -1.5,
    });
    return;
  }

  FanaticSkill.lastUsed = Date.now();

  const px = battleState.playerX;
  const py = battleState.playerY;

  // 스킬 발동 이펙트
  battleState.damageTexts.push({
    x: px, y: py - 50,
    text: '⚡ 균의 심판 ⚡',
    color: '#ffd700', life: 120, vy: -2,
  });

  // 화면 전체 이펙트
  for (let i = 0; i < 30; i++) {
    battleState.particles.push({
      x: px, y: py,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      life: 60,
      color: Math.random() > 0.5 ? '#ffd700' : '#ff8c00',
      size: 6 + Math.random() * 6,
    });
  }

  const deadPositions = []; // 연쇄 즉사용

  for (let i = battleState.enemies.length - 1; i >= 0; i--) {
    const e = battleState.enemies[i];

    if (e.isBoss) {
      // 👑 보스: 최대 HP 25% 강제 삭제 + 출혈
      const damage = Math.floor(e.maxHp * 0.25);
      e.hp -= damage;

      battleState.damageTexts.push({
        x: e.x, y: e.y - e.size,
        text: `-${damage} (25%)`,
        color: '#ff1493', life: 80, vy: -2.5,
      });

      // 출혈 상태 적용
      if (!e.bleed) {
        e.bleed = { timer: 300, tickTimer: 0, damagePerTick: Math.floor(e.maxHp * 0.02) };
      }

      // 출혈 이펙트
      for (let k = 0; k < 10; k++) {
        battleState.particles.push({
          x: e.x + (Math.random() - 0.5) * 40,
          y: e.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 40,
          color: '#cc0000',
          size: 3 + Math.random() * 3,
        });
      }

      if (e.hp <= 0) {
        deadPositions.push({ x: e.x, y: e.y });
        const expGain = 100 + battleState.stage * 10;
        battleState.playerExp += expGain;
        battleState.playerCoins += 50;
        battleState.enemies.splice(i, 1);
      }
    } else {
      // 일반 적: 즉시 소멸 (면역 무시)
      deadPositions.push({ x: e.x, y: e.y });

      battleState.damageTexts.push({
        x: e.x, y: e.y - e.size,
        text: '즉사!',
        color: '#ffd700', life: 80, vy: -3,
      });

      // 소멸 이펙트
      for (let k = 0; k < 20; k++) {
        battleState.particles.push({
          x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          life: 50,
          color: '#ffd700',
          size: 8,
        });
      }

      const expGain = 20 + battleState.stage * 5;
      battleState.playerExp += expGain;
      battleState.playerCoins += 25;
      battleState.enemies.splice(i, 1);
    }
  }

  // 💀 연쇄 즉사 전염 — 처치된 적 주변 150px 내 적도 즉사
  if (deadPositions.length > 0) {
    let chainKilled = true;
    while (chainKilled) {
      chainKilled = false;
      for (let i = battleState.enemies.length - 1; i >= 0; i--) {
        const e = battleState.enemies[i];
        if (e.isBoss) continue;

        for (const pos of deadPositions) {
          const dist = Math.hypot(e.x - pos.x, e.y - pos.y);
          if (dist <= 150) {
            deadPositions.push({ x: e.x, y: e.y });

            battleState.damageTexts.push({
              x: e.x, y: e.y - e.size,
              text: '연쇄 즉사!',
              color: '#ff8c00', life: 70, vy: -2.5,
            });

            for (let k = 0; k < 15; k++) {
              battleState.particles.push({
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 40,
                color: '#ff8c00',
                size: 6,
              });
            }

            battleState.playerExp += 20 + battleState.stage * 5;
            battleState.playerCoins += 25;
            battleState.enemies.splice(i, 1);
            chainKilled = true;
            break;
          }
        }
      }
    }
  }

  // 레벨업 체크
  const expNeeded = battleState.playerLevel * 50;
  while (battleState.playerExp >= expNeeded) {
    battleState.playerExp -= battleState.playerLevel * 50;
    battleState.playerLevel++;
    battleState.playerMaxHp += 20;
    battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
  }

  // 스테이지 클리어 체크
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

// 보스 출혈 틱 처리 (battleLoop에서 호출)
function updateBleedEffects() {
  for (const e of battleState.enemies) {
    if (e.bleed) {
      e.bleed.timer--;
      e.bleed.tickTimer++;

      // 매 60프레임(~1초)마다 출혈 데미지
      if (e.bleed.tickTimer >= 60) {
        e.bleed.tickTimer = 0;
        e.hp -= e.bleed.damagePerTick;

        battleState.damageTexts.push({
          x: e.x, y: e.y - e.size - 10,
          text: `-${e.bleed.damagePerTick} 🩸`,
          color: '#cc0000', life: 50, vy: -1.5,
        });

        // 출혈 파티클
        for (let i = 0; i < 3; i++) {
          battleState.particles.push({
            x: e.x + (Math.random() - 0.5) * 20,
            y: e.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            life: 25,
            color: '#cc0000',
            size: 3,
          });
        }

        if (e.hp <= 0) {
          e.hp = 0;
        }
      }

      if (e.bleed.timer <= 0) {
        delete e.bleed;
      }
    }
  }
}
