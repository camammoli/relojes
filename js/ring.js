import { startAlarmSound, stopAlarmSound } from './sound.js';

let overlayEl = null;

function buildOverlay() {
  const ov = document.createElement('div');
  ov.className = 'ring-overlay';
  ov.innerHTML = `
    <div class="ring-box">
      <div class="ring-icon" data-role="icon">⏰</div>
      <div class="ring-title" data-role="title"></div>
      <div class="ring-actions">
        <button type="button" class="btn btn-ghost" data-action="snooze" hidden>Posponer 5 min</button>
        <button type="button" class="btn btn-primary" data-action="dismiss">Descartar</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  return ov;
}

function closeRing() {
  stopAlarmSound();
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

export function ringAlarm(title, { onSnooze, onDismiss } = {}) {
  closeRing();
  overlayEl = buildOverlay();
  overlayEl.querySelector('[data-role="icon"]').textContent = '⏰';
  overlayEl.querySelector('[data-role="title"]').textContent = title;
  const snoozeBtn = overlayEl.querySelector('[data-action="snooze"]');
  snoozeBtn.hidden = false;
  snoozeBtn.onclick = () => {
    closeRing();
    onSnooze && onSnooze();
  };
  overlayEl.querySelector('[data-action="dismiss"]').onclick = () => {
    closeRing();
    onDismiss && onDismiss();
  };
  startAlarmSound();
  requestAnimationFrame(() => overlayEl.classList.add('show'));
  notify(title);
}

export function ringTimer(title, { onDismiss } = {}) {
  closeRing();
  overlayEl = buildOverlay();
  overlayEl.querySelector('[data-role="icon"]').textContent = '⏳';
  overlayEl.querySelector('[data-role="title"]').textContent = title;
  overlayEl.querySelector('[data-action="dismiss"]').onclick = () => {
    closeRing();
    onDismiss && onDismiss();
  };
  startAlarmSound();
  requestAnimationFrame(() => overlayEl.classList.add('show'));
  notify(title);
}

function notify(title) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { icon: undefined, tag: 'relojes-ring' });
  } catch {
    /* algunos navegadores moviles no soportan new Notification() directo */
  }
}

export function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') Notification.requestPermission();
}
