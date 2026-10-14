---
name: create-pr
description: 현재 브랜치의 커밋과 변경사항을 분석해 한국어(KR)를 먼저, 영어(EN)를 아래에 둔 이중 언어 Pull Request 본문을 작성하고, 사용자가 확인하면 push와 gh pr create로 PR을 생성한다. 사용자가 "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "리뷰 요청해줘", "PR 본문 써줘", "create pr", "open a pull request"처럼 현재 브랜치를 리뷰받고 머지하려는 의도를 보이면, PR이라는 단어가 없어도 반드시 이 스킬을 사용한다.
context: fork
allowed-tools: Read Glob Grep Bash
---

# create-pr

현재 브랜치의 변경사항을 분석해 리뷰어가 바로 이해할 수 있는 이중 언어 PR을 만든다. push와 PR 생성은 외부에 공개되는 동작이라서, 본문을 먼저 보여주고 사용자가 확인한 뒤에 실행하는 2단계로 나눈다.

이 스킬은 분리된(fork) 컨텍스트에서 돌기 때문에 두 가지 제약이 있다. 하나는 메인 대화의 내용을 볼 수 없으므로 필요한 정보를 git 기록과 코드에서 직접 모아야 한다는 것이다. 다른 하나는 실행 도중 사용자에게 질문할 수 없다는 것이다. 확인 단계는 질문이 아니라 호출을 나누는 방식으로 해결한다.

| 호출 | 모드 | 하는 일 |
|------|------|---------|
| `/create-pr` | 초안 | 분석 후 본문 초안을 작성해 보여준다. push와 PR 생성은 하지 않는다. |
| `/create-pr create` | 생성 | 확인된 초안으로 push하고 PR을 만든다. |

인자에 `create`, `생성`, `올려`, `승인`이 있으면 생성 모드이고, 그 외에는 초안 모드다. 모드가 애매하면 초안 모드로 처리한다. 초안은 되돌릴 수 있지만 PR은 외부에 남기 때문이다.

## 1. 대상 확인 (두 모드 공통)

```bash
git branch --show-current
git status --short
```

base 브랜치는 아래 순서로 찾는다. 원격이나 `gh` 인증이 없는 환경에서도 동작해야 하기 때문에 여러 단계를 둔다.

```bash
gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null \
  || git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' \
  || (git show-ref --verify --quiet refs/heads/main && echo main) \
  || echo master
```

- 현재 브랜치가 base와 같으면 중단한다. 자기 자신으로는 PR이 성립하지 않는다. 먼저 작업 브랜치를 만들라고 안내한다.
- 커밋되지 않은 변경이 있으면 중단하고 `commit` 스킬로 먼저 커밋하라고 안내한다. PR에는 커밋된 내용만 담기므로, 무시하고 진행하면 사용자가 본문과 실제 PR 내용이 다르다는 것을 놓친다.
- `git log <base>..HEAD`가 비어 있으면 중단한다.
- 같은 브랜치의 열린 PR이 이미 있으면(`gh pr list --head <브랜치> --state open`, `gh`가 없으면 건너뜀) 새로 만들지 않고 그 URL을 알린다.

## 2. 초안 모드

### 변경사항 수집

```bash
git log <base>..HEAD --oneline
git diff <base>...HEAD --stat
git diff <base>...HEAD
```

diff가 크면 파일별로 나눠 읽는다. 변경 의도를 이해하지 못한 채 본문을 쓰면 리뷰어에게 도움이 되지 않는다.

프로젝트에 `package.json`의 `test`, `lint`, `build` 스크립트가 있으면 실행하고 결과를 본문에 정직하게 적는다. 실행하지 않았거나 못 한 항목은 "미실행" / "not run"으로 쓴다. 통과하지 않은 것을 통과로 쓰면 리뷰어가 검증된 줄 알고 넘어간다.

### 본문 작성

`references/pr-template-kr.md`와 `references/pr-template-en.md`를 읽고 각 템플릿의 구조를 그대로 채운다. 섹션을 임의로 빼거나 순서를 바꾸지 않는다. 팀이 같은 틀로 리뷰하게 하려는 것이다.

- 본문은 KR을 먼저, `---` 구분선 아래에 EN을 둔다. 한국어 리뷰어가 위에서부터 읽고, 영어 독자는 같은 내용을 아래에서 본다.
- 두 언어는 같은 내용이어야 한다. 한쪽에만 있는 정보가 있으면 다른 언어 독자가 놓친다.
- 제목은 한 줄, 70자 이내로 한다. 커밋 컨벤션에 맞춰 `feat|fix|refactor|chore: 요약` 형식의 한국어로 쓴다.
- "무엇을"보다 "왜"를 먼저 쓴다. diff를 읽으면 아는 파일 나열은 피한다.
- 확인하지 않은 사실(성능 수치, 통과 여부)은 쓰지 않는다.
- API 키, 토큰, 개인정보, 사내 비공개 정보는 본문에 넣지 않는다. diff에서 발견하면 값은 인용하지 않고 위치만 적는다.
- 본문 맨 끝에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`를 붙인다.

### 초안 저장과 보고

생성 모드가 같은 초안을 재사용할 수 있게 git 디렉터리에 저장한다. git 디렉터리는 추적되지 않아 커밋에 섞이지 않는다.

```bash
DRAFT="$(git rev-parse --git-dir)/create-pr-draft.md"
cat > "$DRAFT" <<'EOF'
<!-- head: <HEAD sha> -->
<!-- title: <제목> -->
<본문>
EOF
```

보고에는 다음을 담는다. 사용자가 이 보고만 읽고 확인할 수 있어야 한다.

- 제목
- base와 head 브랜치, 포함된 커밋 수
- 검증 결과(test/lint/build)
- 본문 전체(KR 위, EN 아래)
- 마지막 줄: "이대로 올리려면 `/create-pr create`를 실행하세요. 수정하려면 원하는 내용을 알려주세요."

## 3. 생성 모드

1. 위 "대상 확인"을 다시 수행한다.
2. 초안 파일이 있고 첫 줄의 `head` sha가 현재 `git rev-parse HEAD`와 같으면 그 초안을 쓴다. 파일이 없거나 sha가 다르면 그 사이에 커밋이 바뀐 것이므로 초안 모드를 수행해 새 초안을 만들고, 생성하지 않고 확인을 다시 받도록 보고한다. 확인받지 않은 내용으로 PR을 만들지 않기 위해서다.
3. 주석 두 줄(`head`, `title`)을 떼어낸 본문을 임시 파일에 쓴다. 인라인 `--body`는 이중 언어 마크다운의 따옴표와 줄바꿈 때문에 깨지기 쉬워서 `--body-file`을 쓴다.
4. 실행한다.

```bash
git push -u origin <브랜치>
gh pr create --base <base> --head <브랜치> --title "<제목>" --body-file <본문 파일>
```

- force push는 하지 않는다. push가 거부되면 원인을 알리고 중단한다.
- `gh`가 인증되지 않았으면 `gh auth status` 결과를 알리고 로그인은 사용자가 직접 하게 안내한다.
- 성공하면 PR URL, 제목, base/head, 커밋 수를 짧게 보고하고 초안 파일을 지운다.
