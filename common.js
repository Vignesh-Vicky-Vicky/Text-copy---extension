const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const chars = (set, n) => Array.from({ length: n }, () => set[rnd(0, set.length - 1)]).join('');
const pickOne = arr => arr[rnd(0, arr.length - 1)];

const LOWER = 'abcdefghijklmnopqrstuvwxyz', UPPER = LOWER.toUpperCase(), DIGITS = '0123456789';
const FIRST = ['Aarav','Priya','Rahul','Sneha','Karan','Anita','Vikram','Meera','Arjun','Divya','John','Emma','Liam','Olivia'];
const LAST = ['Sharma','Reddy','Patel','Iyer','Nair','Gupta','Singh','Kumar','Smith','Brown','Johnson','Wilson'];
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');

const pad = n => String(n).padStart(2, '0');
function fmtDate(d, f) {
  return f.replace(/YYYY/g, d.getFullYear()).replace(/YY/g, String(d.getFullYear()).slice(2))
    .replace(/MM/g, pad(d.getMonth() + 1)).replace(/DD/g, pad(d.getDate()))
    .replace(/HH/g, pad(d.getHours())).replace(/mm/g, pad(d.getMinutes())).replace(/ss/g, pad(d.getSeconds()));
}

function resolve(type, arg, seqState) {
  const n = parseInt(arg, 10);
  switch (type) {
    case 'number': {
      if (arg && arg.includes('-')) { const [a, b] = arg.split('-').map(Number); return String(rnd(a, b)); }
      const len = n || 6; // no leading zero
      return String(rnd(1, 9)) + chars(DIGITS, len - 1);
    }
    case 'digits': return chars(DIGITS, n || 6);
    case 'alpha': return chars(LOWER + UPPER, n || 6);
    case 'lower': return chars(LOWER, n || 6);
    case 'upper': return chars(UPPER, n || 6);
    case 'alnum': return chars(LOWER + UPPER + DIGITS, n || 8);
    case 'hex': return chars('0123456789abcdef', n || 8);
    case 'uuid': return crypto.randomUUID();
    case 'date': return fmtDate(new Date(), arg || 'YYYY-MM-DD');
    case 'time': return fmtDate(new Date(), arg || 'HH:mm:ss');
    case 'datetime': return fmtDate(new Date(), arg || 'YYYY-MM-DD HH:mm:ss');
    case 'timestamp': return String(Date.now());
    case 'name': return pickOne(FIRST) + ' ' + pickOne(LAST);
    case 'email': return (pickOne(FIRST) + '.' + pickOne(LAST)).toLowerCase() + rnd(1, 99) + '@example.com';
    case 'phone': return String(rnd(6, 9)) + chars(DIGITS, 9);
    case 'pick': return arg ? pickOne(arg.split(',').map(s => s.trim())) : '';
    case 'lorem': return Array.from({ length: n || 5 }, () => pickOne(LOREM)).join(' ');
    case 'seq': {
      const key = arg || '1';
      if (!(key in seqState)) seqState[key] = parseInt(key, 10) || 1;
      return String(seqState[key]++);
    }
    default: return null;
  }
}

function render(tpl, seqState) {
  return tpl.replace(/\{\{\s*([a-zA-Z]+)\s*(?:\/([^}]*))?\}\}/g, (m, type, arg) => {
    const v = resolve(type.toLowerCase(), arg === undefined ? '' : arg.trim(), seqState);
    return v === null ? m : v;
  });
}

function generateFromPreset(p) {
  const count = Math.min(100, Math.max(1, parseInt(p.count, 10) || 1));
  const seqState = {};
  return Array.from({ length: count }, () => render(p.template || '', seqState)).join('\n');
}

// ---- storage: { presets: [{id,name,template,count}], defaultId } ----
const DEFAULT_CONFIG = {
  presets: [
    { id: 'p1', name: 'Work item', template: 'Work item {{number/8}}', count: 1 },
    { id: 'p2', name: 'UUID', template: '{{uuid}}', count: 1 }
  ],
  defaultId: 'p1'
};

function loadConfig() {
  return new Promise(res => chrome.storage.local.get(['config'], s => {
    const c = s.config;
    res(c && Array.isArray(c.presets) && c.presets.length ? c : structuredClone(DEFAULT_CONFIG));
  }));
}
function saveConfig(config) {
  return new Promise(res => chrome.storage.local.set({ config }, res));
}
