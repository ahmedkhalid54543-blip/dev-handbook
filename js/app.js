const STORAGE_KEY = 'devHandbook';

const DEFAULT_STATE = {
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (err) {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureStageProgress(state, stageId, checklistLength = 0) {
  const key = `stage-${stageId}`;
  if (!state.progress[key]) {
    state.progress[key] = {
      completed: false,
      sectionsRead: [],
      checklist: new Array(checklistLength).fill(false),
      exercisesDone: [],
    };
  } else if (checklistLength && state.progress[key].checklist.length !== checklistLength) {
    const current = state.progress[key].checklist;
    const updated = new Array(checklistLength).fill(false);
    for (let i = 0; i < Math.min(current.length, updated.length); i += 1) {
      updated[i] = current[i];
    }
    state.progress[key].checklist = updated;
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
  setupExportImport,
};
