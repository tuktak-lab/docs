# 개발 가이드

> 작성일: 2026-11-23 · 상태: 초안 · 기준 문서: [요구사항 명세서](../요구사항명세서.md), [기획서](../기획서.md), [결정 체크리스트](../결정체크리스트.md)
> **개발 저장소: [tuktak-lab/Keepsy](https://github.com/tuktak-lab/Keepsy)** (2026-11-23 생성). 이 문서의 Git 전략·컨벤션·도구는 대부분 **[제안]**이고, 요구사항에서 나온 규칙에만 **[확정]**과 근거 ID를 붙였다. 팀이 정하면 상태를 바꾼다.

## 1. 저장소

| 저장소 | 역할 | 상태 |
| --- | --- | --- |
| `tuktak-lab/docs` (이 저장소) | 기획·결정·설계 문서. 애플리케이션 코드를 두지 않는다 | 현재 운영 방식 |
| `tuktak-lab/Keepsy` (개발 저장소) | 저장소 하나에 `backend/`(Spring Boot)와 `frontend/`(Next.js)를 함께 두고, 실행은 따로 한다. 배포하지 않고 로컬에서만 연다 (A14, `docs/ARCHITECTURE.md` 「3」). 로컬에서는 이 저장소와 같은 상위 폴더에 클론해 `../docs`로 문서를 읽는다 | 생성됨 (2026-11-23) |

## 2. Git 전략

### 이 저장소 (현재 운영 방식)

작업 브랜치 → PR → check 통과 후 올린 사람이 바로 머지한다. 승인은 필요 없고 `main`에 직접 push하지 않는다 (2026-11-24 변경). 규칙은 `.claude/rules/git-workflow.md`.

### 개발 저장소 [제안]

`main` 하나와 작업 브랜치만 두는 가벼운 흐름이다.

**꼭 지킬 것**

1. `main`에 직접 push하지 않고 PR로만 합친다. `main`과 남의 브랜치에는 force push하지 않는다.
2. 작업은 이슈에서 시작하고, PR 본문에 `Closes #N`을 적는다.
3. PR 제목은 `<type>(<scope>)?: <설명>`. squash merge하면 PR 제목이 `main`의 커밋이 된다.
4. GitHub 리뷰 승인 1명 이상을 받으면 작성자가 바로 머지한다 (2026-11-24 결정).
5. 비밀 값과 실제 개인정보를 커밋하지 않는다.

**충돌 줄이기 · 머지 (2026-11-24 결정)**: 여러 사람이 각자 Claude Code 세션에서 동시에 작업하며 쌓인 PR과 공용 파일에서 충돌이 반복되어 정했다. 개발 저장소 `CLAUDE.md` 「충돌 줄이기」가 같은 내용이다.

1. PR을 쌓지 않는다. 앞 PR이 머지된 뒤 `main`에서 새 브랜치를 딴다. 쌓았다면 앞 PR이 머지된 직후 작성자가 `git rebase --onto origin/main <앞 PR의 마지막 커밋>`과 `git push --force-with-lease`를 한다.
2. PR을 올리기 직전과 머지 직전에 `git fetch && git rebase origin/main` 후 빌드한다. 충돌은 작성자가 푼다.
3. 승인되면 작성자가 바로 머지한다. 승인된 PR을 쌓아 두지 않는다.
4. 계약(docs) PR이 먼저 머지된 뒤 코드 PR의 Draft를 푼다. 계약 docs PR은 올린 사람이 check 통과 후 바로 머지하므로 리뷰를 기다리지 않는다.
5. 결정을 공유할 때 메시지 끝에 `반영: @담당 / 저장소`를 적는다. 결정은 `결정체크리스트.md`에 기록하고 Slack은 알림으로만 쓴다.
6. 공용 파일(`common/`, `application.yaml`, `SecurityConfig`, 테스트 지원 클래스) 변경은 기능 PR과 나눠 작게 올린다. 먼저 본 사람이 승인하고, 그 파일을 주로 쓰는 사람은 리뷰어로 지정한다.
7. 공용 문서 · 목록은 끝에 덧붙이지 않고 정해진 자리에 넣는다. CONTRACTS 6장은 영역 소절(4장 순서)에, enum · 목록은 관련 값 옆에.
8. 머지 후 브랜치 자동 삭제를 켠다. 그 브랜치를 base로 쓰던 PR은 GitHub가 `main`으로 옮긴다. CLI로 지울 때는 그 PR의 base를 먼저 `main`으로 바꾼다 (바로 지우면 PR이 닫힌다).

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
- 라벨: 종류(`feature` · `bug` · `chore`) + 영역(`area:acc` … 명세서 ID 영역 코드). 정의는 개발 저장소 `.github/labels.yml`.
- 우선순위 라벨(`priority:p1~p3`)은 지금 붙이지 않는다. 대부분 구현할 예정이라 구분이 필요 없다 (2026-11-23 팀 결정). 명세서 우선순위는 Feature 본문의 「우선순위」 칸에 그대로 적는다.
- 마일스톤은 지금 쓰지 않는다. 시연·검증 단계(기획서 12장)에서 필요해지면 그때 만든다 (2026-11-23 팀 결정).
- 담당은 이슈 assignee로 정한다. 영역(백엔드 패키지, `docs/ARCHITECTURE.md` 「4」) 단위로 나눠, 사람이 늘면 담당자가 없는 영역부터 맡는다.
- 백엔드 이슈는 개발 저장소 Issues #1~#108에 있다 (2026-11-23, CONTRACTS 4장 기준). 프론트 이슈는 데모가 `frontend/`에 올라온 뒤 만든다.

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

- **Controller → Service → Repository.** Controller는 요청 검증(Bean Validation)·권한 검사·응답 DTO 변환만 한다. 트랜잭션은 Service에 두고, 기능 하나가 Service 메서드 하나에서 끝나게 한다.
- 규칙의 위치: 엔티티의 상태를 바꾸는 규칙(예: 예약 완료·취소·노쇼, 캠페인 상태 전이)은 엔티티 메서드에 두고, 규칙을 어기면 엔티티가 예외를 던진다. Service는 "조회 → 엔티티에 일 시키기 → 결과 반환" 흐름만 맡는다. 값만으로 결과가 정해지는 계산 규칙은 아래처럼 별도 클래스에 둔다.
- Entity를 응답으로 바로 내보내지 않고 DTO로 바꾼다. 마스킹 같은 권한별 필드 차이는 DTO 변환에서 처리한다.
- 다른 패키지(도메인)와는 아래 「도메인 연동」 방식으로만 주고받는다.
- 값만으로 결과가 정해지는 규칙(예측 계산, 상태 분류, 우선순위, 귀속, 예약 가능 시간, 광고 문구·바이트 계산)은 별도 클래스로 떼어 단위 테스트한다 (`docs/ARCHITECTURE.md` 「4」).
- Lombok: Entity에는 `@Getter`와 `@NoArgsConstructor(access = AccessLevel.PROTECTED)`만 쓴다. `@Setter`는 쓰지 않는다(값은 엔티티 메서드로만 바꾼다). `@Data`·`@ToString`·`@EqualsAndHashCode`는 연관관계를 따라가 무한 루프나 의도치 않은 지연 로딩을 일으키므로 Entity에 쓰지 않는다. DTO는 `record`나 `@Getter`. IntelliJ에서는 annotation processing을 켠다.
- 같은 도메인 안의 연관관계는 기본 단방향 N:1, 지연 로딩. 다른 도메인의 엔티티는 객체로 매핑하지 않는다(「도메인 연동」). 목록 조회는 fetch join 등으로 N+1을 막는다 (NFR-01).
  - `@ManyToOne`·`@OneToOne`에는 `fetch = FetchType.LAZY`를 명시한다 (기본값이 즉시 로딩이다).
  - 양방향은 부모가 자식 컬렉션을 실제로 쓰는 곳에만 둔다. 외래 키를 가진 `@ManyToOne` 쪽이 주인이고, 부모의 `@OneToMany`에 `mappedBy`를 쓴다. 양쪽 값은 부모의 편의 메서드(예: `addService(...)`) 한 곳에서 함께 맞춘다.
  - `cascade`·`orphanRemoval = true`는 부모와 함께 생기고 사라지는 자식 방향에만 건다. 다른 엔티티를 향한 cascade는 두지 않는다.
  - `@ManyToMany` 대신 연결 엔티티와 `@ManyToOne` 두 개를 쓴다.
- 의존성은 생성자 주입만 쓴다 (`private final` 필드 + `@RequiredArgsConstructor`). 필드 `@Autowired`나 `new XxxService()`로 의존 객체를 만들지 않는다.
- 조회만 하는 Service 메서드는 `@Transactional(readOnly = true)`로 둔다.
- 반복문 안에서 Repository를 호출하지 않는다. ID를 모아 `findAllById()` 등으로 한 번에 조회하고 Map으로 맞춘다.
- 쿼리는 매개변수 바인딩으로만 쓴다. JPQL·네이티브 쿼리에 사용자 입력을 문자열로 이어 붙이지 않는다.
- 예외는 공통 예외 하나와 오류 code 열거형으로 던지고, 전역 예외 처리 한 곳에서 `docs/CONTRACTS.md` 「2」 모양으로 바꾼다. 예외를 잡아서 무시하지 않는다.
- 매장 설정이 아닌 고정 숫자(예: PIN 인증 유지 5분, 로그인 잠금 15분)는 상수 한 곳에 모은다.
- 성급한 추상화를 만들지 않는다. 구현이 하나뿐인 인터페이스는 교체 계획이 문서에 있을 때만 둔다. 단, 「도메인 연동」의 Port는 예외로 둔다.

### 로깅 [제안]

- `System.out.println`·`printStackTrace()`를 쓰지 않고 SLF4J 로거(Lombok `@Slf4j`)를 쓴다. 값은 문자열 더하기 대신 `{}` 자리 표시자로 넘긴다 (예: `log.info("예약 완료 reservationId={}", id)`).
- 레벨: 오류는 `error`, 예상 가능한 문제는 `warn`, 주요 업무 흐름은 `info`, 개발용 상세 값은 `debug`. 반복문 안에서 `info`를 대량으로 찍지 않는다. 패키지별 레벨은 `logging.level`로 조정한다.
- 예외를 기록할 때는 예외 객체를 마지막 인자로 넘겨 원인을 남긴다 (예: `log.error("발송 실패 campaignId={}", id, e)`). 처리하지 못한 예외는 전역 예외 처리 한 곳에서 한 번만 기록한다.
- 비밀번호·PIN·세션 쿠키·고객 연락처를 로그에 남기지 않는다. 요청 DTO나 엔티티를 통째로 찍지 않는다. 개인정보 접근 기록은 로그가 아니라 `access_log`에만 남긴다 (NFR-06).

### 도메인 연동 (2026-11-23 팀 결정)

도메인은 백엔드 패키지(`docs/ARCHITECTURE.md` 「4」)다. 강사 코드 점검표의 「도메인 주도 개발」·「도메인 간 연동」 항목(D-3, I-1~4·8~10)을 따른다.

- 다른 도메인의 엔티티는 객체가 아니라 ID로 참조한다 (예: `Reservation`의 `Long customerId`). DB 외래 키는 명세서 5장대로 둔다.
- 다른 도메인의 엔티티·Repository를 import하지 않는다.
- 다른 도메인의 값이 내 로직에 필요하면, 값을 쓰는 쪽 도메인의 `port` 패키지에 인터페이스를 둔다 (예: `reservation.port.CustomerReader`). 이름과 메서드는 "내가 무엇이 필요한가"로 짓고, 반환 타입은 상대 도메인의 타입이 아니라 내 도메인의 record다.
- Adapter는 상대 도메인이 공개한 조회 Service(예: `CustomerQueryService`)와 그 응답 DTO만 호출해 내 record로 바꾼다. 목록용으로 여러 ID를 한 번에 조회하는 메서드를 둔다 (N+1 방지).
- 다른 도메인의 상태를 바꿔야 하면 그 도메인이 공개한 Service 메서드를 Port로 호출한다 (예: 시술 마감 카드 저장 때 예약 완료 처리, FR-PAY-04). 시술 마감 카드는 결제·방문 생성·예약 완료를 한 트랜잭션으로 묶는다 (`docs/ARCHITECTURE.md` 「4」, 점검표 D-7의 의식적 예외).
- 화면에 보여 줄 도메인 횡단 조회(대시보드, 통합 검색, 성과 분석 등)는 조회 전용 Repository(`query` 패키지)에서 DTO Projection(JPQL `select new`)으로 필요한 컬럼만 가져온다. 메모리에서 거르거나 정렬하지 않는다.
- Projection으로 조회한 DTO로 상태를 바꾸거나 규칙을 판단하지 않는다. 상태 변경은 엔티티를 Repository로 불러와 엔티티 메서드로 한다.

### 프론트 [제안]

- TypeScript `strict`. `any`를 쓰지 않는다.
- 데이터는 모두 브라우저에서 `src/lib/api.ts`를 거쳐 가져온다. 화면 코드에서 `fetch('/api/…')`를 직접 부르지 않는다. 오류 code 처리는 그 한곳에서 한다 (`docs/ARCHITECTURE.md` 「4」 「API 호출 규칙」).
- Next.js 서버 기능(SSR, API Routes, Server Actions, 미들웨어)과 동적 경로(`[id]`)를 쓰지 않는다. 정적 빌드라 빌드가 실패한다 (`docs/ARCHITECTURE.md` 「3」).
- 권한에 따라 버튼을 숨기거나 잠긴 영역을 가리는 것은 편의일 뿐이다. 실제 검사는 서버가 한다 (NFR-04).
- API 응답 타입은 `src/features/<영역>/types.ts`에 두고, `docs/CONTRACTS.md`의 이름(camelCase 필드, enum 값)을 그대로 쓴다.
- 스타일은 Next.js 기본 CSS Modules로 시작한다.
  - 데모에서 옮긴 화면은 당분간 화면별 CSS를 문자열로 받아(`import css from './X.css?inline'`, `next.config.ts`의 turbopack 규칙) 그 화면이 떠 있는 동안에만 `<head>`에 넣는다(`useStyleSheet`). 데모 화면끼리 `.card`·`.btn` 같은 클래스 이름이 겹치고 정의가 달라 전역 CSS로 합치면 화면이 깨지기 때문이다. CSS Modules로는 각 화면 이슈에서 옮긴다 (Keepsy #119, 2026-11-24).

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

실제 값은 저장소 루트의 `.env` 하나에 둔다. `compose.yaml`은 같은 폴더의 `.env`를 자동으로 읽고, 백엔드는 `application.yaml`의 `spring.config.import: optional:file:../.env[.properties]`로 같은 파일을 읽어 `${MYSQL_USER}`처럼 쓴다 (그래빗과 같은 방식). 그래서 DB 값을 두 번 적지 않는다.

| 변수 | 쓰는 곳 | 비고 |
| --- | --- | --- |
| `MYSQL_DATABASE` · `MYSQL_USER` · `MYSQL_PASSWORD` | 로컬 MySQL 생성 + 백엔드 DB 접속 | MySQL 공식 이미지가 읽는 이름을 백엔드도 그대로 씀 |
| `MYSQL_ROOT_PASSWORD` | 로컬 MySQL | 백엔드는 쓰지 않음 |
| `MYSQL_HOST` · `MYSQL_PORT` | 백엔드 DB 접속 | 선택. 없으면 `localhost` · `3306` |
| `APP_STORAGE_DIR` · `APP_STORAGE_SIGNING_KEY` | 사진 저장소 | 비공개 디렉터리 경로와 서명 URL용 HMAC 비밀키 (결정체크리스트 F16, `docs/ARCHITECTURE.md` 「7」). 디렉터리는 저장소에 커밋하지 않는다 |
| `SPRING_MAIL_*` | 비밀번호 재설정 메일 | P2 (FR-ACC-06). 그때 추가 |

세션 쿠키 Secure는 Spring 기본값(`false`)을 그대로 쓴다. 로컬은 http이고, HTTPS로 운영하게 되면 그때 켠다 (NFR-02·05).

이름은 `[제안]`이다. 골격을 만들 때 `.env.example`에 이 표대로 적고, 바뀌면 이 표를 함께 고친다.

## 6. 골격 만들기와 실행 명령

### 백엔드 골격 [제안]

IntelliJ에서 새 프로젝트를 Spring Boot(Spring Initializr)로 만든다. 고를 값:

| 항목 | 값 |
| --- | --- |
| Language · Type | Java · Gradle (Groovy) — 그래빗과 같음 |
| JDK · Java | 21 |
| Packaging | Jar |
| Group · Artifact | `com.tuktaklab` · `keepsy` (기본 패키지 `com.tuktaklab.keepsy`, 개발 저장소 골격에서 정함) |
| Spring Boot | Initializr가 보여주는 안정판 (SNAPSHOT·M·RC 제외) |
| Dependencies | Spring Web, Spring Security, Spring Data JPA, Validation, MySQL Driver, Flyway Migration, Lombok |
| 나중에 추가 | Java Mail Sender (P2 비밀번호 재설정), 사진 저장소 SDK (제공사가 정해지면) |

설정 파일(`application.yaml`, `compose.yaml`, `.env.example`)과 의존성 추가는 IntelliJ에서 직접 만든다. 만드는 순서와 내용은 그 단계에서 따로 안내한다.

### 프론트 골격 [제안]

`frontend/`에 Next.js 프로젝트를 만든다. TypeScript · ESLint · App Router · `src/` 디렉터리를 켜고, Tailwind는 끈다(4절). 만든 뒤 `next.config`에 정적 빌드(`output: 'export'`), 이미지 최적화 끄기(`images.unoptimized`), 개발 모드에서만 `/api/**`를 8080으로 넘기는 설정을 넣는다 (`docs/ARCHITECTURE.md` 「3」).

### 실행 명령

골격을 만든 뒤 실제로 돌려 보고 확인된 명령만 "확인됨"으로 적는다. "확인 전"은 이 도구들의 표준 명령이다.

| 할 일 | 명령 | 상태 |
| --- | --- | --- |
| 로컬 MySQL 띄우기 | `docker compose up -d` (저장소 루트에서, `.env` 필요) | 확인됨 (2026-11-23, MySQL 8.4) |
| 백엔드 실행 | `./gradlew bootRun` (`backend/`에서) | 확인됨 (2026-11-23, Git Bash. 8080에서 Spring Security 기본 로그인 화면) |
| 백엔드 테스트 · 빌드 | `./gradlew test` · `./gradlew build` (`backend/`에서, 로컬 MySQL이 떠 있어야 함) | 확인됨 (2026-11-23, Git Bash. `./gradlew build`는 CI `backend` job(GitHub Actions ubuntu, MySQL 8.4 서비스 컨테이너)에서도 통과, Keepsy #110) |
| 백엔드 포매팅 | `./gradlew spotlessApply` (`backend/`에서, 커밋 전). 검사(`spotlessCheck`)는 `./gradlew build`에 포함 | 확인됨 (2026-11-23, Git Bash, Keepsy #150) |
| 프론트 개발 서버 · 빌드 | `npm run dev` · `npm run build` (`frontend/`에서, Node 24) | 확인됨 (2026-11-24, Git Bash · Node 24.20.0, Keepsy #119. `dev`는 3000에서 열리고 `/api/**`를 8080으로 넘김, `build`는 `out/`에 정적 파일을 만듦) |
| 프론트 린트 | `npm run lint` (`frontend/`에서) | 실행은 됨, 통과 안 함 (2026-11-24. 데모에서 가져온 코드의 기존 오류 16개(`no-explicit-any` 14, `no-unescaped-entities` 2)가 남아 있음. #119 머지 뒤 수정 PR로 고침) |
| 시드 데이터 적재 | [검토 필요] (C17 구성) | — |

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
