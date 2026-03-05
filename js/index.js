async function loadRoles() {
  const tableRoot = document.getElementById('roles-table');
  if (!tableRoot) return { rows: [] };
  try {
    const response = await fetch('data/roles.json');
    const data = await response.json();

    const table = document.createElement('div');
    table.className = 'table-wrapper';

    const tableEl = document.createElement('table');
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
    return data;
  } catch (err) {
    tableRoot.innerHTML = '<p class="muted">角色表加载失败。</p>';
    return { rows: [] };
  }
}

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
    let statusClass = 'gray';
    if (stageData) {
      if (progress && progress.completed) {
        statusLabel = '已完成';
        statusClass = '';
      } else if (sectionsRead > 0) {
        statusLabel = '进行中';
        statusClass = '';
      } else {
        statusLabel = '未开始';
        statusClass = 'gray';
      }
    }

    const card = document.createElement('a');
    card.className = 'card stage-card';
    card.href = `stage.html?id=${row.stage}`;

    card.innerHTML = `
      <div class="stage-meta">
        <span>${stageData ? stageData.icon : '⚪️'} Stage ${row.stage}</span>
        <span>${stageData ? `${stageData.estimatedMinutes} 分钟` : '-- 分钟'}</span>
      </div>
      <div class="stage-title">${row.title}</div>
      <div class="stage-meta">进度：${sectionsRead}/${sectionsTotal} 节</div>
      <span class="badge ${statusClass}">${statusLabel}</span>
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

async function initHome() {
  window.DevHandbook.initBottomNav();
  window.DevHandbook.setupExportImport();

  setupContinueButton();
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
