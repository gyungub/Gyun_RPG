// truth-record.js - 기록 회랑

class TruthRecordHall extends GameMap {
  constructor() {
    super();
    this.mapId = 'truth-record';
    this.width = 3000;
    this.height = 1200;

    this.phase = 0;
    this.recordDocuments = [];
    this.floatingTexts = [];
    this.glitchEffect = 0;
    this.observedProgress = 0; // 플레이어가 얼마나 진행했는지

    // 초기사건 기록대 연출
    this.showingInitialRecord = false;
    this.recordPhase = 0;
    this.recordLines = [];
    this.recordHighlights = [];
    this.sermonTriggered = false;

    // 용어 교정 문서 연출
    this.showingTerminology = false;
    this.terminologyPhase = 0;
    this.terminologyLines = [];
    this.terminologyHighlights = [];

    // 관측 로그 파편 연출
    this.showingLogs = false;
    this.logsPhase = 0;
    this.logsLines = [];
    this.logsGlitch = 0;

    this._init();
  }

  _init() {
    this.paths = [
      { x: 400, y: 300, w: 2200, h: 600 },  // 메인 복도
      { x: 150, y: 100, w: 200, h: 1000 },  // 입구
      { x: 2650, y: 100, w: 200, h: 1000 }, // 출구
    ];

    this.zones = [
      {
        id: 'truth-record-return',
        label: '🔙 진실의 심부로',
        x: 150, y: 100, w: 200, h: 80,
        color: '#334155', lc: '#1e293b',
      },
      {
        id: 'record-initial',
        label: '📋 초기사건 기록대',
        x: 600, y: 400, w: 180, h: 100,
        color: '#1e1b4b', lc: '#4338ca',
      },
      {
        id: 'record-terminology',
        label: '📜 용어 교정 문서',
        x: 1400, y: 400, w: 180, h: 100,
        color: '#1e1b4b', lc: '#4338ca',
      },
      {
        id: 'record-logs',
        label: '📄 관측 로그 파편',
        x: 2200, y: 400, w: 180, h: 100,
        color: '#1e1b4b', lc: '#4338ca',
      },
    ];

    this.npcs = [
      {
        id: 'scribe',
        label: '📜 서기관',
        x: 1500, y: 200, w: 60, h: 60,
        color: '#4338ca',
      },
    ];

    // 초기사건 기록대 문서 내용
    this.initialRecordContent = [
      { text: '제1 관측 보고서', delay: 0, type: 'title' },
      { text: '하층 군집 반응 재확인 기록', delay: 40, type: 'subtitle' },
      { text: '', delay: 80, type: 'blank' },
      { text: '하층 군집 반응, 인류력 이전 기록과 동일 패턴으로 재확인.', delay: 120, type: 'normal', highlight: '인류력 이전 기록' },
      { text: '', delay: 180, type: 'blank' },
      { text: '상층 거주군 일부가 하층 반응을 감염으로 오인함.', delay: 220, type: 'normal' },
      { text: '', delay: 280, type: 'blank' },
      { text: '해당 군집은 외부 침입성이 아닌 기존 생태 반응으로 판단됨.', delay: 320, type: 'normal' },
      { text: '', delay: 380, type: 'blank' },
      { text: '인류 거주권과 하층 군집권의 경계 약화 확인.', delay: 420, type: 'normal' },
      { text: '', delay: 480, type: 'blank' },
      { text: '동일 현상은 과거 주기 기록과 일치함.', delay: 520, type: 'normal' },
    ];

    // 기록 오브젝트들 (양쪽 벽에 배치)
    for (let i = 0; i < 20; i++) {
      const x = 450 + i * 120;
      const isLeft = i % 2 === 0;
      this.recordDocuments.push({
        x: x,
        y: isLeft ? 250 : 900,
        w: 100,
        h: 60,
        phase: Math.random() * Math.PI * 2,
        age: i * 50, // 나이가 많을수록 더 의심스러운 기록
      });
    }
  }

  interact(player) {
    const playerW = player.w || 40;
    const playerH = player.h || 40;

    // NPC 상호작용
    for (const npc of this.npcs) {
      if (
        player.x + playerW > npc.x - 50 &&
        player.x < npc.x + npc.w + 50 &&
        player.y + playerH > npc.y - 50 &&
        player.y < npc.y + npc.h + 50
      ) {
        this._talkToScribe();
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
    if (id === 'truth-record-return') {
      if (window.changeMap) {
        changeMap('altar-truth');
      }
      return;
    }

    if (id === 'record-initial') {
      this._activateInitialRecord();
      return;
    }

    if (id === 'record-terminology') {
      this._activateTerminologyRecord();
      return;
    }

    if (id === 'record-logs') {
      this._activateLogsRecord();
      return;
    }
  }

  _activateInitialRecord() {
    if (this.showingInitialRecord) return;
    
    this.showingInitialRecord = true;
    this.recordPhase = 0;
    this.recordLines = [];
    this.recordHighlights = [];
    this.sermonTriggered = false;
    
    // 화면 잠금
    if (window.inGacha !== undefined) window.inGacha = true;
  }

  _activateTerminologyRecord() {
    if (this.showingTerminology) return;
    
    this.showingTerminology = true;
    this.terminologyPhase = 0;
    this.terminologyLines = [];
    this.terminologyHighlights = [];
    
    // 화면 잠금
    if (window.inGacha !== undefined) window.inGacha = true;
  }

  _activateLogsRecord() {
    if (this.showingLogs) return;
    
    this.showingLogs = true;
    this.logsPhase = 0;
    this.logsLines = [];
    this.logsGlitch = 0;
    
    // 화면 잠금
    if (window.inGacha !== undefined) window.inGacha = true;
  }

  _updateInitialRecord() {
    if (!this.showingInitialRecord) return;

    this.recordPhase++;

    // 문장들을 시간에 따라 추가
    for (const line of this.initialRecordContent) {
      if (this.recordPhase >= line.delay && !this.recordLines.includes(line.text)) {
        this.recordLines.push(line.text);
        
        // 강조 단어 기록
        if (line.highlight) {
          this.recordHighlights.push({
            text: line.highlight,
            lineIndex: this.recordLines.length - 1,
            startTime: this.recordPhase,
          });
        }

        // 특정 단어에서 노이즈
        if (line.highlight && this.recordPhase === line.delay) {
          this.glitchEffect = 1;
        }
      }
    }

    // 마지막 문장 이후 서기관 대사
    if (this.recordPhase > 580 && !this.sermonTriggered) {
      this.sermonTriggered = true;
      if (window.showDialogue) {
        showDialogue('서기관', '기록은 늘 정확하다.\n\n이해하는 쪽이 늦을 뿐.');
      }
    }

    // 연출 종료 (약 800프레임)
    if (this.recordPhase > 800) {
      this.showingInitialRecord = false;
      if (window.inGacha !== undefined) window.inGacha = false;
    }
  }

  _updateTerminologyRecord() {
    if (!this.showingTerminology) return;

    this.terminologyPhase++;

    // 용어 교정 문서 내용
    const terminologyContent = [
      { text: '교단 내부 기록 용어 수정 지침', delay: 0, type: 'title' },
      { text: '공식 문서 NO. 07-2841', delay: 40, type: 'subtitle' },
      { text: '', delay: 80, type: 'blank' },
      { text: '이하 용어는 모든 공식 기록에서 교정되어야 함:', delay: 120, type: 'normal' },
      { text: '', delay: 160, type: 'blank' },
      { text: '침입 → 상층 확산', delay: 200, type: 'terminology', highlight: '침입' },
      { text: '감염 → 동화 진행', delay: 260, type: 'terminology', highlight: '감염' },
      { text: '오염 → 회귀 반응', delay: 320, type: 'terminology', highlight: '오염' },
      { text: '제거 대상 → 기존 군집 접촉', delay: 380, type: 'terminology', highlight: '제거 대상' },
      { text: '', delay: 440, type: 'blank' },
      { text: '상층 거주군의 혼동을 방지하기 위함', delay: 480, type: 'normal' },
    ];

    for (const line of terminologyContent) {
      if (this.terminologyPhase >= line.delay && !this.terminologyLines.includes(line.text)) {
        this.terminologyLines.push(line.text);
        
        if (line.highlight) {
          this.terminologyHighlights.push({
            text: line.highlight,
            lineIndex: this.terminologyLines.length - 1,
            startTime: this.terminologyPhase,
          });
        }
      }
    }

    // 최종 대사
    if (this.terminologyPhase > 550) {
      this.showingTerminology = false;
      if (window.inGacha !== undefined) window.inGacha = false;
      if (window.showDialogue) {
        showDialogue('생각', '교단은 단어를 바꿔서 진실을 숨기고 있다.');
      }
    }
  }

  _updateLogsRecord() {
    if (!this.showingLogs) return;

    this.logsPhase++;

    // 관측 로그 파편 (일부러 깨져있음)
    const logsContent = [
      { text: '관측 로그 파편 #4821-A', delay: 0, type: 'title' },
      { text: '[시간 기록 손상]', delay: 40, type: 'corrupted' },
      { text: '', delay: 80, type: 'blank' },
      { text: '표본군 반응 안정 [██████]', delay: 120, type: 'normal' },
      { text: '상층 개체군은 아직 인지하지 못함 [██]', delay: 180, type: 'normal' },
      { text: '관리 단계 유지 가능 [████████]', delay: 240, type: 'normal' },
      { text: '', delay: 300, type: 'blank' },
      { text: '[데이터 부패]', delay: 340, type: 'corrupted' },
      { text: '표본 개체 ID: H-███', delay: 380, type: 'normal' },
      { text: '관측 기간: ████년', delay: 440, type: 'normal' },
      { text: '다음 주기까지 관찰 계속', delay: 500, type: 'normal' },
    ];

    for (const line of logsContent) {
      if (this.logsPhase >= line.delay && !this.logsLines.includes(line.text)) {
        this.logsLines.push(line.text);
        
        if (line.type === 'corrupted') {
          this.logsGlitch = 1;
        }
      }
    }

    // 최종 대사
    if (this.logsPhase > 580) {
      this.showingLogs = false;
      if (window.inGacha !== undefined) window.inGacha = false;
      if (window.showDialogue) {
        showDialogue('생각', '우리는 보호 대상이 아니었다.\n우리는 표본이었다.\n그리고 여전히 그렇다.');
      }
    }
  }

  _talkToScribe() {
    const dialogues = [
      '기록은 거짓말을 하지 않는다.',
      '다만 기록자는 자주 거짓말을 한다.',
      '읽는 자는 문장을 믿고, 기록한 자는 문장을 숨긴다.',
      '이 기록들을 읽어보게나. 뭔가 느껴질 것이다.',
      '교단은 처음부터 뭔가 알고 있었다.',
    ];

    const random = Math.floor(Math.random() * dialogues.length);
    if (window.showDialogue) {
      showDialogue('서기관', dialogues[random]);
    }
  }

  _updateRecords() {
    // 플레이어 진행도에 따라 기록들의 상태 변경
    for (let i = 0; i < this.recordDocuments.length; i++) {
      const doc = this.recordDocuments[i];
      doc.phase += 0.01;
      
      // 플레이어가 지나간 기록들은 더 밝게, 앞의 기록들은 어둡게
      if (this.observedProgress < i * 120) {
        doc.alpha = 0.3 + Math.sin(this.phase + doc.phase) * 0.2;
        doc.glitch = 0;
      } else {
        doc.alpha = 0.8 + Math.sin(doc.phase) * 0.1;
        doc.glitch = Math.sin(this.phase * 2 + i) * 0.3;
      }
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateRecords();
    this._updateInitialRecord();
    this._updateTerminologyRecord();
    this._updateLogsRecord();

    // 배경 - 무균실 같은 흰색 톤
    ctx.fillStyle = '#f5f1e8';
    ctx.fillRect(0, 0, vw, vh);

    // 천장 조명 - 맥동하는 균사 기둥
    const ceilingGlow = ctx.createLinearGradient(0, 0, 0, 100);
    ceilingGlow.addColorStop(0, `rgba(138,43,226,${0.08 + Math.sin(this.phase) * 0.04})`);
    ceilingGlow.addColorStop(1, 'rgba(138,43,226,0)');
    ctx.fillStyle = ceilingGlow;
    ctx.fillRect(0, 0, vw, 100);

    // 바닥 - 기록 인장과 봉인 문양
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#333';
    for (let i = 0; i < 10; i++) {
      const sealX = (i * 300 - camX) % (vw + 300);
      ctx.font = "bold 80px serif";
      ctx.textAlign = 'center';
      ctx.fillText('◈', sealX, vh - 50);
    }
    ctx.restore();

    // 바닥 경로
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      ctx.fillStyle = '#e8dcc8';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#9c8b7e';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 좌측 기록 보관함 (위쪽)
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#7c6b5d';
    for (let i = 0; i < 20; i++) {
      const x = 450 + i * 120;
      ctx.fillRect(x - camX, 100 - camY, 100, 80);
    }
    ctx.restore();

    // 우측 기록 보관함 (아래쪽)
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#7c6b5d';
    for (let i = 0; i < 20; i++) {
      const x = 450 + i * 120;
      ctx.fillRect(x - camX, 1000 - camY, 100, 80);
    }
    ctx.restore();

    // 떠다니는 기록 문서들
    for (const doc of this.recordDocuments) {
      const sx = doc.x - camX;
      const sy = doc.y - camY;

      if (sx > -200 && sx < vw + 200 && sy > -200 && sy < vh + 200) {
        ctx.save();
        ctx.globalAlpha = doc.alpha;

        // 글리치 효과
        if (doc.glitch > 0) {
          ctx.translate(sx + Math.random() * doc.glitch * 10, sy);
        } else {
          ctx.translate(sx, sy);
        }

        // 문서 배경
        ctx.fillStyle = '#f9f7f3';
        ctx.fillRect(0, 0, doc.w, doc.h);
        ctx.strokeStyle = '#a89888';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, doc.w, doc.h);

        // 문서 텍스트 (읽을수록 의심스러워짐)
        ctx.fillStyle = '#333';
        ctx.font = "8px 'Courier New'";
        ctx.textAlign = 'left';
        ctx.fillText('기록', 4, 12);
        ctx.fillText('RE-OBS', 4, 24);

        ctx.restore();
      }
    }

    // 존 표시
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      ctx.fillStyle = z.color;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);

      ctx.fillStyle = '#c7d2fe';
      ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w / 2, sy + z.h / 2);
    }

    // NPC 표시
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#c7d2fe';
      ctx.font = "10px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w / 2, sy + npc.h + 15);
      ctx.restore();
    }

    // === 초기사건 기록대 연출 ===
    if (this.showingInitialRecord) {
      // 1. 화면 어두워짐
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();

      // 2. 중앙 문서 표시
      const docW = 600;
      const docH = 400;
      const docX = (vw - docW) / 2;
      const docY = (vh - docH) / 2;

      ctx.save();
      ctx.fillStyle = '#f5f1e8';
      ctx.fillRect(docX, docY, docW, docH);
      ctx.strokeStyle = '#4c3d2e';
      ctx.lineWidth = 3;
      ctx.strokeRect(docX, docY, docW, docH);

      // 3. 문장 출력
      ctx.fillStyle = '#333';
      ctx.font = "bold 16px 'Noto Sans KR', serif";
      ctx.textAlign = 'center';
      let yOffset = docY + 30;

      for (let i = 0; i < this.recordLines.length; i++) {
        const line = this.recordLines[i];
        
        if (line === '') {
          yOffset += 15;
          continue;
        }

        // 강조 단어 확인
        const highlight = this.recordHighlights.find(h => h.lineIndex === i);

        if (highlight) {
          // 강조된 단어가 있는 라인 처리
          const beforeText = line.substring(0, line.indexOf(highlight.text));
          const highlightText = highlight.text;
          const afterText = line.substring(line.indexOf(highlight.text) + highlight.text.length);

          ctx.fillStyle = '#333';
          ctx.font = "14px 'Noto Sans KR', serif";
          ctx.textAlign = 'left';
          const startX = docX + 30;
          ctx.fillText(beforeText, startX, yOffset);

          // 강조 단어 - 빨간색 + 깜빡임
          const alpha = 0.5 + Math.sin(this.recordPhase * 0.1) * 0.5;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ff0000';
          ctx.fillText(highlightText, startX + ctx.measureText(beforeText).width, yOffset);
          ctx.globalAlpha = 1;

          ctx.fillStyle = '#333';
          ctx.fillText(afterText, startX + ctx.measureText(beforeText).width + ctx.measureText(highlightText).width, yOffset);
        } else {
          ctx.fillStyle = '#333';
          ctx.font = "14px 'Noto Sans KR', serif";
          ctx.textAlign = 'left';
          ctx.fillText(line, docX + 30, yOffset);
        }

        yOffset += 25;
      }

      // 4. 글리치 효과 (강조 단어에서)
      if (this.glitchEffect > 0) {
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = `rgba(255,0,0,${Math.random() * 0.3})`;
          ctx.fillRect(
            docX + Math.random() * docW,
            docY + Math.random() * docH,
            Math.random() * 40,
            Math.random() * 10
          );
        }
        this.glitchEffect -= 0.05;
      }

      ctx.restore();
    }

    // === 용어 교정 문서 연출 ===
    if (this.showingTerminology) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();

      const docW = 600;
      const docH = 420;
      const docX = (vw - docW) / 2;
      const docY = (vh - docH) / 2;

      ctx.save();
      ctx.fillStyle = '#f0e8d8';
      ctx.fillRect(docX, docY, docW, docH);
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 3;
      ctx.strokeRect(docX, docY, docW, docH);

      let yOffset = docY + 30;
      for (let i = 0; i < this.terminologyLines.length; i++) {
        const line = this.terminologyLines[i];
        
        if (line === '') {
          yOffset += 15;
          continue;
        }

        const highlight = this.terminologyHighlights.find(h => h.lineIndex === i);

        if (highlight) {
          const beforeText = line.substring(0, line.indexOf(highlight.text));
          const highlightText = highlight.text;
          const afterText = line.substring(line.indexOf(highlight.text) + highlight.text.length);

          ctx.fillStyle = '#333';
          ctx.font = "13px 'Noto Sans KR', monospace";
          ctx.textAlign = 'left';
          const startX = docX + 30;
          ctx.fillText(beforeText, startX, yOffset);

          // 취소선 효과
          const beforeWidth = ctx.measureText(beforeText).width;
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX + beforeWidth, yOffset - 8);
          ctx.lineTo(startX + beforeWidth + ctx.measureText(highlightText).width, yOffset - 8);
          ctx.stroke();

          ctx.fillStyle = '#ff4444';
          ctx.fillText(highlightText, startX + beforeWidth, yOffset);

          ctx.fillStyle = '#333';
          ctx.fillText(afterText, startX + beforeWidth + ctx.measureText(highlightText).width, yOffset);
        } else {
          ctx.fillStyle = '#333';
          ctx.font = "13px 'Noto Sans KR', monospace";
          ctx.textAlign = 'left';
          ctx.fillText(line, docX + 30, yOffset);
        }

        yOffset += 28;
      }

      ctx.restore();
    }

    // === 관측 로그 파편 연출 ===
    if (this.showingLogs) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();

      const docW = 580;
      const docH = 380;
      const docX = (vw - docW) / 2;
      const docY = (vh - docH) / 2;

      ctx.save();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(docX, docY, docW, docH);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(docX, docY, docW, docH);

      let yOffset = docY + 30;
      for (let i = 0; i < this.logsLines.length; i++) {
        const line = this.logsLines[i];
        
        if (line === '') {
          yOffset += 12;
          continue;
        }

        // 손상된 라인은 글리치 처리
        if (line.includes('[') && line.includes(']')) {
          // 깜빡이는 효과
          if (Math.sin(this.logsPhase * 0.1 + i) > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.globalAlpha = 0.4;
          } else {
            ctx.fillStyle = '#00aa00';
            ctx.globalAlpha = 0.2;
          }
        } else {
          ctx.fillStyle = '#00ff00';
          ctx.globalAlpha = 0.9;
        }

        ctx.font = "12px 'Courier New', monospace";
        ctx.textAlign = 'left';
        ctx.fillText(line, docX + 20, yOffset);

        yOffset += 24;
      }

      ctx.restore();
    }

    // 플레이어 위치 추적 (진행도 업데이트)
    this.observedProgress = (window.player?.x || 0) - 400;

    // 타이틀
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(12, 12, 200, 34);
    ctx.fillStyle = '#333';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('📜 기록 회랑', 22, 29);
    ctx.restore();

    // 맵 경계선
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, this.width, this.height);
  }
}