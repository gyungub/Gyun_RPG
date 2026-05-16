// gyunresearchlab.js - 균균 연구소 (공포/미스터리 분위기)

class GyunResearchLab extends GameMap {
  constructor() {
    super();
    this.mapId = 'gyun-research-lab';
    this.width = 1600;
    this.height = 1200;
    
    this.currentTab = 'codex';
    this.selectedGyun = null;
    this.glitchEffect = 0;
    this.noiseIntensity = 0;
    this.researcherX = 1200;
    this.researcherY = 900;
    this.researcherShake = 0;
    this.codexScroll = 0;
    
    // 실제 뽑기에서 획득한 균들을 저장
    this.playerCollection = JSON.parse(localStorage.getItem('gyun_lab_collection') || '{}');
    
    this.gyunDatabase = {};

    for (const [id, count] of Object.entries(this.playerCollection)) {
      this.gyunDatabase[id] = {
        name: id,
        rarity: 'unknown',
        icon: '🧪',
        danger: '불명',
        behavior: '관찰 중',
        desc: `${id}에 대한 기본 데이터.`,
        observe: `${id}는 지속적으로 증식 중이다.`,
        memo: `연구원들이 ${id}를 두려워하기 시작했다.`,
        secret: `${id}는 이미 연구소를 장악했다.`
      };
    }
    
    this.researchLog = [
      '2026-01-15: 표본 수집 완료',
      '2026-01-20: 이상 반응 발견',
      '2026-02-03: 미확인 개체 출현',
      '2026-02-15: 데이터 자동 수정됨',
      '2026-03-01: 표본들이 말을 하기 시작했습니다',
      '2026-03-10: 실험은 대부분 성공적이었습니다',
    ];
    
    this._init();
  }
  
  _init() {
    this.paths = [
      { x: 0, y: 150, w: 1600, h: 1050 },
    ];
    
    this.zones = [
      {
        id: 'lab-exit',
        label: '나가기',
        x: 50, y: 160, w: 100, h: 60,
        color: '#1e293b', lc: '#334155',
      }
    ];
  }
  
  getZone(px, py, pw, ph) {
    return this.zones.find((z) => {
      return px < z.x + z.w && px + pw > z.x && py < z.y + z.h && py + ph > z.y;
    }) || null;
  }
  
  interact(player) {
    const playerW = player.w || 40;
    const playerH = player.h || 40;
    for (const z of this.zones) {
      if (
        player.x + playerW > z.x - 40 && player.x < z.x + z.w + 40 &&
        player.y + playerH > z.y - 40 && player.y < z.y + z.h + 40
      ) {
        if (z.id === 'lab-exit' && window.changeMap) {
          changeMap('altar-truth');
          return;
        }
      }
    }
  }
  
  draw(ctx, camX, camY, vw, vh) {
    // 배경 - 남색 조명
    ctx.fillStyle = '#0a1428';
    ctx.fillRect(0, 0, vw, vh);
    
    // 남색 그라데이션
    const grad = ctx.createLinearGradient(0, 0, vw, vh);
    grad.addColorStop(0, 'rgba(15, 30, 70, 0.3)');
    grad.addColorStop(0.5, 'rgba(10, 20, 50, 0.4)');
    grad.addColorStop(1, 'rgba(5, 15, 40, 0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vw, vh);
    
    // 깜빡임 효과
    if (Math.random() > 0.98) {
      this.glitchEffect = 10;
      this.noiseIntensity = 0.3;
    }
    
    if (this.glitchEffect > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.glitchEffect * 0.05})`;
      ctx.fillRect(0, 0, vw, vh);
      this.glitchEffect--;
    }
    
    // 노이즈 효과
    if (this.noiseIntensity > 0) {
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * vw;
        const y = Math.random() * vh;
        ctx.fillStyle = `rgba(100, 200, 255, ${Math.random() * this.noiseIntensity})`;
        ctx.fillRect(x, y, 2, 2);
      }
      this.noiseIntensity *= 0.95;
    }
    
    // 헤더
    ctx.fillStyle = 'rgba(20, 50, 100, 0.6)';
    ctx.fillRect(0, 0, vw, 140);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, vw, 140);
    
    // 제목
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 24px "Jua", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('GYUN LABORATORY', 20, 40);
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('표본 관리 구역', 30, 60);
    
    // 나가기 버튼
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(50, 80, 100, 50);
    ctx.strokeStyle = '#64c8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 80, 100, 50);
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 12px "Jua"';
    ctx.textAlign = 'center';
    ctx.fillText('나가기', 100, 110);
    
    // 탭
    const tabs = [
      { id: 'codex', label: '도감' },
      { id: 'analysis', label: '분석' },
      { id: 'records', label: '기록' },
      { id: 'progress', label: '진척도' }
    ];
    
    let tabX = 200;
    for (const tab of tabs) {
      const isActive = this.currentTab === tab.id;
      ctx.fillStyle = isActive ? 'rgba(100, 150, 255, 0.5)' : 'rgba(50, 80, 150, 0.3)';
      ctx.fillRect(tabX, 85, 110, 50);
      ctx.strokeStyle = isActive ? '#64c8ff' : '#3a5a9f';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(tabX, 85, 110, 50);
      
      ctx.fillStyle = isActive ? '#64c8ff' : '#7aa0d0';
      ctx.font = 'bold 12px "Jua"';
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tabX + 55, 115);
      
      tabX += 125;
    }
    
    // 컨텐츠 영역
    ctx.fillStyle = 'rgba(15, 25, 60, 0.5)';
    ctx.fillRect(20, 150, vw - 40, vh - 190);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 150, vw - 40, vh - 190);
    
    // 연구원 균 NPC 그리기
    this.drawResearcher(ctx, this.researcherX, this.researcherY);
    
    // 각 탭별 콘텐츠
    if (this.currentTab === 'codex') {
      this.drawCodex(ctx, vw, vh);
    } else if (this.currentTab === 'analysis') {
      this.drawAnalysis(ctx, vw, vh);
    } else if (this.currentTab === 'records') {
      this.drawRecords(ctx, vw, vh);
    } else if (this.currentTab === 'progress') {
      this.drawProgress(ctx, vw, vh);
    }
  }
  
  drawResearcher(ctx, x, y) {
    // 흰 연구복
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x - 15, y + 10, 30, 40);
    
    // 머리
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(x, y - 5, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // 눈 - 무표정하고 이상함
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - 5, y - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5, y - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 피부 아래 균사 움직임
    ctx.strokeStyle = 'rgba(100, 200, 100, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const waveY = y - 5 + Math.sin(this.researcherShake + i) * 2;
      ctx.beginPath();
      ctx.moveTo(x - 10, waveY);
      ctx.lineTo(x + 10, waveY + 2);
      ctx.stroke();
    }
    
    this.researcherShake += 0.05;
  }
  
  drawCodex(ctx, vw, vh) {

    ctx.save();

    ctx.beginPath();
    ctx.rect(20, 150, vw - 40, vh - 190);
    ctx.clip();

    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 14px "Jua"';
    ctx.textAlign = 'left';
    ctx.fillText('수집된 표본', 40, 180);
    
    let itemY = 210 - map.codexScroll;
    const itemsPerRow = 6;
    let itemX = 40;
    let itemsInRow = 0;
    
    for (const [gyunId, gyun] of Object.entries(this.gyunDatabase)) {
      if (itemsInRow >= itemsPerRow) {
        itemX = 40;
        itemY += 100;
        itemsInRow = 0;
      }

      if (itemY + 80 < 160 || itemY > vh - 40) {
        itemX += 100;
        itemsInRow++;
        continue;
      }
      
      const count = this.playerCollection[gyunId] || 0;
      const isSelected = this.selectedGyun === gyunId;
      
      ctx.fillStyle = isSelected ? 'rgba(100, 150, 255, 0.4)' : 'rgba(50, 80, 150, 0.2)';
      ctx.fillRect(itemX, itemY, 80, 80);
      ctx.strokeStyle = isSelected ? '#64c8ff' : 'rgba(100, 150, 200, 0.3)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(itemX, itemY, 80, 80);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gyun.icon, itemX + 40, itemY + 35);
      
      if (count > 0) {
        ctx.fillStyle = '#64c8ff';
        ctx.font = 'bold 10px "Jua"';
        ctx.fillText(gyun.name, itemX + 40, itemY + 60);
        ctx.fillStyle = '#aaa';
        ctx.font = '8px monospace';
        ctx.fillText(`x${count}`, itemX + 40, itemY + 73);
      } else {
        ctx.fillStyle = '#555';
        ctx.font = 'bold 10px "Jua"';
        ctx.fillText('???', itemX + 40, itemY + 60);
      }
      
      itemX += 100;
      itemsInRow++;
    }
    
    ctx.fillStyle = '#888';
    ctx.font = '11px "Jua"';
    ctx.textAlign = 'center';
    ctx.fillText('E키 또는 클릭으로 선택', vw / 2, vh - 40);

    ctx.restore();
  }
  
  drawAnalysis(ctx, vw, vh) {
    if (!this.selectedGyun) {
      ctx.fillStyle = '#888';
      ctx.font = '14px "Jua"';
      ctx.textAlign = 'center';
      ctx.fillText('도감에서 표본을 선택하여 분석하십시오.', vw / 2, vh / 2);
      return;
    }
    
    const gyun = this.gyunDatabase[this.selectedGyun];
    const count = this.playerCollection[this.selectedGyun] || 0;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(gyun.icon, 60, 200);
    
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 20px "Jua"';
    ctx.fillText(gyun.name, 140, 185);
    
    ctx.fillStyle = gyun.rarity === 'rare' ? '#ff99ff' : gyun.rarity === 'hidden' ? '#ff0000' : '#4ade80';
    ctx.font = '12px monospace';
    ctx.fillText(`[${gyun.rarity.toUpperCase()}] 위험도: ${gyun.danger}`, 140, 210);
    
    ctx.fillStyle = '#aaa';
    ctx.fillText(`획득: ${count}회`, 60, 240);
    
    let textY = 280;
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    
    ctx.fillText('> 기본 설명:', 60, textY);
    ctx.fillStyle = '#ddd';
    ctx.font = '11px monospace';
    ctx.fillText(gyun.desc, 60, textY + 20);
    
    if (count >= 1) {
      textY += 50;
      ctx.fillStyle = '#64c8ff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('> 관찰 기록:', 60, textY);
      ctx.fillStyle = '#ddd';
      ctx.font = '11px monospace';
      ctx.fillText(gyun.observe, 60, textY + 20);
    }
    
    if (count >= 3) {
      textY += 50;
      ctx.fillStyle = '#ff99ff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('> 특수 메모:', 60, textY);
      ctx.fillStyle = '#ff99ff';
      ctx.font = '11px monospace';
      ctx.fillText(gyun.memo, 60, textY + 20);
    }
    
    if (count >= 5 && gyun.secret) {
      textY += 50;
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('> [기밀]', 60, textY);
      ctx.fillStyle = '#ff6666';
      ctx.font = '11px monospace';
      ctx.fillText(gyun.secret, 60, textY + 20);
      
      // 히든 개체 특수 효과
      if (gyun.rarity === 'hidden') {
        this.glitchEffect = 5;
        this.noiseIntensity = 0.2;
      }
    }
  }
  
  drawRecords(ctx, vw, vh) {
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('[RESEARCH LOG]', 60, 180);
    
    let logY = 210;
    for (const log of this.researchLog) {
      ctx.fillStyle = '#888';
      ctx.font = '11px monospace';
      ctx.fillText(log, 60, logY);
      logY += 25;
    }
    
    logY += 20;
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('[WARNING]', 60, logY);
    ctx.fillStyle = '#ff9999';
    ctx.font = '11px monospace';
    logY += 20;
    ctx.fillText('데이터 손상 감지됨. 일부 기록이 누락되었습니다.', 60, logY);
    logY += 20;
    ctx.fillText('표본들이 관찰자를 추적 중입니다.', 60, logY);
  }
  
  drawProgress(ctx, vw, vh) {
    const total = Object.keys(this.gyunDatabase).length;
    const obtained = Object.values(this.playerCollection).filter(c => c > 0).length;
    const rate = Math.floor((obtained / total) * 100);
    
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('수집 진척도', 60, 180);
    
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`총 확보: ${obtained} / ${total}`, 60, 210);
    
    // 프로그레스 바
    ctx.fillStyle = 'rgba(50, 100, 150, 0.5)';
    ctx.fillRect(60, 230, 400, 20);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
    ctx.fillRect(60, 230, (400 * rate) / 100, 20);
    ctx.strokeStyle = '#64c8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 230, 400, 20);
    
    ctx.fillStyle = '#64c8ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${rate}%`, 470, 245);
  }
}

// E키로 분석, Tab으로 탭 전환
document.addEventListener('keydown', (e) => {
  if (currentMapId !== 'gyun-research-lab' || !map) return;
  
  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    e.stopImmediatePropagation(); 
    const obtained = Object.entries(map.gyunDatabase)
      .filter(([id]) => map.playerCollection[id] > 0)
      .map(([id]) => id);
    
    if (obtained.length === 0) {
      if (map.currentTab === 'codex') map.selectedGyun = null;
      return;
    }
    
    if (map.currentTab === 'codex') {
      if (map.selectedGyun) {
        map.currentTab = 'analysis';
      } else {
        map.selectedGyun = obtained[0];
        map.currentTab = 'analysis';
      }
    } else if (map.currentTab === 'analysis') {
      map.currentTab = 'codex';
      map.selectedGyun = null;
    }
  }
  
  if (e.key === 'Tab') {
    e.preventDefault();
    const tabs = ['codex', 'analysis', 'records', 'progress'];
    const currentIndex = tabs.indexOf(map.currentTab);
    map.currentTab = tabs[(currentIndex + 1) % tabs.length];
    map.selectedGyun = null;
  }
});

// 균 선택 (도감에서) 및 탭 전환
document.addEventListener('click', (e) => {
  if (currentMapId !== 'gyun-research-lab' || !map) return;
  
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  // 탭 클릭
  const tabs = [
    { id: 'codex', x: 200, y: 85, w: 110, h: 50 },
    { id: 'analysis', x: 325, y: 85, w: 110, h: 50 },
    { id: 'records', x: 450, y: 85, w: 110, h: 50 },
    { id: 'progress', x: 575, y: 85, w: 110, h: 50 }
  ];
  
  for (const tab of tabs) {
    if (clickX > tab.x && clickX < tab.x + tab.w && clickY > tab.y && clickY < tab.y + tab.h) {
      map.currentTab = tab.id;
      map.selectedGyun = null;
      return;
    }
  }
  
  // 균 선택 (도감 탭)
  if (map.currentTab === 'codex') {
    let itemY = 210;
    const itemsPerRow = 6;
    let itemX = 40;
    let itemsInRow = 0;
    
    for (const [gyunId] of Object.entries(map.gyunDatabase)) {
      if (itemsInRow >= itemsPerRow) {
        itemX = 40;
        itemY += 100;
        itemsInRow = 0;
      }
      
      if (clickX > itemX && clickX < itemX + 80 && clickY > itemY && clickY < itemY + 80) {
        map.selectedGyun = gyunId;
        return;
      }
      
      itemX += 100;
      itemsInRow++;
    }
  }
  
  // 나가기 버튼
  if (clickX > 50 && clickX < 150 && clickY > 80 && clickY < 130) {
    changeMap('altar-truth');
  }
});

document.addEventListener('wheel', (e) => {
  if (currentMapId !== 'gyun-research-lab' || !map) return;
  if (map.currentTab !== 'codex') return;

  e.preventDefault();

  map.codexScroll += e.deltaY * 0.5;

  if (map.codexScroll < 0) {
    map.codexScroll = 0;
  }

  const totalRows = Math.ceil(Object.keys(map.gyunDatabase).length / 6);
  const maxScroll = Math.max(0, totalRows * 100 - 500);

  if (map.codexScroll > maxScroll) {
    map.codexScroll = maxScroll;
  }
}, { passive: false });
