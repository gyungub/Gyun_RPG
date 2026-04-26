// altar-truth.js - 진실의 심부 (프로토타입)

class AltarTruthDepth extends GameMap {
  constructor() {
    super();
    this.mapId = 'altar-truth';
    this.width = 2200;
    this.height = 1800;

    this.phase = 0;
    this.glyphs = [];
    this.lines = [];
    this.lineTimer = 0;

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
    ];

    this.npcs = [
      { id: 'truth-scribe', label: '📜 서기관', x: 1050, y: 980, w: 70, h: 70, color: '#4338ca' },
    ];

    const glyphTexts = ['∴','⟡','⌁','⟟','⟊','⟠','⟆','⟁'];
    for (let i = 0; i < 18; i++) {
      this.glyphs.push({
        x: 380 + Math.random() * 1500,
        y: 340 + Math.random() * 1200,
        t: glyphTexts[Math.floor(Math.random() * glyphTexts.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.truthPool = [
      '기록은 진실이 아니다.',
      '진실은 기록되지 않는다.',
      '너는 보고 싶어서 본다.',
      '문장은 너를 읽는다.',
      '교단은 껍질이다.',
    ];
  }

  _updateLines() {
    this.lineTimer++;
    if (this.lineTimer >= 200) {
      this.lineTimer = 0;
      this.lines.push({
        text: this.truthPool[Math.floor(Math.random() * this.truthPool.length)],
        x: 140 + Math.random() * 1000,
        y: 110 + Math.random() * 240,
        life: 190,
        maxLife: 190,
        color: Math.random() < 0.7 ? '#c7d2fe' : '#fbbf24',
      });
    }
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const t = this.lines[i];
      t.life--;
      if (t.life <= 0) this.lines.splice(i, 1);
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateLines();

    ctx.fillStyle = '#030014';
    ctx.fillRect(0, 0, vw, vh);

    const haze = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.8);
    haze.addColorStop(0, `rgba(67,56,202,${0.14 + Math.sin(this.phase) * 0.03})`);
    haze.addColorStop(0.55, 'rgba(0,0,0,0.10)');
    haze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, vw, vh);

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#070026';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 룬/글리프
    for (const g of this.glyphs) {
      g.phase += 0.015;
      const x = g.x - camX;
      const y = g.y - camY + Math.sin(g.phase) * 8;
      ctx.save();
      ctx.globalAlpha = 0.10 + Math.sin(this.phase + g.phase) * 0.05;
      ctx.fillStyle = '#c7d2fe';
      ctx.font = "bold 40px serif";
      ctx.textAlign = 'center';
      ctx.fillText(g.t, x, y);
      ctx.restore();
    }

    // 존
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#94a3b8';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2);
      ctx.textBaseline = 'alphabetic';
    }

    // NPC
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(this.phase * 1.2) * 0.2;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#c7d2fe'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#c7d2fe';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
      ctx.restore();
    }

    // 진실 문장 오버레이
    for (let i = 0; i < this.lines.length; i++) {
      const t = this.lines[i];
      const a = t.life < 40 ? t.life/40 : t.life > t.maxLife - 20 ? (t.maxLife - t.life)/20 : 1;
      ctx.save();
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = t.color;
      ctx.font = "italic bold 18px 'Noto Sans KR', serif";
      ctx.textAlign = 'left';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
      ctx.fillText(`"${t.text}"`, t.x, t.y);
      ctx.restore();
    }

    // 타이틀
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 60, 250, 34);
    ctx.fillStyle = '#c7d2fe';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('📜 진실의 심부 (프로토타입)', 22, 77);
    ctx.restore();

    ctx.strokeStyle = '#08001a';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }
}

