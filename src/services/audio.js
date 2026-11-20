let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playBip(type = 'success') {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    gain.gain.value = 0.08;

    if (type === 'success') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.12);
    } else if (type === 'warning') {
      osc.frequency.value = 520;
      osc.type = 'square';
      osc.start(c.currentTime);
      osc.frequency.value = 380;
      osc.stop(c.currentTime + 0.25);
    } else {
      osc.frequency.value = 200;
      osc.type = 'sawtooth';
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.45);
    }
  } catch (_) { /* ses desteklenmiyor */ }
}