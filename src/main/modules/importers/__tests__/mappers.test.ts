import { describe, expect, it } from 'vitest';
import { mapAuth, mapHttpMethod, sanitizeName } from '../mappers';

describe('importers/mappers.ts', () => {
  describe('mapHttpMethod', () => {
    it.each([
      ['GET', 'GET'],
      ['post', 'POST'],
      ['DELETE', 'DELETE'],
      ['HEAD', 'HEAD'],
      ['OPTIONS', 'OPTIONS'],
      [undefined, 'GET'],
      ['', 'GET'],
      ['INVALID', 'GET'],
    ])('maps %s to %s', (method, expected) => {
      expect(mapHttpMethod(method)).toBe(expected);
    });
  });

  describe('mapAuth', () => {
    it('returns none for nullish auth and noauth', () => {
      expect(mapAuth(undefined)).toEqual({ type: 'none', config: {} });
      expect(mapAuth(null)).toEqual({ type: 'none', config: {} });
      expect(mapAuth({ type: 'noauth' })).toEqual({ type: 'none', config: {} });
    });

    it('maps Postman basic auth arrays', () => {
      expect(
        mapAuth({
          type: 'basic',
          basic: [
            { key: 'username', value: 'alice' },
            { key: 'password', value: 'secret' },
          ],
        })
      ).toEqual({
        type: 'basic',
        config: {
          username: 'alice',
          password: 'secret',
        },
      });
    });

    it('maps bearer auth', () => {
      expect(
        mapAuth({
          type: 'bearer',
          bearer: [{ key: 'token', value: 'abc123' }],
        })
      ).toEqual({
        type: 'bearer',
        config: {
          token: 'abc123',
        },
      });
    });

    it('maps api-key auth with location', () => {
      expect(
        mapAuth({
          type: 'apikey',
          key: 'X-API-Key',
          value: 'secret',
          in: 'header',
        })
      ).toEqual({
        type: 'api-key',
        config: {
          key: 'X-API-Key',
          value: 'secret',
          location: 'header',
          in: 'header',
        },
      });
    });

    it('maps oauth2 auth fields from Postman arrays and direct properties', () => {
      expect(
        mapAuth({
          type: 'oauth2',
          oauth2: [
            { key: 'grantType', value: 'authorization_code' },
            { key: 'clientId', value: 'client-id' },
            { key: 'clientSecret', value: 'client-secret' },
            { key: 'scope', value: 'read write' },
          ],
          accessTokenUrl: 'https://example.com/token',
          authUrl: 'https://example.com/auth',
          accessToken: '{{accessToken}}',
        })
      ).toEqual({
        type: 'oauth2',
        config: {
          grantType: 'authorization_code',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          scope: 'read write',
          accessTokenUrl: 'https://example.com/token',
          authUrl: 'https://example.com/auth',
          accessToken: '{{accessToken}}',
          tokenUrl: 'https://example.com/token',
        },
      });
    });

    it('returns none for unknown auth types', () => {
      expect(mapAuth({ type: 'digest' })).toEqual({ type: 'none', config: {} });
    });
  });

  describe('sanitizeName', () => {
    it('returns normal names unchanged', () => {
      expect(sanitizeName('Users API')).toBe('Users API');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeName('  Users API  ')).toBe('Users API');
    });

    it('returns Untitled for empty, null, or undefined names', () => {
      expect(sanitizeName('')).toBe('Untitled');
      expect(sanitizeName('   ')).toBe('Untitled');
      expect(sanitizeName(null)).toBe('Untitled');
      expect(sanitizeName(undefined)).toBe('Untitled');
    });
  });
});
