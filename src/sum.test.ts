import { describe, it, expect } from 'vitest';

function sum(a: number, b: number): number {
  return a + b;
}

describe('sum', () => {
  it('suma dos números correctamente', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('suma con cero', () => {
    expect(sum(0, 5)).toBe(5);
  });
});
