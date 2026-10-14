import { StrictMode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

afterEach(() => vi.restoreAllMocks());

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

  it('parse가 예외를 던져도 기본값을 쓴다', () => {
    localStorage.setItem('k', JSON.stringify('x'));
    const { result } = renderHook(() =>
      usePersistentState('k', 'a', () => {
        throw new Error('bad shape');
      }),
    );
    expect(result.current[0]).toBe('a');
  });

  it('StrictMode에서도 값 하나를 한 번만 저장한다(업데이트 함수는 부수효과가 없다)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => usePersistentState('k', 0), { wrapper: StrictMode });

    act(() => result.current[1]((prev) => prev + 1));

    expect(setItem.mock.calls.filter(([key]) => key === 'k')).toHaveLength(1);
  });

  it('값을 바꾸기 전에는 저장하지 않는다', () => {
    renderHook(() => usePersistentState('k', 'a'));
    expect(localStorage.getItem('k')).toBeNull();
  });

  it('session 옵션이면 sessionStorage에 저장하고 복원한다', () => {
    const first = renderHook(() => usePersistentState('k', 'a', undefined, 'session'));
    act(() => first.result.current[1]('b'));
    first.unmount();

    expect(localStorage.getItem('k')).toBeNull();
    const second = renderHook(() => usePersistentState('k', 'a', undefined, 'session'));
    expect(second.result.current[0]).toBe('b');
  });
});
