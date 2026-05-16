// readingroom-interaction.js
// 금서 열람실 책 효과 — 맵 이동 후에도 효과 유지

// ===== 전역 효과 저장소 =====
// 맵이 바뀌어도 여기에 효과가 살아있음
window.READING_EFFECTS = window.READING_EFFECTS || {
  activeEffects: [],   // { id, expiry, multiplier?, tickTimer? }
  stunExpiry: 0,
  bookEffectDefs: [
    { id: 'atk_up',         type: 'good',   icon: '⚔️', name: '공격력 증가',  color: '#4ade80' },
    { id: 'exp_up',         type: 'good',   icon: '✨', name: '경험치 증폭',  color: '#fbbf24' },
    { id: 'hp_regen',       type: 'good',   icon: '💚', name: 'HP 회복',      color: '#34d399' },
    { id: 'skill_amp',      type: 'good',   icon: '🔮', name: '스킬 강화',    color: '#a78bfa' },
    { id: 'hp_drain',       type: 'bad',    icon: '🩸', name: '생명 침식',    color: '#f87171' },
    { id: 'reverse',        type: 'bad',    icon: '🔄', name: '이동 반전',    color: '#fb923c' },
    { id: 'atk_down',       type: 'bad',    icon: '💔', name: '공격력 저하',  color: '#f43f5e' },
    { id: 'stun',           type: 'danger', icon: '💀', name: '조작 불능',    color: '#dc2626' },
    { id: 'gyun_infect',    type: 'danger', icon: '☣️', name: '균 감염',      color: '#7f1d1d' },
    { id: 'screen_distort', type: 'danger', icon: '👁️', name: '환각',         color: '#6b21a8' },
  ],
};

// ===== 효과 추가 (readingroom.js의 readBook에서 호출) =====
function applyGlobalBookEffect(effectId) {
  const RE = window.READING_EFFECTS;
  const duration = 20 * 60 * 1000; // 20분
  const now = Date.now();

  // 기존 같은 효과 제거 후 재적용
  RE.activeEffects = RE.activeEffects.filter(e => e.id !== effectId);

  switch (effectId) {
    case 'atk_up':
      RE.activeEffects.push({ id: 'atk_up',    expiry: now + duration, multiplier: 1.5 });
      break;
    case 'exp_up':
      RE.activeEffects.push({ id: 'exp_up',    expiry: now + duration, multiplier: 2.0 });
      break;
    case 'hp_regen':
      // 즉시 회복 — battleState가 있으면 적용
      if (typeof battleState !== 'undefined' && battleState.playerMaxHp) {
        const heal = Math.floor(battleState.playerMaxHp * 0.3);
        battleState.playerHp = Math.min(battleState.playerHp + heal, battleState.playerMaxHp);
        if (typeof updateBattleHUD === 'function') updateBattleHUD();
      }
      break;
    case 'skill_amp':
      RE.activeEffects.push({ id: 'skill_amp', expiry: now + duration, multiplier: 1.3 });
      break;
    case 'hp_drain':
      RE.activeEffects.push({ id: 'hp_drain',  expiry: now + duration, tickTimer: 0 });
      break;
    case 'reverse':
      RE.activeEffects.push({ id: 'reverse',   expiry: now + duration });
      break;
    case 'atk_down':
      RE.activeEffects.push({ id: 'atk_down',  expiry: now + duration, multiplier: 0.6 });
      break;
    case 'stun':
      RE.stunExpiry = now + 10000; // 10초
      break;
    case 'gyun_infect':
      RE.activeEffects.push({ id: 'gyun_infect',    expiry: now + duration, multiplier: 2.0 });
      break;
    case 'screen_distort':
      RE.activeEffects.push({ id: 'screen_distort', expiry: now + duration });
      break;
  }
}

// ===== 만료된 효과 정리 + HP 지속 감소 처리 =====
function updateReadingRoomEffects() {
  const RE = window.READING_EFFECTS;
  const now = Date.now();

  // 만료 정리
  RE.activeEffects = RE.activeEffects.filter(e => now < e.expiry);

  // HP 지속 감소
  const drain = RE.activeEffects.find(e => e.id === 'hp_drain');
  if (drain && typeof battleState !== 'undefined' && battleState.active) {
    drain.tickTimer = (drain.tickTimer || 0) + 1;
    if (drain.tickTimer >= 300) { // 5초마다
      drain.tickTimer = 0;
      battleState.playerHp = Math.max(1, battleState.playerHp - 8);
      if (typeof updateBattleHUD === 'function') updateBattleHUD();
    }
  }
}

// ===== 상태 조회 함수들 =====
function isReadingRoomStunned() {
  return Date.now() < window.READING_EFFECTS.stunExpiry;
}

function isReadingRoomReversed() {
  return window.READING_EFFECTS.activeEffects.some(e => e.id === 'reverse');
}

function isReadingRoomDistorted() {
  return window.READING_EFFECTS.activeEffects.some(e => e.id === 'screen_distort');
}

function getReadingRoomAtkMultiplier() {
  const RE = window.READING_EFFECTS;
  let mult = 1.0;
  const up   = RE.activeEffects.find(e => e.id === 'atk_up');
  const down = RE.activeEffects.find(e => e.id === 'atk_down');
  if (up)   mult *= up.multiplier;
  if (down) mult *= down.multiplier;
  return mult;
}

function getReadingRoomSkillMultiplier() {
  const amp = window.READING_EFFECTS.activeEffects.find(e => e.id === 'skill_amp');
  return amp ? amp.multiplier : 1.0;
}

function getReadingRoomIncomingMultiplier() {
  const inf = window.READING_EFFECTS.activeEffects.find(e => e.id === 'gyun_infect');
  return inf ? inf.multiplier : 1.0;
}

function getReadingRoomExpMultiplier() {
  const exp = window.READING_EFFECTS.activeEffects.find(e => e.id === 'exp_up');
  return exp ? exp.multiplier : 1.0;
}

// ===== 이동에 효과 적용 =====
function applyMovementWithEffects(rawX, rawY) {
  if (isReadingRoomStunned()) return { x: 0, y: 0 };
  if (isReadingRoomReversed()) return { x: -rawX, y: -rawY };
  return { x: rawX, y: rawY };
}

// ===== 데미지 계산 통합 함수 =====
function calcFinalPlayerDamage(baseDmg) {
  return Math.floor(baseDmg * getReadingRoomAtkMultiplier());
}
function calcFinalIncomingDamage(baseDmg) {
  return Math.floor(baseDmg * getReadingRoomIncomingMultiplier());
}
function calcFinalExpGain(baseExp) {
  return Math.floor(baseExp * getReadingRoomExpMultiplier());
}
function calcFinalSkillDamage(baseDmg) {
  return Math.floor(baseDmg * getReadingRoomSkillMultiplier());
}

// ===== 화면 왜곡 오버레이 =====
function drawReadingRoomDistortion(ctx, vw, vh) {
  if (!isReadingRoomDistorted()) return;
  const phase = (Date.now() / 1000) * 2;
  ctx.save();
  ctx.globalAlpha = 0.06 + Math.sin(phase * 3) * 0.03;
  ctx.fillStyle = '#7c3aed';
  for (let i = 0; i < 8; i++) {
    const dy = Math.sin(phase * 1.5 + i * 0.8) * 10;
    ctx.fillRect(0, i * (vh / 8) + dy, vw, 2);
  }
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-3, 0, vw, vh);
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(3, 0, vw, vh);
  ctx.restore();
}

// ===== 기절 오버레이 =====
function drawReadingRoomStunOverlay(ctx, vw, vh) {
  if (!isReadingRoomStunned()) return;
  ctx.save();
  ctx.fillStyle = 'rgba(20,0,0,0.5)';
  ctx.fillRect(0, 0, vw, vh);
  ctx.fillStyle = '#dc2626';
  ctx.font = "bold 32px 'Noto Sans KR', sans-serif";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 20;
  ctx.fillText('💀 조작 불능 💀', vw / 2, vh / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// ===== 활성 효과 HUD (전투 화면에 표시) =====
function drawReadingRoomStatusHUD(ctx, vw, vh) {
  const RE = window.READING_EFFECTS;
  const now = Date.now();
  const effects = RE.activeEffects.filter(e => now < e.expiry);
  const stunLeft = RE.stunExpiry - now;

  const allEffects = [...effects];
  if (stunLeft > 0) allEffects.unshift({ id: 'stun', expiry: RE.stunExpiry });
  if (allEffects.length === 0) return;

  const startX = vw - 220, startY = 60;
  ctx.save();
  ctx.fillStyle = 'rgba(10,0,20,0.82)';
  ctx.fillRect(startX, startY, 200, allEffects.length * 26 + 16);
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5;
  ctx.strokeRect(startX, startY, 200, allEffects.length * 26 + 16);
  ctx.font = "bold 11px 'Noto Sans KR', sans-serif";
  ctx.textBaseline = 'middle';

  for (let i = 0; i < allEffects.length; i++) {
    const eff = allEffects[i];
    const info = RE.bookEffectDefs.find(b => b.id === eff.id);
    if (!info) continue;
    const ey = startY + 14 + i * 26;
    const remaining = Math.max(0, Math.ceil((eff.expiry - now) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = mins > 0 ? `${mins}분${secs}초` : `${secs}초`;
    ctx.fillStyle = info.color;
    ctx.textAlign = 'left';
    ctx.fillText(`${info.icon} ${info.name}`, startX + 10, ey);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, startX + 192, ey);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// ===== readingroom.js 연동 — readBook 호출 시 전역에도 저장 =====
// readingroom.js의 readBook() 안에서 이 함수를 추가로 호출해야 함
function onBookRead(effectId) {
  applyGlobalBookEffect(effectId);
}