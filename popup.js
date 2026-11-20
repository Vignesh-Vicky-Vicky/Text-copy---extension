const $ = id => document.getElementById(id);
let config, selectedId, resetTimer;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function setLabel(t) {
  const l = $('label');
  l.textContent = t;
  l.classList.remove('swap');
  void l.offsetWidth; // restart animation
  l.classList.add('swap');
}

function render() {
  const list = $('list');
  list.textContent = '';
  document.body.style.setProperty('--n', config.presets.length);
  config.presets.forEach((p, i) => {
    const input = el('input');
    input.type = 'radio';
    input.name = 'preset';
    input.value = p.id;
    input.checked = p.id === selectedId;
    input.addEventListener('change', () => { selectedId = p.id; reset(); });

    const name = el('span', 'name', p.name || 'Untitled');
    if (p.id === config.defaultId) name.append(el('span', 'badge', 'Default'));
    const text = el('div', 'text');
    text.append(name, el('span', 'tpl', (p.template || '').replace(/\s+/g, ' ')));

    const label = el('label', 'item');
    label.style.setProperty('--i', Math.min(i, 6));
    label.append(input, el('span', 'dot'), text);
    list.append(label);
  });
}

function reset() {
  clearTimeout(resetTimer);
  $('reveal').classList.remove('open');
  if ($('copy').classList.contains('done')) {
    $('copy').classList.remove('done');
    setLabel('Generate & copy');
  }
}

async function copy(e) {
  const p = config.presets.find(x => x.id === selectedId);
  if (!p) return;
  const text = generateFromPreset(p);
  await navigator.clipboard.writeText(text);

  if (e && e.currentTarget) addRipple($('copy'), e);
  $('reveal').classList.add('open');
  scrambleTo($('result'), text);
  $('copy').classList.add('done');
  setLabel('Copied');
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    $('copy').classList.remove('done');
    setLabel('Generate & copy');
  }, 1500);
}

async function init() {
  config = await loadConfig();
  selectedId = config.presets.some(p => p.id === config.defaultId) ? config.defaultId : config.presets[0].id;
  render();
  const checked = document.querySelector('#list input:checked');
  if (checked) checked.focus({ preventScroll: true });

  chrome.commands.getAll(cmds => {
    const c = cmds.find(x => x.name === 'copy-default');
    const hint = $('hint');
    hint.textContent = '';
    if (c && c.shortcut) {
      const k = document.createElement('kbd');
      k.textContent = c.shortcut;
      hint.append(k, ' copies the default without opening this.');
    } else {
      hint.textContent = 'No shortcut set. Add one in Config.';
    }
    hint.hidden = false;
  });
}

$('copy').addEventListener('click', copy);
$('list').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); copy({ detail: 0, currentTarget: $('copy') }); }
});
$('cfg').addEventListener('click', () => chrome.runtime.openOptionsPage());
init();
