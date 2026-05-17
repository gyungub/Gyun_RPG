// ═══════════════════════════════════════════════════════════
// 균균월드 - 모바일 터치 컨트롤 시스템
// Mobile Touch Control System
// ═══════════════════════════════════════════════════════════

const MobileControl = {
  enabled: false,
  isTouch: false,
  
  joystick: {
    container: null,
    bg: null,
    stick: null,
    x: 0,
    y: 0,
    radius: 50,
    centerX: 80,
    centerY: window.innerHeight - 120,
    active: false,
    touchId: null,
  },

  buttons: {
    move_up: null,
    move_down: null,
    move_left: null,
    move_right: null,
    interact: null,
    talk: null,
    attack: null,
    skill_q: null,
    skill_r: null,
    skill_g: null,
  },

  buttonStates: {},

  init() {
    this.isTouch = () => {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    };

    if (!this.isTouch()) {
      console.log('모바일 터치 미지원');
      return;
    }

    this.enabled = true;
    console.log('모바일 터치 활성화');

    this.createUI();
    this.setupEventListeners();
    this.setupStyleSheet();
  },

  createUI() {
    this.joystick.container = document.createElement('div');
    this.joystick.container.id = 'mobile-joystick-area';
    this.joystick.container.innerHTML = `
      <div id="joystick-bg" class="joystick-bg">
        <div id="joystick-stick" class="joystick-stick"></div>
      </div>
    `;

    this.joystick.bg = this.joystick.container.querySelector('.joystick-bg');
    this.joystick.stick = this.joystick.container.querySelector('.joystick-stick');
    document.body.appendChild(this.joystick.container);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'mobile-buttons-area';
    buttonsContainer.innerHTML = `
      <div class="mobile-buttons-grid">
        <div class="battle-buttons left-column">
          <button class="action-btn attack-btn" id="btn-attack"><span class="btn-label">🗡️</span><span class="btn-text">공격</span></button>
          <button class="action-btn skill-btn q-btn" id="btn-skill-q"><span class="btn-label">💚</span><span class="btn-text">균즙</span></button>
        </div>
        <div class="move-buttons right-column">
          <button class="action-btn interact-btn" id="btn-interact"><span class="btn-label">🚪</span><span class="btn-text">입장</span></button>
          <button class="action-btn talk-btn" id="btn-talk"><span class="btn-label">💬</span><span class="btn-text">대화</span></button>
        </div>
        <div class="skill-buttons top-right">
          <button class="action-btn skill-r-btn compact" id="btn-skill-r"><span class="btn-label">🔥</span><span class="btn-text">광폭</span></button>
          <button class="action-btn skill-g-btn compact" id="btn-skill-g"><span class="btn-label">👑</span><span class="btn-text">복종</span></button>
        </div>
      </div>
    `;

    document.body.appendChild(buttonsContainer);

    this.buttons.attack = document.getElementById('btn-attack');
    this.buttons.skill_q = document.getElementById('btn-skill-q');
    this.buttons.skill_r = document.getElementById('btn-skill-r');
    this.buttons.skill_g = document.getElementById('btn-skill-g');
    this.buttons.interact = document.getElementById('btn-interact');
    this.buttons.talk = document.getElementById('btn-talk');

    Object.keys(this.buttons).forEach(key => {
      this.buttonStates[key] = false;
    });
  },

  setupStyleSheet() {
    const style = document.createElement('style');
    style.textContent = `
      #mobile-joystick-area {
        position: fixed;
        bottom: 30px;
        left: 30px;
        z-index: 9998;
        pointer-events: auto;
        touch-action: none;
      }

      .joystick-bg {
        width: 140px;
        height: 140px;
        background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.2), rgba(124, 58, 237, 0.15));
        border: 3px solid rgba(255, 215, 0, 0.3);
        border-radius: 50%;
        position: relative;
        box-shadow: inset 0 0 20px rgba(124, 58, 237, 0.2), 0 0 30px rgba(255, 215, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
      }

      .joystick-bg.active {
        background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.35), rgba(124, 58, 237, 0.25));
        box-shadow: inset 0 0 25px rgba(124, 58, 237, 0.3), 0 0 40px rgba(255, 215, 0, 0.25);
      }

      .joystick-stick {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ff1493 100%);
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        position: absolute;
        top: 35px;
        left: 35px;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3);
        transition: transform 0.05s linear;
        cursor: grab;
      }

      #mobile-buttons-area {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9997;
        pointer-events: none;
      }

      .mobile-buttons-grid {
        position: relative;
        width: 100%;
        height: 100%;
        pointer-events: auto;
      }

      .battle-buttons.left-column {
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        z-index: 9998;
        pointer-events: auto;
      }

      .move-buttons.right-column {
        position: fixed;
        bottom: 200px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        z-index: 9998;
        pointer-events: auto;
      }

      .skill-buttons.top-right {
        position: fixed;
        top: 30px;
        right: 30px;
        display: flex;
        flex-direction: row;
        gap: 12px;
        z-index: 9998;
        pointer-events: auto;
      }

      .action-btn {
        width: 70px;
        height: 70px;
        border-radius: 14px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(255, 215, 0, 0.1));
        color: #ffd700;
        font-size: 1.4rem;
        font-weight: bold;
        font-family: 'Jua', sans-serif;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        position: relative;
        overflow: hidden;
      }

      .action-btn .btn-label {
        font-size: 1.8rem;
        line-height: 1;
      }

      .action-btn .btn-text {
        font-size: 0.65rem;
        letter-spacing: 0.5px;
        opacity: 0.7;
      }

      .action-btn:hover {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(255, 215, 0, 0.2));
        border-color: rgba(255, 215, 0, 0.5);
        box-shadow: 0 0 20px rgba(124, 58, 237, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateY(-3px);
      }

      .action-btn:active, .action-btn.active {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.7), rgba(255, 215, 0, 0.3));
        border-color: rgba(255, 215, 0, 0.8);
        box-shadow: inset 0 0 10px rgba(124, 58, 237, 0.3), 0 0 25px rgba(255, 215, 0, 0.4);
        transform: scale(0.92);
      }

      .action-btn.attack-btn {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(255, 107, 107, 0.1));
        border-color: rgba(239, 68, 68, 0.4);
      }

      .action-btn.attack-btn:active {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.6), rgba(255, 107, 107, 0.3));
        box-shadow: inset 0 0 10px rgba(239, 68, 68, 0.3), 0 0 25px rgba(239, 68, 68, 0.4);
      }

      .action-btn.skill-btn.q-btn {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(74, 222, 128, 0.1));
        border-color: rgba(34, 197, 94, 0.4);
      }

      .action-btn.skill-btn.q-btn:active {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(74, 222, 128, 0.3));
        box-shadow: inset 0 0 10px rgba(34, 197, 94, 0.3), 0 0 25px rgba(34, 197, 94, 0.4);
      }

      .action-btn.skill-r-btn {
        background: linear-gradient(135deg, rgba(255, 133, 27, 0.3), rgba(255, 152, 0, 0.1));
        border-color: rgba(255, 133, 27, 0.4);
      }

      .action-btn.skill-r-btn:active {
        background: linear-gradient(135deg, rgba(255, 133, 27, 0.6), rgba(255, 152, 0, 0.3));
        box-shadow: inset 0 0 10px rgba(255, 133, 27, 0.3), 0 0 25px rgba(255, 133, 27, 0.4);
      }

      .action-btn.skill-g-btn {
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(196, 181, 253, 0.1));
        border-color: rgba(168, 85, 247, 0.4);
      }

      .action-btn.skill-g-btn:active {
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.6), rgba(196, 181, 253, 0.3));
        box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.3), 0 0 25px rgba(168, 85, 247, 0.4);
      }

      .action-btn.interact-btn {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(96, 165, 250, 0.1));
        border-color: rgba(59, 130, 246, 0.4);
      }

      .action-btn.interact-btn:active {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(96, 165, 250, 0.3));
        box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.3), 0 0 25px rgba(59, 130, 246, 0.4);
      }

      .action-btn.talk-btn {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(244, 114, 182, 0.1));
        border-color: rgba(236, 72, 153, 0.4);
      }

      .action-btn.talk-btn:active {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.6), rgba(244, 114, 182, 0.3));
        box-shadow: inset 0 0 10px rgba(236, 72, 153, 0.3), 0 0 25px rgba(236, 72, 153, 0.4);
      }

      .action-btn.compact {
        width: 60px;
        height: 60px;
        font-size: 1.2rem;
      }

      .action-btn.compact .btn-label {
        font-size: 1.5rem;
      }

      .action-btn.compact .btn-text {
        font-size: 0.55rem;
      }

      body.battle-mode #mobile-joystick-area {
        display: none;
      }

      body.battle-mode .move-buttons.right-column {
        display: none;
      }

      body.battle-mode .battle-buttons.left-column {
        display: flex;
      }

      body:not(.battle-mode) .battle-buttons.left-column {
        display: none;
      }

      body:not(.battle-mode) .move-buttons.right-column {
        display: flex;
      }
    `;
    document.head.appendChild(style);
  },

  setupEventListeners() {
    this.joystick.bg.addEventListener('touchstart', (e) => this.handleJoystickStart(e));
    this.joystick.bg.addEventListener('touchmove', (e) => this.handleJoystickMove(e));
    this.joystick.bg.addEventListener('touchend', (e) => this.handleJoystickEnd(e));
    this.joystick.bg.addEventListener('touchcancel', (e) => this.handleJoystickEnd(e));

    this.joystick.bg.addEventListener('mousedown', (e) => this.handleJoystickStart(e));
    document.addEventListener('mousemove', (e) => this.handleJoystickMove(e));
    document.addEventListener('mouseup', (e) => this.handleJoystickEnd(e));

    this.buttons.attack?.addEventListener('touchstart', () => this.pressButton('attack'));
    this.buttons.attack?.addEventListener('touchend', () => this.releaseButton('attack'));
    this.buttons.attack?.addEventListener('mousedown', () => this.pressButton('attack'));
    this.buttons.attack?.addEventListener('mouseup', () => this.releaseButton('attack'));

    this.buttons.skill_q?.addEventListener('touchstart', () => this.pressButton('skill_q'));
    this.buttons.skill_q?.addEventListener('touchend', () => this.releaseButton('skill_q'));
    this.buttons.skill_q?.addEventListener('mousedown', () => this.pressButton('skill_q'));
    this.buttons.skill_q?.addEventListener('mouseup', () => this.releaseButton('skill_q'));

    this.buttons.skill_r?.addEventListener('touchstart', () => this.pressButton('skill_r'));
    this.buttons.skill_r?.addEventListener('touchend', () => this.releaseButton('skill_r'));
    this.buttons.skill_r?.addEventListener('mousedown', () => this.pressButton('skill_r'));
    this.buttons.skill_r?.addEventListener('mouseup', () => this.releaseButton('skill_r'));

    this.buttons.skill_g?.addEventListener('touchstart', () => this.pressButton('skill_g'));
    this.buttons.skill_g?.addEventListener('touchend', () => this.releaseButton('skill_g'));
    this.buttons.skill_g?.addEventListener('mousedown', () => this.pressButton('skill_g'));
    this.buttons.skill_g?.addEventListener('mouseup', () => this.releaseButton('skill_g'));

    this.buttons.interact?.addEventListener('touchstart', () => this.pressButton('interact'));
    this.buttons.interact?.addEventListener('touchend', () => this.releaseButton('interact'));
    this.buttons.interact?.addEventListener('mousedown', () => this.pressButton('interact'));
    this.buttons.interact?.addEventListener('mouseup', () => this.releaseButton('interact'));

    this.buttons.talk?.addEventListener('touchstart', () => this.pressButton('talk'));
    this.buttons.talk?.addEventListener('touchend', () => this.releaseButton('talk'));
    this.buttons.talk?.addEventListener('mousedown', () => this.pressButton('talk'));
    this.buttons.talk?.addEventListener('mouseup', () => this.releaseButton('talk'));
  },

  handleJoystickStart(e) {
    if (e.type.includes('mouse') && e.button !== 0) return;
    e.preventDefault();
    this.joystick.active = true;
    this.joystick.bg.classList.add('active');
    if (e.type.includes('touch')) {
      this.joystick.touchId = e.touches[0].identifier;
    }
  },

  handleJoystickMove(e) {
    if (!this.joystick.active) return;

    let touch;
    if (e.type.includes('touch')) {
      const touches = e.touches;
      let found = false;
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === this.joystick.touchId) {
          touch = touches[i];
          found = true;
          break;
        }
      }
      if (!found) return;
    } else {
      touch = e;
    }

    const rect = this.joystick.bg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = this.joystick.radius;

    if (distance <= maxDistance) {
      this.joystick.x = dx;
      this.joystick.y = dy;
    } else {
      const angle = Math.atan2(dy, dx);
      this.joystick.x = Math.cos(angle) * maxDistance;
      this.joystick.y = Math.sin(angle) * maxDistance;
    }

    const stickX = (70 / 140) * 50 + this.joystick.x;
    const stickY = (70 / 140) * 50 + this.joystick.y;
    this.joystick.stick.style.transform = `translate(${stickX}px, ${stickY}px)`;
  },

  handleJoystickEnd(e) {
    this.joystick.active = false;
    this.joystick.bg.classList.remove('active');
    this.joystick.x = 0;
    this.joystick.y = 0;
    this.joystick.stick.style.transform = 'translate(35px, 35px)';
    this.joystick.touchId = null;
  },

  pressButton(button) {
    this.buttonStates[button] = true;
    if (this.buttons[button]) {
      this.buttons[button].classList.add('active');
    }
    this.executeButtonAction(button, true);
  },

  releaseButton(button) {
    this.buttonStates[button] = false;
    if (this.buttons[button]) {
      this.buttons[button].classList.remove('active');
    }
    this.executeButtonAction(button, false);
  },

  executeButtonAction(button, isPressed) {
    const keyMap = {
      'attack': 'z',
      'skill_q': 'q',
      'skill_r': 'r',
      'skill_g': 'g',
      'interact': 'f',
      'talk': 'e',
      'move_up': 'w',
      'move_down': 's',
      'move_left': 'a',
      'move_right': 'd',
    };

    const key = keyMap[button];
    if (!key) return;

    if (Input && Input.keys) {
      Input.keys[key] = isPressed;
    }
  },

  getMovement() {
    if (!this.joystick.active) {
      return { x: 0, y: 0 };
    }

    const threshold = 20;
    let x = 0, y = 0;

    if (Math.abs(this.joystick.x) > threshold) {
      x = this.joystick.x > 0 ? 1 : -1;
    }
    if (Math.abs(this.joystick.y) > threshold) {
      y = this.joystick.y > 0 ? 1 : -1;
    }

    return { x, y };
  },

  setBattleMode(isBattle) {
    if (isBattle) {
      document.body.classList.add('battle-mode');
    } else {
      document.body.classList.remove('battle-mode');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  MobileControl.init();
});