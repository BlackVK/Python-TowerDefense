
function log(msg){
  const t = new Date().toLocaleTimeString('ru');
  $('console').innerHTML = `<span style="color:#6ee7b7">[${t}]</span> ${msg}<br>` + $('console').innerHTML;
}

function updateUI(){
  $('lives').innerText = 'Жизни: '+lives;
  $('wave').innerText = 'Волна: '+wave;
  $('money').innerText = 'Деньги: '+money;
  $('score').innerText = 'Счёт: '+score;
  
  // Обновляем информацию о карте
  if (gameMode === 'campaign') {
    $('mapInfo').innerText = `Уровень ${currentCampaignLevel}`;
  } else {
    $('mapInfo').innerText = `Карта: ${getMapName(currentMap)}`;
  }
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
  const w = canvas.width/dpr;
  const h = canvas.height/dpr;
  
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

function initGameControls() {
    // В бесконечном режиме нельзя менять карту
    if (gameMode === 'sandbox') {
        canChangeMap = false;
    } else {
        canChangeMap = false; // В кампании тоже нельзя
    }

    $('toggleRulerBtn').onclick = ()=>{
        rulerVisible = !rulerVisible;
        $('ruler').style.display = rulerVisible ? 'block' : 'none';
        $('toggleRulerBtn').textContent = rulerVisible ? '📏' : '📐';
    };

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = Math.round((e.clientX - rect.left) * (canvas.width / rect.width / dpr));
        mouseY = Math.round((e.clientY - rect.top) * (canvas.height / rect.height / dpr));
        $('mouseX').textContent = mouseX;
        $('mouseY').textContent = mouseY;
    });
}

function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.querySelector('.container').style.display = 'flex';
    
    // Устанавливаем карту в зависимости от режима
    if (gameMode === 'sandbox') {
        document.getElementById('gameTitle').textContent = `∞ Бесконечный режим: ${getMapName(currentMap)}`;
        pathMode = currentMap;
    } else {
        const levelData = campaignLevels[currentCampaignLevel];
        document.getElementById('gameTitle').textContent = levelData.title;
        pathMode = levelData.map;
    }
    
    // Инициализируем игру
    resizeCanvas();
    initGameControls();
    updateWaypoints();
    reset_game();
    gameStartTime = Date.now();
    
    // Показываем описание уровня в кампании
    if (gameMode === 'campaign') {
        setTimeout(() => {
            showLevelDescription();
        }, 500);
    }
    
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(loop);
}