import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  it('저장된 값이 없으면 기본값을 쓴다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('저장된 값이 있으면 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'default'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'a'));

    act(() => result.current[1]('b'));

    expect(result.current[0]).toBe('b');
    expect(localStorage.getItem('k')).toBe('"b"');
  });

  it('함수형 업데이트를 지원한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 1));

    act(() => result.current[1]((prev) => prev + 1));

    expect(result.current[0]).toBe(2);
    expect(localStorage.getItem('k')).toBe('2');
  });

  it('parse가 null을 반환하면(잘못된 데이터) 기본값을 쓴다', () => {
    localStorage.setItem('k', JSON.stringify('weird'));
    const { result } = renderHook(() =>
      usePersistentState<'a' | 'b'>('k', 'a', (raw) => (raw === 'a' || raw === 'b' ? raw : null)),
    );
    expect(result.current[0]).toBe('a');
  });
});
