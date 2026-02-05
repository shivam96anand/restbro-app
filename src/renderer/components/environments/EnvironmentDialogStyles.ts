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
    background: radial-gradient(120% 120% at 20% 0%, rgba(var(--primary-color-rgb), 0.12), transparent 50%),
                rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px) saturate(110%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  static readonly dialog = `
    background: linear-gradient(160deg,
                rgba(var(--primary-color-rgb), 0.08) 0%,
                rgba(20, 22, 26, 0.98) 30%,
                var(--bg-secondary) 100%);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    width: min(980px, 94vw);
    max-height: min(86vh, 900px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55),
                0 10px 26px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.03);
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  static readonly header = `
    padding: 20px 26px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: linear-gradient(135deg,
                rgba(var(--primary-color-rgb), 0.06) 0%,
                rgba(var(--primary-color-rgb), 0.02) 100%);
    border-radius: 16px 16px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  `;

  static readonly title = `
    margin: 0;
    color: rgba(255, 255, 255, 0.96);
    font-size: 21px;
    font-weight: 600;
    letter-spacing: -0.02em;
  `;

  static readonly buttonsContainer = `
    display: flex;
    gap: 10px;
    align-items: center;
  `;

  static readonly deleteAllButton = `
    padding: 7px 12px;
    background: rgba(var(--error-color-rgb), 0.1);
    border: 1px solid rgba(var(--error-color-rgb), 0.35);
    border-radius: 9px;
    color: var(--error-color);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  `;

  static readonly addButton = `
    padding: 8px 14px;
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-color-rgb), 0.85) 100%);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(var(--primary-color-rgb), 0.28);
  `;

  static readonly body = `
    padding: 18px 26px 22px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
  `;

  static readonly emptyState = `
    color: var(--text-secondary);
    text-align: center;
    padding: 44px 20px;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.2);
  `;

  static readonly layout = `
    display: grid;
    grid-template-columns: 230px 1fr;
    gap: 16px;
    height: 100%;
    min-height: 460px;
  `;

  static readonly envList = `
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.16);
    display: flex;
    flex-direction: column;
    min-height: 280px;
  `;

  static readonly envListHeader = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.015);
  `;

  static readonly envListTitle = `
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
  `;

  static readonly envListCount = `
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
    padding: 2px 8px;
  `;

  static readonly envListBody = `
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    max-height: 520px;
  `;

  static getEnvItemStyle(isSelected: boolean): string {
    return `
      padding: 10px 12px;
      border: 1px solid ${isSelected ? 'rgba(var(--primary-color-rgb), 0.45)' : 'rgba(255, 255, 255, 0.05)'};
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      background: ${isSelected
        ? 'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.14) 0%, rgba(0, 0, 0, 0.22) 100%)'
        : 'rgba(0, 0, 0, 0.18)'};
      box-shadow: ${isSelected ? 'inset 2px 0 0 var(--primary-color)' : 'none'};
      transition: all 0.2s ease;
    `;
  }

  static readonly envNameSpan = `
    flex: 1;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
  `;

  static readonly envMeta = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
  `;

  static readonly activeBadge = `
    background: rgba(var(--success-color-rgb), 0.15);
    color: var(--success-color);
    border: 1px solid rgba(var(--success-color-rgb), 0.35);
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
  `;

  static readonly setActiveButton = `
    padding: 6px 10px;
    background: rgba(var(--primary-color-rgb), 0.12);
    border: 1px solid rgba(var(--primary-color-rgb), 0.4);
    border-radius: 999px;
    color: var(--text-primary);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  `;

  static readonly envDetails = `
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 16px;
    overflow-y: auto;
    max-height: 520px;
    background: rgba(0, 0, 0, 0.16);
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  static readonly detailHeader = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  `;

  static readonly detailTitle = `
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
  `;

  static readonly label = `
    display: block;
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 4px;
  `;

  static readonly nameInput = `
    width: 100%;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    margin-bottom: 4px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  `;

  static readonly varsHeader = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  `;

  static readonly varsTitle = `
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  `;

  static readonly varsCount = `
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
  `;

  static readonly varsLabel = `
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 8px;
  `;

  static readonly varsContainer = `
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 8px;
    background: rgba(0, 0, 0, 0.16);
  `;

  static readonly varHeaderRow = `
    display: grid;
    grid-template-columns: minmax(140px, 1fr) minmax(180px, 1.2fr) minmax(180px, 1.1fr) auto;
    gap: 8px;
    padding: 4px 8px 6px;
    color: rgba(255, 255, 255, 0.55);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  `;

  static readonly varHeaderCell = `
    display: flex;
    align-items: center;
    justify-content: flex-start;
  `;

  static readonly varRow = `
    display: grid;
    grid-template-columns: minmax(140px, 1fr) minmax(180px, 1.2fr) minmax(180px, 1.1fr) auto;
    gap: 8px;
    margin-bottom: 10px;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
    align-items: center;
  `;

  static readonly varInput = `
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
    font-family: var(--font-mono);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  `;

  static readonly varInputDescription = `
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
    font-family: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  `;

  static readonly deleteVarButton = `
    padding: 6px 10px;
    background: rgba(var(--error-color-rgb), 0.1);
    border: 1px solid rgba(var(--error-color-rgb), 0.35);
    border-radius: 6px;
    color: var(--error-color);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;

  static readonly addVarButton = `
    padding: 8px 12px;
    background: rgba(var(--primary-color-rgb), 0.1);
    border: 1px dashed rgba(var(--primary-color-rgb), 0.4);
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    width: 100%;
  `;

  static readonly deleteEnvButton = `
    padding: 10px 16px;
    background: rgba(var(--error-color-rgb), 0.08);
    border: 1px solid rgba(var(--error-color-rgb), 0.4);
    border-radius: 8px;
    color: var(--error-color);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    width: 100%;
    margin-top: 4px;
  `;

  static readonly footer = `
    padding: 18px 26px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: linear-gradient(135deg,
                rgba(var(--primary-color-rgb), 0.02) 0%,
                rgba(var(--primary-color-rgb), 0.06) 100%);
    border-radius: 0 0 16px 16px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;

  static readonly cancelButton = `
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 9px;
    color: rgba(255, 255, 255, 0.92);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  `;

  static readonly saveButton = `
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-color-rgb), 0.85) 100%);
    border: none;
    border-radius: 9px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(var(--primary-color-rgb), 0.28);
  `;

  static readonly tabsContainer = `
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.2);
    align-self: flex-start;
  `;

  static getTabStyle(isActive: boolean): string {
    return `
      padding: 8px 14px;
      background: ${isActive
        ? 'linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.3) 0%, rgba(var(--primary-color-rgb), 0.15) 100%)'
        : 'transparent'};
      border: 1px solid ${isActive ? 'rgba(var(--primary-color-rgb), 0.4)' : 'transparent'};
      border-radius: 8px;
      color: ${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;
  }

  static readonly globalsPanel = `
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.2);
  `;

  static readonly globalsDescription = `
    color: var(--text-secondary);
    font-size: 13px;
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(var(--primary-color-rgb), 0.08);
    border-radius: 8px;
    border-left: 3px solid var(--primary-color);
    line-height: 1.4;
  `;
}
