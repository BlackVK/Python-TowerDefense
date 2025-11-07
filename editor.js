let editor = CodeMirror(document.getElementById('editor'), {
  mode:'python',
  theme:'dracula',
  lineNumbers:true,
  value:`# Введите ваш код здесь...\n# Пример: build_tower("alpha", 400, 300)`
});

let pyodideReady=false, pyodide;
async function loadPyodideAndPackages(){ 
  pyodide = await loadPyodide(); 
  pyodideReady=true; 
  log("✅ Python готов к использованию!"); 
}
loadPyodideAndPackages();

async function runCode(){
  if(!pyodideReady){ 
    log("⏳ Python ещё не готов..."); 
    return; 
  }
  const code = editor.getValue();
  try{
    pyodide.globals.set("build_tower", build_tower);
    pyodide.globals.set("upgrade_tower", upgrade_tower);
    pyodide.globals.set("spawn_wave", spawn_wave);
    pyodide.globals.set("reset_game", reset_game);
    pyodide.globals.set("get_towers", get_towers);
    await pyodide.runPythonAsync(code);
  }catch(e){ 
    log(`❌ Ошибка: ${e.message}`);
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  const editorEl = document.getElementById('editor');
  const guidePanel = document.getElementById('guidePanel');
  
  if (tabName === 'editor') {
    editorEl.style.display = 'block';
    guidePanel.classList.remove('active');
  } else {
    editorEl.style.display = 'none';
    guidePanel.classList.add('active');
  }
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab);
  });
});

document.getElementById('runBtn').onclick = runCode;
document.addEventListener('keydown', e=>{ 
  if(e.ctrlKey && e.key==='Enter') runCode(); 
});
document.getElementById('clearConsoleBtn').onclick = ()=>{document.getElementById('console').innerHTML='';};
document.getElementById('resetBtn').onclick = reset_game;

document.getElementById('guidePanel').innerHTML = `
  <h3 style="color:var(--blue); margin-bottom:12px;">Управление игрой через Python</h3>
  
  <h4>Основные функции:</h4>
  <ul>
    <li><code>build_tower(имя, x, y)</code> - построить именованную башню</li>
    <li><code>upgrade_tower(имя)</code> - улучшить башню по имени</li>
    <li><code>spawn_wave()</code> - запустить волну врагов</li>
    <li><code>reset_game()</code> - сбросить игру</li>
    <li><code>get_towers()</code> - получить список всех башен</li>
  </ul>

  <h3>Работа с именами башен</h3>
  
  <h4>Создание именованных башен:</h4>
  <pre># Создать башни с именами
build_tower("alpha", 100, 200)
build_tower("beta", 700, 200)  
build_tower("gamma", 400, 400)</pre>

  <h4>Улучшение по именам:</h4>
  <pre># Улучшать башни по именам
upgrade_tower("alpha")
upgrade_tower("alpha")  # Второе улучшение
upgrade_tower("beta")</pre>

  <h4>Автоматическое улучшение:</h4>
  <pre># Улучшить все башни до максимального уровня
tower_names = ["alpha", "beta", "gamma", "delta"]

for name in tower_names:
    for i in range(5):  # Максимум 5 улучшений
        if not upgrade_tower(name):
            break</pre>

  <h3>Стратегии размещения</h3>
  
  <h4>Защитная формация:</h4>
  <pre># Создать защитную формацию с именами
def create_defense():
    build_tower("frontline_1", 200, 250)
    build_tower("frontline_2", 600, 250)
    build_tower("backup_1", 300, 350)
    build_tower("backup_2", 500, 350)
    upgrade_tower("frontline_1")
    upgrade_tower("frontline_2")

create_defense()</pre>

  <h4>Круговая защита:</h4>
  <pre># Разместить башни по кругу
import math

def build_circle_towers(center_x, center_y, radius, count):
    names = ["north", "east", "south", "west", "ne", "se", "sw", "nw"]
    for i in range(count):
        angle = 2 * math.pi * i / count
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        name = names[i] if i < len(names) else f"tower_{i}"
        build_tower(name, x, y)

build_circle_towers(400, 300, 150, 8)</pre>

  <h3>Получение информации о башнях</h3>
  
  <pre># Получить список всех башен и их параметров
towers = get_towers()
for tower in towers:
    print(f"Башня '{tower['name']}': уровень {tower['level']}, позиция ({tower['x']}, {tower['y']})")</pre>

  <h3>Примеры с циклами</h3>
  
  <h4>Массовое улучшение по именам:</h4>
  <pre># Улучшить все именованные башни
def upgrade_all_towers():
    towers = get_towers()
    for tower in towers:
        upgrade_tower(tower['name'])

upgrade_all_towers()</pre>

  <h4>Стратегия приоритетного улучшения:</h4>
  <pre># Улучшать только определенные башни
priority_towers = ["frontline_1", "frontline_2", "alpha", "beta"]

for tower_name in priority_towers:
    for i in range(3):  # 3 улучшения для приоритетных башен
        upgrade_tower(tower_name)</pre>

  <h3>Работа с исключениями</h3>
  
  <pre># Безопасное строительство с обработкой ошибок
def safe_build_tower(name, x, y):
    try:
        result = build_tower(name, x, y)
        if result:
            print(f"Башня '{name}' построена в ({x}, {y})")
        else:
            print(f"Не удалось построить башню '{name}'")
    except Exception as e:
        print(f"Ошибка при строительстве: {e}")

safe_build_tower("test_tower", 300, 200)</pre>

  <h4>Стоимость:</h4>
  <ul>
    <li>Постройка башни: <strong>50</strong> денег</li>
    <li>Улучшение башни: <strong>30</strong> денег</li>
    <li>Убийство врага: <strong>+10</strong> денег</li>
  </ul>

  <h4>Советы:</h4>
  <ul>
    <li>Давайте башням осмысленные имена для удобства управления</li>
    <li>Используйте имена для приоритетного улучшения ключевых башен</li>
    <li>Следите за количеством денег и жизней</li>
    <li>Используйте линейку для точного позиционирования</li>
  </ul>
`;