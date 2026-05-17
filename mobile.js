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
    interact: null,
    talk: null,
    attack: null,
    skill_q: null,
    skill_r: null,
    skill_g: null,
  },

  buttonStates: {},
  pressedKeys: new Set(),

  init() {
    this.isTouch = () => {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    };

    if (!this.isTouch()) {
      console.log('모바일 미지원');
      return;
    }

    this.enabled = true;
    console.log('모바일 활성화');

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
          <button class="action-btn attack-btn" id="btn-attack">🗡️<span>공격</span></button>
          <button class="action-btn skill-btn q-btn" id="btn-skill-q">💚<span>균즙</span></button>
        </div>
        <div class="move-buttons right-column">
          <button class="action-btn interact-btn" id="btn-interact">🚪<span>입장</span></button>
          <button class="action-btn talk-btn" id="btn-talk">💬<span>대화</span></button>
        </div>
        <div class="skill-buttons top-right">
          <button class="action-btn skill-r-btn" id="btn-skill-r">🔥<span>광폭</span></button>
          <button class="action-btn skill-g-btn" id="btn-skill-g">👑<span>복종</span></button>
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
        touch-action: none;
      }

      .joystick-bg {
        width: 140px;
        height: 140px;
        background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.2), rgba(124, 58, 237, 0.15));
        border: 3px solid rgba(255, 215, 0, 0.3);
        border-radius: 50%;
        box-shadow: inset 0 0 20px rgba(124, 58, 237, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .joystick-bg.active {
        background: radial-gradient(circle at 30% 30%, rgba(255, 215, 0, 0.35), rgba(124, 58, 237, 0.25));
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
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
        transition: transform 0.05s linear;
      }

      #mobile-buttons-area {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9997;
        pointer-events: none;
      }

      .mobile-buttons-grid {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .battle-buttons.left-column {
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        pointer-events: auto;
      }

      .move-buttons.right-column {
        position: fixed;
        bottom: 200px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        pointer-events: auto;
      }

      .skill-buttons.top-right {
        position: fixed;
        top: 30px;
        right: 30px;
        display: flex;
        gap: 12px;
        pointer-events: auto;
      }

      .action-btn {
        width: 70px;
        height: 70px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(255, 215, 0, 0.1));
        color: #ffd700;
        font-size: 2rem;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        transition: all 0.15s ease;
      }

      .action-btn span {
        font-size: 0.6rem;
        letter-spacing: 0.5px;
        opacity: 0.7;
      }

      .action-btn:active, .action-btn.active {
        transform: scale(0.92);
        box-shadow: inset 0 0 10px rgba(124, 58, 237, 0.3);
      }

      .action-btn.attack-btn {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(255, 107, 107, 0.1));
      }

      .action-btn.attack-btn:active {
        box-shadow: inset 0 0 10px rgba(239, 68, 68, 0.3);
      }

      .action-btn.skill-btn.q-btn {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(74, 222, 128, 0.1));
      }

      .action-btn.skill-btn.q-btn:active {
        box-shadow: inset 0 0 10px rgba(34, 197, 94, 0.3);
      }

      .action-btn.skill-r-btn {
        background: linear-gradient(135deg, rgba(255, 133, 27, 0.3), rgba(255, 152, 0, 0.1));
        width: 60px;
        height: 60px;
        font-size: 1.6rem;
      }

      .action-btn.skill-r-btn:active {
        box-shadow: inset 0 0 10px rgba(255, 133, 27, 0.3);
      }

      .action-btn.skill-g-btn {
        background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(196, 181, 253, 0.1));
        width: 60px;
        height: 60px;
        font-size: 1.6rem;
      }

      .action-btn.skill-g-btn:active {
        box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.3);
      }

      .action-btn.interact-btn {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(96, 165, 250, 0.1));
      }

      .action-btn.interact-btn:active {
        box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.3);
      }

      .action-btn.talk-btn {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(244, 114, 182, 0.1));
      }

      .action-btn.talk-btn:active {
        box-shadow: inset 0 0 10px rgba(236, 72, 153, 0.3);
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
    // 조이스틱
    this.joystick.bg.addEventListener('touchstart', (e) => this.handleJoystickStart(e));
    this.joystick.bg.addEventListener('touchmove', (e) => this.handleJoystickMove(e));
    this.joystick.bg.addEventListener('touchend', (e) => this.handleJoystickEnd(e));
    this.joystick.bg.addEventListener('touchcancel', (e) => this.handleJoystickEnd(e));

    this.joystick.bg.addEventListener('mousedown', (e) => this.handleJoystickStart(e));
    document.addEventListener('mousemove', (e) => this.handleJoystickMove(e));
    document.addEventListener('mouseup', (e) => this.handleJoystickEnd(e));

    // 버튼들
    this.setupButtonListener('attack', 'z');
    this.setupButtonListener('skill_q', 'q');
    this.setupButtonListener('skill_r', 'r');
    this.setupButtonListener('skill_g', 'g');
    this.setupButtonListener('interact', 'f');
    this.setupButtonListener('talk', 'e');
  },

  setupButtonListener(buttonName, keyCode) {
    const btn = this.buttons[buttonName];
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.emitKeyEvent('keydown', keyCode);
      btn.classList.add('active');
    });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.emitKeyEvent('keyup', keyCode);
      btn.classList.remove('active');
    });

    btn.addEventListener('mousedown', () => {
      this.emitKeyEvent('keydown', keyCode);
      btn.classList.add('active');
    });

    btn.addEventListener('mouseup', () => {
      this.emitKeyEvent('keyup', keyCode);
      btn.classList.remove('active');
    });

    btn.addEventListener('mouseleave', () => {
      this.emitKeyEvent('keyup', keyCode);
      btn.classList.remove('active');
    });
  },

  emitKeyEvent(type, key) {
    // 키 이벤트 생성
    const event = new KeyboardEvent(type, {
      key: key,
      code: key.toUpperCase(),
      keyCode: key.charCodeAt(0),
      which: key.charCodeAt(0),
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);

    // Input 시스템에도 반영
    if (Input && Input.keys) {
      Input.keys[key.toLowerCase()] = (type === 'keydown');
    }
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

    const stickX = 35 + this.joystick.x;
    const stickY = 35 + this.joystick.y;
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

// Input 시스템 오버라이드
if (typeof Input !== 'undefined') {
  const originalGetMovement = Input.getMovement.bind(Input);
  Input.getMovement = function() {
    if (MobileControl.enabled && MobileControl.joystick.active) {
      return MobileControl.getMovement();
    }
    return originalGetMovement();
  };
}