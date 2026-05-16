// cultmap.js - 길을 제대로 연결한 버전

class CultHeadquarters extends GameMap {
  constructor() {
    super();
    this.mapId = 'cult';
    this.width = 3200;
    this.height = 2200;

    this.initCultMap();
  }

  initCultMap() {
    // ==================== 이동 가능한 바닥 (paths) ====================
    this.paths = [
      // 중앙 대전당 (큰 사각형)
      { x: 900,  y: 650, w: 1400, h: 850 },

      // 상단 제단으로 가는 중앙 통로
      { x: 1350, y: 350, w: 500,  h: 320 },

      // 좌측 wing (광신도 구역)
      { x: 250,  y: 500, w: 600,  h: 1200 },
      // 좌측 → 중앙 연결 통로
      { x: 750,  y: 800, w: 200,  h: 400 },

      // 우측 wing (의식 구역)
      { x: 2350, y: 500, w: 600,  h: 1200 },
      // 우측 → 중앙 연결 통로
      { x: 2250, y: 800, w: 200,  h: 400 },

      // 하단 금서고로 가는 통로
      { x: 1100, y: 1450, w: 1000, h: 250 },

      // 좌측 하단 연결
      { x: 400,  y: 1400, w: 250,  h: 300 },
      // 우측 하단 연결
      { x: 2550, y: 1400, w: 250,  h: 300 },
    ];

    // ==================== 존 (입장 가능한 영역) ====================
    this.zones = [
      { 
        id: 'main-altar', 
        label: '🩸 중앙 대제단', 
        x: 1470, y: 420, w: 260, h: 180, 
        color: '#9f1239', lc: '#4c1d95' 
      },
      { 
        id: 'upgrade-room', 
        label: '⚒️ 업그레이드 제실', 
        x: 380,  y: 820, w: 220, h: 160, 
        color: '#6b21a8', lc: '#3b0764' 
      },
      { 
        id: 'skill-room', 
        label: '✨ 금단의 스킬실', 
        x: 2600, y: 820, w: 220, h: 160, 
        color: '#c026d3', lc: '#581c87' 
      },
      { 
        id: 'forbidden-library', 
        label: '📜 금서 도서관', 
        x: 1350, y: 1620, w: 260, h: 160, 
        color: '#4338ca', lc: '#1e1b4b' 
      },
      { 
        id: 'return', 
        label: '🔙 마을로 귀환', 
        x: 1450, y: 250, w: 300, h: 100, 
        color: '#64748b', lc: '#334155' 
      },
    ];

    // ==================== NPC ====================
    this.npcs = [
      { id: 'cult-priest',    label: '🩸 대사제',       x: 1600, y: 720, w: 70, h: 70, color: '#b91c1c' },
      { id: 'cult-fanatic1',  label: '🗣️ 속삭이는 자',        x: 450,  y: 1050, w: 55, h: 55, color: '#7c3aed' },
      { id: 'cult-fanatic2',  label: '피의 기사',        x: 2650, y: 1050, w: 55, h: 55, color: '#7c3aed' },
      { id: 'cult-whisperer', label: '금단의 학자',   x: 1250, y: 1600, w: 60, h: 60, color: '#a855f7' },
      { id: 'cult-eyes',      label: '👁️ 관찰자',        x: 1950, y: 700, w: 65, h: 65, color: '#f43f5e' },
    ];
  }

  draw(ctx, camX, camY, vw, vh) {
    // 매우 어두운 배경
    ctx.fillStyle = '#0a001f';
    ctx.fillRect(0, 0, vw, vh);

    // 이동 가능한 바닥
    for (const p of this.paths) {
      ctx.fillStyle = '#241a38';
      ctx.fillRect(p.x - camX, p.y - camY, p.w, p.h);
      
      ctx.strokeStyle = '#3f2a6b';
      ctx.lineWidth = 8;
      ctx.strokeRect(p.x - camX, p.y - camY, p.w, p.h);
    }

    // 존 그리기
    for (const z of this.zones) {
      const sx = z.x - camX;
      const sy = z.y - camY;

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 5;
      ctx.strokeRect(sx, sy, z.w, z.h);

      ctx.fillStyle = '#ffeeee';
      ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2 + 5);
    }

    // NPC 그리기
    for (const npc of this.npcs) {
      const sx = npc.x - camX;
      const sy = npc.y - camY;

      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, npc.w, npc.h);

      ctx.fillStyle = '#fff';
      ctx.font = "13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 25);
    }
  }
}