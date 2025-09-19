export class Modal {
  private modal: HTMLElement | null = null;

  show(title: string, placeholder: string = ''): Promise<string | null> {
    return new Promise((resolve) => {
      this.createModal(title, placeholder, resolve);
    });
  }

  private createModal(title: string, placeholder: string, resolve: (value: string | null) => void): void {
    // Remove existing modal if any
    this.hide();

    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay';
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 24px;
      min-width: 300px;
      max-width: 500px;
    `;

    // Create title
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = title;
    modalTitle.style.cssText = `
      margin: 0 0 16px 0;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
    `;

    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 14px;
      margin-bottom: 16px;
    `;

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    `;

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 14px;
    `;

    // Create OK button
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
      padding: 8px 16px;
      background: var(--primary-color);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 14px;
    `;

    // Add event listeners
    const handleCancel = () => {
      this.hide();
      resolve(null);
    };

    const handleOk = () => {
      const value = input.value.trim();
      if (value) {
        this.hide();
        resolve(value);
      }
    };

    cancelButton.addEventListener('click', handleCancel);
    okButton.addEventListener('click', handleOk);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleOk();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    });

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        handleCancel();
      }
    });

    // Assemble modal
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(okButton);
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(input);
    modalContent.appendChild(buttonsContainer);
    this.modal.appendChild(modalContent);

    // Add to DOM and focus input
    document.body.appendChild(this.modal);
    input.focus();
  }

  hide(): void {
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
    }
  }
}

export const modal = new Modal();