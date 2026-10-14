# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정. npm/yarn/pnpm을 쓰지 않는다(`bun.lock`).
- 개발 서버(API + 프런트): `bun run dev`
- 테스트: `bun run test` (vitest, `src/**`와 `server/**` 테스트를 함께 실행 — `vite.config.ts:20`)
- 빌드/타입체크: `bun run build`
- 린트: `bun run lint`

작업을 끝내기 전에 `bun run test`, `bun run lint`, `bun run build`를 실행해 통과를 확인한다.

## Golden Rules

### Immutable

- API 키를 소스에 하드코딩하거나 로그·응답에 노출하지 않는다. 키는 `.env`에만 두며 `.env`는 `.gitignore` 대상이다(`.gitignore`).
- `.env`를 읽거나 커밋하지 않는다. 변수 목록이 필요하면 `.env.example`을 본다.
- 민감 파일은 읽거나 수정하지 않는다. `.claude/settings.json`의 `permissions.deny`가 같은 범위를 차단한다. 규칙을 바꿀 때는 두 곳을 함께 갱신한다.
  - 환경변수: `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`, `.env.*.local` (`.env.example`은 예외)
  - 이름 패턴: `*credential*`, `*secret*`
  - 키·인증서: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*`
  - 인증 설정: `.npmrc`, `~/.ssh/**`, `~/.aws/**`
  - Bash의 `cat`, `head`, `grep` 등으로 우회해 내용을 읽지 않는다. deny 규칙은 `cat .env*`만 막는다.

### Do's & Don'ts

- Do: **TDD 규칙(`.claude/rules/tdd.md`)을 따른다.** 비즈니스 로직, API, 유틸, 버그 수정은 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다. 이 파일에 별도 TDD 규칙이 생기면 그쪽이 우선한다.
- Do: 서버 작업은 `server/AGENTS.md`의 규칙을 추가로 따른다.
- Do: 테스트 파일은 대상 파일 옆에 `<이름>.test.ts(x)`로 둔다(`server/fallback.test.ts`).
- Don't: `server/`와 `src/`가 코드를 직접 import하지 않는다. 둘은 `/api` HTTP로만 통신하고, 개발 중에는 Vite 프록시를 거친다(`vite.config.ts:9-15`).
- Don't: `hiring-lab/results/`를 커밋하지 않는다(`.gitignore`). 실행 때마다 새로 생성되는 산출물이다.

## Standards & References

- 설치, 실행, 기술 스택은 `README.md`를 본다.
- 커밋 메시지는 한국어 `feat|fix|refactor|chore: 요약` 형식이며 `commit` 스킬을 따른다.
- push는 사용자가 요청할 때만 한다.

## Maintenance Policy

규칙과 코드가 어긋나면 이 파일의 업데이트를 제안한다.
