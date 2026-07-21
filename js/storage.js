const KEY = 'relojes.board.v1';

function defaultBoard() {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return {
    cards: [
      { id: crypto.randomUUID(), type: 'clock', data: { tz: 'UTC', label: 'UTC' } },
      { id: crypto.randomUUID(), type: 'clock', data: { tz: localTz, label: 'Local' } },
    ],
  };
}

export function loadBoard() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultBoard();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cards)) return defaultBoard();
    return parsed;
  } catch {
    return defaultBoard();
  }
}

export function saveBoard(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
