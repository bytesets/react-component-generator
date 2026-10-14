import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/storage';

const saved = [
  { id: 'c1', prompt: '카드', code: 'render(<div/>)', createdAt: '2026-01-02T03:04:05.000Z' },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ code: 'render(<b/>)' }) })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('useComponentGenerator 영속화', () => {
  it('저장된 컴포넌트 목록을 복원하고 createdAt을 Date로 되돌린다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(saved));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].prompt).toBe('카드');
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
    expect(result.current.components[0].createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('생성에 성공하면 목록을 localStorage에 저장한다', async () => {
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('새 컴포넌트', 'key', 'google');
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].prompt).toBe('새 컴포넌트');
  });

  it('삭제하면 저장된 목록에서도 빠진다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(saved));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.removeComponent('c1'));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!)).toEqual([]);
  });

  it('전체 삭제하면 저장된 목록도 비워진다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(saved));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(result.current.components).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!)).toEqual([]);
  });

  it('저장된 데이터가 손상되었으면 빈 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([{ id: 1 }, 'x']));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toEqual([]);
  });
});

describe('useComponentGenerator 견고성', () => {
  it('createdAt이 null이면 손상된 데이터로 보고 빈 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([{ ...saved[0], createdAt: null }]));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([]);
  });

  it('목록은 최대 50개까지만 유지한다(가장 오래된 것부터 버린다)', async () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ ...saved[0], id: `c${i}` }));
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(many));
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('새 것', 'key', 'google');
    });

    expect(result.current.components).toHaveLength(50);
    expect(result.current.components[0].prompt).toBe('새 것');
    expect(result.current.components.some((c) => c.id === 'c49')).toBe(false);
  });

  it('generate는 성공하면 true를 반환한다', async () => {
    const { result } = renderHook(() => useComponentGenerator());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.generate('p', 'key', 'google');
    });
    expect(ok).toBe(true);
  });

  it('generate는 실패하면 false를 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ error: 'boom' }) })));
    const { result } = renderHook(() => useComponentGenerator());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.generate('p', 'key', 'google');
    });
    expect(ok).toBe(false);
  });
});
