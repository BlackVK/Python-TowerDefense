// Редактор кода и управление Python
class CodeEditor {
    constructor() {
        this.editor = null;
        this.pyodide = null;
        this.pyodideReady = false;
        this.currentScript = null;
        this.savedScripts = [];
    }
    
    async init() {
        console.log('[Editor] Инициализация редактора...');
        this.setupEditor();
        await this.loadPyodide();
        this.setupEventListeners();
        this.loadGuideContent();
        console.log('[Editor] Редактор инициализирован');
    }
    
    setupEditor() {
        const editorContainer = document.getElementById('editor');
        
        // Очищаем контейнер
        editorContainer.innerHTML = '';
        
        this.editor = CodeMirror(editorContainer, {
            mode: 'python',
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: false,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            electricChars: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            showCursorWhenSelecting: true,
            cursorBlinkRate: 530,
            value: '# Напишите код для управления башнями\n\n# Пример:\nbuild_tower("башня1", 100, 200)\nbuild_tower("башня2", 300, 150)\n\n# Запустите волну врагов\n# spawn_wave()',
            gutters: ["CodeMirror-linenumbers"],
            extraKeys: {
                "Ctrl-Enter": () => this.runCode(),
                "Cmd-Enter": () => this.runCode(),
                "Tab": (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection("add");
                    } else {
                        cm.replaceSelection("    ", "end");
                    }
                },
                "Shift-Tab": (cm) => cm.indentSelection("subtract")
            }
        });
        
        this.editor.setSize("100%", "100%");
        setTimeout(() => {
            if (this.editor) {
                this.editor.focus();
                this.editor.refresh();
            }
        }, 100);
    }
    
    async loadPyodide() {
        try {
            console.log('[Editor] Загрузка Pyodide...');
            this.pyodide = await loadPyodide();
            this.pyodideReady = true;
            console.log('[Editor] Pyodide загружен успешно');
            
            // Определяем глобальные функции для Python
            this.setupPythonGlobals();
            
            this.log("✅ Python готов к использованию!");
        } catch (error) {
            console.error('[Editor] Ошибка загрузки Pyodide:', error);
            this.log("❌ Ошибка загрузки Python: " + error.message);
        }
    }
    
    setupPythonGlobals() {
        if (!this.pyodide) return;
        
        // Регистрируем функции игры
        this.pyodide.globals.set("build_tower", (name, x, y) => {
            if (!window.game) return false;
            return window.game.build_tower(name, x, y);
        });
        
        this.pyodide.globals.set("upgrade_tower", (name) => {
            if (!window.game) return false;
            return window.game.upgrade_tower(name);
        });
        
        this.pyodide.globals.set("spawn_wave", () => {
            if (!window.game) return false;
            return window.game.spawn_wave();
        });
        
        this.pyodide.globals.set("reset_game", () => {
            if (!window.game) return false;
            return window.game.reset_game();
        });
        
        this.pyodide.globals.set("get_towers", () => {
            if (!window.game) return [];
            return window.game.get_towers();
        });
        
        this.pyodide.globals.set("print", (...args) => {
            const message = args.map(arg => String(arg)).join(' ');
            this.log("📝 " + message);
        });
        
        // Математические функции
        this.pyodide.globals.set("math", Math);
        
        console.log('[Editor] Глобальные функции Python установлены');
    }
    
    async runCode() {
        if (!this.pyodideReady) {
            this.log("⏳ Python ещё не готов...");
            return;
        }
        
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.log("ℹ️ Введите код для выполнения");
            return;
        }
        
        this.log("🚀 Выполнение кода...");
        
        try {
            const startTime = performance.now();
            await this.pyodide.runPythonAsync(code);
            const endTime = performance.now();
            const executionTime = (endTime - startTime).toFixed(2);
            
            this.log(`✅ Код выполнен успешно за ${executionTime}мс`);
            
        } catch (error) {
            console.error('[Editor] Ошибка выполнения:', error);
            this.log(`❌ Ошибка Python: ${error.message}`);
        }
    }
    
    saveScript() {
        if (!window.authManager || !window.authManager.currentUser) {
            this.log("❌ Войдите в систему для сохранения скриптов");
            return;
        }
        
        const code = this.editor.getValue();
        const name = prompt("Введите название скрипта:", "Мой скрипт");
        
        if (!name) return;
        
        const description = prompt("Введите описание (необязательно):", "");
        
        try {
            // Используем TD_DB из глобальной области видимости
            if (window.TD_DB) {
                const script = window.TD_DB.saveScript(window.authManager.currentUser.id, {
                    name: name,
                    code: code,
                    description: description
                });
                
                this.currentScript = script;
                this.log(`💾 Скрипт "${name}" сохранен`);
            } else {
                this.log("❌ База данных не доступна");
            }
            
        } catch (error) {
            this.log(`❌ Ошибка сохранения: ${error.message}`);
        }
    }
    
    loadGuideContent() {
        const guideContent = document.getElementById('guideContent');
        if (!guideContent) {
            console.warn('[Editor] Элемент guideContent не найден');
            return;
        }
        
        guideContent.innerHTML = `
            <h3>Управление игрой через Python</h3>
            
            <h4>Основные функции:</h4>
            <ul>
                <li><code>build_tower(имя, x, y)</code> - построить башню с именем</li>
                <li><code>upgrade_tower(имя)</code> - улучшить башню по имени</li>
                <li><code>spawn_wave()</code> - запустить волну врагов</li>
                <li><code>reset_game()</code> - сбросить игру</li>
                <li><code>get_towers()</code> - получить список башен</li>
            </ul>
            
            <h4>Пример простой защиты:</h4>
            <pre>
# Создаём башни на ключевых позициях
build_tower("левая", 150, 200)
build_tower("правая", 650, 200)
build_tower("центр", 400, 350)

# Улучшаем башни
upgrade_tower("левая")
upgrade_tower("правая")

# Запускаем волну
spawn_wave()
            </pre>
            
            <h4>Циклы и условия:</h4>
            <pre>
# Строим несколько башен в цикле
for i in range(3):
    build_tower(f"башня_{i}", 200 + i * 150, 250)
    upgrade_tower(f"башня_{i}")

# Улучшаем все башни
towers = get_towers()
for tower in towers:
    upgrade_tower(tower['name'])
            </pre>
            
            <h4>Математические функции:</h4>
            <pre>
import math

# Круговая формация
center_x, center_y = 400, 300
radius = 150
for i in range(8):
    angle = 2 * math.pi * i / 8
    x = center_x + radius * math.cos(angle)
    y = center_y + radius * math.sin(angle)
    build_tower(f"circle_{i}", x, y)
            </pre>
            
            <h4>Проверка условий:</h4>
            <pre>
# Проверяем деньги перед строительством
if get_game_info()['money'] >= 50:
    build_tower("новая_башня", 500, 300)
else:
    print("Недостаточно денег!")
            </pre>
        `;
        
        console.log('[Editor] Гайд загружен');
    }
    
    setupEventListeners() {
        // Кнопка выполнения
        const runBtn = document.getElementById('runBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runCode());
        }
        
        // Кнопка сохранения
        const saveBtn = document.getElementById('saveScriptBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveScript());
        }
        
        // Кнопка очистки консоли
        const clearBtn = document.getElementById('clearConsoleBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const consoleEl = document.getElementById('console');
                if (consoleEl) {
                    consoleEl.innerHTML = '';
                    this.log("🗑️ Консоль очищена");
                }
            });
        }
        
        // Переключение вкладок
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    }
    
    switchTab(tabName) {
        console.log('[Editor] Переключение на вкладку:', tabName);
        
        // Обновляем активные вкладки
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Показываем соответствующий контент
        const editorEl = document.getElementById('editor');
        const guidePanel = document.getElementById('guidePanel');
        
        if (tabName === 'editor') {
            if (editorEl) editorEl.style.display = 'block';
            if (guidePanel) guidePanel.style.display = 'none';
            
            setTimeout(() => {
                if (this.editor) {
                    this.editor.refresh();
                    this.editor.focus();
                }
            }, 50);
        } else if (tabName === 'guide') {
            if (editorEl) editorEl.style.display = 'none';
            if (guidePanel) guidePanel.style.display = 'block';
        }
    }
    
    log(message) {
        const timestamp = new Date().toLocaleTimeString('ru');
        const consoleElement = document.getElementById('console');
        if (!consoleElement) {
            console.log('[Editor] Консоль не найдена:', message);
            return;
        }
        
        consoleElement.innerHTML = `<span style="color:#6ee7b7">[${timestamp}]</span> ${message}<br>` + consoleElement.innerHTML;
        
        // Ограничиваем количество сообщений
        const lines = consoleElement.innerHTML.split('<br>');
        if (lines.length > 50) {
            consoleElement.innerHTML = lines.slice(0, 50).join('<br>');
        }
        
        // Скроллим вверх
        consoleElement.scrollTop = 0;
    }
    
    clear() {
        if (this.editor) {
            this.editor.setValue('');
            this.currentScript = null;
            this.log("📝 Редактор очищен");
        }
    }
}

// Инициализация редактора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Editor] DOM загружен, инициализация редактора...');
    
    // Создаем глобальный экземпляр редактора
    window.editor = new CodeEditor();
    
    // Инициализируем редактор с небольшой задержкой
    setTimeout(() => {
        if (window.editor) {
            window.editor.init();
        }
    }, 500);
});ы