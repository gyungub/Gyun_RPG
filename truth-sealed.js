// truth-sealed.js - 진실 봉인소

class TruthSealedRoom extends GameMap {
  constructor() {
    super();
    this.mapId = 'truth-sealed';
    this.width = 2000;
    this.height = 1200;

    this.phase = 0;
    this.sealParticles = [];
    this.isActivating = false;
    this.sealPhase = 0;
    this.sealLines = [];
    this.sealGlitch = 0;
    this.finalMoment = false;

    this._init();
  }

  _init() {
    this.paths = [
      { x: 300, y: 250, w: 1400, h: 700 },
      { x: 100, y: 100, w: 180, h: 1000 },
      { x: 1820, y: 100, w: 180, h: 1000 },
    ];

    this.zones = [
      {
        id: 'truth-sealed-return',
        label: '🔙 진실의 심부로',
        x: 100, y: 100, w: 160, h: 80,
        color: '#334155', lc: '#1e293b',
      },
      {
        id: 'seal-device',
        label: '◈ 원문 봉인 장치',
        x: 900, y: 500, w: 200, h: 150,
        color: '#2d1b4e', lc: '#7e22ce',
      },
    ];

    this.npcs = [];

    // 봉인된 문서 파편들
    for (let i = 0; i < 12; i++) {
      this.sealParticles.push({
        x: 400 + Math.random() * 1200,
        y: 300 + Math.random() * 700,
        w: 40 + Math.random() * 30,
        h: 60 + Math.random() * 40,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
      });
    }

    // 진실 봉인소 원문 내용
    this.sealContent = [
      { text: '[ 검열 전 원문 기록 ]', delay: 0, type: 'header' },
      { text: '[ 분류: 극비 ]', delay: 40, type: 'header' },
      { text: '', delay: 80, type: 'blank' },
      { text: '교단 설립의 진정한 목적:', delay: 120, type: 'normal' },
      { text: '교단은 숭배 기관이 아니다.', delay: 160, type: 'crucial' },
      { text: '교단은 하층 군집 관리 및 상층 개체 안정화를 위한 통제 조직이다.', delay: 220, type: 'crucial' },
      { text: '', delay: 280, type: 'blank' },
      { text: '신앙 체계의 역할:', delay: 320, type: 'normal' },
      { text: '신앙은 진실 은폐를 위한 통제 수단이었다.', delay: 380, type: 'crucial' },
      { text: '', delay: 440, type: 'blank' },
      { text: '하층 군집의 정체:', delay: 480, type: 'normal' },
      { text: '균은 외부 유입 개체가 아니다.', delay: 540, type: 'crucial' },
      { text: '하층 기저 생태계의 원생 군집이다.', delay: 600, type: 'crucial' },
      { text: '인류 이전부터 존재했다.', delay: 660, type: 'crucial' },
      { text: '', delay: 720, type: 'blank' },
      { text: '표본 개체 지정 기록:', delay: 760, type: 'normal' },
      { text: '표본 개체 지정 유지.', delay: 820, type: 'crucial' },
      { text: '장기 관측 지속.', delay: 880, type: 'crucial' },
      { text: '반응 유도 승인 완료.', delay: 940, type: 'crucial' },
      { text: '', delay: 1000, type: 'blank' },
      { text: '너는 선택된 것이 아니다.', delay: 1060, type: 'final' },
      { text: '', delay: 1120, type: 'blank' },
      { text: '너는 오래전부터 기록되었다.', delay: 1180, type: 'final' },
    ];
  }

  interact(player) {
    const playerW = player.w || 40;
    const playerH = player.h || 40;

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
    if (id === 'truth-sealed-return') {
      if (window.changeMap) {
        changeMap('altar-truth');
      }
      return;
    }

    if (id === 'seal-device') {
      this._activateSeal();
      return;
    }
  }

  _activateSeal() {
    if (this.isActivating) return;

    this.isActivating = true;
    this.sealPhase = 0;
    this.sealLines = [];
    this.sealGlitch = 0;
    this.finalMoment = false;

    // 화면 잠금
    if (window.inGacha !== undefined) window.inGacha = true;
  }

  _updateSeal() {
    if (!this.isActivating) return;

    this.sealPhase++;

    // Phase 1: 봉인 붕괴 (0-100)
    if (this.sealPhase < 100) {
      this.sealGlitch = Math.sin(this.sealPhase * 0.05) * 0.8;
    }

    // Phase 2: 검은 화면 (100-200)
    if (this.sealPhase === 100) {
      // 봉인 파괴 효과음 (게임 내에서 처리)
      if (window.showDialogue) {
        // 침묵 유지
      }
    }

    // Phase 3: 원문 출력 (200부터)
    for (const line of this.sealContent) {
      if (this.sealPhase >= line.delay + 200 && !this.sealLines.includes(line.text)) {
        this.sealLines.push(line.text);
      }
    }

    // Phase 4: 최종 대사 (약 1400프레임 이후)
    if (this.sealPhase > 1400 && !this.finalMoment) {
      this.finalMoment = true;
      // 최종 선택지 없이 침묵만 유지
    }

    // 연출 종료 (약 1700프레임)
    if (this.sealPhase > 1700) {
      this.isActivating = false;
      if (window.inGacha !== undefined) window.inGacha = false;
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateSeal();

    // 배경 - 어두운 톤
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, vw, vh);

    // 분위기: 무거운 라디언트
    const heavyGradient = ctx.createLinearGradient(0, 0, 0, vh);
    heavyGradient.addColorStop(0, `rgba(78,10,152,${0.05 + Math.sin(this.phase * 0.5) * 0.02})`);
    heavyGradient.addColorStop(1, 'rgba(20,20,30,0.1)');
    ctx.fillStyle = heavyGradient;
    ctx.fillRect(0, 0, vw, vh);

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#3a3a4a';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 중앙 거대 봉인 문양
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#7e22ce';
    ctx.font = "bold 400px serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◈', vw / 2, vh / 2);
    ctx.restore();

    // 좌우 봉인된 문서관
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#2d1b4e';
    ctx.fillRect(350 - camX, 300 - camY, 60, 700);
    ctx.fillRect(1590 - camX, 300 - camY, 60, 700);
    ctx.restore();

    // 떠다니는 봉인 파편들
    for (const particle of this.sealParticles) {
      const sx = particle.x - camX;
      const sy = particle.y - camY;

      if (sx > -100 && sx < vw + 100 && sy > -100 && sy < vh + 100) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(this.phase + particle.phase) * 0.1;

        ctx.translate(sx, sy);
        ctx.rotate(particle.rotation);

        ctx.fillStyle = '#4a2d6a';
        ctx.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 1;
        ctx.strokeRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);

        ctx.restore();
      }
    }

    // 봉인 장치 표시
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      ctx.fillStyle = z.color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, z.w, z.h);

      ctx.fillStyle = '#c7d2fe';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
    }

    // === 봉인 해제 연출 ===
    if (this.isActivating) {
      // Phase 1: 봉인 붕괴 (0-100)
      if (this.sealPhase < 100) {
        // 지진 효과
        const shake = Math.sin(this.sealPhase * 0.1) * 20;

        ctx.save();
        ctx.translate(vw / 2 + shake, vh / 2);
        ctx.scale(1 + this.sealPhase / 500, 1 + this.sealPhase / 500);

        // 봉인 장치 깨지는 효과
        ctx.globalAlpha = 0.9 - this.sealPhase / 200;
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(-100, -75, 200, 150);
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 4;
        ctx.strokeRect(-100, -75, 200, 150);

        // 금 생기는 효과
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.sealPhase / 10; i++) {
          const x = (Math.random() - 0.5) * 200;
          const y = (Math.random() - 0.5) * 150;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Phase 2: 검은 화면 (100-200)
      if (this.sealPhase >= 100 && this.sealPhase < 200) {
        ctx.fillStyle = '#000000';
        const blackAlpha = Math.min(1, (this.sealPhase - 100) / 100);
        ctx.globalAlpha = blackAlpha;
        ctx.fillRect(0, 0, vw, vh);
        ctx.globalAlpha = 1;
      }

      // Phase 3: 원문 출력 (200부터)
      if (this.sealPhase >= 200) {
        // 검은 배경에 흰 글자
        ctx.fillStyle = '#f5f5f5';
        ctx.font = "14px 'Noto Sans KR', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        let yOffset = 100;

        for (let i = 0; i < this.sealLines.length; i++) {
          const line = this.sealLines[i];

          if (line === '') {
            yOffset += 20;
            continue;
          }

          // 라인 타입에 따라 스타일 변경
          const content = this.sealContent.find(c => c.text === line);
          const lineType = content ? content.type : 'normal';

          if (lineType === 'header') {
            ctx.fillStyle = '#aaaaaa';
            ctx.font = "12px 'Noto Sans KR', monospace";
          } else if (lineType === 'crucial') {
            ctx.fillStyle = '#ff6666';
            ctx.font = "bold 14px 'Noto Sans KR', monospace";
          } else if (lineType === 'final') {
            ctx.fillStyle = '#ffffff';
            ctx.font = "bold 16px 'Noto Sans KR', monospace";
          } else {
            ctx.fillStyle = '#f5f5f5';
            ctx.font = "14px 'Noto Sans KR', monospace";
          }

          ctx.fillText(line, vw / 2, yOffset);
          yOffset += 28;
        }

        // 최종 순간: 글자 깜빡임
        if (this.finalMoment && this.sealLines.length > 22) {
          const alpha = Math.abs(Math.sin(this.sealPhase * 0.05)) * 0.8 + 0.2;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 18px 'Noto Sans KR', monospace";
          ctx.fillText('너는 오래전부터 기록되었다.', vw / 2, yOffset - 30);
          ctx.globalAlpha = 1;
        }
      }
    }

    // 타이틀
    ctx.save();
    if (!this.isActivating) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(12, 12, 220, 34);
      ctx.fillStyle = '#c7d2fe';
      ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('◈ 진실 봉인소', 22, 29);
    }
    ctx.restore();

    // 맵 경계선
    ctx.strokeStyle = '#2d1b4e';
    ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }
}