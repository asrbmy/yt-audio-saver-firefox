// YT Audio Saver (Firefox) — content script.
// Injects page-bridge.js into the page world and relays settings/commands.
const api = globalThis.browser ?? globalThis.chrome;

const DEFAULTS = {
  lowQuality: true,
  hideVideo: false,
  autoDetectNetwork: true,
  whitelist: []
};

// Rough ballpark bitrates (kbps), used ONLY to estimate data saved.
const BITRATE_KBPS = { auto: 5000, tiny: 100 };

let settings = { ...DEFAULTS };
let pageInfo = null;
let lastTick = null;

function injectBridge() {
  const s = document.createElement('script');
  s.src = api.runtime.getURL('page-bridge.js');
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
}

function toPage(msg) {
  window.postMessage({ source: 'yas-content', ...msg }, window.location.origin);
}

window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data || e.data.source !== 'yas-page') return;
  pageInfo = e.data.info;
  updateWidget();
});

function slowNetwork() {
  const c = navigator.connection || navigator.mozConnection;
  if (!c) return false; // Not available on Firefox desktop
  return !!c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType);
}

function isWhitelisted(channel) {
  if (!channel) return false;
  return (settings.whitelist || []).some(
    (w) => w.trim().toLowerCase() === channel.trim().toLowerCase()
  );
}

function applyHideClass() {
  document.body.classList.toggle('yt-audio-saver-hide-video', !!settings.hideVideo);
  const w = document.getElementById('yt-audio-saver-widget');
  if (w) w.style.display = settings.hideVideo ? 'flex' : 'none';
}

function ensureWidget() {
  if (document.getElementById('yt-audio-saver-widget')) return;
  const w = document.createElement('div');
  w.id = 'yt-audio-saver-widget';
  w.style.display = 'none';

  const img = document.createElement('img');
  img.id = 'yas-thumb';
  img.alt = '';

  const meta = document.createElement('div');
  meta.className = 'yas-meta';
  const title = document.createElement('div');
  title.className = 'yas-title';
  title.id = 'yas-title';
  title.textContent = '—';
  const channel = document.createElement('div');
  channel.className = 'yas-channel';
  channel.id = 'yas-channel';
  channel.textContent = '—';
  meta.append(title, channel);

  const controls = document.createElement('div');
  controls.className = 'yas-controls';
  const mk = (txt, tip, fn, cls) => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.title = tip;
    if (cls) b.className = cls;
    b.addEventListener('click', fn);
    return b;
  };
  controls.append(
    mk('⏮', 'Previous', () => toPage({ type: 'prev' })),
    mk('⏯', 'Play/Pause', () => toPage({ type: 'playpause' })),
    mk('⏭', 'Next', () => toPage({ type: 'next' })),
    mk('✕', 'Close', () => api.storage.sync.set({ hideVideo: false }), 'yas-close')
  );

  w.append(img, meta, controls);
  document.body.appendChild(w);
}

function updateWidget() {
  if (!pageInfo) return;
  const t = document.getElementById('yas-thumb');
  const ti = document.getElementById('yas-title');
  const ch = document.getElementById('yas-channel');
  if (t) t.src = `https://i.ytimg.com/vi/${encodeURIComponent(pageInfo.video_id)}/hqdefault.jpg`;
  if (ti) ti.textContent = pageInfo.title || '—';
  if (ch) ch.textContent = pageInfo.author || '—';
}

async function addSaved(kb) {
  const cur = await api.storage.local.get({ dataSavedKB: 0 });
  await api.storage.local.set({ dataSavedKB: (cur.dataSavedKB || 0) + kb });
}

async function tick() {
  ensureWidget();
  applyHideClass();
  toPage({ type: 'poll' });

  const channel = pageInfo ? pageInfo.author : null;
  const forceLow =
    !isWhitelisted(channel) &&
    (settings.lowQuality || (settings.autoDetectNetwork && slowNetwork()));

  toPage({ type: 'quality', low: forceLow });

  const now = Date.now();
  const elapsed = lastTick ? Math.min((now - lastTick) / 1000, 10) : 0;
  lastTick = now;
  if (forceLow && pageInfo && pageInfo.state === 1 && elapsed > 0) {
    await addSaved(((BITRATE_KBPS.auto - BITRATE_KBPS.tiny) / 8) * elapsed);
  }
}

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'getInfo') {
    sendResponse({ info: pageInfo });
  }
});

api.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const k of Object.keys(changes)) settings[k] = changes[k].newValue;
  tick();
});

(async function init() {
  injectBridge();
  settings = { ...DEFAULTS, ...(await api.storage.sync.get(DEFAULTS)) };
  document.addEventListener('yt-navigate-finish', tick);
  setInterval(tick, 3000);
  tick();
})();
