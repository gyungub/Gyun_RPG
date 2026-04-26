// readingroom.js - 금서 열람실

class ReadingRoom extends GameMap {
  constructor() {
    super();
    this.mapId = 'readingroom';
    this.width = 2000;
    this.height = 1600;

    this.distortionPhase = 0;
    this.floatingTexts = [];
    this.floatingTextTimer = 0;
    this.screenShake = { x: 0, y: 0, timer: 0 };

    this.spookyLines = [
      "읽히고 있다.",
      "페이지가 스스로 넘어간다.",
      "이미 늦었다.",
      "지식은 대가를 요구한다.",
      "눈을 감아도 글자가 보인다.",
      "균이 스며들고 있다.",
      "되돌릴 수 없다.",
      "읽지 말았어야 했다.",
    ];

    // ===== 책 효과 목록 =====
    this.bookEffects = [
      // 좋은 효과
      { id: 'atk_up',    type: 'good',    icon: '⚔️', name: '공격력 증가',   desc: '공격력이 20분간 1.5배 증가한다.',       color: '#4ade80' },
      { id: 'exp_up',    type: 'good',    icon: '✨', name: '경험치 증폭',   desc: '20분간 경험치 획득량이 2배가 된다.',    color: '#fbbf24' },
      { id: 'hp_regen',  type: 'good',    icon: '💚', name: 'HP 회복',       desc: 'HP를 최대치의 30% 즉시 회복한다.',      color: '#34d399' },
      { id: 'skill_amp', type: 'good',    icon: '🔮', name: '스킬 강화',     desc: '20분간 스킬 데미지가 1.3배 증가한다.', color: '#a78bfa' },

      // 나쁜 효과
      { id: 'hp_drain',  type: 'bad',     icon: '🩸', name: '생명 침식',     desc: '20분간 매 5초마다 HP가 조금씩 감소한다.', color: '#f87171' },
      { id: 'reverse',   type: 'bad',     icon: '🔄', name: '이동 반전',     desc: '20분간 이동 방향이 반전된다.',          color: '#fb923c' },
      { id: 'atk_down',  type: 'bad',     icon: '💔', name: '공격력 저하',   desc: '20분간 공격력이 0.6배로 감소한다.',    color: '#f43f5e' },

      // 위험 효과
      { id: 'stun',      type: 'danger',  icon: '💀', name: '조작 불능',     desc: '10초간 완전히 움직일 수 없게 된다.',   color: '#dc2626' },
      { id: 'gyun_infect', type: 'danger', icon: '☣️', name: '균 감염',      desc: '균에게 감염된다. 20분간 받는 피해 2배.', color: '#7f1d1d' },
      { id: 'screen_distort', type: 'danger', icon: '👁️', name: '환각',      desc: '20분간 화면이 왜곡되어 보인다.',       color: '#6b21a8' },
    ];

    // 활성화된 효과들
    this.activeEffects = [];

    this.initReadingRoom();
  }

  initReadingRoom() {
    this.paths = [
      // 메인 열람실
      { x: 200,  y: 200,  w: 1600, h: 1100 },
      // 입구 통로
      { x: 850,  y: 50,   w: 300,  h: 200 },
    ];

    this.zones = [
      {
        id: 'reading-return',
        label: '🔙 도서관으로',
        x: 875, y: 60, w: 250, h: 80,
        color: '#334155', lc: '#1e293b'
      },
    ];

    this.npcs = [
      {
        id: 'mad-researcher',
        label: '🕯️ 미쳐버린 연구자',
        x: 1600, y: 900, w: 65, h: 65,
        color: '#4c1d95'
      },
    ];

    // ===== 책 오브젝트 배치 =====
    this.books = [];
    const bookPositions = [
      { x: 380,  y: 350 }, { x: 600,  y: 280 }, { x: 820,  y: 400 },
      { x: 1050, y: 300 }, { x: 1280, y: 380 }, { x: 1480, y: 260 },
      { x: 350,  y: 650 }, { x: 580,  y: 720 }, { x: 800,  y: 600 },
      { x: 1020, y: 700 }, { x: 1260, y: 640 }, { x: 1500, y: 700 },
      { x: 420,  y: 950 }, { x: 680,  y: 1000 },{ x: 950,  y: 920 },
      { x: 1180, y: 980 }, { x: 1420, y: 950 },
    ];

    for (const pos of bookPositions) {
      const effect = this.bookEffects[Math.floor(Math.random() * this.bookEffects.length)];
      this.books.push({
        x: pos.x,
        y: pos.y,
        w: 36,
        h: 48,
        phase: Math.random() * Math.PI * 2,
        floatSpeed: 0.4 + Math.random() * 0.5,
        rotSpeed: 0.2 + Math.random() * 0.3,
        pageTimer: Math.random() * 60,
        color: effect.type === 'good' ? '#7c3aed' :
               effect.type === 'bad'  ? '#dc2626' : '#1a0a2e',
        glowColor: effect.type === 'good' ? '#a78bfa' :
                   effect.type === 'bad'  ? '#f87171' : '#6b21a8',
        effect: effect,
        read: false,    // 읽혔는지 여부
        cooldown: 0,    // 재상호작용 방지
        showLabel: false,
      });
    }

    // 바닥 문장들
    this.floorTexts = [
      { x: 400,  y: 800,  text: "읽는 자는 알게 되리라...",        alpha: 0.18 },
      { x: 900,  y: 500,  text: "지식은 독이다.",                  alpha: 0.15 },
      { x: 1300, y: 900,  text: "페이지를 넘기지 마라.",           alpha: 0.12 },
      { x: 650,  y: 1100, text: "이미 읽혔다.",                    alpha: 0.20 },
      { x: 1150, y: 650,  text: "균이 기다리고 있다.",             alpha: 0.14 },
      { x: 450,  y: 450,  text: "되돌아가라.",                     alpha: 0.16 },
      { x: 1400, y: 500,  text: "...보고 있다.",                   alpha: 0.13 },
    ];
  }

  // ===== 책과의 거리 체크 =====
  getNearbyBook(playerX, playerY) {
    for (const book of this.books) {
      if (book.read || book.cooldown > 0) continue;
      const bx = book.x + book.w / 2;
      const by = book.y + book.h / 2;
      const dist = Math.hypot(playerX - bx, playerY - by);
      if (dist < 100) return book;
    }
    return null;
  }

  // ===== 책 읽기 =====
  readBook(book) {
    if (book.read || book.cooldown > 0) return;

    book.cooldown = 300; // 5초 쿨다운
    const effect = book.effect;

    // 효과 적용
    this._applyBookEffect(effect);

    // 효과 알림
    showBookEffectToast(effect);

    // 스푸키 텍스트 추가
    this.floatingTexts.push({
      text: this.spookyLines[Math.floor(Math.random() * this.spookyLines.length)],
      x: book.x,
      y: book.y - 40,
      life: 180,
      maxLife: 180,
      color: effect.type === 'danger' ? '#dc2626' : '#a78bfa',
    });

    // 위험 효과면 화면 흔들림
    if (effect.type === 'danger') {
      this.screenShake.timer = 60;
    }
  }

  _applyBookEffect(effect) {
    // 전역 효과 저장소에도 적용 (맵 이동 후에도 유지)
    if (typeof applyGlobalBookEffect === 'function') applyGlobalBookEffect(effect.id);
    const duration = 20 * 60 * 1000; // 20분 (밀리초)
    const now = Date.now();

    // 기존 같은 효과 제거
    this.activeEffects = this.activeEffects.filter(e => e.id !== effect.id);

    switch (effect.id) {
      case 'atk_up':
        this.activeEffects.push({ id: 'atk_up', expiry: now + duration, multiplier: 1.5 });
        break;
      case 'exp_up':
        this.activeEffects.push({ id: 'exp_up', expiry: now + duration, multiplier: 2.0 });
        break;
      case 'hp_regen':
        if (typeof battleState !== 'undefined') {
          const heal = Math.floor(battleState.playerMaxHp * 0.3);
          battleState.playerHp = Math.min(battleState.playerHp + heal, battleState.playerMaxHp);
          if (typeof updateBattleHUD === 'function') updateBattleHUD();
        }
        break;
      case 'skill_amp':
        this.activeEffects.push({ id: 'skill_amp', expiry: now + duration, multiplier: 1.3 });
        break;
      case 'hp_drain':
        this.activeEffects.push({ id: 'hp_drain', expiry: now + duration, tickTimer: 0 });
        break;
      case 'reverse':
        this.activeEffects.push({ id: 'reverse', expiry: now + duration });
        break;
      case 'atk_down':
        this.activeEffects.push({ id: 'atk_down', expiry: now + duration, multiplier: 0.6 });
        break;
      case 'stun':
        this.activeEffects.push({ id: 'stun', expiry: now + 10000 }); // 10초
        break;
      case 'gyun_infect':
        this.activeEffects.push({ id: 'gyun_infect', expiry: now + duration, multiplier: 2.0 });
        break;
      case 'screen_distort':
        this.activeEffects.push({ id: 'screen_distort', expiry: now + duration });
        break;
    }
  }

  // ===== 매 프레임 효과 업데이트 =====
  updateEffects() {
    const now = Date.now();
    this.activeEffects = this.activeEffects.filter(e => now < e.expiry);

    // HP 지속 감소
    const drain = this.activeEffects.find(e => e.id === 'hp_drain');
    if (drain && typeof battleState !== 'undefined') {
      drain.tickTimer = (drain.tickTimer || 0) + 1;
      if (drain.tickTimer >= 300) { // 5초마다
        drain.tickTimer = 0;
        battleState.playerHp = Math.max(1, battleState.playerHp - 8);
        if (typeof updateBattleHUD === 'function') updateBattleHUD();
      }
    }

    // 화면 흔들림
    if (this.screenShake.timer > 0) {
      this.screenShake.timer--;
      this.screenShake.x = (Math.random() - 0.5) * 10;
      this.screenShake.y = (Math.random() - 0.5) * 10;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }

    // 책 쿨다운
    for (const book of this.books) {
      if (book.cooldown > 0) book.cooldown--;
    }
  }

  // ===== 효과 조회 함수들 =====
  isStunned()       { return this.activeEffects.some(e => e.id === 'stun'); }
  isReversed()      { return this.activeEffects.some(e => e.id === 'reverse'); }
  isDistorted()     { return this.activeEffects.some(e => e.id === 'screen_distort'); }
  getAtkMultiplier() {
    let mult = 1.0;
    const up   = this.activeEffects.find(e => e.id === 'atk_up');
    const down = this.activeEffects.find(e => e.id === 'atk_down');
    const inf  = this.activeEffects.find(e => e.id === 'gyun_infect');
    if (up)   mult *= up.multiplier;
    if (down) mult *= down.multiplier;
    return mult;
  }
  getSkillMultiplier() {
    const amp = this.activeEffects.find(e => e.id === 'skill_amp');
    return amp ? amp.multiplier : 1.0;
  }
  getIncomingDmgMultiplier() {
    const inf = this.activeEffects.find(e => e.id === 'gyun_infect');
    return inf ? inf.multiplier : 1.0;
  }
  getExpMultiplier() {
    const exp = this.activeEffects.find(e => e.id === 'exp_up');
    return exp ? exp.multiplier : 1.0;
  }

  draw(ctx, camX, camY, vw, vh) {
    this.distortionPhase += 0.02;
    this.updateEffects();

    // ===== 화면 왜곡 효과 =====
    const distorted = this.isDistorted();
    const shakeX = this.screenShake.x;
    const shakeY = this.screenShake.y;

    ctx.save();
    if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

    // ===== 배경 =====
    ctx.fillStyle = '#07001a';
    ctx.fillRect(0, 0, vw, vh);

    // 보라 안개
    const fogGrad = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.7);
    fogGrad.addColorStop(0, 'rgba(109,40,217,0.12)');
    fogGrad.addColorStop(0.5, 'rgba(67,56,202,0.08)');
    fogGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, vw, vh);

    // ===== 화면 왜곡 오버레이 =====
    if (distorted) {
      ctx.save();
      ctx.globalAlpha = 0.06 + Math.sin(this.distortionPhase * 5) * 0.04;
      ctx.fillStyle = '#7c3aed';
      for (let i = 0; i < 6; i++) {
        const dy = Math.sin(this.distortionPhase * 2 + i) * 8;
        ctx.fillRect(0, i * (vh / 6) + dy, vw, 3);
      }
      ctx.restore();
    }

    // ===== 바닥 =====
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#110830';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#4c2a8a';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // ===== 바닥 문장 =====
    for (const ft of this.floorTexts) {
      const fx = ft.x - camX, fy = ft.y - camY;
      if (fx < -200 || fx > vw + 200 || fy < -30 || fy > vh + 30) continue;
      const flicker = ft.alpha + Math.sin(this.distortionPhase * 1.5 + ft.x * 0.01) * 0.05;
      ctx.save();
      ctx.globalAlpha = Math.max(0, flicker);
      ctx.fillStyle = '#a78bfa';
      ctx.font = "italic 13px 'Noto Sans KR', serif";
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, fx, fy);
      ctx.restore();
    }

    // ===== 책 그리기 =====
    for (const book of this.books) {
      book.phase += book.floatSpeed * 0.02;
      book.pageTimer++;

      const bx = book.x - camX + Math.sin(book.phase) * 14;
      const by = book.y - camY + Math.cos(book.phase * 0.7) * 10;
      if (bx < -50 || bx > vw + 50 || by < -50 || by > vh + 50) continue;

      ctx.save();
      ctx.translate(bx + book.w / 2, by + book.h / 2);
      ctx.rotate(Math.sin(book.phase * book.rotSpeed) * 0.25);

      // 글로우
      ctx.shadowColor = book.glowColor;
      ctx.shadowBlur = 14 + Math.sin(this.distortionPhase * 3) * 4;

      // 쿨다운 중이면 흐리게
      ctx.globalAlpha = book.cooldown > 0 ? 0.35 : 0.85;

      // 책 본체
      ctx.fillStyle = book.color;
      ctx.fillRect(-book.w / 2, -book.h / 2, book.w, book.h);

      // 페이지 넘김 효과
      if (book.pageTimer % 80 < 15) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        const pageWidth = (book.w * 0.6) * ((book.pageTimer % 80) / 15);
        ctx.fillRect(-book.w / 2 + 4, -book.h / 2 + 4, pageWidth, book.h - 8);
      }

      ctx.strokeStyle = book.glowColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-book.w / 2, -book.h / 2, book.w, book.h);

      // 타입 아이콘
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.9;
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(book.effect.icon, 0, 0);

      ctx.restore();

      // 가까이 있을 때 라벨 표시 (showLabel은 외부에서 세팅)
      if (book.showLabel) {
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = 'rgba(15,0,30,0.92)';
        ctx.fillRect(bx - 60, by - book.h / 2 - 50, 120, 40);
        ctx.strokeStyle = book.glowColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx - 60, by - book.h / 2 - 50, 120, 40);
        ctx.fillStyle = book.effect.color;
        ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText(`${book.effect.icon} ${book.effect.name}`, bx, by - book.h / 2 - 34);
        ctx.fillStyle = '#aaa';
        ctx.font = "10px 'Noto Sans KR', sans-serif";
        ctx.fillText('Q키로 읽기', bx, by - book.h / 2 - 20);
        ctx.restore();
      }
    }

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
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#fff';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
    }

    // ===== NPC 그리기 =====
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      if (sx > vw || sy > vh || sx + npc.w < 0 || sy + npc.h < 0) continue;
      const alpha = 0.7 + Math.sin(this.distortionPhase * 1.5) * 0.3;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#ddd6fe';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(npc.label, sx + npc.w / 2, sy + npc.h + 18);
    }

    // ===== 떠다니는 스푸키 텍스트 =====
    this._updateFloatingTexts(ctx, vw, vh);

    // ===== 활성 효과 HUD =====
    this._drawActiveEffectsHUD(ctx, vw, vh);

    // ===== 기절 오버레이 =====
    if (this.isStunned()) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#dc2626';
      ctx.font = "bold 36px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 20;
      ctx.fillText('💀 조작 불능 💀', vw / 2, vh / 2);
      ctx.restore();
    }

    // ===== 맵 테두리 =====
    ctx.strokeStyle = '#1a0a2e';
    ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);

    ctx.restore(); // screenShake restore
  }

  _updateFloatingTexts(ctx, vw, vh) {
    this.floatingTextTimer++;
    if (this.floatingTextTimer >= 200) {
      this.floatingTextTimer = 0;
      this.floatingTexts.push({
        text: this.spookyLines[Math.floor(Math.random() * this.spookyLines.length)],
        x: 80 + Math.random() * (vw - 160),
        y: 100 + Math.random() * (vh - 200),
        life: 180,
        maxLife: 180,
        color: Math.random() > 0.4 ? '#a78bfa' : '#fbbf24',
      });
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.3;
      t.life--;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }
      const alpha = t.life < 40 ? t.life / 40 : t.life > t.maxLife - 30 ? (t.maxLife - t.life) / 30 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = t.color;
      ctx.font = "italic bold 14px 'Noto Sans KR', serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillText(`"${t.text}"`, t.x, t.y);
      ctx.restore();
    }
  }

  _drawActiveEffectsHUD(ctx, vw, vh) {
    if (this.activeEffects.length === 0) return;
    const now = Date.now();
    const x = 14, startY = vh - 180;
    ctx.save();
    ctx.fillStyle = 'rgba(10,0,20,0.75)';
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 1.5;
    const hudH = this.activeEffects.length * 28 + 16;
    ctx.fillRect(x, startY - hudH, 220, hudH);
    ctx.strokeRect(x, startY - hudH, 220, hudH);

    ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
    ctx.textBaseline = 'middle';

    for (let i = 0; i < this.activeEffects.length; i++) {
      const eff = this.activeEffects[i];
      const info = this.bookEffects.find(b => b.id === eff.id);
      if (!info) continue;
      const ey = startY - hudH + 14 + i * 28;
      const remaining = Math.max(0, Math.ceil((eff.expiry - now) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const timeStr = mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;

      ctx.fillStyle = info.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${info.icon} ${info.name}`, x + 10, ey);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, x + 210, ey);
    }
    ctx.restore();
  }
}

// ===== 책 효과 토스트 알림 =====
function showBookEffectToast(effect) {
  let toast = document.getElementById('book-effect-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'book-effect-toast';
    toast.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      z-index:20000;background:rgba(10,0,25,0.97);
      border-radius:16px;padding:20px 36px;
      font-family:'Jua',sans-serif;min-width:280px;
      box-shadow:0 4px 40px rgba(0,0,0,0.7);
      pointer-events:none;text-align:center;
      transition:opacity 0.4s;
    `;
    document.body.appendChild(toast);
  }

  const borderColor = effect.type === 'good' ? '#4ade80' :
                      effect.type === 'bad'  ? '#f87171' : '#dc2626';
  toast.style.border = `2px solid ${borderColor}`;
  toast.style.boxShadow = `0 4px 40px rgba(0,0,0,0.7), 0 0 30px ${borderColor}44`;
  toast.innerHTML = `
    <div style="font-size:2.5rem;margin-bottom:8px;">${effect.icon}</div>
    <div style="color:${effect.color};font-size:1.3rem;margin-bottom:6px;">${effect.name}</div>
    <div style="color:rgba(255,255,255,0.65);font-size:0.9rem;">${effect.desc}</div>
    <div style="color:${borderColor};font-size:0.8rem;margin-top:8px;">
      ${effect.type === 'good' ? '✦ 좋은 효과' : effect.type === 'bad' ? '⚠ 나쁜 효과' : '💀 위험 효과'}
    </div>
  `;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}