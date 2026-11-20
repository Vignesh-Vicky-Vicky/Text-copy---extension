const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const POOLS = { d: '0123456789', u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l: 'abcdefghijklmnopqrstuvwxyz' };
function glyphFor(c) {
  const pool = /[0-9]/.test(c) ? POOLS.d : /[A-Z]/.test(c) ? POOLS.u : POOLS.l;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Random characters "roll" left-to-right into the final text.
function scrambleTo(node, finalText, duration = 480) {
  cancelAnimationFrame(node._raf);
  if (reducedMotion()) { node.textContent = finalText; return; }
  const start = performance.now(), len = finalText.length;
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    const settled = Math.floor(t * t * (3 - 2 * t) * len); // smoothstep
    let out = '';
    for (let i = 0; i < len; i++) {
      const c = finalText[i];
      out += i < settled || !/[A-Za-z0-9]/.test(c) ? c : glyphFor(c);
    }
    node.textContent = out;
    node._raf = t < 1 ? requestAnimationFrame(step) : 0;
    if (t >= 1) node.textContent = finalText;
  };
  node._raf = requestAnimationFrame(step);
}

// Material-style press ripple, centered when triggered by keyboard.
function addRipple(btn, e) {
  if (reducedMotion()) return;
  const r = btn.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2.2;
  const x = e.detail === 0 ? r.width / 2 : e.clientX - r.left;
  const y = e.detail === 0 ? r.height / 2 : e.clientY - r.top;
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${x - d / 2}px;top:${y - d / 2}px`;
  btn.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}
