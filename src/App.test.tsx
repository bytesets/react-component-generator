import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { STORAGE_KEYS } from './utils/storage';

// react-live 렌더링은 이 테스트의 관심사가 아니므로 단순한 대역으로 바꾼다.
vi.mock('./components/ComponentCard', () => ({
  ComponentCard: ({ component }: { component: { prompt: string } }) => <div>{component.prompt}</div>,
}));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url === '/api/config'
        ? { ok: true, json: async () => ({ envKeys: { anthropic: false, google: false } }) }
        : { ok: true, json: async () => ({ code: 'render(<i/>)' }) },
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

const keyInput = () => screen.getByLabelText('API Key') as HTMLInputElement;
const providerSelect = () => screen.getByLabelText('Provider') as HTMLSelectElement;

describe('App 설정 영속화', () => {
  it('저장된 Provider를 복원한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('anthropic'));
    render(<App />);
    expect(providerSelect().value).toBe('anthropic');
  });

  it('Provider를 바꾸면 선택을 저장한다', () => {
    render(<App />);

    fireEvent.change(providerSelect(), { target: { value: 'anthropic' } });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.provider)!)).toBe('anthropic');
  });

  it('저장된 API 키를 복원한다', () => {
    sessionStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify({ google: 'AIza-test-key' }));
    render(<App />);
    expect(keyInput().value).toBe('AIza-test-key');
  });

  it('API 키를 입력하면 현재 Provider의 키로 저장한다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(keyInput(), 'my-key');

    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEYS.apiKeys)!)).toEqual({ google: 'my-key' });
  });

  it('API 키는 localStorage에 남기지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(keyInput(), 'my-key');

    expect(localStorage.getItem(STORAGE_KEYS.apiKeys)).toBeNull();
  });

  it('Provider를 바꿔도 다른 Provider의 키는 보존되고 각자의 키를 보여준다', () => {
    sessionStorage.setItem(
      STORAGE_KEYS.apiKeys,
      JSON.stringify({ google: 'google-key', anthropic: 'anthropic-key' }),
    );
    render(<App />);

    fireEvent.change(providerSelect(), { target: { value: 'anthropic' } });
    expect(keyInput().value).toBe('anthropic-key');

    fireEvent.change(providerSelect(), { target: { value: 'google' } });
    expect(keyInput().value).toBe('google-key');
  });

  it('저장된 Provider 값이 잘못되었으면 기본값(google)을 쓴다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('unknown'));
    render(<App />);
    expect(providerSelect().value).toBe('google');
  });
});

describe('App Provider 검증', () => {
  it.each(['constructor', 'toString', '__proto__'])('저장된 Provider가 프로토타입 키(%s)여도 기본값을 쓴다', (name) => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify(name));
    render(<App />);
    expect(providerSelect().value).toBe('google');
  });
});

describe('App 프롬프트 히스토리와 컴포넌트 목록', () => {
  it('생성하면 프롬프트가 히스토리에 저장되고 새로고침 후 최근 프롬프트로 보인다', async () => {
    sessionStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify({ google: 'k' }));
    const user = userEvent.setup();
    const first = render(<App />);

    await user.type(screen.getByRole('textbox'), '유지될 프롬프트');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEYS.promptHistory)).toContain('유지될 프롬프트'));
    first.unmount();

    render(<App />);

    expect(screen.getAllByText('유지될 프롬프트').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '유지될 프롬프트' })).toBeInTheDocument();
  });

  it('생성이 실패하면 프롬프트를 히스토리에 저장하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/api/config'
          ? { ok: true, json: async () => ({ envKeys: { anthropic: false, google: false } }) }
          : { ok: false, json: async () => ({ error: 'invalid key' }) },
      ),
    );
    sessionStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify({ google: 'k' }));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('textbox'), '실패할 프롬프트');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByText('invalid key');

    expect(localStorage.getItem(STORAGE_KEYS.promptHistory)).toBeNull();
  });
});
