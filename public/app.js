const $ = id => document.getElementById(id);

// State
let chunks = [];
let readCount = 0;

// Elements
const settingsBtn = $('settingsBtn');
const settingsPanel = $('settingsPanel');
const apiKeyInput = $('apiKeyInput');
const saveKeyBtn = $('saveKeyBtn');
const textInput = $('textInput');
const charCount = $('charCount');
const processBtn = $('processBtn');
const demoBtn = $('demoBtn');
const inputSection = $('inputSection');
const outputSection = $('outputSection');
const loadingState = $('loadingState');
const errorState = $('errorState');
const errorMsg = $('errorMsg');
const retryBtn = $('retryBtn');
const chunksContainer = $('chunksContainer');
const chunkCounter = $('chunkCounter');
const progressFill = $('progressFill');
const resetBtn = $('resetBtn');

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
  charCount.textContent = `${textInput.value.length.toLocaleString()} characters`;
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
      alert('Please paste some text first.');
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
      body: JSON.stringify({ text, apiKey, demo })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Something went wrong');

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
  chunkCounter.textContent = `${chunks.length} sections`;
  updateProgress();

  chunks.forEach((chunk, i) => {
    const card = document.createElement('div');
    card.className = 'chunk-card' + (i === 0 ? ' active' : '');
    card.id = `chunk-${i}`;

    card.innerHTML = `
      <div class="chunk-hook">${escHtml(chunk.hook)}</div>
      <div class="chunk-text">${escHtml(chunk.text)}</div>
      <div class="key-points-label">Key points</div>
      <ul class="key-points">
        ${chunk.keyPoints.map(p => `<li>${escHtml(p)}</li>`).join('')}
      </ul>
      <div class="chunk-footer">
        <button class="mark-read-btn" data-index="${i}">Got it ✓</button>
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
  btn.textContent = '✓ Done';
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
  chunkCounter.textContent = `${readCount} / ${chunks.length} sections complete`;
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
