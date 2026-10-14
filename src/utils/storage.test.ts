import { describe, it, expect, vi, afterEach } from 'vitest';
import { readStorage, writeStorage } from './storage';

afterEach(() => vi.restoreAllMocks());

describe('readStorage', () => {
  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(readStorage('missing', 'fallback')).toBe('fallback');
  });

  it('저장된 JSON을 파싱해 반환한다', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(readStorage('k', null)).toEqual({ a: 1 });
  });

  it('JSON이 깨져 있으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });

  it('localStorage 접근이 예외를 던져도 fallback을 반환한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });
});

describe('writeStorage', () => {
  it('값을 JSON으로 저장한다', () => {
    writeStorage('k', { a: 1 });
    expect(localStorage.getItem('k')).toBe('{"a":1}');
  });

  it('저장 중 예외(용량 초과 등)가 나도 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeStorage('k', 1)).not.toThrow();
  });
});
