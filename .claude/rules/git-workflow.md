# Git 작업 규칙

## 이 저장소 (문서 저장소 `tuktak-lab/docs`)

- 운영 방식 (2026-11-24 변경): 작업 브랜치 → PR → check 통과 후 올린 사람이 바로 머지한다. 승인은 필요 없다. `main`에 직접 push하지 않는다.
- `main`에 push·머지할 수 있는 사람은 tjddnjs0316 · wol20670 두 명이다 (2026-11-23, `main` 브랜치 보호의 push 제한). 다른 사람은 작업 브랜치에 올리고 PR을 열며, 두 사람 중 먼저 본 사람이 check 통과를 확인하고 머지한다. 리뷰 요청은 `.github/CODEOWNERS`로 두 사람에게 간다.
- 사용자가 요청할 때만 commit · push한다. merge · deploy도 마찬가지다.
- 커밋 하나에는 한 가지 목적만 담는다. 첫 줄은 무엇을 바꿨는지 한 줄로 쓴다 (기존 이력은 영어 명령형, 예: `Decide detailed rules for customerless bookings`).
- 결정을 반영한 커밋은 결정 항목 번호(예: `E3`, `C17`)를 메시지에 남긴다. 권장이다.
- `main`에 force push하지 않는다. `git config`의 사용자 정보를 바꾸지 않는다.
- `git reset --hard` · `git clean` · 브랜치 삭제처럼 되돌리기 어려운 명령은 미커밋 변경을 확인하고 사용자에게 먼저 묻는다.

## 개발 저장소 (`tuktak-lab/Keepsy`)

- 개발 저장소의 브랜치 · PR · 리뷰 규칙은 `docs/DEVELOPMENT.md` 「2. Git 전략」을 따른다. 「충돌 줄이기 · 머지」는 2026-11-24 결정이고, 나머지는 `[제안]`이다. 바뀌면 이 절과 그 문서를 함께 고친다.
- 이슈와 PR은 `.github/` 템플릿을 쓰고, 「관련 요구사항」에는 `요구사항명세서.md`의 ID를 그대로 적는다.
