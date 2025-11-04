/* Azbry Tap Runner – Hybrid Delta Time (stabil di HP mode desktop)
 * by FebryWesker (Azbry-MD)
*/

(() => {
  const GRAVITY       = 0.30;
  const JUMP_VELOCITY = -7.0;
  const PIPE_SPEED    = 5.0;
  const GAP_HEIGHT    = 150;
  const PIPE_WIDTH    = 55;
  const PIPE_SPACING  = 500;
  const REWARD_SCORE  = 50;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha:false });

  const VW = 360, VH = 640;
  let scale = 1, offX = 0, offY = 0;
  function fit(){
    const ww = window.innerWidth, hh = window.innerHeight;
    const s = Math.min(ww/VW, hh/VH);
    scale = s;
    offX = (ww - VW*s)/2;
    offY = (hh - VH*s)/2;
    canvas.width = ww; canvas.height = hh;
  }
  fit(); window.addEventListener('resize', fit);

  const imgBird = new Image(); imgBird.src = 'assets/img/bird.png';
  const imgBg   = new Image(); imgBg.src   = 'assets/img/bg-city.png';
  let assetsLoaded = 0; [imgBird,imgBg].forEach(i=>i.onload=()=>assetsLoaded++);

  let state = 'menu', score = 0;
  let highscore = parseInt(localStorage.getItem('azbry_highscore') || '0');
  let pipes = [], lastSpawnX = 0, bgX = 0;
  const player = {x:80, y:VH/2, vy:0, r:18};

  // ====== UI ======
  const hud = document.createElement('div');
  hud.style.cssText = `position:fixed;left:12px;right:12px;top:10px;
  display:flex;justify-content:space-between;color:#dfe7dd;
  font:600 12px Inter,system-ui,sans-serif;text-shadow:0 1px 0 rgba(0,0,0,.4);`;
  hud.innerHTML = `<span>Azbry-MD • FebryWesker</span><span id="hudScore">Score: 0</span>`;
  document.body.appendChild(hud);
  const hudScore = hud.querySelector('#hudScore');

  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.55));z-index:5;`;
  overlay.innerHTML = `
    <div style="width:min(92vw,380px);background:#111418;border:1px solid rgba(255,255,255,.06);
    border-radius:16px;padding:18px;text-align:center;color:#e6e8ec;font-family:Inter,system-ui">
      <div style="font-weight:800;font-size:22px;margin-bottom:6px">Azbry Tap Runner</div>
      <div style="color:#aeb6c2;font-weight:600;margin-bottom:14px">Tap layar / tekan tombol untuk terbang</div>
      <button id="btnStart" style="background:linear-gradient(180deg,#b8ff9a,#8ee887);color:#0b0d10;
      font-weight:800;border:0;border-radius:12px;padding:12px 16px;width:100%;cursor:pointer;
      box-shadow:0 10px 30px rgba(184,255,154,.25);">Mulai</button>
      <div style="margin-top:12px;color:#aeb6c2;font-size:12px">Highscore: <b id="hs1">${highscore}</b></div>
    </div>`;
  document.body.appendChild(overlay);

  const over = document.createElement('div');
  over.style.cssText = `position:fixed;inset:0;display:none;align-items:center;justify-content:center;
  background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.6));z-index:6;`;
  over.innerHTML = `
    <div style="width:min(92vw,380px);background:#111418;border:1px solid rgba(255,255,255,.06);
    border-radius:18px;padding:18px;text-align:center;color:#e6e8ec;font-family:Inter,system-ui">
      <div style="font-weight:900;font-size:28px;margin:2px 0 4px">GAME OVER</div>
      <div id="overScore" style="color:#aeb6c2;font-weight:700;margin-bottom:10px">Score: 0 • Highscore: 0</div>
      <div style="color:#cfead1;background:rgba(184,255,154,.07);border:1px solid rgba(184,255,154,.25);
      padding:10px;border-radius:12px;margin-bottom:14px">
      Capai <b>${REWARD_SCORE}</b> poin untuk reward <b>×1 Nasi Uduk Mama Alpi</b> 🍚
      </div>
      <button id="btnRetry" style="background:linear-gradient(180deg,#b8ff9a,#8ee887);color:#0b0d10;
      font-weight:800;border:0;border-radius:12px;padding:12px 16px;width:100%;cursor:pointer;
      box-shadow:0 10px 30px rgba(184,255,154,.25);">Main Lagi</button>
    </div>`;
  document.body.appendChild(over);

  const btnStart = overlay.querySelector('#btnStart');
  const btnRetry = over.querySelector('#btnRetry');

  function jump(){ if(state==='playing') player.vy = JUMP_VELOCITY; }
  function startGame(){
    score=0; pipes=[]; bgX=0; player.y=VH/2; player.vy=0;
    hudScore.textContent='Score: 0';
    overlay.style.display='none'; over.style.display='none';
    state='playing'; lastSpawnX=0;
  }
  function showMenu(){
    state='menu'; overlay.style.display='flex'; over.style.display='none';
    document.getElementById('hs1').textContent=highscore;
  }
  function showGameOver(){
    state='gameover';
    over.querySelector('#overScore').textContent=`Score: ${score} • Highscore: ${highscore}`;
    over.style.display='flex';
  }

  btnStart.onclick=startGame; btnRetry.onclick=startGame;
  canvas.addEventListener('pointerdown',e=>{
    if(state==='menu') startGame();
    else if(state==='playing') jump();
  });
  window.addEventListener('keydown',e=>{
    if(['Space','ArrowUp','KeyW'].includes(e.code)){
      e.preventDefault();
      if(state==='menu') startGame(); else if(state==='playing') jump();
    }
    if(state==='gameover'&&e.code==='Enter') startGame();
  },{passive:false});

  function rnd(min,max){return Math.random()*(max-min)+min;}
  function spawnPipeSet(xStart){
    const gapY=rnd(140,VH-140-GAP_HEIGHT);
    pipes.push({x:xStart,y:0,w:PIPE_WIDTH,h:gapY,passed:false,type:'top'});
    pipes.push({x:xStart,y:gapY+GAP_HEIGHT,w:PIPE_WIDTH,h:VH-(gapY+GAP_HEIGHT),passed:false,type:'bottom'});
  }

  function update(k){
    if(state!=='playing')return;
    // background & pipe scroll konstan (biar ga ikut slow motion)
    bgX-=PIPE_SPEED*0.35;
    if(bgX<=-VW)bgX+=VW;

    // physics player (pakai delta time)
    player.vy+=GRAVITY*k;
    player.y+=player.vy*k;

    if(player.y<player.r){player.y=player.r;player.vy=0;}
    if(player.y>VH-player.r){player.y=VH-player.r;return showGameOver();}

    for(let i=pipes.length-1;i>=0;i--){
      const p=pipes[i];
      p.x-=PIPE_SPEED; // stabil, tanpa k

      const nx=Math.max(p.x,Math.min(player.x,p.x+p.w));
      const ny=Math.max(p.y,Math.min(player.y,p.y+p.h));
      const dx=player.x-nx,dy=player.y-ny;
      if(dx*dx+dy*dy<player.r*player.r)return showGameOver();

      if(!p.passed&&p.type==='bottom'&&(p.x+p.w)<player.x){
        p.passed=true;score++;
        if(score>highscore){highscore=score;localStorage.setItem('azbry_highscore',String(highscore));}
        hudScore.textContent=`Score: ${score}`;
      }
      if(p.x+p.w<-80)pipes.splice(i,1);
    }

    lastSpawnX+=PIPE_SPEED; // stabil
    if(lastSpawnX>=PIPE_SPACING){lastSpawnX=0;spawnPipeSet(VW+40);}
  }

  function drawRoundedRect(x,y,w,h,r=8){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function render(){
    ctx.fillStyle='#0b0d10';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.save(); ctx.translate(offX,offY); ctx.scale(scale,scale);
    ctx.save(); drawRoundedRect(0,0,VW,VH,18); ctx.clip();

    if(assetsLoaded>=2){
      const bgW=VW,bgH=VH,bx=Math.floor(bgX%bgW);
      ctx.drawImage(imgBg,bx,0,bgW,bgH);
      ctx.drawImage(imgBg,bx+bgW,0,bgW,bgH);
    }else{
      ctx.fillStyle='#0e1116';ctx.fillRect(0,0,VW,VH);
    }

    ctx.strokeStyle='rgba(184,255,154,.25)';ctx.lineWidth=1;
    for(let x=0;x<VW;x+=20){ctx.beginPath();ctx.moveTo(x,VH-160);ctx.lineTo(x,VH);ctx.stroke();}
    ctx.beginPath();ctx.rect(0,VH-160,VW,160);ctx.stroke();

    for(const p of pipes){
      ctx.fillStyle='#1a1f25';ctx.strokeStyle='rgba(184,255,154,.55)';
      ctx.lineWidth=2;ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.fill();ctx.stroke();
    }

    if(assetsLoaded>=1){
      ctx.save();ctx.translate(player.x,player.y);
      ctx.rotate(Math.max(-0.35,Math.min(0.5,player.vy*0.03)));
      ctx.drawImage(imgBird,-24,-24,48,48);
      ctx.restore();
    }else{
      ctx.fillStyle='#b8ff9a';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();
    }

    ctx.restore();
    ctx.strokeStyle='rgba(184,255,154,.15)';ctx.lineWidth=2;
    drawRoundedRect(offX,offY,VW*scale,VH*scale,16);ctx.stroke();
    ctx.restore();
  }

  const TICK = 1000/60;
  let last=performance.now();
  function loop(now){
    let dt=now-last; if(dt<0)dt=0; if(dt>100)dt=100; last=now;
    const k=dt/TICK; // skala waktu fisika
    if(state==='playing')update(k);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const ready=setInterval(()=>{
    if(assetsLoaded>=1){clearInterval(ready);showMenu();}
  },60);
})();
