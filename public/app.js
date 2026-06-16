const $ = id => document.getElementById(id);

// State
let chunks = [];
let readCount = 0;

// i18n
const I18N = {
  en: {
    langToggle: '한국어',          // label shown to switch TO Korean
    settingsTitle: 'Settings',
    apiKeyLabel: 'Claude API Key',
    keyHint: 'Your key is stored in this browser session only and never saved to any server.',
    save: 'Save',
    h1: 'Turn any content into focused learning.',
    subtitle: 'Paste an article, book chapter, or any text — Dopamind breaks it into chunks your brain can actually handle.',
    placeholder: 'Paste your text here...',
    demo: '✨ Try a demo (no key)',
    process: 'Process →',
    newText: '← New text',
    loading: 'Breaking it down for your brain...',
    tryAgain: 'Try again',
    keyPoints: 'Key points',
    gotIt: 'Got it ✓',
    done: '✓ Done',
    needText: 'Please paste some text first.',
    somethingWrong: 'Something went wrong',
    charCount: n => `${n.toLocaleString()} characters`,
    progress: (r, t) => `${r} / ${t} sections complete`
  },
  ko: {
    langToggle: 'EN',             // label shown to switch TO English
    settingsTitle: '설정',
    apiKeyLabel: 'Claude API 키',
    keyHint: '키는 이 브라우저 세션에만 저장되며 서버에는 전송되지 않습니다.',
    save: '저장',
    h1: '어떤 글이든, 집중되는 학습으로.',
    subtitle: '기사, 책 챕터, 아무 텍스트나 붙여넣어 보세요 — Dopamind가 뇌가 감당할 수 있는 크기로 쪼개드립니다.',
    placeholder: '여기에 텍스트를 붙여넣으세요...',
    demo: '✨ 데모 보기 (키 불필요)',
    process: '시작하기 →',
    newText: '← 새 텍스트',
    loading: '뇌가 편한 크기로 쪼개는 중...',
    tryAgain: '다시 시도',
    keyPoints: '핵심 포인트',
    gotIt: '확인 ✓',
    done: '✓ 완료',
    needText: '먼저 텍스트를 붙여넣어 주세요.',
    somethingWrong: '문제가 발생했습니다',
    charCount: n => `${n.toLocaleString()}자`,
    progress: (r, t) => `${t}개 중 ${r}개 완료`
  }
};

let lang = localStorage.getItem('dopamind_lang')
  || (navigator.language && navigator.language.startsWith('ko') ? 'ko' : 'en');
const t = () => I18N[lang];

// Elements
const langBtn = $('langBtn');
const settingsBtn = $('settingsBtn');
const settingsPanel = $('settingsPanel');
const apiKeyLabel = $('apiKeyLabel');
const apiKeyInput = $('apiKeyInput');
const keyHint = $('keyHint');
const saveKeyBtn = $('saveKeyBtn');
const h1Title = $('h1Title');
const subtitle = $('subtitle');
const textInput = $('textInput');
const charCount = $('charCount');
const processBtn = $('processBtn');
const demoBtn = $('demoBtn');
const inputSection = $('inputSection');
const outputSection = $('outputSection');
const loadingState = $('loadingState');
const loadingText = $('loadingText');
const errorState = $('errorState');
const errorMsg = $('errorMsg');
const retryBtn = $('retryBtn');
const chunksContainer = $('chunksContainer');
const chunkCounter = $('chunkCounter');
const progressFill = $('progressFill');
const resetBtn = $('resetBtn');

function applyLang() {
  const s = t();
  document.documentElement.lang = lang;
  langBtn.textContent = s.langToggle;
  settingsBtn.title = s.settingsTitle;
  apiKeyLabel.textContent = s.apiKeyLabel;
  keyHint.textContent = s.keyHint;
  saveKeyBtn.textContent = s.save;
  h1Title.textContent = s.h1;
  subtitle.textContent = s.subtitle;
  textInput.placeholder = s.placeholder;
  demoBtn.textContent = s.demo;
  processBtn.textContent = s.process;
  resetBtn.textContent = s.newText;
  loadingText.textContent = s.loading;
  retryBtn.textContent = s.tryAgain;
  charCount.textContent = s.charCount(textInput.value.length);

  // Update already-rendered chunk labels without losing read progress
  document.querySelectorAll('.key-points-label').forEach(el => el.textContent = s.keyPoints);
  document.querySelectorAll('.mark-read-btn').forEach(btn => {
    btn.textContent = btn.classList.contains('done') ? s.done : s.gotIt;
  });
  if (chunks.length) updateProgress();
}

langBtn.addEventListener('click', () => {
  lang = lang === 'en' ? 'ko' : 'en';
  localStorage.setItem('dopamind_lang', lang);
  applyLang();
});

// Restore API key
const savedKey = sessionStorage.getItem('dopamind_key');
if (savedKey) apiKeyInput.value = savedKey;

// Settings toggle
settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));
saveKeyBtn.addEventListener('click', () => {
  sessionStorage.setItem('dopamind_key', apiKeyInput.value.trim());
  settingsPanel.classList.add('hidden');
});

// Char count
textInput.addEventListener('input', () => {
  charCount.textContent = t().charCount(textInput.value.length);
});

// Process
processBtn.addEventListener('click', () => process());
demoBtn.addEventListener('click', () => process({ demo: true }));
retryBtn.addEventListener('click', () => {
  show(inputSection);
  hide(errorState);
});
resetBtn.addEventListener('click', () => {
  show(inputSection);
  hide(outputSection);
  chunks = [];
  readCount = 0;
  chunksContainer.innerHTML = '';
});

async function process(opts = {}) {
  const demo = opts.demo === true;
  const text = textInput.value.trim();
  const apiKey = apiKeyInput.value.trim() || sessionStorage.getItem('dopamind_key') || '';

  // Demo mode skips the text + key requirements — it returns a sample result.
  if (!demo) {
    if (!text) {
      alert(t().needText);
      return;
    }
    if (!apiKey) {
      settingsPanel.classList.remove('hidden');
      apiKeyInput.focus();
      return;
    }
  }

  hide(inputSection);
  hide(errorState);
  show(loadingState);

  try {
    const res = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, apiKey, demo, lang })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || t().somethingWrong);

    chunks = data.chunks || [];
    readCount = 0;
    hide(loadingState);
    renderChunks();
    show(outputSection);
  } catch (err) {
    hide(loadingState);
    errorMsg.textContent = err.message;
    show(errorState);
    show(inputSection);
  }
}

function renderChunks() {
  chunksContainer.innerHTML = '';
  updateProgress();

  chunks.forEach((chunk, i) => {
    const card = document.createElement('div');
    card.className = 'chunk-card' + (i === 0 ? ' active' : '');
    card.id = `chunk-${i}`;

    card.innerHTML = `
      <div class="chunk-hook">${escHtml(chunk.hook)}</div>
      <div class="chunk-text">${escHtml(chunk.text)}</div>
      <div class="key-points-label">${escHtml(t().keyPoints)}</div>
      <ul class="key-points">
        ${chunk.keyPoints.map(p => `<li>${escHtml(p)}</li>`).join('')}
      </ul>
      <div class="chunk-footer">
        <button class="mark-read-btn" data-index="${i}">${escHtml(t().gotIt)}</button>
      </div>
    `;

    card.querySelector('.mark-read-btn').addEventListener('click', () => markRead(i));
    chunksContainer.appendChild(card);
  });
}

function markRead(index) {
  const card = $(`chunk-${index}`);
  const btn = card.querySelector('.mark-read-btn');

  if (card.classList.contains('read')) return;

  card.classList.remove('active');
  card.classList.add('read');
  btn.classList.add('done');
  btn.textContent = t().done;
  readCount++;
  updateProgress();

  // Activate next card
  const next = $(`chunk-${index + 1}`);
  if (next) {
    next.classList.add('active');
    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateProgress() {
  const pct = chunks.length ? (readCount / chunks.length) * 100 : 0;
  progressFill.style.width = `${pct}%`;
  chunkCounter.textContent = t().progress(readCount, chunks.length);
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Initialize language on load
applyLang();
