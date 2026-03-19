import { describe, expect, it } from 'vitest';
import { RequestErrorFormatter } from '../request-error-formatter';

function parseJson(json: string): Record<string, unknown> {
  return JSON.parse(json) as Record<string, unknown>;
}

describe('request-error-formatter.ts', () => {
  describe('getErrorStatusCode', () => {
    it.each([
      ['ENOTFOUND', 0],
      ['ECONNREFUSED', 0],
      ['ETIMEDOUT', 0],
      ['ECONNRESET', 0],
      ['EPIPE', 0],
      ['EHOSTUNREACH', 0],
      ['ENETUNREACH', 0],
      ['CERT_HAS_EXPIRED', 495],
      ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 495],
      ['SELF_SIGNED_CERT_IN_CHAIN', 495],
      ['ERR_TLS_CERT_ALTNAME_INVALID', 495],
      ['ERR_INVALID_URL', 400],
      ['ERR_INVALID_PROTOCOL', 400],
      ['SOMETHING_ELSE', 500],
    ])('maps %s to %i', (code, expected) => {
      expect(RequestErrorFormatter.getErrorStatusCode({ code })).toBe(expected);
    });

    it('falls back to 500 when no error code is present', () => {
      expect(RequestErrorFormatter.getErrorStatusCode({})).toBe(500);
    });
  });

  describe('getErrorTitle', () => {
    it.each([
      ['ENOTFOUND', 'DNS Resolution Failed'],
      ['ECONNREFUSED', 'Connection Refused'],
      ['ETIMEDOUT', 'Connection Timeout'],
      ['ECONNRESET', 'Connection Reset'],
      ['CERT_HAS_EXPIRED', 'SSL Certificate Expired'],
      ['SELF_SIGNED_CERT_IN_CHAIN', 'Self-Signed Certificate'],
      ['ERR_TLS_CERT_ALTNAME_INVALID', 'TLS/SSL Error'],
      ['ERR_INVALID_URL', 'Invalid URL'],
      ['UNKNOWN', 'Request Failed'],
    ])('maps %s to %s', (code, expected) => {
      expect(RequestErrorFormatter.getErrorTitle({ code })).toBe(expected);
    });
  });

  describe('formatNetworkError', () => {
    it('returns valid JSON with the expected fields and URL', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatNetworkError(
          { code: 'ENOTFOUND', message: 'lookup failed' },
          'https://api.example.com/users'
        )
      );

      expect(payload).toMatchObject({
        error: 'Network Error',
        message: 'lookup failed',
        url: 'https://api.example.com/users',
        code: 'ENOTFOUND',
      });
      expect(payload.details).toEqual(expect.any(String));
      expect(payload.suggestions).toEqual(expect.any(Array));
      expect(new Date(payload.timestamp as string).toISOString()).toBe(
        payload.timestamp
      );
    });

    it('includes ENOTFOUND-specific suggestions', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatNetworkError(
          { code: 'ENOTFOUND', message: 'lookup failed' },
          'https://missing.example.com'
        )
      );

      expect(payload.suggestions).toEqual([
        'Verify the URL is correct',
        'Check your internet connection',
        'Try using the IP address instead of domain name',
      ]);
    });

    it('includes ECONNREFUSED-specific suggestions', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatNetworkError(
          { code: 'ECONNREFUSED', message: 'refused' },
          'https://api.example.com'
        )
      );

      expect(payload.suggestions).toEqual([
        'Verify the server is running',
        'Check the port number is correct',
        'Ensure no firewall is blocking the connection',
      ]);
    });

    it('includes ETIMEDOUT-specific suggestions', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatNetworkError(
          { code: 'ETIMEDOUT', message: 'timed out' },
          'https://api.example.com'
        )
      );

      expect(payload.suggestions).toEqual([
        'Check your internet connection',
        'Verify the server is responding',
        'Try increasing the timeout value',
      ]);
    });
  });

  describe('formatUnresolvedVariablesError', () => {
    it('returns valid JSON with the unresolved variable details', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatUnresolvedVariablesError(
          'https://{{host}}/{{path}}',
          ['host', 'path']
        )
      );

      expect(payload).toMatchObject({
        error: 'Unresolved Variables',
        message: 'URL contains unresolved variables',
        url: 'https://{{host}}/{{path}}',
        unresolvedVariables: ['host', 'path'],
      });
      expect(payload.details).toBe(
        'The following variables could not be resolved: host, path'
      );
    });
  });

  describe('formatDecompressionError', () => {
    it('returns valid JSON with a decompression error payload', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatDecompressionError({
          message: 'invalid gzip data',
        })
      );

      expect(payload.error).toBe('Decompression Error');
      expect(payload.message).toBe('Failed to decompress response body');
      expect(payload.details).toBe('invalid gzip data');
      expect(payload.suggestions).toEqual(expect.any(Array));
      expect((payload.suggestions as unknown[]).length).toBeGreaterThan(0);
    });
  });

  describe('formatGeneralError', () => {
    it('returns valid JSON including the URL and message', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatGeneralError(
          { code: 'ERR_INVALID_URL', message: 'bad url' },
          'invalid-url'
        )
      );

      expect(payload).toMatchObject({
        error: 'Request Failed',
        message: 'bad url',
        url: 'invalid-url',
      });
    });

    it('falls back to a generic message when the error message is absent', () => {
      const payload = parseJson(
        RequestErrorFormatter.formatGeneralError({}, 'https://api.example.com')
      );

      expect(payload.message).toBe('An unexpected error occurred');
    });
  });
});
