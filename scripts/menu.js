let currentUser = null;
let currentMap = 'wave';
let gameMode = 'sandbox'; // 'campaign' или 'sandbox'
let currentCampaignLevel = 1;
let selectedCampaignLevel = 1;

// Описания уровней кампании
const campaignLevels = {
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

// ============================================
// ФУНКЦИИ УПРАВЛЕНИЯ МЕНЮ
// ============================================
function showSection(sectionId) {
    document.querySelectorAll('.menu-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

function showLogin() {
    showSection('loginSection');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function showRegister() {
    showSection('registerSection');
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirm').value = '';
}

function showMainMenu() {
    showSection('mainMenuSection');
    if (currentUser) {
        document.getElementById('currentUserName').textContent = currentUser.username;
        document.getElementById('userBestWave').textContent = Math.max(
            currentUser.mapRecords?.wave || 0,
            currentUser.mapRecords?.zigzag || 0,
            currentUser.mapRecords?.curve || 0,
            currentUser.mapRecords?.straight || 0
        );
        document.getElementById('userTotalKills').textContent = currentUser.stats?.totalKills || 0;
    }
}

function showSandboxMaps() {
    showSection('sandboxMapSection');
    updateMapRecordsDisplay();
}

function showCampaignLevels() {
    showSection('campaignLevelsSection');
    updateCampaignLevelsDisplay();
}

function showLeaderboards() {
    showSection('leaderboardSection');
    loadLeaderboard();
}

function updateMapRecordsDisplay() {
    if (currentUser && currentUser.mapRecords) {
        document.getElementById('recordWave').textContent = `Ваш рекорд: ${currentUser.mapRecords.wave} волн`;
        document.getElementById('recordZigzag').textContent = `Ваш рекорд: ${currentUser.mapRecords.zigzag} волн`;
        document.getElementById('recordCurve').textContent = `Ваш рекорд: ${currentUser.mapRecords.curve} волн`;
        document.getElementById('recordStraight').textContent = `Ваш рекорд: ${currentUser.mapRecords.straight} волн`;
    }
}

function updateCampaignLevelsDisplay() {
    const campaignProgress = currentUser ? currentUser.campaignProgress : 1;
    document.getElementById('campaignProgressText').textContent = `Уровень ${campaignProgress}/5`;
    
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
    selectedCampaignLevel = 1;
    document.querySelectorAll('.campaign-level').forEach(card => card.classList.remove('selected'));
    document.querySelector('.campaign-level[data-level="1"]').classList.add('selected');
    updateCampaignLevelDescription(1);
    document.getElementById('startCampaignBtn').disabled = false;
}

function selectMap(mapId) {
    currentMap = mapId;
    document.querySelectorAll('.map-card').forEach(card => card.classList.remove('selected'));
    event.target.closest('.map-card').classList.add('selected');
}

function selectCampaignLevel(level) {
    const campaignProgress = currentUser ? currentUser.campaignProgress : 1;
    if (level > campaignProgress) return;
    
    selectedCampaignLevel = level;
    document.querySelectorAll('.campaign-level').forEach(card => card.classList.remove('selected'));
    event.target.closest('.campaign-level').classList.add('selected');
    updateCampaignLevelDescription(level);
    document.getElementById('startCampaignBtn').disabled = false;
}

function updateCampaignLevelDescription(level) {
    const levelData = campaignLevels[level];
    if (!levelData) return;
    
    const descriptionDiv = document.getElementById('selectedLevelDescription');
    descriptionDiv.innerHTML = `
        <h3>${levelData.title}</h3>
        <p><strong>Цель:</strong> ${levelData.objective}</p>
        <p>${levelData.description}</p>
        <p><strong>Награда:</strong> ${levelData.rewards}</p>
    `;
    descriptionDiv.style.display = 'block';
}

function loadLeaderboard() {
    const mapId = document.getElementById('leaderboardMapSelect').value;
    const leaderboard = TD_DB.getLeaderboard(mapId);
    const tbody = document.getElementById('leaderboardTable');
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

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Введите имя пользователя и пароль');
        return;
    }
    
    const result = TD_DB.login(username, password);
    if (result.success) {
        currentUser = result.user;
        sessionStorage.setItem('td_current_user', JSON.stringify(currentUser));
        showMainMenu();
    } else {
        alert(result.message);
    }
}

function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    if (password !== confirm) {
        alert('Пароли не совпадают');
        return;
    }
    
    const result = TD_DB.register(username, password);
    if (result.success) {
        currentUser = result.user;
        sessionStorage.setItem('td_current_user', JSON.stringify(currentUser));
        showMainMenu();
    } else {
        alert(result.message);
    }
}

function playAsGuest() {
    currentUser = {
        username: 'Гость',
        mapRecords: { wave: 0, zigzag: 0, curve: 0, straight: 0 },
        stats: { totalKills: 0, totalWaves: 0 },
        campaignProgress: 1
    };
    startSandbox();
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('td_current_user');
    showLogin();
}

function returnToMenu() {
    document.querySelector('.container').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    showMainMenu();
}

function startCampaign() {
    if (selectedCampaignLevel < 1) return;
    
    gameMode = 'campaign';
    currentCampaignLevel = selectedCampaignLevel;
    const levelData = campaignLevels[currentCampaignLevel];
    currentMap = levelData.map;
    
    startGame();
}

function startSandbox() {
    gameMode = 'sandbox';
    startGame();
}

function getMapName(mapId) {
    const names = {
        wave: 'Волновая',
        zigzag: 'Зигзаг',
        curve: 'Извилистая',
        straight: 'Прямая'
    };
    return names[mapId] || mapId;
}

function showLevelDescription() {
    if (gameMode !== 'campaign') return;
    
    const levelData = campaignLevels[currentCampaignLevel];
    if (!levelData) return;
    
    document.getElementById('levelDescriptionTitle').textContent = levelData.title;
    document.getElementById('levelObjectiveText').textContent = levelData.objective;
    document.getElementById('levelRewardText').textContent = levelData.rewards;
    
    const tipsList = document.getElementById('levelTipsList');
    tipsList.innerHTML = '';
    levelData.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
    });
    
    document.getElementById('levelDescription').style.display = 'flex';
}

function hideLevelDescription() {
    document.getElementById('levelDescription').style.display = 'none';
}