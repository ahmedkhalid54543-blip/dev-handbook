function renderDiagnosis(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const toggleBtn = container.querySelector('[data-diagnosis-toggle]');
  const panel = container.querySelector('[data-diagnosis-panel]');
  const loading = container.querySelector('[data-diagnosis-loading]');
  const content = container.querySelector('[data-diagnosis-content]');

  let loaded = false;

  const setLoading = (message) => {
    loading.classList.add('loading');
    loading.classList.remove('loading-error');
    loading.innerHTML = `
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>${message}</span>
    `;
    loading.hidden = false;
  };

  const setError = (message) => {
    loading.classList.remove('loading');
    loading.classList.add('loading-error');
    loading.innerHTML = `
      <span>${message}</span>
      <div class="loading-actions">
        <button class="btn secondary" type="button" data-diagnosis-retry>重试加载</button>
      </div>
    `;
    loading.hidden = false;
    const retryBtn = loading.querySelector('[data-diagnosis-retry]');
    if (retryBtn) {
      retryBtn.addEventListener('click', loadQuiz);
    }
  };

  const loadQuiz = async () => {
    if (loaded) return;
    setLoading('加载中...');
    try {
      const response = await fetch('data/diagnosis.json');
      if (!response.ok) throw new Error('Diagnosis fetch failed');
      const data = await response.json();
      buildQuiz(content, data);
      loaded = true;
      loading.hidden = true;
    } catch (err) {
      setError('加载失败，请稍后重试。');
    }
  };

  const togglePanel = () => {
    panel.classList.toggle('open');
    if (!loaded) {
      loadQuiz();
    }
  };

  if (toggleBtn) {
    toggleBtn.addEventListener('click', togglePanel);
  }
}

function buildQuiz(root, data) {
  root.innerHTML = '';
  const state = window.DevHandbook.loadState();
  const savedAnswers = state.diagnosis.answers || {};

  const title = document.createElement('h3');
  title.textContent = data.title;
  root.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'muted';
  desc.textContent = data.description;
  root.appendChild(desc);

  const form = document.createElement('form');
  form.className = 'diagnosis-form';

  data.questions.forEach((question, index) => {
    const block = document.createElement('div');
    block.className = 'quiz-question';

    const qTitle = document.createElement('h4');
    qTitle.textContent = `${index + 1}. ${question.text}`;
    block.appendChild(qTitle);

    const options = document.createElement('div');
    options.className = 'quiz-options';

    question.options.forEach((option, optIndex) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q-${index}`;
      input.value = option.score;
      if (savedAnswers[index] === option.score) {
        input.checked = true;
      }
      const span = document.createElement('span');
      span.textContent = option.text;
      label.appendChild(input);
      label.appendChild(span);
      options.appendChild(label);
    });

    block.appendChild(options);
    form.appendChild(block);
  });

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'btn primary';
  submit.textContent = '查看诊断结果';
  submit.addEventListener('click', () => {
    const answers = {};
    let score = 0;
    const recommended = new Set();
    const prevFirst = window.DevHandbook.loadState().diagnosis.firstScore;

    data.questions.forEach((question, index) => {
      const selected = form.querySelector(`input[name="q-${index}"]:checked`);
      const value = selected ? Number(selected.value) : 0;
      answers[index] = value;
      score += value;
      if (value <= question.weight / 2) {
        question.relatedStages.forEach((stage) => recommended.add(stage));
      }
    });

    const range = data.scoreRanges.find((item) => score >= item.min && score <= item.max);

    const result = document.createElement('div');
    result.className = 'quiz-result';
    const emoji = range ? range.emoji : '📊';
    const stageLinks = recommended.size
      ? Array.from(recommended).map(s => `<a href="stage.html?id=${s}" style="color:var(--color-blue);font-weight:600;">Stage ${s}</a>`).join('、')
      : '无特别建议，继续保持！';
    result.innerHTML = `
      <div class="score-reveal">${emoji}</div>
      <div style="text-align:center;font-size:24px;font-weight:800;margin:8px 0;">${score} / ${data.maxScore} 分</div>
      <div style="text-align:center;margin-bottom:12px;"><strong>${range ? range.label : '结果'}</strong></div>
      <p>${range ? range.message : ''}</p>
      <p><strong>建议优先学习：</strong>${stageLinks}</p>
      ${prevFirst !== null && prevFirst !== score ?
        `<p style="color:var(--color-green);font-weight:600;">📈 比首次提升了 ${score - prevFirst} 分！</p>` : ''}
    `;

    const existing = form.querySelector('.quiz-result');
    if (existing) existing.remove();
    form.appendChild(result);

    const state = window.DevHandbook.loadState();
    if (state.diagnosis.firstScore === null) {
      state.diagnosis.firstScore = score;
    }
    state.diagnosis.latestScore = score;
    state.diagnosis.answers = answers;
    state.diagnosis.lastTaken = new Date().toISOString();
    window.DevHandbook.saveState(state);
  });

  form.appendChild(submit);
  root.appendChild(form);
}

window.DevHandbook = {
  ...window.DevHandbook,
  renderDiagnosis,
};
