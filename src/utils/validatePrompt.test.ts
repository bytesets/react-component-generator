import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('최대 길이는 500자다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });

  it('500자 이하이면 유효하다', () => {
    const result = validatePromptLength('가'.repeat(499));

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('정확히 500자이면 유효하다', () => {
    expect(validatePromptLength('가'.repeat(500)).valid).toBe(true);
  });

  it('501자이면 유효하지 않고 에러 메시지를 반환한다', () => {
    const result = validatePromptLength('가'.repeat(501));

    expect(result.valid).toBe(false);
    expect(result.error).toBe('프롬프트는 500자 이하로 입력해주세요.');
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    const result = validatePromptLength(`  ${'가'.repeat(500)}  `);

    expect(result.valid).toBe(true);
    expect(result.length).toBe(500);
  });

  it('빈 문자열은 길이 기준으로는 유효하다', () => {
    expect(validatePromptLength('')).toEqual({ valid: true, length: 0 });
  });
});
