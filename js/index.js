async function loadRoles() {
  const tableRoot = document.getElementById('roles-table');
  if (!tableRoot) return { rows: [] };
  try {
    const response = await fetch('data/roles.json');
    const data = await response.json();

    const table = document.createElement('div');
    table.className = 'table-wrapper';

    const tableEl = document.createElement('table');
    tableEl.className = 'roles-matrix';
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    data.columns.forEach((col) => {
      const th = document.createElement('th');
      th.textContent = col;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tableEl.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.rows.forEach((row) => {
      const tr = document.createElement('tr');
      const cols = [
        `${row.stage} ${row.title}`,
        row.you,
        row.ai,
        row.user,
      ];
      cols.forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tableEl.appendChild(tbody);
    table.appendChild(tableEl);
    tableRoot.innerHTML = '';
    tableRoot.appendChild(table);
    if (window.DevHandbook && typeof window.DevHandbook.setupTableOverflowHints === 'function') {
      window.DevHandbook.setupTableOverflowHints(tableRoot);
    }
    return data;
  } catch (err) {
    tableRoot.innerHTML = '<p class="muted">角色表加载失败。</p>';
    return { rows: [] };
  }
}

const STAGE_COLORS = {
  '01': '#FF6B35',
  '02': '#FF5252',
  '03': '#7C4DFF',
  '04': '#7C4DFF',
  '05': '#448AFF',
  '06': '#448AFF',
  '07': '#00BCD4',
  '08': '#66BB6A',
  '09': '#66BB6A',
};

async function loadStages(rolesData) {
  const grid = document.getElementById('stages-grid');
  if (!grid) return;
  const state = window.DevHandbook.loadState();

  const requests = rolesData.rows.map((row) =>
    fetch(`data/stages/stage-${row.stage}.json`).then((res) => (res.ok ? res.json() : null))
  );

  const results = await Promise.all(requests);
  grid.innerHTML = '';

  rolesData.rows.forEach((row, index) => {
    const stageData = results[index];
    const progress = state.progress[`stage-${row.stage}`];
    const sectionsTotal = stageData ? stageData.sections.length : 0;
    const sectionsRead = progress ? progress.sectionsRead.length : 0;

    let statusLabel = '即将开放';
    let statusClass = 'status-upcoming';
    if (stageData) {
      if (progress && progress.completed) {
        statusLabel = '已完成';
        statusClass = '';
      } else if (sectionsRead > 0) {
        statusLabel = '进行中';
        statusClass = '';
      } else {
        statusLabel = '未开始';
        statusClass = 'status-not-started';
      }
    }

    const stageColor = stageData ? stageData.color : (STAGE_COLORS[row.stage] || '#C7CED9');
    const card = document.createElement('a');
    card.className = 'card stage-card';
    card.href = `stage.html?id=${row.stage}`;
    card.style.borderTop = `4px solid ${stageColor}`;

    card.innerHTML = `
      <div class="stage-meta">
        <span>${stageData ? stageData.icon : '⚪️'} Stage ${row.stage}</span>
        <span>${stageData ? `${stageData.estimatedMinutes} 分钟` : '-- 分钟'}</span>
      </div>
      <div class="stage-title">${row.title}</div>
      <div class="stage-meta">进度：${sectionsRead}/${sectionsTotal} 节</div>
      <span class="badge ${statusClass}" style="background:${stageColor}">${statusLabel}</span>
    `;

    grid.appendChild(card);
  });
}

function setupContinueButton() {
  const btn = document.getElementById('continue-btn');
  if (!btn) return;
  const state = window.DevHandbook.loadState();
  if (state.lastVisited && state.lastVisited.stage) {
    btn.textContent = '继续学习 →';
    btn.href = `stage.html?id=${state.lastVisited.stage}&section=${state.lastVisited.section}`;
  } else {
    btn.textContent = '开始诊断 →';
    btn.href = '#diagnosis';
  }
}

function renderReviewSection() {
  const container = document.getElementById('review-section');
  if (!container) return;

  try {
    const raw = localStorage.getItem('devHandbook_wrongAnswers');
    if (!raw) {
      container.style.display = 'none';
      return;
    }
    const allWrong = JSON.parse(raw);
    if (!allWrong.length) {
      container.style.display = 'none';
      return;
    }

    container.style.display = '';

    const shuffled = [...allWrong].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 5);
    const list = container.querySelector('.review-list');
    list.innerHTML = '';

    picked.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'review-card card';
      const typeLabel = item.type === 'quiz' ? '测验' : '情景决策';
      const stageLabel = item.stageId ? `Stage ${item.stageId}` : '';
      card.innerHTML = `
        <div class="review-type">${typeLabel} ${stageLabel}</div>
        <div class="review-question">${escapeHtmlSimple(item.question)}</div>
        <div class="review-answer">你的回答：${escapeHtmlSimple(item.userAnswer)}</div>
        <div class="review-correct">正确/建议：${escapeHtmlSimple(item.correctInfo)}</div>
      `;
      list.appendChild(card);
    });

    const clearBtn = container.querySelector('.review-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem('devHandbook_wrongAnswers');
        container.style.display = 'none';
      });
    }
  } catch (err) {
    container.style.display = 'none';
  }
}

function escapeHtmlSimple(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function initHome() {
  window.DevHandbook.initBottomNav();
  window.DevHandbook.setupExportImport();

  setupContinueButton();
  renderReviewSection();
  window.DevHandbook.renderDiagnosis('diagnosis');

  const rolesData = await loadRoles();
  await loadStages(rolesData);

  const state = window.DevHandbook.loadState();
  const totalStages = rolesData.rows.length || 9;
  const completed = window.DevHandbook.getTotalCompletedStages(state, totalStages);
  const ring = document.querySelector('.progress-ring');
  window.DevHandbook.updateProgressRing(ring, completed, totalStages);
}

window.addEventListener('DOMContentLoaded', initHome);
