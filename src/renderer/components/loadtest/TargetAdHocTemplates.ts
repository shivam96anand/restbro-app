/**
 * HTML templates for AdHoc target editor
 */

export class TargetAdHocTemplates {
  static getMainTemplate(): string {
    return `
      <div class="target-adhoc-editor">
        <div class="request-line">
          <select id="target-method" class="method-select">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
          <input type="text" id="target-url" class="url-input" placeholder="Enter request URL">
        </div>

        <div class="target-details">
          <div class="tabs">
            <button class="tab active" data-section="params">Params</button>
            <button class="tab" data-section="headers">Headers</button>
            <button class="tab" data-section="auth">Auth</button>
            <button class="tab" data-section="body">Body</button>
          </div>

          <div id="target-params-section" class="section active">
            <div class="key-value-editor" id="target-params-editor">
              ${this.getKeyValueRow()}
            </div>
            <button class="add-param-btn" type="button">Add Parameter</button>
          </div>

          <div id="target-headers-section" class="section">
            <div class="key-value-editor" id="target-headers-editor">
              ${this.getKeyValueRow()}
            </div>
            <button class="add-header-btn" type="button">Add Header</button>
          </div>

          <div id="target-auth-section" class="section">
            <select id="target-auth-type" class="form-input">
              <option value="none">No Auth</option>
              <option value="basic">Basic Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="apikey">API Key</option>
            </select>
            <div id="target-auth-config" class="auth-config"></div>
          </div>

          <div id="target-body-section" class="section">
            <div class="body-type-selector">
              <label><input type="radio" name="target-body-type" value="none" checked> None</label>
              <label><input type="radio" name="target-body-type" value="json"> JSON</label>
              <label><input type="radio" name="target-body-type" value="raw"> Raw</label>
              <label><input type="radio" name="target-body-type" value="form-urlencoded"> Form URL Encoded</label>
            </div>
            <textarea id="target-request-body" class="body-editor" placeholder="Request body"></textarea>
          </div>
        </div>
      </div>
    `;
  }

  static getKeyValueRow(): string {
    return `
      <div class="kv-row">
        <input type="checkbox" class="kv-checkbox" checked>
        <input type="text" placeholder="Key" class="key-input">
        <input type="text" placeholder="Value" class="value-input">
        <button class="remove-btn" type="button">×</button>
      </div>
    `;
  }

  static getBasicAuthTemplate(): string {
    return `
      <input type="text" placeholder="Username" class="auth-input" id="auth-username">
      <input type="password" placeholder="Password" class="auth-input" id="auth-password">
    `;
  }

  static getBearerAuthTemplate(): string {
    return `
      <input type="text" placeholder="Token" class="auth-input" id="auth-token">
    `;
  }

  static getApiKeyAuthTemplate(): string {
    return `
      <input type="text" placeholder="Key" class="auth-input" id="auth-key">
      <input type="text" placeholder="Value" class="auth-input" id="auth-value">
      <select class="auth-input" id="auth-location">
        <option value="header">Header</option>
        <option value="query">Query Parameter</option>
      </select>
    `;
  }
}
