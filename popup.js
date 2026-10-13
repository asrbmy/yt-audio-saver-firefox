const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { lowQuality: true, hideVideo: false, autoDetectNetwork: true, whitelist: [] };
const el = (id) => document.getElementById(id);

function formatMB(kb) {
  const mb = kb / 1024;
  if (mb < 1) return `${Math.round(kb)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

async function currentChannel() {
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return null;
    const r = await api.tabs.sendMessage(tabs[0].id, { type: 'getInfo' });
    return r && r.info && r.info.author ? r.info.author : null;
  } catch (e) {
    return null;
  }
}

async function refresh() {
  const s = await api.storage.sync.get(DEFAULTS);
  const local = await api.storage.local.get({ dataSavedKB: 0 });
  el('lowQuality').checked = s.lowQuality;
  el('hideVideo').checked = s.hideVideo;
  el('autoDetectNetwork').checked = s.autoDetectNetwork;
  el('dataSaved').textContent = formatMB(local.dataSavedKB || 0);

  const ch = await currentChannel();
  const btn = el('whitelistToggle');
  if (ch) {
    const on = (s.whitelist || []).some((w) => w.toLowerCase() === ch.toLowerCase());
    el('channelLabel').textContent = `Current channel: ${ch}`;
    btn.textContent = on ? 'Remove full-quality exception' : 'Always play this channel in full quality';
    btn.dataset.channel = ch;
    btn.dataset.on = on ? '1' : '0';
    btn.disabled = false;
  } else {
    el('channelLabel').textContent = 'Current channel: (open a YouTube video)';
    btn.disabled = true;
  }
}

for (const k of ['lowQuality', 'hideVideo', 'autoDetectNetwork']) {
  el(k).addEventListener('change', (e) => api.storage.sync.set({ [k]: e.target.checked }));
}
el('resetStats').addEventListener('click', async () => {
  await api.storage.local.set({ dataSavedKB: 0 });
  refresh();
});
el('whitelistToggle').addEventListener('click', async (e) => {
  const ch = e.target.dataset.channel;
  const on = e.target.dataset.on === '1';
  const s = await api.storage.sync.get(DEFAULTS);
  let list = s.whitelist || [];
  list = on ? list.filter((w) => w.toLowerCase() !== ch.toLowerCase()) : [...list, ch];
  await api.storage.sync.set({ whitelist: list });
  refresh();
});
el('openOptions').addEventListener('click', () => {
  api.runtime.openOptionsPage();
  window.close();
});

refresh();
