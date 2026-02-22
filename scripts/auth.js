// Управление авторизацией
const AuthManager = {
    currentUser: null,
    
    init() {
        // Проверяем сохранённого пользователя
        const savedUser = sessionStorage.getItem('td_current_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('[Auth] Пользователь восстановлен:', this.currentUser.username);
            } catch (e) {
                console.error('[Auth] Ошибка восстановления пользователя:', e);
                sessionStorage.removeItem('td_current_user');
            }
        }
    },
    
    async login(username, password) {
        try {
            const result = TD_DB.login(username, password);
            
            if (result.success) {
                this.currentUser = result.user;
                sessionStorage.setItem('td_current_user', JSON.stringify(this.currentUser));
                
                // Обновляем статистику входа
                TD_DB.updateUserStats(this.currentUser.id, {
                    loginCount: 1
                });
                
                console.log('[Auth] Успешный вход:', this.currentUser.username);
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('[Auth] Ошибка входа:', error);
            return { success: false, message: 'Ошибка сервера' };
        }
    },
    
    async register(username, password, confirmPassword) {
        if (password !== confirmPassword) {
            return { success: false, message: 'Пароли не совпадают' };
        }
        
        try {
            const result = TD_DB.register(username, password);
            
            if (result.success) {
                this.currentUser = result.user;
                sessionStorage.setItem('td_current_user', JSON.stringify(this.currentUser));
                
                // Первое достижение
                TD_DB.grantAchievement(this.currentUser.id, 'python_novice');
                
                console.log('[Auth] Регистрация успешна:', this.currentUser.username);
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('[Auth] Ошибка регистрации:', error);
            return { success: false, message: 'Ошибка сервера' };
        }
    },
    
    logout() {
        console.log('[Auth] Выход пользователя:', this.currentUser?.username);
        this.currentUser = null;
        sessionStorage.removeItem('td_current_user');
    },
    
    isLoggedIn() {
        return this.currentUser !== null;
    },
    
    getUser() {
        return this.currentUser;
    },
    
    updateUser(updates) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...updates };
            sessionStorage.setItem('td_current_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    },
    
    // Проверка токена (для будущей реализации с сервером)
    async validateToken() {
        if (!this.currentUser) return false;
        
        // Здесь можно добавить проверку с сервером
        return true;
    },
    
    // Сброс пароля (заглушка)
    async resetPassword(email) {
        console.log('[Auth] Запрос сброса пароля для:', email);
        // В реальном приложении здесь будет отправка email
        return { success: true, message: 'Инструкции отправлены на email' };
    },
    
    // Смена пароля
    async changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: 'Пользователь не авторизован' };
        }
        
        // Проверяем старый пароль
        const db = TD_DB.getDB();
        const user = db.users.find(u => u.id === this.currentUser.id);
        
        if (!user || user.password !== TD_DB.hashPassword(this.currentUser.username, oldPassword)) {
            return { success: false, message: 'Неверный старый пароль' };
        }
        
        // Обновляем пароль
        user.password = TD_DB.hashPassword(this.currentUser.username, newPassword);
        TD_DB.saveDB(db);
        
        return { success: true, message: 'Пароль успешно изменён' };
    },
    
    // Удаление аккаунта
    async deleteAccount(password) {
        if (!this.currentUser) {
            return { success: false, message: 'Пользователь не авторизован' };
        }
        
        // Проверяем пароль
        const db = TD_DB.getDB();
        const user = db.users.find(u => u.id === this.currentUser.id);
        
        if (!user || user.password !== TD_DB.hashPassword(this.currentUser.username, password)) {
            return { success: false, message: 'Неверный пароль' };
        }
        
        // Удаляем пользователя
        const userIndex = db.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            db.users.splice(userIndex, 1);
            
            // Удаляем связанные данные
            delete db.userStats[this.currentUser.id];
            delete db.scripts[this.currentUser.id];
            delete db.achievements[this.currentUser.id];
            
            TD_DB.saveDB(db);
            this.logout();
            
            return { success: true, message: 'Аккаунт удалён' };
        }
        
        return { success: false, message: 'Ошибка удаления аккаунта' };
    }
};