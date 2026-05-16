// sealedroom.js - 봉인 구역

class SealedRoom extends GameMap {
  constructor() {
    super();
    this.mapId = 'sealedroom';
    this.width = 2000;
    this.height = 1800;

    this.distortionPhase = 0;
    this.unknownSpawned = false;
    this.unknownSpawnTimer = 0;
    this.screenFlicker = 0;
    this.glitchTextTimer = 0;
    this.glitchLines = [];

    this.glitchPool = [
      "왜 열었지?",
      "돌아가.",
      "경고했다.",
      "읽지 마.",
      "너는 준비가 안 됐다.",
      "이미 봤다.",
      "...",
      "균이 깨어난다.",
      "봉인이 약해지고 있다.",
    ];

    this.initSealedRoom();
  }

  initSealedRoom() {
    this.paths = [
      // 입구 통로
      { x: 850,  y: 50,   w: 300,  h: 200 },
      // 메인 봉인 구역
      { x: 200,  y: 200,  w: 1600, h: 1400 },
    ];

    this.zones = [
      {
        id: 'sealed-return',
        label: '🔙 도서관으로',
        x: 875, y: 60, w: 250, h: 80,
        color: '#1e293b', lc: '#0f172a'
      },
    ];

    this.npcs = [
      {
        id: 'lib-unknown',
        label: '???',
        x: 950, y: 900, w: 60, h: 60,
        color: '#0f0f1a',
        hidden: true,
      },
    ];

    // ===== 봉인 오브젝트들 =====
    this.sealObjects = [
      // 쇠사슬 묶인 책
      { type: 'book',  x: 400,  y: 400,  w: 70, h: 90,  sealed: true,  phase: 0.0 },
      { type: 'book',  x: 750,  y: 600,  w: 60, h: 80,  sealed: true,  phase: 1.2 },
      { type: 'book',  x: 1300, y: 450,  w: 80, h: 100, sealed: true,  phase: 2.4 },
      { type: 'book',  x: 1550, y: 700,  w: 65, h: 85,  sealed: true,  phase: 0.8 },
      { type: 'book',  x: 500,  y: 900,  w: 70, h: 90,  sealed: true,  phase: 1.8 },
      { type: 'book',  x: 1100, y: 1100, w: 75, h: 95,  sealed: true,  phase: 3.0 },
      { type: 'book',  x: 1450, y: 1000, w: 60, h: 80,  sealed: true,  phase: 2.0 },

      // 봉인된 문
      { type: 'door',  x: 870,  y: 1350, w: 260, h: 180, sealed: true, phase: 0.5 },

      // 금지 문양 (장식)
      { type: 'rune',  x: 500,  y: 1200, r: 60,  phase: 1.0 },
      { type: 'rune',  x: 1000, y: 700,  r: 80,  phase: 2.2 },
      { type: 'rune',  x: 1500, y: 1200, r: 55,  phase: 0.3 },
    ];

    // 바닥 금지 문장
    this.floorTexts = [
      { x: 500,  y: 1500, text: "접근 금지",         alpha: 0.25 },
      { x: 1000, y: 400,  text: "봉인된 자의 영역",  alpha: 0.20 },
      { x: 1500, y: 1500, text: "열지 마라",         alpha: 0.22 },
      { x: 350,  y: 700,  text: "경고",              alpha: 0.30 },
      { x: 1650, y: 900,  text: "금지",              alpha: 0.28 },
      { x: 1000, y: 1300, text: "돌아가라",          alpha: 0.18 },
    ];
  }

  // ??? NPC 등장
  triggerUnknown() {
    if (this.unknownSpawned) return;
    this.unknownSpawned = true;
    const npc = this.npcs.find(n => n.id === 'lib-unknown');
    if (npc) npc.hidden = false;

    // 화면 깜빡임 + 글리치 텍스트
    this.screenFlicker = 90;
    this._addGlitchLine("왜 열었지?");
  }

  _addGlitchLine(text) {
    this.glitchLines.push({
      text,
      x: 200 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      life: 200,
      maxLife: 200,
      color: Math.random() > 0.5 ? '#dc2626' : '#fff',
      glitch: true,
    });
  }

  draw(ctx, camX, camY, vw, vh) {
    this.distortionPhase += 0.018;

    // ??? 등장 타이머 (입장 후 5초)
    if (!this.unknownSpawned) {
      this.unknownSpawnTimer++;
      if (this.unknownSpawnTimer >= 300) {
        this.triggerUnknown();
      }
    }

    // 글리치 텍스트 랜덤 생성
    this.glitchTextTimer++;
    if (this.glitchTextTimer >= 240 && this.unknownSpawned) {
      this.glitchTextTimer = 0;
      this._addGlitchLine(this.glitchPool[Math.floor(Math.random() * this.glitchPool.length)]);
    }

    // 화면 깜빡임
    if (this.screenFlicker > 0) {
      this.screenFlicker--;
      if (Math.random() < 0.4) {
        ctx.fillStyle = 'rgba(220,38,38,0.12)';
        ctx.fillRect(0, 0, vw, vh);
      }
    }

    // ===== 배경 — 거의 완전한 어둠 =====
    ctx.fillStyle = '#020005';
    ctx.fillRect(0, 0, vw, vh);

    // 붉은 안개 (중앙)
    const fogGrad = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.6);
    fogGrad.addColorStop(0, 'rgba(100,0,0,0.08)');
    fogGrad.addColorStop(0.5, 'rgba(60,0,0,0.05)');
    fogGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, vw, vh);

    // ===== 바닥 =====
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#08000f';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#1a0a1a';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // ===== 바닥 금지 문장 =====
    for (const ft of this.floorTexts) {
      const fx = ft.x - camX, fy = ft.y - camY;
      if (fx < -200 || fx > vw + 200 || fy < -30 || fy > vh + 30) continue;
      const flicker = ft.alpha + Math.sin(this.distortionPhase * 0.8 + ft.x * 0.01) * 0.06;
      ctx.save();
      ctx.globalAlpha = Math.max(0, flicker);
      ctx.fillStyle = '#dc2626';
      ctx.font = "bold italic 16px 'Noto Sans KR', serif";
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, fx, fy);
      ctx.restore();
    }

    // ===== 봉인 오브젝트 =====
    for (const obj of this.sealObjects) {
      obj.phase += 0.015;
      if (obj.type === 'book') this._drawSealedBook(ctx, obj, camX, camY);
      else if (obj.type === 'door') this._drawSealedDoor(ctx, obj, camX, camY);
      else if (obj.type === 'rune') this._drawRune(ctx, obj, camX, camY);
    }

    // ===== 중앙 대형 룬 문양 =====
    this._drawCenterRune(ctx, camX, camY, vw, vh);

    // ===== 존 그리기 =====
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      if (sx > vw || sy > vh || sx + z.w < 0 || sy + z.h < 0) continue;
      ctx.globalAlpha = 0.7 + Math.sin(this.distortionPhase) * 0.1;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#94a3b8';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
    }

    // ===== ??? NPC =====
    for (const npc of this.npcs) {
      if (npc.hidden) continue;
      const sx = npc.x - camX, sy = npc.y - camY;
      if (sx > vw || sy > vh || sx + npc.w < 0 || sy + npc.h < 0) continue;

      // 깜빡이는 효과
      const alpha = 0.5 + Math.sin(this.distortionPhase * 3) * 0.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#fca5a5';
      ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(npc.label, sx + npc.w / 2, sy + npc.h + 18);
      ctx.restore();
    }

    // ===== 글리치 텍스트 =====
    this._drawGlitchTexts(ctx, vw, vh);

    // ===== 맵 테두리 =====
    ctx.strokeStyle = '#0a0010';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }

  _drawSealedBook(ctx, obj, camX, camY) {
    const sx = obj.x - camX, sy = obj.y - camY;
    if (sx > 9999 || sy > 9999 || sx + obj.w < -100 || sy + obj.h < -100) return;

    const wobble = Math.sin(obj.phase) * 3;

    ctx.save();
    ctx.translate(sx + obj.w / 2, sy + obj.h / 2 + wobble);

    // 글로우
    ctx.shadowColor = '#7f1d1d';
    ctx.shadowBlur = 12 + Math.sin(obj.phase * 2) * 4;

    // 책 본체
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#1a0505';
    ctx.fillRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

    // 쇠사슬 표현 (X자 선)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-obj.w / 2, -obj.h / 2);
    ctx.lineTo(obj.w / 2, obj.h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(obj.w / 2, -obj.h / 2);
    ctx.lineTo(-obj.w / 2, obj.h / 2);
    ctx.stroke();

    // 봉인 아이콘
    ctx.globalAlpha = 0.7;
    ctx.font = `${Math.floor(obj.w * 0.4)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', 0, 0);

    ctx.restore();
  }

  _drawSealedDoor(ctx, obj, camX, camY) {
    const sx = obj.x - camX, sy = obj.y - camY;
    if (sx > 9999 || sy > 9999) return;

    ctx.save();
    ctx.shadowColor = '#7f1d1d';
    ctx.shadowBlur = 20 + Math.sin(obj.phase) * 8;

    // 문 본체
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#0f0005';
    ctx.fillRect(sx, sy, obj.w, obj.h);
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 4;
    ctx.strokeRect(sx, sy, obj.w, obj.h);

    // 문 테두리 장식
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 8, sy + 8, obj.w - 16, obj.h - 16);

    // 봉인 문양
    const cx2 = sx + obj.w / 2, cy2 = sy + obj.h / 2;
    ctx.globalAlpha = 0.5 + Math.sin(obj.phase * 1.5) * 0.2;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx2, cy2, 30, 0, Math.PI * 2);
    ctx.stroke();

    // 봉인 텍스트
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#dc2626';
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('봉인된 문', cx2, sy + obj.h + 20);

    ctx.restore();
  }

  _drawRune(ctx, obj, camX, camY) {
    const cx2 = obj.x - camX, cy2 = obj.y - camY;
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.sin(obj.phase) * 0.05;

    for (let r = 0; r < 2; r++) {
      const radius = obj.r - r * 20;
      if (radius <= 0) continue;
      const rot = this.distortionPhase * (r % 2 === 0 ? 0.2 : -0.15);
      ctx.strokeStyle = r === 0 ? '#dc2626' : '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx2, cy2, radius, 0, Math.PI * 2);
      ctx.stroke();
      // 꼭짓점
      ctx.fillStyle = ctx.strokeStyle;
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i + rot;
        ctx.beginPath();
        ctx.arc(cx2 + Math.cos(angle) * radius, cy2 + Math.sin(angle) * radius, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawCenterRune(ctx, camX, camY, vw, vh) {
    const cx2 = 1000 - camX, cy2 = 900 - camY;
    if (cx2 < -400 || cx2 > vw + 400 || cy2 < -400 || cy2 > vh + 400) return;

    ctx.save();
    for (let r = 0; r < 4; r++) {
      const radius = 80 + r * 60;
      const rot = this.distortionPhase * (r % 2 === 0 ? 0.15 : -0.1);
      ctx.globalAlpha = 0.08 + Math.sin(this.distortionPhase + r) * 0.03;
      ctx.strokeStyle = r < 2 ? '#dc2626' : '#7f1d1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx2, cy2, radius, 0, Math.PI * 2);
      ctx.stroke();

      const pts = r % 2 === 0 ? 6 : 5;
      ctx.fillStyle = ctx.strokeStyle;
      for (let i = 0; i < pts; i++) {
        const angle = (Math.PI * 2 / pts) * i + rot;
        ctx.beginPath();
        ctx.arc(cx2 + Math.cos(angle) * radius, cy2 + Math.sin(angle) * radius, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawGlitchTexts(ctx, vw, vh) {
    for (let i = this.glitchLines.length - 1; i >= 0; i--) {
      const t = this.glitchLines[i];
      t.life--;
      if (t.life <= 0) { this.glitchLines.splice(i, 1); continue; }

      const alpha = t.life < 40 ? t.life / 40 : t.life > t.maxLife - 20 ? (t.maxLife - t.life) / 20 : 1;

      ctx.save();
      ctx.globalAlpha = alpha * 0.9;

      // 글리치 오프셋
      const gx = t.x + (Math.random() - 0.5) * (t.life < 60 ? 8 : 0);
      const gy = t.y;

      ctx.fillStyle = t.color;
      ctx.font = "bold 20px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 15;
      ctx.fillText(t.text, gx, gy);

      // 글리치 복사본
      if (Math.random() < 0.3) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#dc2626';
        ctx.fillText(t.text, gx + 3, gy - 2);
      }
      ctx.restore();
    }
  }
}