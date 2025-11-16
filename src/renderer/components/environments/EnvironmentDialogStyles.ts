/**
 * Styles for environment management dialog
 */

export class EnvironmentDialogStyles {
  static readonly overlay = `
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

  static readonly dialog = `
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    width: 700px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  `;

  static readonly header = `
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  static readonly title = `
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
  `;

  static readonly buttonsContainer = `
    display: flex;
    gap: 8px;
  `;

  static readonly deleteAllButton = `
    padding: 6px 12px;
    background: var(--error-color);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 13px;
  `;

  static readonly addButton = `
    padding: 6px 12px;
    background: var(--primary-color);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 13px;
  `;

  static readonly body = `
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
  `;

  static readonly emptyState = `
    color: var(--text-secondary);
    text-align: center;
    padding: 40px 20px;
  `;

  static readonly layout = `
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 20px;
    height: 100%;
  `;

  static readonly envList = `
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow-y: auto;
    max-height: 400px;
  `;

  static getEnvItemStyle(isSelected: boolean): string {
    return `
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${isSelected ? 'var(--bg-tertiary)' : 'transparent'};
    `;
  }

  static readonly envNameSpan = `
    flex: 1;
    color: var(--text-primary);
    font-size: 14px;
  `;

  static readonly envDetails = `
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 16px;
    overflow-y: auto;
    max-height: 400px;
  `;

  static readonly label = `
    display: block;
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 4px;
  `;

  static readonly nameInput = `
    width: 100%;
    padding: 8px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 14px;
    margin-bottom: 16px;
  `;

  static readonly varsLabel = `
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 8px;
  `;

  static readonly varsContainer = `
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 12px;
  `;

  static readonly varRow = `
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 8px;
    margin-bottom: 8px;
  `;

  static readonly varInput = `
    padding: 6px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 13px;
  `;

  static readonly deleteVarButton = `
    padding: 6px 10px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--error-color);
    cursor: pointer;
    font-size: 14px;
  `;

  static readonly addVarButton = `
    padding: 6px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 13px;
    width: 100%;
  `;

  static readonly deleteEnvButton = `
    padding: 8px 16px;
    background: var(--bg-tertiary);
    border: 1px solid var(--error-color);
    border-radius: 4px;
    color: var(--error-color);
    cursor: pointer;
    font-size: 13px;
    width: 100%;
  `;

  static readonly footer = `
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;

  static readonly cancelButton = `
    padding: 8px 16px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
  `;

  static readonly saveButton = `
    padding: 8px 16px;
    background: var(--primary-color);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 14px;
  `;
}
