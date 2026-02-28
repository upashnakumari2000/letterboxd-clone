/**
 * Modal component — renders a centered overlay dialog.
 * Usage: openModal(contentHtml) / closeModal()
 */

let _currentModal = null;

export function openModal(contentHtml) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" aria-label="Close">&times;</button>
      <div class="modal-content">${contentHtml}</div>
    </div>
  `;

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  _currentModal = overlay;

  // trap focus
  requestAnimationFrame(() => {
    const first = overlay.querySelector('input, button, textarea');
    if (first) first.focus();
  });

  // close on Escape
  const onKey = (e) => {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

export function closeModal() {
  if (_currentModal) {
    _currentModal.remove();
    _currentModal = null;
    document.body.classList.remove('modal-open');
  }
}

export function updateModalContent(contentHtml) {
  if (_currentModal) {
    _currentModal.querySelector('.modal-content').innerHTML = contentHtml;
  }
}
