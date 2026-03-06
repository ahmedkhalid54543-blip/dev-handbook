(function () {
  const LEVELS = [
    { level: 1, xp: 0, title: '🌱 产品小白' },
    { level: 2, xp: 100, title: '📝 需求分析师' },
    { level: 3, xp: 250, title: '📋 PRD 架构师' },
    { level: 4, xp: 450, title: '🏗️ 技术理解者' },
    { level: 5, xp: 700, title: '⚡ 开发协作者' },
    { level: 6, xp: 1000, title: '🐛 质量守护者' },
    { level: 7, xp: 1350, title: '🚀 发布指挥官' },
    { level: 8, xp: 1750, title: '🎯 灰度大师' },
    { level: 9, xp: 2200, title: '♻️ 全栈产品人' },
  ];

  const ABILITIES = {
    2: '你能看穿「我想做个App」背后真正的需求了',
    3: '你写的 PRD 能让 AI 精准理解你要什么',
    4: '开发说的「前端后端API」你不再一脸懵',
    5: '你能跟 AI 高效协作，返工率降低 80%',
    6: '你知道「我试了没问题」为什么是最大的谎言',
    7: '你能把产品从电脑部署到全世界',
    8: '你不会再犯「全量发布然后数据全丢」的错',
    9: '恭喜！你已经是能独立跟 AI 做产品的全栈产品人',
  };

  const BAR_ID = 'rpg-progress-bar';
  const MODAL_ID = 'level-up-modal';

  let currentStageColor = '#448AFF';
  let initialized = false;

  function clampLevel(level) {
    return Math.max(1, Math.min(LEVELS.length, level));
  }

  function getLevelByXp(xp) {
    let current = LEVELS[0];
    for (let i = 0; i < LEVELS.length; i += 1) {
      if (xp >= LEVELS[i].xp) current = LEVELS[i];
      else break;
    }
    return current;
  }

  function ensurePlayerState(state) {
    if (!Number.isFinite(Number(state.xp))) state.xp = 0;
    state.xp = Math.max(0, Number(state.xp));

    const derived = getLevelByXp(state.xp);
    if (!Number.isFinite(Number(state.level))) {
      state.level = derived.level;
    } else {
      state.level = clampLevel(Number(state.level));
      if (derived.level !== state.level) state.level = derived.level;
    }

    return state;
  }

  function getLevelInfo(level) {
    return LEVELS[clampLevel(level) - 1];
  }

  function getProgressData(state) {
    ensurePlayerState(state);
    const current = getLevelInfo(state.level);
    const next = LEVELS[state.level] || null;
    if (!next) {
      return {
        current,
        next: null,
        progressRatio: 1,
        progressText: `MAX ${state.xp} XP`,
      };
    }

    const span = next.xp - current.xp;
    const gained = state.xp - current.xp;
    const progressRatio = span > 0 ? Math.max(0, Math.min(1, gained / span)) : 1;

    return {
      current,
      next,
      progressRatio,
      progressText: `${state.xp}/${next.xp} XP`,
    };
  }

  function renderBar() {
    const state = ensurePlayerState(window.DevHandbook.loadState());
    let bar = document.getElementById(BAR_ID);
    if (!bar) {
      bar = document.createElement('div');
      bar.id = BAR_ID;
      bar.className = 'rpg-progress-bar';
      bar.innerHTML = `
        <div class="rpg-level-row">
          <div class="rpg-level-title" data-rpg-title></div>
          <div class="rpg-level-xp" data-rpg-xp></div>
        </div>
        <div class="rpg-progress-track">
          <div class="rpg-progress-fill" data-rpg-fill></div>
        </div>
      `;
      document.body.appendChild(bar);
    }

    const { current, progressRatio, progressText } = getProgressData(state);
    const titleEl = bar.querySelector('[data-rpg-title]');
    const xpEl = bar.querySelector('[data-rpg-xp]');
    const fillEl = bar.querySelector('[data-rpg-fill]');

    if (titleEl) titleEl.textContent = `${current.title}`;
    if (xpEl) xpEl.textContent = progressText;
    if (fillEl) fillEl.style.width = `${Math.round(progressRatio * 100)}%`;

    bar.style.setProperty('--rpg-stage-color', currentStageColor);
  }

  function createConfetti(container) {
    const confetti = document.createElement('div');
    confetti.className = 'rpg-level-confetti';
    const colors = ['#FF6B35', '#FF5252', '#448AFF', '#00BCD4', '#66BB6A', '#FFD700'];

    for (let i = 0; i < 36; i += 1) {
      const piece = document.createElement('span');
      piece.className = 'rpg-confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.animationDuration = `${1.6 + Math.random()}s`;
      confetti.appendChild(piece);
    }

    container.appendChild(confetti);
  }

  function showLevelUpModal(level) {
    const info = getLevelInfo(level);
    const ability = ABILITIES[level] || '继续前进，解锁更多能力。';

    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'level-up-modal';
    modal.innerHTML = `
      <div class="level-up-panel" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
        <h2 id="level-up-title">升级成功！</h2>
        <p class="level-up-rank">${info.title}</p>
        <p class="level-up-ability">你解锁了新能力: ${ability}</p>
        <button type="button" class="btn primary level-up-close">太好了，继续闯关</button>
      </div>
    `;

    createConfetti(modal);
    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 220);
    };

    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });

    const closeBtn = modal.querySelector('.level-up-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    requestAnimationFrame(() => modal.classList.add('open'));
  }

  function awardXp(amount, options = {}) {
    const gain = Number(amount) || 0;
    if (gain <= 0) return;

    const state = ensurePlayerState(window.DevHandbook.loadState());
    const previousLevel = state.level;
    state.xp += gain;

    const updated = ensurePlayerState(state);
    window.DevHandbook.saveState(updated);

    if (options.stageColor) {
      currentStageColor = options.stageColor;
    }

    renderBar();

    if (updated.level > previousLevel) {
      for (let level = previousLevel + 1; level <= updated.level; level += 1) {
        showLevelUpModal(level);
      }
    }
  }

  function init(options = {}) {
    if (options.stageColor) {
      currentStageColor = options.stageColor;
    }

    const state = ensurePlayerState(window.DevHandbook.loadState());
    window.DevHandbook.saveState(state);

    renderBar();
    initialized = true;
  }

  function setStageColor(color) {
    if (!color) return;
    currentStageColor = color;
    if (initialized) renderBar();
  }

  window.DevHandbookRPG = {
    LEVELS,
    ABILITIES,
    ensurePlayerState,
    getProgressData,
    awardXp,
    init,
    setStageColor,
    renderBar,
  };
})();
