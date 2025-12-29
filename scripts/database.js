const TD_DB = {
    key: 'tower_defense_db_final',
    
    init() {
        if (!localStorage.getItem(this.key)) {
            const initialData = {
                users: [],
                leaderboards: {
                    map_wave: [],
                    map_zigzag: [],
                    map_curve: [],
                    map_straight: []
                }
            };
            localStorage.setItem(this.key, JSON.stringify(initialData));
            console.log('[Система] База данных создана');
        }
        return this.getDB();
    },
    
    getDB() {
        return JSON.parse(localStorage.getItem(this.key));
    },
    
    saveDB(db) {
        localStorage.setItem(this.key, JSON.stringify(db));
    },
    
    register(username, password) {
        const db = this.getDB();
        
        if (username.length < 3) {
            return { success: false, message: 'Имя должно быть не менее 3 символов' };
        }
        if (password.length < 4) {
            return { success: false, message: 'Пароль должен быть не менее 4 символов' };
        }
        
        if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: 'Имя пользователя уже занято' };
        }
        
        const newUser = {
            id: Date.now().toString(),
            username: username,
            password: btoa(username + ':' + password),
            registered: new Date().toISOString(),
            campaignProgress: 1,
            mapRecords: {
                wave: 0,
                zigzag: 0,
                curve: 0,
                straight: 0
            },
            stats: {
                totalKills: 0,
                totalWaves: 0,
                totalPlayTime: 0,
                gamesPlayed: 0
            }
        };
        
        db.users.push(newUser);
        this.saveDB(db);
        
        return { 
            success: true, 
            message: 'Регистрация успешна!',
            user: { 
                username: newUser.username, 
                id: newUser.id,
                mapRecords: newUser.mapRecords 
            }
        };
    },
    
    login(username, password) {
        const db = this.getDB();
        const user = db.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === btoa(username + ':' + password)
        );
        
        if (user) {
            return { 
                success: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    campaignProgress: user.campaignProgress,
                    mapRecords: user.mapRecords,
                    stats: user.stats
                }
            };
        }
        
        return { success: false, message: 'Неверный логин или пароль' };
    },
    
    updateCampaignProgress(username, level) {
        const db = this.getDB();
        const user = db.users.find(u => u.username === username);
        if (!user) return false;
        
        if (level > user.campaignProgress) {
            user.campaignProgress = level;
            this.saveDB(db);
            return true;
        }
        return false;
    },
    
    updateRecord(username, mapId, waveReached, score, kills) {
        const db = this.getDB();
        const user = db.users.find(u => u.username === username);
        if (!user) return false;
        
        let isNewRecord = false;
        
        // Обновляем личный рекорд
        if (waveReached > user.mapRecords[mapId]) {
            user.mapRecords[mapId] = waveReached;
            isNewRecord = true;
        }
        
        // Обновляем статистику
        user.stats.totalKills += kills;
        user.stats.totalWaves += waveReached;
        user.stats.gamesPlayed++;
        
        // Обновляем глобальный лидерборд
        const leaderboardKey = `map_${mapId}`;
        const leaderboard = db.leaderboards[leaderboardKey];
        const existingEntryIndex = leaderboard.findIndex(entry => entry.username === username);
        
        const newEntry = {
            username: username,
            wave: waveReached,
            score: score,
            kills: kills,
            date: new Date().toISOString()
        };
        
        if (existingEntryIndex !== -1) {
            if (waveReached > leaderboard[existingEntryIndex].wave) {
                leaderboard[existingEntryIndex] = newEntry;
            }
        } else {
            leaderboard.push(newEntry);
        }
        
        // Сортируем и ограничиваем топ-20
        leaderboard.sort((a, b) => {
            if (b.wave !== a.wave) return b.wave - a.wave;
            return b.score - a.score;
        });
        
        if (leaderboard.length > 20) {
            db.leaderboards[leaderboardKey] = leaderboard.slice(0, 20);
        }
        
        this.saveDB(db);
        return isNewRecord;
    },
    
    getLeaderboard(mapId) {
        const db = this.getDB();
        return db.leaderboards[`map_${mapId}`] || [];
    },
    
    getUserRecords(username) {
        const db = this.getDB();
        const user = db.users.find(u => u.username === username);
        return user ? user.mapRecords : null;
    }
};