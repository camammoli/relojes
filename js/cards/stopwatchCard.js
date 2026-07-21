function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

function formatMs(ms) {
  const totalMs = Math.max(0, Math.floor(ms));
  const cs = Math.floor((totalMs % 1000) / 10);
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const head = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return `${head}.${pad(cs)}`;
}

function currentElapsed(card) {
  const running = card.data.state === 'running';
  return card.data.accumulatedMs + (running ? Date.now() - card.data.startedAt : 0);
}

export function createStopwatchCard(card, { onRemove, onUpdate, onEdit }) {
  const el = document.createElement('div');
  el.className = 'card stopwatch-card';
  el.dataset.cardId = card.id;

  el.innerHTML = `
    <div class="card-header">
      <span class="drag-handle" data-drag-handle title="Mover">⠿</span>
      <span class="card-title">⏱ ${card.data.label || 'Cronómetro'}</span>
      <button type="button" class="icon-btn" data-action="edit" title="Cambiar nombre">✎</button>
      <button type="button" class="icon-btn" data-action="remove" title="Quitar">✕</button>
    </div>
    <div class="stopwatch-body">
      <div class="stopwatch-display" data-role="display">00:00.00</div>
      <div class="stopwatch-actions">
        <button type="button" class="btn btn-primary" data-action="toggle">Iniciar</button>
        <button type="button" class="btn btn-ghost" data-action="lap">Vuelta</button>
        <button type="button" class="btn btn-ghost" data-action="reset">Reiniciar</button>
      </div>
      <ul class="lap-list" data-role="laps"></ul>
    </div>
  `;

  const lapBtn = el.querySelector('[data-action="lap"]');
  const toggleBtn = el.querySelector('[data-action="toggle"]');

  function refreshLaps() {
    const list = el.querySelector('[data-role="laps"]');
    list.innerHTML = card.data.laps
      .map((ms, i) => `<li><span>Vuelta ${i + 1}</span><span>${formatMs(ms)}</span></li>`)
      .reverse()
      .join('');
  }

  function refreshButtons() {
    const running = card.data.state === 'running';
    toggleBtn.textContent = running ? 'Pausar' : card.data.accumulatedMs > 0 ? 'Reanudar' : 'Iniciar';
    lapBtn.disabled = !running;
    el.classList.toggle('is-running', running);
  }

  toggleBtn.addEventListener('click', () => {
    if (card.data.state === 'running') {
      card.data.accumulatedMs = currentElapsed(card);
      card.data.state = 'paused';
      card.data.startedAt = null;
    } else {
      card.data.startedAt = Date.now();
      card.data.state = 'running';
    }
    onUpdate();
    refreshButtons();
  });

  lapBtn.addEventListener('click', () => {
    if (card.data.state !== 'running') return;
    card.data.laps.push(currentElapsed(card));
    onUpdate();
    refreshLaps();
  });

  el.querySelector('[data-action="reset"]').addEventListener('click', () => {
    card.data.state = 'idle';
    card.data.accumulatedMs = 0;
    card.data.startedAt = null;
    card.data.laps = [];
    onUpdate();
    refreshButtons();
    refreshLaps();
    el.querySelector('[data-role="display"]').textContent = formatMs(0);
  });

  el.querySelector('[data-action="remove"]').addEventListener('click', () => onRemove(card.id));
  el.querySelector('[data-action="edit"]').addEventListener('click', () => onEdit(card));

  refreshButtons();
  refreshLaps();
  el.querySelector('[data-role="display"]').textContent = formatMs(currentElapsed(card));
  return el;
}

export function tickStopwatchCard(el, card) {
  const display = el.querySelector('[data-role="display"]');
  display.textContent = formatMs(currentElapsed(card));
}
