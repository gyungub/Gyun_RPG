let skillState = {
  lastFireballTime: 0,
  lastInstakillTime: 0,
  lastLightningTime: 0,
  lastSwordWaveTime: 0,        // ← 여기 추가!
  fireballCooldown: 1000,
  instakillCooldown: 30000,
  lightningCooldown: 2000,
  // swordWaveCooldown은 함수 안에서 직접 관리하고 있습니다.
};

// ========== 직업 레벨 요구사항 ==========
const JOB_LEVEL_REQUIREMENT = {
  '마법사': 10,
  '전사': 10,
  '균 숭배자': 20,
  '마검사': 30,
  '혈검사': 45,
  '광신도': 50,
  '금서술사': 50,
};

// ========== 직업 활성화 확인 ==========
function hasJobUnlocked(jobName) {
  return playerJob.current === jobName && battleState.playerLevel >= JOB_LEVEL_REQUIREMENT[jobName];
}

function canUseSkill() {
  return playerJob.current !== 'none' && playerJob.current !== undefined;
}

JOB_LEVEL_REQUIREMENT['超越體'] = 100;

function castSubjugation() {
  if (playerJob.current !== '超越體') return;
  if (typeof triggerSubjugation !== 'function') return;
  triggerSubjugation();
}

// ========== 마법사 - 파이어볼 ==========
function castFireball() {
  if (playerJob.current !== '마법사' && playerJob.current !== '마검사') return;
  
  const now = Date.now();
  const fireballCD = skillState.fireballCooldown
    * (typeof getUpgradeCooldownRatio  === 'function' ? getUpgradeCooldownRatio()  : 1)
    * (typeof getSkillCooldownMultiplier === 'function' ? getSkillCooldownMultiplier() : 1);
  if (now - skillState.lastFireballTime < fireballCD) return;
  
  skillState.lastFireballTime = now;

  const px = battleState.playerX + 30;
  const py = battleState.playerY;

  // 가장 가까운 적을 향해 발사
  if (battleState.enemies.length > 0) {
    const closest = battleState.enemies.reduce((a, b) =>
      Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b
    );

    battleState.particles.push({
      x: px, y: py,
      vx: (closest.x - px) / 20,
      vy: (closest.y - py) / 20,
      life: 120,
      color: '#ff6b35',
      size: 10,
      type: 'fireball',
      targetX: closest.x,
      targetY: closest.y,
      damage: playerJob.current === '마검사' ? 25 : 20,
    });

    // 데미지 텍스트
    battleState.damageTexts.push({
      x: px, y: py - 40,
      text: '파이어볼!',
      color: '#ff8800',
      life: 60,
      vy: -2,
    });
  }
}

// ========== 마검사 라이트닝 (50렙 이상) ==========
function castLightning() {
  if (playerJob.current !== '마검사') return;
  if (battleState.playerLevel < 50) return;

  const now = Date.now();
  const lightningCD = skillState.lightningCooldown
    * (typeof getUpgradeCooldownRatio  === 'function' ? getUpgradeCooldownRatio()  : 1)
    * (typeof getSkillCooldownMultiplier === 'function' ? getSkillCooldownMultiplier() : 1);
  if (now - skillState.lastLightningTime < lightningCD) return;

  skillState.lastLightningTime = now;

  const px = battleState.playerX + 30;
  const py = battleState.playerY;

  if (battleState.enemies.length > 0) {
    const closest = battleState.enemies.reduce((a, b) =>
      Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b
    );

    // 번개 파티클
    for (let i = 0; i < 5; i++) {
      battleState.particles.push({
        x: px + Math.random() * 20 - 10,
        y: py + Math.random() * 20 - 10,
        vx: (closest.x - px) / 15 + (Math.random() - 0.5) * 2,
        vy: (closest.y - py) / 15 + (Math.random() - 0.5) * 2,
        life: 100,
        color: '#ffee33',
        size: 8,
        type: 'lightning',
        targetX: closest.x,
        targetY: closest.y,
        damage: 35,
      });
    }

    battleState.damageTexts.push({
      x: px, y: py - 40,
      text: '번개!',
      color: '#ffee33',
      life: 60,
      vy: -2,
    });
  }
}

// ========== 전사 - 칼 휘두르기 ==========
function swordSlash() {
  if (playerJob.current !== '전사') return;

  const px = battleState.playerX;
  const py = battleState.playerY;

  // 근처 적 모두에게 피해
  for (const e of battleState.enemies) {
    const dist = Math.hypot(e.x - px, e.y - py);
    if (dist < 150) {
      const dmg = Math.floor(30 + Math.random() * 15);
      e.hp -= dmg;

      battleState.damageTexts.push({
        x: e.x, y: e.y - e.size,
        text: `-${dmg}`,
        color: '#ff6b6b',
        life: 60,
        vy: -2,
      });

      for (let i = 0; i < 4; i++) {
        battleState.particles.push({
          x: e.x, y: e.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 30,
          color: '#ff6b6b',
          size: 5,
        });
      }

      if (e.hp <= 0) {
        const expGain = 15 + battleState.stage * 3;
        battleState.playerExp += expGain;
        battleState.playerCoins += 15;

        const expNeeded = battleState.playerLevel * 50;
        if (battleState.playerExp >= expNeeded) {
          battleState.playerExp -= expNeeded;
          battleState.playerLevel++;
          battleState.playerMaxHp += 20;
          battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
        }

        battleState.enemies = battleState.enemies.filter(en => en !== e);
      }
    }
  }

  saveBattleData();
  updateBattleHUD();
}

function instantKill() {
  if (playerJob.current !== '균 숭배자') return;

  const now = Date.now();
  if (now - skillState.lastInstakillTime < skillState.instakillCooldown) return;

  skillState.lastInstakillTime = now;

  const px = battleState.playerX;
  const py = battleState.playerY;

  // 모든 적에게 광역 데미지
  for (const e of battleState.enemies) {
    e.hp = 0;

    for (let i = 0; i < 20; i++) {
      battleState.particles.push({
        x: e.x, y: e.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 50,
        color: '#ffd700',
        size: 8,
      });
    }

    battleState.damageTexts.push({
      x: e.x, y: e.y - e.size,
      text: '즉사!',
      color: '#ffd700',
      life: 80,
      vy: -3,
    });

    const expGain = 20 + battleState.stage * 5;
    battleState.playerExp += expGain;
    battleState.playerCoins += 25;
  }

  battleState.enemies = [];

  const expNeeded = battleState.playerLevel * 50;
  if (battleState.playerExp >= expNeeded) {
    battleState.playerExp -= expNeeded;
    battleState.playerLevel++;
    battleState.playerMaxHp += 20;
    battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
  }

  battleState.damageTexts.push({
    x: battleState.playerX, y: battleState.playerY - 40,
    text: '균의 심판!',
    color: '#ffd700',
    life: 100,
    vy: -2,
  });

  // 스테이지 클리어 처리 추가 ← 이 부분 추가
  if (battleState.stage >= 10) {
    battleState.allClear = true;
    battleState.active = false;
  } else {
    battleState.stageClear = true;
    battleState.active = false;
  }

  saveBattleData();
  updateBattleHUD();
}

// ========== 마검사 - 칼 근접 추가 대미지 ==========
function getMagiSwordDamage(baseDamage) {
  if (playerJob.current === '마검사') {
    return baseDamage + 10; // 기본 공격에 +10 데미지
  }
  return baseDamage;
}

// ========== 파이어볼 & 라이트닝 & 검기 충돌 처리 ==========
function updateSkillProjectiles() {
  for (let i = battleState.particles.length - 1; i >= 0; i--) {
    const p = battleState.particles[i];

    // 파이어볼과 라이트닝 처리
    if (p.type === 'fireball' || p.type === 'lightning') {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // 적과 충돌
      for (let j = battleState.enemies.length - 1; j >= 0; j--) {
        const e = battleState.enemies[j];
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist < 30) {
          const dmg = calcFinalSkillDamage(p.damage || 20);
          e.hp -= dmg;

          battleState.damageTexts.push({
            x: e.x, y: e.y - e.size,
            text: `-${dmg}`,
            color: p.type === 'lightning' ? '#ffee33' : '#ff8800',
            life: 60,
            vy: -2,
          });

          // 충돌 파티클
          for (let k = 0; k < 8; k++) {
            battleState.particles.push({
              x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 30,
              color: p.color,
              size: 4,
            });
          }

          p.life = 0;

          if (e.hp <= 0) {
            const expGain = 15 + battleState.stage * 3;
            battleState.playerExp += expGain;
            battleState.playerCoins += 15;

            const expNeeded = battleState.playerLevel * 50;
            if (battleState.playerExp >= expNeeded) {
              battleState.playerExp -= expNeeded;
              battleState.playerLevel++;
              battleState.playerMaxHp += 20;
              battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
            }

            battleState.enemies.splice(j, 1);
            checkStageClear();   // ← 스테이지 클리어 체크
          }
          break;
        }
      }
    }

    // 검기 (swordWave) 처리
    else if (p.type === 'swordWave') {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      for (let j = battleState.enemies.length - 1; j >= 0; j--) {
        const e = battleState.enemies[j];
        const dist = Math.hypot(e.x - p.x, e.y - p.y);

        if (dist < 35) {
          const dmg = calcFinalSkillDamage(p.damage || 22);
          e.hp -= dmg;

          battleState.damageTexts.push({
            x: e.x, 
            y: e.y - e.size,
            text: `-${dmg}`,
            color: p.color,
            life: 55,
            vy: -2,
          });

          for (let k = 0; k < 10; k++) {
            battleState.particles.push({
              x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              life: 28,
              color: p.color,
              size: 4,
            });
          }

          p.life = 0;

          if (e.hp <= 0) {
            const expGain = 15 + battleState.stage * 3;
            battleState.playerExp += expGain;
            battleState.playerCoins += 15;

            const expNeeded = battleState.playerLevel * 50;
            if (battleState.playerExp >= expNeeded) {
              battleState.playerExp -= expNeeded;
              battleState.playerLevel++;
              battleState.playerMaxHp += 20;
              battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
            }

            battleState.enemies.splice(j, 1);
            checkStageClear();   // ← 스테이지 클리어 체크
          }
          break;
        }
      }
    }
  }

  saveBattleData();
  updateBattleHUD();
}

// ========== 스테이지 클리어 체크 함수 (새로 추가) ==========
function checkStageClear() {
  if (battleState.enemies.length === 0) {
    saveBattleData();

    if (battleState.stage >= 10) {
      battleState.allClear = true;
      battleState.active = false;
    } else {
      battleState.stageClear = true;
      battleState.active = false;
    }
    updateBattleHUD();
  }
}

// ========== 검사 & 마검사 - 검기 발사 (F 키) ==========
function castSwordWave() {
  if (playerJob.current !== '검사' && playerJob.current !== '마검사') return;

  // ==================== 여기서 수정 가능 ====================
  const cooldown = 5000;        // 쿨타임 (밀리초) ← 여기 수정 (현재 0.8초)
  const inspectorDamage = 40;  // 검사 데미지
  const magiDamage = 70;       // 마검사 데미지 (더 강하게)
  // =========================================================

  const now = Date.now();
  const adjustedCooldown = cooldown
    * (typeof getUpgradeCooldownRatio  === 'function' ? getUpgradeCooldownRatio()  : 1)
    * (typeof getSkillCooldownMultiplier === 'function' ? getSkillCooldownMultiplier() : 1);
  if (now - (skillState.lastSwordWaveTime || 0) < adjustedCooldown) return;

  skillState.lastSwordWaveTime = now;   // ← 이 줄도 꼭 필요!

  const px = battleState.playerX + 30;
  const py = battleState.playerY;

  if (battleState.enemies.length === 0) return;

  const closest = battleState.enemies.reduce((a, b) =>
    Math.hypot(a.x - px, a.y - py) < Math.hypot(b.x - px, b.y - py) ? a : b
  );

  const isMagi = playerJob.current === '마검사';
  const damage = isMagi ? magiDamage : inspectorDamage;

  // 검기 파티클 생성
  for (let i = 0; i < (isMagi ? 5 : 3); i++) {
    battleState.particles.push({
      x: px,
      y: py + (i - 1) * 8,
      vx: (closest.x - px) / 11 + (Math.random() - 0.5) * (isMagi ? 1.8 : 1),
      vy: (closest.y - py) / 11 + (Math.random() - 0.5) * 1.5,
      life: isMagi ? 95 : 75,
      color: isMagi ? '#ff69b4' : '#ffdd44',
      size: isMagi ? 9 : 7,
      type: 'swordWave',
      damage: damage,                    // 여기서 데미지 적용
    });
  }

  // 스킬 이름 표시
  battleState.damageTexts.push({
    x: px + 25,
    y: py - 35,
    text: isMagi ? '마검기!' : '검기!',
    color: isMagi ? '#ff69b4' : '#ffdd44',
    life: 55,
    vy: -2.5,
  });
}
