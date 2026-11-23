# 문서·협업 환경 마이그레이션 감사 (2026-11-23)

> 대상: `tuktak-lab/docs` `4aa5307` · 참고: `SamdoRyu/docs-for-PJ-review` `0adf77c` (읽기 전용으로 별도 디렉터리에 clone, 수정하지 않음)
> 범위: 양쪽 저장소의 Git 추적 파일 전체 (대상 4개, 참고 46개). 숨김 디렉터리 포함
> 방법: 파일 본문과 상호 참조를 읽고 분류했다. 큰 문서(참고 `docs/` 23개)는 머리말·목차·핵심 절을 읽고, 재사용 후보(Git 전략, 코드 컨벤션, 환경 변수 가이드, CONTRACTS 「6」·「9」)는 전문을 읽었다.

## 1. 결론

- 참고 저장소에서 가져올 것은 **구조와 원칙**뿐이다. 문서 본문(00~07, PRD, CONTRACTS_API, ASSIGNMENTS)은 GRAVIT 도메인(3D 사무실, GitHub 연동, 강사 역할, PR 평가)이 깊게 박혀 있어 재사용할 수 없다.
- 뚝딱랩은 루트 세 문서가 이미 PRD·요구사항 정의서·결정 기록 역할을 한다. 같은 내용을 복제하는 PRD·요구사항 정의서·기능 명세서·정책서·저장 항목 문서는 **만들지 않았다**.
- 새로 만든 문서는 세 문서에서 **파생되는 설계·개발 문서 3개**(ARCHITECTURE·CONTRACTS·DEVELOPMENT)와 진입점(README·CLAUDE.md)이다. 파생 문서는 요구사항을 다시 적지 않고 ID로 가리킨다.
- 기획서 11장 기술 스택 표의 헤더는 "선택 (제안)"이다. 확정된 것은 명세서 6장 「제약」의 언어·프레임워크 범위까지이고, Java 21·Spring Boot 3·MySQL 8 같은 **버전과 세부 선택은 제안 상태**다. 새 문서는 이 구분을 그대로 따랐다 (`docs/ARCHITECTURE.md` 「2」).

## 2. 대상 저장소 기존 파일

| 경로 | 분류 | 처리 |
| --- | --- | --- |
| `결정체크리스트.md` | 보존 | 수정하지 않음. 결정의 원본 |
| `요구사항명세서.md` | 보존 | 수정하지 않음. 요구사항 ID·우선순위의 원본 |
| `기획서.md` | 보존 | 수정하지 않음. 배경·사용자·목표의 원본 |
| `.claude/agents/doc-editor.md` | 보존 + 선별 개선 | 문서 우선순위·용어 표·절대 규칙은 그대로 두고, 참고 저장소 doc-editor와 비교해 세 가지만 반영 (3장 표 첫 행) |

## 3. 참고 저장소 파일별 분류

분류: **재사용**(최소 변경) · **리팩터링**(목적 유지, 대폭 수정) · **통합·대체**(다른 문서에 흡수) · **제외**

### Claude Code 환경 (14)

| 원본 경로 | 분류 | 근거 | 대상 경로 |
| --- | --- | --- | --- |
| `.claude/agents/doc-editor.md` | 통합·대체 | 대상 저장소 doc-editor가 이미 CRM 문서 우선순위를 정의한다. 참고 쪽에서 ① 파생 문서도 고치는 대상으로 두는 구조 ② 기록 문서(`docs/reviews/`)·`.github/`를 고치지 않는 파일로 두는 규칙 ③ 새 `[제안]`을 만들지 않는 규칙만 가져왔다 | `.claude/agents/doc-editor.md` |
| `.claude/agents/product-builder.md` | 제외 | PRD·클로드 디자인·"폴더 하나 앱"을 전제한 화면 구현 에이전트. 이 저장소에는 코드가 없다 | — |
| `.claude/rules/code-quality.md` | 리팩터링 | 앞부분 공통 원칙만 유효. 「오피스 BE 규칙」은 GitHub 어댑터·강사·SSE·UTC 저장 등 GRAVIT 전용. 문서 저장소에서는 Claude가 따를 코드가 없어 rules가 아니라 팀 문서로 옮김 | `docs/DEVELOPMENT.md` 「4」 |
| `.claude/rules/git-workflow.md` | 리팩터링 | 문서 저장소(현재 `main` 직접 커밋)와 개발 저장소(제안) 규칙을 분리. 「AI 협업자 · 기여자 등록 금지」·"사람 팀원 4명"은 삼도류 팀 정책이라 제외 | `.claude/rules/git-workflow.md` |
| `.claude/rules/scope-control.md` | 재사용 | 원칙은 그대로. 문서 저장소에서 근거 없이 하지 않을 변경(ID 재정렬, 결정 열 수정, 파일 이동 등)을 추가 | `.claude/rules/scope-control.md` |
| `.claude/rules/security.md` | 리팩터링 | 일반 원칙 유지. 「GitHub 연동」·「심사용 로그인」 절 제외. 실제 고객 개인정보 금지(모의 데이터 범위)와 NFR 연결 추가 | `.claude/rules/security.md` |
| `.claude/rules/testing.md` | 리팩터링 | `docs/PROJECT_COMMANDS.md` 의존 제거. 문서 검사와 개발 시 테스트 원칙으로 나눔 | `.claude/rules/verification.md` |
| `.claude/settings.json` | 재사용 | `.env`·키 파일 읽기 금지, push·reset·clean 확인은 유지. 이 프로젝트에 없는 `secrets/`·`config/credentials.json` 경로는 뺌 | `.claude/settings.json` |
| `.claude/skills/review-brief/SKILL.md` | 리팩터링 | 문서 불일치 리뷰 정리에 그대로 유용. 확인 단계를 결정체크리스트 기준으로, 위임 대상을 doc-editor로 바꾸고 예시를 CRM으로 교체 | `.claude/skills/review-brief/SKILL.md` |
| `.claude/skills/prepare-pr/SKILL.md` | 통합·대체 | 문서 저장소는 PR을 쓰지 않는다. PR 본문 필수 항목은 PR 템플릿으로 흡수 | `.github/PULL_REQUEST_TEMPLATE.md` |
| `.claude/skills/review-pr/SKILL.md` | 제외 | 코드 PR 리뷰용. 「팀 오피스 원칙 점검」은 GRAVIT 전용. 개발 저장소 생성 시 이식 후보 (우선순위 목록만) | — |
| `.claude/skills/implement-feature/SKILL.md` | 제외 | 코드·`PROJECT_COMMANDS.md` 전제. 개발 저장소 생성 시 이식 후보 | — |
| `.claude/skills/fix-bug/SKILL.md` | 제외 | 코드 전제. 개발 저장소 생성 시 이식 후보 | — |
| `.claude/skills/deploy-check/SKILL.md` | 제외 | 배포 대상·빌드가 없다. 운영 환경이 정해지면 재검토 | — |

### GitHub 설정 (9)

| 원본 경로 | 분류 | 근거 | 대상 경로 |
| --- | --- | --- | --- |
| `.github/ISSUE_TEMPLATE/feature.yml` | 리팩터링 | 예시 ID `FR-GH-03`, 「인수 조건」 경로(`docs/04-features.md`)가 GRAVIT 종속. 명세서 ID·우선순위·관련 결정·검증 방법 칸으로 재구성 | 같은 경로 |
| `.github/ISSUE_TEMPLATE/bug.yml` | 리팩터링 | 예시 ID 교체, "시범 서버" 제거, 실제 개인정보 금지 문구 추가 | 같은 경로 |
| `.github/ISSUE_TEMPLATE/task.yml` | 리팩터링 | 문서 작업용 "근거 결정 항목" 칸 추가 | 같은 경로 |
| `.github/ISSUE_TEMPLATE/config.yml` | 재사용 | 빈 이슈 막기 | 같은 경로 |
| `.github/PULL_REQUEST_TEMPLATE.md` | 리팩터링 | "기술 결정 카드"·"GitHub 권한·API 호출량"(GRAVIT 기능) 제거. 문서 동기화 확인 추가, 문서만 바꾼 PR은 코드 검증 칸을 강제하지 않음 | 같은 경로 |
| `.github/labels.yml` | 리팩터링 | `area:office`·`area:sync` 등 GRAVIT 영역 전부 제거. 명세서 ID 영역 코드(ACC·CUS·RSV…)와 우선순위(P1~P3)로 재설계 | 같은 경로 |
| `.github/CODEOWNERS` | 제외 | 삼도류 팀원 계정·역할. 뚝딱랩 담당자 정보가 문서에 없어 만들지 않음 → 결정 필요 (7장) | — |
| `.github/workflows/ci.yml` | 제외 → 대체 | lint·test·build 자리가 `echo` placeholder. 검증으로 셀 수 없다. 실제로 돌아가는 문서 검사로 대체 | `.github/workflows/docs-check.yml` + `scripts/check-docs.mjs` |
| `.gitignore` | 리팩터링 | `.env` 계열·`*.pem` 유지, 이 프로젝트에 없는 `secrets/` 제외 | `.gitignore` |

### 프로젝트 문서 (23)

| 원본 경로 | 분류 | 근거 | 대상 경로 |
| --- | --- | --- | --- |
| `docs/00-backlog.md` | 제외 | GRAVIT 후순위 백로그·이슈 분해. 뚝딱랩 우선순위는 명세서 P1~P3, 작업 단위는 GitHub 이슈 | — |
| `docs/01-problem.md` | 제외 | 기획서 1~2장과 역할 중복 | — |
| `docs/02-workflow.md` | 제외 | 기획서 1장 흐름도·7장 시나리오와 역할 중복 | — |
| `docs/03-requirements.md` | 제외 | 요구사항명세서가 원본 | — |
| `docs/04-features.md` | 제외 | 기획서 6장·명세서 3장과 중복 | — |
| `docs/05-policy.md` | 제외 | 명세서 2·3장과 결정체크리스트가 정책 원본 | — |
| `docs/06-data.md` | 제외 | 명세서 5장이 데이터 원본. 관계도만 `docs/ARCHITECTURE.md` 「5」에 파생 | — |
| `docs/07-screens.md` | 제외 | 기획서 8장이 화면 구성. 화면 정의서 필요 여부는 9장 다음 단계에 남김 | — |
| `docs/ARCHITECTURE.md` | 리팩터링 | 「기술 스택」(확정/제안 구분)·「인증과 권한」·「계층」 구조만 차용. React·R3F·SceneModel·DataSource·GitHub 동기화·데모 대응 전부 제외 | `docs/ARCHITECTURE.md` |
| `docs/CONTRACTS.md` | 리팩터링 | 차용: `[확정]`/`[계약]`/`[제안]` 표시, 오류 응답 모양, 상황별 code 표 방식, 「9. 계약 변경 절차」. 제외: Entity·DTO·SceneModel·GitHub 어댑터·계약 테스트 세부 | `docs/CONTRACTS.md` |
| `docs/CONTRACTS_API.md` | 제외 | GRAVIT 엔드포인트 목록. 뚝딱랩 API는 아직 설계되지 않음 → `docs/CONTRACTS.md` 「4」에 경로 규칙 `[제안]`만 둠 | — |
| `docs/PRD.md` | 통합·대체 | 기획서가 PRD 역할을 한다. 탐색용 요약은 문서 지도로 충분 | `README.md` |
| `docs/PROJECT_COMMANDS.md` | 통합·대체 | 실제 명령이 아직 없다. 개발 저장소 생성 후 채울 자리만 둠 (가짜 명령 없음) | `docs/DEVELOPMENT.md` 「6」 |
| `docs/BACKEND_ASSIGNMENTS.md` | 제외 | 삼도류 팀원 담당 표 | — |
| `docs/SCREEN_ASSIGNMENTS.md` | 제외 | 삼도류 팀원 담당 표 | — |
| `docs/plan/Git 전략.md` | 리팩터링 | 브랜치·PR 제목·squash·리뷰 규칙은 범용. 뚝딱랩은 결정 전이라 `[제안]`으로 옮김. FR-OFF·회고 리포트 연동 문장 제외 | `docs/DEVELOPMENT.md` 「2」 |
| `docs/plan/코드 컨벤션 (BE).md` | 리팩터링 | Controller → Service → Repository, DTO 분리, 매개변수 바인딩, 전역 예외 처리는 차용. GitHub 어댑터·강사·**UTC 저장**은 제외 (뚝딱랩 NFR-12는 Asia/Seoul 기준) | `docs/DEVELOPMENT.md` 「4」, `docs/CONTRACTS.md` 「2」 |
| `docs/plan/환경 변수 가이드.md` | 리팩터링 | 「원칙」(이름만 커밋, 값은 공유 수단으로만)만 차용. GitHub App·강사 변수 제외 | `docs/DEVELOPMENT.md` 「5」 |
| `docs/plan/GitVillage 기획안 – 3D 타이쿤형 부캠 저장소 학습 서비스.md` | 제외 | 다른 프로젝트 기획안 | — |
| `docs/requirements-changes.md` | 제외 | 요구사항 변경 기록. 뚝딱랩은 결정체크리스트가 같은 역할 | — |
| `docs/reviews/alignment-2026-10-28.md` | 제외 | GRAVIT 점검 기록. 형식(바로 고친 것 / 결정 필요 / 일부러 다름)은 doc-editor 보고 형식에 이미 있음 | — |
| `docs/reviews/consistency-2026-10-28.md` | 제외 | GRAVIT 감사 기록. 「검사 커버리지」 표 형식만 이 보고서 6장에 차용 | — |
| `docs/reviews/decision-meeting-2026-10-28.md` | 제외 | 결정체크리스트가 대응 | — |

## 4. 목표 구조

```text
CLAUDE.md                  Claude 진입점 (README를 불러오고 작업 원칙을 더함)
README.md                  문서 지도 · 상태 표시 · ID 체계 · 미결 위치
결정체크리스트.md            결정 원본 (보존)
요구사항명세서.md            요구사항 ID·우선순위 원본 (보존)
기획서.md                  배경·사용자·목표 원본 (보존)
docs/
  ARCHITECTURE.md          기술 스택(확정/제안), 모듈, 데이터 관계, 인증·권한 구현, 외부 연동 경계
  CONTRACTS.md             확정된 API 규칙, 오류 응답·공통 형식·enum·경로 규칙 [제안], 계약 변경 절차
  DEVELOPMENT.md           Git 전략·코드 컨벤션·환경 변수·테스트 전략 [제안], 실행 명령 자리
  reviews/                 점검·감사 기록 (고치지 않는 기록)
.claude/
  agents/doc-editor.md     문서 정합성 편집
  skills/review-brief/     자연어 리뷰 → 작업 브리핑
  rules/                   git-workflow · scope-control · security · verification
  settings.json            비밀 파일 읽기 금지, 위험 명령 확인
.github/
  ISSUE_TEMPLATE/          feature · bug · task · config
  PULL_REQUEST_TEMPLATE.md
  labels.yml               영역(명세서 ID 영역 코드) · 우선순위 · 종류
  workflows/docs-check.yml 문서 검사 (scripts/check-docs.mjs)
scripts/check-docs.mjs     필수 파일 · 상대 링크 · 표 열 수 · 요구사항 ID · YAML 검사
```

루트 세 문서는 옮기지 않았다. 옮기면 문서 안 상대 링크, doc-editor, 그동안의 커밋 이력 맥락이 모두 깨진다.

## 5. 이전 프로젝트 종속성 점검

| 종류 | 참고 저장소에 있던 것 | 대상 저장소 처리 |
| --- | --- | --- |
| 계정 | CODEOWNERS·git-workflow·ASSIGNMENTS의 삼도류 팀원 계정 4개 | 하나도 옮기지 않음 |
| 저장소명 | `SamdoRyu/GRAVIT`, `SamdoRyu/docs-for-PJ-review`, `warehouseDemo_fork` | 이 보고서 머리말·분류 근거에만 남김 |
| 파일 경로 | `docs/plan/…`, `docs/04-features.md`, `adapters/github`, `frontend/src/data/…` | 옮기지 않음 |
| 요구사항 ID | `FR-GH-*`, `FR-OFF-*`, `FR-LRN-*`, `FR-REP-*`, `CON-02` 등 | 옮기지 않음. 템플릿 예시는 뚝딱랩 명세서 ID로 교체 |
| CI 명령 | `npm run lint` · `test:contract` · `./gradlew test bootJar` (GRAVIT), placeholder `echo` | 옮기지 않음. 실제로 실행되는 문서 검사만 둠 |
| 정책 | AI 기여자 등록 금지·Co-authored-by 금지(삼도류 팀 정책), UTC 저장(GRAVIT) | 옮기지 않음. 뚝딱랩 팀이 정할 일 |

## 6. 검증 결과

### 실행한 검사

| 검사 | 방법 | 결과 |
| --- | --- | --- |
| 필수 파일 · 상대 링크 · 표 열 수 · 요구사항 ID | `node scripts/check-docs.mjs` (md 16개, 명세서 ID 112개) | 통과 |
| YAML 형식 | 같은 스크립트 + `yaml@2.6.1` (스크래치 디렉터리에 설치) | 처음에 이슈 템플릿 2곳 오류(따옴표 없는 `예: C7`) 발견 → 고친 뒤 6개 통과 |
| 검사기가 오류를 실제로 잡는지 | 저장소 사본에 깨진 링크·열 수 틀린 표·없는 ID(`FR-ZZZ-99`)를 넣어 실행 | 3건 모두 검출, exit 1 |
| CI 단계 재현 | 사본에서 워크플로와 같은 `npm install --no-save --no-package-lock yaml@2.6.1` → 스크립트 실행 | 통과. package.json·lock 파일 생기지 않음 |
| `.claude/settings.json` | JSON 파싱 | 통과 |
| 핵심 문서 보존 | `git diff` 결정체크리스트·명세서·기획서 | 변경 0줄 |
| GRAVIT 잔재 | GRAVIT·SamdoRyu·오피스·강사·R3F·React·DataSource·삼도류 계정명 grep | 이 보고서 밖에서는 0건 |
| 절 번호 참조 | 파생 문서 사이 「n」 참조 grep 후 대상 절 확인 | 1건 틀림(이 보고서의 CONTRACTS 「3」→「2」) 고침 |
| 기술 스택 표기 | Java 21 · Spring Boot 3 · MySQL 8 · tsc · @Scheduled grep | ARCHITECTURE와 기획서 두 곳뿐이고 값이 같음 |
| 정합성 (내용) | doc-editor 에이전트로 파생 문서 4개 + CLAUDE.md를 기준 문서 3개와 대조 | 숫자·ID 어긋남 0건. 인용 위치 1건 고침. 근거 없는 `[확정]` 5곳, 기능 키 `OWNER` 이름, `owner_pin_required` 예외 누락 지적 → 모두 반영 (아래) |

doc-editor 지적 반영: 「확정」 정의를 README·파생 문서에서 "기준 문서에 근거, 단 기준 문서가 스스로 제안이라 적은 것 제외"로 통일. "Spring Boot", "Spring Data JPA"를 `[확정]`에서 분리해 `[제안]`으로. 저장소 운영 방식·"요구사항별 완료"의 `[확정]` 제거. 기능 키 `OWNER` → `OWNER_PIN` (폐기된 역할 용어 OWNER/STAFF와 혼동 방지, A3). `owner_pin_required`에 고객 없는 예약 연결 예외(FR-CUS-14, E3) 명시.

### 확인하지 못한 것

- GitHub Actions 실제 실행 (push하지 않았음). 로컬에서 같은 명령을 재현했을 뿐이다.
- 이슈 폼이 GitHub 이슈 폼 스키마에 맞는지 (YAML 문법만 검사). push 뒤 New issue 화면에서 확인 필요.
- Markdown 앵커(`#…`) 링크 — 검사기는 파일 존재만 본다. 현재 문서에는 앵커 링크가 없다.
- mermaid 관계도 렌더링 (`docs/ARCHITECTURE.md` 「5」) — GitHub 화면에서 확인 필요.
- markdownlint는 도입하지 않았다. 기존 문서 문체와 충돌하는 규칙이 많아 설정 비용에 비해 얻는 것이 적다고 판단했다.

## 7. 결정 필요 · 미결

| 항목 | 이유 | 영향 |
| --- | --- | --- |
| CODEOWNERS·담당자 | 뚝딱랩 담당자 계정이 문서에 없다 | 리뷰 자동 지정 불가. 정해지면 `.github/CODEOWNERS` 추가 |
| 개발 저장소 생성·이름·구성 | 결정 기록 없음 | 이슈를 어느 저장소에 쓸지, 계약 문서 위치(`docs/CONTRACTS.md` 「5」) |
| 개발 저장소 Git 전략 | 팀 결정 없음 | `docs/DEVELOPMENT.md` 「2」는 `[제안]` |
| 기술 스택 버전·세부 (Java 21, Spring Boot 3, MySQL 8, tsc 단독, @Scheduled) | 기획서 11장 표 헤더는 "선택 (제안)", 이유 열은 "지정 스택"으로 문서 안에서 모호. 명세서 6장 「제약」은 버전을 적지 않음 | 확정하려면 결정체크리스트에 항목이 필요 |
| 빌드 도구·migration 도구·린터·운영 환경 | 어느 문서에도 없음 | 골격을 만들기 전에 정해야 함 (`docs/ARCHITECTURE.md` 「9」) |
| 기존 미결 (서비스명, 과금, 사진 저장소 제공사, 외부 예약 연동, 법 조문 최종 확인, 가상 발송 실패 비율, 핑거프로 추가 확인) | 기획서 13장·명세서 6장 | 이번 작업으로 바뀌지 않음. 원문 위치에 그대로 둠 |

## 8. 추가 (같은 날, 사용자 결정 반영)

이 보고서를 쓴 뒤 사용자가 아래를 정했다. 위 1~7장은 작성 시점 기록이라 고치지 않고, 바뀐 점만 여기에 적는다.

| 항목 | 결정 | 반영 위치 |
| --- | --- | --- |
| 기술 스택 | 결정체크리스트 A14: 백엔드 그래빗 방식 Spring Boot, 프론트 React + Next.js(three.js 사용 가능), MySQL 8. 1장·7장의 "기술 스택 버전·세부는 제안" 항목이 해소됨. 1장의 "React·R3F를 가져오지 않음"은 이 결정으로 바뀜 (삼도류 코드를 가져오는 것은 아님) | 결정체크리스트, 명세서 6장, 기획서 11장, ARCHITECTURE·CONTRACTS·DEVELOPMENT |
| 법 조문 확인 범위 | 상업 운영이 아니므로 조문 원문 확인·법무 검토는 하지 않음. 7장 기존 미결 중 "법 조문 최종 확인"이 해소됨 | 결정체크리스트 결정 현황 표·D 머리말, 명세서 6장, 기획서 13장 |
| CODEOWNERS | `@tjddnjs0316` (저장소 Owner). 7장 "CODEOWNERS·담당자" 해소 | `.github/CODEOWNERS` |
| CodeRabbit | 자동 리뷰·자동 요약·자동 답글·이슈 자동 계획 끔. 필요할 때 댓글로 호출 | `.coderabbit.yaml` |
| 실행 방식 | A14 추가 결정: Next.js 정적 빌드 채택, 배포하지 않고 로컬에서 프론트·백엔드 서버를 따로 실행. 7장 "운영 환경" 해소 | 결정체크리스트 A14, 기획서 11장, ARCHITECTURE 1·2·3장 |
| 빈 권한 2개 | A3 보완: 방문 수정·삭제는 "고객 기본 정보 수정…" 토글(기본 PIN), 고객 상세 예측은 "인사이트" 설정 | 결정체크리스트 A3, 명세서 2장·FR-VIS-03·FR-PRD-02, CONTRACTS 3·4장 |
