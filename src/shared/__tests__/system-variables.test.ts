import { describe, expect, it } from 'vitest';
import { resolveSystemVariable } from '../system-variables';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

const FIRST_NAMES = new Set([
  'Ava',
  'Liam',
  'Maya',
  'Noah',
  'Zoe',
  'Ethan',
  'Ivy',
  'Owen',
  'Lila',
  'Leo',
  'Nora',
  'Kai',
  'Mila',
  'Aria',
  'Eli',
  'Sage',
  'Rhea',
  'Jude',
  'Iris',
  'Quinn',
]);
const LAST_NAMES = new Set([
  'Reed',
  'Hayes',
  'Clark',
  'Parker',
  'Reyes',
  'Baker',
  'Lopez',
  'Stone',
  'Cruz',
  'Ward',
  'Bennett',
  'Price',
  'Woods',
  'Cole',
  'Nguyen',
  'Patel',
  'Kim',
  'Diaz',
  'Young',
  'Shaw',
]);
const COLORS = new Set([
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'magenta',
  'rose',
  'slate',
  'navy',
  'olive',
]);
const CITIES = new Set([
  'Seattle',
  'Austin',
  'Denver',
  'Chicago',
  'Boston',
  'Phoenix',
  'Portland',
  'Miami',
  'Toronto',
  'London',
]);
const COUNTRIES = new Set([
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'India',
  'Japan',
  'Australia',
]);

describe('system-variables.ts', () => {
  describe('resolveSystemVariable — recognized variables', () => {
    it('$timestamp returns a numeric string close to Date.now()', () => {
      const before = Date.now();
      const value = resolveSystemVariable('$timestamp');
      const after = Date.now();

      expect(value).toMatch(/^\d+$/);
      expect(Number(value)).toBeGreaterThanOrEqual(before - 1000);
      expect(Number(value)).toBeLessThanOrEqual(after + 1000);
    });

    it('$isoTimestamp returns a valid ISO 8601 string', () => {
      const value = resolveSystemVariable('$isoTimestamp');
      expect(new Date(value as string).toISOString()).toBe(value);
    });

    it('$randomUUID returns a UUID v4', () => {
      expect(resolveSystemVariable('$randomUUID')).toMatch(UUID_V4_RE);
    });

    it('$guid returns a UUID v4 alias', () => {
      expect(resolveSystemVariable('$guid')).toMatch(UUID_V4_RE);
    });

    it('$randomInt returns an integer string within range', () => {
      const value = resolveSystemVariable('$randomInt');
      expect(value).toMatch(/^\d+$/);
      expect(Number(value)).toBeGreaterThanOrEqual(0);
      expect(Number(value)).toBeLessThanOrEqual(1000);
    });

    it('$randomEmail returns an email-like value', () => {
      expect(resolveSystemVariable('$randomEmail')).toContain('@');
    });

    it('$randomFirstName returns a known first name', () => {
      expect(
        FIRST_NAMES.has(resolveSystemVariable('$randomFirstName') as string)
      ).toBe(true);
    });

    it('$randomLastName returns a known last name', () => {
      expect(
        LAST_NAMES.has(resolveSystemVariable('$randomLastName') as string)
      ).toBe(true);
    });

    it('$randomFullName returns a first and last name', () => {
      const value = resolveSystemVariable('$randomFullName') as string;
      const [first, last] = value.split(' ');
      expect(first).toBeTruthy();
      expect(last).toBeTruthy();
      expect(FIRST_NAMES.has(first)).toBe(true);
      expect(LAST_NAMES.has(last)).toBe(true);
    });

    it('$randomWord returns a non-empty string', () => {
      expect(resolveSystemVariable('$randomWord')).toMatch(/\S+/);
    });

    it('$randomCity returns a known city', () => {
      expect(CITIES.has(resolveSystemVariable('$randomCity') as string)).toBe(
        true
      );
    });

    it('$randomCountry returns a known country', () => {
      expect(
        COUNTRIES.has(resolveSystemVariable('$randomCountry') as string)
      ).toBe(true);
    });

    it('$randomColor returns a known lowercase color', () => {
      const value = resolveSystemVariable('$randomColor') as string;
      expect(COLORS.has(value)).toBe(true);
      expect(value).toBe(value.toLowerCase());
    });

    it('$randomHexColor returns a hex color', () => {
      expect(resolveSystemVariable('$randomHexColor')).toMatch(HEX_COLOR_RE);
    });

    it('$randomBoolean returns true or false', () => {
      expect(['true', 'false']).toContain(
        resolveSystemVariable('$randomBoolean')
      );
    });

    it('$randomPassword returns at least 12 characters', () => {
      expect(
        (resolveSystemVariable('$randomPassword') as string).length
      ).toBeGreaterThanOrEqual(12);
    });
  });

  describe('resolveSystemVariable — unknown variable', () => {
    it('returns undefined for unrecognized names', () => {
      expect(resolveSystemVariable('$unknown')).toBeUndefined();
    });
  });

  describe('resolveSystemVariable — consistency', () => {
    it('returns different values across two $randomUUID calls', () => {
      const first = resolveSystemVariable('$randomUUID');
      const second = resolveSystemVariable('$randomUUID');

      expect(first).toMatch(UUID_V4_RE);
      expect(second).toMatch(UUID_V4_RE);
      expect(first).not.toBe(second);
    });

    it('$timestamp stays close to Date.now() within one second', () => {
      const now = Date.now();
      const value = Number(resolveSystemVariable('$timestamp'));
      expect(Math.abs(value - now)).toBeLessThanOrEqual(1000);
    });
  });
});
