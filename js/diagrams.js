(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function escapeXml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function splitText(text, maxChars) {
    const raw = String(text ?? '').trim();
    if (!raw) return [''];
    const chunks = [];
    let line = '';
    for (const char of raw) {
      line += char;
      if (line.length >= maxChars) {
        chunks.push(line);
        line = '';
      }
    }
    if (line) chunks.push(line);
    return chunks;
  }

  function lineText(x, y, text, opts) {
    const options = opts || {};
    const lines = splitText(text, options.maxChars || 14);
    const anchor = options.anchor || 'middle';
    const lineHeight = options.lineHeight || 18;
    const cls = options.className || 'diagram-text';
    const startDy = options.startDy || 0;
    let html = `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">`;
    lines.forEach((line, index) => {
      const dy = index === 0 ? startDy : lineHeight;
      html += `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    });
    html += '</text>';
    return html;
  }

  function parseLines(raw) {
    return String(raw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function makeContainer(svgMarkup, ariaLabel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'diagram-container diagram-reveal';
    wrapper.innerHTML = svgMarkup;
    const svg = wrapper.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', ariaLabel || '学习图示');
    }
    observeReveal(wrapper);
    return wrapper;
  }

  function renderPyramid(raw) {
    const rows = parseLines(raw)
      .map((line) => line.split('|').map((part) => part.trim()))
      .filter((parts) => parts.length >= 3)
      .slice(0, 5);

    if (!rows.length) return null;

    const width = 760;
    const height = 420;
    const topY = 80;
    const step = 88;
    const minWidth = 220;
    const widthStep = 120;

    let shapes = '';
    rows.forEach((parts, index) => {
      const label = parts[0] || `层级${index + 1}`;
      const title = parts[1] || '';
      const desc = parts[2] || '';
      const color = parts[3] || ['#FF6B35', '#7C4DFF', '#448AFF', '#00BCD4'][index % 4];

      const wTop = minWidth + index * widthStep;
      const wBottom = minWidth + (index + 1) * widthStep;
      const y = topY + index * step;
      const y2 = y + step - 8;
      const cx = width / 2;
      const p1 = `${cx - wTop / 2},${y}`;
      const p2 = `${cx + wTop / 2},${y}`;
      const p3 = `${cx + wBottom / 2},${y2}`;
      const p4 = `${cx - wBottom / 2},${y2}`;

      shapes += `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${color}" opacity="0.88" />`;
      shapes += lineText(cx, y + 30, `${label} · ${title}`, { maxChars: 14, className: 'diagram-text title' });
      shapes += lineText(cx, y + 52, desc, { maxChars: 20, className: 'diagram-text subtle' });
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        ${shapes}
      </svg>
    `;
    return makeContainer(svg, '金字塔图');
  }

  function renderMatrix(raw) {
    const lines = parseLines(raw);
    const data = {};
    lines.forEach((line) => {
      const parts = line.split('|').map((part) => part.trim());
      const key = (parts[0] || '').toLowerCase();
      data[key] = parts.slice(1);
    });

    const title = (data.title && data.title[0]) || '四象限矩阵';
    const cells = [
      { key: 'tl', x: 70, y: 90, color: '#FF5252' },
      { key: 'tr', x: 390, y: 90, color: '#FF6B35' },
      { key: 'bl', x: 70, y: 250, color: '#FFD54F' },
      { key: 'br', x: 390, y: 250, color: '#CFD8DC' },
    ];

    let blocks = '';
    cells.forEach((cell) => {
      const values = data[cell.key] || [];
      const head = values[0] || '待补充';
      const desc = values[1] || '';
      blocks += `<rect x="${cell.x}" y="${cell.y}" width="300" height="130" rx="14" fill="${cell.color}" opacity="0.18" stroke="${cell.color}" />`;
      blocks += lineText(cell.x + 150, cell.y + 34, head, { maxChars: 13, className: 'diagram-text title' });
      blocks += lineText(cell.x + 150, cell.y + 60, desc, { maxChars: 16, className: 'diagram-text subtle' });
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 760 410" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="736" height="386" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        ${lineText(380, 52, title, { maxChars: 18, className: 'diagram-text headline' })}
        <line x1="380" y1="90" x2="380" y2="380" stroke="#94A3B8" stroke-dasharray="4 6" />
        <line x1="70" y1="240" x2="690" y2="240" stroke="#94A3B8" stroke-dasharray="4 6" />
        ${blocks}
      </svg>
    `;
    return makeContainer(svg, '矩阵图');
  }

  function renderFlow(raw) {
    const text = parseLines(raw).join(' ');
    const nodes = text
      .split(/(?:→|->|➜|➡️)/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!nodes.length) return null;

    const nodeWidth = 150;
    const gap = 36;
    const width = Math.max(760, 80 + nodes.length * nodeWidth + (nodes.length - 1) * gap);
    const height = 220;

    let items = '';
    nodes.forEach((node, index) => {
      const x = 40 + index * (nodeWidth + gap);
      items += `<rect x="${x}" y="86" width="${nodeWidth}" height="58" rx="12" fill="#FFFFFF" stroke="#448AFF" stroke-width="2" />`;
      items += lineText(x + nodeWidth / 2, 116, node, { maxChars: 10, className: 'diagram-text title' });
      if (index < nodes.length - 1) {
        const ax = x + nodeWidth + 8;
        const ay = 115;
        items += `<line x1="${ax}" y1="${ay}" x2="${ax + gap - 16}" y2="${ay}" stroke="#64748B" stroke-width="2" />`;
        items += `<polygon points="${ax + gap - 16},${ay - 6} ${ax + gap - 4},${ay} ${ax + gap - 16},${ay + 6}" fill="#64748B" />`;
      }
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        ${items}
      </svg>
    `;
    return makeContainer(svg, '流程图');
  }

  function renderTimeline(raw) {
    const items = parseLines(raw)
      .map((line) => line.split('|').map((part) => part.trim()))
      .filter((parts) => parts.length >= 3)
      .slice(0, 6);

    if (!items.length) return null;

    const width = 760;
    const height = 420;
    const startX = 100;
    const endX = 660;
    const y = 210;
    const gap = items.length > 1 ? (endX - startX) / (items.length - 1) : 0;

    let points = '';
    items.forEach((item, index) => {
      const x = startX + index * gap;
      const version = item[0] || `v${index + 1}`;
      const label = item[1] || '';
      const desc = item[2] || '';
      const color = item[3] || ['#FF5252', '#FF6B35', '#66BB6A', '#448AFF'][index % 4];

      points += `<circle cx="${x}" cy="${y}" r="18" fill="${color}" />`;
      points += lineText(x, y - 86, version, { maxChars: 8, className: 'diagram-text headline' });
      points += lineText(x, y + 44, label, { maxChars: 9, className: 'diagram-text title' });
      points += lineText(x, y + 66, desc, { maxChars: 12, className: 'diagram-text subtle' });
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="736" height="396" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        <line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" stroke="#94A3B8" stroke-width="3" />
        ${points}
      </svg>
    `;
    return makeContainer(svg, '时间线图');
  }

  function renderCompare(raw) {
    const lines = parseLines(raw);
    const data = {};
    lines.forEach((line) => {
      const parts = line.split('|').map((part) => part.trim());
      data[(parts[0] || '').toLowerCase()] = parts.slice(1);
    });

    const title = (data.title && data.title[0]) || '方案对比';
    const cols = Object.keys(data)
      .filter((key) => /^col\d+$/.test(key))
      .sort()
      .map((key) => data[key]);

    if (!cols.length) return null;

    const colCount = cols.length;
    const width = Math.max(760, 120 + colCount * 220);
    const gap = 24;
    const colWidth = (width - 80 - (colCount - 1) * gap) / colCount;
    let html = '';

    cols.forEach((col, index) => {
      const x = 40 + index * (colWidth + gap);
      const name = col[0] || `方案${index + 1}`;
      const bullets = col.slice(1, 5).filter(Boolean);
      html += `<rect x="${x}" y="90" width="${colWidth}" height="250" rx="14" fill="#FFFFFF" stroke="#CBD5E1" />`;
      html += `<rect x="${x}" y="90" width="${colWidth}" height="52" rx="14" fill="${['#448AFF', '#7C4DFF', '#FF6B35', '#00BCD4'][index % 4]}" opacity="0.14" />`;
      html += lineText(x + colWidth / 2, 122, name, { maxChars: 10, className: 'diagram-text headline' });
      bullets.forEach((bullet, bulletIndex) => {
        const ty = 170 + bulletIndex * 42;
        html += `<circle cx="${x + 24}" cy="${ty - 4}" r="4" fill="#334155" />`;
        html += lineText(x + 34, ty, bullet, { maxChars: 14, className: 'diagram-text subtle', anchor: 'start' });
      });
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 ${width} 380" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="${width - 24}" height="356" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        ${lineText(width / 2, 56, title, { maxChars: 16, className: 'diagram-text headline' })}
        ${html}
      </svg>
    `;
    return makeContainer(svg, '对比图');
  }

  function renderCards(raw) {
    const cards = parseLines(raw)
      .map((line) => line.split('|').map((part) => part.trim()))
      .filter((parts) => parts.length >= 3)
      .slice(0, 10);

    if (!cards.length) return null;

    const cols = 2;
    const cardWidth = 330;
    const cardHeight = 108;
    const gapX = 24;
    const gapY = 18;
    const rows = Math.ceil(cards.length / cols);
    const width = 760;
    const height = 70 + rows * cardHeight + (rows - 1) * gapY + 34;

    let html = '';
    cards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = 40 + col * (cardWidth + gapX);
      const y = 52 + row * (cardHeight + gapY);
      const icon = card[0] || '•';
      const title = card[1] || '';
      const desc = card.slice(2).join(' | ');
      html += `<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="14" fill="#F8FAFC" stroke="#D8E2EF" />`;
      html += lineText(x + 28, y + 36, icon, { maxChars: 2, className: 'diagram-text headline', anchor: 'start' });
      html += lineText(x + 64, y + 34, title, { maxChars: 10, className: 'diagram-text title', anchor: 'start' });
      html += lineText(x + 64, y + 58, desc, { maxChars: 16, className: 'diagram-text subtle', anchor: 'start' });
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        ${html}
      </svg>
    `;
    return makeContainer(svg, '卡片图');
  }

  function renderFunnel(raw) {
    const rows = parseLines(raw)
      .map((line) => line.split('|').map((part) => part.trim()))
      .filter((parts) => parts.length >= 2)
      .slice(0, 5);

    if (!rows.length) return null;

    const width = 760;
    const height = 420;
    const center = width / 2;
    const topY = 70;
    const rowHeight = 92;

    let html = '';
    rows.forEach((row, index) => {
      const title = row[0] || '';
      const desc = row[1] || '';
      const color = row[2] || ['#448AFF', '#7C4DFF', '#FF6B35', '#66BB6A'][index % 4];
      const wTop = 520 - index * 100;
      const wBottom = 420 - index * 100;
      const y = topY + index * rowHeight;
      const y2 = y + rowHeight - 10;
      const p1 = `${center - wTop / 2},${y}`;
      const p2 = `${center + wTop / 2},${y}`;
      const p3 = `${center + wBottom / 2},${y2}`;
      const p4 = `${center - wBottom / 2},${y2}`;
      html += `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${color}" opacity="0.82" />`;
      html += lineText(center, y + 30, title, { maxChars: 12, className: 'diagram-text title' });
      html += lineText(center, y + 52, desc, { maxChars: 18, className: 'diagram-text subtle' });
    });

    const svg = `
      <svg class="diagram-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <rect x="12" y="12" width="736" height="396" rx="18" fill="#FFFFFF" stroke="#E2E8F0" />
        ${html}
      </svg>
    `;
    return makeContainer(svg, '漏斗图');
  }

  const renderers = {
    pyramid: renderPyramid,
    matrix: renderMatrix,
    flow: renderFlow,
    timeline: renderTimeline,
    compare: renderCompare,
    cards: renderCards,
    'checklist-visual': renderCards,
    funnel: renderFunnel,
  };

  let observer;
  function observeReveal(node) {
    if (!('IntersectionObserver' in window)) {
      node.classList.add('revealed');
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16 }
      );
    }
    observer.observe(node);
  }

  function render(type, raw) {
    const key = String(type || '').trim().toLowerCase();
    const renderer = renderers[key];
    if (!renderer) return null;
    try {
      return renderer(raw);
    } catch (err) {
      console.warn('Diagram render failed:', key, err);
      return null;
    }
  }

  window.DevHandbookDiagrams = {
    render,
  };
})();
