export function enableDragReorder(container, onReorder) {
  let dragEl = null;
  let placeholder = null;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;
  let width = 0;
  let height = 0;

  container.querySelectorAll('[data-card-id]').forEach(attachHandle);

  function attachHandle(card) {
    const handle = card.querySelector('[data-drag-handle]');
    if (!handle) return;
    handle.addEventListener('pointerdown', (e) => onPointerDown(e, card));
  }

  function onPointerDown(e, card) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    dragEl = card;
    const rect = card.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    origX = rect.left;
    origY = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    placeholder = document.createElement('div');
    placeholder.className = 'card-placeholder';
    placeholder.style.width = width + 'px';
    placeholder.style.height = height + 'px';
    card.parentNode.insertBefore(placeholder, card);

    card.style.position = 'fixed';
    card.style.left = origX + 'px';
    card.style.top = origY + 'px';
    card.style.width = width + 'px';
    card.style.zIndex = 1000;
    card.classList.add('dragging');
    document.body.appendChild(card);

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp, { once: true });
  }

  function onPointerMove(e) {
    if (!dragEl) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dragEl.style.left = origX + dx + 'px';
    dragEl.style.top = origY + dy + 'px';

    const siblings = Array.from(container.querySelectorAll('[data-card-id]')).filter((el) => el !== dragEl);
    let closest = null;
    let closestDist = Infinity;
    const px = e.clientX;
    const py = e.clientY;
    for (const sib of siblings) {
      const r = sib.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = sib;
      }
    }
    if (closest) {
      const r = closest.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const sameRow = Math.abs(py - cy) < r.height / 2;
      const insertAfter = sameRow ? px > cx : py > cy;
      if (insertAfter) closest.parentNode.insertBefore(placeholder, closest.nextSibling);
      else closest.parentNode.insertBefore(placeholder, closest);
    }
  }

  function onPointerUp() {
    document.removeEventListener('pointermove', onPointerMove);
    if (!dragEl) return;
    dragEl.style.position = '';
    dragEl.style.left = '';
    dragEl.style.top = '';
    dragEl.style.width = '';
    dragEl.style.zIndex = '';
    dragEl.classList.remove('dragging');
    placeholder.parentNode.insertBefore(dragEl, placeholder);
    placeholder.remove();
    dragEl = null;
    placeholder = null;

    const newOrder = Array.from(container.querySelectorAll('[data-card-id]')).map((el) => el.dataset.cardId);
    onReorder(newOrder);
  }
}
