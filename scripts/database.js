// Основной игровой движок
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        // Игровые объекты
        this.enemies = [];
        this.towers = [];
        this.bullets = [];
        this.particles = [];
        
        // Статистика
        this.lives = 10;
        this.wave = 0;
        this.money = 100;
        this.score = 0;
        this.kills = 0;
        this.towersBuilt = 0;
        this.upgradesDone = 0;
        
        // Системные переменные
        this.waypoints = [];
        this.pathMode = 'wave';
        this.enemySpawnQueue = [];
        this.lastSpawnTime = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.gameWin = false;
        this.gameStartTime = 0;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.animationTime = 0;
        
        // Конфигурация
        this.config = {
            towerCost: 50,
            upgradeCost: 30,
            killReward: 10,
            startingLives: 10,
            startingMoney: 100
        };
        
        // Привязка методов
        this.gameLoop = this.gameLoop.bind(this);
    }
    
    // Инициализация
    init(gameMode, mapId, levelData = null) {
        console.log('[Game] Инициализация игры...');
        this.gameMode = gameMode;
        this.mapId = mapId;
        this.levelData = levelData;
        this.pathMode = mapId;
        
        this.resizeCanvas();
        this.updateWaypoints();
        
        // Настраиваем начальные значения
        if (gameMode === 'campaign' && levelData) {
            this.lives = levelData.startingLives || 10;
            this.money = levelData.startingMoney || 100;
            this.requiredWaves = levelData.wavesToWin || 5;
        } else {
            this.lives = this.config.startingLives;
            this.money = this.config.startingMoney;
            this.requiredWaves = 0;
        }
        
        this.wave = 0;
        this.score = 0;
        this.kills = 0;
        this.towersBuilt = 0;
        this.upgradesDone = 0;
        
        this.enemies = [];
        this.towers = [];
        this.bullets = [];
        this.particles = [];
        this.enemySpawnQueue = [];
        
        this.gameStarted = true;
        this.gameOver = false;
        this.gameWin = false;
        this.gameStartTime = Date.now();
        this.lastFrameTime = 0;
        this.animationTime = 0;
        
        this.updateUI();
        console.log(`[Game] Игра начата в режиме: ${gameMode}, карта: ${mapId}`);
        
        // Создаём тестового врага для проверки анимации
        // this.enemies.push(new Enemy(50, 30, 0));
    }
    
    // Изменение размера канваса
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.updateWaypoints();
    }
    
    // Обновление точек пути
    updateWaypoints() {
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;
        
        this.waypoints = [];
        
        if (this.pathMode === 'straight') {
            // Прямая линия
            this.waypoints = [
                { x: -40, y: h / 2 },
                { x: w + 40, y: h / 2 }
            ];
        } else if (this.pathMode === 'wave') {
            // Волна
            const segments = 12;
            const segmentWidth = w / segments;
            
            for (let i = 0; i <= segments; i++) {
                const x = i * segmentWidth;
                const y = h / 2 + Math.sin(i * 0.8) * (h / 4);
                this.waypoints.push({ x, y });
            }
            this.waypoints[0].x = -40;
            this.waypoints[this.waypoints.length - 1].x = w + 40;
        } else if (this.pathMode === 'curve') {
            // Извилистая
            const centerY = h / 2;
            const amplitude = h / 3;
            
            for (let i = 0; i <= 20; i++) {
                const progress = i / 20;
                const x = progress * w;
                const curve = Math.sin(progress * Math.PI);
                const y = centerY + curve * amplitude;
                this.waypoints.push({ x, y });
            }
            this.waypoints[0].x = -40;
            this.waypoints[this.waypoints.length - 1].x = w + 40;
        } else if (this.pathMode === 'zigzag') {
            // Зигзаг
            const segments = 6;
            const segmentWidth = w / segments;
            
            for (let i = 0; i <= segments; i++) {
                const x = i * segmentWidth;
                const y = h / 2 + (i % 2 === 0 ? -h / 4 : h / 4);
                this.waypoints.push({ x, y });
            }
            this.waypoints[0].x = -40;
            this.waypoints[this.waypoints.length - 1].x = w + 40;
        }
    }
    
    // ========== ИГРОВЫЕ ФУНКЦИИ ==========
    
    // Создание волны врагов
    spawn_wave() {
        this.wave++;
        const count = 5 + this.wave * 2;
        const hp = 20 + this.wave * 2;
        const speed = 25 + this.wave * 1.5;
        
        this.enemySpawnQueue = [];
        for (let i = 0; i < count; i++) {
            this.enemySpawnQueue.push({
                hp: hp,
                speed: speed,
                delay: i * 0.3
            });
        }
        
        this.lastSpawnTime = 0;
        this.updateUI();
        
        if (window.log) {
            window.log(`🌀 Волна ${this.wave} (${count} врагов, HP: ${hp})`);
        }
        
        return true;
    }
    
    // Построить башню
    build_tower(name, x, y) {
        // Проверки
        if (x < 0 || x > this.canvas.width / this.dpr || y < 0 || y > this.canvas.height / this.dpr) {
            if (window.log) window.log('❌ Координаты за пределами карты');
            return false;
        }
        
        if (this.towers.some(t => t.name === name)) {
            if (window.log) window.log(`❌ Башня с именем "${name}" уже существует`);
            return false;
        }
        
        const minDistance = 60;
        for (let tower of this.towers) {
            const distance = Math.hypot(tower.x - x, tower.y - y);
            if (distance < minDistance) {
                if (window.log) window.log('❌ Слишком близко к другой башне');
                return false;
            }
        }
        
        if (this.money < this.config.towerCost) {
            if (window.log) window.log(`❌ Недостаточно денег. Нужно: ${this.config.towerCost}`);
            return false;
        }
        
        // Создание башни
        this.towers.push(new Tower(x, y, name));
        this.money -= this.config.towerCost;
        this.towersBuilt++;
        this.updateUI();
        
        // Эффект постройки
        this.createExplosion(x, y, '#00c2ff', 12);
        
        if (window.log) {
            window.log(`🏗️ Построена башня "${name}" в (${x}, ${y}) (-${this.config.towerCost})`);
        }
        
        return true;
    }
    
    // Улучшить башню
    upgrade_tower(name) {
        const tower = this.towers.find(t => t.name === name);
        if (!tower) {
            if (window.log) window.log(`❌ Башня с именем "${name}" не найдена`);
            return false;
        }
        
        if (this.money < this.config.upgradeCost) {
            if (window.log) window.log(`❌ Нужно ${this.config.upgradeCost} денег для улучшения`);
            return false;
        }
        
        tower.level++;
        tower.damage += 15;
        tower.reloadTime = Math.max(0.2, tower.reloadTime * 0.9);
        tower.range += 10;
        tower.color = this.getTowerColor(tower.level);
        
        this.money -= this.config.upgradeCost;
        this.score += 5;
        this.upgradesDone++;
        this.updateUI();
        
        // Эффект улучшения
        this.createExplosion(tower.x, tower.y, '#ffd166', 8);
        
        if (window.log) {
            window.log(`⚡ Улучшена башня "${name}" → L${tower.level} (+5 к счету)`);
        }
        
        return true;
    }
    
    getTowerColor(level) {
        const colors = ['#0ea5ff', '#2ef27b', '#ffd166', '#c084fc', '#ff6b6b'];
        return colors[Math.min(level - 1, colors.length - 1)] || '#0ea5ff';
    }
    
    // Получить список башен
    get_towers() {
        return this.towers.map(t => ({
            name: t.name,
            x: Math.round(t.x),
            y: Math.round(t.y),
            level: t.level,
            damage: t.damage,
            range: Math.round(t.range)
        }));
    }
    
    // Сбросить игру
    reset_game() {
        this.enemies = [];
        this.bullets = [];
        this.towers = [];
        this.particles = [];
        this.enemySpawnQueue = [];
        
        if (this.gameMode === 'campaign' && this.levelData) {
            this.lives = this.levelData.startingLives || 10;
            this.money = this.levelData.startingMoney || 100;
        } else {
            this.lives = this.config.startingLives;
            this.money = this.config.startingMoney;
        }
        
        this.wave = 0;
        this.score = 0;
        this.kills = 0;
        this.towersBuilt = 0;
        this.upgradesDone = 0;
        
        this.gameOver = false;
        this.gameWin = false;
        
        this.updateUI();
        
        if (window.log) {
            window.log('🔄 Игра сброшена');
        }
    }
    
    // Потеря жизни
    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver = true;
            if (window.showGameOver) {
                window.showGameOver(this.getGameResult());
            }
        }
    }
    
    // Победа в кампании
    winGame() {
        this.gameOver = true;
        this.gameWin = true;
        if (window.showGameWin) {
            window.showGameWin(this.getGameResult());
        }
    }
    
    // Получить результат игры
    getGameResult() {
        const playTime = (Date.now() - this.gameStartTime) / 1000;
        
        return {
            wave: this.wave,
            score: this.score,
            kills: this.kills,
            towersBuilt: this.towersBuilt,
            upgrades: this.upgradesDone,
            playTime: playTime,
            mapId: this.mapId,
            gameMode: this.gameMode,
            won: this.gameWin
        };
    }
    
    // Обновление UI
    updateUI() {
        if (window.updateGameUI) {
            window.updateGameUI({
                lives: this.lives,
                wave: this.wave,
                money: this.money,
                score: this.score
            });
        }
    }
    
    // ========== ФИЗИКА И АНИМАЦИЯ ==========
    
    // Обновление игры
    update(deltaTime) {
        if (!this.gameStarted || this.gameOver) return;
        
        this.animationTime += deltaTime;
        this.frameCount++;
        
        // Спавн врагов
        if (this.enemySpawnQueue.length > 0) {
            this.lastSpawnTime += deltaTime;
            while (this.enemySpawnQueue.length > 0 && this.enemySpawnQueue[0].delay <= this.lastSpawnTime) {
                const enemyData = this.enemySpawnQueue.shift();
                const enemy = new Enemy(enemyData.hp, enemyData.speed);
                enemy.progress = 0.01; // Небольшой прогресс для анимации
                this.enemies.push(enemy);
            }
        }
        
        // Обновление врагов
        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.update(deltaTime, this.waypoints);
                
                // Проверка достижения конца
                if (enemy.progress >= 1) {
                    enemy.alive = false;
                    this.loseLife();
                    this.createExplosion(enemy.x, enemy.y, '#ff6b6b', 16);
                }
            }
        });
        
        // Обновление башен
        this.towers.forEach(tower => {
            tower.update(deltaTime, this.enemies, this.bullets);
        });
        
        // Обновление снарядов
        this.bullets.forEach(bullet => {
            if (bullet.alive) {
                const result = bullet.update(deltaTime);
                
                if (result.hit) {
                    // Попадание
                    if (result.enemy) {
                        result.enemy.hp -= bullet.damage;
                        
                        this.createExplosion(bullet.x, bullet.y, bullet.color, 8);
                        
                        if (result.enemy.hp <= 0) {
                            result.enemy.alive = false;
                            const reward = 10 + Math.floor(this.wave * 1.5);
                            this.money += reward;
                            this.score += reward;
                            this.kills++;
                            this.updateUI();
                            
                            this.createExplosion(result.enemy.x, result.enemy.y, '#ff6b6b', 20);
                        }
                    }
                }
            }
        });
        
        // Фильтрация объектов
        this.enemies = this.enemies.filter(e => e.alive);
        this.bullets = this.bullets.filter(b => b.alive);
        
        // Обновление частиц
        this.particles = this.particles.filter(p => p.update(deltaTime));
        
        // Проверка победы в кампании
        if (this.gameMode === 'campaign' && this.wave >= this.requiredWaves && !this.gameOver) {
            this.winGame();
        }
    }
    
    // Создание взрыва (частицы)
    createExplosion(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            const size = 2 + Math.random() * 5;
            const life = 0.3 + Math.random() * 0.5;
            
            this.particles.push(new Particle(
                x, y,
                color,
                size,
                {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                life
            ));
        }
    }
    
    // ========== ОТРИСОВКА ==========
    
    draw() {
        if (!this.gameStarted) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;
        
        // Очистка canvas
        ctx.clearRect(0, 0, w, h);
        
        // Фон с градиентом
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#081522');
        gradient.addColorStop(1, '#06121a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // Рисуем путь
        this.drawPath();
        
        // Рисуем частицы
        this.particles.forEach(p => p.draw(ctx));
        
        // Рисуем башни
        this.towers.forEach(t => t.draw(ctx, this.animationTime));
        
        // Рисуем врагов
        this.enemies.forEach(e => e.draw(ctx, this.animationTime));
        
        // Рисуем снаряды
        this.bullets.forEach(b => b.draw(ctx));
        
        // Рисуем эффекты дальности (только для выбранной башни)
        if (this.frameCount % 30 === 0 && this.towers.length > 0) {
            const randomTower = this.towers[Math.floor(Math.random() * this.towers.length)];
            randomTower.drawRange(ctx);
        }
    }
    
    drawPath() {
        const ctx = this.ctx;
        
        if (this.waypoints.length < 2) return;
        
        // Тень пути
        ctx.shadowColor = 'rgba(46, 242, 123, 0.3)';
        ctx.shadowBlur = 20;
        
        // Основная дорога
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(46, 242, 123, 0.15)';
        
        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        ctx.stroke();
        
        // Контур пути
        ctx.shadowBlur = 10;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(46, 242, 123, 0.4)';
        ctx.setLineDash([15, 20]);
        
        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y);
        }
        ctx.stroke();
        
        // Сбрасываем настройки
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
    }
    
    // ========== ИГРОВОЙ ЦИКЛ ==========
    
    gameLoop(timestamp) {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = timestamp;
        
        this.update(deltaTime);
        this.draw();
        
        if (this.gameStarted && !this.gameOver) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    start() {
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.animationTime = 0;
        requestAnimationFrame(this.gameLoop);
        console.log('[Game] Игровой цикл запущен');
    }
    
    stop() {
        this.gameStarted = false;
        console.log('[Game] Игра остановлена');
    }
}

// ========== КЛАСС ВРАГА ==========
class Enemy {
    constructor(hp, speed, delay = 0) {
        this.hp = this.maxHp = hp;
        this.speed = speed;
        this.progress = 0;
        this.delay = delay;
        this.alive = true;
        this.radius = 12;
        this.x = 0;
        this.y = 0;
        
        // Для анимации
        this.animationOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 2 + Math.random() * 2;
        this.wobbleAmount = 2 + Math.random() * 2;
    }
    
    getPosition(waypoints) {
        if (!waypoints || waypoints.length < 2) return { x: 0, y: 0 };
        
        // Вычисляем общую длину пути
        let totalLength = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            totalLength += Math.hypot(
                waypoints[i + 1].x - waypoints[i].x,
                waypoints[i + 1].y - waypoints[i].y
            );
        }
        
        let distance = this.progress * totalLength;
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const dx = waypoints[i + 1].x - waypoints[i].x;
            const dy = waypoints[i + 1].y - waypoints[i].y;
            const segmentLength = Math.hypot(dx, dy);
            
            if (distance <= segmentLength) {
                const t = distance / segmentLength;
                return {
                    x: waypoints[i].x + dx * t,
                    y: waypoints[i].y + dy * t
                };
            }
            
            distance -= segmentLength;
        }
        
        return waypoints[waypoints.length - 1];
    }
    
    update(deltaTime, waypoints) {
        if (this.delay > 0) {
            this.delay -= deltaTime;
            return;
        }
        
        this.progress += deltaTime * this.speed / 100;
        if (this.progress > 1) this.progress = 1;
        
        const pos = this.getPosition(waypoints);
        this.x = pos.x;
        this.y = pos.y;
    }
    
    draw(ctx, time) {
        if (!this.alive) return;
        
        // Эффект пульсации
        const pulse = 1 + Math.sin(time * 10 + this.animationOffset) * 0.05;
        const wobbleX = Math.sin(time * this.wobbleSpeed + this.animationOffset) * this.wobbleAmount;
        const wobbleY = Math.cos(time * this.wobbleSpeed + this.animationOffset) * this.wobbleAmount;
        
        const x = this.x + wobbleX;
        const y = this.y + wobbleY;
        const radius = this.radius * pulse;
        
        // Градиент для врага
        const gradient = ctx.createRadialGradient(
            x - 3, y - 3, 2,
            x, y, radius * 1.5
        );
        
        const healthPercent = this.hp / this.maxHp;
        const red = 255;
        const green = Math.floor(100 + 155 * healthPercent);
        const blue = Math.floor(100 + 155 * healthPercent);
        
        gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.95)`);
        gradient.addColorStop(0.7, `rgba(${red}, 80, 80, 0.7)`);
        gradient.addColorStop(1, 'rgba(255, 40, 40, 0)');
        
        // Тело врага
        ctx.shadowColor = 'rgba(255, 100, 100, 0.5)';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Глаза
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x - 4, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(x - 4 + Math.sin(time * 5) * 1, y - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4 + Math.sin(time * 5 + 2) * 1, y - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Полоска здоровья
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - 20, y - 25, 40, 6);
        
        const healthWidth = 38 * (this.hp / this.maxHp);
        ctx.fillStyle = '#2ef27b';
        ctx.fillRect(x - 19, y - 24, healthWidth, 4);
        
        ctx.shadowBlur = 0;
    }
}

// ========== КЛАСС БАШНИ ==========
class Tower {
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.range = 170;
        this.reload = 0;
        this.reloadTime = 0.55;
        this.damage = 40;
        this.level = 1;
        this.color = '#0ea5ff';
        
        // Анимация
        this.rotation = Math.random() * Math.PI * 2;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime, enemies, bullets) {
        this.reload -= deltaTime;
        this.rotation += deltaTime * 2;
        
        if (this.reload <= 0) {
            let target = null;
            let minDistance = this.range;
            
            // Ищем ближайшего врага
            for (let enemy of enemies) {
                if (enemy.alive) {
                    const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (distance < minDistance) {
                        minDistance = distance;
                        target = enemy;
                    }
                }
            }
            
            // Стреляем
            if (target) {
                bullets.push(new Bullet(this.x, this.y, target, this.damage, this.color));
                this.reload = this.reloadTime;
            }
        }
    }
    
    draw(ctx, time) {
        // Пульсация
        const pulse = 1 + Math.sin(time * 5 + this.pulsePhase) * 0.03;
        
        // Основание башни
        ctx.shadowColor = this.color + '80';
        ctx.shadowBlur = 15;
        
        // Платформа
        ctx.fillStyle = 'rgba(30, 40, 50, 0.9)';
        ctx.beginPath();
        ctx.roundRect(this.x - 24, this.y - 24, 48, 48, 8);
        ctx.fill();
        
        // Тело башни
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(this.x - 20, this.y - 20, 40, 40, 6);
        ctx.fill();
        
        // Вращающаяся турель
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, -5, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Индикатор уровня
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#00121a';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, this.x, this.y - 30);
        
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('L' + this.level, this.x, this.y + 32);
        
        ctx.shadowBlur = 0;
    }
    
    drawRange(ctx) {
        ctx.strokeStyle = this.color + '20';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ========== КЛАСС СНАРЯДА ==========
class Bullet {
    constructor(x, y, target, damage, color = '#0ea5ff') {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = 800;
        this.color = color;
        this.size = 6;
        this.alive = true;
        
        // Анимация
        this.trail = [];
        this.age = 0;
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        if (!this.target || !this.target.alive) {
            this.alive = false;
            return { hit: false };
        }
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Сохраняем след
        this.trail.push({ x: this.x, y: this.y, age: 0.2 });
        this.trail = this.trail.filter(t => {
            t.age -= deltaTime;
            return t.age > 0;
        });
        
        if (distance < 15) {
            // Попадание
            this.alive = false;
            return { 
                hit: true, 
                enemy: this.target,
                x: this.target.x,
                y: this.target.y
            };
        }
        
        // Движение к цели
        const moveX = (dx / distance) * this.speed * deltaTime;
        const moveY = (dy / distance) * this.speed * deltaTime;
        
        // Проверка на перелёт
        const newDistance = Math.hypot(
            (this.target.x - (this.x + moveX)),
            (this.target.y - (this.y + moveY))
        );
        
        if (newDistance > distance) {
            this.x = this.target.x;
            this.y = this.target.y;
        } else {
            this.x += moveX;
            this.y += moveY;
        }
        
        return { hit: false };
    }
    
    draw(ctx) {
        // Рисуем след
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = t.age / 0.2;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        // Снаряд
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Ядро
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

// ========== КЛАСС ЧАСТИЦЫ ==========
class Particle {
    constructor(x, y, color, size, velocity, life = 0.8) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = velocity.x;
        this.vy = velocity.y;
        this.life = life;
        this.maxLife = life;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime * 1.5;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.size *= 0.98;
        
        return this.life > 0;
    }
    
    draw(ctx) {
        const alpha = Math.min(this.life / this.maxLife, 0.8);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

// Вспомогательный метод для Canvas
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
};

// Экспорт
window.GameEngine = GameEngine;