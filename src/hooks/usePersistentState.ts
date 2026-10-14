import { useState, useCallback, useEffect, useRef } from 'react';
import type { SetStateAction } from 'react';
import { readStorage, writeStorage, type StorageArea } from '../utils/storage';

/**
 * useState처럼 쓰되 값을 브라우저 저장소에 저장하고 새로고침 후 복원한다.
 * parse는 저장된 원본을 검증/변환하며, null을 반환하거나 예외를 던지면 손상된 데이터로 보고 기본값을 쓴다.
 * area가 'session'이면 탭을 닫을 때 사라지는 sessionStorage를 쓴다(API 키처럼 오래 남기면 안 되는 값용).
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse?: (raw: unknown) => T | null,
  area: StorageArea = 'local',
) {
  const [value, setValue] = useState<T>(() => {
    const raw = readStorage<unknown>(key, undefined, area);
    if (raw === undefined) return initial;
    if (!parse) return raw as T;
    try {
      return parse(raw) ?? initial;
    } catch {
      return initial;
    }
  });
  // 사용자가 값을 바꾼 뒤에만 저장한다. 렌더 중 업데이트 함수에서 저장하면 부수효과가 중복·유실될 수 있다.
  const changed = useRef(false);

  useEffect(() => {
    if (changed.current) writeStorage(key, value, area);
  }, [key, value, area]);

  const update = useCallback((next: SetStateAction<T>) => {
    changed.current = true;
    setValue(next);
  }, []);

  return [value, update] as const;
}
