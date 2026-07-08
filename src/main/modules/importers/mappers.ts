/**
 * Shared mapping utilities for converting Postman/Insomnia data to Restbro format
 */

import { randomBytes } from 'crypto';

export function generateId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Maps generic HTTP method strings to our HttpMethod type
 */
export function mapHttpMethod(
  method?: string
): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' {
  const normalized = (method || 'GET').toUpperCase();
  const validMethods = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
  ];

  if (validMethods.includes(normalized)) {
    return normalized as any;
  }

  return 'GET';
}

/**
 * Maps Postman/Insomnia auth to Restbro auth format
 */
export function mapAuth(authConfig: any): {
  type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2';
  config: Record<string, string>;
} {
  if (!authConfig || !authConfig.type || authConfig.type === 'noauth') {
    return { type: 'none', config: {} };
  }

  let type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2' = 'none';
  const rawType = authConfig.type;

  // Map to valid auth types
  if (rawType === 'basic') {
    type = 'basic';
  } else if (rawType === 'bearer') {
    type = 'bearer';
  } else if (rawType === 'apikey' || rawType === 'api-key') {
    type = 'api-key';
  } else if (rawType === 'oauth2') {
    type = 'oauth2';
  } else {
    // Unknown type, default to none
    return { type: 'none', config: {} };
  }

  const config: Record<string, string> = {};

  if (type === 'basic') {
    // Postman: auth.basic array with {key, value}
    if (Array.isArray(authConfig.basic)) {
      authConfig.basic.forEach((item: any) => {
        config[item.key] = String(item.value || '');
      });
    }
    // Insomnia: direct properties
    if (authConfig.username) config.username = String(authConfig.username);
    if (authConfig.password) config.password = String(authConfig.password);
  } else if (type === 'bearer') {
    // Postman: auth.bearer array
    if (Array.isArray(authConfig.bearer)) {
      authConfig.bearer.forEach((item: any) => {
        config[item.key] = String(item.value || '');
      });
    }
    // Insomnia: direct token property
    if (authConfig.token) config.token = String(authConfig.token);
  } else if (type === 'oauth2') {
    // Normalize OAuth2 across Postman (array form), Insomnia/Thunder (direct
    // props) and Bruno (snake_case) into Restbro's canonical fields so the
    // token URL and grant type populate regardless of the source tool.
    mapOAuth2Config(authConfig, config);
  } else if (type === 'api-key') {
    // API Key auth
    if (authConfig.key) config.key = String(authConfig.key);
    if (authConfig.value) config.value = String(authConfig.value);
    if (authConfig.in) {
      const location = String(authConfig.in);
      config.location = location;
      config.in = location;
    }
  }

  return { type, config };
}

/**
 * OAuth2 field aliases across tools mapped to Restbro's canonical field names
 * (the `data-field` names the OAuth2 UI reads/writes):
 * - Postman: OAuth2 is an array of {key, value}; the token URL is
 *   `accessTokenUrl` and the grant type is `grant_type`.
 * - Insomnia / Thunder Client: direct props (`accessTokenUrl`, `authorizationUrl`).
 * - Bruno: snake_case (`access_token_url`, `authorization_url`).
 */
const OAUTH2_FIELD_ALIASES: Record<string, string[]> = {
  grantType: ['grantType', 'grant_type'],
  tokenUrl: ['tokenUrl', 'accessTokenUrl', 'access_token_url'],
  authUrl: ['authUrl', 'authorizationUrl', 'authorization_url', 'authorizeUrl'],
  clientId: ['clientId', 'client_id'],
  clientSecret: ['clientSecret', 'client_secret'],
  scope: ['scope'],
  redirectUri: ['redirectUri', 'redirect_uri', 'callbackUrl'],
  accessToken: ['accessToken', 'access_token'],
  refreshToken: ['refreshToken', 'refresh_token'],
  audience: ['audience'],
  resource: ['resource'],
};

/**
 * Normalizes a grant-type string to a value Restbro's OAuth2 UI supports.
 * Unsupported grants (password, implicit, …) fall back to client_credentials,
 * the UI default, so imported requests still render a valid selection.
 */
function normalizeGrantType(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (
    normalized === 'authorization_code' ||
    normalized === 'authorizationcode'
  ) {
    return 'authorization_code';
  }
  if (normalized === 'device_code' || normalized === 'devicecode') {
    return 'device_code';
  }
  return 'client_credentials';
}

/**
 * Maps an OAuth2 auth block (Postman array form and/or direct-property form)
 * into Restbro's config record, preserving {{variables}}.
 */
function mapOAuth2Config(
  authConfig: any,
  config: Record<string, string>
): void {
  // Flatten Postman's [{key, value}] array plus any direct string properties
  // into a single lookup table (array entries win over direct props).
  const raw: Record<string, string> = {};

  if (Array.isArray(authConfig.oauth2)) {
    authConfig.oauth2.forEach((item: any) => {
      if (item?.key != null && raw[item.key] === undefined) {
        raw[item.key] = String(item.value ?? '');
      }
    });
  }

  Object.keys(authConfig).forEach((key) => {
    const value = authConfig[key];
    if (
      key !== 'oauth2' &&
      key !== 'type' &&
      (typeof value === 'string' || typeof value === 'number') &&
      raw[key] === undefined
    ) {
      raw[key] = String(value);
    }
  });

  for (const [field, aliases] of Object.entries(OAUTH2_FIELD_ALIASES)) {
    let picked: string | undefined;
    for (const alias of aliases) {
      const candidate = raw[alias];
      if (candidate !== undefined && candidate !== '') {
        picked = candidate;
        break;
      }
    }
    if (picked === undefined) continue;
    config[field] = field === 'grantType' ? normalizeGrantType(picked) : picked;
  }
}

/**
 * Sanitizes collection/folder/request names
 */
export function sanitizeName(name?: string | null): string {
  const sanitized = (name || '').trim();
  return sanitized || 'Untitled';
}

/**
 * Generates a unique name by appending suffix if needed
 */
export function makeUniqueName(
  name: string,
  existingNames: Set<string>
): string {
  let candidate = name;
  let counter = 2;

  while (existingNames.has(candidate)) {
    candidate = `${name} (${counter})`;
    counter++;
  }

  existingNames.add(candidate);
  return candidate;
}

/**
 * Postman variable / environment-value entry. `type: 'secret'` marks a value
 * that Postman masks in its UI; Restbro mirrors this via `variableSecrets`.
 */
interface PostmanVarEntry {
  key?: string;
  value?: string | number | boolean | null;
  type?: string;
  enabled?: boolean;
}

/**
 * Converts a Postman variable/value array into a Restbro variables record plus
 * a per-key secret map (keys whose Postman `type` is `secret`). Disabled
 * entries and entries without a key are skipped.
 */
export function mapVariablesWithSecrets(entries?: PostmanVarEntry[]): {
  variables: Record<string, string>;
  variableSecrets: Record<string, boolean>;
} {
  const variables: Record<string, string> = {};
  const variableSecrets: Record<string, boolean> = {};

  if (!Array.isArray(entries)) {
    return { variables, variableSecrets };
  }

  entries.forEach((entry) => {
    if (!entry?.key || entry.enabled === false) return;
    variables[entry.key] = String(entry.value ?? '');
    if (entry.type === 'secret') {
      variableSecrets[entry.key] = true;
    }
  });

  return { variables, variableSecrets };
}
