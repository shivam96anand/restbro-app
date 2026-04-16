/**
 * Shared request building utilities used by both main process and renderer.
 * Environment-specific functions (e.g., Buffer vs btoa) remain in their
 * respective modules.
 */

import { ApiRequest, KeyValuePair } from './types';

/**
 * Resolves the content type for a request body
 */
export function resolveContentType(
  body: ApiRequest['body']
): string | undefined {
  if (!body) return undefined;

  if (body.contentType) {
    return body.contentType;
  }

  switch (body.format) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'yaml':
      return 'application/x-yaml';
    case 'text':
      return 'text/plain';
    case 'form-urlencoded':
      return 'application/x-www-form-urlencoded';
    default:
      break;
  }

  switch (body.type) {
    case 'json':
      return 'application/json';
    case 'form-data':
      return 'multipart/form-data';
    case 'form-urlencoded':
      return 'application/x-www-form-urlencoded';
    default:
      return undefined;
  }
}

/**
 * Builds auth query parameters from a request
 */
export function buildAuthQueryParams(
  request: ApiRequest
): Record<string, string> {
  if (
    request.auth?.type === 'api-key' &&
    request.auth.config.location === 'query'
  ) {
    const key = request.auth.config.key || 'api_key';
    const value = request.auth.config.value || '';
    if (key.trim() && value.trim()) {
      return { [key]: value };
    }
  }

  return {};
}

/**
 * Checks if a header exists (case-insensitive)
 */
export function hasHeader(
  headers: Record<string, string>,
  headerName: string
): boolean {
  const target = headerName.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

/**
 * Collects params from array or object format, plus extra params.
 * Allows empty values (e.g., ?flag=) — only requires a non-empty key.
 */
export function collectParams(
  params?: KeyValuePair[] | Record<string, string>,
  extraParams?: Record<string, string>
): Array<{ key: string; value: string }> {
  const merged: Array<{ key: string; value: string }> = [];

  if (params) {
    if (Array.isArray(params)) {
      params.forEach(({ key, value, enabled }) => {
        if (enabled && key.trim()) {
          merged.push({ key: key.trim(), value: value.trim() });
        }
      });
    } else {
      Object.entries(params).forEach(([key, value]) => {
        if (key.trim()) {
          merged.push({ key: key.trim(), value: value.trim() });
        }
      });
    }
  }

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (key.trim()) {
        merged.push({ key: key.trim(), value: value.trim() });
      }
    });
  }

  return merged;
}

/**
 * Appends params to a URL without encoding (for template variable URLs)
 */
export function appendParamsWithoutEncoding(
  baseUrl: string,
  params: Array<{ key: string; value: string }>
): string {
  const [urlWithoutHash, hash] = baseUrl.split('#');
  const separator = urlWithoutHash.includes('?') ? '&' : '?';
  const query = params.map(({ key, value }) => `${key}=${value}`).join('&');
  const rebuilt = `${urlWithoutHash}${separator}${query}`;
  return hash ? `${rebuilt}#${hash}` : rebuilt;
}

/**
 * Builds a URL with query parameters, handling template variables
 */
export function buildUrlWithParams(
  baseUrl: string,
  params?: KeyValuePair[] | Record<string, string>,
  extraParams?: Record<string, string>
): string {
  const mergedParams = collectParams(params, extraParams);
  if (mergedParams.length === 0) {
    return baseUrl;
  }

  const hasTemplateVars = baseUrl.includes('{{');
  if (hasTemplateVars) {
    return appendParamsWithoutEncoding(baseUrl, mergedParams);
  }

  try {
    const [urlWithoutHash, hash] = baseUrl.split('#');
    const [path, queryString = ''] = urlWithoutHash.split('?');
    const searchParams = new URLSearchParams(queryString);

    mergedParams.forEach(({ key, value }) => {
      searchParams.set(key, value);
    });

    const query = searchParams.toString();
    const rebuilt = query ? `${path}?${query}` : path;
    return hash ? `${rebuilt}#${hash}` : rebuilt;
  } catch {
    return appendParamsWithoutEncoding(baseUrl, mergedParams);
  }
}

/**
 * Builds the body data and content type from a request.
 * Note: multipart/form-data encoding is handled by the main process
 * request-builder only (requires Buffer). This returns raw content for
 * display purposes (cURL preview).
 */
export function buildBody(request: ApiRequest): {
  bodyData?: string;
  contentType?: string;
} {
  if (!request.body || request.body.type === 'none') {
    return {};
  }

  const bodyData = request.body.content || '';
  const contentType = resolveContentType(request.body);

  return { bodyData, contentType };
}
