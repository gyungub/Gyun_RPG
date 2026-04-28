// truth-memory.js - 반향 열람실 (기억 반향)

class TruthMemoryRoom extends GameMap {
  constructor() {
    super();
    this.mapId = 'truth-memory';
    this.width = 2000;
    this.height = 1500;

    this.phase = 0;
    this.echoes = [];
    this.memoryBursts = [];
    this.isActivating = false;
    this.activationPhase = 0;
    this.screenNoise = 0;
    this.screenShake = 0;
    this.truthFlashes = [];
    this.truthIndex = 0;
    this.deviceLocked = false;

    this._init();
  }

  _init() {
    this.paths = [
      { x: 180, y: 180, w: 1640, h: 1140 },
      { x: 860, y: 80, w: 280, h: 120 },
    ];

    this.zones = [
      {
        id: 'truth-memory-return',
        label: '🔙 진실의 심부로',
        x: 880, y: 95, w: 240, h: 80,
        color: '#334155',
        lc: '#1e293b',
      },
      {
        id: 'memory-core',
        label: '🔄 기억 반향장치',
        x: 860, y: 620, w: 280, h: 140,
        color: '#312e81',
        lc: '#6366f1',
      },
    ];

    this.npcs = [
      {
        id: 'echo-reader',
        label: '🜂 반향 기록자',
        x: 1240, y: 820, w: 64, h: 64,
        color: '#4338ca',
      },
    ];

    // 기억 반향장치가 밝혀주는 진실들 (순서 중요)
    this.truthSequence = [
      { text: '기억 반향 재생 시작', duration: 40 },
      { text: '피관측 개체 확인', duration: 50 },
      { text: '표본 식별 완료', duration: 50 },
      { text: '인간 문명은 상층 오염층에 불과하다', duration: 60 },
      { text: '균은 침입한 적이 없다', duration: 55 },
      { text: '먼저 존재한 것은 우리였다', duration: 55 },
      { text: '교단은 숭배자가 아니다', duration: 55 },
      { text: '그들은 관리인이었다', duration: 55 },
      { text: '너는 선택된 것이 아니다', duration: 55 },
      { text: '너는 오래전부터 기록되었다', duration: 60 },
      { text: '기억 반향 종료', duration: 40 },
    ];

    // 떠다니는 메모리 아크
    for (let i = 0; i < 16; i++) {
      this.echoes.push({
        x: 320 + Math.random() * 1360,
        y: 320 + Math.random() * 860,
        r: 18 + Math.random() * 36,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02,
      });
    }
  }

  interact(player) {
    const playerW = player.w || 40;
    const playerH = player.h || 40;

    // NPC 상호작용 먼저 체크
    for (const npc of this.npcs) {
      if (
        player.x + playerW > npc.x - 50 && 
        player.x < npc.x + npc.w + 50 &&
        player.y + playerH > npc.y - 50 && 
        player.y < npc.y + npc.h + 50
      ) {
        if (window.showDialogue) {
          showDialogue('반향 기록자', '기억은 읽는 것이 아니다.\n기억은 다시 재생되는 것이다.');
        }
        return;
      }
    }

    // 존 상호작용
    for (const z of this.zones) {
      if (
        player.x + playerW > z.x - 40 && 
        player.x < z.x + z.w + 40 &&
        player.y + playerH > z.y - 40 && 
        player.y < z.y + z.h + 40
      ) {
        this._triggerZone(z.id);
        return;
      }
    }
  }

  _triggerZone(id) {
    if (id === 'truth-memory-return') {
      if (window.changeMap) {
        changeMap('altar-truth');
      }
      return;
    }

    if (id === 'memory-core') {
      this.activateMemoryDevice();
      return;
    }
  }

  activateMemoryDevice() {
    if (this.deviceLocked || this.isActivating) return;
    
    this.isActivating = true;
    this.deviceLocked = true;
    this.activationPhase = 0;
    this.truthIndex = 0;
    this.screenNoise = 0;
    this.screenShake = 0;
    
    // 화면 정지 시작
    if (window.inGacha !== undefined) window.inGacha = true;
  }

  _updateActivation() {
    if (!this.isActivating) return;

    this.activationPhase++;

    // Phase 1: 화면 정지 + UI 흔들림 (60프레임)
    if (this.activationPhase < 60) {
      this.screenShake = Math.sin(this.activationPhase * 0.3) * 15;
      this.screenNoise = Math.random() * 0.4;
      return;
    }

    // Phase 2: 노이즈 + 문장 플래시 (진실 문장 순차 출력, 약 550프레임)
    if (this.activationPhase < 610) {
      this.screenNoise = 0.3 + Math.random() * 0.3;
      const flashPhase = this.activationPhase - 60;
      let currentIndex = 0;
      let accum = 0;

      // 어느 진실을 지금 표시할지 결정
      for (let i = 0; i < this.truthSequence.length; i++) {
        accum += this.truthSequence[i].duration;
        if (flashPhase < accum) {
          currentIndex = i;
          break;
        }
      }

      // 플래시 효과 (깜빡임)
      const withinPhase = flashPhase - (accum - this.truthSequence[currentIndex].duration);
      const flashAlpha = Math.abs(Math.sin(withinPhase * 0.15)) * 0.8 + 0.2;

      if (this.truthFlashes[currentIndex] === undefined) {
        this.truthFlashes[currentIndex] = true;
        // 대사도 함께 출력
        if (window.showDialogue && currentIndex < 3) {
          showDialogue('반향 열람실', this.truthSequence[currentIndex].text);
        }
      }

      return;
    }

    // Phase 3: 장치 완료 후 강제 대사 (610 ~ 670)
    if (this.activationPhase < 670) {
      this.screenNoise = 0.1;
      if (this.activationPhase === 610) {
        if (window.showDialogue) {
          showDialogue(
            '균의 목소리',
            '너는 이제 안다.\n기억은 기록이 아니다.\n너는 우리의 관측 대상이었다.\n그리고 지금도 그렇다.'
          );
        }
      }
      return;
    }

    // Phase 4: 정상화 (670 ~ 730)
    if (this.activationPhase < 730) {
      this.screenNoise = Math.max(0, 0.1 - (this.activationPhase - 670) * 0.002);
      this.screenShake = Math.sin(this.activationPhase * 0.2) * 5;
      return;
    }

    // 완료
    this.isActivating = false;
    this.screenNoise = 0;
    this.screenShake = 0;
    this.truthFlashes = [];
    this.truthIndex = 0;
    if (window.inGacha !== undefined) window.inGacha = false;
    
    // 잠시 후 장치 사용 가능하게
    setTimeout(() => {
      this.deviceLocked = false;
    }, 2000);
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateActivation();

    ctx.fillStyle = '#02030f';
    ctx.fillRect(0, 0, vw, vh);

    const glow = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.7);
    glow.addColorStop(0, `rgba(99,102,241,${0.14 + Math.sin(this.phase) * 0.04})`);
    glow.addColorStop(0.5, 'rgba(30,27,75,0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, vw, vh);

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX + this.screenShake, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      ctx.fillStyle = '#070b22';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 기억의 반향 (떠다니는 원)
    for (const e of this.echoes) {
      e.phase += e.speed;
      const x = e.x - camX + this.screenShake;
      const y = e.y - camY;
      const r = e.r + Math.sin(e.phase) * 6;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(165,180,252,${0.08 + Math.sin(e.phase) * 0.04})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 존 표시
    for (const z of this.zones) {
      const sx = z.x - camX + this.screenShake, sy = z.y - camY;
      ctx.fillStyle = z.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);

      ctx.fillStyle = '#c7d2fe';
      ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
    }

    // NPC 표시
    for (const npc of this.npcs) {
      const sx = npc.x - camX + this.screenShake, sy = npc.y - camY;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(this.phase * 1.2) * 0.2;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#c7d2fe';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
      ctx.restore();
    }

    // 메모리 버스트 효과
    for (let i = this.memoryBursts.length - 1; i >= 0; i--) {
      const m = this.memoryBursts[i];
      const sx = m.x - camX + this.screenShake;
      const sy = m.y - camY;
      const a = m.life / m.maxLife;

      ctx.save();
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = '#f8fafc';
      ctx.font = "bold 22px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 18;
      ctx.fillText(m.text, sx, sy);
      ctx.restore();

      m.life--;
      if (m.life <= 0) {
        this.memoryBursts.splice(i, 1);
      }
    }

    // === 기억 반향장치 활성화 연출 ===
    if (this.isActivating) {
      // 1. 노이즈 오버레이
      if (this.screenNoise > 0) {
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * this.screenNoise * 0.5})`;
          ctx.fillRect(
            Math.random() * vw,
            Math.random() * vh,
            Math.random() * 20,
            Math.random() * 20
          );
        }
      }

      // 2. 진실 문장 플래시
      for (let i = 0; i < this.truthFlashes.length; i++) {
        if (this.truthFlashes[i]) {
          const idx = Math.min(i, this.truthSequence.length - 1);
          const truth = this.truthSequence[idx];
          
          // 깜빡이는 효과
          const flashAlpha = Math.abs(Math.sin(this.activationPhase * 0.2 + i * 0.5)) * 0.6 + 0.3;
          
          ctx.save();
          ctx.globalAlpha = flashAlpha;
          ctx.fillStyle = '#ff00ff';
          ctx.font = "bold 28px 'Noto Sans KR', sans-serif";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#ff00ff';
          ctx.shadowBlur = 30;
          ctx.fillText(truth.text, vw / 2, vh / 2 + (i - 5) * 40);
          ctx.restore();
        }
      }

      // 3. 화면 가장자리 빨간 테두리
      ctx.save();
      ctx.strokeStyle = `rgba(255,0,0,${0.3 + Math.sin(this.activationPhase * 0.1) * 0.3})`;
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, vw, vh);
      ctx.restore();
    }

    // 타이틀
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 12, 230, 34);
    ctx.fillStyle = '#c7d2fe';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🜂 반향 열람실', 22, 29);
    ctx.restore();

    // 맵 경계선
    ctx.strokeStyle = '#050814';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX + this.screenShake, -camY, this.width, this.height);
  }
}