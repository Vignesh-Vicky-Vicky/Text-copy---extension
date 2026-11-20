chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'offscreen' || msg.type !== 'copy') return;
  const ta = document.getElementById('t');
  ta.value = msg.text;
  ta.select();
  sendResponse({ ok: document.execCommand('copy') });
});
