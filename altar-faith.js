// altar-faith.js - 신앙의 심부 (프로토타입)

class AltarFaithDepth extends GameMap {
  constructor() {
    super();
    this.mapId = 'altar-faith';
    this.width = 2200;
    this.height = 1800;

    this.phase = 0;
    this.whispers = [];
    this.whisperTimer = 0;

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
      { id: 'faith-chorus', label: '🕯️ 합창', x: 1080, y: 950, w: 70, h: 70, color: '#7c3aed' },
    ];

    this.pillars = [];
    for (let i = 0; i < 8; i++) {
      this.pillars.push({
        x: 420 + i * 200,
        y: 520 + (i % 2) * 420,
        w: 60,
        h: 280,
        phase: i * 0.7,
      });
    }

    this.whisperPool = [
      '기도는 형태일 뿐이다.',
      '믿음은 감염이다.',
      '무릎을 꿇어라.',
      '찬양하라. 그러면 살 것이다.',
      '여기서는 숨소리도 의식이다.',
    ];
  }

  _updateWhispers() {
    this.whisperTimer++;
    if (this.whisperTimer >= 220) {
      this.whisperTimer = 0;
      const text = this.whisperPool[Math.floor(Math.random() * this.whisperPool.length)];
      this.whispers.push({
        text,
        x: 120 + Math.random() * 900,
        y: 110 + Math.random() * 240,
        life: 180,
        maxLife: 180,
        color: Math.random() < 0.7 ? '#ddd6fe' : '#fbbf24',
      });
    }
    for (let i = this.whispers.length - 1; i >= 0; i--) {
      const w = this.whispers[i];
      w.life--;
      if (w.life <= 0) this.whispers.splice(i, 1);
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateWhispers();

    ctx.fillStyle = '#050012';
    ctx.fillRect(0, 0, vw, vh);

    const haze = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.8);
    haze.addColorStop(0, `rgba(124,58,237,${0.14 + Math.sin(this.phase) * 0.03})`);
    haze.addColorStop(0.6, 'rgba(15,23,42,0.08)');
    haze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, vw, vh);

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#0b0120';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#3b0764';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 균사 기둥
    for (const col of this.pillars) {
      col.phase += 0.01;
      const sx = col.x - camX, sy = col.y - camY + Math.sin(col.phase) * 6;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#1a083a';
      ctx.fillRect(sx, sy, col.w, col.h);
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, col.w, col.h);
      // 심장박동 같은 라인
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + col.h * 0.25);
      ctx.lineTo(sx + col.w - 10, sy + col.h * 0.25 + Math.sin(this.phase * 2 + col.x * 0.01) * 10);
      ctx.stroke();
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
      ctx.globalAlpha = 0.7 + Math.sin(this.phase * 1.5) * 0.2;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ddd6fe'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#ddd6fe';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
      ctx.restore();
    }

    // 속삭임 오버레이
    for (let i = 0; i < this.whispers.length; i++) {
      const w = this.whispers[i];
      const a = w.life < 40 ? w.life/40 : w.life > w.maxLife - 20 ? (w.maxLife - w.life)/20 : 1;
      ctx.save();
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = w.color;
      ctx.font = "italic bold 18px 'Noto Sans KR', serif";
      ctx.textAlign = 'left';
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 12;
      ctx.fillText(`"${w.text}"`, w.x, w.y);
      ctx.restore();
    }

    // 타이틀
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 60, 250, 34);
    ctx.fillStyle = '#ddd6fe';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🕯️ 신앙의 심부 (프로토타입)', 22, 77);
    ctx.restore();

    ctx.strokeStyle = '#12002a';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }
}

