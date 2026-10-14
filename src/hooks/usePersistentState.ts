import { useState, useCallback, type SetStateAction } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

/**
 * useState처럼 쓰되 값을 localStorage에 저장하고 새로고침 후 복원한다.
 * parse는 저장된 원본을 검증/변환하며, null을 반환하면 손상된 데이터로 보고 기본값을 쓴다.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse?: (raw: unknown) => T | null,
) {
  const [value, setValue] = useState<T>(() => {
    const raw = readStorage<unknown>(key, undefined);
    if (raw === undefined) return initial;
    if (!parse) return raw as T;
    return parse(raw) ?? initial;
  });

  const update = useCallback(
    (next: SetStateAction<T>) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeStorage(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
