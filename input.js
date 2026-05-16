const Input = {
  keys: {},
  init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
  },
  isDown(key) { return !!this.keys[key.toLowerCase()]; },
  getMovement() {
    return {
      x: (this.isDown('d') || this.isDown('arrowright') ? 1 : 0) - (this.isDown('a') || this.isDown('arrowleft') ? 1 : 0),
      y: (this.isDown('s') || this.isDown('arrowdown')  ? 1 : 0) - (this.isDown('w') || this.isDown('arrowup')   ? 1 : 0),
    };
  },
};