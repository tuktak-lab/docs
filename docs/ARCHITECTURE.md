# 아키텍처

> 작성일: 2026-11-23 · 상태: 초안 · 기준 문서: [요구사항 명세서](../요구사항명세서.md), [기획서](../기획서.md) 11장, [결정 체크리스트](../결정체크리스트.md) (A14 기술 스택 포함)
> 이 문서는 확정된 요구사항을 구현 구조로 옮긴 파생 문서다. 요구사항을 새로 만들지 않고 ID로 가리킨다. 각 항목의 상태: **[확정]** 기준 문서에 근거 있음 (기준 문서가 스스로 "제안"으로 적은 것은 제외) · **[제안]** 일관된 설계 초안, 팀 확인 전 · **[검토 필요]** 정해야 하는데 근거 없음.

## 1. 전제 [확정]

| 전제 | 근거 |
| --- | --- |
| 애플리케이션 서버 하나(Spring Boot)와 MySQL 1대로 운영할 수 있는 구조로 만든다. 이번 프로젝트는 배포하지 않고, 로컬에서 프론트 개발 서버를 따로 띄워 실행한다 (3장) | NFR-14, A14 |
| 모의 데이터로 개발·시연한다. 실제 매장 운영(파일럿)은 하지 않지만 설계는 실제 운영을 전제로 한다 | 결정체크리스트 「프로젝트 범위」, 명세서 6장 「제약」 |
| 메시지는 서비스 내부 가상 발송기로만 처리하고 실제로 전송하지 않는다 | A6, FR-CMP-08 |
| 계정 하나에 매장 하나. 모든 업무 데이터는 `shop_id`로 매장 단위 격리 | 명세서 6장 「제약」, 5장, NFR-03 |
| 매장 PC 한 대를 스탭이 함께 쓴다. 매장 계정 로그인 → 근무자 PIN → 잠긴 기능 PIN 재입력 | A3, D6, 명세서 2장 |
| 모든 날짜 계산·야간 제한은 Asia/Seoul 기준 | NFR-12 |

## 2. 기술 스택

| 영역 | 내용 | 상태 | 근거 |
| --- | --- | --- | --- |
| Backend | Java 21 · Gradle · Spring Boot (Spring MVC, Bean Validation) | [확정] | A14 |
| Spring Boot 버전 | 4.2.0. 골격을 만들 때 Spring Initializr 안정판으로 정함 (이전 프로젝트 그래빗은 4.1.2) | [확정] 개발 저장소 골격 (2026-11-23) | A14 |
| 인증·권한 | Spring Security 매장 계정 세션 로그인 + 근무자 PIN + 잠긴 기능 PIN 재인증. 세션 쿠키 HttpOnly·Secure·SameSite, CSRF 보호, BCrypt 해시 | [확정] | 명세서 2장, NFR-02·04, A14 |
| 데이터 | MySQL 8 + Spring Data JPA | [확정] | A14 |
| 스키마 관리 | Flyway (`ddl-auto`로 테이블을 만들지 않음) | [확정] Flyway / [제안] `ddl-auto` 금지 | A14 |
| Frontend | React + Next.js (TypeScript) | [확정] | A14 |
| Frontend 빌드 방식 | Next.js 정적 빌드(`output: 'export'`). 로컬에서는 Next.js 개발 서버를 따로 띄움 (3장) | [확정] | A14 추가 결정 |
| 3D | three.js 사용 가능. 요구사항에 3D 화면은 없음 | [확정] (선택 사용) | A14 |
| 그 밖의 프론트 라이브러리 | 필요할 때 추가 (후보는 `docs/DEVELOPMENT.md` 「4」) | [확정] 방침 | A14 |
| 예약 발송·결과 갱신 | Spring `@Scheduled` (별도 큐 없음) | [제안] | 기획서 11장, 명세서 6장 「가정」 |
| 사진 저장 | S3 호환 오브젝트 스토리지, 비공개 저장 + 짧은 만료 서명 URL | [확정] (제공사는 미결) | 명세서 6장 「외부 연동」, NFR-07 |
| 전송 | 전 구간 HTTPS | [확정] | NFR-05 |
| 로컬·테스트 DB | Docker Compose로 띄운 MySQL 8 (그래빗과 같은 방식). CI는 MySQL 서비스 컨테이너 | [제안] | — |
| Node.js 버전, 백엔드 린터·포매터 | — | [검토 필요] 골격 때 | — |
| 실행 환경 | 배포하지 않고 로컬에서 실행·시연. HTTPS(NFR-05)·백업(NFR-10)은 실제 운영을 전제로 한 설계로만 둠 | [확정] | A14 추가 결정 |

## 3. 시스템 구성

구성도는 [기획서](../기획서.md) 11장 「기술 스택과 시스템 구성」의 mermaid 그림이 기준이다. 요약하면:

- 브라우저는 앱과만 통신한다 (HTTPS + 세션 쿠키). DB·사진 저장소·(나중의) 문자 API는 앱을 통해서만 접근한다.
- 앱 안에 Spring Security(로그인·PIN·CSRF·API 권한 검사), Controller(REST API + 정적 화면), Service + JPA(예측·캠페인·성과 귀속), Scheduler(예약 발송·결과 갱신), 가상 발송기가 있다.
- API 키·DB 비밀번호는 서버 환경 변수에만 둔다 (NFR-09).

### 저장소 구성 [제안]

개발 저장소 하나에 백엔드와 프론트를 함께 둔다. 실행은 따로 하지만, 화면과 API 계약을 한 PR에서 같이 바꿀 수 있다.

```text
backend/        Spring Boot (Gradle). 패키지는 4장
frontend/       Next.js (TypeScript). 구조는 4장
compose.yaml    로컬 MySQL 8
.env.example    환경 변수 이름과 설명 (docs/DEVELOPMENT.md 「5」)
```

### 로컬 실행 [확정 A14 / 세부 제안]

배포하지 않고 로컬에서 프론트와 백엔드 서버를 따로 띄운다 (A14 추가 결정).

```text
브라우저 ── http://localhost:3000 ──▶ Next.js 개발 서버 (화면)
                                       │ /api/** 만 넘김 (rewrites)
                                       ▼
                                     Spring Boot :8080 (API) ──▶ MySQL :3306 (Docker Compose)
```

- 브라우저는 3000번만 연다. `/api/**` 요청은 Next.js가 8080으로 넘기므로, 브라우저 입장에서는 같은 출처다. 세션 쿠키·CSRF가 그대로 동작하고 CORS 설정이 필요 없다.
- rewrites는 개발 모드에서만 켠다. 정적 빌드(`next build`)에는 rewrites가 들어가지 않기 때문이다.
- 로컬은 http라 세션 쿠키의 Secure를 끈다 (`docs/DEVELOPMENT.md` 「5」). HTTPS(NFR-05)는 실제 운영 때의 설계로 남긴다.

### 서버 하나로 띄우기 (필요할 때만) [제안]

정적 빌드를 쓰므로, 시연을 프로세스 하나로 하고 싶으면 합칠 수 있다. 지금은 하지 않는다.

| 단계 | 하는 일 |
| --- | --- |
| 프론트 빌드 | `next build`가 정적 파일을 `frontend/out/`에 만든다 |
| 합치기 | `frontend/out/`을 백엔드 정적 자원 위치(`static/`)로 복사해 jar에 넣는다 |
| 제공 | Spring Boot가 `/api/**`는 Controller로, 나머지는 정적 파일로 응답한다. Next.js는 `/customers` 화면을 `customers.html`로 만들므로 확장자 없는 경로를 `.html`로 찾아 주는 설정이 필요하다 |

### 정적 빌드의 제약 [확정 A14]

로컬에서 개발 서버로 띄울 때도 똑같이 지킨다. 개발 서버에서는 동작해도 `next build`에서 실패하기 때문이다.

- Next.js 서버 기능(SSR, API Routes, Server Actions, 미들웨어)을 쓰지 않는다. 데이터는 모두 브라우저에서 `/api`로 가져온다.
- ID가 들어가는 화면은 동적 경로(`/customers/[id]`) 대신 쿼리로 연다: `/customers/detail?id=12`. 빌드할 때 고객 ID를 알 수 없기 때문이다.
- `next/image`의 이미지 최적화를 쓰지 않는다 (`images.unoptimized`). 시술 사진은 서명 URL을 그대로 쓴다 (NFR-07).

## 4. 모듈 구성 [제안]

### 백엔드 패키지

명세서 ID의 영역 코드를 그대로 패키지 경계로 쓴다. 이슈 라벨(`.github/labels.yml`)도 같은 코드를 쓴다.

| 패키지 (예) | 영역 코드 | 담는 것 |
| --- | --- | --- |
| `account` | ACC | 매장 가입·로그인, 스탭, PIN 인증, 근무자 전환, 기능별 공용/PIN 설정 |
| `customer` | CUS | 고객, 동의 이력, 취향 태그, 상담 메모, 사진, CSV 일괄 등록, 삭제(파기) |
| `reservation` | RSV | 예약, 예정 시술, 예약 가능 시간 계산, 캘린더 |
| `visit` | VIS · PAY | 방문, 실제 시술, 결제, 시술 마감 카드 |
| `prediction` | PRD | 다음 방문 기간 계산, 상태 분류, 우선순위, 처리 표시, 예측 스냅샷 |
| `campaign` | CMP | 템플릿, 캠페인, 대상 선정·제외, 대조군, 발송, 가상 발송기·가상 휴대폰, 수신 거부 |
| `analytics` | ANL | 전환 퍼널, 귀속 계산, 연결 매출, 매장 기본 지표, 예측 정확도, 대조군 비교 |
| `dashboard` | DSH | 대시보드 조회 조합 |
| `search` | SCH | 고객 통합 검색, 미매칭 검색어 (기능 키워드 사전은 프론트 정적 파일) |
| `settings` | SET | 매장 정보, 시술 메뉴, 휴무일, 발송·보관 설정 |
| `common` | NFR | 보안 설정, 권한 검사, 오류 응답, 접근 로그, 시간대, 정적 화면 경로 설정 |

- 계층은 Controller → Service → Repository (`docs/DEVELOPMENT.md` 「4」).
- 외부 호출 없이 값만으로 결과가 정해지는 규칙은 Service에서 떼어 단위 테스트한다: 예측 계산(FR-PRD-01), 상태 분류(FR-PRD-04), 우선순위(FR-PRD-09), 귀속(FR-ANL-03·FR-VIS-04), 예약 가능 시간(FR-RSV-04), 광고 문구 삽입·바이트 계산(FR-CMP-04·05), 야간 제한(FR-CMP-07).
- `PAY`를 `visit`에 둔 이유: 결제·방문 생성·예약 완료가 시술 마감 카드 저장 한 번으로 함께 처리된다 (FR-PAY-04, FR-VIS-01). 패키지를 나누면 한 트랜잭션이 두 패키지에 걸친다.

### 프론트 구조

```text
frontend/
  src/app/                 화면 경로별 page.tsx (아래 표)
  src/components/          공용 UI: 레이아웃, PIN 입력 창, 표, 페이지 이동
  src/features/<영역>/      영역별 화면 조각과 API 호출 (백엔드 패키지와 같은 이름)
  src/lib/api.ts           fetch 래퍼: CSRF 헤더, 오류 code 처리
  public/search-keywords.json   기능 검색 키워드·동의어 사전 (FR-SCH-02 "정적 파일")
```

**모든 화면에 공통**: 좌측 메뉴 7개(기획서 8장), 상단 검색창(`/`·`Ctrl+K`, FR-SCH-01), 현재 근무자 이름을 크게 표시(FR-ACC-10), PIN 인증 중이면 인증 스탭 이름과 [잠금] 버튼(FR-ACC-08).

**API 호출 규칙** (`src/lib/api.ts` 한곳에서 처리):

| 응답 code (`docs/CONTRACTS.md` 「2」) | 화면 동작 |
| --- | --- |
| `unauthorized` | `/login`으로 이동 |
| `worker_required` | `/shift`(근무자 PIN)로 이동 |
| `pin_required` | PIN 입력 창 → 인증되면 같은 요청을 다시 보냄 |
| `owner_pin_required` | 원장 PIN 입력 창 (`message`를 함께 표시, 예: 예약 제한 사유) |
| 그 밖의 code | `message`를 그대로 보여 줌 |

- 연락처 마스킹은 서버가 한다 (NFR-04). 화면에서 다시 가리거나 풀지 않는다.
- 날짜·시각은 Asia/Seoul로 표시한다 (NFR-12).

### 화면 경로

메뉴와 화면은 기획서 8장을 따른다. "기능 키"는 그 화면의 기본 권한이고, 한 화면 안의 다른 영역은 그 영역의 기능 키를 따른다 (6장).

| 경로 | 화면 | 기능 키 | 요구사항 |
| --- | --- | --- | --- |
| `/signup` | 매장 가입 | 비로그인 | FR-ACC-01 |
| `/login` | 매장 로그인 | 비로그인 | FR-ACC-02 |
| `/password-reset` | 비밀번호 재설정 (P2) | 비로그인 | FR-ACC-06 |
| `/shift` | 근무자 PIN 입력·전환 | 매장 세션 | FR-ACC-10 |
| `/dashboard` | CRM 대시보드 (`/`도 여기로) | `DASHBOARD_SEARCH` (영역별 `INSIGHT`·`CAMPAIGN_VIEW`) | FR-DSH-01~06 |
| `/reservations` | 스탭별 주간 캘린더, 예약 등록·수정 (`?view=day` 일간 보기 P2) | `RESERVATION` | FR-RSV-01~05 |
| `/reservations/detail?id=` | 예약 상세, 고객 없는 예약의 [고객 연결] | `RESERVATION` | FR-DSH-01, FR-RSV-03 |
| `/reservations/closing?id=` | 시술 마감 카드 | `RESERVATION` | FR-PAY-04, FR-VIS-05 |
| `/customers` | 고객 목록·검색 | `CUSTOMER_VIEW` | FR-CUS-02 |
| `/customers/new` | 고객 등록 | `CUSTOMER_WRITE` | FR-CUS-01 |
| `/customers/detail?id=` | 고객 상세·시술 히스토리북 | `CUSTOMER_VIEW` (영역별) | FR-CUS-03~11, FR-PRD-02 |
| `/customers/import` | CSV 일괄 등록 (P2) | `CUSTOMER_WRITE` | FR-CUS-13 |
| `/customers/retention` | 파기 대상 목록 | `OWNER_PIN` | FR-CUS-12 |
| `/consent?customerId=` | 태블릿 본인 체크 (고객이 직접 체크) | `CONSENT` | FR-CUS-09 |
| `/insights` | 재방문 관리 (상태별 탭) | `INSIGHT` | FR-PRD-05~07 |
| `/campaigns` | 캠페인 목록 | `CAMPAIGN_VIEW` | FR-CMP-10 |
| `/campaigns/new` | 캠페인 작성 (대상 → 템플릿 → 미리보기 → 검토 → 발송) | `CAMPAIGN_SEND` | FR-CMP-01~09·12·18 |
| `/campaigns/detail?id=` | 캠페인 결과·퍼널·대조군 비교 | `CAMPAIGN_VIEW` | FR-ANL-01·04·09 |
| `/campaigns/templates` | 템플릿 관리 | `CAMPAIGN_SEND` | FR-CMP-03 |
| `/campaigns/reconfirm` | 동의 재확인 대상 | `CAMPAIGN_VIEW` | FR-CMP-13 |
| `/virtual-phone` | 가상 휴대폰 | `CAMPAIGN_SEND` | FR-CMP-11·16 |
| `/analytics` | 성과 분석 (캠페인 전환 퍼널·연결 매출·대조군 비교, 매출·주기 내 재방문율·예측 정확도) | `SALES_ANALYTICS` (영역별 `CAMPAIGN_VIEW`) | FR-ANL-01·02·05~07·09 |
| `/settings` | 매장 설정 (탭: 매장 정보·영업시간, 시술 메뉴, 휴무일, 예측 기준, 발송, 보관 기간, 스탭·PIN·기능 잠금) | `OWNER_PIN` (원장 PIN 재설정 FR-ACC-09는 원장 PIN 없이 매장 계정 비밀번호로, `docs/CONTRACTS.md` 「4」 `PUT /api/owner-pin`) | FR-SET-01~07, FR-ACC-03~05·09 |

## 5. 데이터

**기준은 명세서 5장 「데이터 요구사항」이다.** 엔티티·속성·고유 제약은 5장을 따르고, 이 절은 관계와 구현 메모만 더한다.

### 관계도 (5장에서 파생)

```mermaid
erDiagram
    shop ||--o{ staff : ""
    shop ||--o{ day_off : ""
    shop ||--o{ customer : ""
    shop ||--o{ service_menu : ""
    shop ||--o{ message_template : ""
    staff |o--o{ day_off : "스탭 휴무"
    customer ||--o{ customer_prediction : "카테고리별"
    customer ||--o{ prediction_snapshot : ""
    customer ||--o{ consent : "이력"
    customer ||--o{ preference_tag : ""
    customer ||--o{ consult_note : ""
    customer |o--o{ reservation : "고객 없는 예약은 비움"
    customer |o--o{ visit : "고객 없음 마감은 비움"
    staff ||--o{ reservation : "담당"
    reservation ||--|{ reservation_service : "예정 시술 1개 이상"
    service_menu ||--o{ reservation_service : ""
    visit |o--o{ reservation : "완료 시 연결"
    reservation ||--o{ payment : "결제는 예약에서만"
    visit ||--o{ payment : ""
    visit ||--o{ visit_service : "실제 시술"
    service_menu |o--o{ visit_service : "가져온 방문은 비움"
    staff |o--o{ visit_service : "시술 담당"
    visit ||--o{ photo : ""
    message_template ||--o{ campaign : ""
    campaign |o--o{ campaign_message : "수신 거부 안내는 비움"
    customer ||--o{ campaign_message : ""
```

주요 관계만 그렸다. `shop`과의 관계는 모든 업무 테이블에 있고(5장), 작성·처리 스탭(상담 메모, 동의, 캠페인 검토자)과 `payment.customer_id`, `access_log`·`search_miss_log`는 생략했다.

### 구현 메모

| 항목 | 내용 | 상태 |
| --- | --- | --- |
| 매장 격리 | 모든 업무 테이블에 `shop_id`. 모든 조회 조건에 세션의 `shop_id` | [확정] 5장, NFR-03 |
| 고유 제약 | (shop_id, 휴대폰), (customer_id, 카테고리), (customer_id, 방문일), 매장 안 PIN 중복 불가 등은 5장 비고대로 | [확정] 5장 |
| NULL과 고유 제약 | 5장은 "삭제된 고객의 휴대폰 NULL", "고객 없는 방문"을 고유 제약에서 빼라고 한다. MySQL 고유 인덱스는 NULL을 서로 다른 값으로 보므로 별도 처리 없이 만족된다 | [제안] |
| PIN 중복 검사 | PIN은 해시라 DB 고유 제약을 걸 수 없다. 등록·재설정 때 서버가 같은 매장 스탭의 해시와 하나씩 비교한다 | [확정] 5장 staff 비고 |
| 귀속 발송 ID | `reservation_service`·`visit_service`의 "귀속 발송 ID"는 고객별 발송 기록인 `campaign_message` 행을 가리키는 것으로 해석했다 | [검토 필요] 5장에 대상 테이블이 명시되지 않음 |
| 기본키 | `BIGINT` 자동 증가 | [제안] |
| enum 저장 | 문자열로 저장 (`@Enumerated(EnumType.STRING)`). 값 목록은 `docs/CONTRACTS.md` 「3」 | [제안] |
| 시각 저장 | DB·JVM·JDBC 시간대를 Asia/Seoul로 고정하고 `DATETIME`·`DATE`로 저장 | [제안] NFR-12에서 파생 |
| 로그인·PIN 실패 잠금 상태 | 실패 횟수·잠금 해제 시각을 `shop`에 둔다 (서버 재시작 뒤에도 유지). 5장 `shop` 속성에는 아직 없음 | [제안] |
| 스키마 관리 | Flyway migration 파일(`V{n}__{설명}.sql`)로 관리한다. 이미 적용된 파일은 고치지 않고 새 버전을 더한다. `ddl-auto`로 테이블을 만들지 않는다 | [확정] Flyway (A14) / [제안] 운영 규칙 |

## 6. 인증·권한 구현 [제안]

**정책의 기준은 명세서 2장(기능별 공용/PIN 표)과 FR-ACC-01~10이다.** 이 절은 그 정책을 서버에서 어떻게 검사할지에 대한 제안이다.

### 세션에 두는 값

| 값 | 생기는 때 | 없어지는 때 | 근거 |
| --- | --- | --- | --- |
| 매장 (`shopId`) | 매장 계정 로그인 | 로그아웃, 세션 만료 | FR-ACC-02 |
| 현재 근무자 (`currentStaffId`) | 근무자 PIN 입력 | 근무자 전환, 로그아웃 | FR-ACC-10 |
| PIN 인증 스탭·만료 시각 (`pinStaffId`, `pinExpiresAt`) | 잠긴 기능 PIN 입력 ("잠긴 기능 사용 허용" 스탭만) | 5분 무입력, [잠금], 로그아웃 | FR-ACC-08, C23 |

현재 근무자와 PIN 인증 스탭은 다를 수 있다 (예: 원장이 와서 PIN 입력, D6).

### 검사 순서

1. 매장 세션이 없으면 거부 (401).
2. 현재 근무자가 없으면 거부. 로그인 직후 근무자 PIN 화면만 열린다 (FR-ACC-10).
3. 요청한 기능의 설정을 매장 설정(`shop`의 PIN 잠금 기능 목록)에서 읽는다.
   - **공용**: 통과.
   - **PIN**: PIN 인증이 유효하면 통과하고 만료 시각을 5분 연장한다. 아니면 거부.
   - **원장 PIN**: PIN 인증 스탭이 원장 스탭이면 통과. 아니면 거부.
4. 대상 데이터가 세션 매장 것이 아니거나 없으면 404 (NFR-03).
5. 연락처는 "고객 연락처 전체 보기"를 통과하지 못하면 응답에서 마스킹 (`010-****-1234`, NFR-04).

오류 code는 `docs/CONTRACTS.md` 「2」, 기능 키 목록은 같은 문서 「3」을 따른다.

### 한 화면에 여러 기능이 섞일 때

명세서 2장은 "각 영역은 그 정보가 속한 기능의 설정을 따른다"고 정했다. 고객 상세처럼 영역이 섞인 화면은 **영역마다 API를 나눠** 각 API가 자기 기능으로 검사하게 한다. 예: 고객 상세 기본 정보(고객 조회), 카테고리별 예측(인사이트), 수신 이력·캠페인 연결 기록(캠페인 목록·결과 조회), 결제 금액(매출·성과 분석 조회). 화면은 잠긴 영역의 응답을 받으면 가려 두고 PIN 입력 뒤 다시 요청한다.

### 기록에 남는 사람

- 공용 기능의 작성자·처리자와 접근 로그: 현재 근무자 (FR-ACC-10).
- 잠긴 기능으로 한 일: PIN 인증 스탭 (명세서 5장 `access_log` 주요 속성 "PIN 인증 스탭 또는 현재 근무자").
- 예약·방문의 담당 스탭은 근무자와 별개로 고른다 (A3 「알아둘 점」).

## 7. 외부 연동 경계

외부 연동 목록과 우선순위는 명세서 6장 「외부 연동」이 기준이다.

| 경계 | 설계 | 상태 |
| --- | --- | --- |
| 메시지 발송 | 발송 처리 코드를 한곳에 모아, 실제 발송으로 바꿀 때 나머지 기능은 바꾸지 않는다 | [확정] FR-CMP-17 (전환 자체는 P3이지만 이 구조 조건은 명세서에 적혀 있음) |
| | 발송은 컴포넌트 하나(예: `MessageSender`)를 거치고, MVP 구현은 가상 발송기다. 가상 발송기는 몇 초 뒤 결과를 바꾼다: 번호 형식 오류는 실패, 설정한 비율만큼 무작위 실패, 나머지는 성공 (FR-CMP-10). 실패 비율 기본값은 미결 (명세서 6장 「미결 사항」) | [제안] |
| 사진 저장소 | 저장소 접근을 컴포넌트 하나에 모은다. 제공사가 정해지기 전에는 로컬 개발용 구현으로 대신한다 | [제안] 제공사는 미결 |
| 이메일 (비밀번호 재설정) | P2 (FR-ACC-06). 발송 수단 미정 | [검토 필요] |

### 스케줄러 작업 [제안]

| 작업 | 근거 |
| --- | --- |
| 예약 발송 실행. 발송 시점에 수신 동의·대상 제외·일 발송 한도를 다시 검사 | FR-CMP-09 |
| 가상 발송 결과 갱신 | FR-CMP-10 |
| 야간에 접수된 수신 거부 처리 안내를 다음 08:00에 발송 | FR-CMP-07·11 |

예측 상태는 조회할 때 오늘 날짜로 계산하므로 야간 배치가 없다 (A12, 기획서 9장). 예측 자체는 방문이 생기거나 바뀔 때 해당 고객만, 메뉴·카테고리 주기나 예측 속성이 바뀌면 영향받는 고객 전체를 다시 계산한다 (FR-PRD-01, FR-SET-02).

## 8. 성능 점검 [확정]

응답 시간 수치는 두지 않는다. 시드 데이터(매장 1곳·스탭 5명·고객 3천 명, 구성은 C17)에서 아래를 확인한다 (NFR-01).

- 목록 API는 모두 페이징 (개수는 C13)
- 주요 조회 쿼리는 인덱스 사용 (`EXPLAIN`)
- 목록 화면에 N+1 쿼리 없음
- 캠페인 발송·CSV 일괄 등록·다운로드는 진행 상태 표시

## 9. 남은 결정

| 항목 | 상태 | 필요한 때 |
| --- | --- | --- |
| Spring Boot 버전 | 정함: 4.2.0 (2절) | — |
| 패키지 기준 이름(group), 개발 저장소 이름 | 정함: `com.tuktaklab` (패키지 `com.tuktaklab.keepsy`), `tuktak-lab/Keepsy` | — |
| Node.js 버전, 백엔드 린터·포매터 | [검토 필요] | 프론트 골격 때 · 백엔드 첫 PR 전 |
| 귀속 발송 ID가 가리키는 테이블 (5절) | [검토 필요] | 캠페인·성과 구현 전 (Keepsy #101) |
| 사진 저장소 제공사 | 미결 (기획서 13장, 명세서 6장) | 사진 업로드 구현 전 (Keepsy #13) |
| 가상 발송기 무작위 실패 비율 | 미결 (명세서 6장) | 캠페인 발송 구현 전 (Keepsy #87) |

### 백엔드 이슈를 쓰며 찾은 빈칸 (2026-11-23) [검토 필요]

개발 저장소 이슈 본문에 「[확인 필요]」로 적어 둔 것 중 여러 이슈에 걸치거나 데이터 구조에 영향을 주는 것이다. 요구사항에 해당하면 결정체크리스트에서 정한 뒤 명세서 → 이 문서 순으로 반영하고, API 계약이면 CONTRACTS를 먼저 고친다. 나머지 작은 세부 규칙은 각 이슈 본문에 있다.

| 빈칸 | 관련 | Keepsy 이슈 |
| --- | --- | --- |
| 시술 마감 카드·히스토리북의 "메모"를 저장할 속성이 명세서 5장 `visit`에 없음 | FR-PAY-04, FR-CUS-07 | #8, #45, #65 |
| 시술 마감 카드 저장(closing, `RESERVATION`) 안의 사진(`CUSTOMER_WRITE`)·동의 받기(`CONSENT`) 권한을 명세서 2장 "각 영역은 그 기능 설정을 따름"과 어떻게 맞출지 | 명세서 2장, FR-PAY-04 | #65 |
| 로그인·PIN 실패 잠금 상태(5절 [제안])와 비밀번호 재설정 토큰을 저장할 속성이 명세서 5장에 없음 | FR-ACC-02·06·08 | #6, #15, #25 |
| 캠페인 상태 enum 값 (CONTRACTS 3장) | FR-CMP-08·09 | #10, #89, #90, #96, #97 |
| 결제 취소·방문 삭제 때 연결된 방문·결제·사진·예약 상태 처리 | FR-PAY-02, FR-VIS-03 | #69, #71 |
| 처리 표시가 `customer_prediction`에 있어 재계산 때 지워지지 않게 할 방법 | FR-PRD-07 | #78 |
| "이번 주"의 시작 요일 | FR-DSH-03, FR-ANL-06 | #79, #107 |
| CONTRACTS 2장에 없는 오류 code: 가입 이메일 중복, 원장 PIN 재설정의 비밀번호 확인 실패 | FR-ACC-01·09 | #14, #19 |
| 스탭 정기 휴무 요일을 바꿀 때 밀리는 예약 목록 (FR-SET-07은 요구, CONTRACTS는 `PATCH /api/staff/{staffId}`에 없음) | FR-SET-07 | #21 |
| CONTRACTS 4장에 없는 API: 취향 태그 목록, CSV 일괄 등록 진행 상태 | FR-CUS-04·13, NFR-01 | #42, #52 |
| 캘린더 기간 조회에 페이징(CONTRACTS 1장)을 적용할지 | FR-RSV-02 | #58 |
