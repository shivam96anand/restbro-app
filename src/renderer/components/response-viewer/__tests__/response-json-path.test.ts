import { describe, it, expect } from 'vitest';
import { jsonPathAtOffset } from '../response-json-path';

const SAMPLE = JSON.stringify(
  {
    singleContractId: 'GK10075387',
    gkAttributes: {
      contractType: 'AGB',
      crmOrderNum: 'KKU00217190',
    },
    product: [
      { id: 'a', status: 'active' },
      { id: 'b', gkAttributes: { crmOrderNum: 'KKU00216059' } },
    ],
  },
  null,
  2
);

function offsetOf(needle: string): number {
  const idx = SAMPLE.indexOf(needle);
  if (idx === -1) throw new Error(`needle not found: ${needle}`);
  return idx + Math.floor(needle.length / 2);
}

describe('jsonPathAtOffset', () => {
  it('returns root for empty input', () => {
    expect(jsonPathAtOffset('', 0)).toBe('root');
  });

  it('returns root at the very start', () => {
    expect(jsonPathAtOffset(SAMPLE, 0)).toBe('root');
  });

  it('resolves a top-level key', () => {
    expect(jsonPathAtOffset(SAMPLE, offsetOf('"GK10075387"'))).toBe(
      'singleContractId'
    );
  });

  it('resolves a nested object key', () => {
    expect(jsonPathAtOffset(SAMPLE, offsetOf('"AGB"'))).toBe(
      'gkAttributes.contractType'
    );
  });

  it('resolves a value inside an array element', () => {
    expect(jsonPathAtOffset(SAMPLE, offsetOf('"active"'))).toBe(
      'product[0].status'
    );
  });

  it('resolves a deeply nested value in a later array element', () => {
    expect(jsonPathAtOffset(SAMPLE, offsetOf('"KKU00216059"'))).toBe(
      'product[1].gkAttributes.crmOrderNum'
    );
  });

  it('quotes non-identifier keys', () => {
    const text = JSON.stringify({ 'weird-key': 1 }, null, 2);
    const off = text.indexOf('1');
    expect(jsonPathAtOffset(text, off)).toBe('["weird-key"]');
  });
});
