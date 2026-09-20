const START_DATE = '2026-09-20';

const mealNames = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
};

const mealIcons = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍲'
};

let state = {
  meals: {},
  weight: '',
  exerciseType: '',
  exerciseMinutes: 0,
  steps: 0,
  water: 0,
  sleep: 0,
  mood: ''
};

function dayCount() {
  const s = new Date(START_DATE + 'T00:00:00');
  const n = new Date();
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.max(1, Math.min(90, Math.floor((today - s) / 86400000) + 1));
}

function group(field, label, options) {
  return `
    <div class="field">
      <span>${label}</span>
      <div class="choice-group" data-field="${field}">
        ${options.map((o, i) =>
          `<button type="button" class="choice ${i === 0 ? 'selected' : ''}" data-value="${o[1]}">${o[0]}</button>`
        ).join('')}
      </div>
    </div>
  `;
}

function renderMeals() {
  document.getElementById('mealCards').innerHTML = Object.entries(mealNames).map(([k, n]) => `
    <article class="card meal" data-meal="${k}">
      <div class="meal-head">
        <div>
          <p class="label">${mealIcons[k]} ${n}</p>
          <h2>這餐吃了什麼？</h2>
        </div>
        <span class="pill" id="${k}Score">10 / 10</span>
      </div>

      ${group('carb', '🍚 主食份量', [
        ['無 / 幾乎沒有', 0],
        ['少量', 0],
        ['半碗', 1],
        ['1 碗', 2],
        ['超過 1 碗', 3]
      ])}

      ${group('drink', '🥤 含糖飲料', [
        ['沒有', 0],
        ['有', 3]
      ])}

      ${group('dessert', '🍰 甜食', [
        ['沒有', 0],
        ['有', 2]
      ])}

      ${group('fried', '🍟 炸物', [
        ['沒有', 0],
        ['少量', 1],
        ['一份以上', 3]
      ])}
    </article>
  `).join('');

  document.querySelectorAll('.meal').forEach(card => {
    const meal = card.dataset.meal;
    state.meals[meal] = state.meals[meal] || { carb: 0, drink: 0, dessert: 0, fried: 0 };

    card.querySelectorAll('.choice-group').forEach(groupEl => {
      groupEl.querySelectorAll('.choice').forEach(btn => {
        btn.addEventListener('click', () => {
          groupEl.querySelectorAll('.choice').forEach(x => x.classList.remove('selected'));
          btn.classList.add('selected');
          state.meals[meal][groupEl.dataset.field] = Number(btn.dataset.value);
          update();
        });
      });
    });
  });
}

function mealScore(m) {
  const x = state.meals[m] || { carb: 0, drink: 0, dessert: 0, fried: 0 };
  return Math.max(0, 10 - x.carb - x.drink - x.dessert - x.fried);
}

function dietScore() {
  return Object.keys(mealNames).reduce((sum, m) => sum + mealScore(m), 0);
}

function exerciseScore() {
  const m = Number(state.exerciseMinutes) || 0;
  if (m >= 30) return 30;
  if (m >= 15) return 20;
  if (m > 0) return 10;
  return 0;
}

function stepScore() {
  const s = Number(state.steps) || 0;
  if (s >= 8000) return 20;
  if (s >= 6000) return 15;
  if (s >= 4000) return 10;
  if (s > 0) return 5;
  return 0;
}

function sleepScore() {
  const h = Number(state.sleep) || 0;
  if (h >= 7) return 10;
  if (h >= 6) return 8;
  if (h >= 5) return 5;
  if (h > 0) return 2;
  return 0;
}

function totalScore() {
  return dietScore() + exerciseScore() + stepScore() + Number(state.water || 0) + sleepScore();
}

function update() {
  Object.keys(mealNames).forEach(m => {
    const el = document.getElementById(m + 'Score');
    if (el) el.textContent = mealScore(m) + ' / 10';
  });

  const total = totalScore();
  document.getElementById('todayScore').textContent = total;
  document.getElementById('scoreBar').style.width = total + '%';

  document.getElementById('scoreMessage').textContent =
    total >= 85 ? '今天很穩，繼續保持 ♡' :
    total >= 60 ? '今天有達標，做得很穩定。' :
    '不用完美，把今天記完就很好。';

  const tasks = [
    ['🥗 飲食紀錄', true],
    ['🏃 運動 30 分鐘', Number(state.exerciseMinutes) >= 30],
    ['🚶 8000 步', Number(state.steps) >= 8000],
    ['💧 喝水 2000 ml', Number(state.water) >= 10],
    ['😴 睡眠 7 小時', Number(state.sleep) >= 7]
  ];

  const done = tasks.filter(x => x[1]).length;
  document.getElementById('taskProgress').textContent = done + ' / 5';
  document.getElementById('taskList').innerHTML = tasks.map(x =>
    `<div class="task ${x[1] ? 'done' : ''}">${x[1] ? '✓' : '○'}　${x[0]}</div>`
  ).join('');
}

function bind(id, key, number = false) {
  const el = document.getElementById(id);
  const handler = () => {
    state[key] = number ? Number(el.value) : el.value;
    update();
  };
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
}

function todayKey() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function saveToday() {
  localStorage.setItem(
    'sisters-log-' + todayKey(),
    JSON.stringify({ ...state, total: totalScore(), savedAt: new Date().toISOString() })
  );

  if (totalScore() >= 60) {
    let streak = Number(localStorage.getItem('sisters-streak') || 0);
    const streakKey = 'streak-' + todayKey();
    if (!localStorage.getItem(streakKey)) {
      streak++;
      localStorage.setItem('sisters-streak', streak);
      localStorage.setItem(streakKey, '1');
    }
  }

  document.getElementById('streakCount').textContent =
    (localStorage.getItem('sisters-streak') || 0) + ' 天';

  document.getElementById('saveNote').textContent = '已儲存在這台裝置上 ♡';
  setTimeout(() => {
    document.getElementById('saveNote').textContent = '';
  }, 2200);
}

function restoreToday() {
  const raw = localStorage.getItem('sisters-log-' + todayKey());
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    state = { ...state, ...saved };

    document.getElementById('weight').value = state.weight || '';
    document.getElementById('exerciseType').value = state.exerciseType || '';
    document.getElementById('exerciseMinutes').value = state.exerciseMinutes || '';
    document.getElementById('steps').value = state.steps || '';
    document.getElementById('water').value = String(state.water || 0);
    document.getElementById('sleep').value = state.sleep || '';

    if (state.mood) {
      document.querySelectorAll('.mood').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === state.mood);
      });
    }

    Object.entries(state.meals || {}).forEach(([meal, fields]) => {
      const card = document.querySelector(`.meal[data-meal="${meal}"]`);
      if (!card) return;

      Object.entries(fields).forEach(([field, value]) => {
        const groupEl = card.querySelector(`.choice-group[data-field="${field}"]`);
        if (!groupEl) return;

        groupEl.querySelectorAll('.choice').forEach(btn => {
          btn.classList.toggle('selected', Number(btn.dataset.value) === Number(value));
        });
      });
    });
  } catch (_) {}
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

document.getElementById('dayCount').textContent = '第 ' + dayCount() + ' / 90 天';

renderMeals();
bind('weight', 'weight');
bind('exerciseType', 'exerciseType');
bind('exerciseMinutes', 'exerciseMinutes', true);
bind('steps', 'steps', true);
bind('water', 'water', true);
bind('sleep', 'sleep', true);

document.querySelectorAll('.mood').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood').forEach(x => x.classList.remove('selected'));
    btn.classList.add('selected');
    state.mood = btn.dataset.value;
  });
});

restoreToday();

document.getElementById('streakCount').textContent =
  (localStorage.getItem('sisters-streak') || 0) + ' 天';

document.getElementById('saveLog').addEventListener('click', saveToday);

update();
