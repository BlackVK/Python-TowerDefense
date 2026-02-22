// Главный файл приложения
class TowerDefenseApp {
    constructor() {
        this.db = TD_DB;
        this.auth = AuthManager;
        this.ui = window.ui;
        this.editor = window.editor;
        this.game = null;
        
        this.init();
    }
    
    async init() {
        console.log('[App] Инициализация приложения...');
        
        try {
            // Инициализация базы данных
            this.db.init();
            
            // Инициализация авторизации
            this.auth.init();
            
            // Проверка поддержки браузера
            if (!this.checkBrowserSupport()) {
                this.showBrowserWarning();
                return;
            }
            
            // Настройка глобальных обработчиков
            this.setupGlobalHandlers();
            
            // Загрузка сохранённых настроек
            this.loadSettings();
            
            console.log('[App] Приложение успешно инициализировано');
            
        } catch (error) {
            console.error('[App] Ошибка инициализации:', error);
            this.showError('Ошибка инициализации приложения');
        }
    }
    
    checkBrowserSupport() {
        // Проверка поддержки необходимых функций
        const requiredFeatures = [
            'localStorage',
            'requestAnimationFrame',
            'CanvasRenderingContext2D',
            'indexedDB'
        ];
        
        for (const feature of requiredFeatures) {
            if (!this[feature] && !window[feature]) {
                console.warn(`[App] Отсутствует поддержка: ${feature}`);
                return false;
            }
        }
        
        return true;
    }
    
    showBrowserWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 9999;
            font-family: sans-serif;
        `;
        warning.innerHTML = `
            <strong>Внимание!</strong> Ваш браузер не поддерживает все необходимые функции.
            Рекомендуем использовать последние версии Chrome, Firefox или Edge.
        `;
        document.body.appendChild(warning);
    }
    
    setupGlobalHandlers() {
        // Обработка ошибок
        window.addEventListener('error', (event) => {
            console.error('[App] Глобальная ошибка:', event.error);
            this.logError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Необработанное обещание:', event.reason);
            this.logError(event.reason);
        });
        
        // Сохранение состояния при закрытии
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // Адаптивность
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            this.handleHotkeys(e);
        });
    }
    
    handleHotkeys(event) {
        // Игнорируем горячие клавиши в полях ввода
        if (event.target.tagName === 'INPUT' || 
            event.target.tagName === 'TEXTAREA' ||
            event.target.isContentEditable) {
            return;
        }
        
        switch (event.key) {
            case 'Escape':
                if (window.game && document.querySelector('.container').style.display !== 'none') {
                    this.ui.returnToMenu();
                }
                break;
                
            case 'F1':
                event.preventDefault();
                this.toggleGuide();
                break;
                
            case 'F2':
                event.preventDefault();
                if (window.editor) window.editor.clear();
                break;
                
            case 'F5':
                event.preventDefault();
                if (window.game) window.game.reset_game();
                break;
        }
    }
    
    handleResize() {
        // Обновляем размеры канваса
        if (window.game && window.game.canvas) {
            window.game.resizeCanvas();
        }
        
        // Обновляем размеры редактора
        if (window.editor && window.editor.editor) {
            setTimeout(() => window.editor.editor.refresh(), 100);
        }
    }
    
    toggleGuide() {
        const guideTab = document.querySelector('.tab[data-tab="guide"]');
        if (guideTab) {
            guideTab.click();
        }
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('td_app_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.applySettings(settings);
            } catch (e) {
                console.warn('[App] Ошибка загрузки настроек:', e);
            }
        }
    }
    
    applySettings(settings) {
        // Применяем настройки темы
        if (settings.theme === 'light') {
            document.documentElement.style.setProperty('--bg', '#f0f2f5');
            document.documentElement.style.setProperty('--panel', '#ffffff');
            document.documentElement.style.setProperty('--muted', '#666666');
        }
        
        // Применяем настройки звука
        if (typeof settings.soundVolume === 'number') {
            // Здесь будет управление звуком
        }
    }
    
    saveState() {
        // Сохраняем текущий скрипт
        if (window.editor && window.editor.editor) {
            const currentCode = window.editor.editor.getValue();
            if (currentCode.trim()) {
                localStorage.setItem('td_last_script', currentCode);
            }
        }
        
        // Сохраняем состояние игры
        if (window.game && window.game.gameStarted && !window.game.gameOver) {
            const gameState = {
                mode: window.game.gameMode,
                map: window.game.mapId,
                wave: window.game.wave,
                score: window.game.score,
                money: window.game.money,
                lives: window.game.lives,
                timestamp: Date.now()
            };
            localStorage.setItem('td_game_state', JSON.stringify(gameState));
        }
    }
    
    async restoreState() {
        // Восстанавливаем последний скрипт
        const lastScript = localStorage.getItem('td_last_script');
        if (lastScript && window.editor) {
            window.editor.editor.setValue(lastScript);
        }
        
        // Восстанавливаем состояние игры
        const savedState = localStorage.getItem('td_game_state');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const timePassed = Date.now() - state.timestamp;
                
                // Если прошло меньше часа, предлагаем восстановить
                if (timePassed < 3600000) {
                    if (confirm('Восстановить последнюю игру?')) {
                        // Здесь можно реализовать восстановление игры
                    }
                }
            } catch (e) {
                console.warn('[App] Ошибка восстановления состояния:', e);
            }
        }
    }
    
    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Сохраняем ошибку в localStorage
        const errors = JSON.parse(localStorage.getItem('td_errors') || '[]');
        errors.push(errorLog);
        if (errors.length > 20) errors.shift();
        localStorage.setItem('td_errors', JSON.stringify(errors));
        
        // Показываем пользователю, если это критическая ошибка
        if (error.message && error.message.includes('pyodide')) {
            this.showError('Ошибка Python среды. Пожалуйста, обновите страницу.');
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">⚠️</span>
                <div>
                    <strong>Ошибка</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-left: auto; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Автоматическое скрытие
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 5000);
    }
    
    // Статистика и аналитика
    trackEvent(eventName, data = {}) {
        const eventData = {
            name: eventName,
            timestamp: new Date().toISOString(),
            userId: this.auth.currentUser?.id || 'guest',
            ...data
        };
        
        // Сохраняем в localStorage
        const events = JSON.parse(localStorage.getItem('td_analytics') || '[]');
        events.push(eventData);
        if (events.length > 100) events.shift();
        localStorage.setItem('td_analytics', JSON.stringify(events));
        
        console.log(`[Analytics] ${eventName}:`, data);
    }
    
    // Экспорт данных
    exportData() {
        if (!this.auth.currentUser || this.auth.currentUser.username === 'Гость') {
            alert('Только зарегистрированные пользователи могут экспортировать данные');
            return;
        }
        
        const data = this.db.exportUserData(this.auth.currentUser.id);
        if (!data) {
            alert('Данные не найдены');
            return;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tower_defense_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Данные успешно экспортированы');
    }
    
    // Импорт данных
    importData() {
        if (!this.auth.currentUser || this.auth.currentUser.username === 'Гость') {
            alert('Только зарегистрированные пользователи могут импортировать данные');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (confirm('Импортировать данные? Существующие данные будут перезаписаны.')) {
                    this.db.importUserData(this.auth.currentUser.id, data);
                    alert('Данные успешно импортированы');
                    location.reload();
                }
            } catch (error) {
                alert('Ошибка импорта: неверный формат файла');
            }
        };
        
        input.click();
    }
    
    // Сброс прогресса
    resetProgress() {
        if (!confirm('Вы уверены? Весь прогресс будет удален.')) return;
        
        if (this.auth.currentUser && this.auth.currentUser.id) {
            // Удаляем данные пользователя из БД
            const db = this.db.getDB();
            const userIndex = db.users.findIndex(u => u.id === this.auth.currentUser.id);
            if (userIndex !== -1) {
                // Сохраняем только базовые данные пользователя
                db.users[userIndex] = {
                    ...db.users[userIndex],
                    level: 1,
                    experience: 0,
                    coins: 100,
                    campaignProgress: 1
                };
                
                // Сбрасываем статистику
                db.userStats[this.auth.currentUser.id] = {
                    totalKills: 0,
                    totalWaves: 0,
                    totalTowersBuilt: 0,
                    totalUpgrades: 0,
                    totalPlayTime: 0,
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    bestWave: 0,
                    bestScore: 0,
                    mapsPlayed: {}
                };
                
                // Сбрасываем скрипты
                db.scripts[this.auth.currentUser.id] = [];
                
                // Сбрасываем достижения
                db.achievements[this.auth.currentUser.id] = [];
                
                this.db.saveDB(db);
                alert('Прогресс сброшен');
                location.reload();
            }
        }
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем стили для анимаций ошибок
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Инициализируем приложение
    window.app = new TowerDefenseApp();
    
    // Глобальные функции для отладки
    window.debug = {
        showDB: () => console.log(TD_DB.getDB()),
        clearDB: () => {
            localStorage.clear();
            location.reload();
        },
        addCoins: (amount = 1000) => {
            if (window.ui && window.ui.currentUser && window.ui.currentUser.id) {
                const db = TD_DB.getDB();
                const user = db.users.find(u => u.id === window.ui.currentUser.id);
                if (user) {
                    user.coins += amount;
                    TD_DB.saveDB(db);
                    alert(`Добавлено ${amount} монет`);
                    window.ui.showMainMenu();
                }
            }
        },
        unlockAll: () => {
            if (window.ui && window.ui.currentUser && window.ui.currentUser.id) {
                const db = TD_DB.getDB();
                const user = db.users.find(u => u.id === window.ui.currentUser.id);
                if (user) {
                    user.campaignProgress = 5;
                    TD_DB.saveDB(db);
                    alert('Все уровни разблокированы');
                    window.ui.showMainMenu();
                }
            }
        }
    };
    
    console.log('[App] Приложение запущено. Используйте window.debug для отладки.');
});