/* Local learning activity: no network, persistence, timers or AI service. */
(() => {
  'use strict';
  const exerciseKeys = ['population', 'learning'];
  const quizKeys = ['b', 'a', 'c'];
  const checkExercise = answers => Array.isArray(answers) && answers.length === 2 && new Set(answers).size === 2 && exerciseKeys.every(key => answers.includes(key));
  const checkQuiz = answers => quizKeys.map((key, index) => answers?.[index] === key);
  function createState() {
    return {
      step: 0, furthest: 0, exercise: false, quiz: false, complete: false,
      go(index) {
        if (!Number.isInteger(index) || index < 0 || index > 3 || index > this.furthest) return false;
        this.step = index; this.complete = false; return true;
      },
      next() {
        if (this.step === 3) { this.complete = true; return true; }
        this.step++; this.furthest = Math.max(this.furthest, this.step); return true;
      },
      assessExercise(answers) { this.exercise = checkExercise(answers); this.quiz = false; this.complete = false; return this.exercise; },
      assessQuiz(answers) { this.quiz = checkQuiz(answers).every(Boolean); this.complete = false; return this.quiz; },
      invalidateExercise() { this.exercise = false; this.quiz = false; this.complete = false; },
      invalidateQuiz() { this.quiz = false; this.complete = false; },
    };
  }
  globalThis.ObservatoryJourney = Object.freeze({ checkExercise, checkQuiz, createState });
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-journey]');
  if (!root) return;
  const copy = JSON.parse(root.querySelector('[data-journey-copy]').textContent);
  let state = createState();
  const steps = [...root.querySelectorAll('[data-step]')];
  const nav = [...root.querySelectorAll('[data-step-button]')];
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const progress = root.querySelector('[data-progress]');
  const status = root.querySelector('[data-step-status]');
  const end = root.querySelector('[data-completion]');
  const exerciseFeedback = root.querySelector('[data-exercise-feedback]');
  const model = root.querySelector('[data-model]');
  const quizFeedback = root.querySelector('[data-quiz-feedback]');
  const checks = [...root.querySelectorAll('[data-error-option]')];
  const radios = [...root.querySelectorAll('[data-quiz-option]')];
  const clearQuizFeedback = () => {
    quizFeedback.textContent = '';
    root.querySelectorAll('[data-question-feedback]').forEach(node => { node.textContent = ''; delete node.dataset.result; });
  };
  const readQuiz = () => [0, 1, 2].map(index => root.querySelector(`input[name="journey-q${index}"]:checked`)?.value ?? '');
  const render = (focus = true) => {
    steps.forEach((section, index) => { section.hidden = state.complete || index !== state.step; });
    end.hidden = !state.complete;
    nav.forEach((button, index) => {
      button.disabled = index > state.furthest;
      if (index === state.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    progress.value = state.step + 1;
    progress.setAttribute('aria-valuetext', copy.step.replace('{n}', state.step + 1));
    status.textContent = state.complete ? copy.completeStatus : copy.step.replace('{n}', state.step + 1);
    previous.disabled = state.step === 0;
    next.hidden = state.complete;
    next.textContent = state.step === 3 ? copy.finish : copy.next;
    next.disabled = false;
    if (focus) (state.complete ? end : steps[state.step]).querySelector('h2').focus();
  };
  root.querySelector('[data-check-exercise]').addEventListener('click', () => {
    const answers = checks.filter(input => input.checked).map(input => input.value);
    const accepted = state.assessExercise(answers);
    clearQuizFeedback();
    exerciseFeedback.textContent = accepted ? copy.exerciseCorrect : answers.length === 0 ? copy.exerciseEmpty : copy.exerciseRetry;
    exerciseFeedback.dataset.result = accepted ? 'correct' : 'retry';
    model.hidden = !accepted;
    render(false);
  });
  root.querySelector('[data-show-model]').addEventListener('click', () => {
    model.hidden = false;
    model.querySelector('h3').focus();
  });
  root.querySelector('[data-show-answers]').addEventListener('click', () => {
    root.querySelectorAll('[data-question-feedback]').forEach((node, index) => {
      node.textContent = copy.quizExplanation[index];
      delete node.dataset.result;
    });
    quizFeedback.textContent = copy.reviewOnly;
  });
  checks.forEach(input => input.addEventListener('change', () => {
    state.invalidateExercise(); model.hidden = true; clearQuizFeedback();
    exerciseFeedback.textContent = copy.exerciseChanged;
    render(false);
  }));
  root.querySelector('[data-check-quiz]').addEventListener('click', () => {
    const answers = readQuiz(), results = checkQuiz(answers);
    const accepted = state.assessQuiz(answers);
    root.querySelectorAll('[data-question-feedback]').forEach((node, index) => {
      node.textContent = !answers[index] ? copy.questionEmpty : results[index] ? copy.quizCorrect[index] : copy.quizRetry[index];
      node.dataset.result = answers[index] && results[index] ? 'correct' : 'retry';
    });
    quizFeedback.textContent = accepted ? copy.quizPassed : copy.quizIncomplete;
    render(false);
  });
  radios.forEach(input => input.addEventListener('change', () => {
    state.invalidateQuiz();
    root.querySelectorAll('[data-question-feedback]').forEach(node => { node.textContent = ''; });
    quizFeedback.textContent = copy.quizChanged;
    render(false);
  }));
  previous.addEventListener('click', () => {
    if (state.complete) { state.complete = false; render(); }
    else if (state.go(state.step - 1)) render();
  });
  next.addEventListener('click', () => { if (state.next()) render(); });
  nav.forEach((button, index) => button.addEventListener('click', () => { if (state.go(index)) render(); }));
  root.querySelector('[data-reset]').addEventListener('click', () => {
    state = createState();
    [...checks, ...radios].forEach(input => { input.checked = false; });
    [exerciseFeedback, quizFeedback, ...root.querySelectorAll('[data-question-feedback]')].forEach(node => { node.textContent = ''; delete node.dataset.result; });
    model.hidden = true; render();
  });
  // Start clean even if the browser restores form controls on reload.
  [...checks, ...radios].forEach(input => { input.checked = false; });
  root.querySelector('[data-controls]').hidden = false;
  root.querySelector('[data-actions]').hidden = false;
  render(false);
})();
