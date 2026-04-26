class GameMap {
  constructor(mapId = 'main') {
    this.mapId = mapId;
    
    if (mapId === 'main') {
      this.initMainMap();
    } else if (mapId === 'secret') {
      this.initSecretMap();
    }
  }

  initMainMap() {
  this.width = 2400;
  this.height = 1600;

  this.paths = [
    { x: 850,  y: 600,  w: 700, h: 400 },
    { x: 1050, y: 100,  w: 300, h: 550 },
    { x: 1050, y: 950,  w: 300, h: 550 },
    { x: 100,  y: 700,  w: 800, h: 200 },
    { x: 1450, y: 700,  w: 800, h: 200 },
    { x: 200,  y: 200,  w: 200, h: 600 },
    { x: 200,  y: 200,  w: 900, h: 200 },
    { x: 2000, y: 200,  w: 200, h: 600 },
    { x: 1150, y: 200,  w: 900, h: 200 },
    { x: 200,  y: 800,  w: 200, h: 500 },
    { x: 200,  y: 1200, w: 900, h: 200 },
    { x: 2000, y: 800,  w: 200, h: 500 },
    { x: 1150, y: 1200, w: 900, h: 200 },
  ];

  this.zones = [
    { id: 'gacha',   label: '🎰 균균 밈 뽑기', x: 1050, y: 50,   w: 300, h: 100, color: '#f59e0b', lc: '#92400e' },
    { id: 'worship', label: '🙏 균 숭배하기',   x: 50,   y: 700,  w: 150, h: 200, color: '#8b5cf6', lc: '#4c1d95' },
    { id: 'battle',  label: '⚔️ 균들과 싸우기', x: 2200, y: 700,  w: 150, h: 200, color: '#ef4444', lc: '#7f1d1d' },
    { id: 'secret',  label: '❓ ???',            x: 1050, y: 1450, w: 300, h: 100, color: '#6b7280', lc: '#1f2937' },
  ];

  // NPC 위치 추가
  this.npcs = [
    { id: 'npc-1', label: '🧑 상인', x: 1400, y: 600, w: 60, h: 60, color: '#10b981', lc: '#047857' },
    { id: 'npc-2', label: '🧙 마법사', x: 2135, y: 700, w: 60, h: 60, color: '#8b5cf6', lc: '#6d28d9' },
    { id: 'npc-3', label: '⚔️ 전사', x: 2135, y: 850, w: 60, h: 60, color: '#ef4444', lc: '#b91c1c' },
    { id: 'npc-4', label: '김 산', x: 860, y: 600, w: 60, h: 60, color: '#ec4899', lc: '#be185d' },
    { id: 'npc-5', label: '김영훈', x: 1400, y: 1200, w: 60, h: 60, color: '#06b6d4', lc: '#0369a1' },
  ];

  this.trees = this._genTrees();
}

  initSecretMap() {
    this.width = 2400;
    this.height = 1600;

    this.paths = [
      { x: 850,  y: 600,  w: 700, h: 400 },
      { x: 1050, y: 100,  w: 300, h: 550 },
      { x: 1050, y: 950,  w: 300, h: 550 },
      { x: 100,  y: 700,  w: 800, h: 200 },
      { x: 1450, y: 700,  w: 800, h: 200 },
      { x: 200,  y: 200,  w: 200, h: 600 },
      { x: 200,  y: 200,  w: 900, h: 200 },
      { x: 2000, y: 200,  w: 200, h: 600 },
      { x: 1150, y: 200,  w: 900, h: 200 },
      { x: 200,  y: 800,  w: 200, h: 500 },
      { x: 200,  y: 1200, w: 900, h: 200 },
      { x: 2000, y: 800,  w: 200, h: 500 },
      { x: 1150, y: 1200, w: 900, h: 200 },
    ];

    this.zones = [
      { id: 'secret-gacha',   label: '✨ 특별 뽑기',     x: 1050, y: 50,   w: 300, h: 100, color: '#06b6d4', lc: '#164e63' },
      { id: 'secret-worship', label: '균 교단 본부',     x: 50,   y: 700,  w: 150, h: 200, color: '#7c3aed', lc: '#3c0839' },
      { id: 'secret-battle',  label: '👑 보스 전투',     x: 2200, y: 700,  w: 150, h: 200, color: '#dc2626', lc: '#3f0000' },
      { id: 'return',         label: '🔙 돌아가기',      x: 1050, y: 1450, w: 300, h: 100, color: '#6366f1', lc: '#1e1b4b' },
    ];

  
    this.npcs = [
       { id: 'npc-dark-1', label: 'ERROR', x: 400, y: 750, w: 60, h: 60, color: '#9333ea', lc: '#5b21b6' },
       { id: 'npc-dark-2', label: 'Glitch', x: 1900, y: 300, w: 60, h: 60, color: '#6b21a8', lc: '#3f0f5c' },
       { id: 'npc-dark-3', label: 'dark', x: 1900, y: 1200, w: 60, h: 60, color: '#7c3aed', lc: '#5b21b6' },
    ];

    this.trees = this._genTrees();
  }

  _rng(seed) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  _onPath(x, y, w, h) {
    return this.paths.some(p => x < p.x + p.w && x + w > p.x && y < p.y + p.h && y + h > p.y);
  }

  _onZone(x, y, w, h) {
    return this.zones.some(z => x < z.x + z.w && x + w > z.x && y < z.y + z.h && y + h > z.y);
  }

  _genTrees() {
    const trees = [];
    const rng = this._rng(42);
    for (let i = 0; i < 180; i++) {
      const x = Math.floor(rng() * (this.width - 60));
      const y = Math.floor(rng() * (this.height - 60));
      const onNpc = this.npcs && this.npcs.some(npc => 
        x < npc.x + npc.w && x + 48 > npc.x && 
        y < npc.y + npc.h && y + 48 > npc.y
      );
      if (!this._onPath(x, y, 48, 48) && !this._onZone(x, y, 48, 48) && !onNpc) {
        trees.push({ x, y, t: Math.floor(rng() * 3) });
      }
    }
    return trees;
  }

  isPointWalkable(px, py) {
    return this.paths.some(p =>
      px >= p.x && px <= p.x + p.w &&
      py >= p.y && py <= p.y + p.h
    ) || this.zones.some(z =>
      px >= z.x && px <= z.x + z.w &&
      py >= z.y && py <= z.y + z.h
    );
  }

  isWalkable(x, y, w, h) {
    const corners = [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x, y: y + h },
      { x: x + w, y: y + h }
    ];
    return corners.every(c => this.isPointWalkable(c.x, c.y));
  }

  getZone(px, py, pw, ph) {
    return this.zones.find(z => px < z.x + z.w && px + pw > z.x && py < z.y + z.h && py + ph > z.y) || null;
  }

  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _drawTree(ctx, x, y, t) {
    const trunks = ['#7c4a1e', '#6b3a1f', '#8b5a2b'];
    const leaves = ['#2d6a2d', '#1e5c2e', '#3a7a3a'];
    ctx.fillStyle = trunks[t];
    ctx.fillRect(x + 18, y + 26, 12, 22);
    ctx.fillStyle = leaves[t];
    ctx.beginPath();
    ctx.arc(x + 24, y + 20, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a9a4a';
    ctx.beginPath();
    ctx.arc(x + 18, y + 14, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  draw(ctx, camX, camY, vw, vh) {
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, 0, vw, vh);
    
    const rng = this._rng(99);
    ctx.fillStyle = '#3d6b49';
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 400; i++) {
      const gx = rng() * this.width - camX;
      const gy = rng() * this.height - camY;
      if (gx > 0 && gx < vw && gy > 0 && gy < vh) {
        ctx.fillRect(gx, gy, 3, 7);
      }
    }
    ctx.globalAlpha = 1;

    for (const p of this.paths) {
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(p.x - camX, p.y - camY, p.w, p.h);
      ctx.strokeStyle = '#a07840';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - camX + 1, p.y - camY + 1, p.w - 2, p.h - 2);
    }

    for (const z of this.zones) {
      const sx = z.x - camX;
      const sy = z.y - camY;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = z.color;
      this._rr(ctx, sx, sy, z.w, z.h, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 3;
      this._rr(ctx, sx, sy, z.w, z.h, 12);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = "bold 13px 'Noto Sans KR',sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = z.label.split(' ');
      const lh = 18;
      const sy0 = sy + z.h / 2 - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => ctx.fillText(l, sx + z.w / 2, sy0 + i * lh));
    }

    // NPC 그리기
    if (this.npcs) {
      for (const npc of this.npcs) {
        const sx = npc.x - camX;
        const sy = npc.y - camY;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = npc.color;
        ctx.fillRect(sx, sy, npc.w, npc.h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = npc.lc;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, npc.w, npc.h);
        
        ctx.fillStyle = '#fff';
        ctx.font = "bold 11px 'Noto Sans KR',sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.label, sx + npc.w / 2, sy + npc.h / 2);
      }
    }

    for (const o of this.trees) {
      const sx = o.x - camX;
      const sy = o.y - camY;
      if (sx > -60 && sx < vw + 60 && sy > -60 && sy < vh + 60) {
        this._drawTree(ctx, sx, sy, o.t);
      }
    }

    ctx.strokeStyle = '#2d4a35';
    ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }
}