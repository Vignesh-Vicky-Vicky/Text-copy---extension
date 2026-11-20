importScripts('common.js');

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['CLIPBOARD'],
    justification: 'Write generated text to the clipboard from a keyboard shortcut'
  });
}

async function flash(text, color, title) {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  if (title) chrome.action.setTitle({ title });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1500);
}

chrome.commands.onCommand.addListener(async command => {
  try {
    const config = await loadConfig();
    let preset;
    if (command === 'copy-default') {
      preset = config.presets.find(p => p.id === config.defaultId) || config.presets[0];
    } else {
      const idx = parseInt(command.split('-').pop(), 10) - 1;
      preset = config.presets[idx];
    }
    if (!preset) return flash('!', '#dc2626', 'No config for this shortcut');

    const text = generateFromPreset(preset);
    await ensureOffscreen();
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'copy', text });
    flash('✓', '#16a34a', 'Copied: ' + text.slice(0, 80));
  } catch (e) {
    console.error(e);
    flash('!', '#dc2626', 'Copy failed: ' + e.message);
  }
});
