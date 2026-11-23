# Git 작업 규칙

## 이 저장소 (문서 저장소 `tuktak-lab/docs`)

- 현재 운영 방식: `main`에 직접 커밋한다. 작업 브랜치와 PR은 필수가 아니다.
- 사용자가 요청할 때만 commit · push한다. merge · deploy도 마찬가지다.
- 커밋 하나에는 한 가지 목적만 담는다. 첫 줄은 무엇을 바꿨는지 한 줄로 쓴다 (기존 이력은 영어 명령형, 예: `Decide detailed rules for customerless bookings`).
- 결정을 반영한 커밋은 결정 항목 번호(예: `E3`, `C17`)를 메시지에 남긴다. 권장이다.
- `main`에 force push하지 않는다. `git config`의 사용자 정보를 바꾸지 않는다.
- `git reset --hard` · `git clean` · 브랜치 삭제처럼 되돌리기 어려운 명령은 미커밋 변경을 확인하고 사용자에게 먼저 묻는다.

## 개발 저장소 (생성 후)

- 개발 저장소의 브랜치 · PR · 리뷰 규칙은 `docs/DEVELOPMENT.md` 「2. Git 전략」을 따른다. 현재 `[제안]`이며, 팀이 확정하면 이 절과 그 문서를 함께 고친다.
- 이슈와 PR은 `.github/` 템플릿을 쓰고, 「관련 요구사항」에는 `요구사항명세서.md`의 ID를 그대로 적는다.
