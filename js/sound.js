let ctx = null;
let alarmInterval = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

function beep(freq = 880, duration = 0.15, when = 0, gainValue = 0.22) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = c.currentTime + when;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainValue, t0 + 0.01);
  gain.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playTimerBeep() {
  unlockAudio();
  beep(1046.5, 0.12, 0);
  beep(1046.5, 0.12, 0.18);
}

export function startAlarmSound() {
  unlockAudio();
  stopAlarmSound();
  const pattern = () => {
    beep(880, 0.16, 0);
    beep(659, 0.16, 0.22);
  };
  pattern();
  alarmInterval = setInterval(pattern, 900);
}

export function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}
