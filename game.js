let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let enemies = [], towers = [], bullets = [], particles = [];
let lives = 10, wave = 0, money = 100, score = 0, kills = 0, towersBuilt = 0, upgradesDone = 0;
let waypoints = [];
let pathMode = 'wave';
let enemySpawnQueue = [];
let lastSpawnTime = 0;
let rulerVisible = true;
let mouseX = 0, mouseY = 0;
const $ = id => document.getElementById(id);

function log(msg){
  const t = new Date().toLocaleTimeString('ru');
  $('console').innerHTML = `<span style="color:#6ee7b7">[${t}]</span> ${msg}<br>` + $('console').innerHTML;
}

function updateUI(){
  $('lives').innerText = 'Жизни: '+lives;
  $('wave').innerText = 'Волна: '+wave;
  $('money').innerText = 'Деньги: '+money;
  $('score').innerText = 'Счёт: '+score;
}

function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width*dpr;
  canvas.height = rect.height*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  updateWaypoints();
  
  $('canvasWidth').textContent = Math.round(canvas.width/dpr);
  $('canvasHeight').textContent = Math.round(canvas.height/dpr);
}

function updateWaypoints(){
  const w = canvas.width, h = canvas.height;
  
  if(pathMode === 'straight') {
    waypoints = [
      {x: -40, y: h/2},
      {x: w + 40, y: h/2}
    ];
  } else if(pathMode === 'wave') {
    waypoints = [];
    const segments = 12;
    const segmentWidth = w / segments;
    
    for(let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      const y = h/2 + Math.sin(i * 0.8) * (h/4);
      waypoints.push({x, y});
    }
    waypoints[0].x = -40;
    waypoints[waypoints.length-1].x = w + 40;
  } else if(pathMode === 'curve') {
    waypoints = [];
    const centerY = h/2;
    const amplitude = h/3;
    
    for(let i = 0; i <= 20; i++) {
      const progress = i / 20;
      const x = progress * w;
      const curve = Math.sin(progress * Math.PI);
      const y = centerY + curve * amplitude;
      waypoints.push({x, y});
    }
    waypoints[0].x = -40;
    waypoints[waypoints.length-1].x = w + 40;
  } else if(pathMode === 'zigzag') {
    waypoints = [];
    const segments = 6;
    const segmentWidth = w / segments;
    
    for(let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      const y = h/2 + (i % 2 === 0 ? -h/4 : h/4);
      waypoints.push({x, y});
    }
    waypoints[0].x = -40;
    waypoints[waypoints.length-1].x = w + 40;
  }
}

$('togglePathBtn').onclick = ()=>{
  const modes=['straight','wave','curve','zigzag'];
  pathMode = modes[(modes.indexOf(pathMode)+1)%4];
  $('togglePathBtn').innerText='Path: '+pathMode.charAt(0).toUpperCase()+pathMode.slice(1);
  updateWaypoints(); 
  log('Путь: '+pathMode);
}

$('toggleRulerBtn').onclick = ()=>{
  rulerVisible = !rulerVisible;
  $('ruler').style.display = rulerVisible ? 'block' : 'none';
  $('toggleRulerBtn').textContent = rulerVisible ? '📏' : '📐';
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = Math.round((e.clientX - rect.left) * (canvas.width / rect.width / dpr));
  mouseY = Math.round((e.clientY - rect.top) * (canvas.height / rect.height / dpr));
  $('mouseX').textContent = mouseX;
  $('mouseY').textContent = mouseY;
});

class Particle {
  constructor(x, y, color, size, velocity, life=1.0) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = velocity.x;
    this.vy = velocity.y;
    this.life = life;
    this.maxLife = life;
  }
  
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
    return this.life > 0;
  }
  
  draw() {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createExplosion(x, y, color, count=8) {
  for(let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    particles.push(new Particle(
      x, y, color,
      2 + Math.random() * 4,
      {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed},
      0.5 + Math.random() * 0.5
    ));
  }
}

class Enemy{ 
  constructor(hp,speed,delay=0){ 
    this.hp=this.maxHp=hp; 
    this.speed=speed; 
    this.progress=0; 
    this.delay=delay; 
    this.alive=true; 
    this.r=12;
  }
  
  pos(){ 
    if(waypoints.length<2) return {x:0,y:0}; 
    const total = waypoints.reduce((s,p,i)=>i<waypoints.length-1?s+Math.hypot(waypoints[i+1].x-p.x,waypoints[i+1].y-p.y):s,0); 
    let d=this.progress*total; 
    for(let i=0;i<waypoints.length-1;i++){ 
      const len=Math.hypot(waypoints[i+1].x-waypoints[i].x,waypoints[i+1].y-waypoints[i].y); 
      if(d<=len){ 
        const r=d/len; 
        return {
          x:waypoints[i].x+(waypoints[i+1].x-waypoints[i].x)*r, 
          y:waypoints[i].y+(waypoints[i+1].y-waypoints[i].y)*r
        };
      } 
      d-=len; 
    } 
    return waypoints[waypoints.length-1]; 
  } 
  
  update(dt){ 
    if(this.delay>0){ 
      this.delay-=dt; 
      return; 
    }
    
    this.progress+=dt*this.speed/100; 
    const p=this.pos(); 
    this.x=p.x; 
    this.y=p.y; 
    if(this.progress>=1){ 
      this.alive=false; 
      lives=Math.max(0,lives-1); 
      updateUI(); 
      createExplosion(this.x, this.y, '#ff6b6b', 12);
      log('Враг дошёл! -1 жизнь');
      if(lives <= 0) {
        showGameOver();
      }
    } 
  } 
  
  draw(){ 
    const grd = ctx.createRadialGradient(this.x,this.y,2,this.x,this.y,this.r*2); 
    grd.addColorStop(0,'rgba(255,110,110,0.95)'); 
    grd.addColorStop(0.6,'rgba(255,80,80,0.7)'); 
    grd.addColorStop(1,'rgba(255,40,40,0.05)'); 
    ctx.fillStyle=grd; 
    ctx.beginPath(); 
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2); 
    ctx.fill(); 
    ctx.fillStyle='rgba(0,0,0,0.5)'; 
    ctx.fillRect(this.x-18,this.y-24,36,5); 
    ctx.fillStyle='#2ef27b'; 
    ctx.fillRect(this.x-18,this.y-24,36*(this.hp/this.maxHp),5); 
  } 
}

class Tower{ 
  constructor(x, y, name){ 
    this.x = x;
    this.y = y;
    this.name = name;
    this.range=170;
    this.reload=0;
    this.reloadTime=0.55;
    this.damage=40;
    this.level=1;
    this.color='#0ea5ff';
  }
  
  update(dt){ 
    this.reload-=dt; 
    if(this.reload<=0){ 
      let target=null,minD=this.range; 
      for(let e of enemies) if(e.alive){ 
        const d=Math.hypot(e.x-this.x,e.y-this.y); 
        if(d<minD){ 
          minD=d; 
          target=e;
        }
      } 
      if(target){ 
        bullets.push(new Bullet(this.x,this.y,target,this.damage));
        this.reload=this.reloadTime; 
      } 
    } 
  } 
  
  draw(){ 
    ctx.fillStyle=this.color; 
    ctx.beginPath(); 
    ctx.roundRect(this.x-22,this.y-22,44,44,6); 
    ctx.fill(); 
    ctx.strokeStyle=this.color + '20'; 
    ctx.lineWidth=3; 
    ctx.stroke(); 
    
    if(Math.random() < 0.02) {
      ctx.strokeStyle = this.color + '15';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.fillStyle='#00121a'; 
    ctx.font='11px monospace'; 
    ctx.textAlign='center'; 
    
    ctx.fillText(this.name, this.x, this.y-8); 
    ctx.fillText('L'+this.level, this.x, this.y+8); 
  } 
}

class Bullet{ 
  constructor(x,y,t,d){ 
    this.x=x; 
    this.y=y; 
    this.t=t; 
    this.dmg=d; 
    this.speed=1000;
    this.color='#0ea5ff';
    this.size=5;
    this.alive=true; 
  } 
  
  update(dt){ 
    if(!this.t||!this.t.alive){ 
      this.alive=false; 
      return;
    } 
    const dx=this.t.x-this.x, dy=this.t.y-this.y, dist=Math.hypot(dx,dy); 
    if(dist<10){ 
      this.t.hp-=this.dmg; 
      createExplosion(this.t.x, this.t.y, this.color, 8);
      
      if(this.t.hp<=0){ 
        this.t.alive=false; 
        const reward = 10 + Math.floor(wave * 1.5);
        money+=reward; 
        score+=reward;
        kills++;
        updateUI(); 
      } 
      this.alive=false; 
      return;
    } 
    this.x+=dx/dist*this.speed*dt; 
    this.y+=dy/dist*this.speed*dt; 
  } 
  
  draw(){ 
    ctx.fillStyle=this.color; 
    ctx.beginPath(); 
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2); 
    ctx.fill();
  } 
}

function spawn_wave(){ 
  wave++; 
  const cnt=5+wave*2;
  const hp=20+wave*2;
  const spd=25+wave*2;
  
  enemySpawnQueue = [];
  for(let i=0;i<cnt;i++){ 
    enemySpawnQueue.push({
      hp: hp,
      speed: spd,
      delay: i * 0.4
    });
  }
  
  lastSpawnTime = 0;
  updateUI(); 
  log(`🌀 Волна ${wave} (${cnt} врагов, HP: ${hp})`);
}

function build_tower(name, x, y){ 
  if(x < 0 || x > canvas.width/dpr || y < 0 || y > canvas.height/dpr) {
    log('❌ Координаты за пределами карты');
    return false;
  }
  
  if(towers.some(t => t.name === name)) {
    log(`❌ Башня с именем "${name}" уже существует`);
    return false;
  }
  
  const minDistance = 60;
  for(let tower of towers) {
    const distance = Math.hypot(tower.x - x, tower.y - y);
    if(distance < minDistance) {
      log('❌ Слишком близко к другой башне');
      return false;
    }
  }
  
  if(money < 50) {
    log('❌ Недостаточно денег. Нужно: 50');
    return false;
  }
  
  towers.push(new Tower(x, y, name)); 
  money -= 50;
  towersBuilt++;
  updateUI(); 
  log(`🏗️ Построена башня "${name}" в (${x}, ${y}) (-50)`);
  return true;
}

function upgrade_tower(name){ 
  const t = towers.find(t => t.name === name);
  if(!t) {
    log(`❌ Башня с именем "${name}" не найдена`);
    return false;
  }
  
  if(money<30) {
    log('❌ Нужно 30 денег для улучшения');
    return false;
  }
  
  t.level++; 
  t.damage+=15; 
  t.reloadTime*=0.9;
  t.range += 5;
  money-=30; 
  score += 5;
  upgradesDone++;
  updateUI(); 
  log(`⚡ Улучшена башня "${name}" → L${t.level} (+5 к счету)`);
  return true;
}

function get_towers() {
  return towers.map(t => ({
    name: t.name,
    x: Math.round(t.x),
    y: Math.round(t.y),
    level: t.level,
    damage: t.damage,
    range: Math.round(t.range)
  }));
}

function reset_game(){ 
  enemies=[]; 
  bullets=[]; 
  towers=[]; 
  particles=[]; 
  enemySpawnQueue = [];
  lives=10; 
  wave=0; 
  money=100; 
  score=0;
  kills = 0;
  towersBuilt = 0;
  upgradesDone = 0;
  updateUI(); 
  hideGameOver();
  log('🔄 Игра сброшена');
}

function showGameOver() {
  $('finalWave').textContent = wave;
  $('finalScore').textContent = score;
  $('kills').textContent = kills;
  $('towersBuilt').textContent = towersBuilt;
  $('upgradesDone').textContent = upgradesDone;
  $('gameOver').style.display = 'flex';
  
  const restartHandler = (e) => {
    reset_game();
    document.removeEventListener('keydown', restartHandler);
    document.removeEventListener('click', restartHandler);
  };
  
  document.addEventListener('keydown', restartHandler);
  document.addEventListener('click', restartHandler);
}

function hideGameOver() {
  $('gameOver').style.display = 'none';
}

let last=performance.now();
function update(dt){ 
  if(enemySpawnQueue.length > 0) {
    lastSpawnTime += dt;
    while(enemySpawnQueue.length > 0 && enemySpawnQueue[0].delay <= lastSpawnTime) {
      const enemyData = enemySpawnQueue.shift();
      enemies.push(new Enemy(enemyData.hp, enemyData.speed));
    }
  }
  
  enemies.forEach(e=>e.alive&&e.update(dt)); 
  towers.forEach(t=>t.update(dt)); 
  bullets.forEach(b=>b.alive&&b.update(dt)); 
  particles = particles.filter(p => p.update(dt));
  enemies=enemies.filter(e=>e.alive); 
  bullets=bullets.filter(b=>b.alive); 
}

function draw(){ 
  ctx.clearRect(0,0,canvas.width,canvas.height); 
  
  if(waypoints.length>=2){ 
    ctx.lineWidth=40; 
    ctx.lineCap='round'; 
    ctx.strokeStyle='rgba(46,242,123,0.08)'; 
    ctx.beginPath(); 
    ctx.moveTo(waypoints[0].x,waypoints[0].y); 
    for(let p of waypoints.slice(1)) ctx.lineTo(p.x,p.y); 
    ctx.stroke(); 
    
    ctx.lineWidth=4; 
    ctx.strokeStyle='rgba(46,242,123,0.3)'; 
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); 
    ctx.moveTo(waypoints[0].x,waypoints[0].y); 
    for(let p of waypoints.slice(1)) ctx.lineTo(p.x,p.y); 
    ctx.stroke(); 
    ctx.setLineDash([]);
  } 
  
  particles.forEach(p=>p.draw());
  towers.forEach(t=>t.draw()); 
  enemies.forEach(e=>e.draw()); 
  bullets.forEach(b=>b.draw()); 
}

function loop(ts){ 
  const dt=Math.min((ts-last)/1000, 0.1); 
  last=ts; 
  update(dt); 
  draw(); 
  requestAnimationFrame(loop);
}

window.addEventListener('resize',resizeCanvas); 
resizeCanvas(); 
requestAnimationFrame(loop);