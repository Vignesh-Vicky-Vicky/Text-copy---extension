const $ = id => document.getElementById(id);
let config, saveTimer, hideTimer;
let animateIn = true, justAddedId = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await saveConfig(config);
    const s = $('saved');
    s.textContent = 'Saved ✓';
    s.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => s.classList.remove('show'), 1400);
  }, 250);
}

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  kids.forEach(k => e.append(k));
  return e;
}

function markDefault() {
  document.querySelectorAll('#list .card').forEach(c =>
    c.classList.toggle('is-default', c.dataset.id === config.defaultId));
}

function removePreset(p, card) {
  card.style.height = card.offsetHeight + 'px';
  void card.offsetHeight; // commit start height so it can animate
  card.classList.add('leaving');
  card.style.height = '0px';
  setTimeout(() => {
    config.presets = config.presets.filter(x => x.id !== p.id);
    if (config.defaultId === p.id) config.defaultId = config.presets[0].id;
    persist();
    draw();
  }, 300);
}

function draw() {
  const list = $('list');
  list.textContent = '';
  config.presets.forEach((p, i) => {
    const name = el('input', { type: 'text', value: p.name, placeholder: 'Name (e.g. Work item)' });
    name.addEventListener('input', () => { p.name = name.value; persist(); });

    const tpl = el('textarea', { rows: 2, value: p.template, placeholder: 'Work item {{number/8}}' });
    tpl.addEventListener('input', () => { p.template = tpl.value; persist(); updatePreview(false); });

    const count = el('input', { type: 'number', min: 1, max: 100, value: p.count || 1 });
    count.addEventListener('input', () => { p.count = parseInt(count.value, 10) || 1; persist(); updatePreview(false); });

    const radio = el('input', { type: 'radio', name: 'default', checked: p.id === config.defaultId });
    radio.addEventListener('change', () => { config.defaultId = p.id; persist(); markDefault(); });

    const del = el('button', { className: 'danger', textContent: 'Delete', disabled: config.presets.length === 1 });
    const preview = el('pre', { className: 'preview' });
    const updatePreview = animated => {
      const text = generateFromPreset(p);
      if (animated) scrambleTo(preview, text); else { cancelAnimationFrame(preview._raf); preview.textContent = text; }
    };
    const refresh = el('button', { className: 'ghost', textContent: 'Refresh preview' });
    refresh.addEventListener('click', () => updatePreview(true));
    updatePreview(false);

    const card = el('div', { className: 'card' },
      el('div', { className: 'row' }, name, el('label', { className: 'inline' }, radio, ' Default'), del),
      tpl,
      el('div', { className: 'row' }, el('label', { className: 'inline' }, 'Lines ', count), el('span', { className: 'spacer' }), refresh),
      preview);
    card.dataset.id = p.id;
    if (animateIn || p.id === justAddedId) {
      card.classList.add('enter');
      card.style.setProperty('--i', animateIn ? Math.min(i, 8) : 0);
    }
    del.addEventListener('click', () => { if (config.presets.length > 1) removePreset(p, card); });
    list.append(card);
  });
  animateIn = false;
  justAddedId = null;
  markDefault();
}

$('add').addEventListener('click', () => {
  const id = 'p' + Date.now();
  config.presets.push({ id, name: 'New config', template: '', count: 1 });
  justAddedId = id;
  persist();
  draw();
  const card = document.querySelector(`#list .card[data-id="${id}"]`);
  card.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  const input = card.querySelector('input[type=text]');
  input.focus({ preventScroll: true });
  input.select();
});

$('shortcuts').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));

(async () => { config = await loadConfig(); draw(); })();
