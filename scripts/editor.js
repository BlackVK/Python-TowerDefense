let editor = null;
let pyodideReady = false, pyodide;

function initEditor() {
    const editorContainer = document.getElementById('editor');
    editorContainer.innerHTML = '';
    
    // Создаем пустой редактор БЕЗ подсказки
    editor = CodeMirror(editorContainer, {
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
        value: '', // ПУСТОЙ редактор без подсказок
        gutters: ["CodeMirror-linenumbers"],
        extraKeys: {
            "Ctrl-Enter": function() { runCode(); },
            "Cmd-Enter": function() { runCode(); },
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection("    ", "end");
                }
            },
            "Shift-Tab": function(cm) {
                cm.indentSelection("subtract");
            }
        }
    });
    
    // Настраиваем размер редактора
    editor.setSize("100%", "100%");
    
    // Фокус на редактор
    setTimeout(() => {
        editor.focus();
        editor.refresh();
    }, 100);
}

async function loadPyodideAndPackages(){ 
    try {
        pyodide = await loadPyodide(); 
        pyodideReady = true; 
        log("✅ Python готов к использованию!"); 
    } catch (error) {
        log("❌ Ошибка загрузки Python: " + error.message);
    }
}

async function runCode(){
    if(!pyodideReady){ 
        log("⏳ Python ещё не готов..."); 
        return; 
    }
    
    const code = editor.getValue();
    if (!code.trim()) {
        log("ℹ️ Введите код для выполнения");
        return;
    }
    
    try {
        // Устанавливаем глобальные функции
        pyodide.globals.set("build_tower", build_tower);
        pyodide.globals.set("upgrade_tower", upgrade_tower);
        pyodide.globals.set("spawn_wave", spawn_wave);
        pyodide.globals.set("reset_game", reset_game);
        pyodide.globals.set("get_towers", get_towers);
        
        // Выполняем код
        await pyodide.runPythonAsync(code);
        log("✅ Код выполнен успешно!");
    } catch(e) { 
        log(`❌ Ошибка: ${e.message}`);
    }
}

// Tab switching functionality
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    const editorEl = $('editor');
    const guidePanel = $('guidePanel');
    
    if (tabName === 'editor') {
        editorEl.style.display = 'block';
        guidePanel.classList.remove('active');
        // Фокус на редактор при переключении
        if (editor) {
            setTimeout(() => {
                editor.focus();
                editor.refresh();
            }, 50);
        }
    } else {
        editorEl.style.display = 'none';
        guidePanel.classList.add('active');
    }
}

// Инициализация обработчиков событий для редактора
function initEditorHandlers() {
    // Инициализируем обработчики вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // Настройка кнопок
    if ($('runBtn')) {
        $('runBtn').onclick = runCode;
    }
    
    if ($('clearConsoleBtn')) {
        $('clearConsoleBtn').onclick = () => {
            $('console').innerHTML = '';
            log("🗑️ Консоль очищена");
        };
    }
    
    if ($('resetBtn')) {
        $('resetBtn').onclick = reset_game;
    }
    
    if ($('menuBtn')) {
        $('menuBtn').onclick = returnToMenu;
    }
    
    // Глобальные горячие клавиши
    document.addEventListener('keydown', e=>{ 
        if(e.ctrlKey && e.key==='Enter') {
            e.preventDefault();
            runCode(); 
        }
    });
}