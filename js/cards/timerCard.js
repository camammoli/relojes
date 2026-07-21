import { ringTimer } from '../ring.js';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function pad(n) {
  return String(n).padStart(2, '0');
}

function msToParts(ms) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  return { m: Math.floor(totalSec / 60), s: totalSec % 60 };
}

export function createTimerCard(card, { onRemove, onUpdate, onEdit }) {
  const el = document.createElement('div');
  el.className = 'card timer-card';
  el.dataset.cardId = card.id;

  el.innerHTML = `
    <div class="card-header">
      <span class="drag-handle" data-drag-handle title="Mover">⠿</span>
      <span class="card-title">⏳ ${card.data.label || 'Timer'}</span>
      <button type="button" class="icon-btn" data-action="edit" title="Cambiar nombre">✎</button>
      <button type="button" class="icon-btn" data-action="remove" title="Quitar">✕</button>
    </div>
    <div class="timer-body">
      <div class="ring-wrap">
        <svg viewBox="0 0 120 120" class="ring-svg">
          <circle cx="60" cy="60" r="${RADIUS}" class="ring-track"></circle>
          <circle cx="60" cy="60" r="${RADIUS}" class="ring-progress" data-role="ring"
            stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="0"
            transform="rotate(-90 60 60)"></circle>
        </svg>
        <div class="ring-center">
          <div class="timer-inputs" data-role="inputs">
            <input type="number" min="0" max="99" class="num-input" data-role="min" value="0">
            <span>:</span>
            <input type="number" min="0" max="59" class="num-input" data-role="sec" value="0">
          </div>
          <div class="timer-display" data-role="display" hidden>00:00</div>
        </div>
      </div>
      <div class="timer-actions">
        <button type="button" class="btn btn-primary" data-action="toggle">Iniciar</button>
        <button type="button" class="btn btn-ghost" data-action="reset">Reiniciar</button>
      </div>
    </div>
  `;

  const minInput = el.querySelector('[data-role="min"]');
  const secInput = el.querySelector('[data-role="sec"]');
  const toggleBtn = el.querySelector('[data-action="toggle"]');

  function syncInputsFromDuration() {
    const { m, s } = msToParts(card.data.durationMs);
    minInput.value = m;
    secInput.value = s;
  }

  function applyInputsToDuration() {
    const m = Math.max(0, Number(minInput.value) || 0);
    const s = Math.min(59, Math.max(0, Number(secInput.value) || 0));
    card.data.durationMs = (m * 60 + s) * 1000;
    card.data.remainingMs = card.data.durationMs;
    onUpdate();
  }

  minInput.addEventListener('change', applyInputsToDuration);
  secInput.addEventListener('change', applyInputsToDuration);

  toggleBtn.addEventListener('click', () => {
    if (card.data.state === 'running') {
      card.data.remainingMs = card.data.remainingMsAtStart - (Date.now() - card.data.startedAt);
      card.data.state = 'paused';
    } else {
      if (card.data.state === 'idle' || card.data.state === 'done') {
        applyInputsToDuration();
        if (card.data.durationMs <= 0) return;
      }
      card.data.remainingMsAtStart = card.data.remainingMs;
      card.data.startedAt = Date.now();
      card.data.state = 'running';
    }
    onUpdate();
    refreshUI(el, card);
  });

  el.querySelector('[data-action="reset"]').addEventListener('click', () => {
    card.data.state = 'idle';
    card.data.remainingMs = card.data.durationMs;
    card.data.startedAt = null;
    onUpdate();
    refreshUI(el, card);
  });

  el.querySelector('[data-action="remove"]').addEventListener('click', () => onRemove(card.id));
  el.querySelector('[data-action="edit"]').addEventListener('click', () => onEdit(card));

  syncInputsFromDuration();
  refreshUI(el, card);
  return el;
}

function refreshUI(el, card) {
  const inputsWrap = el.querySelector('[data-role="inputs"]');
  const display = el.querySelector('[data-role="display"]');
  const toggleBtn = el.querySelector('[data-action="toggle"]');
  const running = card.data.state === 'running';
  const idle = card.data.state === 'idle';

  inputsWrap.hidden = !idle;
  display.hidden = idle;
  toggleBtn.textContent = running ? 'Pausar' : 'Iniciar';
  el.classList.toggle('is-running', running);
  el.classList.toggle('is-done', card.data.state === 'done');
}

export function tickTimerCard(el, card, persist) {
  if (card.data.state === 'running') {
    const remaining = card.data.remainingMsAtStart - (Date.now() - card.data.startedAt);
    if (remaining <= 0) {
      card.data.remainingMs = 0;
      card.data.state = 'done';
      card.data.startedAt = null;
      persist();
      refreshUI(el, card);
      const title = card.data.label ? `¡${card.data.label} — listo!` : '¡Timer terminado!';
      ringTimer(title, {
        onDismiss: () => {
          card.data.state = 'idle';
          card.data.remainingMs = card.data.durationMs;
          persist();
          refreshUI(el, card);
          updateDisplay(el, card);
        },
      });
      updateDisplay(el, card);
      return;
    }
    card.data.remainingMs = remaining;
  }
  updateDisplay(el, card);
}

function updateDisplay(el, card) {
  const { m, s } = msToParts(card.data.remainingMs);
  const display = el.querySelector('[data-role="display"]');
  display.textContent = `${pad(m)}:${pad(s)}`;
  const ring = el.querySelector('[data-role="ring"]');
  const total = card.data.durationMs || 1;
  const frac = Math.max(0, Math.min(1, card.data.remainingMs / total));
  ring.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE * (1 - frac)));
}
