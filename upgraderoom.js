// upgraderoom.js - 업그레이드 제실

class UpgradeRoom extends GameMap {
  constructor() {
    super();
    this.mapId = 'upgraderoom';
    this.width = 2000;
    this.height = 1800;

    this.distortionPhase = 0;
    this.ritualActive = false;
    this.ritualTimer = 0;
    this.ritualResult = null;
    this.overloadCount = 0;
    this.screenDistort = 0;
    this.floatingTexts = [];

    this.upgrades = this._loadUpgrades();
    this.gyunFragments = this._loadFragments();

    this.initUpgradeRoom();
  }

  _loadUpgrades() {
    const saved = JSON.parse(localStorage.getItem('gyun_upgrades') || '{}');
    return {
      atk:      saved.atk      || 0,
      hp:       saved.hp       || 0,
      cooldown: saved.cooldown || 0,
      speed:    saved.speed    || 0,
      explode:  saved.explode  || false,
      counter:  saved.counter  || false,
      vampire:  saved.vampire  || false,
    };
  }

  _loadFragments() {
    return parseInt(localStorage.getItem('gyun_fragments') || '0');
  }

  saveUpgrades() {
    localStorage.setItem('gyun_upgrades', JSON.stringify(this.upgrades));
    localStorage.setItem('gyun_fragments', String(this.gyunFragments));
  }

  initUpgradeRoom() {
    this.paths = [
      { x: 850,  y: 50,   w: 300,  h: 200 },
      { x: 200,  y: 200,  w: 1600, h: 1400 },
    ];

    this.zones = [
      {
        id: 'upgrade-return',
        label: '🔙 교단 본부로',
        x: 875, y: 60, w: 250, h: 80,
        color: '#334155', lc: '#1e293b'
      },
    ];

    this.npcs = [
      {
        id: 'upgrade-priest',
        label: '🕯️ 제실 관리자',
        x: 940, y: 380, w: 65, h: 65,
        color: '#3b0764'
      },
    ];

    this.upgradeList = [
      {
        id: 'atk',
        category: '⚔️ 육체 강화',
        name: '공격력 강화',
        desc: '공격력이 영구적으로 증가한다.',
        costCoins: 80, costFragments: 2,
        maxLevel: 10, failChance: 0.10,
        color: '#ef4444',
        ritual: '피를 바친다...',
      },
      {
        id: 'hp',
        category: '⚔️ 육체 강화',
        name: '체력 강화',
        desc: '최대 체력이 영구적으로 증가한다.',
        costCoins: 60, costFragments: 1,
        maxLevel: 10, failChance: 0.08,
        color: '#f87171',
        ritual: '생명력을 헌납한다...',
      },
      {
        id: 'cooldown',
        category: '⚡ 흐름 강화',
        name: '쿨타임 감소',
        desc: '스킬 쿨타임이 영구적으로 감소한다.',
        costCoins: 100, costFragments: 3,
        maxLevel: 5, failChance: 0.15,
        color: '#a78bfa',
        ritual: '시간을 헌납한다...',
      },
      {
        id: 'speed',
        category: '⚡ 흐름 강화',
        name: '이동속도 증가',
        desc: '이동속도가 영구적으로 증가한다.',
        costCoins: 70, costFragments: 2,
        maxLevel: 5, failChance: 0.10,
        color: '#38bdf8',
        ritual: '영혼을 헌납한다...',
      },
      {
        id: 'explode',
        category: '🧠 변이 강화',
        name: '폭발 반응',
        desc: '공격 시 20% 확률로 폭발. 단, 피격 데미지 +10%.',
        costCoins: 200, costFragments: 8,
        maxLevel: 1, failChance: 0.25,
        color: '#fb923c',
        ritual: '균의 핵을 바친다...',
      },
      {
        id: 'counter',
        category: '🧠 변이 강화',
        name: '피격 반격',
        desc: '피격 시 30% 확률로 즉각 반격. 단, 이동속도 -10%.',
        costCoins: 200, costFragments: 8,
        maxLevel: 1, failChance: 0.25,
        color: '#f43f5e',
        ritual: '분노를 헌납한다...',
      },
      {
        id: 'vampire',
        category: '🧠 변이 강화',
        name: '흡혈 반응',
        desc: '처치 시 체력 3% 흡수. 단, 최대 체력 -15%.',
        costCoins: 200, costFragments: 8,
        maxLevel: 1, failChance: 0.25,
        color: '#dc143c',
        ritual: '피를 마신다...',
      },
    ];

    this.ritualCircles = [
      { x: 1000, y: 900, r: 180, phase: 0.0 },
      { x: 1000, y: 900, r: 120, phase: 1.0 },
      { x: 1000, y: 900, r: 60,  phase: 2.0 },
    ];

    this.statues = [
      { x: 380,  y: 400,  phase: 0.0 },
      { x: 1560, y: 400,  phase: 1.5 },
      { x: 380,  y: 1300, phase: 0.8 },
      { x: 1560, y: 1300, phase: 2.3 },
    ];

    this.showUI = false;
  }

  startRitual(upgrade) {
    if (this.ritualActive) return;
    const level = typeof this.upgrades[upgrade.id] === 'boolean'
      ? (this.upgrades[upgrade.id] ? 1 : 0)
      : this.upgrades[upgrade.id];
    if (level >= upgrade.maxLevel) { this._addFloatingText('이미 최대 등급이다.', '#9ca3af'); return; }

    const coins = (typeof battleState !== 'undefined') ? battleState.playerCoins : 0;
    if (coins < upgrade.costCoins)          { this._addFloatingText('코인이 부족하다.', '#f87171'); return; }
    if (this.gyunFragments < upgrade.costFragments) { this._addFloatingText('균 조각이 부족하다.', '#f87171'); return; }

    if (typeof battleState !== 'undefined') {
      battleState.playerCoins -= upgrade.costCoins;
      if (typeof saveBattleData === 'function') saveBattleData();
      if (typeof updateBattleHUD === 'function') updateBattleHUD();
    }
    this.gyunFragments -= upgrade.costFragments;
    this.saveUpgrades();

    this.ritualActive = true;
    this.ritualTimer = 180;
    this.ritualResult = upgrade;
    this.screenDistort = 60;

    this._addFloatingText(upgrade.ritual, '#fbbf24');
    this._addFloatingText('변형 중…', '#a78bfa');
  }

  _applyRitual(upgrade) {
    const failed = Math.random() < upgrade.failChance;
    if (failed) {
      this._addFloatingText('의식 실패…', '#dc2626');
      this._addFloatingText('재료가 사라졌다.', '#9ca3af');
      this.overloadCount++;
      this._checkOverload();
      return;
    }
    if (typeof this.upgrades[upgrade.id] === 'boolean') {
      this.upgrades[upgrade.id] = true;
    } else {
      this.upgrades[upgrade.id]++;
    }
    this.overloadCount++;
    this.saveUpgrades();
    this._applyStatEffects(upgrade);
    this._addFloatingText('변형 완료.', '#4ade80');
    this._checkOverload();
  }

  _applyStatEffects(upgrade) {
    if (typeof battleState === 'undefined') return;
    if (upgrade.id === 'hp') {
      battleState.playerMaxHp += 30;
      battleState.playerHp = Math.min(battleState.playerHp + 30, battleState.playerMaxHp);
    }
    if (upgrade.id === 'vampire') {
      battleState.playerMaxHp = Math.max(10, Math.floor(battleState.playerMaxHp * 0.85));
      battleState.playerHp = Math.min(battleState.playerHp, battleState.playerMaxHp);
    }
    if (typeof updateBattleHUD === 'function') updateBattleHUD();
  }

  _checkOverload() {
    if (this.overloadCount >= 5) {
      this._addFloatingText('⚠ 과부하 경고', '#dc2626');
      this.screenDistort = 120;
    }
    if (this.overloadCount >= 8 && typeof battleState !== 'undefined') {
      battleState.playerMaxHp = Math.max(10, battleState.playerMaxHp - 10);
      battleState.playerHp = Math.min(battleState.playerHp, battleState.playerMaxHp);
      this._addFloatingText('육체가 무너진다…', '#dc2626');
      if (typeof updateBattleHUD === 'function') updateBattleHUD();
    }
  }

  _addFloatingText(text, color) {
    this.floatingTexts.push({
      text, color,
      x: 700 + Math.random() * 600,
      y: 500 + Math.random() * 300,
      life: 150, maxLife: 150,
    });
  }

  getUpgradeAtkBonus()      { return this.upgrades.atk * 8; }
  getUpgradeSpeedBonus()    { return this.upgrades.speed * 1.5; }
  getUpgradeCooldownRatio() { return Math.max(0.5, 1 - this.upgrades.cooldown * 0.08); }
  hasExplode() { return !!this.upgrades.explode; }
  hasCounter() { return !!this.upgrades.counter; }
  hasVampire() { return !!this.upgrades.vampire; }

  draw(ctx, camX, camY, vw, vh) {
    this.distortionPhase += 0.02;

    if (this.ritualActive) {
      this.ritualTimer--;
      if (this.ritualTimer <= 0) {
        this.ritualActive = false;
        this._applyRitual(this.ritualResult);
      }
    }
    if (this.screenDistort > 0) this.screenDistort--;

    // 배경
    ctx.fillStyle = '#080010';
    ctx.fillRect(0, 0, vw, vh);

    const grad = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw,vh)*0.7);
    grad.addColorStop(0, `rgba(120,60,0,${0.07+Math.sin(this.distortionPhase)*0.02})`);
    grad.addColorStop(0.5, 'rgba(80,0,120,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vw, vh);

    // 과부하 왜곡
    if (this.screenDistort > 0) {
      ctx.save();
      ctx.globalAlpha = (this.screenDistort / 120) * 0.15;
      for (let i = 0; i < 4; i++) {
        const dy = Math.sin(this.distortionPhase * 4 + i * 1.5) * 6;
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#7c3aed';
        ctx.fillRect(0, i * (vh/4) + dy, vw, 2);
      }
      ctx.restore();
    }

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#130820';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#3b1a6b';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    this._drawRitualCircles(ctx, camX, camY);
    for (const s of this.statues) { s.phase += 0.01; this._drawStatue(ctx, s, camX, camY); }
    this._drawAltar(ctx, camX, camY);
    if (this.ritualActive) this._drawRitualEffect(ctx, camX, camY, vw, vh);

    // 존
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      if (sx > vw || sy > vh || sx + z.w < 0 || sy + z.h < 0) continue;
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#94a3b8';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2);
    }

    // NPC
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      if (sx > vw || sy > vh || sx + npc.w < 0 || sy + npc.h < 0) continue;
      ctx.globalAlpha = 0.75 + Math.sin(this.distortionPhase * 1.2) * 0.2;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#fde68a';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
    }

    if (this.showUI) {
      this._drawUpgradeUI(ctx, vw, vh);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(this.distortionPhase * 2) * 0.2;
      ctx.fillStyle = '#fbbf24';
      ctx.font = "bold 15px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('[ E키 — 제실 관리자에게 대가를 지불하라 ]', vw/2, vh - 60);
      ctx.restore();
    }

    this._drawResourceHUD(ctx, vw);
    this._drawFloatingTexts(ctx);

    ctx.strokeStyle = '#1a0a2e'; ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }

  _drawRitualCircles(ctx, camX, camY) {
    for (const c of this.ritualCircles) {
      const cx2 = c.x - camX, cy2 = c.y - camY;
      c.phase += 0.012;
      const pulse = 0.1 + Math.sin(this.distortionPhase * 1.5 + c.r * 0.01) * 0.05;
      ctx.save();
      ctx.globalAlpha = this.ritualActive ? 0.4 : pulse;
      ctx.strokeStyle = c.r > 150 ? '#fbbf24' : c.r > 100 ? '#a78bfa' : '#7c3aed';
      ctx.lineWidth = this.ritualActive ? 3 : 1.5;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = this.ritualActive ? 20 : 8;
      ctx.beginPath(); ctx.arc(cx2, cy2, c.r, 0, Math.PI * 2); ctx.stroke();
      const pts = c.r > 150 ? 8 : c.r > 100 ? 6 : 4;
      ctx.fillStyle = ctx.strokeStyle;
      for (let i = 0; i < pts; i++) {
        const angle = (Math.PI * 2 / pts) * i + c.phase;
        ctx.beginPath();
        ctx.arc(cx2 + Math.cos(angle) * c.r, cy2 + Math.sin(angle) * c.r, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawAltar(ctx, camX, camY) {
    const ax = 1000 - camX, ay = 820 - camY;
    const pulse = Math.sin(this.distortionPhase * 2) * 4;
    ctx.save();
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 20 + pulse;
    ctx.fillStyle = '#1a0a00';
    ctx.fillRect(ax - 80, ay - 50, 160, 100);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
    ctx.strokeRect(ax - 80, ay - 50, 160, 100);
    ctx.fillStyle = '#2a1500';
    ctx.fillRect(ax - 70, ay - 60, 140, 20);
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
    ctx.strokeRect(ax - 70, ay - 60, 140, 20);
    for (let i = 0; i < 3; i++) {
      const fx = ax - 30 + i * 30;
      const fy = ay - 60 + Math.sin(this.distortionPhase * 3 + i) * 5;
      ctx.globalAlpha = 0.7 + Math.sin(this.distortionPhase * 4 + i) * 0.2;
      ctx.font = '22px serif'; ctx.textAlign = 'center';
      ctx.fillText('🔥', fx, fy);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.fillStyle = '#fde68a';
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('제단', ax, ay + 80);
    ctx.restore();
  }

  _drawStatue(ctx, s, camX, camY) {
    const sx = s.x - camX, sy = s.y - camY;
    const wobble = Math.sin(s.phase) * 2;
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(s.phase * 0.5) * 0.1;
    ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(sx - 20, sy + 40, 40, 20);
    ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 20, sy + 40, 40, 20);
    ctx.fillStyle = '#2d0a4e';
    ctx.beginPath(); ctx.arc(sx, sy + wobble, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.globalAlpha = 0.8 + Math.sin(s.phase * 2) * 0.2;
    ctx.beginPath(); ctx.arc(sx, sy + wobble, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawRitualEffect(ctx, camX, camY, vw, vh) {
    const cx2 = 1000 - camX, cy2 = 900 - camY;
    const progress = 1 - (this.ritualTimer / 180);
    ctx.save();
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + this.distortionPhase * 3;
      const dist = 200 * (1 - progress);
      ctx.globalAlpha = progress * 0.8;
      ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#a78bfa';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx2 + Math.cos(angle) * dist, cy2 + Math.sin(angle) * dist, 5 + progress * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = progress * 0.5;
    const rGrad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 120 * progress);
    rGrad.addColorStop(0, '#fbbf24');
    rGrad.addColorStop(0.5, 'rgba(167,139,250,0.4)');
    rGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rGrad; ctx.fillRect(0, 0, vw, vh);
    ctx.globalAlpha = 0.7 + Math.sin(this.distortionPhase * 8) * 0.3;
    ctx.fillStyle = '#fde68a'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 20;
    ctx.font = "bold 28px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center'; ctx.fillText('변형 중…', vw/2, vh/2);
    ctx.restore();
  }

  _drawUpgradeUI(ctx, vw, vh) {
    const panelW = 620, panelH = 580;
    const px2 = vw/2 - panelW/2, py2 = vh/2 - panelH/2;
    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.fillStyle = '#0d0020';
    ctx.fillRect(px2, py2, panelW, panelH);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
    ctx.strokeRect(px2, py2, panelW, panelH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fde68a';
    ctx.font = "bold 20px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('⚒️ 업그레이드 제실', vw/2, py2 + 34);
    ctx.fillStyle = '#6b7280';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.fillText('대가를 지불하라.', vw/2, py2 + 54);
    ctx.fillStyle = '#374151';
    ctx.fillText('[ ESC — 닫기 ]', vw/2, py2 + panelH - 14);

    // ===== 닫기 버튼 =====
    const closeX = px2 + panelW - 40, closeY = py2 + 10;
    ctx.fillStyle = '#3f0f0f';
    ctx.fillRect(closeX, closeY, 30, 30);
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5;
    ctx.strokeRect(closeX, closeY, 30, 30);
    ctx.fillStyle = '#f87171';
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX + 15, closeY + 15);
    ctx.textBaseline = 'alphabetic';
    this._closeBtnX = closeX; this._closeBtnY = closeY;

    let row = 0;
    let lastCategory = '';
    for (const upg of this.upgradeList) {
      const level = typeof this.upgrades[upg.id] === 'boolean'
        ? (this.upgrades[upg.id] ? 1 : 0)
        : this.upgrades[upg.id];
      const maxed = level >= upg.maxLevel;

      if (upg.category !== lastCategory) {
        lastCategory = upg.category;
        const cy3 = py2 + 78 + row * 68;
        ctx.fillStyle = '#4b5563';
        ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(upg.category, px2 + 20, cy3 + 14);
        row += 0.4;
      }

      const iy = py2 + 78 + row * 68;
      row++;

      ctx.globalAlpha = maxed ? 0.3 : 0.75;
      ctx.fillStyle = '#1a0a30';
      ctx.fillRect(px2 + 16, iy, panelW - 32, 56);
      ctx.strokeStyle = maxed ? '#374151' : upg.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px2 + 16, iy, panelW - 32, 56);
      ctx.globalAlpha = 1;

      ctx.fillStyle = maxed ? '#4b5563' : upg.color;
      ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(upg.name, px2 + 28, iy + 20);

      ctx.fillStyle = '#9ca3af';
      ctx.font = "10px 'Noto Sans KR', sans-serif";
      ctx.fillText(upg.desc, px2 + 28, iy + 38);

      ctx.textAlign = 'right';
      ctx.fillStyle = maxed ? '#6b7280' : '#fbbf24';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.fillText(maxed ? 'MAX' : `Lv.${level}/${upg.maxLevel}`, px2 + panelW - 130, iy + 20);
      ctx.fillStyle = '#d1d5db';
      ctx.font = "10px 'Noto Sans KR', sans-serif";
      ctx.fillText(`💰${upg.costCoins}  🔮${upg.costFragments}`, px2 + panelW - 130, iy + 38);

      if (!maxed && !this.ritualActive) {
        const btnX = px2 + panelW - 112, btnY = iy + 10;
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(btnX, btnY, 88, 34);
        ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, btnY, 88, 34);
        ctx.fillStyle = '#e9d5ff';
        ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('헌납', btnX + 44, btnY + 21);
        upg._btnX = btnX; upg._btnY = btnY; upg._btnW = 88; upg._btnH = 34;
      } else {
        upg._btnX = null;
      }
    }
    ctx.restore();
  }

  _drawResourceHUD(ctx, vw) {
    const coins = (typeof battleState !== 'undefined') ? battleState.playerCoins : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(10,0,20,0.85)';
    ctx.fillRect(14, 50, 200, 52);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 50, 200, 52);
    ctx.fillStyle = '#fde68a';
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`💰 코인: ${coins}`, 26, 72);
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText(`🔮 균 조각: ${this.gyunFragments}`, 26, 92);
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
      ctx.fillStyle = t.color;
      ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = t.color; ctx.shadowBlur = 12;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  handleClick(mouseX, mouseY) {
    if (!this.showUI) return;

    // 닫기 버튼
    if (this._closeBtnX !== undefined &&
        mouseX >= this._closeBtnX && mouseX <= this._closeBtnX + 30 &&
        mouseY >= this._closeBtnY && mouseY <= this._closeBtnY + 30) {
      this.closeUI();
      return;
    }

    if (this.ritualActive) return;
    for (const upg of this.upgradeList) {
      if (!upg._btnX) continue;
      if (mouseX >= upg._btnX && mouseX <= upg._btnX + upg._btnW &&
          mouseY >= upg._btnY && mouseY <= upg._btnY + upg._btnH) {
        this.startRitual(upg);
        return;
      }
    }
  }

  openUI()  { this.showUI = true; }
  closeUI() { this.showUI = false; }
}

// ===== 균 조각 획득 함수 =====
function addGyunFragment(amount = 1) {
  const cur = parseInt(localStorage.getItem('gyun_fragments') || '0');
  localStorage.setItem('gyun_fragments', String(cur + amount));
  if (typeof map !== 'undefined' && map instanceof UpgradeRoom) {
    map.gyunFragments = cur + amount;
  }
}

// ===== 강화 수치 전역 조회 =====
function getUpgradeAtk()      { const s = JSON.parse(localStorage.getItem('gyun_upgrades')||'{}'); return (s.atk||0)*8; }
function getUpgradeSpeed()    { const s = JSON.parse(localStorage.getItem('gyun_upgrades')||'{}'); return (s.speed||0)*1.5; }
function getUpgradeCooldown() { const s = JSON.parse(localStorage.getItem('gyun_upgrades')||'{}'); return Math.max(0.5,1-(s.cooldown||0)*0.08); }
function getUpgradeMutation() {
  const s = JSON.parse(localStorage.getItem('gyun_upgrades')||'{}');
  return { explode: !!s.explode, counter: !!s.counter, vampire: !!s.vampire };
}