# 개발 가이드

> 작성일: 2026-11-23 · 상태: 초안 · 기준 문서: [요구사항 명세서](../요구사항명세서.md), [기획서](../기획서.md), [결정 체크리스트](../결정체크리스트.md)
> **개발 저장소는 아직 없다.** 이 문서의 Git 전략·컨벤션·도구는 대부분 **[제안]**이고, 요구사항에서 나온 규칙에만 **[확정]**과 근거 ID를 붙였다. 팀이 정하면 상태를 바꾼다.

## 1. 저장소

| 저장소 | 역할 | 상태 |
| --- | --- | --- |
| `tuktak-lab/docs` (이 저장소) | 기획·결정·설계 문서. 애플리케이션 코드를 두지 않는다 | 현재 운영 방식 |
| 개발 저장소 | 저장소 하나에 `backend/`(Spring Boot)와 `frontend/`(Next.js)를 함께 두고, 실행은 따로 한다. 배포하지 않고 로컬에서만 연다 (A14, `docs/ARCHITECTURE.md` 「3」) | [제안] 이름·생성 시점은 [검토 필요] |

## 2. Git 전략

### 이 저장소 (현재 운영 방식)

`main`에 직접 커밋한다. 규칙은 `.claude/rules/git-workflow.md`.

### 개발 저장소 [제안]

`main` 하나와 작업 브랜치만 두는 가벼운 흐름이다.

**꼭 지킬 것**

1. `main`에 직접 push하지 않고 PR로만 합친다. `main`과 남의 브랜치에는 force push하지 않는다.
2. 작업은 이슈에서 시작하고, PR 본문에 `Closes #N`을 적는다.
3. PR 제목은 `<type>(<scope>)?: <설명>`. squash merge하면 PR 제목이 `main`의 커밋이 된다.
4. GitHub 리뷰 승인 1명 이상을 받은 뒤 사람이 GitHub PR 화면에서 머지한다.
5. 비밀 값과 실제 개인정보를 커밋하지 않는다.

**브랜치 이름**: `<type>/<이슈번호>-<짧은-설명>` (영문 소문자·숫자·`-`)

```text
^(feat|fix|refactor|test|docs|chore)/[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$
예: feat/12-shift-login, fix/31-reservation-overlap
```

**PR 제목**: scope를 쓰면 영역 라벨과 같은 값(`acc`, `rsv`, `cmp` …)을 쓴다.

```text
^(feat|fix|refactor|perf|test|docs|style|build|ci|chore)(\([a-z0-9-]+\))?: .{1,50}$
예: feat(rsv): 담당 스탭 빈 시간만 예약 시작 시각으로 제공
```

**권장**: 브랜치 안의 커밋 메시지는 자유. 변경이 400줄을 넘으면 나눈다. 리뷰 요청을 받으면 24시간 안에 첫 의견을 남긴다. 변경 요청에는 이유를 한 줄 남긴다.

**GitHub 설정** (저장소를 만든 뒤): `main` 보호(PR 필수, 승인 1명, force push·삭제 금지), squash merge만 허용, 머지 후 브랜치 자동 삭제, 이 저장소의 `.github/` 템플릿·라벨 복사, CI를 필수 status check로 등록.

## 3. 이슈와 라벨 [제안]

- 이슈 템플릿: Feature · Bug · Task (`.github/ISSUE_TEMPLATE/`). Feature는 요구사항 ID와 우선순위가 필수다.
- 작업 단위: 요구사항 ID 하나 또는 밀접한 몇 개. 「상세 / 수용 기준」 열을 완료 조건으로 옮긴다.
- 라벨: 종류(`feature` · `bug` · `chore`), 영역(`area:acc` … 명세서 ID 영역 코드), 우선순위(`priority:p1~p3`, 명세서 우선순위). 정의는 `.github/labels.yml`.
- 마일스톤: 기획서 12장 로드맵을 따른다 — "MVP 1차 — 기록과 예측", "MVP 2차 — 발송과 성과", "시연·검증".

## 4. 코드 컨벤션

### 요구사항에서 나온 규칙 [확정]

| 규칙 | 근거 |
| --- | --- |
| 모든 조회·변경은 세션의 매장(`shop_id`)으로 제한한다. 다른 매장 데이터는 404 | NFR-03, 명세서 5장 |
| 권한은 API에서 검사한다. 화면 숨김은 권한 검사가 아니다 | NFR-04 |
| 비밀번호·PIN은 BCrypt 해시로만 저장한다 | NFR-02 |
| 입력은 서버에서 검증하고, 출력은 이스케이프한다 | NFR-08 |
| API 키·DB 비밀번호는 환경 변수로만 다룬다 | NFR-09 |
| 날짜 계산·야간 제한은 Asia/Seoul 기준 | NFR-12 |
| 매장이 바꾸는 값(이탈 신호 기간 상한, 귀속 기간, 일 발송 한도, 재발송 제한 기간, 보관 기간, 가상 발송 실패 비율, 카테고리별 기본 주기, PIN 잠금 기능 목록)은 코드 상수가 아니라 매장 설정(`shop`)에서 읽는다 | 명세서 5장 shop, FR-SET-03·04·06 |
| 메시지 발송 처리는 한곳에 모은다 | FR-CMP-17 |

### 구조 [제안]

- **Controller → Service → Repository.** Controller는 요청 검증(Bean Validation)·권한 검사·응답 DTO 변환만 한다. 업무 규칙과 트랜잭션은 Service에 둔다.
- Entity를 응답으로 바로 내보내지 않고 DTO로 바꾼다. 마스킹 같은 권한별 필드 차이는 DTO 변환에서 처리한다.
- 다른 패키지의 Repository를 직접 부르지 않고 그 패키지의 Service를 부른다.
- 값만으로 결과가 정해지는 규칙(예측 계산, 상태 분류, 우선순위, 귀속, 예약 가능 시간, 광고 문구·바이트 계산)은 별도 클래스로 떼어 단위 테스트한다 (`docs/ARCHITECTURE.md` 「4」).
- 연관관계는 기본 단방향 N:1, 지연 로딩. 목록 조회는 fetch join 등으로 N+1을 막는다 (NFR-01).
- 쿼리는 매개변수 바인딩으로만 쓴다. JPQL·네이티브 쿼리에 사용자 입력을 문자열로 이어 붙이지 않는다.
- 예외는 공통 예외 하나와 오류 code 열거형으로 던지고, 전역 예외 처리 한 곳에서 `docs/CONTRACTS.md` 「2」 모양으로 바꾼다. 예외를 잡아서 무시하지 않는다.
- 매장 설정이 아닌 고정 숫자(예: PIN 인증 유지 5분, 로그인 잠금 15분)는 상수 한 곳에 모은다.
- 성급한 추상화를 만들지 않는다. 구현이 하나뿐인 인터페이스는 교체 계획이 문서에 있을 때만 둔다.

### 프론트 [제안]

- TypeScript `strict`. `any`를 쓰지 않는다.
- 데이터는 모두 브라우저에서 `src/lib/api.ts`를 거쳐 가져온다. 화면 코드에서 `fetch('/api/…')`를 직접 부르지 않는다. 오류 code 처리는 그 한곳에서 한다 (`docs/ARCHITECTURE.md` 「4」 「API 호출 규칙」).
- Next.js 서버 기능(SSR, API Routes, Server Actions, 미들웨어)과 동적 경로(`[id]`)를 쓰지 않는다. 정적 빌드라 빌드가 실패한다 (`docs/ARCHITECTURE.md` 「3」).
- 권한에 따라 버튼을 숨기거나 잠긴 영역을 가리는 것은 편의일 뿐이다. 실제 검사는 서버가 한다 (NFR-04).
- API 응답 타입은 `src/features/<영역>/types.ts`에 두고, `docs/CONTRACTS.md`의 이름(camelCase 필드, enum 값)을 그대로 쓴다.
- 스타일은 Next.js 기본 CSS Modules로 시작한다.

**라이브러리** (A14: 필요할 때 추가). 새 라이브러리는 PR 「영향 범위」에 적는다.

| 쓰는 곳 | 후보 | 언제 |
| --- | --- | --- |
| 기본 | React, Next.js, TypeScript, ESLint(Next.js 기본) | 골격부터 |
| 3D | three.js | 쓸 화면이 생기면 (요구사항에 3D 화면은 없음) |
| 성과 분석 차트 (FR-ANL-01·05) | 차트 라이브러리 하나 (예: Recharts) | 성과 분석 화면을 만들 때 |
| 서버 데이터 캐시·재요청 | TanStack Query | `api.ts`만으로 화면 갱신이 번거로워질 때 |
| 스타일 | Tailwind CSS | CSS Modules로 부족하다고 팀이 정하면 |

### 이름 [제안]

- Java: 클래스 `PascalCase`, 메서드·필드 `camelCase`, 상수 `UPPER_SNAKE`, 패키지 소문자. React 컴포넌트 파일 `PascalCase.tsx`, 그 밖의 TypeScript 모듈 `camelCase.ts`.
- Entity 이름은 명세서 5장 엔티티 이름을 PascalCase로 바꾼다: `Shop`, `Staff`, `DayOff`, `Customer`, `CustomerPrediction`, `Consent`, `PreferenceTag`, `ConsultNote`, `ServiceMenu`, `Reservation`, `ReservationService`, `Payment`, `Visit`, `VisitService`, `Photo`, `MessageTemplate`, `Campaign`, `CampaignMessage`, `PredictionSnapshot`, `AccessLog`, `SearchMissLog`.
  - `ReservationService`·`VisitService` Entity는 Spring의 `…Service` 클래스와 헷갈린다. Entity는 이 이름을 쓰고, 해당 업무 Service는 `ReservationAppService`처럼 다른 접미사를 쓰거나 패키지로 구분하는 것을 권장한다.
- 서비스 용어는 doc-editor 「용어」 표를 따른다: 스탭(`Staff`), 현재 근무자(`currentStaff`), 잠긴 기능(기능 키, `docs/CONTRACTS.md` 「3」).
- 시간 값에는 단위를 붙인다: `attributionDays`, `pinTimeoutMinutes`.

## 5. 환경 변수 [제안]

- 저장소에는 변수 이름과 설명만 담은 `.env.example`을 커밋한다. 실제 값 파일(`.env`, `.env.*`, 단 `.env.example`은 제외)은 `.gitignore`에 둔다.
- 값은 이슈·PR·댓글·채팅·터미널 출력에 붙이지 않는다. 확인은 "설정됨 / 미설정"까지만 한다 (NFR-09).
- CI는 비밀 값 없이 통과해야 한다.

Spring Boot는 환경 변수를 설정 이름으로 바로 읽는다 (예: `SPRING_DATASOURCE_URL` → `spring.datasource.url`). 그래서 DB·메일·쿠키는 Spring 표준 이름을 그대로 쓰고, 우리 앱만의 값에만 `APP_` 접두사를 붙인다.

| 변수 | 쓰는 곳 | 비고 |
| --- | --- | --- |
| `MYSQL_DATABASE` · `MYSQL_USER` · `MYSQL_PASSWORD` · `MYSQL_ROOT_PASSWORD` | `compose.yaml`의 로컬 MySQL | MySQL 공식 이미지가 읽는 이름 |
| `SPRING_DATASOURCE_URL` · `SPRING_DATASOURCE_USERNAME` · `SPRING_DATASOURCE_PASSWORD` | 백엔드 DB 접속 | 로컬은 위 MySQL 값과 맞춘다 |
| `SERVER_SERVLET_SESSION_COOKIE_SECURE` | 세션 쿠키 Secure | 로컬(http)은 `false`. HTTPS로 운영할 때 `true` (NFR-02·05) |
| `APP_STORAGE_ENDPOINT` · `APP_STORAGE_BUCKET` · `APP_STORAGE_ACCESS_KEY` · `APP_STORAGE_SECRET_KEY` | 사진 저장소 | 제공사 미결. 정해지기 전에는 로컬 저장 구현 (`docs/ARCHITECTURE.md` 「7」) |
| `SPRING_MAIL_HOST` 등 `SPRING_MAIL_*` | 비밀번호 재설정 메일 | P2 (FR-ACC-06). 그때 추가 |

이름은 `[제안]`이다. 골격을 만들 때 `.env.example`에 이 표대로 적고, 바뀌면 이 표를 함께 고친다.

## 6. 골격 만들기와 실행 명령

### 백엔드 골격 [제안]

IntelliJ에서 새 프로젝트를 Spring Boot(Spring Initializr)로 만든다. 고를 값:

| 항목 | 값 |
| --- | --- |
| Language · Type | Java · Gradle (Groovy) — 그래빗과 같음 |
| JDK · Java | 21 |
| Packaging | Jar |
| Group · Artifact | [검토 필요] (예: `com.tuktaklab` · `crm`) |
| Spring Boot | Initializr가 보여주는 안정판 (SNAPSHOT·M·RC 제외) |
| Dependencies | Spring Web, Spring Security, Spring Data JPA, Validation, MySQL Driver, Flyway Migration |
| 나중에 추가 | Java Mail Sender (P2 비밀번호 재설정), 사진 저장소 SDK (제공사가 정해지면) |

설정 파일(`application.yaml`, `compose.yaml`, `.env.example`)과 의존성 추가는 IntelliJ에서 직접 만든다. 만드는 순서와 내용은 그 단계에서 따로 안내한다.

### 프론트 골격 [제안]

`frontend/`에 Next.js 프로젝트를 만든다. TypeScript · ESLint · App Router · `src/` 디렉터리를 켜고, Tailwind는 끈다(4절). 만든 뒤 `next.config`에 정적 빌드(`output: 'export'`), 이미지 최적화 끄기(`images.unoptimized`), 개발 모드에서만 `/api/**`를 8080으로 넘기는 설정을 넣는다 (`docs/ARCHITECTURE.md` 「3」).

### 실행 명령

골격을 만든 뒤 실제로 돌려 보고 확인된 명령만 이 표에 적는다. 아래는 이 도구들의 표준 명령이고, 확인 전이다.

| 할 일 | 명령 (확인 전) |
| --- | --- |
| 로컬 MySQL 띄우기 | `docker compose up -d` |
| 백엔드 실행 · 테스트 · 빌드 | `./gradlew bootRun` · `./gradlew test` · `./gradlew build` (`backend/`에서) |
| 프론트 개발 서버 · 린트 · 빌드 | `npm run dev` · `npm run lint` · `npm run build` (`frontend/`에서) |
| 시드 데이터 적재 | [검토 필요] (C17 구성) |

로컬에서 여는 순서: ① MySQL 띄우기 → ② 백엔드 실행(8080) → ③ 프론트 개발 서버 실행(3000) → 브라우저에서 `http://localhost:3000`.

이 저장소의 문서 검사는 지금 쓸 수 있다.

```bash
node scripts/check-docs.mjs    # 필수 파일 · 상대 링크 · 표 열 수 · 요구사항 ID (Node 18+)
```

YAML 형식까지 보려면 `yaml` 패키지가 필요하다. CI(`.github/workflows/docs-check.yml`)는 설치해서 함께 검사하고, 로컬에서 패키지가 없으면 YAML 검사만 건너뛰고 알려 준다.

## 7. 테스트·검증 전략

| 검증 | 방법 | 상태 |
| --- | --- | --- |
| MVP 수용 테스트 | 기획서 7장 시나리오 여섯 개를 그대로 수용 테스트 기준으로 쓴다 | [확정] 기획서 7장 |
| 요구사항별 완료 | 명세서 「상세 / 수용 기준」 열의 조건마다 성공·실패 경로 확인 | [제안] |
| 지표 계산 검증 | 답을 미리 아는 시드 데이터로 측정 지표(예측 정확도, 주기 내 재방문율, 재예약 전환율, 대조군 비교)가 정확히 계산되는지 확인. 결과는 "모의 데이터로 생성한 결과값"으로 밝힌다 | [확정] 기획서 4·12장, E9 |
| 성능 구조 점검 | 페이징, `EXPLAIN` 인덱스 사용, N+1 없음, 진행 상태 표시 | [확정] NFR-01, C17 |
| 시드 데이터 | 매장 1곳·스탭 5명(네일 2·속눈썹 1·왁싱 1·반영구 1)·고객 3천 명·3년 치 방문 약 1.9만 건. 구성은 C17 표가 기준. 예약 경로 분포, 고객 없는 방문, 대조군 캠페인을 포함 | [확정] C17, 기획서 12장 |
| 단위 테스트 우선 대상 | 예측 계산(FR-PRD-01, 방문 1·2·3회 이상, 주기 계산 제외, 종료 신호), 상태 분류(FR-PRD-04), 우선순위(FR-PRD-09), 귀속과 승계(FR-ANL-03, FR-VIS-04), 예약 가능 시간(FR-RSV-04), 광고 문구·바이트 계산(FR-CMP-04·05), 야간 제한(FR-CMP-07), 기능별 공용/PIN 검사(명세서 2장) | [제안] |
| 백엔드 테스트 도구 | JUnit 5 + Spring Boot Test. DB가 필요한 테스트는 실제 MySQL 8(로컬 `compose.yaml`, CI 서비스 컨테이너)로 돌린다. 내장 DB는 쓰지 않는다 (그래빗과 같음) | [제안] |
| 프론트 검증 | `npm run lint` · `npm run build`(타입 검사·정적 빌드 포함). 바이트 계산처럼 화면에서도 계산하는 규칙은 필요해지면 단위 테스트 도구를 추가 | [제안] |
| CI (개발 저장소) | PR마다 백엔드 `test`·`build`, 프론트 `lint`·`build`. 실제 명령이 확인된 뒤 워크플로를 만든다 | [제안] |

법 관련 기능(동의, 광고 표기, 재확인, 파기, 접근 기록)의 테스트는 팀이 정한 규칙(D 묶음)대로 동작하는지 확인하는 것이다. 상업 운영이 아니라 법 조문 원문 대조는 하지 않는다 (결정체크리스트 「법 조문 확인 범위」).
