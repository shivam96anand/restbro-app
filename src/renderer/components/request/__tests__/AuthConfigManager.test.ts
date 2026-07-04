/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthConfigManager } from '../AuthConfigManager';
import type { OAuth2Manager } from '../OAuth2Manager';
import type { UIHelpers } from '../UIHelpers';

const AUTH_SECTION_HTML = `
  <select id="auth-type">
    <option value="none">No Auth</option>
    <option value="basic">Basic Auth</option>
    <option value="oauth2">OAuth 2.0</option>
  </select>
  <div id="auth-config" class="auth-config"></div>
`;

function selectAuthType(value: string): void {
  const select = document.getElementById('auth-type') as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('AuthConfigManager auth-type change handling', () => {
  let oauth2Manager: OAuth2Manager;
  let uiHelpers: UIHelpers;
  let onAuthUpdate: ReturnType<typeof vi.fn>;
  let manager: AuthConfigManager;

  beforeEach(() => {
    document.body.innerHTML = `<div id="auth-section" class="section">${AUTH_SECTION_HTML}</div>`;

    oauth2Manager = {
      renderConfig: vi.fn(),
      setCollectionId: vi.fn(),
      setLoadingState: vi.fn(),
      loadConfig: vi.fn(),
    } as unknown as OAuth2Manager;

    uiHelpers = {
      toggleOAuthStatus: vi.fn(),
    } as unknown as UIHelpers;

    onAuthUpdate = vi.fn();
    manager = new AuthConfigManager(onAuthUpdate, oauth2Manager, uiHelpers);
    manager.setup();
  });

  it('renders OAuth2 fields when OAuth 2.0 is selected', () => {
    selectAuthType('oauth2');

    expect(oauth2Manager.renderConfig).toHaveBeenCalledTimes(1);
    expect(uiHelpers.toggleOAuthStatus).toHaveBeenCalledWith(true);
    expect(onAuthUpdate).toHaveBeenCalledWith({ type: 'oauth2', config: {} });
  });

  it('still renders OAuth2 fields after the auth section DOM is rebuilt', () => {
    // Simulates SoapCertsManager wiping and restoring #auth-section innerHTML
    // when toggling to SOAP (Certs) and back to REST (Auth). The change listener
    // must survive because it is delegated to the stable #auth-section container.
    const authSection = document.getElementById('auth-section') as HTMLElement;
    authSection.innerHTML = AUTH_SECTION_HTML;

    selectAuthType('oauth2');

    expect(oauth2Manager.renderConfig).toHaveBeenCalledTimes(1);
    expect(onAuthUpdate).toHaveBeenCalledWith({ type: 'oauth2', config: {} });
  });
});
