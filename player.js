class Player {
  constructor(x, y) {
  this.x=x; this.y=y; this.w=64; this.h=64; this.speed=5;
  this.dir='down'; this.moving=false; this.af=0; this.at=0;
  this.img = null;
  this.imgLoaded = false;
}

  update(map) {
    // 필드 이동속도 (변이 보너스)
    this.speed = 5 + (typeof getMutationWorldSpeedBonus === 'function' ? getMutationWorldSpeedBonus() : 0);
    const m=Input.getMovement();
    this.moving=m.x!==0||m.y!==0;
    if (m.y<0) this.dir='up'; else if (m.y>0) this.dir='down';
    else if (m.x<0) this.dir='left'; else if (m.x>0) this.dir='right';
    let nx=Math.max(0,Math.min(map.width-this.w,  this.x+m.x*this.speed));
    let ny=Math.max(0,Math.min(map.height-this.h, this.y+m.y*this.speed));
    if (map.isWalkable(nx,this.y,this.w,this.h)) this.x=nx;
    if (map.isWalkable(this.x,ny,this.w,this.h)) this.y=ny;
    if (this.moving) { this.at++; if(this.at>=12){this.at=0;this.af=(this.af+1)%4;} }
    else { this.af=0; this.at=0; }
  }

  draw(ctx, camX, camY) {
    const sx=this.x-camX, sy=this.y-camY;
    const wobble=this.moving?Math.sin(this.af*Math.PI/2)*2:0;
    ctx.save();
    ctx.translate(sx+this.w/2, sy+this.h/2+wobble);
    ctx.scale(this.dir==='left'?-1:1, 1);
    ctx.globalAlpha=0.25; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(0,this.h/2-4,20,8,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    if (this.imgLoaded) {
      ctx.drawImage(this.img,-this.w/2,-this.h/2,this.w,this.h);
    } else {
      ctx.fillStyle='#ffcc00';
      ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  get cx() { return this.x+this.w/2; }
  get cy() { return this.y+this.h/2; }
}