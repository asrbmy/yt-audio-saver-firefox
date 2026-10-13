const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = { whitelist: [] };

async function render() {
  const { whitelist } = await api.storage.sync.get(DEFAULTS);
  const ul = document.getElementById('whitelistUl');
  ul.textContent = '';
  (whitelist || []).forEach((channel) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = channel;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.addEventListener('click', async () => {
      const s = await api.storage.sync.get(DEFAULTS);
      await api.storage.sync.set({ whitelist: (s.whitelist || []).filter((w) => w !== channel) });
      render();
    });
    li.append(span, btn);
    ul.appendChild(li);
  });
}

document.getElementById('addChannel').addEventListener('click', async () => {
  const input = document.getElementById('channelInput');
  const value = input.value.trim();
  if (!value) return;
  const s = await api.storage.sync.get(DEFAULTS);
  const list = s.whitelist || [];
  if (!list.some((w) => w.toLowerCase() === value.toLowerCase())) {
    list.push(value);
    await api.storage.sync.set({ whitelist: list });
  }
  input.value = '';
  render();
});

render();
