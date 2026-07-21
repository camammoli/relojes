function getOffsetLabel(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date());
    const part = parts.find((p) => p.type === 'timeZoneName');
    return part ? part.value : tz;
  } catch {
    return tz;
  }
}

export function createClockCard(card, { onRemove, onEdit }) {
  const el = document.createElement('div');
  el.className = 'card clock-card';
  el.dataset.cardId = card.id;
  el.innerHTML = `
    <div class="card-header">
      <span class="drag-handle" data-drag-handle title="Mover">⠿</span>
      <span class="card-title" data-role="label"></span>
      <button type="button" class="icon-btn" data-action="edit" title="Cambiar ciudad">✎</button>
      <button type="button" class="icon-btn" data-action="remove" title="Quitar">✕</button>
    </div>
    <div class="clock-display">
      <div class="clock-time" data-role="time">--:--:--</div>
      <div class="clock-meta">
        <span data-role="date"></span>
        <span class="clock-offset" data-role="offset"></span>
      </div>
    </div>
  `;
  el.querySelector('[data-action="remove"]').addEventListener('click', () => onRemove(card.id));
  el.querySelector('[data-action="edit"]').addEventListener('click', () => onEdit(card));
  updateClockLabel(el, card);
  return el;
}

export function updateClockLabel(el, card) {
  el.querySelector('[data-role="label"]').textContent = card.data.label;
}

export function tickClockCard(el, card) {
  const now = new Date();
  const tz = card.data.tz;
  try {
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
    const date = new Intl.DateTimeFormat('es-AR', {
      timeZone: tz,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(now);
    el.querySelector('[data-role="time"]').textContent = time;
    el.querySelector('[data-role="date"]').textContent = date;
    el.querySelector('[data-role="offset"]').textContent = getOffsetLabel(tz);
  } catch {
    el.querySelector('[data-role="time"]').textContent = '--:--:--';
  }
}
