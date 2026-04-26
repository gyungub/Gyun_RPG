// centralaltar.js - 중앙 대제단
// 라이브 리로드/중복 로드 상황에서도 안전하게 전역 등록

window.CentralAltar = window.CentralAltar || class CentralAltar extends GameMap {
  constructor() {
    super();
    this.mapId = 'centralaltar';
    this.width = 2000;
    this.height = 1800;

    this.phase = 0;
    this.showUI = false;

    this.floatingTexts = [];
    this.particles = [];
    this.spores = [];
    this.whispers = [];
    this.whisperTimer = 0;
    this.uiGlitch = 0;

    this._initCentralAltar();
  }

  _initCentralAltar() {
    this.paths = [
      // 입구 통로
      { x: 850, y: 50, w: 300, h: 200 },
      // 메인 제단 구역
      { x: 200, y: 200, w: 1600, h: 1400 },
    ];

    this.zones = [
      {
        id: 'altar-return',
        label: '🔙 교단 본부로',
        x: 875, y: 60, w: 250, h: 80,
        color: '#334155', lc: '#1e293b',
      },
      // 4개의 심부 루트 (허브)
      {
        id: 'altar-route-faith',
        label: '🕯️ 신앙의 심부',
        x: 360, y: 760, w: 260, h: 140,
        color: '#7c3aed', lc: '#3b0764',
      },
      {
        id: 'altar-route-mutation',
        label: '🧬 변이의 심부',
        x: 1380, y: 760, w: 260, h: 140,
        color: '#10b981', lc: '#064e3b',
      },
      {
        id: 'altar-route-abyss',
        label: '🕳️ 심연 진입',
        x: 860, y: 1240, w: 280, h: 150,
        color: '#111827', lc: '#4c1d95',
      },
      {
        id: 'altar-route-truth',
        label: '📜 진실의 심부',
        x: 860, y: 520, w: 280, h: 140,
        color: '#4338ca', lc: '#1e1b4b',
      },
    ];

    this.npcs = [
      {
        id: 'altar-keeper',
        label: '🩸 핵심 사제',
        x: 950, y: 380, w: 70, h: 70,
        color: '#7f1d1d',
      },
    ];

    // 성체 (중앙 고정점)
    this.altar = { x: 1000, y: 930 };
    this.rings = [
      { r: 210, phase: 0.0 },
      { r: 150, phase: 1.2 },
      { r: 90, phase: 2.4 },
    ];

    this.offerings = [
      { id: 'offer-100',  label: '💰 100 → 🔮 +3',  coins: 100,  fragments: 3,  color: '#a78bfa' },
      { id: 'offer-300',  label: '💰 300 → 🔮 +10', coins: 300,  fragments: 10, color: '#c4b5fd' },
      { id: 'offer-1000', label: '💰 1000 → 🔮 +40', coins: 1000, fragments: 40, color: '#fbbf24' },
    ];

    this.whisperPool = [
      '…가까이 오지 마.',
      '성체가 숨 쉰다.',
      '네가 선택하게 될 것이다.',
      '기도가 아니라 동화다.',
      '심연이 너를 본다.',
      '진실은 되돌릴 수 없다.',
      '피가 길이 된다.',
      '너는 이미 연결됐다.',
    ];
  }

  openUI() { this.showUI = true; }
  closeUI() { this.showUI = false; }

  _addFloatingText(text, color = '#e5e7eb') {
    this.floatingTexts.push({
      text,
      color,
      x: 700 + Math.random() * 600,
      y: 420 + Math.random() * 260,
      life: 150,
      maxLife: 150,
    });
  }

  _spawnParticle() {
    if (this.particles.length > 90) return;
    if (Math.random() > 0.55) return;
    this.particles.push({
      x: this.altar.x + (Math.random() - 0.5) * 320,
      y: this.altar.y + (Math.random() - 0.5) * 260,
      r: 1.5 + Math.random() * 2.8,
      vy: -0.25 - Math.random() * 0.65,
      vx: (Math.random() - 0.5) * 0.3,
      life: 1.0,
      decay: 0.004 + Math.random() * 0.004,
      color: Math.random() < 0.7 ? '#dc2626' : '#a78bfa',
    });
  }

  _spawnSpore() {
    if (this.spores.length > 140) return;
    if (Math.random() > 0.35) return;
    const x = 200 + Math.random() * 1600;
    const y = 200 + Math.random() * 1400;
    this.spores.push({
      x,
      y,
      r: 0.8 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.1 - Math.random() * 0.35,
      life: 1.0,
      decay: 0.002 + Math.random() * 0.004,
      color: Math.random() < 0.5 ? '#9ca3af' : '#a78bfa',
    });
  }

  _updateParticles() {
    this._spawnParticle();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this._spawnSpore();
    for (let i = this.spores.length - 1; i >= 0; i--) {
      const s = this.spores[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;
      if (s.life <= 0) { this.spores.splice(i, 1); continue; }
      // 살짝 흔들리는 부유
      s.x += Math.sin(this.phase * 1.2 + i) * 0.03;
    }
  }

  _updateWhispers() {
    this.whisperTimer++;
    const closeToRelic = (typeof player !== 'undefined')
      ? (Math.hypot(player.cx - this.altar.x, player.cy - this.altar.y) < 240)
      : false;

    if (closeToRelic) {
      this.uiGlitch = Math.min(80, this.uiGlitch + 1);
      if (this.whisperTimer >= 160) {
        this.whisperTimer = 0;
        const text = this.whisperPool[Math.floor(Math.random() * this.whisperPool.length)];
        this.whispers.push({
          text,
          x: 120 + Math.random() * 900,
          y: 90 + Math.random() * 260,
          life: 160,
          maxLife: 160,
          color: Math.random() < 0.6 ? '#fca5a5' : '#c4b5fd',
        });
      }
    } else {
      this.uiGlitch = Math.max(0, this.uiGlitch - 2);
    }

    for (let i = this.whispers.length - 1; i >= 0; i--) {
      const w = this.whispers[i];
      w.life--;
      w.y += Math.sin(this.phase * 2 + i) * 0.12;
      if (w.life <= 0) this.whispers.splice(i, 1);
    }
  }

  _doOffering(offering) {
    const coins = (typeof battleState !== 'undefined') ? (battleState.playerCoins || 0) : 0;
    if (coins < offering.coins) {
      this._addFloatingText('대가가 부족하다.', '#f87171');
      return;
    }

    if (typeof battleState !== 'undefined') {
      battleState.playerCoins -= offering.coins;
      if (typeof saveBattleData === 'function') saveBattleData();
      if (typeof updateBattleHUD === 'function') updateBattleHUD();
    }

    if (typeof addGyunFragment === 'function') addGyunFragment(offering.fragments);
    else {
      const cur = parseInt(localStorage.getItem('gyun_fragments') || '0');
      localStorage.setItem('gyun_fragments', String(cur + offering.fragments));
    }

    this._addFloatingText(`🔮 균 조각 +${offering.fragments}`, offering.color);
    this._addFloatingText('성체가… 반응한다.', '#fca5a5');
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

    for (const off of this.offerings) {
      if (!off._btnX) continue;
      if (mouseX >= off._btnX && mouseX <= off._btnX + off._btnW &&
          mouseY >= off._btnY && mouseY <= off._btnY + off._btnH) {
        this._doOffering(off);
        return;
      }
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateParticles();
    this._updateWhispers();

    // 배경 (살아있는 성역)
    ctx.fillStyle = '#040008';
    ctx.fillRect(0, 0, vw, vh);

    // 호흡하는 벽/공기
    const breath = 0.06 + Math.sin(this.phase * 0.9) * 0.02;
    const fog = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.8);
    fog.addColorStop(0, `rgba(220,38,38,${breath})`);
    fog.addColorStop(0.35, `rgba(17,24,39,${0.06 + Math.sin(this.phase * 1.1) * 0.02})`);
    fog.addColorStop(0.6, 'rgba(124,58,237,0.05)');
    fog.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, vw, vh);

    // UI 오염(가벼운 글리치 라인) — 성체 근접 시 강화
    if (this.uiGlitch > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.18, (this.uiGlitch / 80) * 0.18);
      for (let i = 0; i < 6; i++) {
        const y = (vh / 7) * (i + 1) + Math.sin(this.phase * 4 + i) * 10;
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#a78bfa';
        ctx.fillRect(0, y, vw, 2);
      }
      ctx.restore();
    }

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      // 맥동하는 생체 바닥
      const pulse = 0.5 + Math.sin(this.phase * 1.8 + (p.x + p.y) * 0.002) * 0.08;
      ctx.fillStyle = `rgba(12,0,18,${pulse})`;
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#2a0a1f';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 제단 룬 링
    const ax = this.altar.x - camX;
    const ay = this.altar.y - camY;
    if (ax > -500 && ax < vw + 500 && ay > -500 && ay < vh + 500) {
      for (let i = 0; i < this.rings.length; i++) {
        const ring = this.rings[i];
        ring.phase += 0.008 + i * 0.002;
        const alpha = 0.10 + Math.sin(this.phase + i) * 0.04;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.strokeStyle = i % 2 === 0 ? '#dc2626' : '#a78bfa';
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ax, ay, ring.r + Math.sin(ring.phase) * 3, 0, Math.PI * 2);
        ctx.stroke();

        const pts = 8 - i * 2;
        ctx.fillStyle = ctx.strokeStyle;
        for (let k = 0; k < pts; k++) {
          const ang = (Math.PI * 2 / pts) * k + ring.phase;
          ctx.beginPath();
          ctx.arc(ax + Math.cos(ang) * ring.r, ay + Math.sin(ang) * ring.r, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 성체(핵심 존재) 본체
      ctx.save();
      const beat = Math.sin(this.phase * 2.6) * 6;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 20 + beat;
      ctx.fillStyle = '#120007';
      ctx.fillRect(ax - 96, ay - 54, 192, 108);
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 3;
      ctx.strokeRect(ax - 96, ay - 54, 192, 108);

      // 내부 맥동 코어
      ctx.globalAlpha = 0.65 + Math.sin(this.phase * 2.6) * 0.15;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(ax, ay - 6, 18 + Math.sin(this.phase * 3.2) * 4, 0, Math.PI * 2);
      ctx.fill();

      // 촉수/균사 라인
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const sx2 = ax - 120 + t * 240;
        const sy2 = ay + 10 + Math.sin(this.phase * 1.6 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(ax, ay - 6);
        ctx.quadraticCurveTo(ax + Math.sin(this.phase + i) * 50, ay + 30, sx2, sy2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fecaca';
      ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('성체', ax, ay + 88);
      ctx.restore();
    }

    // 파티클
    for (const p of this.particles) {
      const px = p.x - camX, py = p.y - camY;
      if (px < -40 || px > vw + 40 || py < -40 || py > vh + 40) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * 0.7;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 포자 (전체 부유)
    for (const s of this.spores) {
      const px = s.x - camX, py = s.y - camY;
      if (px < -40 || px > vw + 40 || py < -40 || py > vh + 40) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * 0.45;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 존
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      if (sx > vw || sy > vh || sx + z.w < 0 || sy + z.h < 0) continue;
      const pulse = 0.75 + Math.sin(this.phase * 2 + z.x * 0.002) * 0.12;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = z.id === 'altar-route-abyss' ? '#e5e7eb' : '#94a3b8';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2);
      ctx.textBaseline = 'alphabetic';
    }

    // NPC
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      if (sx > vw || sy > vh || sx + npc.w < 0 || sy + npc.h < 0) continue;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(this.phase * 1.2) * 0.2;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#fecaca';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
      ctx.restore();
    }

    // 안내 텍스트
    if (!this.showUI) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(this.phase * 2) * 0.2;
      ctx.fillStyle = '#fca5a5';
      ctx.font = "bold 15px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('[ E키 — 핵심 사제에게 대가를 치러라 ]', vw/2, vh - 60);
      ctx.restore();
    }

    // UI 패널
    if (this.showUI) this._drawUI(ctx, vw, vh);

    // 떠다니는 텍스트
    this._drawFloatingTexts(ctx);

    // 속삭임 오버레이 텍스트
    if (this.whispers.length > 0) {
      for (let i = 0; i < this.whispers.length; i++) {
        const w = this.whispers[i];
        const alpha = w.life < 40 ? w.life / 40 : w.life > w.maxLife - 20 ? (w.maxLife - w.life) / 20 : 1;
        ctx.save();
        ctx.globalAlpha = alpha * (0.25 + (this.uiGlitch / 80) * 0.35);
        ctx.fillStyle = w.color;
        ctx.font = "italic bold 18px 'Noto Sans KR', serif";
        ctx.textAlign = 'left';
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 12;
        ctx.fillText(`"${w.text}"`, w.x, w.y);
        ctx.restore();
      }
    }

    // 맵 테두리
    ctx.strokeStyle = '#1a0a2e';
    ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }

  _drawUI(ctx, vw, vh) {
    const panelW = 520, panelH = 420;
    const px2 = vw/2 - panelW/2, py2 = vh/2 - panelH/2;
    const coins = (typeof battleState !== 'undefined') ? (battleState.playerCoins || 0) : 0;
    const frags = parseInt(localStorage.getItem('gyun_fragments') || '0');

    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.fillStyle = '#0a0014';
    ctx.fillRect(px2, py2, panelW, panelH);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.strokeRect(px2, py2, panelW, panelH);
    ctx.globalAlpha = 1;

    // 제목
    ctx.fillStyle = '#fecaca';
    ctx.font = "bold 20px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('🩸 중앙 대제단 — 성체 헌납', vw/2, py2 + 34);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.fillText('겉으로는 의식. 실제로는 연결.', vw/2, py2 + 54);

    // 보유 자원
    ctx.fillStyle = '#fbbf24';
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.fillText(`💰 코인: ${coins}    🔮 균 조각: ${frags}`, vw/2, py2 + 82);

    // 닫기 버튼
    const closeX = px2 + panelW - 40, closeY = py2 + 10;
    ctx.fillStyle = '#2a0a1f';
    ctx.fillRect(closeX, closeY, 30, 30);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(closeX, closeY, 30, 30);
    ctx.fillStyle = '#fecaca';
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX + 15, closeY + 15);
    ctx.textBaseline = 'alphabetic';
    this._closeBtnX = closeX;
    this._closeBtnY = closeY;

    // 버튼들
    const startY = py2 + 120;
    for (let i = 0; i < this.offerings.length; i++) {
      const off = this.offerings[i];
      const by = startY + i * 74;
      const btnX = px2 + 70;
      const btnW = panelW - 140;
      const btnH = 54;

      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#140018';
      ctx.fillRect(btnX, by, btnW, btnH);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = off.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, by, btnW, btnH);

      ctx.fillStyle = off.color;
      ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(off.label, btnX + btnW/2, by + btnH/2);
      ctx.textBaseline = 'alphabetic';

      off._btnX = btnX;
      off._btnY = by;
      off._btnW = btnW;
      off._btnH = btnH;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('[ ESC — 닫기 ]', vw/2, py2 + panelH - 16);

    ctx.restore();
  }

  _drawFloatingTexts(ctx) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.5;
      t.life--;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }
      const alpha = t.life < 40 ? t.life/40 : t.life > t.maxLife - 20 ? (t.maxLife - t.life)/20 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = t.color;
      ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
};

window.getCentralAltar = window.getCentralAltar || function getCentralAltar() {
  if (typeof map !== 'undefined' && window.CentralAltar && map instanceof window.CentralAltar) return map;
  return null;
};
