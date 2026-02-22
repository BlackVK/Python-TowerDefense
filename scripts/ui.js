// Управление пользовательским интерфейсом
class UIManager {
    constructor() {
        this.currentUser = null;
        this.gameMode = null;
        this.currentMap = 'wave';
        this.selectedCampaignLevel = 1;
        
        this.campaignLevels = {
            1: {
                title: "Уровень 1: Основы",
                map: "wave",
                objective: "Пройдите 5 волн врагов",
                description: "В этом уровне вы научитесь основам игры: строительству башен и их размещению.",
                tips: [
                    "Начните с построения башен на ключевых точках волнового пути",
                    "Используйте функцию build_tower('имя', x, y) для строительства",
                    "Размещайте башни на изгибах пути для максимальной эффективности"
                ],
                rewards: "Откроется Уровень 2: Улучшения",
                wavesToWin: 5,
                startingMoney: 150,
                startingLives: 10
            },
            2: {
                title: "Уровень 2: Улучшения",
                map: "curve",
                objective: "Пройдите 8 волн, улучшая башни",
                description: "Теперь вам нужно не только строить, но и улучшать башни для увеличения их эффективности.",
                tips: [
                    "Постройте минимум 3 башни в стратегических точках",
                    "Улучшайте башни с помощью upgrade_tower('имя')",
                    "Балансируйте между строительством новых башен и улучшением существующих"
                ],
                rewards: "Откроется Уровень 3: Лабиринт",
                wavesToWin: 8,
                startingMoney: 200,
                startingLives: 10
            },
            3: {
                title: "Уровень 3: Лабиринт",
                map: "zigzag",
                objective: "Пройдите 10 волн на сложном зигзагообразном пути",
                description: "Сложный путь требует тщательного планирования размещения башен.",
                tips: [
                    "Размещайте башни в точках, где путь меняет направление",
                    "Используйте башни с максимальной дальностью",
                    "Улучшайте дальность атаки для охвата большей территории"
                ],
                rewards: "Откроется Уровень 4: Зигзаг",
                wavesToWin: 10,
                startingMoney: 250,
                startingLives: 10
            },
            4: {
                title: "Уровень 4: Зигзаг",
                map: "zigzag",
                objective: "Пройдите 12 волн с ограниченными ресурсами",
                description: "Этот уровень проверяет ваше умение эффективно использовать ресурсы.",
                tips: [
                    "Экономить деньги - ключ к успеху",
                    "Не стройте слишком много башен одновременно",
                    "Сначала улучшите ключевые башни, затем стройте новые"
                ],
                rewards: "Откроется Уровень 5: Финальный",
                wavesToWin: 12,
                startingMoney: 200,
                startingLives: 8
            },
            5: {
                title: "Уровень 5: Финальный",
                map: "straight",
                objective: "Пройдите 15 волн на прямой линии",
                description: "Финальное испытание! Прямой путь означает, что враги движутся быстро и прямо к цели.",
                tips: [
                    "Стройте башни близко к пути для максимального урона",
                    "Создайте несколько линий защиты",
                    "Используйте массовые улучшения в конце пути"
                ],
                rewards: "Завершение кампании и специальная награда",
                wavesToWin: 15,
                startingMoney: 300,
                startingLives: 10
            }
        };
    }
    
    init() {
        console.log('[UI] Инициализация интерфейса...');
        this.loadTemplates();
        this.setupEventListeners();
        this.checkSavedUser();
    }
    
    loadTemplates() {
        // Загрузка шаблонов меню
        this.loadMenuTemplates();
    }
    
    loadMenuTemplates() {
        const mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) {
            console.error('[UI] Элемент mainMenu не найден');
            return;
        }
        
        mainMenu.innerHTML = `
            <div class="menu-container">
                <!-- Экран входа -->
                <div id="loginSection" class="menu-section active">
                    <h1 class="menu-title">🚀 Tower Defense Python</h1>
                    <p class="menu-subtitle">Управляйте защитой с помощью Python кода</p>
                    
                    <div class="input-group">
                        <input type="text" id="loginUsername" placeholder="Имя пользователя" autocomplete="username">
                    </div>
                    <div class="input-group">
                        <input type="password" id="loginPassword" placeholder="Пароль" autocomplete="current-password">
                    </div>
                    
                    <button class="btn-menu" onclick="ui.login()">Войти</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showRegister()">Регистрация</button>
                    <button class="btn-menu btn-secondary" onclick="ui.playAsGuest()">Играть как гость</button>
                </div>
                
                <!-- Экран регистрации -->
                <div id="registerSection" class="menu-section">
                    <h1 class="menu-title">📝 Регистрация</h1>
                    
                    <div class="input-group">
                        <input type="text" id="registerUsername" placeholder="Имя пользователя (мин. 3 символа)" autocomplete="username">
                    </div>
                    <div class="input-group">
                        <input type="password" id="registerPassword" placeholder="Пароль (мин. 4 символа)" autocomplete="new-password">
                    </div>
                    <div class="input-group">
                        <input type="password" id="registerConfirm" placeholder="Подтвердите пароль" autocomplete="new-password">
                    </div>
                    
                    <button class="btn-menu" onclick="ui.register()">Зарегистрироваться</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showLogin()">Назад к входу</button>
                </div>
                
                <!-- Главное меню -->
                <div id="mainMenuSection" class="menu-section">
                    <div class="user-info">
                        <h3>Добро пожаловать, <span id="currentUserName">Гость</span>!</h3>
                        <div class="user-stats">
                            <div class="stat-item">
                                <span class="stat-value" id="userBestWave">0</span>
                                <span>Лучшая волна</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="userTotalKills">0</span>
                                <span>Всего убито</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn-menu" onclick="ui.showCampaignLevels()">🎮 Кампания</button>
                    <button class="btn-menu" onclick="ui.showSandboxMaps()">∞ Бесконечный режим</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showLeaderboards()">🏆 Таблица лидеров</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showSettings()">⚙️ Настройки</button>
                    <button class="btn-menu btn-secondary" onclick="ui.logout()">🚪 Выйти</button>
                </div>
                
                <!-- Бесконечный режим -->
                <div id="sandboxMapSection" class="menu-section">
                    <h1 class="menu-title">∞ Выбор карты</h1>
                    <p class="menu-subtitle">Выберите карту для бесконечной игры</p>
                    
                    <div class="map-selection">
                        <div class="map-card" onclick="ui.selectMap('wave')">
                            <h4>🌊 Волновая</h4>
                            <span class="map-difficulty">Легкая</span>
                            <p class="map-record" id="recordWave">Ваш рекорд: 0 волн</p>
                        </div>
                        
                        <div class="map-card" onclick="ui.selectMap('zigzag')">
                            <h4>⚡ Зигзаг</h4>
                            <span class="map-difficulty">Средняя</span>
                            <p class="map-record" id="recordZigzag">Ваш рекорд: 0 волн</p>
                        </div>
                        
                        <div class="map-card" onclick="ui.selectMap('curve')">
                            <h4>🌀 Извилистая</h4>
                            <span class="map-difficulty">Сложная</span>
                            <p class="map-record" id="recordCurve">Ваш рекорд: 0 волн</p>
                        </div>
                        
                        <div class="map-card" onclick="ui.selectMap('straight')">
                            <h4>➡️ Прямая</h4>
                            <span class="map-difficulty">Экстремальная</span>
                            <p class="map-record" id="recordStraight">Ваш рекорд: 0 волн</p>
                        </div>
                    </div>
                    
                    <button class="btn-menu" onclick="ui.startSandbox()">Начать игру</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showMainMenu()">← Назад</button>
                </div>
                
                <!-- Кампания -->
                <div id="campaignLevelsSection" class="menu-section">
                    <h1 class="menu-title">🎮 Кампания</h1>
                    <p class="menu-subtitle">Прогресс: <span id="campaignProgressText">Уровень 1/5</span></p>
                    
                    <div class="level-description" id="selectedLevelDescription" style="display: none;"></div>
                    
                    <div class="map-selection">
                        ${[1, 2, 3, 4, 5].map(level => `
                            <div class="map-card campaign-level ${level > 1 ? 'locked' : ''}" 
                                 data-level="${level}" 
                                 onclick="ui.selectCampaignLevel(${level})">
                                <h4>Уровень ${level}: ${this.campaignLevels[level]?.title.split(': ')[1] || ''}</h4>
                                <span class="map-difficulty">${this.getDifficultyLabel(level)}</span>
                                <p>${this.campaignLevels[level]?.objective || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button class="btn-menu" id="startCampaignBtn" onclick="ui.startCampaign()" disabled>Начать уровень</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showMainMenu()">← Назад</button>
                </div>
                
                <!-- Настройки -->
                <div id="settingsSection" class="menu-section">
                    <h1 class="menu-title">⚙️ Настройки</h1>
                    
                    <div class="input-group">
                        <label>Громкость звуков:</label>
                        <input type="range" id="soundVolume" min="0" max="100" value="70">
                    </div>
                    
                    <div class="input-group">
                        <label>Громкость музыки:</label>
                        <input type="range" id="musicVolume" min="0" max="100" value="50">
                    </div>
                    
                    <div class="input-group">
                        <label>
                            <input type="checkbox" id="showRuler" checked> Показывать линейку
                        </label>
                    </div>
                    
                    <button class="btn-menu" onclick="ui.saveSettings()">Сохранить</button>
                    <button class="btn-menu btn-secondary" onclick="ui.showMainMenu()">← Назад</button>
                </div>
                
                <!-- Таблица лидеров -->
                <div id="leaderboardSection" class="menu-section">
                    <h1 class="menu-title">🏆 Таблица лидеров</h1>
                    
                    <select id="leaderboardMapSelect" onchange="ui.loadLeaderboard()">
                        <option value="wave">🌊 Волновая</option>
                        <option value="zigzag">⚡ Зигзаг</option>
                        <option value="curve">🌀 Извилистая</option>
                        <option value="straight">➡️ Прямая</option>
                    </select>
                    
                    <div class="leaderboard-container">
                        <table class="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Игрок</th>
                                    <th>Волна</th>
                                    <th>Очки</th>
                                </tr>
                            </thead>
                            <tbody id="leaderboardTable"></tbody>
                        </table>
                    </div>
                    
                    <button class="btn-menu btn-secondary" onclick="ui.showMainMenu()">← Назад</button>
                </div>
            </div>
        `;
        
        console.log('[UI] Меню загружено');
    }
    
    getDifficultyLabel(level) {
        const labels = {
            1: 'Обучение',
            2: 'Легкий',
            3: 'Средний',
            4: 'Сложный',
            5: 'Экстремальный'
        };
        return labels[level] || 'Легкий';
    }
    
    setupEventListeners() {
        // Обработчики кнопок в игровом интерфейсе
        setTimeout(() => {
            const menuBtn = document.getElementById('menuBtn');
            if (menuBtn) {
                menuBtn.addEventListener('click', () => this.returnToMenu());
            }
            
            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (window.game) {
                        window.game.reset_game();
                    }
                });
            }
            
            const toggleRulerBtn = document.getElementById('toggleRulerBtn');
            if (toggleRulerBtn) {
                toggleRulerBtn.addEventListener('click', () => {
                    const ruler = document.getElementById('ruler');
                    if (ruler) {
                        const isVisible = ruler.style.display !== 'none';
                        ruler.style.display = isVisible ? 'none' : 'block';
                        toggleRulerBtn.textContent = isVisible ? '📐' : '📏';
                    }
                });
            }
        }, 1000);
    }
    
    checkSavedUser() {
        const savedUser = sessionStorage.getItem('td_current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showMainMenu();
            } catch (e) {
                console.error('Ошибка загрузки пользователя:', e);
                sessionStorage.removeItem('td_current_user');
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }
    
    // ========== НАВИГАЦИЯ ==========
    showSection(sectionId) {
        document.querySelectorAll('.menu-section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
    }
    
    showLogin() {
        this.showSection('loginSection');
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }
    
    showRegister() {
        this.showSection('registerSection');
        const usernameInput = document.getElementById('registerUsername');
        const passwordInput = document.getElementById('registerPassword');
        const confirmInput = document.getElementById('registerConfirm');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';
    }
    
    showMainMenu() {
        this.showSection('mainMenuSection');
        if (this.currentUser) {
            const userNameElement = document.getElementById('currentUserName');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.username;
            }
            
            // Загружаем статистику
            if (window.TD_DB && this.currentUser.id) {
                const stats = window.TD_DB.getUserStats(this.currentUser.id);
                if (stats) {
                    const bestWaveElement = document.getElementById('userBestWave');
                    const totalKillsElement = document.getElementById('userTotalKills');
                    if (bestWaveElement) bestWaveElement.textContent = stats.bestWave || 0;
                    if (totalKillsElement) totalKillsElement.textContent = stats.totalKills || 0;
                }
            }
        } else {
            const userNameElement = document.getElementById('currentUserName');
            if (userNameElement) userNameElement.textContent = 'Гость';
            
            const bestWaveElement = document.getElementById('userBestWave');
            const totalKillsElement = document.getElementById('userTotalKills');
            if (bestWaveElement) bestWaveElement.textContent = '0';
            if (totalKillsElement) totalKillsElement.textContent = '0';
        }
    }
    
    showSandboxMaps() {
        this.showSection('sandboxMapSection');
        this.updateMapRecords();
    }
    
    showCampaignLevels() {
        this.showSection('campaignLevelsSection');
        this.updateCampaignLevels();
    }
    
    showSettings() {
        this.showSection('settingsSection');
        this.loadSettings();
    }
    
    showLeaderboards() {
        this.showSection('leaderboardSection');
        this.loadLeaderboard();
    }
    
    // ========== ПОЛЬЗОВАТЕЛИ ==========
    async login() {
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!usernameInput || !passwordInput) return;
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            alert('Введите имя пользователя и пароль');
            return;
        }
        
        if (window.AuthManager) {
            const result = await window.AuthManager.login(username, password);
            if (result.success) {
                this.currentUser = result.user;
                this.showMainMenu();
            } else {
                alert(result.message);
            }
        } else {
            alert('Система авторизации не доступна');
        }
    }
    
    async register() {
        const usernameInput = document.getElementById('registerUsername');
        const passwordInput = document.getElementById('registerPassword');
        const confirmInput = document.getElementById('registerConfirm');
        
        if (!usernameInput || !passwordInput || !confirmInput) return;
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;
        
        if (password !== confirm) {
            alert('Пароли не совпадают');
            return;
        }
        
        if (window.AuthManager) {
            const result = await window.AuthManager.register(username, password, confirm);
            if (result.success) {
                this.currentUser = result.user;
                this.showMainMenu();
            } else {
                alert(result.message);
            }
        } else {
            alert('Система авторизации не доступна');
        }
    }
    
    logout() {
        if (window.AuthManager) {
            window.AuthManager.logout();
        }
        this.currentUser = null;
        this.showLogin();
    }
    
    playAsGuest() {
        this.currentUser = {
            id: 'guest_' + Date.now(),
            username: 'Гость',
            level: 1,
            experience: 0,
            coins: 100,
            campaignProgress: 1
        };
        this.startSandbox();
    }
    
    // ========== ИГРА ==========
    selectMap(mapId) {
        this.currentMap = mapId;
        document.querySelectorAll('.map-card').forEach(card => {
            card.classList.remove('selected');
        });
        const target = event.target.closest('.map-card');
        if (target) {
            target.classList.add('selected');
        }
    }
    
    selectCampaignLevel(level) {
        const campaignProgress = this.currentUser ? this.currentUser.campaignProgress : 1;
        if (level > campaignProgress) return;
        
        this.selectedCampaignLevel = level;
        document.querySelectorAll('.campaign-level').forEach(card => {
            card.classList.remove('selected');
        });
        const target = event.target.closest('.campaign-level');
        if (target) {
            target.classList.add('selected');
        }
        
        this.updateCampaignLevelDescription(level);
        
        const startBtn = document.getElementById('startCampaignBtn');
        if (startBtn) {
            startBtn.disabled = false;
        }
    }
    
    startSandbox() {
        this.gameMode = 'sandbox';
        this.startGame();
    }
    
    startCampaign() {
        this.gameMode = 'campaign';
        this.startGame();
    }
    
    startGame() {
        // Скрываем меню
        const mainMenu = document.getElementById('mainMenu');
        const container = document.querySelector('.container');
        
        if (mainMenu) mainMenu.style.display = 'none';
        if (container) container.style.display = 'flex';
        
        // Инициализируем игру
        if (!window.game) {
            window.game = new GameEngine();
        }
        
        if (this.gameMode === 'campaign') {
            const levelData = this.campaignLevels[this.selectedCampaignLevel];
            window.game.init('campaign', levelData.map, levelData);
            
            const gameTitle = document.getElementById('gameTitle');
            if (gameTitle) gameTitle.textContent = levelData.title;
        } else {
            window.game.init('sandbox', this.currentMap);
            
            const gameTitle = document.getElementById('gameTitle');
            if (gameTitle) gameTitle.textContent = `∞ Бесконечный режим: ${this.getMapName(this.currentMap)}`;
        }
        
        // Запускаем игровой цикл
        window.game.start();
        
        // Показываем описание уровня для кампании
        if (this.gameMode === 'campaign') {
            this.showLevelDescription();
        }
    }
    
    returnToMenu() {
        if (window.game) {
            window.game.stop();
            window.game = null;
        }
        
        const container = document.querySelector('.container');
        const mainMenu = document.getElementById('mainMenu');
        
        if (container) container.style.display = 'none';
        if (mainMenu) mainMenu.style.display = 'flex';
        
        this.showMainMenu();
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========
    updateMapRecords() {
        if (this.currentUser && this.currentUser.id && window.TD_DB) {
            const stats = window.TD_DB.getUserStats(this.currentUser.id);
            if (stats && stats.mapsPlayed) {
                ['wave', 'zigzag', 'curve', 'straight'].forEach(mapId => {
                    const element = document.getElementById(`record${mapId.charAt(0).toUpperCase() + mapId.slice(1)}`);
                    if (element && stats.mapsPlayed[mapId]) {
                        element.textContent = `Ваш рекорд: ${stats.mapsPlayed[mapId].bestWave || 0} волн`;
                    }
                });
            }
        }
    }
    
    updateCampaignLevels() {
        const campaignProgress = this.currentUser ? this.currentUser.campaignProgress : 1;
        
        const progressText = document.getElementById('campaignProgressText');
        if (progressText) {
            progressText.textContent = `Уровень ${campaignProgress}/5`;
        }
        
        // Обновляем доступность уровней
        document.querySelectorAll('.campaign-level').forEach(card => {
            const level = parseInt(card.dataset.level);
            if (level <= campaignProgress) {
                card.classList.remove('locked');
                card.style.cursor = 'pointer';
            } else {
                card.classList.add('locked');
                card.style.cursor = 'not-allowed';
            }
        });
        
        // Сбрасываем выбранный уровень
        this.selectedCampaignLevel = 1;
        document.querySelectorAll('.campaign-level').forEach(card => {
            card.classList.remove('selected');
        });
        
        const firstLevel = document.querySelector('.campaign-level[data-level="1"]');
        if (firstLevel) {
            firstLevel.classList.add('selected');
            this.updateCampaignLevelDescription(1);
        }
        
        const startBtn = document.getElementById('startCampaignBtn');
        if (startBtn) {
            startBtn.disabled = false;
        }
    }
    
    updateCampaignLevelDescription(level) {
        const levelData = this.campaignLevels[level];
        if (!levelData) return;
        
        const descriptionDiv = document.getElementById('selectedLevelDescription');
        if (descriptionDiv) {
            descriptionDiv.innerHTML = `
                <h3>${levelData.title}</h3>
                <p><strong>Цель:</strong> ${levelData.objective}</p>
                <p>${levelData.description}</p>
                <p><strong>Награда:</strong> ${levelData.rewards}</p>
            `;
            descriptionDiv.style.display = 'block';
        }
    }
    
    showLevelDescription() {
        if (this.gameMode !== 'campaign') return;
        
        const levelData = this.campaignLevels[this.selectedCampaignLevel];
        if (!levelData) return;
        
        const levelDescription = document.getElementById('levelDescription');
        if (!levelDescription) return;
        
        const titleEl = levelDescription.querySelector('#levelDescriptionTitle');
        const objectiveEl = levelDescription.querySelector('#levelObjectiveText');
        const rewardEl = levelDescription.querySelector('#levelRewardText');
        const tipsList = levelDescription.querySelector('#levelTipsList');
        
        if (titleEl) titleEl.textContent = levelData.title;
        if (objectiveEl) objectiveEl.textContent = levelData.objective;
        if (rewardEl) rewardEl.textContent = levelData.rewards;
        
        if (tipsList) {
            tipsList.innerHTML = '';
            levelData.tips.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                tipsList.appendChild(li);
            });
        }
        
        levelDescription.style.display = 'flex';
        
        // Обработчик кнопки начала
        const startBtn = levelDescription.querySelector('.start-level-btn');
        if (startBtn) {
            startBtn.onclick = () => {
                levelDescription.style.display = 'none';
            };
        }
    }
    
    loadLeaderboard() {
        const mapSelect = document.getElementById('leaderboardMapSelect');
        if (!mapSelect) return;
        
        const mapId = mapSelect.value;
        const leaderboard = window.TD_DB ? window.TD_DB.getLeaderboard(mapId) : [];
        const tbody = document.getElementById('leaderboardTable');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (leaderboard.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Пока нет записей для этой карты</td></tr>';
            return;
        }
        
        leaderboard.slice(0, 10).forEach((entry, index) => {
            const row = document.createElement('tr');
            let rankClass = '';
            if (index === 0) rankClass = 'rank-1';
            else if (index === 1) rankClass = 'rank-2';
            else if (index === 2) rankClass = 'rank-3';
            
            row.innerHTML = `
                <td class="${rankClass}">${index + 1}</td>
                <td class="${rankClass}">${entry.username}</td>
                <td>${entry.wave}</td>
                <td>${entry.score}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    getMapName(mapId) {
        const names = {
            wave: 'Волновая',
            zigzag: 'Зигзаг',
            curve: 'Извилистая',
            straight: 'Прямая'
        };
        return names[mapId] || mapId;
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('td_settings') || '{}');
        
        const soundVolume = document.getElementById('soundVolume');
        const musicVolume = document.getElementById('musicVolume');
        const showRuler = document.getElementById('showRuler');
        
        if (soundVolume) soundVolume.value = settings.soundVolume || 70;
        if (musicVolume) musicVolume.value = settings.musicVolume || 50;
        if (showRuler) showRuler.checked = settings.showRuler !== false;
    }
    
    saveSettings() {
        const soundVolume = document.getElementById('soundVolume');
        const musicVolume = document.getElementById('musicVolume');
        const showRuler = document.getElementById('showRuler');
        
        const settings = {
            soundVolume: soundVolume ? parseInt(soundVolume.value) : 70,
            musicVolume: musicVolume ? parseInt(musicVolume.value) : 50,
            showRuler: showRuler ? showRuler.checked : true
        };
        
        localStorage.setItem('td_settings', JSON.stringify(settings));
        alert('Настройки сохранены!');
        this.showMainMenu();
    }
    
    // ========== GAME UI UPDATES ==========
    updateGameUI(stats) {
        const livesEl = document.getElementById('lives');
        const waveEl = document.getElementById('wave');
        const moneyEl = document.getElementById('money');
        const scoreEl = document.getElementById('score');
        const mapInfoEl = document.getElementById('mapInfo');
        
        if (livesEl) livesEl.textContent = `Жизни: ${stats.lives}`;
        if (waveEl) waveEl.textContent = `Волна: ${stats.wave}`;
        if (moneyEl) moneyEl.textContent = `Деньги: ${stats.money}`;
        if (scoreEl) scoreEl.textContent = `Счёт: ${stats.score}`;
        
        if (mapInfoEl) {
            if (this.gameMode === 'campaign') {
                mapInfoEl.textContent = `Уровень ${this.selectedCampaignLevel}`;
            } else {
                mapInfoEl.textContent = `Карта: ${this.getMapName(this.currentMap)}`;
            }
        }
    }
    
    updateMouseCoords(x, y) {
        const mouseX = document.getElementById('mouseX');
        const mouseY = document.getElementById('mouseY');
        const canvasWidth = document.getElementById('canvasWidth');
        const canvasHeight = document.getElementById('canvasHeight');
        
        if (mouseX) mouseX.textContent = x;
        if (mouseY) mouseY.textContent = y;
        
        if (canvasWidth && window.game && window.game.canvas) {
            canvasWidth.textContent = Math.round(window.game.canvas.width / window.game.dpr);
        }
        if (canvasHeight && window.game && window.game.canvas) {
            canvasHeight.textContent = Math.round(window.game.canvas.height / window.game.dpr);
        }
    }
    
    showGameOver(result) {
        const gameOver = document.getElementById('gameOver');
        if (!gameOver) return;
        
        const finalWave = document.getElementById('finalWave');
        const finalScore = document.getElementById('finalScore');
        const kills = document.getElementById('kills');
        const towersBuilt = document.getElementById('towersBuilt');
        const upgradesDone = document.getElementById('upgradesDone');
        
        if (finalWave) finalWave.textContent = result.wave;
        if (finalScore) finalScore.textContent = result.score;
        if (kills) kills.textContent = result.kills;
        if (towersBuilt) towersBuilt.textContent = result.towersBuilt;
        if (upgradesDone) upgradesDone.textContent = result.upgrades;
        
        gameOver.style.display = 'flex';
        
        // Сохраняем результат
        if (this.currentUser && this.currentUser.username !== 'Гость' && window.TD_DB) {
            window.TD_DB.updateUserStats(this.currentUser.id, result);
            
            if (this.gameMode === 'sandbox') {
                const leaderboardResult = window.TD_DB.updateLeaderboard(
                    this.currentUser.id,
                    this.currentUser.username,
                    this.currentMap,
                    result.wave,
                    result.score,
                    result.kills
                );
                
                if (leaderboardResult.isNewRecord && window.editor) {
                    window.editor.log('🎉 Новый рекорд на этой карте!');
                }
            } else if (this.gameMode === 'campaign' && result.won) {
                const nextLevel = this.selectedCampaignLevel + 1;
                if (nextLevel <= 5) {
                    window.TD_DB.updateCampaignProgress(this.currentUser.id, nextLevel);
                    if (window.editor) {
                        window.editor.log(`🏆 Уровень ${this.selectedCampaignLevel} пройден! Открыт уровень ${nextLevel}`);
                    }
                }
            }
        }
        
        // Обработчик продолжения
        const continueHandler = (e) => {
            gameOver.style.display = 'none';
            this.returnToMenu();
            document.removeEventListener('keydown', continueHandler);
            document.removeEventListener('click', continueHandler);
        };
        
        document.addEventListener('keydown', continueHandler);
        document.addEventListener('click', continueHandler);
    }
    
    showGameWin(result) {
        const gameOver = document.getElementById('gameOver');
        if (!gameOver) return;
        
        gameOver.innerHTML = `
            <div class="game-over-text" style="color: #2ef27b;">ПОБЕДА!</div>
            <div class="game-over-subtext">Уровень ${this.selectedCampaignLevel} пройден!</div>
            <div class="game-over-stats">
                <div>Достигнутая волна: <span>${result.wave}</span></div>
                <div>Счёт: <span>${result.score}</span></div>
                <div>Убито врагов: <span>${result.kills}</span></div>
            </div>
            <div class="game-over-subtext">${this.campaignLevels[this.selectedCampaignLevel]?.rewards || ''}</div>
            <div class="game-over-subtext pulse">Нажмите любую кнопку для продолжения</div>
        `;
        
        gameOver.style.display = 'flex';
        
        // Обработчик продолжения
        const continueHandler = (e) => {
            gameOver.style.display = 'none';
            this.returnToMenu();
            document.removeEventListener('keydown', continueHandler);
            document.removeEventListener('click', continueHandler);
        };
        
        document.addEventListener('keydown', continueHandler);
        document.addEventListener('click', continueHandler);
    }
}

// Глобальные функции
window.updateGameUI = function(stats) {
    if (window.ui) window.ui.updateGameUI(stats);
};

window.updateMouseCoords = function(x, y) {
    if (window.ui) window.ui.updateMouseCoords(x, y);
};

window.showGameOver = function(result) {
    if (window.ui) window.ui.showGameOver(result);
};

window.showGameWin = function(result) {
    if (window.ui) window.ui.showGameWin(result);
};

window.log = function(message) {
    if (window.editor) window.editor.log(message);
};

// Инициализация UI
document.addEventListener('DOMContentLoaded', () => {
    console.log('[UI] DOM загружен, инициализация интерфейса...');
    
    // Создаем глобальный экземпляр UI
    window.ui = new UIManager();
    
    // Инициализируем UI с небольшой задержкой
    setTimeout(() => {
        if (window.ui) {
            window.ui.init();
        }
    }, 200);
});