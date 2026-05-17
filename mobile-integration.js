const MobileIntegration = {
  lastBattleState: false,
  battleModeInterval: null,

  init() {
    console.log('모바일 통합 초기화');
    this.setupBattleStateMonitor();
    this.setupInputIntegration();
    this.setupMovementIntegration();
  },

  setupBattleStateMonitor() {
    this.battleModeInterval = setInterval(() => {
      if (typeof inBattle === 'undefined') return;

      if (inBattle && !this.lastBattleState) {
        console.log('전투 모드 활성화');
        MobileControl.setBattleMode(true);
        this.lastBattleState = true;
      } else if (!inBattle && this.lastBattleState) {
        console.log('전투 모드 비활성화');
        MobileControl.setBattleMode(false);
        this.lastBattleState = false;
      }
    }, 100);
  },

  setupInputIntegration() {
    const originalIsDown = Input.isDown.bind(Input);

    Input.isDown = function(key) {
      const keyLower = key.toLowerCase();

      if (MobileControl.enabled && MobileControl.buttonStates[keyLower]) {
        return true;
      }

      return originalIsDown(key);
    };
  },

  setupMovementIntegration() {
    const originalGetMovement = Input.getMovement.bind(Input);

    Input.getMovement = function() {
      let keyboard = originalGetMovement();

      if (MobileControl.enabled && MobileControl.joystick.active) {
        const joystick = MobileControl.getMovement();
        if (joystick.x !== 0 || joystick.y !== 0) {
          return joystick;
        }
      }

      return keyboard;
    };
  },

  destroy() {
    if (this.battleModeInterval) {
      clearInterval(this.battleModeInterval);
      this.battleModeInterval = null;
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (MobileControl && MobileControl.enabled) {
      MobileIntegration.init();
      console.log('모바일 통합 완료');
    }
  }, 500);
});