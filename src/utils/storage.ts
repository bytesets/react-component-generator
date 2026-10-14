export const STORAGE_KEYS = {
  provider: 'rcg:provider',
  apiKeys: 'rcg:apiKeys',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export type StorageArea = 'local' | 'session';

const getArea = (area: StorageArea): Storage => (area === 'session' ? sessionStorage : localStorage);

// 시크릿 모드, 저장소 차단, 용량 초과 등으로 localStorage가 실패해도 앱이 깨지지 않게 한다.
export function readStorage<T>(key: string, fallback: T, area: StorageArea = 'local'): T {
  try {
    const raw = getArea(area).getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown, area: StorageArea = 'local'): void {
  try {
    getArea(area).setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시한다. 상태는 메모리에서 계속 동작한다.
  }
}
