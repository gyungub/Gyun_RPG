// librarymap.js - 금서 도서관

class ForbiddenLibrary extends GameMap {
  constructor() {
    super();
    this.mapId = 'library';
    this.width = 2400;
    this.height = 2800;

    this.distortionPhase = 0;
    this.floatingTexts = [];
    this.floatingTextTimer = 0;

    this.spookyLines = [
      "읽지 말았어야 했다.",
      "이건 기록이 아니다.",
      "누가 쓰고 있는가?",
      "이 페이지는 끝이 없다.",
      "넌 이미 읽혔다.",
      "금지된 것에는 이유가 있다.",
      "돌아가라.",
      "...보고 있다.",
    ];

    this.initLibrary();
  }

  initLibrary() {
    this.paths = [
      // 입구 홀 (안전지대)
      { x: 700,  y: 100,  w: 1000, h: 500 },

      // 입구 → 열람실 통로
      { x: 1100, y: 550,  w: 200,  h: 200 },

      // 금서 열람실 (중앙 대형)
      { x: 400,  y: 700,  w: 1600, h: 600 },

      // 열람실 → 왜곡 복도 좌
      { x: 400,  y: 1250, w: 200,  h: 300 },
      // 열람실 → 왜곡 복도 우
      { x: 1800, y: 1250, w: 200,  h: 300 },

      // 왜곡 복도
      { x: 200,  y: 1500, w: 2000, h: 250 },

      // 봉인 구역 진입 통로
      { x: 1100, y: 1700, w: 200,  h: 300 },

      // 봉인 구역
      { x: 500,  y: 1950, w: 1400, h: 700 },
    ];

    this.zones = [
      {
        id: 'lib-return',
        label: '🔙 교단 본부로',
        x: 1000, y: 120, w: 200, h: 100,
        color: '#334155', lc: '#1e293b'
      },
      {
        id: 'lib-reading-room',
        label: '📖 금서 열람실 입장',
        x: 1050, y: 750, w: 300, h: 100,
        color: '#1e1b4b', lc: '#312e81'
      },
      {
        id: 'lib-sealed-zone',
        label: '🔒 봉인 구역',
        x: 1050, y: 2050, w: 300, h: 100,
        color: '#0f172a', lc: '#4c1d95'
      },
    ];

    this.npcs = [
      { id: 'lib-archivist',   label: '📚 기록자',       x: 1600, y: 200,  w: 60, h: 60, color: '#3730a3' },
      { id: 'lib-researcher',  label: '🕯️ 금서 연구자',  x: 600,  y: 800,  w: 60, h: 60, color: '#6d28d9' },
      { id: 'lib-lost-reader', label: '🧍 잃어버린 독자', x: 1700, y: 800,  w: 55, h: 55, color: '#4338ca' },
      { id: 'lib-seal-keeper', label: '🗝️ 봉인 관리자',  x: 1180, y: 1870, w: 60, h: 60, color: '#1e3a5f' },
      { id: 'lib-unknown',     label: '???',              x: 1180, y: 2400, w: 60, h: 60, color: '#0f0f1a', hidden: true },
    ];

    // 떠다니는 책들 (열람실 구역)
    this.floatingBooks = [];
    for (let i = 0; i < 20; i++) {
      this.floatingBooks.push({
        x: 420 + Math.random() * 1550,
        y: 720 + Math.random() * 560,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
        size: 14 + Math.random() * 10,
        color: Math.random() > 0.5 ? '#7c3aed' : '#fbbf24',
      });
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.distortionPhase += 0.02;

    // ===== 전체 배경 =====
    ctx.fillStyle = '#06000f';
    ctx.fillRect(0, 0, vw, vh);

    // ===== 구역별 배경 =====
    // 입구 홀
    this._drawGradientZone(ctx, camY, vw, 100, 600, '#0d0520', '#0a001a', vh);
    // 금서 열람실
    this._drawGradientZone(ctx, camY, vw, 700, 600, '#0a0018', '#130630', vh);
    // 왜곡 복도
    this._drawGradientZone(ctx, camY, vw, 1500, 250, '#050010', '#08001a', vh);
    // 봉인 구역
    this._drawGradientZone(ctx, camY, vw, 1950, 700, '#020005', '#04000e', vh);

    // ===== 바닥 그리기 =====
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;

      if (p.y >= 1950) {
        ctx.fillStyle = '#0a0a14';
        ctx.strokeStyle = '#1a0a2e';
      } else if (p.y >= 1500) {
        ctx.fillStyle = '#0e0820';
        ctx.strokeStyle = '#3b1f6b';
      } else if (p.y >= 700) {
        ctx.fillStyle = '#130a35';
        ctx.strokeStyle = '#4c2a8a';
      } else {
        ctx.fillStyle = '#1a1030';
        ctx.strokeStyle = '#3f2a6b';
      }

      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.lineWidth = 5;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // ===== 왜곡 복도 격자 효과 =====
    this._drawDistortionCorridor(ctx, camX, camY, vw, vh);

    // ===== 봉인 구역 룬 =====
    this._drawSealRunes(ctx, camX, camY, vw, vh);

    // ===== 입구 홀 촛불 조명 =====
    this._drawCandleLight(ctx, camX, camY, vw, vh);

    // ===== 떠다니는 책 =====
    this._drawFloatingBooks(ctx, camX, camY, vw, vh);

    // ===== 구역 구분 레이블 =====
    this._drawSectionLabel(ctx, camY, vw, '— 입구 홀 —',    100,  '#4338ca', vh);
    this._drawSectionLabel(ctx, camY, vw, '〔 금서 열람실 〕', 700,  '#6d28d9', vh);
    this._drawSectionLabel(ctx, camY, vw, '≋ 왜곡 복도 ≋',  1500, '#3b0764', vh);
    this._drawSectionLabel(ctx, camY, vw, '▓ 봉인 구역 ▓',  1950, '#1e1b4b', vh);

    // ===== 존 그리기 =====
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      if (sx > vw || sy > vh || sx + z.w < 0 || sy + z.h < 0) continue;

      const pulse = 0.75 + Math.sin(this.distortionPhase * 2) * 0.15;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, z.w, z.h);

      ctx.fillStyle = z.id === 'lib-sealed-zone' ? '#a78bfa' : '#fff';
      ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
    }

    // ===== NPC 그리기 =====
    for (const npc of this.npcs) {
      if (npc.hidden) continue;
      const sx = npc.x - camX, sy = npc.y - camY;
      if (sx > vw || sy > vh || sx + npc.w < 0 || sy + npc.h < 0) continue;

      const alpha = 0.7 + Math.sin(this.distortionPhase * 1.5 + npc.x * 0.01) * 0.3;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);

      ctx.fillStyle = '#ddd6fe';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(npc.label, sx + npc.w / 2, sy + npc.h + 18);
    }

    // ===== 스푸키 텍스트 =====
    this._updateFloatingTexts(ctx, camX, camY, vw, vh);

    // ===== 맵 테두리 =====
    ctx.strokeStyle = '#1a0a2e';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }

  _drawGradientZone(ctx, camY, vw, worldY, h, colorTop, colorBot, vh) {
    const sy = worldY - camY;
    if (sy > vh || sy + h < 0) return;
    const grad = ctx.createLinearGradient(0, sy, 0, sy + h);
    grad.addColorStop(0, colorTop);
    grad.addColorStop(1, colorBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, sy, vw, h);
  }

  _drawDistortionCorridor(ctx, camX, camY, vw, vh) {
    const sy = 1500 - camY;
    if (sy > vh + 50 || sy + 250 < -50) return;
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = (this.distortionPhase * 15) % gridSize;
    for (let gx = 0; gx < vw + gridSize; gx += gridSize) {
      const dx = Math.sin((gx + this.distortionPhase * 30) * 0.05) * 10;
      ctx.beginPath();
      ctx.moveTo(gx + dx, sy);
      ctx.lineTo(gx + dx, sy + 250);
      ctx.stroke();
    }
    for (let gy = sy; gy < sy + 250; gy += gridSize) {
      const dy = Math.cos((gy + this.distortionPhase * 20) * 0.05) * 8;
      ctx.beginPath();
      ctx.moveTo(0, gy + dy - offset);
      ctx.lineTo(vw, gy + dy - offset);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawSealRunes(ctx, camX, camY, vw, vh) {
    const cx = 1200 - camX, cy = 2300 - camY;
    if (cx < -300 || cx > vw + 300 || cy < -300 || cy > vh + 300) return;
    ctx.save();
    for (let r = 0; r < 3; r++) {
      const radius = 100 + r * 70;
      const rot = this.distortionPhase * (r % 2 === 0 ? 0.25 : -0.18);
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = r === 0 ? '#7c3aed' : r === 1 ? '#4338ca' : '#1e1b4b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = ctx.strokeStyle;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + rot;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawCandleLight(ctx, camX, camY, vw, vh) {
    const cx = 1200 - camX, cy = 350 - camY;
    if (cy < -400 || cy > vh + 400) return;
    ctx.save();
    const flicker = 0.07 + Math.sin(this.distortionPhase * 3) * 0.02;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
    grad.addColorStop(0, `rgba(251,191,36,${flicker})`);
    grad.addColorStop(0.5, `rgba(124,58,237,${flicker * 0.4})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vw, vh);
    ctx.restore();
  }

  _drawFloatingBooks(ctx, camX, camY, vw, vh) {
    for (const book of this.floatingBooks) {
      book.phase += book.speed * 0.02;
      const bx = book.x - camX + Math.sin(book.phase) * 18;
      const by = book.y - camY + Math.cos(book.phase * 0.7) * 12;
      if (bx < -30 || bx > vw + 30 || by < -30 || by > vh + 30) continue;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.sin(book.phase * 0.5) * 0.3);
      ctx.globalAlpha = 0.5 + Math.sin(book.phase) * 0.2;
      ctx.fillStyle = book.color;
      ctx.fillRect(-book.size / 2, -book.size * 0.35, book.size, book.size * 0.7);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-book.size / 2, -book.size * 0.35, book.size, book.size * 0.7);
      ctx.restore();
    }
  }

  _drawSectionLabel(ctx, camY, vw, text, worldY, color, vh) {
    const sy = worldY - camY;
    if (sy < -20 || sy > vh + 20) return;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, sy); ctx.lineTo(vw, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.75;
    ctx.fillText(text, vw / 2, sy + 18);
    ctx.restore();
  }

  _updateFloatingTexts(ctx, camX, camY, vw, vh) {
    this.floatingTextTimer++;
    // 150프레임마다 텍스트 등장 (열람실~봉인 구역에서만)
    if (this.floatingTextTimer >= 150) {
      this.floatingTextTimer = 0;
      const worldY = 700 + Math.random() * 1950;
      const sy = worldY - camY;
      if (sy > 0 && sy < vh) {
        this.floatingTexts.push({
          text: this.spookyLines[Math.floor(Math.random() * this.spookyLines.length)],
          x: 80 + Math.random() * (vw - 160),
          y: sy,
          life: 200,
          maxLife: 200,
          color: Math.random() > 0.5 ? '#a78bfa' : '#fbbf24',
        });
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.25;
      t.life--;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }

      const alpha = t.life < 40 ? t.life / 40 : t.life > t.maxLife - 30 ? (t.maxLife - t.life) / 30 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillStyle = t.color;
      ctx.font = "italic bold 14px 'Noto Sans KR', serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillText(`"${t.text}"`, t.x, t.y);
      ctx.restore();
    }
  }

  // ??? NPC 등장
  revealUnknownNPC() {
    const unknown = this.npcs.find(n => n.id === 'lib-unknown');
    if (unknown) unknown.hidden = false;
  }
}