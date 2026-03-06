(function () {
  const GLOSSARY = {
    API: { title: 'API', emoji: '🔌', definition: 'API 就像软件之间的点餐窗口。前端把需求给它，它再去后端拿数据回来。' },
    前端: { title: '前端', emoji: '🖼️', definition: '前端是用户看得到、点得到的界面部分，比如按钮、页面、表单和交互动画。' },
    后端: { title: '后端', emoji: '⚙️', definition: '后端负责业务逻辑和数据处理，通常不直接展示给用户，但决定产品是否稳定好用。' },
    数据库: { title: '数据库', emoji: '🗄️', definition: '数据库是产品的数据仓库，用户信息、订单、内容都长期存放在这里。' },
    Supabase: { title: 'Supabase', emoji: '🟢', definition: 'Supabase 是一个后端服务平台，帮你快速拥有数据库、登录和接口能力。' },
    Git: { title: 'Git', emoji: '🌿', definition: 'Git 是版本管理工具，能记录每次代码变化，出错时也能快速回退。' },
    GitHub: { title: 'GitHub', emoji: '🐙', definition: 'GitHub 是托管 Git 仓库的平台，常用来协作开发、代码审查和发布。' },
    PRD: { title: 'PRD', emoji: '📄', definition: 'PRD 是产品需求文档，讲清楚目标用户、核心功能和验收标准。' },
    MVP: { title: 'MVP', emoji: '🚧', definition: 'MVP 是最小可行产品，只做最关键功能，先验证需求再扩展。' },
    灰度发布: { title: '灰度发布', emoji: '🎯', definition: '灰度发布是先让一小部分用户用新版本，确认没问题后再逐步全量。' },
    回滚: { title: '回滚', emoji: '↩️', definition: '回滚是把系统切回上一版稳定状态，常用于新版本出现严重问题时止损。' },
    部署: { title: '部署', emoji: '🚀', definition: '部署就是把本地代码放到线上服务器，让真实用户可以访问。' },
    'CI/CD': { title: 'CI/CD', emoji: '🤖', definition: 'CI/CD 是自动化流程，帮你自动测试、打包和发布，减少手工出错。' },
    版本管理: { title: '版本管理', emoji: '📚', definition: '版本管理就是跟踪变更历史，知道谁改了什么、为什么改。' },
    埋点: { title: '埋点', emoji: '📍', definition: '埋点是记录用户行为的数据点，比如点击、停留、转化，用于分析体验。' },
    'A/B测试': { title: 'A/B测试', emoji: '🧪', definition: 'A/B测试是给不同用户看到不同方案，用真实数据选效果更好的版本。' },
    SDK: { title: 'SDK', emoji: '🧰', definition: 'SDK 是一组现成开发工具包，接入后能更快使用某个平台能力。' },
    CDN: { title: 'CDN', emoji: '🌐', definition: 'CDN 会把静态资源分发到离用户更近的节点，提升访问速度。' },
    DNS: { title: 'DNS', emoji: '🧭', definition: 'DNS 像互联网电话簿，把域名翻译成服务器 IP 地址。' },
    localStorage: { title: 'localStorage', emoji: '💾', definition: 'localStorage 是浏览器本地存储，小量数据可长期保存，刷新页面也不会丢。' },
  };

  const TERM_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const TERM_PATTERN = new RegExp(`(${TERM_KEYS.map(escapeRegExp).join('|')})`, 'gi');
  const TERM_INDEX = TERM_KEYS.reduce((acc, key) => {
    acc[key.toLowerCase()] = key;
    return acc;
  }, {});

  const SHEET_ID = 'glossary-sheet-overlay';
  let touchStartY = 0;

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function canonicalKey(raw) {
    if (GLOSSARY[raw]) return raw;
    return TERM_INDEX[String(raw).toLowerCase()] || null;
  }

  function createSheet() {
    const existing = document.getElementById(SHEET_ID);
    if (existing) return existing;

    const overlay = document.createElement('div');
    overlay.id = SHEET_ID;
    overlay.className = 'glossary-sheet-overlay';
    overlay.innerHTML = `
      <div class="glossary-sheet" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
        <div class="glossary-sheet-handle" aria-hidden="true"></div>
        <h3 id="glossary-title" class="glossary-title"></h3>
        <p class="glossary-definition"></p>
        <button type="button" class="btn primary glossary-dismiss">懂了</button>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.glossary-dismiss')) {
        closeSheet();
      }
    });

    const sheet = overlay.querySelector('.glossary-sheet');
    sheet.addEventListener('touchstart', (event) => {
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    sheet.addEventListener('touchmove', (event) => {
      const delta = event.touches[0].clientY - touchStartY;
      if (delta <= 0) return;
      sheet.style.transform = `translateY(${Math.min(delta, 100)}px)`;
    }, { passive: true });

    sheet.addEventListener('touchend', (event) => {
      const delta = event.changedTouches[0].clientY - touchStartY;
      sheet.style.transform = '';
      if (delta > 60) closeSheet();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSheet();
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function openSheet(term) {
    const key = canonicalKey(term);
    if (!key) return;
    const data = GLOSSARY[key];
    const overlay = createSheet();

    const title = overlay.querySelector('.glossary-title');
    const definition = overlay.querySelector('.glossary-definition');
    title.textContent = `${data.emoji} ${data.title}`;
    definition.textContent = data.definition;

    requestAnimationFrame(() => {
      overlay.classList.add('open');
    });
  }

  function closeSheet() {
    const overlay = document.getElementById(SHEET_ID);
    if (!overlay) return;
    overlay.classList.remove('open');
  }

  function shouldSkipTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    return Boolean(parent.closest('code, pre, a, script, style, textarea, .glossary-term'));
  }

  function replaceTextNode(node) {
    const text = node.nodeValue;
    if (!text || !TERM_PATTERN.test(text)) return;
    TERM_PATTERN.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let last = 0;

    text.replace(TERM_PATTERN, (match, _group, offset) => {
      if (offset > last) {
        fragment.appendChild(document.createTextNode(text.slice(last, offset)));
      }

      const key = canonicalKey(match);
      if (!key) {
        fragment.appendChild(document.createTextNode(match));
      } else {
        const span = document.createElement('span');
        span.className = 'glossary-term';
        span.dataset.term = key;
        span.setAttribute('role', 'button');
        span.setAttribute('tabindex', '0');
        span.textContent = match;
        fragment.appendChild(span);
      }

      last = offset + match.length;
      return match;
    });

    if (last < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(last)));
    }

    node.parentNode.replaceChild(fragment, node);
  }

  function wrapTerms(html) {
    if (!html || typeof html !== 'string') return html;
    const root = document.createElement('div');
    root.innerHTML = html;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
      if (!shouldSkipTextNode(node)) targets.push(node);
    }

    targets.forEach(replaceTextNode);
    return root.innerHTML;
  }

  function bindGlossaryEvents(root = document) {
    if (root.dataset.glossaryBound === 'true') return;

    root.addEventListener('click', (event) => {
      const trigger = event.target.closest('.glossary-term');
      if (!trigger) return;
      openSheet(trigger.dataset.term);
    });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const trigger = event.target.closest('.glossary-term');
      if (!trigger) return;
      event.preventDefault();
      openSheet(trigger.dataset.term);
    });

    root.dataset.glossaryBound = 'true';
  }

  function init() {
    bindGlossaryEvents(document.body);
  }

  window.DevHandbookGlossary = {
    GLOSSARY,
    wrapTerms,
    openSheet,
    closeSheet,
    init,
  };
})();
