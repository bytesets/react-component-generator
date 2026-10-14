import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePromptHistory, MAX_HISTORY } from './usePromptHistory';
import { STORAGE_KEYS } from '../utils/storage';

describe('usePromptHistory', () => {
  it('프롬프트를 추가하면 최신순으로 쌓인다', () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => result.current.addPrompt('첫 번째'));
    act(() => result.current.addPrompt('두 번째'));

    expect(result.current.history).toEqual(['두 번째', '첫 번째']);
  });

  it('같은 프롬프트를 다시 추가하면 중복 없이 맨 앞으로 이동한다', () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => result.current.addPrompt('a'));
    act(() => result.current.addPrompt('b'));
    act(() => result.current.addPrompt('a'));

    expect(result.current.history).toEqual(['a', 'b']);
  });

  it('앞뒤 공백은 제거하고 빈 문자열은 추가하지 않는다', () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => result.current.addPrompt('  a  '));
    act(() => result.current.addPrompt('   '));

    expect(result.current.history).toEqual(['a']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 보관한다`, () => {
    const { result } = renderHook(() => usePromptHistory());

    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      act(() => result.current.addPrompt(`p${i}`));
    }

    expect(result.current.history).toHaveLength(MAX_HISTORY);
    expect(result.current.history[0]).toBe(`p${MAX_HISTORY + 4}`);
  });

  it('저장하고 새로고침(재마운트) 후에도 복원한다', () => {
    const first = renderHook(() => usePromptHistory());
    act(() => first.result.current.addPrompt('유지되는 프롬프트'));
    first.unmount();

    const second = renderHook(() => usePromptHistory());

    expect(second.result.current.history).toEqual(['유지되는 프롬프트']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.promptHistory)!)).toEqual(['유지되는 프롬프트']);
  });

  it('저장된 데이터가 문자열 배열이 아니면 빈 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.promptHistory, JSON.stringify({ not: 'an array' }));
    const { result } = renderHook(() => usePromptHistory());
    expect(result.current.history).toEqual([]);
  });
});
