#!/bin/bash
# PreToolUse(Edit|Write|MultiEdit) 훅: 코드를 만들거나 고치기 직전에 TDD 규칙(.claude/rules/tdd.md) 준수를 상기시킨다.
# 차단하지 않고(exit 0) 모델 컨텍스트에 리마인더만 주입한다.
input=$(cat)

file=$(echo "$input" | grep -Eo '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')

# 코드가 아닌 파일(문서, 설정, 스타일, .claude 하위)은 TDD 대상이 아니므로 조용히 통과
case "$file" in
  *.md|*.json|*.css|*.html|*.svg|*.lock|*/.claude/*|*/.gitignore|*/.env.example) exit 0 ;;
esac

msg="[TDD 리마인더] .claude/rules/tdd.md는 Rigid 규칙이다. 이 파일을 수정하기 전에 확인하라: (1) 비즈니스 로직·API·유틸·버그 수정이면 실패하는 테스트를 먼저 작성하고 실행해 '기능 미구현'으로 실패하는 것을 봤는가(RED)? (2) 테스트보다 프로덕션 코드를 먼저 썼다면 그 코드를 삭제하고 RED부터 다시 시작하라. (3) GREEN은 테스트를 통과시키는 최소 코드만, REFACTOR 뒤에도 전체 테스트가 green이어야 한다. 순수 UI·타입·설정 변경이면 TDD는 불필요하다."

printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"%s"}}\n' "$msg"
exit 0
