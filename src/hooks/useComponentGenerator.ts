import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { usePersistentState } from './usePersistentState';
import { STORAGE_KEYS } from '../utils/storage';

// localStorage 용량(약 5MB)을 넘지 않도록 보관하는 컴포넌트 수를 제한한다.
export const MAX_COMPONENTS = 50;

// 저장된 JSON에서 createdAt(문자열)을 Date로 되돌린다. 형식이 맞지 않으면 null(손상된 데이터).
function parseComponents(raw: unknown): GeneratedComponent[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed: GeneratedComponent[] = [];
  for (const item of raw) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      typeof item.prompt !== 'string' ||
      typeof item.code !== 'string' ||
      typeof item.createdAt !== 'string' ||
      Number.isNaN(new Date(item.createdAt).getTime())
    ) {
      return null;
    }
    parsed.push({ id: item.id, prompt: item.prompt, code: item.code, createdAt: new Date(item.createdAt) });
  }
  return parsed;
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<boolean>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = usePersistentState<GeneratedComponent[]>(
    STORAGE_KEYS.components,
    [],
    parseComponents,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => [newComponent, ...prev].slice(0, MAX_COMPONENTS));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setComponents]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, isLoading, error, generate, removeComponent, clearAll };
}
