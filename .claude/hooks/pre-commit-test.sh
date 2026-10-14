#!/bin/bash
# PreToolUse(Bash) 훅: git commit 직전에 전체 테스트를 실행하고, 실패하면 커밋을 차단한다(exit 2).
input=$(cat)

# git commit 명령이 아니면 통과
echo "$input" | grep -Eq '"command"[[:space:]]*:[[:space:]]*"[^"]*git[[:space:]]+commit' || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

output=$(bun run test 2>&1)
status=$?

if [ $status -ne 0 ]; then
  {
    echo "테스트가 실패해 커밋을 차단했습니다. 실패를 고친 뒤 다시 커밋하세요."
    echo "$output" | tail -n 40
  } >&2
  exit 2
fi

exit 0
