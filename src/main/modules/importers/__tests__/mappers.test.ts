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
          authUrl: 'https://example.com/auth',
          accessToken: '{{accessToken}}',
          tokenUrl: 'https://example.com/token',
        },
      });
    });

    it('maps Postman OAuth2 array using accessTokenUrl and grant_type keys', () => {
      // Real Postman exports store OAuth2 as an array of {key, value} where the
      // token URL key is `accessTokenUrl` and the grant type key is snake_case
      // `grant_type`. Both must map to Restbro's canonical tokenUrl/grantType.
      expect(
        mapAuth({
          type: 'oauth2',
          oauth2: [
            { key: 'clientSecret', value: '{{poq_clientsecret_v5}}' },
            { key: 'clientId', value: '{{poq_clientid_v5}}' },
            { key: 'tokenName', value: 'poq-v3-token' },
            { key: 'accessTokenUrl', value: '{{poq_tokenurl}}' },
            { key: 'grant_type', value: 'client_credentials' },
            { key: 'addTokenTo', value: 'header' },
          ],
        })
      ).toEqual({
        type: 'oauth2',
        config: {
          grantType: 'client_credentials',
          clientId: '{{poq_clientid_v5}}',
          clientSecret: '{{poq_clientsecret_v5}}',
          tokenUrl: '{{poq_tokenurl}}',
        },
      });
    });

    it('maps Bruno/Insomnia snake_case OAuth2 fields to canonical names', () => {
      expect(
        mapAuth({
          type: 'oauth2',
          grant_type: 'authorization_code',
          access_token_url: 'https://id.example.com/token',
          authorization_url: 'https://id.example.com/authorize',
          client_id: 'cid',
          client_secret: 'csecret',
          redirect_uri: 'http://localhost:8080/callback',
        })
      ).toEqual({
        type: 'oauth2',
        config: {
          grantType: 'authorization_code',
          tokenUrl: 'https://id.example.com/token',
          authUrl: 'https://id.example.com/authorize',
          clientId: 'cid',
          clientSecret: 'csecret',
          redirectUri: 'http://localhost:8080/callback',
        },
      });
    });

    it('falls back to client_credentials for unsupported grant types', () => {
      const result = mapAuth({
        type: 'oauth2',
        oauth2: [
          { key: 'grant_type', value: 'password_credentials' },
          { key: 'accessTokenUrl', value: 'https://example.com/token' },
        ],
      });
      expect(result.config.grantType).toBe('client_credentials');
      expect(result.config.tokenUrl).toBe('https://example.com/token');
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
