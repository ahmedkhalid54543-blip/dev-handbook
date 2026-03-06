(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeZoneName(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (raw.startsWith('must')) return 'must';
    if (raw.startsWith('should')) return 'should';
    if (raw.startsWith('could')) return 'could';
    if (raw.startsWith('wont') || raw.startsWith("won't")) return 'wont';
    return null;
  }

  function parseKeyValueLines(raw) {
    const lines = String(raw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const map = {};
    lines.forEach((line) => {
      const idx = line.indexOf('|');
      if (idx <= 0) return;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      if (!map[key]) map[key] = [];
      map[key].push(value);
    });
    return map;
  }

  function buildInteractiveShell(type, title) {
    const root = document.createElement('div');
    root.className = `interactive-card interactive-${type}`;

    const head = document.createElement('div');
    head.className = 'interactive-head';
    head.innerHTML = `
      <span class="interactive-badge">互动练习</span>
      ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
    `;

    const body = document.createElement('div');
    body.className = 'interactive-body';

    root.appendChild(head);
    root.appendChild(body);
    return { root, body };
  }

  function showFeedback(container, ok, text) {
    let feedback = container.querySelector('.interactive-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'interactive-feedback';
      container.appendChild(feedback);
    }
    feedback.className = `interactive-feedback ${ok ? 'success' : 'error'}`;
    feedback.textContent = text;

    if (!ok) {
      container.classList.remove('shake');
      void container.offsetWidth;
      container.classList.add('shake');
    }
  }

  function launchMiniConfetti(container) {
    const layer = document.createElement('div');
    layer.className = 'mini-confetti';
    const colors = ['#66BB6A', '#448AFF', '#FF6B35', '#00BCD4', '#7C4DFF'];

    for (let i = 0; i < 20; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'mini-confetti-piece';
      piece.style.left = `${10 + Math.random() * 80}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 120}ms`;
      piece.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
      layer.appendChild(piece);
    }

    container.appendChild(layer);
    setTimeout(() => layer.remove(), 1200);
  }

  function autoGrowInput(input) {
    const len = Math.max(4, Math.min(24, (input.value || '').trim().length + 2));
    input.style.width = `${len}ch`;
  }

  function renderFillBlank(raw) {
    const map = parseKeyValueLines(raw);
    const title = (map.title && map.title[0]) || '填空练习';
    const template = (map.template && map.template[0]) || '';
    const hint = (map.hint && map.hint[0]) || '';
    const example = (map.example && map.example[0]) || '';

    const { root, body } = buildInteractiveShell('fill-blank', title);
    root.dataset.interactiveType = 'fill-blank';

    const wrapper = document.createElement('div');
    wrapper.className = 'fill-blank-template';

    let blankCount = 0;
    const parts = template.split('____');
    parts.forEach((part, index) => {
      if (part) {
        const span = document.createElement('span');
        span.textContent = part;
        wrapper.appendChild(span);
      }
      if (index < parts.length - 1) {
        blankCount += 1;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'fill-blank-input';
        input.placeholder = `填空${blankCount}`;
        input.addEventListener('input', () => autoGrowInput(input));
        autoGrowInput(input);
        wrapper.appendChild(input);
      }
    });

    const actions = document.createElement('div');
    actions.className = 'interactive-actions';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'btn primary';
    checkBtn.textContent = '检查';

    const sampleBtn = document.createElement('button');
    sampleBtn.type = 'button';
    sampleBtn.className = 'btn secondary';
    sampleBtn.textContent = '参考示例';

    actions.appendChild(checkBtn);
    actions.appendChild(sampleBtn);

    if (hint) {
      const hintEl = document.createElement('p');
      hintEl.className = 'muted';
      hintEl.textContent = `提示：${hint}`;
      body.appendChild(hintEl);
    }

    const exampleEl = document.createElement('div');
    exampleEl.className = 'interactive-example muted';
    exampleEl.textContent = example ? `示例：${example}` : '暂无示例';

    checkBtn.addEventListener('click', () => {
      const inputs = Array.from(wrapper.querySelectorAll('input'));
      const allFilled = inputs.every((input) => input.value.trim().length > 0);
      if (allFilled) {
        root.classList.add('solved');
        launchMiniConfetti(root);
        showFeedback(body, true, '✅ 填写完成，结构清晰。');
      } else {
        showFeedback(body, false, '还没填完，先把每个空位都补上。');
      }
    });

    sampleBtn.addEventListener('click', () => {
      exampleEl.classList.toggle('show');
    });

    body.appendChild(wrapper);
    body.appendChild(actions);
    body.appendChild(exampleEl);
    return root;
  }

  function renderQuiz(raw) {
    const map = parseKeyValueLines(raw);
    const question = (map.question && map.question[0]) || '请选择正确答案';
    const answer = ((map.answer && map.answer[0]) || '').trim().toLowerCase();
    const explain = (map.explain && map.explain[0]) || '';
    const options = ['a', 'b', 'c', 'd']
      .map((key) => ({ key, text: map[key] ? map[key][0] : '' }))
      .filter((item) => item.text);

    const { root, body } = buildInteractiveShell('quiz', '快速测验');
    root.dataset.interactiveType = 'quiz';

    const q = document.createElement('p');
    q.className = 'quiz-question';
    q.textContent = question;
    body.appendChild(q);

    const choices = document.createElement('div');
    choices.className = 'quiz-options';

    const explainEl = document.createElement('div');
    explainEl.className = 'quiz-explain muted';

    options.forEach((option) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.innerHTML = `<span class="quiz-key">${option.key.toUpperCase()}</span><span>${escapeHtml(option.text)}</span>`;

      btn.addEventListener('click', () => {
        choices.querySelectorAll('.quiz-option').forEach((el) => {
          el.classList.remove('correct', 'wrong');
        });

        const ok = option.key === answer;
        btn.classList.add(ok ? 'correct' : 'wrong');

        if (ok) {
          root.classList.add('solved');
          launchMiniConfetti(root);
          showFeedback(body, true, '✅ 回答正确');
        } else {
          const target = choices.querySelector(`.quiz-option[data-key="${answer}"]`);
          if (target) target.classList.add('correct');
          showFeedback(body, false, '答案不对，再看下关键概念。');
        }

        if (explain) {
          explainEl.textContent = `解析：${explain}`;
          explainEl.classList.add('show');
        }
      });

      btn.dataset.key = option.key;
      choices.appendChild(btn);
    });

    body.appendChild(choices);
    body.appendChild(explainEl);
    return root;
  }

  function parseDragAnswer(rawAnswer) {
    const expected = { must: [], should: [], could: [], wont: [] };
    if (!rawAnswer) return expected;

    String(rawAnswer)
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((chunk) => {
        const idx = chunk.indexOf(':');
        if (idx <= 0) return;
        const zone = normalizeZoneName(chunk.slice(0, idx));
        if (!zone) return;
        const values = chunk
          .slice(idx + 1)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        expected[zone] = values;
      });

    return expected;
  }

  function renderDragSort(raw) {
    const map = parseKeyValueLines(raw);
    const title = (map.title && map.title[0]) || '拖拽排序';
    const items = ((map.items && map.items[0]) || '')
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
    const expected = parseDragAnswer((map.answer && map.answer[0]) || '');

    const { root, body } = buildInteractiveShell('drag-sort', title);
    root.dataset.interactiveType = 'drag-sort';

    const bank = document.createElement('div');
    bank.className = 'drag-bank drag-drop-zone';
    bank.dataset.zone = 'bank';
    bank.innerHTML = '<strong>待排序</strong>';

    const list = document.createElement('div');
    list.className = 'drag-list';
    bank.appendChild(list);

    const zones = document.createElement('div');
    zones.className = 'drag-zones';
    const zoneOrder = [
      { key: 'must', label: 'Must' },
      { key: 'should', label: 'Should' },
      { key: 'could', label: 'Could' },
      { key: 'wont', label: "Won't" },
    ];

    zoneOrder.forEach((zone) => {
      const el = document.createElement('div');
      el.className = 'drag-zone drag-drop-zone';
      el.dataset.zone = zone.key;
      el.innerHTML = `<strong>${zone.label}</strong><div class="drag-list"></div>`;
      zones.appendChild(el);
    });

    let draggingNode = null;
    let touchGhost = null;
    let activeDropZone = null;

    function setDropHighlight(node, on) {
      if (!node) return;
      node.classList.toggle('drag-over', on);
    }

    function getDropZoneByPoint(x, y) {
      const target = document.elementFromPoint(x, y);
      if (!target) return null;
      const zone = target.closest('.drag-drop-zone');
      return zone && root.contains(zone) ? zone : null;
    }

    function moveItemToZone(itemNode, zoneNode) {
      if (!itemNode || !zoneNode) return;
      const zoneList = zoneNode.querySelector('.drag-list');
      if (!zoneList) return;
      zoneList.appendChild(itemNode);
    }

    function createDragItem(text) {
      const item = document.createElement('div');
      item.className = 'drag-item';
      item.draggable = true;
      item.textContent = text;
      item.dataset.value = text;

      item.addEventListener('dragstart', (event) => {
        draggingNode = item;
        item.classList.add('is-dragging');
        if (event.dataTransfer) {
          event.dataTransfer.setData('text/plain', item.dataset.value || '');
          event.dataTransfer.effectAllowed = 'move';
        }
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        draggingNode = null;
        root.querySelectorAll('.drag-drop-zone').forEach((zone) => setDropHighlight(zone, false));
      });

      item.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        draggingNode = item;
        item.classList.add('is-dragging');
        touchGhost = item.cloneNode(true);
        touchGhost.classList.add('touch-ghost');
        touchGhost.style.left = `${touch.clientX}px`;
        touchGhost.style.top = `${touch.clientY}px`;
        document.body.appendChild(touchGhost);
      }, { passive: true });

      item.addEventListener('touchmove', (event) => {
        if (!draggingNode || !touchGhost) return;
        const touch = event.touches[0];
        touchGhost.style.left = `${touch.clientX}px`;
        touchGhost.style.top = `${touch.clientY}px`;

        const zone = getDropZoneByPoint(touch.clientX, touch.clientY);
        if (activeDropZone && activeDropZone !== zone) {
          setDropHighlight(activeDropZone, false);
        }
        if (zone) {
          setDropHighlight(zone, true);
        }
        activeDropZone = zone;
      }, { passive: true });

      item.addEventListener('touchend', (event) => {
        const touch = event.changedTouches[0];
        const zone = getDropZoneByPoint(touch.clientX, touch.clientY) || activeDropZone;
        if (zone) moveItemToZone(item, zone);

        if (touchGhost) touchGhost.remove();
        touchGhost = null;
        item.classList.remove('is-dragging');
        root.querySelectorAll('.drag-drop-zone').forEach((z) => setDropHighlight(z, false));
        activeDropZone = null;
        draggingNode = null;
      }, { passive: true });

      return item;
    }

    items.forEach((item) => {
      list.appendChild(createDragItem(item));
    });

    root.querySelectorAll('.drag-drop-zone').forEach((zone) => {
      zone.addEventListener('dragover', (event) => {
        event.preventDefault();
        setDropHighlight(zone, true);
      });

      zone.addEventListener('dragleave', () => {
        setDropHighlight(zone, false);
      });

      zone.addEventListener('drop', (event) => {
        event.preventDefault();
        setDropHighlight(zone, false);
        if (draggingNode) moveItemToZone(draggingNode, zone);
      });
    });

    const actions = document.createElement('div');
    actions.className = 'interactive-actions';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'btn primary';
    checkBtn.textContent = '检查答案';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn secondary';
    resetBtn.textContent = '重置';

    actions.appendChild(checkBtn);
    actions.appendChild(resetBtn);

    checkBtn.addEventListener('click', () => {
      const result = { must: [], should: [], could: [], wont: [] };
      root.querySelectorAll('.drag-zone').forEach((zone) => {
        const key = normalizeZoneName(zone.dataset.zone);
        if (!key) return;
        result[key] = Array.from(zone.querySelectorAll('.drag-item')).map((el) => el.dataset.value || el.textContent.trim());
      });

      const same = ['must', 'should', 'could', 'wont'].every((key) => {
        const a = [...result[key]].sort().join('|');
        const b = [...(expected[key] || [])].sort().join('|');
        return a === b;
      });

      if (same) {
        root.classList.add('solved');
        launchMiniConfetti(root);
        showFeedback(body, true, '✅ 排序正确，优先级判断到位。');
      } else {
        showFeedback(body, false, '排序还不对，检查 Must 和 Won\'t 的边界。');
      }
    });

    resetBtn.addEventListener('click', () => {
      const bankList = bank.querySelector('.drag-list');
      const allItems = Array.from(root.querySelectorAll('.drag-item'));
      allItems.forEach((item) => bankList.appendChild(item));
      root.classList.remove('solved');
      const feedback = body.querySelector('.interactive-feedback');
      if (feedback) feedback.remove();
    });

    body.appendChild(bank);
    body.appendChild(zones);
    body.appendChild(actions);
    return root;
  }

  function renderFlipCard(raw) {
    const lines = String(raw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const pairs = lines
      .map((line) => {
        const idx = line.indexOf('|');
        if (idx <= 0) return null;
        return {
          front: line.slice(0, idx).trim(),
          back: line.slice(idx + 1).trim(),
        };
      })
      .filter(Boolean);

    const { root, body } = buildInteractiveShell('flip-card', '翻牌记忆');
    root.dataset.interactiveType = 'flip-card';

    const grid = document.createElement('div');
    grid.className = 'flip-grid';

    pairs.forEach((pair) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'flip-card';
      card.innerHTML = `
        <span class="flip-inner">
          <span class="flip-face flip-front">${escapeHtml(pair.front)}</span>
          <span class="flip-face flip-back">${escapeHtml(pair.back)}</span>
        </span>
      `;

      card.addEventListener('click', () => {
        card.classList.toggle('flipped');
      });

      grid.appendChild(card);
    });

    body.appendChild(grid);
    return root;
  }

  function render(type, payload) {
    const normalizedType = String(type || '').trim().toLowerCase();
    if (normalizedType === 'drag-sort') return renderDragSort(payload);
    if (normalizedType === 'quiz') return renderQuiz(payload);
    if (normalizedType === 'fill-blank') return renderFillBlank(payload);
    if (normalizedType === 'flip-card') return renderFlipCard(payload);
    return null;
  }

  window.DevHandbookInteractive = {
    render,
  };
}());
