// YT Audio Saver (Firefox) — event page: shortcuts + toolbar badge.
const api = globalThis.browser ?? globalThis.chrome;

const DEFAULTS = {
  lowQuality: true,
  hideVideo: false,
  autoDetectNetwork: true,
  whitelist: []
};

async function updateBadge() {
  const s = await api.storage.sync.get(DEFAULTS);
  if (!s.lowQuality) {
    api.action.setBadgeText({ text: 'OFF' });
    api.action.setBadgeBackgroundColor({ color: '#9aa0a6' });
  } else {
    api.action.setBadgeText({ text: s.hideVideo ? 'AUD' : 'LOW' });
    api.action.setBadgeBackgroundColor({ color: '#1a73e8' });
  }
}

api.commands.onCommand.addListener(async (command) => {
  const s = await api.storage.sync.get(DEFAULTS);
  if (command === 'toggle-hide-video') {
    await api.storage.sync.set({ hideVideo: !s.hideVideo });
  } else if (command === 'toggle-low-quality') {
    await api.storage.sync.set({ lowQuality: !s.lowQuality });
  }
});

api.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.lowQuality || changes.hideVideo)) updateBadge();
});

api.runtime.onInstalled.addListener(async () => {
  const current = await api.storage.sync.get(null);
  await api.storage.sync.set({ ...DEFAULTS, ...current });
  updateBadge();
});

updateBadge();
