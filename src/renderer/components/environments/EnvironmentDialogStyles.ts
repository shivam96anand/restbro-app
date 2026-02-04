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
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  static readonly dialog = `
    background: linear-gradient(135deg,
                rgba(var(--primary-color-rgb), 0.02) 0%,
                var(--bg-secondary) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 700px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                0 8px 24px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05);
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  static readonly header = `
    padding: 24px 28px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(135deg,
                rgba(var(--primary-color-rgb), 0.05) 0%,
                rgba(var(--primary-color-rgb), 0.02) 100%);
    border-radius: 16px 16px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  static readonly title = `
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
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
    padding: 8px 16px;
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-color-rgb), 0.8) 100%);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(var(--primary-color-rgb), 0.3);
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    padding: 20px 28px;
    border-top: 2px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(135deg,
                rgba(var(--primary-color-rgb), 0.02) 0%,
                rgba(var(--primary-color-rgb), 0.05) 100%);
    border-radius: 0 0 16px 16px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;

  static readonly cancelButton = `
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  `;

  static readonly saveButton = `
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-color-rgb), 0.8) 100%);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.3);
  `;

  static readonly tabsContainer = `
    display: flex;
    gap: 0;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
  `;

  static getTabStyle(isActive: boolean): string {
    return `
      padding: 10px 20px;
      background: ${isActive ? 'var(--bg-tertiary)' : 'transparent'};
      border: none;
      border-bottom: 2px solid ${isActive ? 'var(--primary-color)' : 'transparent'};
      color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    `;
  }

  static readonly globalsPanel = `
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
  `;

  static readonly globalsDescription = `
    color: var(--text-secondary);
    font-size: 13px;
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(var(--primary-color-rgb), 0.05);
    border-radius: 4px;
    border-left: 3px solid var(--primary-color);
  `;
}
