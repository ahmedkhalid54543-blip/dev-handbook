function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(text) {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  return escaped;
}

function parseTable(block) {
  const lines = block.trim().split('\n');
  if (lines.length < 2) return null;
  const separatorIndex = lines.findIndex((line) => /^\s*\|?\s*[-:]+/.test(line));
  if (separatorIndex <= 0) return null;

  const header = lines[separatorIndex - 1];
  const rows = lines.slice(separatorIndex + 1);
  const splitRow = (line) => {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmed.split('|').map((cell) => cell.trim());
  };

  const headers = splitRow(header);
  const table = document.createElement('div');
  table.className = 'table-wrapper';
  const tableEl = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  headers.forEach((cell) => {
    const th = document.createElement('th');
    th.innerHTML = formatInline(cell);
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  tableEl.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    if (!row.trim()) return;
    const tr = document.createElement('tr');
    splitRow(row).forEach((cell) => {
      const td = document.createElement('td');
      td.innerHTML = formatInline(cell);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tableEl.appendChild(tbody);
  table.appendChild(tableEl);
  return table;
}

function renderMarkdown(text) {
  const fragment = document.createDocumentFragment();
  const normalized = text.replace(/\r\n/g, '\n');
  const codeRegex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  const parts = [];

  while ((match = codeRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: normalized.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < normalized.length) {
    parts.push({ type: 'text', value: normalized.slice(lastIndex) });
  }

  parts.forEach((part) => {
    if (part.type === 'code') {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'code-block language-plain';
      code.textContent = part.value.trim();
      pre.appendChild(code);
      fragment.appendChild(pre);
      return;
    }

    const blocks = part.value.split(/\n\n+/).filter((block) => block.trim().length);
    blocks.forEach((block) => {
      const table = parseTable(block);
      if (table) {
        fragment.appendChild(table);
        return;
      }
      const paragraph = document.createElement('p');
      paragraph.innerHTML = formatInline(block.replace(/\n/g, '<br>'));
      const textValue = block.trim();
      if (textValue.startsWith('Mi English') || textValue.includes('Mi English 的例子') || textValue.includes('Mi English 案例')) {
        const callout = document.createElement('div');
        callout.className = 'callout';
        callout.appendChild(paragraph);
        fragment.appendChild(callout);
      } else {
        fragment.appendChild(paragraph);
      }
    });
  });

  return fragment;
}

function tagClass(tag) {
  if (tag === '必学') return 'critical';
  if (tag === '可选') return 'optional';
  return 'extend';
}

async function loadStage() {
  const stageId = getQueryParam('id') || '01';
  const sectionParam = getQueryParam('section');
  const loading = document.getElementById('stage-loading');
  const contentRoot = document.getElementById('stage-content');

  try {
    loading.textContent = '加载中...';
    const response = await fetch(`data/stages/stage-${stageId}.json`);
    if (!response.ok) throw new Error('Not found');
    const stage = await response.json();

    renderStage(stage);
    loading.remove();

    if (sectionParam) {
      const target = document.getElementById(`section-${sectionParam}`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    loading.textContent = '阶段内容暂未开放。';
    contentRoot.innerHTML = '<p class="muted">请返回首页选择其他阶段。</p>';
  }
}

function renderStage(stage) {
  const state = window.DevHandbook.loadState();
  const progress = window.DevHandbook.ensureStageProgress(state, stage.id, stage.checklist.length);
  window.DevHandbook.saveState(state);

  const totalSections = stage.sections.length;
  const completedSections = progress.sectionsRead.length;

  const topTitle = document.querySelector('[data-stage-title]');
  const topProgress = document.querySelector('[data-stage-progress]');
  if (topTitle) topTitle.textContent = `${stage.id} · ${stage.title}`;
  if (topProgress) topProgress.textContent = `${completedSections}/${totalSections} 已读`;

  const hero = document.getElementById('stage-hero');
  hero.innerHTML = `
    <div class="hero-number">${stage.id}</div>
    <div>
      <div class="hero-title">${stage.title}</div>
      <div class="hook">${stage.hookQuestion}</div>
    </div>
    <div><strong>本关产出：</strong>${stage.deliverable}</div>
    <div class="role-badges">
      <span class="badge" style="background:${stage.color}">${stage.icon} 你：${stage.roles.you}</span>
      <span class="badge" style="background:${stage.color}">AI：${stage.roles.ai}</span>
      <span class="badge" style="background:${stage.color}">用户：${stage.roles.user}</span>
    </div>
    <div class="muted">预计用时：${stage.estimatedMinutes} 分钟</div>
  `;

  renderToc(stage, progress);
  renderSections(stage, progress);
  renderPrompts(stage);
  renderFails(stage);
  renderExercises(stage, progress);
  renderChecklist(stage, progress);
  renderStageLink(stage);
  renderBottomNav(stage.id);
  updateStageCompletion(stage, window.DevHandbook.loadState());
}

function renderToc(stage, progress) {
  const tocList = document.getElementById('toc-list');
  const tocToggle = document.getElementById('toc-toggle');
  const tocPanel = document.getElementById('toc-panel');

  if (tocToggle && tocPanel) {
    tocToggle.addEventListener('click', () => {
      tocPanel.classList.toggle('open');
    });
  }

  tocList.innerHTML = '';
  stage.sections.forEach((section) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'toc-item';
    item.dataset.sectionId = section.id;
    item.innerHTML = `
      <span class="read-indicator ${progress.sectionsRead.includes(section.id) ? 'read' : ''}"></span>
      <span>${section.title}</span>
    `;
    item.addEventListener('click', () => {
      const target = document.getElementById(`section-${section.id}`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      window.DevHandbook.setLastVisited(stage.id, section.id);
    });
    tocList.appendChild(item);
  });
}

function renderSections(stage, progress) {
  const container = document.getElementById('sections-container');
  container.innerHTML = '';

  stage.sections.forEach((section) => {
    const card = document.createElement('section');
    card.className = 'card section-card';
    card.id = `section-${section.id}`;

    const meta = document.createElement('div');
    meta.className = 'section-meta';
    meta.innerHTML = `<span class="badge gray">${section.estimatedMinutes} 分钟</span>`;
    section.tags.forEach((tag) => {
      const span = document.createElement('span');
      span.className = `tag ${tagClass(tag)}`;
      span.textContent = tag;
      meta.appendChild(span);
    });

    const title = document.createElement('h2');
    title.textContent = section.title;

    const content = document.createElement('div');
    content.className = 'section-content';
    content.appendChild(renderMarkdown(section.content));

    const readBtn = document.createElement('button');
    readBtn.className = 'btn secondary section-read';
    const isRead = progress.sectionsRead.includes(section.id);
    readBtn.textContent = isRead ? '已读' : '标记为已读';
    readBtn.disabled = isRead;
    readBtn.addEventListener('click', () => {
      const state = window.DevHandbook.loadState();
      const stageProgress = window.DevHandbook.ensureStageProgress(state, stage.id, stage.checklist.length);
      if (!stageProgress.sectionsRead.includes(section.id)) {
        stageProgress.sectionsRead.push(section.id);
      }
      state.lastVisited = { stage: stage.id, section: section.id };
      window.DevHandbook.saveState(state);
      readBtn.textContent = '已读';
      readBtn.disabled = true;
      updateReadIndicators(section.id, true);
      updateStageCompletion(stage, state);
    });

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(content);
    card.appendChild(readBtn);
    container.appendChild(card);
  });
}

function updateReadIndicators(sectionId, read) {
  const tocList = document.getElementById('toc-list');
  if (!tocList) return;
  const items = tocList.querySelectorAll('.toc-item');
  items.forEach((item) => {
    if (item.dataset.sectionId === sectionId) {
      const dot = item.querySelector('.read-indicator');
      if (dot) dot.classList.toggle('read', read);
    }
  });

  const topProgress = document.querySelector('[data-stage-progress]');
  if (topProgress) {
    const state = window.DevHandbook.loadState();
    const progress = state.progress[`stage-${getQueryParam('id') || '01'}`];
    const total = document.querySelectorAll('.section-card').length;
    const count = progress ? progress.sectionsRead.length : 0;
    topProgress.textContent = `${count}/${total} 已读`;
  }
}

function renderPrompts(stage) {
  const promptRoot = document.getElementById('prompt-templates');
  promptRoot.innerHTML = '';
  stage.prompts.forEach((prompt) => {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.innerHTML = `
      <strong>${prompt.title}</strong>
      <span class="muted">${prompt.description}</span>
      <pre>${escapeHtml(prompt.template)}</pre>
    `;
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn secondary copy-btn';
    copyBtn.textContent = '复制 Prompt';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(prompt.template);
        copyBtn.textContent = '已复制';
        setTimeout(() => (copyBtn.textContent = '复制 Prompt'), 1500);
      } catch (err) {
        copyBtn.textContent = '复制失败';
      }
    });
    card.appendChild(copyBtn);
    promptRoot.appendChild(card);
  });
}

function renderFails(stage) {
  const failRoot = document.getElementById('ai-fails');
  failRoot.innerHTML = '';
  stage.aiFails.forEach((fail) => {
    const card = document.createElement('div');
    card.className = 'ai-fail-card';
    card.innerHTML = `
      <strong>${fail.title}</strong>
      <div><strong>场景：</strong>${fail.scenario}</div>
      <div class="callout fail"><strong>坏 Prompt：</strong><br>${escapeHtml(fail.badPrompt)}</div>
      <div><strong>AI 输出：</strong>${fail.aiOutput}</div>
      <div><strong>根因：</strong>${fail.rootCause}</div>
      <div class="callout"><strong>改进 Prompt：</strong><br>${escapeHtml(fail.fixedPrompt)}</div>
    `;
    failRoot.appendChild(card);
  });
}

function renderExercises(stage, progress) {
  const root = document.getElementById('exercise-list');
  root.innerHTML = '';

  stage.exercises.forEach((exercise, index) => {
    const panel = document.createElement('div');
    panel.className = 'exercise-panel';

    const header = document.createElement('header');
    const stars = '⭐'.repeat(exercise.level);
    header.innerHTML = `<span>${stars} 练习 ${index + 1}</span><span>点击展开</span>`;
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'panel-body';
    body.innerHTML = `<p>${formatInline(exercise.question).replace(/\n/g, '<br>')}</p>`;
    if (exercise.referenceAnswer) {
      const ref = document.createElement('div');
      ref.className = 'callout';
      ref.innerHTML = `<strong>参考答案：</strong><br>${formatInline(exercise.referenceAnswer).replace(/\n/g, '<br>')}`;
      body.appendChild(ref);
    }
    if (exercise.templateRef) {
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = `使用模板：${exercise.templateRef}`;
      body.appendChild(note);
    }
    panel.appendChild(body);

    header.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    root.appendChild(panel);
  });
}

function renderChecklist(stage, progress) {
  const root = document.getElementById('checklist');
  const state = window.DevHandbook.loadState();
  const stageProgress = window.DevHandbook.ensureStageProgress(state, stage.id, stage.checklist.length);
  window.DevHandbook.saveState(state);

  root.innerHTML = '';
  stage.checklist.forEach((item, index) => {
    const row = document.createElement('label');
    row.className = `checklist-item ${stageProgress.checklist[index] ? 'completed' : ''}`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = stageProgress.checklist[index];
    input.addEventListener('change', () => {
      const state = window.DevHandbook.loadState();
      const progress = window.DevHandbook.ensureStageProgress(state, stage.id, stage.checklist.length);
      progress.checklist[index] = input.checked;
      window.DevHandbook.saveState(state);
      row.classList.toggle('completed', input.checked);
      updateStageCompletion(stage, state);
      renderCongrats(stage.id, progress);
    });

    const span = document.createElement('span');
    span.textContent = item;

    row.appendChild(input);
    row.appendChild(span);
    root.appendChild(row);
  });

  renderCongrats(stage.id, stageProgress);
}

function renderCongrats(stageId, progress) {
  const root = document.getElementById('checklist');
  if (!root) return;
  const existing = document.querySelector('.congrats');
  if (existing) existing.remove();
  if (progress.checklist.length && progress.checklist.every(Boolean)) {
    const congrats = document.createElement('div');
    congrats.className = 'congrats';
    congrats.textContent = '🎉 Checklist 全部完成！';
    root.appendChild(congrats);
  }
}

function updateStageCompletion(stage, state) {
  const progress = state.progress[`stage-${stage.id}`];
  const allRead = progress.sectionsRead.length === stage.sections.length;
  const checklistDone = progress.checklist.length ? progress.checklist.every(Boolean) : true;
  progress.completed = allRead && checklistDone;
  window.DevHandbook.saveState(state);
}

function renderStageLink(stage) {
  const link = document.getElementById('stage-link');
  link.textContent = stage.nextStageLink;
}

async function renderBottomNav(stageId) {
  const nav = document.getElementById('bottom-stage-nav');
  if (!nav) return;
  try {
    const response = await fetch('data/roles.json');
    const data = await response.json();
    const ids = data.rows.map((row) => row.stage);
    const index = ids.indexOf(stageId);
    const prev = ids[index - 1];
    const next = ids[index + 1];

    nav.innerHTML = `
      <a class="btn secondary" href="stage.html?id=${prev || stageId}">${prev ? `上一关 ${prev}` : '回到开头'}</a>
      <a class="btn primary" href="index.html">首页</a>
      <a class="btn secondary" href="stage.html?id=${next || stageId}">${next ? `下一关 ${next}` : '继续探索'}</a>
    `;
  } catch (err) {
    nav.innerHTML = '<a class="btn primary" href="index.html">返回首页</a>';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.DevHandbook.initBottomNav();
  loadStage();
});
