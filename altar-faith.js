class AltarFaithDepth extends GameMap {
  constructor() {
    super();
    this.mapId = 'altar-faith';
    this.width = 2200;
    this.height = 1800;

    this.phase = 0;
    this.messageTimer = 0;
    this.messageTitle = '';
    this.messageLines = [];
    this.floatingTexts = [];
    this.whispers = [];
    this.whisperTimer = 0;
    this.spores = [];
    this.dizziness = 0;
    this.uiShiftTimer = 0;
    this.revelationSeen = false;
    this.finalLineTimer = 0;

    this._init();
  }

  _init() {
    this.paths = [
      { x: 180, y: 180, w: 1840, h: 1420 },
      { x: 980, y: 50, w: 240, h: 220 },
      { x: 910, y: 1220, w: 380, h: 230 },
    ];

    this.zones = [
      {
        id: 'altar-depth-return',
        label: '중앙 대제단으로',
        x: 960, y: 90, w: 280, h: 90,
        color: '#475569', lc: '#1e293b',
      },
      {
        id: 'faith-hymn-left',
        label: '찬송 벽',
        x: 285, y: 470, w: 170, h: 520,
        color: 'rgba(245, 158, 11, 0.18)', lc: '#7c2d12',
        hidden: true,
      },
      {
        id: 'faith-hymn-right',
        label: '찬송 벽',
        x: 1745, y: 470, w: 170, h: 520,
        color: 'rgba(245, 158, 11, 0.18)', lc: '#7c2d12',
        hidden: true,
      },
      {
        id: 'faith-records',
        label: '헌신 기록판',
        x: 430, y: 1210, w: 250, h: 150,
        color: 'rgba(120, 113, 108, 0.22)', lc: '#44403c',
      },
      {
        id: 'faith-revelation',
        label: '계시대',
        x: 930, y: 1250, w: 340, h: 150,
        color: 'rgba(250, 204, 21, 0.24)', lc: '#92400e',
      },
    ];

    this.centralAltar = { x: 1100, y: 760, w: 360, h: 210 };
    this.revelationDevice = { x: 1100, y: 1315, w: 260, h: 140 };
    this.recordBoard = { x: 555, y: 1285, w: 200, h: 110 };

    this.devotees = [];
    for (let row = 0; row < 5; row++) {
      this.devotees.push({ x: 760, y: 580 + row * 145, side: -1, phase: row * 0.7 });
      this.devotees.push({ x: 1440, y: 580 + row * 145, side: 1, phase: row * 0.7 });
    }

    this.mycelium = [];
    for (let i = 0; i < 18; i++) {
      this.mycelium.push({
        x: 270 + i * 95,
        y: 180,
        len: 120 + Math.random() * 170,
        sway: Math.random() * Math.PI * 2,
      });
    }

    this.hymnSets = [
      [
        '받아들여라.',
        '의심하지 말라.',
        '심연은 자비롭다.',
      ],
      [
        '받아들여라.',
        '의심은 불순물이다.',
        '심연은 너를 안정화한다.',
      ],
      [
        '받아들여라.',
        '자아는 제거될수록 순수해진다.',
        '복종은 평온으로 이어진다.',
      ],
    ];

    this.recordLines = [
      '윤 서린  | 자아 소거 완료',
      '한 민재  | 복종 안정화',
      '도 하경  | 수용 적합',
      '서 유안  | 자아 소거 완료',
    ];

    this.whisperPool = [
      '찬송은 위로가 아니다.',
      '기도가 아니라 조율이다.',
      '모두 같은 리듬으로 숨 쉰다.',
      '편안함은 순응의 다른 이름이다.',
      '계시는 한 번도 내려온 적 없다.',
    ];
  }

  _zoneVisible(zone) {
    return zone.id === 'altar-depth-return' || zone.id === 'faith-records' || zone.id === 'faith-revelation';
  }

  _setMessage(title, lines, time = 220) {
    this.messageTitle = title;
    this.messageLines = Array.isArray(lines) ? lines : [lines];
    this.messageTimer = time;
  }

  _addFloatingText(text, color = '#f8fafc', x = 1100, y = 930) {
    this.floatingTexts.push({ text, color, x, y, life: 120, maxLife: 120 });
  }

  _spawnSpore() {
    if (this.spores.length > 120 || Math.random() > 0.55) return;
    this.spores.push({
      x: 240 + Math.random() * 1720,
      y: 240 + Math.random() * 1260,
      r: 1 + Math.random() * 2.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.12 - Math.random() * 0.18,
      life: 1,
      decay: 0.003 + Math.random() * 0.003,
      color: Math.random() < 0.7 ? '#fcd34d' : '#fde68a',
    });
  }

  _updateSpores() {
    this._spawnSpore();
    for (let i = this.spores.length - 1; i >= 0; i--) {
      const s = this.spores[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;
      s.x += Math.sin(this.phase * 1.3 + i) * 0.05;
      if (s.life <= 0) this.spores.splice(i, 1);
    }
  }

  _updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life--;
      t.y -= 0.35;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  _updateWhispers() {
    this.whisperTimer++;
    const nearDevice = typeof player !== 'undefined'
      ? Math.hypot(player.cx - this.revelationDevice.x, player.cy - this.revelationDevice.y) < 280
      : false;

    if (nearDevice) {
      this.dizziness = Math.min(50, this.dizziness + 1);
      if (this.whisperTimer >= 90) {
        this.whisperTimer = 0;
        const text = this.whisperPool[Math.floor(Math.random() * this.whisperPool.length)];
        this.whispers.push({
          text,
          x: 110 + Math.random() * 980,
          y: 110 + Math.random() * 240,
          life: 140,
          maxLife: 140,
          color: Math.random() < 0.5 ? '#fef3c7' : '#fde68a',
        });
      }
      if (this.uiShiftTimer < 45) this.uiShiftTimer = 45;
    } else {
      this.dizziness = Math.max(0, this.dizziness - 2);
    }

    if (this.uiShiftTimer > 0) this.uiShiftTimer--;

    for (let i = this.whispers.length - 1; i >= 0; i--) {
      const w = this.whispers[i];
      w.life--;
      w.y += Math.sin(this.phase * 1.5 + i) * 0.15;
      if (w.life <= 0) this.whispers.splice(i, 1);
    }

    if (this.messageTimer > 0) this.messageTimer--;
    if (this.finalLineTimer > 0) this.finalLineTimer--;
  }

  _currentHymnSet() {
    const t = Math.floor(this.phase / 9) % this.hymnSets.length;
    return this.hymnSets[t];
  }

  interact(player) {
    const playerW = player.w || 40;
    const playerH = player.h || 40;

    for (const z of this.zones) {
      if (
        player.x + playerW > z.x - 42 &&
        player.x < z.x + z.w + 42 &&
        player.y + playerH > z.y - 42 &&
        player.y < z.y + z.h + 42
      ) {
        this._triggerZone(z.id);
        return;
      }
    }

    if (Math.abs(player.cx - this.centralAltar.x) < 260 && Math.abs(player.cy - this.centralAltar.y) < 180) {
      this._setMessage('기도 제단', [
        '향 냄새를 닮은 포자 냄새가 천천히 폐를 채운다.',
        '너무 조용해서, 이곳의 평온함이 오히려 불쾌하다.',
      ]);
      return;
    }

    this._setMessage('신앙의 심부', [
      '기도와 찬송으로 보이지만,',
      '여긴 믿음을 증명하는 곳이 아니라 만들어내는 곳이다.',
    ]);
  }

  _triggerZone(id) {
    if (id === 'altar-depth-return') {
      if (window.changeMap) changeMap('centralaltar');
      return;
    }

    if (id === 'faith-hymn-left' || id === 'faith-hymn-right') {
      const hymn = this._currentHymnSet();
      this._setMessage('찬송 벽', hymn);
      this._addFloatingText('문장이 미세하게 바뀐다.', '#fef3c7', 1100, 320);
      return;
    }

    if (id === 'faith-records') {
      this._setMessage('헌신 기록판', this.recordLines);
      this._addFloatingText('신앙이 아니라 교정 절차다.', '#fca5a5', this.recordBoard.x, this.recordBoard.y - 60);
      return;
    }

    if (id === 'faith-revelation') {
      this.uiShiftTimer = 150;
      this.dizziness = 50;
      this._addFloatingText('HP -> 헌신도', '#fde68a', 1000, 220);
      this._addFloatingText('EXP -> 수용도', '#fde68a', 1200, 260);
      this._setMessage('계시대', [
        '빛과 음파와 포자가 같은 문장을 밀어 넣는다.',
        '계시는 신의 목소리가 아니라 공통 환각의 주입이다.',
      ], 260);

      if (!this.revelationSeen) {
        this.revelationSeen = true;
        this.finalLineTimer = 320;
      }
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateSpores();
    this._updateFloatingTexts();
    this._updateWhispers();

    const wobbleX = this.dizziness > 0 ? Math.sin(this.phase * 6) * (this.dizziness * 0.12) : 0;
    const wobbleY = this.dizziness > 0 ? Math.cos(this.phase * 5) * (this.dizziness * 0.08) : 0;

    ctx.save();
    ctx.translate(wobbleX, wobbleY);

    ctx.fillStyle = '#110c08';
    ctx.fillRect(0, 0, vw, vh);

    const glow = ctx.createRadialGradient(vw / 2, vh * 0.32, 0, vw / 2, vh / 2, Math.max(vw, vh) * 0.95);
    glow.addColorStop(0, `rgba(245, 158, 11, ${0.18 + Math.sin(this.phase) * 0.03})`);
    glow.addColorStop(0.45, 'rgba(217, 119, 6, 0.07)');
    glow.addColorStop(0.78, 'rgba(15, 23, 42, 0.10)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, vw, vh);

    for (const p of this.paths) {
      const sx = p.x - camX;
      const sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#22160d';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#6b4f2a';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    for (let i = 0; i < 8; i++) {
      const y = 360 + i * 140 - camY;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 244, 214, 0.035)' : 'rgba(120, 53, 15, 0.06)';
      ctx.fillRect(300 - camX, y, 1600, 42);
    }

    for (const strand of this.mycelium) {
      const sx = strand.x - camX;
      const sy = strand.y - camY;
      const sway = Math.sin(this.phase * 1.2 + strand.sway) * 14;
      ctx.save();
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + sway, sy + strand.len * 0.45, sx + sway * 0.55, sy + strand.len);
      ctx.stroke();
      ctx.fillStyle = 'rgba(254, 243, 199, 0.5)';
      ctx.beginPath();
      ctx.arc(sx + sway * 0.55, sy + strand.len, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const altarX = this.centralAltar.x - camX;
    const altarY = this.centralAltar.y - camY;
    ctx.save();
    ctx.fillStyle = '#3f2b16';
    ctx.fillRect(altarX - 180, altarY - 46, 360, 92);
    ctx.strokeStyle = '#d6a561';
    ctx.lineWidth = 3;
    ctx.strokeRect(altarX - 180, altarY - 46, 360, 92);

    const halo = ctx.createRadialGradient(altarX, altarY - 35, 10, altarX, altarY - 35, 170);
    halo.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    halo.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(altarX - 220, altarY - 220, 440, 320);

    for (let c = 0; c < 5; c++) {
      const cx = altarX - 120 + c * 60;
      const flame = 12 + Math.sin(this.phase * 3 + c) * 4;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx, altarY - 76, 8, flame, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7ed';
      ctx.beginPath();
      ctx.ellipse(cx, altarY - 74, 3, flame * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const hymn = this._currentHymnSet();
    this._drawHymnWall(ctx, 370 - camX, 500 - camY, hymn, 'left');
    this._drawHymnWall(ctx, 1830 - camX, 500 - camY, hymn, 'right');
    this._drawRecords(ctx, this.recordBoard.x - camX, this.recordBoard.y - camY);
    this._drawRevelationDevice(ctx, this.revelationDevice.x - camX, this.revelationDevice.y - camY);

    for (const devotee of this.devotees) {
      this._drawDevotee(ctx, devotee.x - camX, devotee.y - camY, devotee.side, devotee.phase);
    }

    for (const s of this.spores) {
      const px = s.x - camX;
      const py = s.y - camY;
      if (px < -40 || px > vw + 40 || py < -40 || py > vh + 40) continue;
      ctx.save();
      ctx.globalAlpha = s.life * 0.6;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const z of this.zones) {
      if (!this._zoneVisible(z)) continue;
      const sx = z.x - camX;
      const sy = z.y - camY;
      ctx.globalAlpha = 0.78 + Math.sin(this.phase * 1.5 + z.x * 0.002) * 0.08;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#f8fafc';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
      ctx.textBaseline = 'alphabetic';
    }

    for (let i = 0; i < this.whispers.length; i++) {
      const w = this.whispers[i];
      const a = w.life < 35 ? w.life / 35 : w.life > w.maxLife - 20 ? (w.maxLife - w.life) / 20 : 1;
      ctx.save();
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = w.color;
      ctx.font = "italic bold 18px 'Noto Sans KR', serif";
      ctx.textAlign = 'left';
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 12;
      ctx.fillText(`\"${w.text}\"`, w.x, w.y);
      ctx.restore();
    }

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      const a = t.life < 35 ? t.life / 35 : t.life > t.maxLife - 20 ? (t.maxLife - t.life) / 20 : 1;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = t.color;
      ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
      ctx.fillText(t.text, t.x - camX, t.y - camY);
      ctx.restore();
    }

    if (this.uiShiftTimer > 0) {
      const alpha = Math.min(0.9, this.uiShiftTimer / 150);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(10, 10, 12, 0.72)';
      ctx.fillRect(vw - 240, 112, 190, 68);
      ctx.strokeStyle = '#fcd34d';
      ctx.lineWidth = 2;
      ctx.strokeRect(vw - 240, 112, 190, 68);
      ctx.fillStyle = '#fde68a';
      ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText('헌신도', vw - 222, 138);
      ctx.fillText('수용도', vw - 222, 162);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(12, 60, 270, 36);
    ctx.fillStyle = '#fef3c7';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('신앙의 심부', 24, 78);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();

    if (this.messageTimer > 0) this._drawMessagePanel(ctx, vw, vh);
    if (this.finalLineTimer > 0) this._drawFinalLine(ctx, vw, vh);

    if (this.dizziness > 0) {
      const vignette = ctx.createRadialGradient(vw / 2, vh / 2, vh * 0.2, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, `rgba(75, 29, 10, ${Math.min(0.35, this.dizziness / 160)})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, vw, vh);
    }

    ctx.strokeStyle = '#2f1f0f';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
    ctx.restore();
  }

  _drawHymnWall(ctx, x, y, lines, side) {
    ctx.save();
    ctx.fillStyle = '#2a1d12';
    ctx.fillRect(x - 90, y - 40, 180, 520);
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 90, y - 40, 180, 520);

    ctx.fillStyle = '#fef3c7';
    ctx.font = "bold 18px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    for (let i = 0; i < lines.length; i++) {
      const wave = Math.sin(this.phase * 1.7 + i + (side === 'left' ? 0 : 1.3)) * 2;
      ctx.globalAlpha = 0.78 + i * 0.04;
      ctx.fillText(lines[i], x, y + i * 88 + wave);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawDevotee(ctx, x, y, side, seed) {
    const breath = Math.sin(this.phase * 3.2 + seed) * 4;
    const headLift = Math.max(0, Math.sin(this.phase * 2.4 + seed * 0.5)) * 6;

    ctx.save();
    ctx.translate(x, y + breath);
    ctx.fillStyle = '#1c1510';
    ctx.beginPath();
    ctx.ellipse(0, 34, 34, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a2a1c';
    ctx.beginPath();
    ctx.moveTo(-30, 20);
    ctx.quadraticCurveTo(0, -18 - headLift, 30, 20);
    ctx.lineTo(16, 62);
    ctx.lineTo(-16, 62);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f3e2b8';
    ctx.beginPath();
    ctx.arc(0, -4 - headLift, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 243, 199, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(side * 16, 34);
    ctx.stroke();
    ctx.restore();
  }

  _drawRevelationDevice(ctx, x, y) {
    const pulse = 0.55 + Math.sin(this.phase * 2.5) * 0.08;
    ctx.save();
    ctx.fillStyle = '#3a2208';
    ctx.fillRect(x - 130, y - 42, 260, 84);
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 130, y - 42, 260, 84);

    const beam = ctx.createRadialGradient(x, y - 36, 15, x, y - 36, 160);
    beam.addColorStop(0, `rgba(253, 224, 71, ${pulse})`);
    beam.addColorStop(0.5, 'rgba(251, 191, 36, 0.18)');
    beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(x - 220, y - 240, 440, 320);

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(x, y - 34, 22, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 243, 199, 0.65)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const off = -90 + i * 36;
      ctx.beginPath();
      ctx.moveTo(x + off, y + 40);
      ctx.quadraticCurveTo(x + off * 0.6, y - 8, x, y - 34);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawRecords(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#2b2119';
    ctx.fillRect(x - 100, y - 55, 200, 110);
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 100, y - 55, 200, 110);
    ctx.fillStyle = '#d6d3d1';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      ctx.fillText(this.recordLines[i], x - 84, y - 22 + i * 24);
    }
    ctx.restore();
  }

  _drawMessagePanel(ctx, vw, vh) {
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = 'rgba(10, 8, 6, 0.92)';
    ctx.fillRect(vw / 2 - 270, vh - 220, 540, 150);
    ctx.strokeStyle = '#d6a561';
    ctx.lineWidth = 2;
    ctx.strokeRect(vw / 2 - 270, vh - 220, 540, 150);

    ctx.fillStyle = '#fde68a';
    ctx.font = "bold 18px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(this.messageTitle, vw / 2 - 240, vh - 186);

    ctx.fillStyle = '#f8fafc';
    ctx.font = "14px 'Noto Sans KR', sans-serif";
    for (let i = 0; i < this.messageLines.length; i++) {
      ctx.fillText(this.messageLines[i], vw / 2 - 240, vh - 148 + i * 28);
    }
    ctx.restore();
  }

  _drawFinalLine(ctx, vw, vh) {
    const progress = 1 - this.finalLineTimer / 320;
    const line1 = '그들은 믿는 것이 아니다.';
    const line2 = '그렇게 믿도록 설계되었을 뿐이다.';

    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(vw / 2 - 340, 118, 680, 96);
    ctx.fillStyle = '#fff7ed';
    ctx.font = "bold 26px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(line1, vw / 2, 154);
    if (progress > 0.42) {
      ctx.globalAlpha = Math.min(1, (progress - 0.42) * 2.2);
      ctx.fillStyle = '#fca5a5';
      ctx.font = "bold 28px 'Noto Sans KR', sans-serif";
      ctx.fillText(line2, vw / 2, 192);
    }
    ctx.restore();
  }
}
