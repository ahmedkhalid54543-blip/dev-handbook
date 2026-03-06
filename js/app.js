const STORAGE_KEY = 'devHandbook';

const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  progress: {},
  diagnosis: {
    firstScore: null,
    latestScore: null,
    answers: {},
    lastTaken: null,
  },
  lastVisited: null,
  exportedAt: null,
};

function normalizeState(state) {
  const normalized = { ...structuredClone(DEFAULT_STATE), ...(state || {}) };
  normalized.xp = Number.isFinite(Number(normalized.xp)) ? Number(normalized.xp) : 0;
  normalized.level = Number.isFinite(Number(normalized.level)) ? Number(normalized.level) : 1;

  if (!normalized.progress || typeof normalized.progress !== 'object') {
    normalized.progress = {};
  }

  Object.keys(normalized.progress).forEach((key) => {
    const stageProgress = normalized.progress[key];
    if (!stageProgress || typeof stageProgress !== 'object') {
      normalized.progress[key] = {
        completed: false,
        sectionsRead: [],
        checklist: [],
        exercisesDone: [],
        stageBonusAwarded: false,
      };
      return;
    }
    if (!Array.isArray(stageProgress.sectionsRead)) stageProgress.sectionsRead = [];
    if (!Array.isArray(stageProgress.checklist)) stageProgress.checklist = [];
    if (!Array.isArray(stageProgress.exercisesDone)) stageProgress.exercisesDone = [];
    if (typeof stageProgress.stageBonusAwarded !== 'boolean') stageProgress.stageBonusAwarded = false;
  });

  return normalized;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (err) {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // storage full or unavailable
  }
}

function ensureStageProgress(state, stageId, checklistLength = 0) {
  const key = `stage-${stageId}`;
  if (!state.progress[key]) {
    state.progress[key] = {
      completed: false,
      sectionsRead: [],
      checklist: new Array(checklistLength).fill(false),
      exercisesDone: [],
      stageBonusAwarded: false,
    };
  } else if (checklistLength && state.progress[key].checklist.length !== checklistLength) {
    const current = state.progress[key].checklist;
    const updated = new Array(checklistLength).fill(false);
    for (let i = 0; i < Math.min(current.length, updated.length); i += 1) {
      updated[i] = current[i];
    }
    state.progress[key].checklist = updated;
  }
  if (!Array.isArray(state.progress[key].exercisesDone)) {
    state.progress[key].exercisesDone = [];
  }
  if (typeof state.progress[key].stageBonusAwarded !== 'boolean') {
    state.progress[key].stageBonusAwarded = false;
  }
  return state.progress[key];
}

function setLastVisited(stageId, sectionId) {
  const state = loadState();
  state.lastVisited = { stage: stageId, section: sectionId };
  saveState(state);
}

function markStageCompleted(stageId, completed) {
  const state = loadState();
  const progress = ensureStageProgress(state, stageId);
  progress.completed = completed;
  saveState(state);
}

function getTotalCompletedStages(state, totalStages) {
  let count = 0;
  for (let i = 1; i <= totalStages; i += 1) {
    const id = String(i).padStart(2, '0');
    const progress = state.progress[`stage-${id}`];
    if (progress && progress.completed) count += 1;
  }
  return count;
}

function initBottomNav() {
  const page = document.body.dataset.page;
  const navLinks = document.querySelectorAll('.bottom-nav a');
  navLinks.forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });
}

function setupTableOverflowHints(root = document) {
  const scope = root || document;
  const wrappers = scope.querySelectorAll('.table-wrapper');

  wrappers.forEach((wrapper) => {
    const table = wrapper.querySelector('table');
    if (!table) return;

    table.setAttribute('role', 'region');
    if (!table.getAttribute('aria-label')) {
      table.setAttribute('aria-label', '数据表，可左右滚动');
    }

    let hint = wrapper.previousElementSibling;
    if (!hint || !hint.classList.contains('table-scroll-hint')) {
      hint = document.createElement('p');
      hint.className = 'table-scroll-hint';
      hint.textContent = '左右滑动查看完整表格 →';
      wrapper.parentNode.insertBefore(hint, wrapper);
    }

    const updateOverflowState = () => {
      const isOverflowing = wrapper.scrollWidth > wrapper.clientWidth + 1;
      wrapper.classList.toggle('is-overflowing', isOverflowing);
      hint.classList.toggle('is-visible', isOverflowing);
    };

    updateOverflowState();
    if (!wrapper.dataset.hintBound) {
      wrapper.addEventListener('scroll', updateOverflowState, { passive: true });
      wrapper.dataset.hintBound = 'true';
    }
    if (!wrapper.dataset.hintResizeBound) {
      window.addEventListener('resize', updateOverflowState);
      wrapper.dataset.hintResizeBound = 'true';
    }
  });
}

function updateProgressRing(container, completed, total) {
  if (!container) return;
  const circle = container.querySelector('circle[data-progress]');
  const text = container.querySelector('.progress-text');
  if (!circle || !text) return;
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = `${circumference}`;
  const ratio = total > 0 ? completed / total : 0;
  circle.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
  text.textContent = `${completed}/${total}`;
}

function setupExportImport() {
  const exportBtn = document.getElementById('export-progress');
  const importInput = document.getElementById('import-progress');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const state = loadState();
      state.exportedAt = new Date().toISOString();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dev-handbook-progress.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  if (importInput) {
    importInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          saveState(parsed);
          window.location.reload();
        } catch (err) {
          alert('导入失败，请检查文件格式。');
        }
      };
      reader.readAsText(file);
    });
  }
}

window.DevHandbook = {
  loadState,
  saveState,
  ensureStageProgress,
  setLastVisited,
  markStageCompleted,
  getTotalCompletedStages,
  updateProgressRing,
  initBottomNav,
  setupTableOverflowHints,
  setupExportImport,
};
