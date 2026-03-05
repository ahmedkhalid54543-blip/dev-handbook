function renderDiagnosis(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const toggleBtn = container.querySelector('[data-diagnosis-toggle]');
  const panel = container.querySelector('[data-diagnosis-panel]');
  const loading = container.querySelector('[data-diagnosis-loading]');
  const content = container.querySelector('[data-diagnosis-content]');

  let loaded = false;

  const togglePanel = async () => {
    panel.classList.toggle('open');
    if (!loaded) {
      loading.textContent = '加载中...';
      try {
        const response = await fetch('data/diagnosis.json');
        const data = await response.json();
        buildQuiz(content, data);
        loaded = true;
      } catch (err) {
        loading.textContent = '加载失败，请稍后重试。';
      }
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
    result.innerHTML = `
      <div><strong>${range ? range.label : '结果'}</strong> ${range ? range.emoji : ''}</div>
      <div>得分：${score} / ${data.maxScore}</div>
      <p>${range ? range.message : ''}</p>
      <p>建议优先学习阶段：${recommended.size ? Array.from(recommended).join('、') : '继续保持！'}</p>
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
