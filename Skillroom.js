// skillroom.js - 금단의 스킬실

class SkillRoom extends GameMap {
  constructor() {
    super();
    this.mapId = 'skillroom';
    this.width = 2000;
    this.height = 1800;

    this.distortionPhase = 0;
    this.floatingTexts = [];
    this.showUI = false;

    // ===== 에너지 시스템 =====
    this.energy = this._loadEnergy();
    this.maxEnergy = 100;
    this.energyRegenTimer = 0;

    // ===== 스킬 목록 (고정 배열; 클릭 좌표 저장을 위해 캐싱) =====
    this.skills = this._createSkills();

    // ===== 금단 스킬 상태 =====
    this.skillStates = this._loadSkillStates();

    this.initSkillRoom();
  }

  _loadEnergy() {
    return parseInt(localStorage.getItem('gyun_skill_energy') || '100');
  }

  _loadSkillStates() {
    const saved = JSON.parse(localStorage.getItem('gyun_skill_states') || '{}');
    return {
      // 균의 폭주
      rampage:     { unlocked: saved.rampage?.unlocked     || false, lastUsed: 0, active: false, timer: 0, invincTimer: 0 },
      // 시간 왜곡
      timeWarp:    { unlocked: saved.timeWarp?.unlocked    || false, usedThisBattle: false },
      // 공허의 손
      voidHand:    { unlocked: saved.voidHand?.unlocked    || false, lastUsed: 0 },
      // 균 동화
      gyunSync:    { unlocked: saved.gyunSync?.unlocked    || false, active: false, healedSoFar: 0 },
      // 자아 해방
      liberation:  { unlocked: saved.liberation?.unlocked  || false, active: false, timer: 0 },
    };
  }

  saveSkillStates() {
    const toSave = {};
    for (const [k, v] of Object.entries(this.skillStates)) {
      toSave[k] = { unlocked: v.unlocked };
    }
    localStorage.setItem('gyun_skill_states', JSON.stringify(toSave));
    localStorage.setItem('gyun_skill_energy', String(this.energy));
  }

  // ===== 스킬 목록 =====
  _createSkills() {
    return [
      {
        id: 'rampage',
        name: '균의 폭주',
        icon: '💥',
        desc: '공격력 2배 (5초). 종료 시 2초 무적.',
        condition: '쿨타임 20초',
        cooldown: 20000,
        color: '#ef4444',
        costCoins: 300,
        unlockDesc: '코인 300개로 해금',
      },
      {
        id: 'timeWarp',
        name: '시간 왜곡',
        icon: '⏱️',
        desc: '모든 스킬 쿨타임 즉시 초기화.',
        condition: '전투당 1회',
        cooldown: 0,
        color: '#38bdf8',
        costCoins: 500,
        unlockDesc: '코인 500개로 해금',
      },
      {
        id: 'voidHand',
        name: '공허의 손',
        icon: '🖐️',
        desc: '화면 내 모든 적에게 강력한 피해.',
        condition: '적 5마리 이상일 때만 사용 가능. 쿨타임 30초.',
        cooldown: 30000,
        color: '#a78bfa',
        costCoins: 400,
        unlockDesc: '코인 400개로 해금',
      },
      {
        id: 'gyunSync',
        name: '균 동화',
        icon: '🩸',
        desc: '공격 시 HP 흡수. 최대HP 30%까지만 회복.',
        condition: '전투 중 토글. 흡수 한도 초과 시 자동 해제.',
        cooldown: 0,
        color: '#4ade80',
        costCoins: 350,
        unlockDesc: '코인 350개로 해금',
      },
      {
        id: 'liberation',
        name: '자아 해방',
        icon: '✨',
        desc: '10초간 모든 스킬 강화. 종료 후 에너지 0.',
        condition: '에너지 100% 필요.',
        cooldown: 0,
        color: '#fbbf24',
        costCoins: 600,
        unlockDesc: '코인 600개로 해금',
      },
    ];
  }

  initSkillRoom() {
    this.paths = [
      { x: 850,  y: 50,   w: 300,  h: 200 },
      { x: 200,  y: 200,  w: 1600, h: 1400 },
    ];

    this.zones = [
      {
        id: 'skill-return',
        label: '🔙 교단 본부로',
        x: 875, y: 60, w: 250, h: 80,
        color: '#334155', lc: '#1e293b'
      },
    ];

    this.npcs = [
      {
        id: 'skill-master',
        label: '✨ 스킬 관리자',
        x: 940, y: 380, w: 65, h: 65,
        color: '#581c87'
      },
    ];

    // 스킬 오브젝트 (장식용 구체)
    this.orbs = [];
    const orbColors = ['#ef4444','#38bdf8','#a78bfa','#4ade80','#fbbf24'];
    const orbPositions = [
      {x:400, y:500}, {x:700, y:700}, {x:1000, y:600},
      {x:1300, y:700}, {x:1600, y:500},
    ];
    for (let i = 0; i < 5; i++) {
      this.orbs.push({
        x: orbPositions[i].x, y: orbPositions[i].y,
        r: 28, phase: i * 1.2,
        color: orbColors[i],
        skillId: this.skills[i].id,
      });
    }

    // 바닥 문양
    this.floorRunes = [
      { x: 500,  y: 900  },
      { x: 1000, y: 1100 },
      { x: 1500, y: 900  },
    ];
  }

  // ===== 전투 시작 시 초기화 =====
  resetForBattle() {
    this.skillStates.timeWarp.usedThisBattle = false;
    this.skillStates.gyunSync.active = false;
    this.skillStates.gyunSync.healedSoFar = 0;
    this.skillStates.liberation.active = false;
    this.skillStates.liberation.timer = 0;
    this.skillStates.rampage.active = false;
    this.skillStates.rampage.timer = 0;
    this.skillStates.rampage.invincTimer = 0;
  }

  // ===== 에너지 자동 회복 =====
  updateEnergy() {
    if (this.energy >= this.maxEnergy) return;
    this.energyRegenTimer++;
    if (this.energyRegenTimer >= 120) { // 2초마다 +5
      this.energyRegenTimer = 0;
      this.energy = Math.min(this.maxEnergy, this.energy + 5);
      this.saveSkillStates();
    }
  }

  // ===== 스킬 사용 =====
  useSkill(skillId) {
    const state = this.skillStates[skillId];
    if (!state || !state.unlocked) {
      this._addFloatingText('스킬이 해금되지 않았다.', '#9ca3af');
      return false;
    }

    const skill = this.skills.find(s => s.id === skillId);
    const now = Date.now();

    switch (skillId) {

      case 'rampage': {
        const cd = skill.cooldown;
        if (now - state.lastUsed < cd) {
          const rem = Math.ceil((cd - (now - state.lastUsed)) / 1000);
          this._addFloatingText(`쿨타임 ${rem}초`, '#9ca3af');
          return false;
        }
        state.lastUsed = now;
        state.active = true;
        state.timer = 300; // 5초 (60fps 기준)
        state.invincTimer = 0;
        this._addFloatingText('💥 균의 폭주!', '#ef4444');
        return true;
      }

      case 'timeWarp': {
        if (state.usedThisBattle) {
          this._addFloatingText('이번 전투에서 이미 사용했다.', '#9ca3af');
          return false;
        }
        state.usedThisBattle = true;
        // 모든 스킬 쿨타임 초기화
        if (typeof skillState !== 'undefined') {
          skillState.lastFireballTime  = 0;
          skillState.lastLightningTime = 0;
          skillState.lastSwordWaveTime = 0;
          skillState.lastInstakillTime = 0;
        }
        if (typeof BloodKnightSkill !== 'undefined') BloodKnightSkill.lastUsed = 0;
        if (typeof FanaticSkill    !== 'undefined') FanaticSkill.lastUsed    = 0;
        if (typeof ForbiddenSkill  !== 'undefined') ForbiddenSkill.lastUsed  = 0;
        this._addFloatingText('⏱️ 시간 왜곡! 쿨타임 초기화!', '#38bdf8');
        return true;
      }

      case 'voidHand': {
        const cd = skill.cooldown;
        if (now - state.lastUsed < cd) {
          const rem = Math.ceil((cd - (now - state.lastUsed)) / 1000);
          this._addFloatingText(`쿨타임 ${rem}초`, '#9ca3af');
          return false;
        }
        if (typeof battleState === 'undefined' || battleState.enemies.length < 5) {
          this._addFloatingText('적이 5마리 이상이어야 한다.', '#9ca3af');
          return false;
        }
        state.lastUsed = now;
        // 전체 큰 피해
        const dmg = 80 + (battleState.playerLevel || 1) * 5;
        for (let i = battleState.enemies.length - 1; i >= 0; i--) {
          const e = battleState.enemies[i];
          e.hp -= dmg;
          battleState.damageTexts?.push({
            x: e.x, y: e.y - e.size,
            text: `-${dmg}`, color: '#a78bfa', life: 70, vy: -2.5,
          });
          if (e.hp <= 0) {
            battleState.playerExp  = (battleState.playerExp  || 0) + 20 + (battleState.stage||1) * 5;
            battleState.playerCoins= (battleState.playerCoins|| 0) + 25;
            battleState.enemies.splice(i, 1);
          }
        }
        if (typeof checkStageClear === 'function') checkStageClear();
        if (typeof saveBattleData  === 'function') saveBattleData();
        if (typeof updateBattleHUD === 'function') updateBattleHUD();
        this._addFloatingText('🖐️ 공허의 손!', '#a78bfa');
        return true;
      }

      case 'gyunSync': {
        state.active = !state.active;
        if (state.active) {
          state.healedSoFar = 0;
          this._addFloatingText('🩸 균 동화 활성화', '#4ade80');
        } else {
          this._addFloatingText('균 동화 해제', '#9ca3af');
        }
        return true;
      }

      case 'liberation': {
        if (this.energy < this.maxEnergy) {
          this._addFloatingText(`에너지 부족 (${this.energy}/${this.maxEnergy})`, '#9ca3af');
          return false;
        }
        if (state.active) {
          this._addFloatingText('이미 발동 중이다.', '#9ca3af');
          return false;
        }
        this.energy = 0;
        this.saveSkillStates();
        state.active = true;
        state.timer = 600; // 10초
        this._addFloatingText('✨ 자아 해방!', '#fbbf24');
        return true;
      }
    }
    return false;
  }

  // ===== 매 프레임 전투 중 업데이트 =====
  updateSkillEffects() {
    this.updateEnergy();
    const s = this.skillStates;

    // 균의 폭주 타이머
    if (s.rampage.active) {
      s.rampage.timer--;
      if (s.rampage.timer <= 0) {
        s.rampage.active = false;
        s.rampage.invincTimer = 120; // 2초 무적
        this._addFloatingText('폭주 종료 — 무적 2초', '#ef4444');
      }
    }
    if (s.rampage.invincTimer > 0) s.rampage.invincTimer--;

    // 자아 해방 타이머
    if (s.liberation.active) {
      s.liberation.timer--;
      if (s.liberation.timer <= 0) {
        s.liberation.active = false;
        this._addFloatingText('자아 해방 종료.', '#fbbf24');
      }
    }
  }

  // ===== 균 동화 흡혈 처리 (공격 히트 시 호출) =====
  processGyunSyncHeal(damage) {
    const s = this.skillStates.gyunSync;
    if (!s.active || typeof battleState === 'undefined') return;

    const maxHeal = Math.floor(battleState.playerMaxHp * 0.3);
    if (s.healedSoFar >= maxHeal) {
      s.active = false;
      this._addFloatingText('균 동화 한도 초과 — 해제', '#9ca3af');
      return;
    }

    const heal = Math.min(Math.floor(damage * 0.15), maxHeal - s.healedSoFar);
    s.healedSoFar += heal;
    battleState.playerHp = Math.min(battleState.playerHp + heal, battleState.playerMaxHp);
    if (typeof updateBattleHUD === 'function') updateBattleHUD();
  }

  // ===== 수치 조회 =====
  getAtkMultiplier() {
    let mult = 1.0;
    if (this.skillStates.rampage.active)    mult *= 2.0;
    if (this.skillStates.liberation.active) mult *= 1.5;
    return mult;
  }
  isInvincible() {
    return this.skillStates.rampage.invincTimer > 0;
  }
  isLiberationActive() {
    return this.skillStates.liberation.active;
  }

  // ===== 스킬 해금 =====
  unlockSkill(skillId) {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return;
    if (this.skillStates[skillId].unlocked) {
      this._addFloatingText('이미 해금됐다.', '#9ca3af');
      return;
    }
    const coins = (typeof battleState !== 'undefined') ? battleState.playerCoins : 0;
    if (coins < skill.costCoins) {
      this._addFloatingText('코인이 부족하다.', '#f87171');
      return;
    }
    if (typeof battleState !== 'undefined') {
      battleState.playerCoins -= skill.costCoins;
      if (typeof saveBattleData  === 'function') saveBattleData();
      if (typeof updateBattleHUD === 'function') updateBattleHUD();
    }
    this.skillStates[skillId].unlocked = true;
    this.saveSkillStates();
    this._addFloatingText(`${skill.icon} ${skill.name} 해금!`, skill.color);
  }

  _addFloatingText(text, color) {
    this.floatingTexts.push({
      text, color,
      x: 700 + Math.random() * 600,
      y: 400 + Math.random() * 300,
      life: 160, maxLife: 160,
    });
  }

  // ===== 마우스 클릭 =====
  handleClick(mouseX, mouseY) {
    if (!this.showUI) return;

    // 닫기 버튼
    if (this._closeBtnX !== undefined &&
        mouseX >= this._closeBtnX && mouseX <= this._closeBtnX + 30 &&
        mouseY >= this._closeBtnY && mouseY <= this._closeBtnY + 30) {
      this.closeUI(); return;
    }

    // 해금 버튼
    for (const skill of this.skills) {
      if (!skill._btnX) continue;
      if (mouseX >= skill._btnX && mouseX <= skill._btnX + skill._btnW &&
          mouseY >= skill._btnY && mouseY <= skill._btnY + skill._btnH) {
        if (!this.skillStates[skill.id].unlocked) {
          this.unlockSkill(skill.id);
        }
        return;
      }
    }
  }

  openUI()  { this.showUI = true; }
  closeUI() { this.showUI = false; }

  draw(ctx, camX, camY, vw, vh) {
    this.distortionPhase += 0.02;

    // 배경
    ctx.fillStyle = '#06000f';
    ctx.fillRect(0, 0, vw, vh);

    const grad = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw,vh)*0.7);
    grad.addColorStop(0, `rgba(88,28,135,${0.12+Math.sin(this.distortionPhase)*0.03})`);
    grad.addColorStop(0.6, 'rgba(30,0,60,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, vw, vh);

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#120a28';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 바닥 룬
    for (const r of this.floorRunes) {
      const rx = r.x - camX, ry = r.y - camY;
      ctx.save();
      ctx.globalAlpha = 0.1 + Math.sin(this.distortionPhase + r.x * 0.01) * 0.04;
      ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rx, ry, 60, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(rx, ry, 40, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + this.distortionPhase * 0.3;
        ctx.beginPath();
        ctx.arc(rx + Math.cos(angle)*60, ry + Math.sin(angle)*60, 4, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 스킬 구체 (오브)
    for (const orb of this.orbs) {
      orb.phase += 0.025;
      const ox = orb.x - camX + Math.sin(orb.phase) * 10;
      const oy = orb.y - camY + Math.cos(orb.phase * 0.7) * 8;
      const state = this.skillStates[orb.skillId];
      const unlocked = state?.unlocked;

      ctx.save();
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 18 + Math.sin(orb.phase * 2) * 6;
      ctx.globalAlpha = unlocked ? 0.9 : 0.35;
      ctx.fillStyle = unlocked ? orb.color : '#374151';
      ctx.beginPath(); ctx.arc(ox, oy, orb.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = unlocked ? '#fff' : '#6b7280';
      ctx.lineWidth = 2; ctx.stroke();

      // 스킬 아이콘
      ctx.globalAlpha = unlocked ? 1 : 0.4;
      ctx.shadowBlur = 0;
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const skill = this.skills.find(s => s.id === orb.skillId);
      ctx.fillText(skill?.icon || '?', ox, oy);

      // 잠금 표시
      if (!unlocked) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px serif';
        ctx.fillText('🔒', ox, oy + orb.r + 16);
      }
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }

    // 존
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      if (sx > vw || sy > vh || sx + z.w < 0 || sy + z.h < 0) continue;
      ctx.globalAlpha = 0.8; ctx.fillStyle = z.color; ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1; ctx.strokeStyle = z.lc; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#94a3b8'; ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2);
      ctx.textBaseline = 'alphabetic';
    }

    // NPC
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      if (sx > vw || sy > vh || sx + npc.w < 0 || sy + npc.h < 0) continue;
      ctx.globalAlpha = 0.8 + Math.sin(this.distortionPhase * 1.5) * 0.15;
      ctx.fillStyle = npc.color; ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1; ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#e9d5ff'; ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
    }

    // 안내 텍스트
    if (!this.showUI) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(this.distortionPhase * 2) * 0.2;
      ctx.fillStyle = '#c026d3';
      ctx.font = "bold 15px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('[ E키 — 스킬 관리자에게 스킬을 해금하라 ]', vw/2, vh - 60);
      ctx.restore();
    }

    // 에너지 HUD
    this._drawEnergyHUD(ctx, vw);

    // UI 패널
    if (this.showUI) this._drawSkillUI(ctx, vw, vh);

    // 떠다니는 텍스트
    this._drawFloatingTexts(ctx);

    // 맵 테두리
    ctx.strokeStyle = '#1a0a2e'; ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }

  _drawEnergyHUD(ctx, vw) {
    const coins = (typeof battleState !== 'undefined') ? battleState.playerCoins : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(10,0,20,0.85)';
    ctx.fillRect(14, 50, 220, 70);
    ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 50, 220, 70);
    ctx.fillStyle = '#e9d5ff'; ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`💰 코인: ${coins}`, 26, 72);

    // 에너지 바
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(26, 82, 180, 12);
    const energyRatio = this.energy / this.maxEnergy;
    const eColor = energyRatio >= 1 ? '#fbbf24' : '#c026d3';
    ctx.fillStyle = eColor;
    ctx.fillRect(26, 82, 180 * energyRatio, 12);
    ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 1;
    ctx.strokeRect(26, 82, 180, 12);
    ctx.fillStyle = '#fff'; ctx.font = "10px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`에너지 ${this.energy}/${this.maxEnergy}`, 116, 110);
    ctx.restore();
  }

  _drawSkillUI(ctx, vw, vh) {
    const panelW = 640, panelH = 600;
    const px2 = vw/2 - panelW/2, py2 = vh/2 - panelH/2;

    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.fillStyle = '#0a0018';
    ctx.fillRect(px2, py2, panelW, panelH);
    ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 2;
    ctx.strokeRect(px2, py2, panelW, panelH);
    ctx.globalAlpha = 1;

    // 제목
    ctx.fillStyle = '#e9d5ff';
    ctx.font = "bold 20px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('✨ 금단의 스킬실', vw/2, py2 + 34);
    ctx.fillStyle = '#6b7280'; ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.fillText('금단의 힘을 해금하라. 단, 남용하지 마라.', vw/2, py2 + 54);
    ctx.fillStyle = '#374151';
    ctx.fillText('[ ESC — 닫기 ]', vw/2, py2 + panelH - 14);

    // 닫기 버튼
    const closeX = px2 + panelW - 40, closeY = py2 + 10;
    ctx.fillStyle = '#3f0f3f'; ctx.fillRect(closeX, closeY, 30, 30);
    ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 1.5; ctx.strokeRect(closeX, closeY, 30, 30);
    ctx.fillStyle = '#f0abfc'; ctx.font = "bold 16px sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX + 15, closeY + 15);
    ctx.textBaseline = 'alphabetic';
    this._closeBtnX = closeX; this._closeBtnY = closeY;

    // 스킬 목록
    for (let i = 0; i < this.skills.length; i++) {
      const skill = this.skills[i];
      const state = this.skillStates[skill.id];
      const unlocked = state.unlocked;
      const iy = py2 + 72 + i * 96;

      ctx.globalAlpha = unlocked ? 0.9 : 0.55;
      ctx.fillStyle = '#150a2a';
      ctx.fillRect(px2 + 16, iy, panelW - 32, 84);
      ctx.strokeStyle = unlocked ? skill.color : '#374151';
      ctx.lineWidth = unlocked ? 2 : 1;
      ctx.strokeRect(px2 + 16, iy, panelW - 32, 84);
      ctx.globalAlpha = 1;

      // 아이콘
      ctx.font = '28px serif'; ctx.textAlign = 'left';
      ctx.fillText(skill.icon, px2 + 28, iy + 40);

      // 이름
      ctx.fillStyle = unlocked ? skill.color : '#6b7280';
      ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
      ctx.fillText(skill.name, px2 + 68, iy + 24);

      // 설명
      ctx.fillStyle = '#9ca3af'; ctx.font = "11px 'Noto Sans KR', sans-serif";
      ctx.fillText(skill.desc, px2 + 68, iy + 42);

      // 제약
      ctx.fillStyle = '#6b7280'; ctx.font = "10px 'Noto Sans KR', sans-serif";
      ctx.fillText(`⚠ ${skill.condition}`, px2 + 68, iy + 58);

      // 해금 상태 / 버튼
      if (unlocked) {
        ctx.fillStyle = '#4ade80';
        ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'right';
        ctx.fillText('✔ 해금됨', px2 + panelW - 24, iy + 28);
        ctx.fillStyle = '#6b7280'; ctx.font = "10px 'Noto Sans KR', sans-serif";
        ctx.fillText(`전투 중 숫자키 ${i+1}로 사용`, px2 + panelW - 24, iy + 46);
        skill._btnX = null;
      } else {
        const btnX = px2 + panelW - 118, btnY = iy + 24;
        ctx.fillStyle = '#2d0a4e'; ctx.fillRect(btnX, btnY, 96, 34);
        ctx.strokeStyle = '#c026d3'; ctx.lineWidth = 1.5; ctx.strokeRect(btnX, btnY, 96, 34);
        ctx.fillStyle = '#e9d5ff'; ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`💰${skill.costCoins} 해금`, btnX + 48, btnY + 21);
        skill._btnX = btnX; skill._btnY = btnY; skill._btnW = 96; skill._btnH = 34;
      }
    }
    ctx.restore();
  }

  _drawFloatingTexts(ctx) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.5; t.life--;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }
      const alpha = t.life < 40 ? t.life/40 : t.life > t.maxLife - 20 ? (t.maxLife - t.life)/20 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = t.color; ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.shadowColor = t.color; ctx.shadowBlur = 12;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}

// ===== 전역 스킬룸 인스턴스 접근 =====
function getSkillRoom() {
  if (typeof map !== 'undefined' && map instanceof SkillRoom) return map;
  return null;
}