import { describe, it, expect } from '@jest/globals';

describe('Jest matcher test', () => {
  it('should work with toContain and stringContaining', () => {
    const reasons = ['celular'];
    expect(reasons).toContain(expect.stringContaining('celular'));
  });

  it('should work with toContainEqual and stringContaining', () => {
    const reasons = ['Suspicious celular detected'];
    expect(reasons).toContainEqual(expect.stringContaining('celular'));
  });

  it('should work with toEqual and arrayContaining', () => {
    const reasons = ['Suspicious celular detected'];
    expect(reasons).toEqual(expect.arrayContaining([expect.stringContaining('celular')]));
  });
});
