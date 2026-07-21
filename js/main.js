import { loadBoard, saveBoard } from './storage.js';
import { enableDragReorder } from './dragdrop.js';
import { TIMEZONES, isValidTimeZone } from './timezones.js';
import { unlockAudio } from './sound.js';
import { ensureNotificationPermission } from './ring.js';
import { createClockCard, tickClockCard } from './cards/clockCard.js';
import { createAlarmCard, tickAlarmCard } from './cards/alarmCard.js';
import { createTimerCard, tickTimerCard } from './cards/timerCard.js';
import { createStopwatchCard, tickStopwatchCard } from './cards/stopwatchCard.js';

const board = document.getElementById('board');
const empty = document.getElementById('empty-state');
const state = loadBoard();

function persist() {
  saveBoard(state);
}

function onRemove(id) {
  state.cards = state.cards.filter((c) => c.id !== id);
  persist();
  renderAll();
}

function buildCardElement(card) {
  switch (card.type) {
    case 'clock':
      return createClockCard(card, { onRemove, onEdit: openClockDialog });
    case 'alarm':
      return createAlarmCard(card, { onRemove, onUpdate: persist, onEdit: (c) => openRenameDialog(c, 'Alarma') });
    case 'timer':
      return createTimerCard(card, { onRemove, onUpdate: persist, onEdit: (c) => openRenameDialog(c, 'Timer') });
    case 'stopwatch':
      return createStopwatchCard(card, { onRemove, onUpdate: persist, onEdit: (c) => openRenameDialog(c, 'Cronómetro') });
    default:
      return document.createComment('unknown card');
  }
}

function renderAll() {
  board.innerHTML = '';
  empty.hidden = state.cards.length > 0;
  for (const card of state.cards) {
    board.appendChild(buildCardElement(card));
  }
  enableDragReorder(board, (newOrderIds) => {
    state.cards = newOrderIds.map((id) => state.cards.find((c) => c.id === id)).filter(Boolean);
    persist();
  });
}

function tick() {
  for (const el of board.children) {
    const id = el.dataset.cardId;
    const card = state.cards.find((c) => c.id === id);
    if (!card) continue;
    if (card.type === 'clock') tickClockCard(el, card);
    else if (card.type === 'alarm') tickAlarmCard(el, card, persist);
    else if (card.type === 'timer') tickTimerCard(el, card, persist);
    else if (card.type === 'stopwatch') tickStopwatchCard(el, card);
  }
  requestAnimationFrame(tick);
}

// ---- diálogo de reloj mundial ----
const dlg = document.getElementById('clock-dialog');
const dlgList = document.getElementById('tz-list');
const dlgSearch = document.getElementById('tz-search');
const dlgCustom = document.getElementById('tz-custom');
const dlgCustomBtn = document.getElementById('tz-custom-add');
let editingCard = null;

function renderTzList(filter) {
  const q = (filter || '').trim().toLowerCase();
  const items = TIMEZONES.filter(
    (tz) => !q || tz.label.toLowerCase().includes(q) || tz.region.toLowerCase().includes(q) || tz.id.toLowerCase().includes(q)
  );
  dlgList.innerHTML = items
    .map((tz) => `<li data-tz="${tz.id}" data-label="${tz.label}"><span>${tz.label}</span><span class="tz-region">${tz.region}</span></li>`)
    .join('') || '<li class="tz-empty">Sin resultados</li>';
  dlgList.querySelectorAll('li[data-tz]').forEach((li) => {
    li.addEventListener('click', () => {
      applyClockSelection(li.dataset.tz, li.dataset.label);
    });
  });
}

function applyClockSelection(tz, label) {
  if (editingCard) {
    editingCard.data.tz = tz;
    editingCard.data.label = label;
    editingCard = null;
  } else {
    state.cards.push({ id: crypto.randomUUID(), type: 'clock', data: { tz, label } });
  }
  persist();
  renderAll();
  dlg.close();
}

function openClockDialog(card) {
  editingCard = card || null;
  dlgSearch.value = '';
  dlgCustom.value = '';
  renderTzList('');
  dlg.showModal();
  dlgSearch.focus();
}

dlgSearch.addEventListener('input', () => renderTzList(dlgSearch.value));

dlgCustom.addEventListener('input', () => dlgCustom.classList.remove('invalid'));

dlgCustomBtn.addEventListener('click', () => {
  const tz = dlgCustom.value.trim();
  if (!tz) return;
  if (!isValidTimeZone(tz)) {
    dlgCustom.classList.add('invalid');
    return;
  }
  dlgCustom.classList.remove('invalid');
  applyClockSelection(tz, tz.split('/').pop().replace(/_/g, ' '));
});

document.getElementById('clock-dialog-cancel').addEventListener('click', () => dlg.close());

// ---- diálogo de renombrado (alarma/timer/cronómetro) ----
const renameDlg = document.getElementById('rename-dialog');
const renameInput = document.getElementById('rename-input');
let renamingCard = null;

function openRenameDialog(card, placeholder) {
  renamingCard = card;
  renameInput.value = card.data.label || '';
  renameInput.placeholder = placeholder;
  renameDlg.showModal();
  renameInput.focus();
  renameInput.select();
}

function saveRename() {
  if (!renamingCard) return;
  renamingCard.data.label = renameInput.value.trim();
  persist();
  renderAll();
  renameDlg.close();
  renamingCard = null;
}

document.getElementById('rename-save').addEventListener('click', saveRename);
document.getElementById('rename-cancel').addEventListener('click', () => {
  renameDlg.close();
  renamingCard = null;
});
renameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveRename();
  }
});

// ---- toolbar ----
document.getElementById('add-clock').addEventListener('click', () => {
  unlockAudio();
  openClockDialog(null);
});

document.getElementById('add-alarm').addEventListener('click', () => {
  unlockAudio();
  ensureNotificationPermission();
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  state.cards.push({
    id: crypto.randomUUID(),
    type: 'alarm',
    data: { time, days: [1, 2, 3, 4, 5], enabled: true, lastFiredKey: null, label: '' },
  });
  persist();
  renderAll();
});

document.getElementById('add-timer').addEventListener('click', () => {
  unlockAudio();
  ensureNotificationPermission();
  const durationMs = 5 * 60 * 1000;
  state.cards.push({
    id: crypto.randomUUID(),
    type: 'timer',
    data: { durationMs, remainingMs: durationMs, state: 'idle', startedAt: null, remainingMsAtStart: null, label: '' },
  });
  persist();
  renderAll();
});

document.getElementById('add-stopwatch').addEventListener('click', () => {
  unlockAudio();
  state.cards.push({
    id: crypto.randomUUID(),
    type: 'stopwatch',
    data: { state: 'idle', accumulatedMs: 0, startedAt: null, laps: [], label: '' },
  });
  persist();
  renderAll();
});

renderAll();
requestAnimationFrame(tick);
