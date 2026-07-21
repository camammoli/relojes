import { ringAlarm } from '../ring.js';

const DAY_CHIPS = [
  { day: 1, label: 'L' },
  { day: 2, label: 'M' },
  { day: 3, label: 'M' },
  { day: 4, label: 'J' },
  { day: 5, label: 'V' },
  { day: 6, label: 'S' },
  { day: 0, label: 'D' },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function nextOccurrenceLabel(data) {
  if (!data.enabled) return 'Desactivada';
  if (!data.days.length) return `Una vez a las ${data.time}`;
  return `Se repite: ${data.days.length === 7 ? 'todos los días' : DAY_CHIPS.filter((c) => data.days.includes(c.day)).map((c) => c.label).join(' ')}`;
}

export function createAlarmCard(card, { onRemove, onUpdate, onEdit }) {
  const el = document.createElement('div');
  el.className = 'card alarm-card';
  el.dataset.cardId = card.id;

  const chipsHtml = DAY_CHIPS.map(
    (c) => `<button type="button" class="day-chip" data-day="${c.day}">${c.label}</button>`
  ).join('');

  el.innerHTML = `
    <div class="card-header">
      <span class="drag-handle" data-drag-handle title="Mover">⠿</span>
      <span class="card-title">⏰ ${card.data.label || 'Alarma'}</span>
      <button type="button" class="icon-btn" data-action="edit" title="Cambiar nombre">✎</button>
      <button type="button" class="icon-btn" data-action="remove" title="Quitar">✕</button>
    </div>
    <div class="alarm-body">
      <input type="time" class="time-input" data-role="time" value="${card.data.time}">
      <div class="day-chips">${chipsHtml}</div>
      <div class="alarm-footer">
        <label class="switch">
          <input type="checkbox" data-role="enabled" ${card.data.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="alarm-status" data-role="status"></span>
      </div>
    </div>
  `;

  el.querySelector('[data-action="edit"]').addEventListener('click', () => onEdit(card));

  const timeInput = el.querySelector('[data-role="time"]');
  const enabledInput = el.querySelector('[data-role="enabled"]');
  const status = el.querySelector('[data-role="status"]');

  function refreshStatus() {
    status.textContent = nextOccurrenceLabel(card.data);
    el.querySelectorAll('.day-chip').forEach((chip) => {
      const d = Number(chip.dataset.day);
      chip.classList.toggle('active', card.data.days.includes(d));
    });
  }

  timeInput.addEventListener('change', () => {
    card.data.time = timeInput.value;
    card.data.lastFiredKey = null;
    onUpdate();
    refreshStatus();
  });

  enabledInput.addEventListener('change', () => {
    card.data.enabled = enabledInput.checked;
    onUpdate();
    refreshStatus();
  });

  el.querySelectorAll('.day-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const d = Number(chip.dataset.day);
      const idx = card.data.days.indexOf(d);
      if (idx >= 0) card.data.days.splice(idx, 1);
      else card.data.days.push(d);
      card.data.lastFiredKey = null;
      onUpdate();
      refreshStatus();
    });
  });

  el.querySelector('[data-action="remove"]').addEventListener('click', () => onRemove(card.id));

  refreshStatus();
  return el;
}

export function tickAlarmCard(el, card, persist) {
  if (!card.data.enabled) return;
  const now = new Date();
  const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (current !== card.data.time) return;

  const dayOk = !card.data.days.length || card.data.days.includes(now.getDay());
  if (!dayOk) return;

  const key = `${now.toDateString()}_${current}`;
  if (card.data.lastFiredKey === key) return;
  card.data.lastFiredKey = key;

  if (!card.data.days.length) {
    card.data.enabled = false;
    const chk = el.querySelector('[data-role="enabled"]');
    if (chk) chk.checked = false;
  }
  persist();

  const title = card.data.label ? `${card.data.label} — ${card.data.time}` : `Alarma ${card.data.time}`;
  ringAlarm(title, {
    onSnooze: () => {
      const snoozed = new Date(Date.now() + 5 * 60 * 1000);
      card.data.time = `${pad(snoozed.getHours())}:${pad(snoozed.getMinutes())}`;
      card.data.days = [];
      card.data.enabled = true;
      card.data.lastFiredKey = null;
      persist();
      const timeInput = el.querySelector('[data-role="time"]');
      if (timeInput) timeInput.value = card.data.time;
      const chk = el.querySelector('[data-role="enabled"]');
      if (chk) chk.checked = true;
    },
    onDismiss: () => {},
  });
}
