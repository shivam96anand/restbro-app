type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function showConfirmDialog(
  options: ConfirmDialogOptions
): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    destructive = false,
  } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    const header = document.createElement('div');
    header.className = 'confirm-dialog-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'confirm-dialog-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const body = document.createElement('div');
    body.className = 'confirm-dialog-body';
    body.textContent = message;

    const footer = document.createElement('div');
    footer.className = 'confirm-dialog-footer';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'confirm-dialog-button cancel';
    cancelButton.textContent = cancelLabel;

    const confirmButton = document.createElement('button');
    confirmButton.className = 'confirm-dialog-button confirm';
    if (destructive) {
      confirmButton.classList.add('destructive');
    }
    confirmButton.textContent = confirmLabel;

    const cleanup = (result: boolean) => {
      overlay.classList.add('closing');
      dialog.classList.add('closing');
      setTimeout(() => {
        document.removeEventListener('keydown', onKeyDown);
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        resolve(result);
      }, 150);
    };

    const onCancel = () => cleanup(false);
    const onConfirm = () => cleanup(true);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      }
    };

    cancelButton.addEventListener('click', onCancel);
    confirmButton.addEventListener('click', onConfirm);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        onCancel();
      }
    });

    footer.appendChild(cancelButton);
    footer.appendChild(confirmButton);
    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      dialog.classList.add('visible');
      confirmButton.focus();
    });
  });
}
