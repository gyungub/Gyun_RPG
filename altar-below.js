class AltarBelowDepth extends GameMap {
  constructor() {
    super();
    this.mapId = 'altar-below';
    this.width = 2200;
    this.height = 2200;

    this.phase = 0;
    this.sequence = 'descent';
    this.sequenceTimer = 0;
    this.sequenceInitialized = false;
    this.messageTitle = '';
    this.messageLines = [];
    this.messageTimer = 0;
    this.whispers = [];
    this.whisperTimer = 0;
    this.fragments = [];
    this.approvalGranted = typeof hasTranscendentApproval === 'function'
      ? hasTranscendentApproval()
      : false;
    this.coreTriggered = this.approvalGranted;
    this.finalJobFlash = 0;

    this._init();
  }

  _init() {
    this.paths = [
      { x: 1040, y: 120, w: 120, h: 260 },
      { x: 1020, y: 380, w: 160, h: 230 },
      { x: 990, y: 610, w: 220, h: 260 },
      { x: 930, y: 860, w: 340, h: 260 },
      { x: 760, y: 1120, w: 680, h: 420 },
      { x: 960, y: 1540, w: 280, h: 200 },
    ];

    this.zones = [
      {
        id: 'below-return',
        label: '중앙 대제단으로',
        x: 970, y: 110, w: 260, h: 90,
        color: '#334155', lc: '#0f172a',
      },
      {
        id: 'below-core',
        label: '균의 옥좌',
        x: 900, y: 1180, w: 400, h: 300,
        color: 'rgba(220, 38, 38, 0.18)', lc: '#450a0a',
        hidden: true,
      },
    ];

    this.voidStars = [];
    for (let i = 0; i < 120; i++) {
      this.voidStars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: 0.5 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.ribs = [];
    for (let i = 0; i < 9; i++) {
      this.ribs.push({
        angle: -0.9 + i * 0.23,
        len: 150 + i * 16,
      });
    }
  }

  getZone(px, py, pw, ph) {
    return this.zones.find((z) => {
      if (z.hidden) return false;
      return px < z.x + z.w && px + pw > z.x && py < z.y + z.h && py + ph > z.y;
    }) || null;
  }

  _setMessage(title, lines, time = 220) {
    this.messageTitle = title;
    this.messageLines = Array.isArray(lines) ? lines : [lines];
    this.messageTimer = time;
  }

  _spawnFragment() {
    if (this.fragments.length > 120 || Math.random() > 0.58) return;
    this.fragments.push({
      x: 720 + Math.random() * 760,
      y: 460 + Math.random() * 1100,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.15 - Math.random() * 0.35,
      size: 1 + Math.random() * 2.5,
      life: 1,
      decay: 0.004 + Math.random() * 0.004,
      color: Math.random() < 0.5 ? '#dc2626' : '#a78bfa',
    });
  }

  _updateFragments() {
    this._spawnFragment();
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      f.x += f.vx + Math.sin(this.phase + i) * 0.08;
      f.y += f.vy;
      f.life -= f.decay;
      if (f.life <= 0) this.fragments.splice(i, 1);
    }
  }

  _updateWhispers() {
    this.whisperTimer++;
    if (this.sequence === 'audience' && this.whisperTimer >= 90) {
      this.whisperTimer = 0;
      this.whispers.push({
        text: Math.random() < 0.5 ? '권한이 부여된다.' : '너는 더 이상 따르는 자가 아니다.',
        x: 120 + Math.random() * 960,
        y: 120 + Math.random() * 220,
        life: 140,
        maxLife: 140,
        color: Math.random() < 0.5 ? '#fca5a5' : '#ddd6fe',
      });
    }

    for (let i = this.whispers.length - 1; i >= 0; i--) {
      const w = this.whispers[i];
      w.life--;
      w.y += Math.sin(this.phase * 1.4 + i) * 0.15;
      if (w.life <= 0) this.whispers.splice(i, 1);
    }

    if (this.messageTimer > 0) this.messageTimer--;
    if (this.finalJobFlash > 0) this.finalJobFlash--;
  }

  _ensureSequenceInit() {
    if (this.sequenceInitialized || typeof player === 'undefined') return;
    this.sequenceInitialized = true;
    player.x = 1080;
    player.y = 140;
    this.sequenceTimer = 180;
    this._setMessage('더 아래로', [
      '심연이 문을 여는 대신, 너를 아래로 끌어당긴다.',
      '배경음은 멎고, 발밑의 균열만이 아래를 향해 벌어진다.',
    ], 180);
  }

  _startAudience() {
    this.coreTriggered = true;
    this.sequence = 'audience';
    this.sequenceTimer = 320;
    this._setMessage('균', [
      '세계의 진실을 깨달은 자여.',
      '그대는 이제 나의 힘을 받을 자격이 있다.',
    ], 240);
  }

  _grantApproval() {
    if (this.approvalGranted) return;
    this.approvalGranted = true;
    this.finalJobFlash = 220;
    if (typeof unlockTranscendentBody === 'function') {
      unlockTranscendentBody();
    }
    if (typeof showItemToast === 'function') {
      showItemToast('超越體', '균이 직접 권한을 부여했다. 이제 복종으로 길을 연다.', '#facc15');
    }
    this._setMessage('최종 승인', [
      '기존 직업명이 파손되며 사라진다.',
      '[ 超越體 ]',
    ], 240);
  }

  _updateSequence() {
    this._ensureSequenceInit();

    if (this.sequence === 'descent') {
      if (this.sequenceTimer > 0) this.sequenceTimer--;
      if (typeof player !== 'undefined') {
        player.y = Math.min(player.y + 1.4, 300);
      }
      if (this.sequenceTimer <= 0) {
        this.sequence = 'idle';
      }
      return;
    }

    if (this.sequence === 'idle' && !this.coreTriggered && typeof player !== 'undefined') {
      const inCore = player.cx > 930 && player.cx < 1270 && player.cy > 1180 && player.cy < 1450;
      if (inCore) this._startAudience();
      return;
    }

    if (this.sequence === 'audience') {
      if (this.sequenceTimer > 0) this.sequenceTimer--;
      if (this.sequenceTimer === 180) {
        this._setMessage('균의 승인', [
          '실루엣이 균사처럼 해체된다.',
          '몸은 다시 조립되고, 직업의 경계가 사라진다.',
        ], 180);
      }
      if (this.sequenceTimer === 100) {
        this._grantApproval();
      }
      if (this.sequenceTimer <= 0) {
        this.sequence = 'done';
        this._setMessage('균의 옥좌', [
          '이제 너는 균을 따르는 존재가 아니다.',
          '균의 권한을 직접 행사하는 존재가 되었다.',
        ], 220);
      }
    }
  }

  interact(player) {
    const playerW = player.w || 40;
    const playerH = player.h || 40;
    for (const z of this.zones) {
      if (z.hidden) continue;
      if (
        player.x + playerW > z.x - 40 && player.x < z.x + z.w + 40 &&
        player.y + playerH > z.y - 40 && player.y < z.y + z.h + 40
      ) {
        if (z.id === 'below-return' && window.changeMap) {
          changeMap('centralaltar');
          return;
        }
      }
    }

    if (this.sequence === 'done') {
      this._setMessage('초월체', [
        '싸우는 대신 명령한다.',
        '복종은 적을 죽이지 않고 전장을 접는다.',
      ]);
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateFragments();
    this._updateWhispers();
    this._updateSequence();

    const wobble = this.sequence === 'descent' ? Math.sin(this.phase * 8) * 6 : 0;

    ctx.save();
    ctx.translate(wobble, wobble * 0.4);

    ctx.fillStyle = '#010103';
    ctx.fillRect(0, 0, vw, vh);

    const abyss = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, Math.max(vw, vh));
    abyss.addColorStop(0, 'rgba(30, 27, 75, 0.14)');
    abyss.addColorStop(0.45, 'rgba(17, 24, 39, 0.08)');
    abyss.addColorStop(1, 'rgba(0, 0, 0, 0.96)');
    ctx.fillStyle = abyss;
    ctx.fillRect(0, 0, vw, vh);

    for (const star of this.voidStars) {
      const sx = star.x - camX;
      const sy = star.y - camY;
      if (sx < -20 || sx > vw + 20 || sy < -20 || sy > vh + 20) continue;
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.abs(Math.sin(this.phase + star.phase)) * 0.3;
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.paths) {
      const sx = p.x - camX;
      const sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      const bridge = ctx.createLinearGradient(sx, sy, sx + p.w, sy + p.h);
      bridge.addColorStop(0, 'rgba(12, 10, 20, 0.88)');
      bridge.addColorStop(0.5, 'rgba(55, 48, 163, 0.22)');
      bridge.addColorStop(1, 'rgba(12, 10, 20, 0.88)');
      ctx.fillStyle = bridge;
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    for (const f of this.fragments) {
      const sx = f.x - camX;
      const sy = f.y - camY;
      if (sx < -30 || sx > vw + 30 || sy < -30 || sy > vh + 30) continue;
      ctx.save();
      ctx.globalAlpha = f.life * 0.8;
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy, f.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const throneX = 1100 - camX;
    const throneY = 1260 - camY;
    const pulse = 0.55 + Math.sin(this.phase * 2.2) * 0.08;

    const aura = ctx.createRadialGradient(throneX, throneY - 210, 20, throneX, throneY - 210, 320);
    aura.addColorStop(0, `rgba(220, 38, 38, ${pulse})`);
    aura.addColorStop(0.45, 'rgba(124, 58, 237, 0.18)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(throneX - 360, throneY - 620, 720, 820);

    ctx.save();
    ctx.translate(throneX, throneY - 230 + Math.sin(this.phase * 1.3) * 10);
    ctx.fillStyle = '#0f0f18';
    ctx.beginPath();
    ctx.ellipse(0, 0, 130, 170, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, -22, 24 + Math.sin(this.phase * 3.2) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 202, 202, 0.38)';
    ctx.lineWidth = 2;
    for (const rib of this.ribs) {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(
        Math.cos(rib.angle) * 80,
        Math.sin(rib.angle) * 50,
        Math.cos(rib.angle) * rib.len,
        90 + Math.sin(rib.angle) * 60
      );
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(12, 60, 250, 36);
    ctx.fillStyle = '#e9d5ff';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('더 아래로', 24, 78);
    ctx.restore();

    const returnZone = this.zones[0];
    if (this.approvalGranted) {
      const sx = returnZone.x - camX;
      const sy = returnZone.y - camY;
      ctx.globalAlpha = 0.86;
      ctx.fillStyle = returnZone.color;
      ctx.fillRect(sx, sy, returnZone.w, returnZone.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = returnZone.lc;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, returnZone.w, returnZone.h);
      ctx.fillStyle = '#f8fafc';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(returnZone.label, sx + returnZone.w / 2, sy + returnZone.h / 2);
      ctx.textBaseline = 'alphabetic';
    }

    for (const w of this.whispers) {
      const alpha = w.life < 35 ? w.life / 35 : w.life > w.maxLife - 18 ? (w.maxLife - w.life) / 18 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.38;
      ctx.fillStyle = w.color;
      ctx.font = "italic bold 18px 'Noto Sans KR', serif";
      ctx.textAlign = 'left';
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 12;
      ctx.fillText(`"${w.text}"`, w.x, w.y);
      ctx.restore();
    }

    if (this.messageTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = 'rgba(5, 5, 8, 0.92)';
      ctx.fillRect(vw / 2 - 290, vh - 220, 580, 150);
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.strokeRect(vw / 2 - 290, vh - 220, 580, 150);
      ctx.fillStyle = '#f5d0fe';
      ctx.font = "bold 18px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(this.messageTitle, vw / 2 - 258, vh - 186);
      ctx.fillStyle = '#f8fafc';
      ctx.font = "14px 'Noto Sans KR', sans-serif";
      for (let i = 0; i < this.messageLines.length; i++) {
        ctx.fillText(this.messageLines[i], vw / 2 - 258, vh - 148 + i * 28);
      }
      ctx.restore();
    }

    if (this.finalJobFlash > 0) {
      const alpha = Math.min(1, this.finalJobFlash / 220);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, alpha * 0.8)})`;
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalAlpha = Math.min(1, alpha * 1.2);
      ctx.fillStyle = '#0b0b13';
      ctx.font = "bold 48px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('[ 超越體 ]', vw / 2, vh / 2 + 20);
      ctx.restore();
    }

    if (this.sequence === 'descent') {
      const alpha = Math.min(0.85, (this.sequenceTimer / 180) * 0.85);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, vw, vh);
    }

    ctx.restore();
  }
}
