import { useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import { STORAGE_KEYS } from '../utils/storage';

export const MAX_HISTORY = 20;

const parseHistory = (raw: unknown): string[] | null =>
  Array.isArray(raw) && raw.every((item) => typeof item === 'string') ? raw : null;

export function usePromptHistory() {
  const [history, setHistory] = usePersistentState<string[]>(STORAGE_KEYS.promptHistory, [], parseHistory);

  // 같은 프롬프트는 중복 없이 맨 앞으로 옮기고, 오래된 항목은 잘라낸다.
  const addPrompt = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;
      setHistory((prev) => [trimmed, ...prev.filter((p) => p !== trimmed)].slice(0, MAX_HISTORY));
    },
    [setHistory],
  );

  return { history, addPrompt };
}
