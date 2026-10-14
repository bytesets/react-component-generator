# server/ 규칙

## Module Context

Bun 기반 AI API 프록시. 프런트의 `/api/generate` 요청을 Claude/Gemini로 전달하고, 응답을 react-live가 실행 가능한 코드로 정규화해 돌려준다. 프런트(`src/`)와 코드를 공유하지 않으며 HTTP로만 통신한다.

## Tech Stack & Constraints

- 런타임은 Bun, 서버 진입점은 `Bun.serve`(`index.ts:138`). Express 등 별도 HTTP 프레임워크를 추가하지 않는다.
- 외부 API 호출은 SDK 없이 `fetch`로 직접 한다(`index.ts:69`, `index.ts:101`). 의존성을 늘리지 않는다.
- 패키지는 루트 `package.json` 하나를 공유한다. `server/`에 별도 `package.json`을 만들지 않는다.

## Operational Commands

실행과 테스트는 모두 저장소 루트에서 한다.

- 서버 단독 실행: `bun run server` (포트 3002, `--watch`)
- 서버 테스트: `bun run test` (vitest, `server/**/*.test.ts`가 포함됨 — `vite.config.ts:20`)
- 타입/린트: `bun run lint`

`bun test`는 쓰지 않는다. 테스트는 `vitest`의 `describe/it/expect/vi`를 import해 작성한다(`fallback.test.ts:1`).

## Implementation Patterns

- 테스트할 로직은 부수효과 없는 순수 모듈로 분리하고 `<이름>.ts` + `<이름>.test.ts`를 같은 폴더에 둔다. 현재 `generator.ts`, `fallback.ts`가 이 패턴이다.
- 사용자 노출 에러 메시지는 한국어로 쓴다(`index.ts:124`, `index.ts:196`).

## Local Golden Rules

### Immutable

- API 키 값을 응답 본문, 로그, 에러 메시지에 넣지 않는다. `/api/config`는 키 보유 여부(boolean)만 반환한다(`index.ts:148-153`). 근거: 이 서버는 `Access-Control-Allow-Origin: *`(`index.ts:51-55`)라서 값이 노출되면 어느 출처에서든 읽힌다.
- Gemini 호출 URL에 키가 쿼리스트링으로 들어간다(`index.ts:99`). 이 URL을 `console.log`하거나 에러 메시지에 포함하지 않는다. 에러에는 `Gemini API error: ${status}`처럼 상태 코드만 담는다(`index.ts:112`).
- 키는 `.env`에만 둔다. 소스에 하드코딩하지 않으며 `.env`는 `.gitignore`에 있다.

### Do's & Don'ts

- Do: 업스트림 API 에러는 메시지에 HTTP 상태 코드를 포함해 던진다. 라우트의 catch가 `message.includes('503')`, `includes('429')`로 상태를 판별해 응답 코드를 정하기 때문이다(`index.ts:194`, `index.ts:201`). 상태 코드가 빠지면 모두 500으로 떨어진다.
- Do: 응답 코드를 `ensureRenderCall(stripCodeFences(text))`로 정규화하는 단계를 유지한다(`index.ts:188`). 프런트의 react-live(noInline)는 `render(...)` 호출이 없으면 미리보기를 그리지 못한다(`generator.ts:12-14`).
- Do: 새 프로바이더나 모델을 추가할 때 `callAnthropic`/`callGoogle`의 비대칭을 확인한다. 현재 Gemini만 `MAX_TOKENS` 절단 검사(`index.ts:123`)와 모델 폴백(`index.ts:5`, `index.ts:135`)이 있고 Claude 경로에는 둘 다 없다. Claude에도 같은 보호가 필요하면 추가하고, 의도적으로 뺀 것이라 가정하지 않는다.
- Do: 모델 폴백 순서는 `GOOGLE_MODELS` 배열 순서가 곧 우선순위다(`index.ts:4-5`). 순서를 바꾸면 비용과 응답 품질이 바뀐다.
- Don't: `SYSTEM_PROMPT`(`index.ts:7-49`)의 "import 금지", "TypeScript 문법 금지", "render() 호출", "코드 블록만 응답" 규칙을 약화하지 않는다. 미리보기 환경은 React를 전역으로 주고 JS만 실행하므로 위반하면 렌더가 깨진다. 이 규칙은 프롬프트(1차)와 `stripCodeFences`/`ensureRenderCall`(2차)로 이중 방어되어 있으니 한쪽만 보고 다른 쪽을 지우지 않는다.
- Don't: 포트 3002를 바꾸려면 `vite.config.ts:11`의 프록시 target도 함께 바꾼다. 한쪽만 바꾸면 개발 서버에서 `/api`가 연결되지 않는다.
- Don't: `index.ts`를 테스트에서 import하지 않는다. import 즉시 `Bun.serve`가 실행되어 포트를 점유한다. 이 파일에는 테스트가 없고(순수 로직만 `generator.ts`, `fallback.ts`에 분리되어 테스트됨), 라우팅이나 키 처리 로직을 늘릴 때는 순수 함수로 추출한 뒤 테스트를 붙인다.

## Maintenance

규칙과 코드가 어긋나면(예: 라인 근거가 이동, 프로바이더 추가) 이 파일의 업데이트를 제안한다.
