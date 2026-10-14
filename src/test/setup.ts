import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 각 테스트 후 렌더된 DOM과 localStorage/sessionStorage를 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
