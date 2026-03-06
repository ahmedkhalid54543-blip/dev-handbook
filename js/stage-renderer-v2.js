function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function escapeHtml(value) {
  return String(value ?? '')
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

function formatInlineWithGlossary(text) {
  const html = formatInline(text);
  if (window.DevHandbookGlossary && typeof window.DevHandbookGlossary.wrapTerms === 'function') {
    return window.DevHandbookGlossary.wrapTerms(html);
  }
  return html;
}

function hapticTap() {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
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
    th.innerHTML = formatInlineWithGlossary(cell);
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
      td.innerHTML = formatInlineWithGlossary(cell);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tableEl.appendChild(tbody);
  table.appendChild(tableEl);
  return table;
}

function appendContentBlock(fragment, element) {
  if (element.classList) {
    element.classList.add('content-block');
  }
  fragment.appendChild(element);
}

function parseDecisionBlock(raw) {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const scenarioLine = lines.find((line) => line.toLowerCase().startsWith('scenario:'));
  const scenario = scenarioLine ? scenarioLine.slice(scenarioLine.indexOf(':') + 1).trim() : '';
  const options = [];

  lines.forEach((line) => {
    const optionMatch = line.match(/^([A-Z]):\s*(.+)$/);
    if (!optionMatch) return;
    const label = optionMatch[1];
    const payload = optionMatch[2];
    const resultMarker = payload.indexOf('|result:');
    const xpMarker = payload.lastIndexOf('|xp:');
    if (resultMarker === -1 || xpMarker === -1 || xpMarker < resultMarker) return;

    const text = payload.slice(0, resultMarker).trim();
    const result = payload.slice(resultMarker + 8, xpMarker).trim();
    const xpRaw = payload.slice(xpMarker + 4).trim();
    const xp = Number.parseInt(xpRaw, 10);

    options.push({
      label,
      text,
      result,
      xp: Number.isFinite(xp) ? xp : 0,
    });
  });

  return {
    scenario,
    options,
  };
}

function tryAwardXp(points, source) {
  if (!window.DevHandbookRPG || !Number.isFinite(points) || points <= 0) return false;
  try {
    window.DevHandbookRPG.awardXp(points, { source, stageColor: window._activeStageColor });
    return true;
  } catch (err) {
    return false;
  }
}

function renderDecisionBlock(raw) {
  const data = parseDecisionBlock(raw);
  const block = document.createElement('section');
  block.className = 'decision-block';

  const scenario = document.createElement('div');
  scenario.className = 'decision-scenario';
  scenario.innerHTML = `<strong>情景决策</strong><p>${formatInline(data.scenario || '请选择一个方案。')}</p>`;
  block.appendChild(scenario);

  const options = document.createElement('div');
  options.className = 'decision-options';
  block.appendChild(options);

  const feedback = document.createElement('div');
  feedback.className = 'decision-feedback';
  feedback.setAttribute('aria-live', 'polite');
  block.appendChild(feedback);

  if (!data.options.length) {
    feedback.innerHTML = '<p class="decision-result-text">决策题配置不完整。</p>';
    return block;
  }

  const bestXp = Math.max(...data.options.map((option) => option.xp));
  let answered = false;

  data.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'decision-option';
    button.innerHTML = `
      <span class="decision-label">${option.label}</span>
      <span class="decision-text">${formatInline(option.text)}</span>
    `;
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      hapticTap();
      const isBest = option.xp === bestXp;
      const xpAdded = tryAwardXp(option.xp, 'decision');

      options.querySelectorAll('.decision-option').forEach((item) => {
        item.disabled = true;
        item.classList.remove('selected', 'best', 'non-best', 'shake');
      });

      button.classList.add('selected');
      if (isBest) {
        button.classList.add('best');
        launchConfetti();
      } else {
        button.classList.add('non-best', 'shake');
      }

      feedback.classList.add('show');
      feedback.innerHTML = `
        <p class="decision-result-text">${formatInline(option.result)}</p>
        <div class="decision-xp">+${option.xp} XP${xpAdded ? '（已计入成长值）' : ''}</div>
      `;
    });
    options.appendChild(button);
  });

  return block;
}

function parseChatBlock(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([A-Z]+)\|([^:]*):\s*(.*)$/);
      if (!match) return null;
      return {
        role: match[1],
        speaker: match[2].trim(),
        message: match[3],
      };
    })
    .filter(Boolean);
}

function renderChatBlock(raw) {
  const messages = parseChatBlock(raw);
  const block = document.createElement('section');
  block.className = 'chat-block';

  const list = document.createElement('div');
  list.className = 'chat-messages';
  block.appendChild(list);

  const controls = document.createElement('div');
  controls.className = 'chat-controls';
  controls.innerHTML = `
    <div class="chat-typing" hidden>...</div>
    <button type="button" class="btn secondary chat-next">点击继续</button>
  `;
  block.appendChild(controls);

  const typing = controls.querySelector('.chat-typing');
  const nextBtn = controls.querySelector('.chat-next');
  let cursor = 0;
  let busy = false;

  const appendMessage = (entry) => {
    const row = document.createElement('div');
    row.className = `chat-row role-${entry.role.toLowerCase()}`;
    if (entry.role === 'NARRATOR') {
      row.innerHTML = `<p class="chat-narrator">${formatInline(entry.message)}</p>`;
      list.appendChild(row);
      return;
    }

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    const nameHtml = entry.speaker ? `<div class="chat-name">${escapeHtml(entry.speaker)}</div>` : '';
    const aiIcon = entry.role === 'AI' ? '<span class="chat-ai-icon">✨</span>' : '';
    bubble.innerHTML = `
      ${nameHtml}
      <div class="chat-text">${aiIcon}${formatInline(entry.message)}</div>
    `;
    row.appendChild(bubble);
    list.appendChild(row);
  };

  const revealNext = () => {
    if (busy || cursor >= messages.length) return;
    busy = true;
    nextBtn.disabled = true;
    typing.hidden = false;
    window.setTimeout(() => {
      typing.hidden = true;
      appendMessage(messages[cursor]);
      cursor += 1;
      busy = false;
      if (cursor >= messages.length) {
        nextBtn.disabled = true;
        nextBtn.textContent = '对话完成';
      } else {
        nextBtn.disabled = false;
      }
    }, 300);
  };

  nextBtn.addEventListener('click', revealNext);
  if (!messages.length) {
    nextBtn.disabled = true;
    nextBtn.textContent = '暂无对话';
  }

  return block;
}

function renderMarkdown(text) {
  const fragment = document.createDocumentFragment();
  const normalized = text.replace(/\r\n/g, '\n');
  const blockRegex = /```[\s\S]*?```|\[decision\][\s\S]*?\[\/decision\]|\[chat\][\s\S]*?\[\/chat\]|\[(diagram|interactive):([a-z0-9-]+)\][\s\S]*?\[\/\1\]/gi;
  let lastIndex = 0;
  let match;
  const parts = [];
  let hasMajorSection = false;

  while ((match = blockRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: normalized.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('```')) {
      parts.push({ type: 'code', value: token.slice(3, -3) });
    } else if (token.startsWith('[decision]')) {
      parts.push({ type: 'decision', value: token.slice(10, -11).trim() });
    } else if (token.startsWith('[chat]')) {
      parts.push({ type: 'chat', value: token.slice(6, -7).trim() });
    } else if (/^\[(diagram|interactive):/.test(token)) {
      const directiveMatch = token.match(/^\[(diagram|interactive):([a-z0-9-]+)\]([\s\S]*?)\[\/\1\]$/i);
      if (directiveMatch) {
        parts.push({
          type: directiveMatch[1].toLowerCase(),
          componentType: directiveMatch[2].toLowerCase(),
          value: directiveMatch[3].trim(),
        });
      }
    }
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
      appendContentBlock(fragment, pre);
      return;
    }
    if (part.type === 'decision') {
      appendContentBlock(fragment, renderDecisionBlock(part.value));
      return;
    }
    if (part.type === 'chat') {
      appendContentBlock(fragment, renderChatBlock(part.value));
      return;
    }
    if (part.type === 'diagram') {
      const renderer = window.DevHandbookDiagrams && typeof window.DevHandbookDiagrams.render === 'function'
        ? window.DevHandbookDiagrams.render : null;
      if (renderer) {
        const el = renderer(part.componentType, part.value);
        if (el) { appendContentBlock(fragment, el); return; }
      }
      const fallback = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'code-block language-plain';
      code.textContent = `[diagram:${part.componentType}]\n${part.value}\n[/diagram]`;
      fallback.appendChild(code);
      appendContentBlock(fragment, fallback);
      return;
    }
    if (part.type === 'interactive') {
      const renderer = window.DevHandbookInteractive && typeof window.DevHandbookInteractive.render === 'function'
        ? window.DevHandbookInteractive.render : null;
      if (renderer) {
        const el = renderer(part.componentType, part.value);
        if (el) { appendContentBlock(fragment, el); return; }
      }
      const fallback = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'code-block language-plain';
      code.textContent = `[interactive:${part.componentType}]\n${part.value}\n[/interactive]`;
      fallback.appendChild(code);
      appendContentBlock(fragment, fallback);
      return;
    }

    const blocks = part.value
      .split(/\n\n+/)
      .map((block) => block.trim())
      .filter((block) => block.length);

    blocks.forEach((block) => {
      const table = parseTable(block);
      if (table) {
        appendContentBlock(fragment, table);
        return;
      }

      const lines = block.split('\n');
      let paragraphLines = [];
      let listType = null;
      let listEl = null;
      let quoteLines = [];

      const flushQuote = () => {
        if (!quoteLines.length) return;
        const quote = document.createElement('blockquote');
        quote.className = 'markdown-quote';
        quote.innerHTML = formatInline(quoteLines.join('<br>'));
        appendContentBlock(fragment, quote);
        quoteLines = [];
      };

      const flushList = () => {
        if (!listEl) return;
        appendContentBlock(fragment, listEl);
        listEl = null;
        listType = null;
      };

      const flushParagraph = () => {
        if (!paragraphLines.length) return;
        const textValue = paragraphLines.join('\n').trim();
        const paragraph = document.createElement('p');
        paragraph.innerHTML = formatInline(paragraphLines.join('<br>'));
        if (textValue.startsWith('Mi English') || textValue.includes('Mi English 的例子') || textValue.includes('Mi English 案例')) {
          const callout = document.createElement('div');
          callout.className = 'callout mi';
          callout.appendChild(paragraph);
          appendContentBlock(fragment, callout);
        } else {
          appendContentBlock(fragment, paragraph);
        }
        paragraphLines = [];
      };

      const flushAll = () => {
        flushQuote();
        flushList();
        flushParagraph();
      };

      lines.forEach((line) => {
        const heading4 = line.match(/^\s*####\s+(.+)$/);
        if (heading4) {
          flushAll();
          const h4 = document.createElement('h4');
          h4.innerHTML = formatInline(heading4[1]);
          appendContentBlock(fragment, h4);
          return;
        }

        const heading3 = line.match(/^\s*###?\s+(.+)$/);
        if (heading3) {
          flushAll();
          if (hasMajorSection) {
            const hr = document.createElement('hr');
            hr.className = 'section-break';
            appendContentBlock(fragment, hr);
          }
          const h3 = document.createElement('h3');
          h3.innerHTML = formatInline(heading3[1]);
          appendContentBlock(fragment, h3);
          hasMajorSection = true;
          return;
        }

        const quote = line.match(/^\s*>\s?(.*)$/);
        if (quote) {
          flushParagraph();
          flushList();
          quoteLines.push(quote[1]);
          return;
        }

        const ulItem = line.match(/^\s*[-*]\s+(.+)$/);
        if (ulItem) {
          flushParagraph();
          flushQuote();
          if (listType !== 'ul') {
            flushList();
            listType = 'ul';
            listEl = document.createElement('ul');
          }
          const li = document.createElement('li');
          li.innerHTML = formatInline(ulItem[1]);
          listEl.appendChild(li);
          return;
        }

        const olItem = line.match(/^\s*\d+\.\s+(.+)$/);
        if (olItem) {
          flushParagraph();
          flushQuote();
          if (listType !== 'ol') {
            flushList();
            listType = 'ol';
            listEl = document.createElement('ol');
          }
          const li = document.createElement('li');
          li.innerHTML = formatInline(olItem[1]);
          listEl.appendChild(li);
          return;
        }

        if (!line.trim()) {
          flushAll();
          return;
        }

        flushQuote();
        flushList();
        paragraphLines.push(line);
      });

      flushAll();
    });
  });

  return fragment;
}

function getYouTubeVideoId(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2] || null;
      }
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2] || null;
      }
    }
  } catch (err) {
    const fallback = rawUrl.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    return fallback ? fallback[1] : null;
  }
  return null;
}

function renderVideos(stage) {
  const root = document.getElementById('stage-videos');
  if (!root) return;
  const videos = Array.isArray(stage.videos) ? stage.videos : [];
  if (!videos.length) {
    root.style.display = 'none';
    root.innerHTML = '';
    return;
  }

  root.style.display = '';
  root.innerHTML = `
    <div class="section-title">推荐视频</div>
    <div class="muted">可直接观看或跳转外部资源</div>
    <div class="video-grid" style="margin-top:12px;"></div>
  `;

  const grid = root.querySelector('.video-grid');
  videos.forEach((video) => {
    const card = document.createElement('article');
    card.className = 'video-card';
    const videoId = getYouTubeVideoId(video.url);
    const title = escapeHtml(video.title || '视频资源');
    const reason = escapeHtml(video.reason || '');
    const meta = [video.platform, video.duration].filter(Boolean).join(' · ');
    const safeMeta = escapeHtml(meta);
    const safeUrl = escapeHtml(video.url || '#');

    if (videoId) {
      card.innerHTML = `
        <div class="video-embed">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}"
            title="${title}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
        <div class="video-info">
          <strong>${title}</strong>
          ${safeMeta ? `<span class="muted">${safeMeta}</span>` : ''}
          ${reason ? `<p class="muted">${reason}</p>` : ''}
        </div>
      `;
    } else {
      card.innerHTML = `
        <a class="video-link-card" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
          <strong>${title}</strong>
          ${safeMeta ? `<span class="muted">${safeMeta}</span>` : ''}
          ${reason ? `<p class="muted">${reason}</p>` : ''}
          <span class="video-link-arrow">打开外部视频资源 →</span>
        </a>
      `;
    }

    grid.appendChild(card);
  });
}

function buildRoleChip(label, description, color, icon) {
  return `
    <article class="role-chip">
      <div class="role-chip-label" style="background:${color}">${icon ? `${icon} ` : ''}${label}</div>
      <p>${escapeHtml(description)}</p>
    </article>
  `;
}

function setupRenderedTables() {
  if (window.DevHandbook && typeof window.DevHandbook.setupTableOverflowHints === 'function') {
    window.DevHandbook.setupTableOverflowHints(document.getElementById('stage-content'));
  }
}

function setupScrollReveal() {
  if (document.body?.dataset?.page !== 'stage') return;

  // Only animate section-cards and diagram containers, NOT all .card elements
  const targets = Array.from(
    document.querySelectorAll('#sections-container .section-card, .diagram-container')
  );
  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('revealed');
        el.style.transition = `opacity 0.5s ease ${el.style.getPropertyValue('--reveal-delay') || '0ms'}, transform 0.5s ease ${el.style.getPropertyValue('--reveal-delay') || '0ms'}`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        activeObserver.unobserve(el);
      });
    },
    { threshold: 0.1 }
  );

  targets.forEach((el, index) => {
    el.classList.add('scroll-reveal');
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.setProperty('--reveal-delay', `${index * 50}ms`);
    observer.observe(el);
  });
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
    loading.innerHTML = `
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>加载中...</span>
    `;
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
    renderStageUnavailable(contentRoot, loading, stageId);
  } finally {
    // Override any cached CSS that hides elements with opacity:0
    const fixStyle = document.createElement('style');
    fixStyle.textContent = `
      body[data-page="stage"] .content-block,
      body[data-page="stage"] .section-card,
      body[data-page="stage"] .card,
      body[data-page="stage"] .diagram-container {
        opacity: 1 !important;
        transform: none !important;
      }
      body[data-page="stage"] .scroll-reveal {
        opacity: 0 !important;
        transform: translateY(24px) !important;
      }
      body[data-page="stage"] .scroll-reveal.revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    `;
    document.head.appendChild(fixStyle);
    setupScrollReveal();
  }
}

function renderStageUnavailable(root, loading, stageId) {
  const hideIds = [
    'stage-hero',
    'stage-videos',
    'sections-container',
    'stage-toc',
    'stage-prompts',
    'stage-exercises',
    'stage-checklist',
    'stage-next',
    'bottom-stage-nav',
  ];
  hideIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const topProgress = document.querySelector('[data-stage-progress]');
  if (topProgress) topProgress.textContent = '即将开放';

  loading.classList.remove('loading');
  loading.classList.add('loading-error');
  loading.innerHTML = `
    <div class="card" style="display:grid; gap:8px;">
      <strong>阶段 ${stageId} 即将开放</strong>
      <span class="muted">我们正在完善这一阶段的内容，先去看看其他阶段吧。</span>
      <div class="loading-actions">
        <a class="btn primary" href="index.html">返回首页</a>
        <a class="btn secondary" href="stage.html?id=01">从第一关开始</a>
      </div>
    </div>
  `;
}

function renderStage(stage) {
  window._activeStageColor = stage.color || '#448AFF';
  const state = window.DevHandbook.loadState();
  const progress = window.DevHandbook.ensureStageProgress(state, stage.id, stage.checklist.length);
  window.DevHandbook.saveState(state);
  if (window.DevHandbookRPG) {
    window.DevHandbookRPG.init({ stageColor: window._activeStageColor });
  }

  const totalSections = stage.sections.length;
  const completedSections = progress.sectionsRead.length;

  const topTitle = document.querySelector('[data-stage-title]');
  const topProgress = document.querySelector('[data-stage-progress]');
  if (topTitle) topTitle.textContent = `${stage.id} · ${stage.title}`;
  if (topProgress) topProgress.textContent = `${completedSections}/${totalSections} 已读`;

  const hero = document.getElementById('stage-hero');
  const heroImage = stage.heroImage
    ? `<img class="stage-hero-image" src="${escapeHtml(stage.heroImage)}" alt="${escapeHtml(stage.heroImageAlt || stage.title)}" loading="lazy" decoding="async">`
    : '';
  hero.innerHTML = `
    ${heroImage}
    <div class="hero-number">${stage.id}</div>
    <div>
      <div class="hero-title">${stage.title}</div>
      <div class="hook">${stage.hookQuestion}</div>
    </div>
    <div><strong>本关产出：</strong>${stage.deliverable}</div>
    <div class="role-grid">
      ${buildRoleChip('你', stage.roles.you, stage.color, stage.icon)}
      ${buildRoleChip('AI', stage.roles.ai, stage.color)}
      ${buildRoleChip('用户', stage.roles.user, stage.color)}
    </div>
    <div class="muted">预计用时：${stage.estimatedMinutes} 分钟</div>
  `;

  renderVideos(stage);
  renderToc(stage, progress);
  renderSections(stage, progress);
  setupRenderedTables();
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
        if (window.DevHandbookRPG) {
          window.DevHandbookRPG.awardXp(15, { source: 'section-read', stageColor: window._activeStageColor });
        }
      }
      state.lastVisited = { stage: stage.id, section: section.id };
      window.DevHandbook.saveState(state);
      hapticTap();
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
      <div class="callout ai-fail"><strong>坏 Prompt：</strong><br>${escapeHtml(fail.badPrompt)}</div>
      <div><strong>AI 输出：</strong>${fail.aiOutput}</div>
      <div><strong>根因：</strong>${fail.rootCause}</div>
      <div class="callout ai-fail"><strong>改进 Prompt：</strong><br>${escapeHtml(fail.fixedPrompt)}</div>
    `;
    failRoot.appendChild(card);
  });
}

function renderExercises(stage, progress) {
  const root = document.getElementById('exercise-list');
  root.innerHTML = '';

  stage.exercises.forEach((exercise, index) => {
    const exerciseKey = `exercise-${index}`;
    const isDone = progress.exercisesDone.includes(exerciseKey);
    const panel = document.createElement('div');
    panel.className = `exercise-panel ${isDone ? 'completed' : ''}`;

    const header = document.createElement('header');
    const stars = '⭐'.repeat(exercise.level);
    header.innerHTML = `<span>${stars} 练习 ${index + 1}</span><span>点击展开</span>`;
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'panel-body';
    body.innerHTML = `<p>${formatInlineWithGlossary(exercise.question).replace(/\n/g, '<br>')}</p>`;
    const decisionOptions = Array.isArray(exercise.options) ? exercise.options : [];
    const canRenderDecision = (exercise.type === 'open' || exercise.type === 'quiz') && decisionOptions.length;
    if (canRenderDecision) {
      const raw = [
        `scenario: ${exercise.scenario || exercise.question || ''}`,
        ...decisionOptions.map((option, optionIndex) => {
          const label = option.label || String.fromCharCode(65 + optionIndex);
          const text = option.text || option.title || '';
          const result = option.result || option.consequence || '';
          const xp = Number.isFinite(option.xp) ? option.xp : 0;
          return `${label}: ${text}|result:${result}|xp:${xp}`;
        }),
      ].join('\n');
      body.appendChild(renderDecisionBlock(raw));
    }
    if (exercise.referenceAnswer) {
      const ref = document.createElement('div');
      ref.className = 'callout';
      ref.innerHTML = `<strong>参考答案：</strong><br>${formatInlineWithGlossary(exercise.referenceAnswer).replace(/\n/g, '<br>')}`;
      body.appendChild(ref);
    }
    if (exercise.templateRef) {
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = `使用模板：${exercise.templateRef}`;
      body.appendChild(note);
    }

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'btn secondary exercise-complete-btn';
    doneBtn.textContent = isDone ? '练习已完成' : '标记练习已完成';
    doneBtn.disabled = isDone;
    doneBtn.addEventListener('click', () => {
      const state = window.DevHandbook.loadState();
      const stageProgress = window.DevHandbook.ensureStageProgress(state, stage.id, stage.checklist.length);
      if (stageProgress.exercisesDone.includes(exerciseKey)) return;
      stageProgress.exercisesDone.push(exerciseKey);
      window.DevHandbook.saveState(state);
      if (window.DevHandbookRPG) {
        window.DevHandbookRPG.awardXp(30, { source: 'exercise-complete', stageColor: window._activeStageColor });
      }
      hapticTap();
      panel.classList.add('completed');
      doneBtn.textContent = '练习已完成';
      doneBtn.disabled = true;
    });
    body.appendChild(doneBtn);
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
      const wasChecked = Boolean(progress.checklist[index]);
      progress.checklist[index] = input.checked;
      window.DevHandbook.saveState(state);
      if (!wasChecked && input.checked && window.DevHandbookRPG) {
        window.DevHandbookRPG.awardXp(10, { source: 'checklist-item', stageColor: window._activeStageColor });
      }
      hapticTap();
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

const MOTIVATIONS = [
  { quote: "纸上得来终觉浅，绝知此事要躬行", author: "陆游" },
  { quote: "The best way to learn is to do.", author: "Richard Branson" },
  { quote: "每个专家都曾是初学者", author: "" },
  { quote: "你正在成为能跟 AI 平等对话的产品人", author: "Jarv1s" },
  { quote: "知道「什么不该做」比「该做什么」更重要", author: "" },
  { quote: "Mi English v3.0 正在向你招手 👋", author: "" },
];

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  const colors = ['#FF6B35', '#FF5252', '#7C4DFF', '#448AFF', '#00BCD4', '#66BB6A', '#FFD700'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 1 + 's';
    piece.style.animationDuration = (2 + Math.random()) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 3500);
}

function renderCongrats(stageId, progress) {
  const root = document.getElementById('checklist');
  if (!root) return;
  const existing = document.querySelector('.congrats');
  if (existing) existing.remove();
  const motivationEl = document.querySelector('.motivation-card');
  if (motivationEl) motivationEl.remove();

  if (progress.checklist.length && progress.checklist.every(Boolean)) {
    const congrats = document.createElement('div');
    congrats.className = 'congrats';
    congrats.textContent = '🎉 恭喜！这一关的 Checklist 全部完成！';
    root.appendChild(congrats);

    // Show motivation card
    const m = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    const card = document.createElement('div');
    card.className = 'motivation-card';
    card.innerHTML = `<div class="quote">"${m.quote}"</div>${m.author ? `<div class="author">— ${m.author}</div>` : ''}`;
    root.parentElement.appendChild(card);

    // Launch confetti (only once per page load)
    if (!window._confettiLaunched) {
      window._confettiLaunched = true;
      launchConfetti();
    }
  }
}

function updateStageCompletion(stage, state) {
  const progress = state.progress[`stage-${stage.id}`];
  const allRead = progress.sectionsRead.length === stage.sections.length;
  const checklistDone = progress.checklist.length ? progress.checklist.every(Boolean) : true;
  const wasCompleted = Boolean(progress.completed);
  progress.completed = allRead && checklistDone;
  if (progress.completed && !wasCompleted && !progress.stageBonusAwarded) {
    progress.stageBonusAwarded = true;
    if (window.DevHandbookRPG) {
      window.DevHandbookRPG.awardXp(50, { source: 'stage-complete', stageColor: window._activeStageColor });
    }
  }
  window.DevHandbook.saveState(state);
}

function renderStageLink(stage) {
  const link = document.getElementById('stage-link');
  link.textContent = stage.nextStageLink;
}

async function renderBottomNav(stageId) {
  const desktopNav = document.getElementById('bottom-stage-nav');
  const mobileNav = document.querySelector('.bottom-nav.stage-nav');
  try {
    const response = await fetch('data/roles.json');
    const data = await response.json();
    const ids = data.rows.map((row) => row.stage);
    const index = ids.indexOf(stageId);
    const prev = ids[index - 1];
    const next = ids[index + 1];

    const stageNavHtml = `
      <a class="btn secondary" href="stage.html?id=${prev || stageId}">${prev ? `上一关 ${prev}` : '回到开头'}</a>
      <a class="btn primary" href="index.html">首页</a>
      <a class="btn secondary" href="stage.html?id=${next || stageId}">${next ? `下一关 ${next}` : '继续探索'}</a>
    `;
    if (desktopNav) {
      desktopNav.innerHTML = stageNavHtml;
    }
    if (mobileNav) {
      mobileNav.innerHTML = `
        <a href="stage.html?id=${prev || stageId}" class="stage-nav-btn">${prev ? `⬅️ 上一关 ${prev}` : '⬅️ 回到开头'}</a>
        <a href="index.html" class="stage-nav-btn stage-nav-home">🏠 首页</a>
        <a href="stage.html?id=${next || stageId}" class="stage-nav-btn">${next ? `下一关 ${next} ➡️` : '继续探索 ➡️'}</a>
      `;
    }
  } catch (err) {
    if (desktopNav) {
      desktopNav.innerHTML = '<a class="btn primary" href="index.html">返回首页</a>';
    }
    if (mobileNav) {
      mobileNav.innerHTML = '<a href="index.html" class="stage-nav-btn stage-nav-home">🏠 返回首页</a>';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.DevHandbook.initBottomNav();
  if (window.DevHandbookGlossary) {
    window.DevHandbookGlossary.init();
  }
  loadStage();
});
