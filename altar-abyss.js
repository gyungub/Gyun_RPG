// altar-abyss.js - 심연 진입 (프로토타입)

class AltarAbyssDepth extends GameMap {
  constructor() {
    super();
    this.mapId = 'altar-abyss';
    this.width = 2200;
    this.height = 1800;

    this.phase = 0;
    this.glitch = [];
    this.glitchTimer = 0;

    this._init();
  }

  _init() {
    this.paths = [
      { x: 200, y: 200, w: 1800, h: 1400 },
      { x: 950, y: 70, w: 300, h: 220 },
    ];

    this.zones = [
      {
        id: 'altar-depth-return',
        label: '🔙 중앙 대제단으로',
        x: 960, y: 90, w: 280, h: 90,
        color: '#334155', lc: '#1e293b',
      },
      {
        id: 'abyss-descend',
        label: '🕳️ 더 아래로 (준비 중)',
        x: 920, y: 1220, w: 360, h: 150,
        color: '#111827', lc: '#4c1d95',
      },
    ];

    this.npcs = [
      { id: 'abyss-eye', label: '👁️ 시선', x: 1080, y: 820, w: 70, h: 70, color: '#0f0f1a' },
    ];

    this.glitchPool = [
      '여기서부터는 돌아갈 수 없다.',
      '발 밑이 없다.',
      '너는 이미 떨어지고 있다.',
      '숨을 쉬지 마.',
      '심연이 네 이름을 안다.',
    ];
  }

  _updateGlitch() {
    this.glitchTimer++;
    if (this.glitchTimer >= 120) {
      this.glitchTimer = 0;
      this.glitch.push({
        text: this.glitchPool[Math.floor(Math.random() * this.glitchPool.length)],
        x: 120 + Math.random() * 1100,
        y: 100 + Math.random() * 360,
        life: 140,
        maxLife: 140,
        color: Math.random() < 0.5 ? '#dc2626' : '#a78bfa',
      });
    }
    for (let i = this.glitch.length - 1; i >= 0; i--) {
      const g = this.glitch[i];
      g.life--;
      if (g.life <= 0) this.glitch.splice(i, 1);
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateGlitch();

    ctx.fillStyle = '#000006';
    ctx.fillRect(0, 0, vw, vh);

    // 어두운 와류
    const vortex = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.9);
    vortex.addColorStop(0, `rgba(76,29,149,${0.14 + Math.sin(this.phase) * 0.03})`);
    vortex.addColorStop(0.4, 'rgba(17,24,39,0.16)');
    vortex.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vortex;
    ctx.fillRect(0, 0, vw, vh);

    // 글리치 라인
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(this.phase * 5) * 0.04;
    for (let i = 0; i < 8; i++) {
      const y = (vh / 9) * (i + 1) + Math.sin(this.phase * 4 + i) * 14;
      ctx.fillStyle = i % 2 === 0 ? '#a78bfa' : '#dc2626';
      ctx.fillRect(0, y, vw, 2);
    }
    ctx.restore();

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#04000a';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 중앙 구멍 느낌
    const cx = 1100 - camX, cy = 900 - camY;
    ctx.save();
    ctx.globalAlpha = 0.8;
    const hole = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
    hole.addColorStop(0, 'rgba(0,0,0,0.95)');
    hole.addColorStop(0.4, 'rgba(0,0,0,0.7)');
    hole.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.arc(cx, cy, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 260 + Math.sin(this.phase * 2) * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 존
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2);
      ctx.textBaseline = 'alphabetic';
    }

    // NPC
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.phase * 2.5) * 0.25;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#fca5a5';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
      ctx.restore();
    }

    // 글리치 텍스트
    for (let i = 0; i < this.glitch.length; i++) {
      const g = this.glitch[i];
      const a = g.life < 40 ? g.life/40 : g.life > g.maxLife - 20 ? (g.maxLife - g.life)/20 : 1;
      ctx.save();
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = g.color;
      ctx.font = "bold 20px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'left';
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 14;
      const dx = (Math.random() - 0.5) * (g.life < 60 ? 10 : 2);
      const dy = (Math.random() - 0.5) * (g.life < 60 ? 4 : 1);
      ctx.fillText(g.text, g.x + dx, g.y + dy);
      ctx.restore();
    }

    // 타이틀
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(12, 60, 240, 34);
    ctx.fillStyle = '#e9d5ff';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🕳️ 심연 진입 (프로토타입)', 22, 77);
    ctx.restore();

    ctx.strokeStyle = '#020008';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }
}

