// altar-mutation.js - 변이의 심부 (프로토타입)

class AltarMutationDepth extends GameMap {
  constructor() {
    super();
    this.mapId = 'altar-mutation';
    this.width = 2200;
    this.height = 1800;

    this.phase = 0;
    this.cells = [];
    this.pulses = [];
    this.floatingTexts = [];

    this.showUI = false;
    this._choice = null; // { items: [mutationId...], createdAt }

    this._init();
  }

  _init() {
    this.paths = [
      { x: 200, y: 200, w: 1800, h: 1400 },
      { x: 950, y: 70, w: 300, h: 220 },
    ];

    this.zones = [
      {
        id: 'altar-depth-return',
        label: '🔙 중앙 대제단으로',
        x: 960, y: 90, w: 280, h: 90,
        color: '#334155', lc: '#1e293b',
      },
    ];

    this.npcs = [
      { id: 'mutation-surgeon', label: '🧬 변이 집행관', x: 1050, y: 980, w: 70, h: 70, color: '#10b981' },
    ];

    for (let i = 0; i < 26; i++) {
      this.cells.push({
        x: 320 + Math.random() * 1560,
        y: 320 + Math.random() * 1240,
        r: 10 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() < 0.5 ? '#34d399' : '#a7f3d0',
      });
    }
  }

  openUI() {
    this.showUI = true;
    if (!this._choice || !this._choice.items?.length) this.rollChoices();
  }
  closeUI() { this.showUI = false; }

  _addFloatingText(text, color = '#a7f3d0') {
    this.floatingTexts.push({
      text,
      color,
      x: 700 + Math.random() * 600,
      y: 520 + Math.random() * 260,
      life: 150,
      maxLife: 150,
    });
  }

  rollChoices(force = false) {
    const state = getMutationState();
    if (!force && this._choice && Date.now() - this._choice.createdAt < 1500) return;

    const unlocked = new Set(state.mutations);
    const pool = MUTATIONS.filter(m => !unlocked.has(m.id));
    if (pool.length === 0) {
      this._choice = { items: [], createdAt: Date.now() };
      return;
    }
    // 3개 랜덤 제시
    const items = [];
    const tmp = [...pool];
    while (items.length < 3 && tmp.length > 0) {
      const idx = Math.floor(Math.random() * tmp.length);
      items.push(tmp.splice(idx, 1)[0].id);
    }
    this._choice = { items, createdAt: Date.now() };
  }

  handleClick(mouseX, mouseY) {
    if (!this.showUI) return;

    // 닫기 버튼
    if (this._closeBtnX !== undefined &&
        mouseX >= this._closeBtnX && mouseX <= this._closeBtnX + 30 &&
        mouseY >= this._closeBtnY && mouseY <= this._closeBtnY + 30) {
      this.closeUI();
      return;
    }

    // 리롤 버튼
    if (this._rerollBtn &&
        mouseX >= this._rerollBtn.x && mouseX <= this._rerollBtn.x + this._rerollBtn.w &&
        mouseY >= this._rerollBtn.y && mouseY <= this._rerollBtn.y + this._rerollBtn.h) {
      const cost = 6;
      if (getGyunFragments() < cost) {
        this._addFloatingText('균 조각이 부족하다.', '#f87171');
        return;
      }
      spendGyunFragments(cost);
      this.rollChoices(true);
      this._addFloatingText('재구성…', '#fbbf24');
      return;
    }

    // 변이 선택 버튼
    for (const m of MUTATIONS) {
      if (!m._btn) continue;
      const b = m._btn;
      if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
        this._chooseMutation(m.id);
        return;
      }
    }
  }

  _chooseMutation(mutationId) {
    const m = MUTATIONS.find(x => x.id === mutationId);
    if (!m) return;
    const state = getMutationState();
    if (state.mutations.includes(mutationId)) {
      this._addFloatingText('이미 동화됐다.', '#9ca3af');
      return;
    }
    if (state.mutations.length >= MUTATION_MAX) {
      this._addFloatingText('더는 담을 수 없다.', '#f87171');
      return;
    }
    if (getGyunFragments() < m.cost) {
      this._addFloatingText('균 조각이 부족하다.', '#f87171');
      return;
    }
    spendGyunFragments(m.cost);
    state.mutations.push(mutationId);
    saveMutationState(state);
    this._addFloatingText(`${m.icon} ${m.name} — 동화 완료`, '#a7f3d0');
    this._addFloatingText(m.gain, '#4ade80');
    if (m.risk) this._addFloatingText(m.risk, '#fca5a5');
    this.rollChoices(true);
  }

  _updateCells() {
    for (const c of this.cells) {
      c.phase += 0.015;
      if (Math.random() < 0.01) {
        this.pulses.push({
          x: c.x,
          y: c.y,
          r: c.r,
          life: 1,
          color: '#10b981',
        });
      }
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.r += 1.8;
      p.life -= 0.025;
      if (p.life <= 0) this.pulses.splice(i, 1);
    }
  }

  draw(ctx, camX, camY, vw, vh) {
    this.phase += 0.02;
    this._updateCells();

    ctx.fillStyle = '#020b08';
    ctx.fillRect(0, 0, vw, vh);

    const haze = ctx.createRadialGradient(vw/2, vh/2, 0, vw/2, vh/2, Math.max(vw, vh) * 0.8);
    haze.addColorStop(0, `rgba(16,185,129,${0.14 + Math.sin(this.phase) * 0.03})`);
    haze.addColorStop(0.55, 'rgba(0,0,0,0.08)');
    haze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, vw, vh);

    // 바닥
    for (const p of this.paths) {
      const sx = p.x - camX, sy = p.y - camY;
      if (sx > vw || sy > vh || sx + p.w < 0 || sy + p.h < 0) continue;
      const pulse = 0.55 + Math.sin(this.phase * 1.8 + (p.x + p.y) * 0.002) * 0.08;
      ctx.fillStyle = `rgba(0,18,12,${pulse})`;
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, sy, p.w, p.h);
    }

    // 세포 덩어리
    for (const c of this.cells) {
      const x = c.x - camX + Math.sin(c.phase) * 8;
      const y = c.y - camY + Math.cos(c.phase * 0.8) * 6;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, c.r + Math.sin(this.phase * 2 + c.phase) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, c.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 펄스 링
    for (const p of this.pulses) {
      const x = p.x - camX, y = p.y - camY;
      ctx.save();
      ctx.globalAlpha = p.life * 0.25;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 존
    for (const z of this.zones) {
      const sx = z.x - camX, sy = z.y - camY;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = z.color;
      ctx.fillRect(sx, sy, z.w, z.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = z.lc; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, z.w, z.h);
      ctx.fillStyle = '#94a3b8';
      ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.label, sx + z.w/2, sy + z.h/2);
      ctx.textBaseline = 'alphabetic';
    }

    // NPC
    for (const npc of this.npcs) {
      const sx = npc.x - camX, sy = npc.y - camY;
      ctx.save();
      ctx.globalAlpha = 0.75 + Math.sin(this.phase * 1.3) * 0.2;
      ctx.fillStyle = npc.color;
      ctx.fillRect(sx, sy, npc.w, npc.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#a7f3d0'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, npc.w, npc.h);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = "12px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(npc.label, sx + npc.w/2, sy + npc.h + 18);
      ctx.restore();
    }

    // 타이틀
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 60, 270, 34);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧬 변이의 심부', 22, 77);
    ctx.restore();

    // 안내 텍스트
    if (!this.showUI) {
      ctx.save();
      ctx.globalAlpha = 0.65 + Math.sin(this.phase * 2) * 0.15;
      ctx.fillStyle = '#a7f3d0';
      ctx.font = "bold 15px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('[ E키 — 변이 집행관과 동화하라 ]', vw/2, vh - 60);
      ctx.restore();
    }

    this._drawFloatingTexts(ctx);

    ctx.strokeStyle = '#00120b';
    ctx.lineWidth = 8;
    ctx.strokeRect(-camX, -camY, this.width, this.height);

    // UI를 맨 마지막에 그리기
    if (this.showUI) this._drawUI(ctx, vw, vh);
  }

  _drawUI(ctx, vw, vh) {
    const panelW = 720, panelH = 560;
    const px2 = vw/2 - panelW/2, py2 = vh/2 - panelH/2;

    const frags = getGyunFragments();
    const st = getMutationState();
    const selected = new Set(st.mutations);

    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.fillStyle = '#00110c';
    ctx.fillRect(px2, py2, panelW, panelH);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(px2, py2, panelW, panelH);
    ctx.globalAlpha = 1;

    // 제목
    ctx.fillStyle = '#a7f3d0';
    ctx.font = "bold 20px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('🧬 변이 집행 — 동화 선택', vw/2, py2 + 34);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.fillText('획득은 축복이 아니라, 대가다.', vw/2, py2 + 54);

    ctx.fillStyle = '#fbbf24';
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.fillText(`🔮 균 조각: ${frags}    |    동화: ${st.mutations.length}/${MUTATION_MAX}`, vw/2, py2 + 82);

    // 닫기 버튼
    const closeX = px2 + panelW - 40, closeY = py2 + 10;
    ctx.fillStyle = '#052e24';
    ctx.fillRect(closeX, closeY, 30, 30);
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5;
    ctx.strokeRect(closeX, closeY, 30, 30);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✕', closeX + 15, closeY + 15);
    ctx.textBaseline = 'alphabetic';
    this._closeBtnX = closeX; this._closeBtnY = closeY;

    // 현재 보유 변이 목록(좌측)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px2 + 16, py2 + 110, 250, panelH - 160);
    ctx.strokeStyle = '#064e3b'; ctx.lineWidth = 1.5;
    ctx.strokeRect(px2 + 16, py2 + 110, 250, panelH - 160);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('보유 변이', px2 + 28, py2 + 132);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = "11px 'Noto Sans KR', sans-serif";
    if (st.mutations.length === 0) {
      ctx.fillText('— 아직 아무것도 없다.', px2 + 28, py2 + 154);
    } else {
      for (let i = 0; i < st.mutations.length; i++) {
        const id = st.mutations[i];
        const m = MUTATIONS.find(x => x.id === id);
        if (!m) continue;
        const y = py2 + 154 + i * 22;
        ctx.fillStyle = '#a7f3d0';
        ctx.fillText(`${m.icon} ${m.name}`, px2 + 28, y);
      }
    }
    ctx.restore();

    // 리롤 버튼
    const rrX = px2 + 280, rrY = py2 + 110, rrW = panelW - 296, rrH = 42;
    ctx.fillStyle = '#022c22';
    ctx.fillRect(rrX, rrY, rrW, rrH);
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5;
    ctx.strokeRect(rrX, rrY, rrW, rrH);
    ctx.fillStyle = '#fbbf24';
    ctx.font = "bold 13px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔁 재구성 (비용: 🔮 6)', rrX + rrW/2, rrY + rrH/2);
    ctx.textBaseline = 'alphabetic';
    this._rerollBtn = { x: rrX, y: rrY, w: rrW, h: rrH };

    // 선택지 카드 (우측)
    const choiceIds = (this._choice?.items || []).filter(id => !selected.has(id));
    const startY = py2 + 170;
    for (const m of MUTATIONS) m._btn = null;

    if (choiceIds.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('더 이상 제시할 변이가 없다.', px2 + 280 + (panelW - 296)/2, py2 + 320);
    } else {
      for (let i = 0; i < choiceIds.length; i++) {
        const id = choiceIds[i];
        const m = MUTATIONS.find(x => x.id === id);
        if (!m) continue;

        const cardX = px2 + 280;
        const cardY = startY + i * 120;
        const cardW = panelW - 296;
        const cardH = 104;

        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#001a12';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        ctx.fillStyle = m.color;
        ctx.font = "bold 14px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(`${m.icon} ${m.name}`, cardX + 14, cardY + 26);

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = "11px 'Noto Sans KR', sans-serif";
        ctx.fillText(m.desc, cardX + 14, cardY + 46);

        ctx.fillStyle = '#4ade80';
        ctx.fillText(`+ ${m.gain}`, cardX + 14, cardY + 66);
        if (m.risk) {
          ctx.fillStyle = '#fca5a5';
          ctx.fillText(`- ${m.risk}`, cardX + 14, cardY + 84);
        }

        // 선택 버튼
        const btnW = 110, btnH = 34;
        const btnX = cardX + cardW - btnW - 14;
        const btnY = cardY + cardH - btnH - 12;
        ctx.fillStyle = '#052e24';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#a7f3d0';
        ctx.font = "bold 12px 'Noto Sans KR', sans-serif";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`동화 🔮${m.cost}`, btnX + btnW/2, btnY + btnH/2);
        ctx.textBaseline = 'alphabetic';

        m._btn = { x: btnX, y: btnY, w: btnW, h: btnH };
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('[ ESC — 닫기 ]', vw/2, py2 + panelH - 16);

    ctx.restore();
  }

  _drawFloatingTexts(ctx) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 0.5; t.life--;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }
      const a = t.life < 40 ? t.life/40 : t.life > t.maxLife - 20 ? (t.maxLife - t.life)/20 : 1;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = t.color;
      ctx.font = "bold 16px 'Noto Sans KR', sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = t.color; ctx.shadowBlur = 12;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}

// ================= 변이 시스템 (영구) =================
const MUTATION_STORAGE_KEY = 'gyun_mutations_v1';
const MUTATION_MAX = 6;

const MUTATIONS = [
  {
    id: 'carapace',
    icon: '🛡️',
    name: '키틴 외피',
    desc: '피부가 굳어 보호막이 된다.',
    gain: '최대 HP +50',
    risk: '이동속도 -5%',
    cost: 10,
    color: '#34d399',
    hp: 50,
    moveMult: 0.95,
  },
  {
    id: 'razor',
    icon: '🗡️',
    name: '절단 섬유',
    desc: '근육이 날카로운 섬유로 바뀐다.',
    gain: '공격력 +12',
    risk: '받는 피해 +8%',
    cost: 10,
    color: '#10b981',
    atk: 12,
    incomingMult: 1.08,
  },
  {
    id: 'spore_step',
    icon: '💨',
    name: '포자 보행',
    desc: '발밑에 포자가 폭발하며 추진력을 만든다.',
    gain: '전투 이동 +2, 필드 이동 +1',
    risk: null,
    cost: 8,
    color: '#a7f3d0',
    battleMove: 2,
    worldMove: 1,
  },
  {
    id: 'sync_marrow',
    icon: '🫀',
    name: '골수 동화',
    desc: '생명력이 더 빨리 회복되지만, 불안정해진다.',
    gain: '스테이지 클리어 시 HP +10 추가 회복',
    risk: '공격력 -5%',
    cost: 12,
    color: '#fbbf24',
    stageHeal: 10,
    atkMult: 0.95,
  },
  {
    id: 'thin_reality',
    icon: '🕳️',
    name: '현실 박막화',
    desc: '공간 감각이 예민해져 더 세게 때린다.',
    gain: '최종 피해 +6%',
    risk: '받는 피해 +6%',
    cost: 14,
    color: '#a78bfa',
    dmgMult: 1.06,
    incomingMult: 1.06,
  },
  {
    id: 'hunger',
    icon: '🩸',
    name: '기아 반응',
    desc: '공격이 적을 ‘뜯어먹는’ 방향으로 변한다.',
    gain: '처치 시 HP +6',
    risk: null,
    cost: 10,
    color: '#fca5a5',
    onKillHeal: 6,
  },
];

function getMutationState() {
  const saved = JSON.parse(localStorage.getItem(MUTATION_STORAGE_KEY) || '{}');
  return {
    mutations: Array.isArray(saved.mutations) ? saved.mutations.filter(Boolean) : [],
  };
}
function saveMutationState(state) {
  const clean = {
    mutations: (state.mutations || []).slice(0, MUTATION_MAX),
  };
  localStorage.setItem(MUTATION_STORAGE_KEY, JSON.stringify(clean));
}

function getGyunFragments() {
  return parseInt(localStorage.getItem('gyun_fragments') || '0');
}
function spendGyunFragments(amount) {
  const cur = getGyunFragments();
  localStorage.setItem('gyun_fragments', String(Math.max(0, cur - amount)));
}

function _getActiveMutationDefs() {
  const st = getMutationState();
  const active = new Set(st.mutations);
  return MUTATIONS.filter(m => active.has(m.id));
}

// ===== 전역 보정 함수들 (battle.js / player.js에서 사용) =====
function getMutationAtkBonus() {
  let sum = 0;
  for (const m of _getActiveMutationDefs()) sum += (m.atk || 0);
  return sum;
}
function getMutationMaxHpBonus() {
  let sum = 0;
  for (const m of _getActiveMutationDefs()) sum += (m.hp || 0);
  return sum;
}
function getMutationDamageMultiplier() {
  let mult = 1.0;
  for (const m of _getActiveMutationDefs()) {
    if (m.dmgMult) mult *= m.dmgMult;
    if (m.atkMult) mult *= m.atkMult;
  }
  return mult;
}
function getMutationIncomingMultiplier() {
  let mult = 1.0;
  for (const m of _getActiveMutationDefs()) {
    if (m.incomingMult) mult *= m.incomingMult;
  }
  return mult;
}
function getMutationBattleMoveBonus() {
  let sum = 0;
  for (const m of _getActiveMutationDefs()) sum += (m.battleMove || 0);
  return sum;
}
function getMutationWorldSpeedBonus() {
  let sum = 0;
  for (const m of _getActiveMutationDefs()) sum += (m.worldMove || 0);
  return sum;
}
function getMutationMoveMultiplier() {
  let mult = 1.0;
  for (const m of _getActiveMutationDefs()) {
    if (m.moveMult) mult *= m.moveMult;
  }
  return mult;
}
function getMutationOnKillHeal() {
  let sum = 0;
  for (const m of _getActiveMutationDefs()) sum += (m.onKillHeal || 0);
  return sum;
}
function getMutationStageClearHealBonus() {
  let sum = 0;
  for (const m of _getActiveMutationDefs()) sum += (m.stageHeal || 0);
  return sum;
}