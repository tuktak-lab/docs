# 공통 계약 (API · 오류 · 값)

> 작성일: 2026-11-23 · 상태: 초안 · 기준 문서: [요구사항 명세서](../요구사항명세서.md), [결정 체크리스트](../결정체크리스트.md)
> 프론트(TypeScript)와 백엔드(Spring)가 함께 지켜야 하는 약속을 모은다. **[확정]** 기준 문서에 근거 있음 (기준 문서가 스스로 "제안"으로 적은 것은 제외) · **[제안]** 팀 확인 전 초안 · **[검토 필요]** 정해야 하는데 근거 없음.
> 엔드포인트 목록(4절)은 `[제안]`이다. 요청·응답 필드는 구현을 시작할 때 영역별로 이 문서에 추가한다 (5절 절차).

## 1. 확정된 API 규칙 [확정]

요구사항이 API 동작을 직접 정한 것들이다. 바꾸려면 결정체크리스트를 거쳐야 한다.

| 규칙 | 근거 |
| --- | --- |
| 권한은 화면이 아니라 API에서 검사한다. 현재 근무자, PIN 인증 스탭과 만료 시각은 서버 세션에 둔다 | NFR-04 |
| 기능별 공용/PIN 설정을 바꾸면 즉시 서버 권한 검사에 반영된다 | FR-ACC-05 |
| 다른 매장 ID로 요청하면 404 | NFR-03 |
| 연락처 마스킹(`010-****-1234`)은 서버 응답 단계에서 적용한다 | NFR-04, A4 |
| 모든 입력은 서버에서 검증하고, 사용자 입력을 출력할 때 이스케이프한다 | NFR-08 |
| 목록 API는 페이징한다. 고객 목록은 20건. 기간 조회는 기간을 최대 7일로 제한하고 페이징하지 않는다 | NFR-01, FR-CUS-02, C13, F13 |
| 매장 로그인 5회 연속 실패 시 15분 잠금. PIN은 매장 단위 5회 연속 실패 시 5분 차단 | FR-ACC-02·08, C1·C22 |
| PIN 인증은 5분 무입력 또는 [잠금] 시 해제 | FR-ACC-08, C23 |
| 예약 저장 시 서버가 겹침을 다시 검사하고, 동시에 같은 시간을 잡으면 하나만 저장한다 | FR-RSV-04, C7 |
| 검토자·검토 시각이 없는 발송 요청은 서버가 거부한다 | FR-CMP-06 |
| 같은 캠페인은 중복 발송되지 않는다 | FR-CMP-08 |
| 예약 발송은 발송 시점에 수신 동의·대상 제외 조건·일 발송 한도를 다시 검사한다 | FR-CMP-09 |
| 광고 표기는 서버가 붙이고, 사용자가 지우거나 바꿀 수 없다 | FR-CMP-04, D5 |
| 사진은 인증된 사용자에게 짧은 만료의 서명 URL로만 준다 | NFR-07 |
| 개인정보 조회·수정·삭제·다운로드는 접근 로그에 남긴다 | NFR-06, D2 |
| 세션 쿠키는 HttpOnly·Secure·SameSite, CSRF 보호 | NFR-02 |
| 날짜 계산·야간 제한은 Asia/Seoul 기준 | NFR-12 |

## 2. 오류 응답 [제안]

모양은 하나로 통일한다. `code`는 소문자 snake이고 화면은 `code`로 분기한다. `message`는 사용자에게 보여줄 한국어 문장이다. `details`는 필요할 때만 넣는다 (예: 스탭 비활성화를 막는 예약 목록).

```json
{ "error": { "code": "pin_required", "message": "PIN을 입력해 주세요" } }
```

같은 상황은 모든 API에서 같은 code를 쓴다. 새 code는 이 표에 먼저 추가한다.

| 상황 | code | HTTP | 근거 |
| --- | --- | --- | --- |
| 매장 로그인 안 됨, 세션 만료 | `unauthorized` | 401 | FR-ACC-02 |
| 매장 계정 이메일·비밀번호 틀림 (어느 쪽이 틀렸는지 말하지 않음) | `login_failed` | 401 | FR-ACC-02 |
| 로그인 실패 잠금 중 (원장 PIN 재설정의 비밀번호 확인도 막힘) | `login_locked` | 429 | FR-ACC-02·09, C1, F11 |
| 현재 근무자 없음 | `worker_required` | 403 | FR-ACC-10 |
| PIN 틀림, "잠긴 기능 사용 허용"이 꺼진 스탭, 비활성 스탭 | `pin_invalid` | 400 | FR-ACC-04·08 |
| PIN 입력 차단 중 | `pin_locked` | 429 | FR-ACC-08, C22 |
| 원장 PIN 재설정에서 매장 계정 비밀번호 확인 실패 (로그인 세션은 유지) | `password_mismatch` | 400 | FR-ACC-09, F11 |
| 잠긴 기능인데 PIN 인증이 없거나 만료됨 | `pin_required` | 403 | FR-ACC-08, NFR-04 |
| 원장 PIN이 필요한 기능 (예약 제한 고객 예약 포함, `message`에 제한 사유. 고객 없는 예약을 제한 고객과 **연결**할 때는 안내만 하고 이 오류를 내지 않음) | `owner_pin_required` | 403 | 명세서 2장, FR-CUS-14, E3 |
| 대상이 없거나 다른 매장 것 | `not_found` | 404 | NFR-03 |
| 입력 오류 (필수 칸, 휴대폰 형식, 길이, 파일 형식·크기, 2,000바이트 초과 메시지) | `invalid` | 400 | NFR-08, FR-CUS-08, FR-CMP-05 |
| CSRF 토큰 없음·틀림 | `csrf_invalid` | 403 | NFR-02 |
| 중복 (매장 안의 고객 휴대폰·스탭 PIN, 전역의 가입 이메일) | `duplicate` | 409 | FR-CUS-01, FR-ACC-01·03, F11 |
| 예약 시간 겹침, 영업시간 밖, 매장·스탭 휴무 | `reservation_conflict` | 409 | FR-RSV-04, FR-SET-07 |
| 동의가 필요한 입력 (사진 동의 없는 사진, 건강 정보 동의 없는 건강 주의사항) | `consent_required` | 409 | FR-CUS-05·08 |
| 캠페인 검토 체크 없음 | `review_required` | 409 | FR-CMP-06 |
| 야간 발송 차단 | `night_send_blocked` | 409 | FR-CMP-07 |
| 일 발송 한도 초과 | `daily_limit_exceeded` | 409 | FR-CMP-12 |
| 그 밖의 상태 충돌 (시작 전 노쇼, 취소·노쇼 예약에 결제, 같은 캠페인 재발송, 남은 예약이 있는 스탭 비활성화) | `conflict` | 409 | FR-RSV-03, FR-PAY-01, FR-CMP-08, FR-ACC-04 |
| 그 밖의 서버 오류 | `internal_error` | 500 | — |

- Spring Security의 인증·인가 실패도 같은 모양으로 응답한다. 전역 예외 처리 한 곳(`@RestControllerAdvice`)에서 바꾼다.
- 입력 오류와 권한 오류가 한 요청에 같이 있으면 어느 쪽이 먼저 나와도 된다.

## 3. 공통 형식과 값 [제안]

### 형식

| 항목 | 규칙 |
| --- | --- |
| JSON 필드 이름 | `camelCase` |
| ID | 숫자 (`BIGINT`) |
| 날짜 | `YYYY-MM-DD` (Asia/Seoul 기준 날짜) |
| 시각 | ISO 8601, 오프셋 포함 (`2026-11-23T14:30:00+09:00`) |
| 금액 | 원 단위 정수 |
| 페이지 요청 | `?page=0&size=20` (0부터) |
| 페이지 응답 | `{ "items": [...], "page": 0, "size": 20, "totalElements": 123 }` |
| 매장 | 경로·쿼리·본문에 매장 ID를 받지 않는다. 항상 세션의 매장을 쓴다 (NFR-03을 구조로 보장) |

### enum 값

"5장 기재"는 명세서 5장에 이미 영문 값이 적혀 있는 것이다. 나머지는 5장의 한국어 값을 옮긴 제안이다.

| 대상 | 값 | 출처 |
| --- | --- | --- |
| 동의 항목 | `PRIVACY` `PHOTO` `MARKETING` `NIGHT_AD` `HEALTH` | 5장 기재 |
| 동의 방법 | `TABLET` `PAPER` `VERBAL` `IMPORT` | 5장 기재 |
| 메뉴 예측 속성 | `NORMAL` `EXCLUDE` `END_SIGNAL` | 5장 기재 |
| 철회 경로 | `UNSUBSCRIBE`(수신 거부) `DIRECT`(직접 철회) | 제안 |
| 시술 카테고리 | `NAIL` `LASH` `WAXING` `SEMI_PERMANENT` `ETC` | 제안 |
| 예약 상태 | `CONFIRMED` `COMPLETED` `CANCELED` `NO_SHOW` | 제안 (C8) |
| 예약 경로 | `NAVER` `KAKAO` `PHONE` `STORE` `ETC` | 제안 (E3) |
| 유입 경로 | `INSTAGRAM` `NAVER_SEARCH` `REFERRAL` `PASSING_BY` `ETC` | 제안 (FR-CUS-01) |
| 결제 수단 | `CARD` `CASH` `TRANSFER` `ETC` | 제안 (C9) |
| 방문 출처 | `NORMAL` `IMPORT` | 제안 |
| 고객 상태 | `ACTIVE` `DELETED` | 제안 (C12) |
| 스탭 상태 | `ACTIVE` `INACTIVE` | 제안 (FR-ACC-04) |
| 예측 상태 | `SCHEDULED`(예정) `DUE`(주기 도래) `CHURN_SIGNAL`(이탈 신호) `LONG_ABSENT`(장기 미방문) `NO_PREDICTION`(예측 없음) | 제안 (FR-PRD-01·04) |
| 처리 표시 | `CONTACTED` `ON_HOLD` `CLOSED` | 제안 (FR-PRD-07) |
| 다음 액션 | `REVISIT` `CHECK_IN` `WIN_BACK`(템플릿 용도와 같은 값) `REQUEST_CONSENT`(다음 방문 시 동의 요청). 액션이 없으면 `null` | 결정 F19 (FR-PRD-06) |
| 템플릿 용도 | `REVISIT`(재방문 안내) `CHECK_IN`(안부·혜택) `WIN_BACK`(재방문 혜택) `CONSENT_RECONFIRM`(동의 재확인) `ETC` | 제안 (FR-CMP-03) |
| 캠페인 메시지 종류 | `AD`(광고) `INFO`(안내) | 제안 (FR-CMP-03) |
| 발송 메시지 종류 | `AD` `UNSUBSCRIBE_NOTICE` `CONSENT_RECONFIRM` | 제안 (5장 campaign_message) |
| 메시지 유형 | `SMS` `LMS` | 제안 (FR-CMP-05) |
| 발송 상태 | `PENDING` `SENT` `FAILED` (대조군 행은 발송하지 않으므로 상태 없음) | 제안 (FR-CMP-10·18) |
| 캠페인 취소 사유 | `USER_CANCELED`(사용자 취소) `DAILY_LIMIT_EXCEEDED`(예약 발송 시각에 일 발송 한도 초과) | 결정 F7 |
| 캠페인 제외 사유 | `UNSUBSCRIBED`(수신 거부) `NO_CONSENT`(미동의·직접 철회) `RESEND_LIMIT`(재발송 제한 기간 안). 고객당 하나, 이 순서로 우선 | 확정 (2026-11-23, FR-CMP-02) |
| 캠페인 상태 | `DRAFT`(작성 중) `SCHEDULED`(예약 발송 대기) `SENDING`(발송 중) `SENT`(발송 완료) `CANCELED`(취소). 상태 전이는 `docs/ARCHITECTURE.md` 「7」 | 결정 F7 |

### 기능 키 (공용/PIN 설정 단위)

명세서 2장 표의 한 행이 기능 키 하나다. 화면과 API가 같은 키를 쓴다.

| 기능 키 (제안) | 명세서 2장 행 | 기본값 | 토글 |
| --- | --- | --- | --- |
| `DASHBOARD_SEARCH` | 대시보드, 기능 검색 | 공용 | 고정 |
| `RESERVATION` | 예약 등록·수정, 결제 등록 | 공용 | 가능 |
| `INSIGHT` | 인사이트 | 공용 | 가능 |
| `CUSTOMER_VIEW` | 고객 조회 (연락처 마스킹) | 공용 | 가능 |
| `CUSTOMER_WRITE` | 고객 신규 등록, 시술 기록·사진, 취향·주의사항, 상담 메모 작성 | 공용 | 가능 |
| `CONSENT` | 동의 받기·철회 | 공용 | 고정 |
| `CONTACT_FULL` | 고객 연락처 전체 보기 | PIN | 가능 |
| `CUSTOMER_EDIT` | 고객 기본 정보 수정·동의 정정, 상담 메모 수정·삭제, 방문 수정·삭제 | PIN | 가능 |
| `SALES_ANALYTICS` | 매출·성과 분석 조회 | PIN | 가능 |
| `PAYMENT_EDIT` | 결제 수정·취소 | PIN | 가능 |
| `CAMPAIGN_VIEW` | 캠페인 목록·결과 조회 | PIN | 가능 |
| `CAMPAIGN_SEND` | 캠페인 작성·검토 체크·발송, 가상 휴대폰 | PIN | 가능 |
| `OWNER_PIN` | 매장 설정·토글, 스탭·PIN 관리, 고객 삭제(파기), 예약 제한 설정·해제와 제한 고객 예약 허용 | 원장 PIN | 고정 |

기본값·토글 열은 명세서 2장을 옮긴 것이다. 다르면 명세서가 맞다. 키 이름에 역할 이름(OWNER/STAFF처럼 폐기된 역할 구조, A3)을 단독으로 쓰지 않는다.

## 4. API 경로와 엔드포인트 [제안]

### 경로 규칙

- 모든 API는 `/api/`로 시작한다. 화면(정적 파일)은 `/api/` 밖에 둔다.
- 자원은 복수형 kebab-case: `/api/customers`, `/api/customers/{customerId}/consents`, `/api/service-menus`.
- 상태를 바꾸는 동작은 하위 경로 `POST`: `/api/reservations/{reservationId}/no-show`, `/api/campaigns/{campaignId}/send`.
- 영역이 섞인 화면은 영역별로 API를 나눈다 (`docs/ARCHITECTURE.md` 「6」). 예: 고객 상세의 수신 이력·결제 금액은 별도 API.

### 엔드포인트

"권한" 열: **비로그인** = 로그인 전에도 됨 · **매장 세션** = 매장 로그인만 있으면 됨 · **근무자** = 현재 근무자가 있으면 누구나 · 그 밖에는 3절 기능 키. 목록 조회는 모두 페이징한다 (1절).

**세션 · 매장 계정 · 스탭 (ACC)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `POST /api/shops` | 매장 가입 (매장 + 원장 스탭 생성) | 비로그인 | FR-ACC-01 |
| `POST /api/session` | 매장 로그인 | 비로그인 | FR-ACC-02 |
| `DELETE /api/session` | 로그아웃 (근무자·PIN 인증도 해제) | 매장 세션 | FR-ACC-02·10 |
| `GET /api/session` | 매장 이름, 현재 근무자, PIN 인증 스탭·만료 시각, 기능별 공용/PIN 설정 | 매장 세션 | FR-ACC-08·10 |
| `PUT /api/session/worker` | 근무자 PIN 입력 · 근무자 전환 | 매장 세션 | FR-ACC-10 |
| `POST /api/session/pin` | 잠긴 기능 PIN 인증 | 근무자 | FR-ACC-08 |
| `DELETE /api/session/pin` | [잠금] | 근무자 | FR-ACC-08 |
| `POST /api/password-reset` · `PUT /api/password-reset` | 재설정 메일 요청 · 새 비밀번호 설정 (P2) | 비로그인 | FR-ACC-06 |
| `PUT /api/owner-pin` | 매장 계정 비밀번호를 다시 확인하고 원장 PIN 재설정 | 매장 세션 | FR-ACC-09 |
| `GET /api/staff` | 활성 스탭 목록 (담당 스탭 선택용) | 근무자 | FR-RSV-01, FR-ACC-04 |
| `GET /api/staff?includeInactive=true` | 스탭 관리 화면용 목록 (비활성 스탭 포함) | `OWNER_PIN` | FR-ACC-04, FR-SET-05 |
| `POST /api/staff` · `PATCH /api/staff/{staffId}` | 스탭 등록 · 이름·"잠긴 기능 사용 허용"·정기 휴무 요일 수정 (정기 휴무 요일 변경으로 밀리는 확정 예약이 있으면 응답에 목록, 자동 취소 없음) | `OWNER_PIN` | FR-ACC-03, FR-SET-07, F12 |
| `PUT /api/staff/{staffId}/pin` | 스탭 PIN 재설정 | `OWNER_PIN` | FR-ACC-03 |
| `POST /api/staff/{staffId}/deactivate` | 비활성화 (남은 예약이 있으면 `conflict` + `details`에 예약 목록) | `OWNER_PIN` | FR-ACC-04 |
| `PUT /api/feature-locks` | 기능별 공용/PIN 설정 변경 | `OWNER_PIN` | FR-ACC-05 |

**고객 (CUS)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/customers` | 목록·검색·필터 (20건) | `CUSTOMER_VIEW` | FR-CUS-02 |
| `POST /api/customers` | 등록 (개인정보 동의 필수, 선택 동의 함께) | `CUSTOMER_WRITE` | FR-CUS-01 |
| `GET /api/customers/{customerId}` | 상세: 기본 정보(마스킹), 주의사항, 노쇼 횟수, 예약 제한, 방문 요약, 취향 | `CUSTOMER_VIEW` | FR-CUS-03·04·05·11 |
| `GET /api/customers/{customerId}/reservations` | 고객의 예약 목록 (고객 상세의 예약 영역, 최신순) | `RESERVATION` | FR-CUS-03 |
| `GET /api/customers/{customerId}/predictions` | 카테고리별 예측 (방문 리듬 타임라인의 예측 기간 포함) | `INSIGHT` | FR-PRD-02·03, FR-CUS-03 |
| `GET /api/customers/{customerId}/contact` | 연락처 전체 | `CONTACT_FULL` | 명세서 2장 |
| `PATCH /api/customers/{customerId}` | 기본 정보 수정 | `CUSTOMER_EDIT` | 명세서 2장 |
| `PUT /api/customers/{customerId}/cautions` | 시술 주의사항 · 건강 주의사항(건강 정보 동의 필요) | `CUSTOMER_WRITE` | FR-CUS-05 |
| `PUT /api/customers/{customerId}/preferences` | 취향 태그 · 자유 메모 | `CUSTOMER_WRITE` | FR-CUS-04 |
| `GET /api/preference-tags?category=` | 매장에서 쓴 취향 태그 목록 (카테고리별, 중복 제거) | `CUSTOMER_VIEW` | FR-CUS-04, F3 |
| `GET /api/customers/{customerId}/history` | 시술 히스토리북 (방문별 시술·담당 스탭·사진 서명 URL·메모, 결제 금액 제외) | `CUSTOMER_VIEW` | FR-CUS-07 |
| `GET` · `POST /api/customers/{customerId}/consult-notes` | 상담 메모 조회 · 작성 | `CUSTOMER_VIEW` · `CUSTOMER_WRITE` | FR-CUS-06 |
| `PATCH` · `DELETE /api/consult-notes/{noteId}` | 상담 메모 수정 · 삭제 | `CUSTOMER_EDIT` | FR-CUS-06, C5 |
| `GET /api/customers/{customerId}/consents` | 동의 현재 상태와 이력 | `CUSTOMER_VIEW` | FR-CUS-09 |
| `POST /api/customers/{customerId}/consents` | 동의 받기 · 철회 (동의 방법, 철회 경로 `UNSUBSCRIBE` 포함) | `CONSENT` | FR-CUS-09, FR-CMP-11 |
| `POST /api/consents/{consentId}/corrections` | 잘못 입력한 동의 정정 | `CUSTOMER_EDIT` | FR-CUS-09, E8 |
| `POST /api/visits/{visitId}/photos` | 시술 사진 업로드 (multipart, 사진 동의 필요) | `CUSTOMER_WRITE` | FR-CUS-08 |
| `GET /api/photos/{photoId}/file?expires=&signature=` | 사진 파일 (서명 URL. 서명·만료와 세션 매장을 확인, 다른 매장이면 404) | 서명 URL | NFR-07, F16 |
| `GET /api/customers/{customerId}/messages` | 수신 이력 · 캠페인 연결 기록 | `CAMPAIGN_VIEW` | FR-CUS-03, FR-ANL-04 |
| `GET /api/customers/{customerId}/payments` | 결제 금액 이력 | `SALES_ANALYTICS` | FR-ANL-04 |
| `GET /api/customers/{customerId}/deletion-preview` · `DELETE /api/customers/{customerId}` | 삭제 전 확인(취소될 예약 건수) · 삭제(파기) | `OWNER_PIN` | FR-CUS-10 |
| `GET /api/customers/retention-expired` | 파기 대상 목록 | `OWNER_PIN` | FR-CUS-12 |
| `POST /api/customers/import` | CSV 일괄 등록 (P2, 동의 확인 체크 필수) | `CUSTOMER_WRITE` | FR-CUS-13 |
| `PUT /api/customers/{customerId}/booking-restriction` | 예약 제한 켜기·끄기와 사유 (P2) | `OWNER_PIN` | FR-CUS-14 |

**예약 · 시술 마감 · 결제 · 방문 (RSV · PAY · VIS)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/reservations?from=&to=` | 기간 예약 (주간 캘린더, 일간 보기). 기간은 최대 7일, 페이징 없음 (7일 초과는 `invalid`) | `RESERVATION` | FR-RSV-02·05 |
| `GET /api/reservations/available-times?staffId=&date=&minutes=` | 예약 가능한 시작 시각 (30분 단위) | `RESERVATION` | FR-RSV-04 |
| `POST /api/reservations` · `PATCH /api/reservations/{reservationId}` | 예약 등록 · 수정 (겹침이면 `reservation_conflict`, 예약 제한 고객이면 `owner_pin_required`) | `RESERVATION` | FR-RSV-01·04, FR-CUS-14 |
| `GET /api/reservations/{reservationId}` | 예약 상세 (주의사항 포함) | `RESERVATION` | FR-CUS-05, FR-DSH-01 |
| `PUT /api/reservations/{reservationId}/customer` | 고객 없는 예약에 고객 연결 | `RESERVATION` | FR-DSH-01, FR-VIS-04 |
| `POST /api/reservations/{reservationId}/cancel` · `/no-show` | 취소 · 노쇼 (노쇼는 시작 시각 뒤에만) | `RESERVATION` | FR-RSV-03 |
| `POST /api/reservations/{reservationId}/complete` | 결제 없이 완료 처리 (실제 시술 확인, 고객 없는 예약은 불가) | `RESERVATION` | FR-VIS-01 |
| `GET` · `POST /api/reservations/{reservationId}/closing` | 시술 마감 카드 채울 값 · 저장 (결제·방문·방문 메모·예약 완료 한 트랜잭션. 동의는 `consents`, 사진은 `photos` API로 따로) | `RESERVATION` | FR-PAY-01·04, FR-VIS-01·05, F1·F9 |
| `PATCH /api/payments/{paymentId}` · `POST /api/payments/{paymentId}/cancel` | 결제 수정 · 취소 (취소해도 방문은 유지) | `PAYMENT_EDIT` | FR-PAY-02, F8 |
| `PATCH` · `DELETE /api/visits/{visitId}` | 방문의 실제 시술·주기 계산 제외 수정 · 방문 삭제 = 마감 되돌리기 (연결된 예약 모두 확정으로, 결제 취소 표시, 시술·사진·메모 삭제, 예측 재계산. 취소할 결제가 있으면 `PAYMENT_EDIT`도 검사. 고객 없는 방문은 `conflict`) | `CUSTOMER_EDIT` | FR-VIS-03·05, F8 |

**예측 · 인사이트 (PRD)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/insights?status=&category=` | 상태별 고객 × 카테고리 행, 추천 액션(`nextAction`, 3장 「다음 액션」), 우선순위 정렬 | `INSIGHT` | FR-PRD-04·05·06·09 |
| `PUT /api/customers/{customerId}/predictions/{category}/handling` | 처리 표시 (연락함 / 보류 / 관리 종료, P2) | `INSIGHT` | FR-PRD-07 |

**캠페인 · 발송 · 가상 휴대폰 (CMP)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/message-templates` | 템플릿 목록 | `CAMPAIGN_VIEW` | FR-CMP-03 |
| `POST /api/message-templates` · `PATCH` · `DELETE /api/message-templates/{templateId}` | 템플릿 작성 · 수정 · 삭제 | `CAMPAIGN_SEND` | FR-CMP-03 |
| `POST /api/campaigns/targets` | 대상 미리 계산 (카테고리, 조건 또는 인사이트에서 고른 행 → `targetCount`: 제외 후 발송 대상 고객 수(대조군 분리 전), `excludedCounts`: 3장 「캠페인 제외 사유」 값마다 건수(0건 포함)) | `CAMPAIGN_SEND` | FR-CMP-01·02 |
| `POST /api/campaigns` | 캠페인 만들기 (카테고리, 대상, 템플릿, 대조군 비율) | `CAMPAIGN_SEND` | FR-CMP-01·18 |
| `GET /api/campaigns` · `GET /api/campaigns/{campaignId}` | 캠페인 목록 · 상세(고객별 발송 결과, 취소 사유) | `CAMPAIGN_VIEW` | FR-CMP-10 |
| `GET /api/campaigns/{campaignId}/preview` | 고객별 치환 결과, 바이트 수, SMS/LMS, 발송·대조군 인원, 예상 비용 | `CAMPAIGN_SEND` | FR-CMP-05·18 |
| `POST /api/campaigns/{campaignId}/review` | 검토 체크 (검토자·시각 기록) | `CAMPAIGN_SEND` | FR-CMP-06 |
| `POST /api/campaigns/{campaignId}/send` | 즉시 발송 | `CAMPAIGN_SEND` | FR-CMP-07·08·12 |
| `PUT /api/campaigns/{campaignId}/schedule` | 예약 발송 시각 지정 | `CAMPAIGN_SEND` | FR-CMP-09 |
| `POST /api/campaigns/{campaignId}/cancel` | 작성 중·예약 발송 대기 캠페인 취소 (`USER_CANCELED`) | `CAMPAIGN_SEND` | F7 |
| `GET /api/consent-reconfirm-targets` | 동의 재확인 대상 (2년 되기 30일 전부터) | `CAMPAIGN_VIEW` | FR-CMP-13 |
| `GET /api/virtual-phone/messages?phone=` | 가상 수신함 (최신순) | `CAMPAIGN_SEND` | FR-CMP-16 |
| `POST /api/virtual-phone/unsubscribe` | 가상 휴대폰의 [수신거부] | `CAMPAIGN_SEND` | FR-CMP-11·16 |

**성과 · 대시보드 · 검색 (ANL · DSH · SCH)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/campaigns/{campaignId}/funnel` | 발송 → 도달 → 재예약 → 재방문 | `CAMPAIGN_VIEW` | FR-ANL-01·03 |
| `GET /api/campaigns/{campaignId}/control-comparison` | 발송군 vs 대조군 재방문율·재예약률 | `CAMPAIGN_VIEW` | FR-ANL-09 |
| `GET /api/campaigns/{campaignId}/revenue` | 연결 매출 | `SALES_ANALYTICS` | FR-ANL-02 |
| `GET /api/analytics/summary?period=` | 매출, 방문 수, 신규 고객 수, 주기 내 재방문율 | `SALES_ANALYTICS` | FR-ANL-05·06 |
| `GET /api/analytics/prediction-accuracy?period=` | 적중률, 평균 오차 | `SALES_ANALYTICS` | FR-ANL-07 |
| `GET /api/dashboard/today` | 오늘 예약, 마감 안 된 예약, 이번 주 요일별 건수 | `DASHBOARD_SEARCH` | FR-DSH-01·03·05 |
| `GET /api/dashboard/care-targets` | 오늘 관리할 고객 상위 10행 | `INSIGHT` | FR-DSH-02 |
| `GET /api/dashboard/recent-campaigns` | 최근 3개 캠페인 재예약 전환율 (P2) | `CAMPAIGN_VIEW` | FR-DSH-04 |
| `GET /api/dashboard/booking-channels?period=` | 예약 경로 비율 (P2) | `DASHBOARD_SEARCH` | FR-DSH-06 |
| `GET /api/search/customers?q=` | 상단 검색창의 고객 결과 | `CUSTOMER_VIEW` | FR-SCH-04 |
| `POST /api/search/misses` | 결과 없는 검색어 저장 (P2) | `DASHBOARD_SEARCH` | FR-SCH-06 |

기능 키워드 사전은 정적 파일이라 API가 없다 (FR-SCH-02, `docs/ARCHITECTURE.md` 「4」).

**매장 설정 (SET)**

| 메서드 · 경로 | 하는 일 | 권한 | 요구사항 |
| --- | --- | --- | --- |
| `GET /api/shop` | 매장 이름, 영업시간, 정기 휴무 (예약 화면에서도 씀) | 근무자 | FR-SET-01 |
| `PUT /api/shop` | 매장 정보·요일별 영업시간·발신번호·수신 거부 번호 (밀리는 예약이 있으면 응답에 목록) | `OWNER_PIN` | FR-SET-01·07 |
| `GET /api/service-menus` | 시술 메뉴 (예약 화면에서도 씀) | 근무자 | FR-SET-02 |
| `POST /api/service-menus` · `PATCH /api/service-menus/{menuId}` | 메뉴 추가 · 수정 (주기·예측 속성을 바꾸면 예측 재계산) | `OWNER_PIN` | FR-SET-02, FR-VIS-05 |
| `GET` · `PUT /api/category-cycles` | 카테고리 기본 주기 조회 · 수정 | `OWNER_PIN` | FR-SET-02 |
| `GET /api/day-offs?from=&to=` | 매장·스탭 휴무일 (캘린더에서도 씀) | 근무자 | FR-SET-07 |
| `POST /api/day-offs` · `DELETE /api/day-offs/{dayOffId}` | 휴무일 등록 (겹치는 예약이 있으면 응답에 목록) · 삭제 | `OWNER_PIN` | FR-SET-07 |
| `GET` · `PUT /api/settings` | 이탈 신호 기간 상한, 귀속 기간, 일 발송 한도, 재발송 제한 기간, 가상 발송 실패 비율, 보관 기간 | `OWNER_PIN` | FR-SET-03·04·06 |

## 5. 계약 변경 절차

1. **요구사항이 바뀌는 변경**은 결정체크리스트에서 결정한 뒤 명세서 → 이 문서 순으로 반영한다. 이 문서에서 먼저 바꾸지 않는다.
2. **문서가 먼저, 코드가 나중**이다. 호환을 깨는 변경(필드 이름·타입·필수 여부, enum 값 삭제, 경로, 오류 code·HTTP 상태)은 이 문서를 먼저 고쳐 커밋하고, 그 커밋을 팀에 공유한 뒤 코드를 바꾼다. 코드에서 이 문서에 없는 계약을 먼저 만들지 않는다.
3. **`[제안]`을 `[확정]`으로 바꾸는 것**은 팀 합의 뒤에만 하고, 날짜와 근거를 함께 적는다.
4. 계약을 바꾼 커밋 메시지에는 바꾼 절을 적는다 (예: `CONTRACTS 2: add pin_locked`).
5. 개발 저장소를 만들 때 이 문서를 그쪽으로 옮길지 정한다 [검토 필요]. 옮기면 그 뒤로는 개발 저장소가 기준이고, 여기에는 링크만 남긴다. 같은 계약을 두 곳에서 관리하지 않는다.

## 6. 요청 · 응답 필드 [제안]

4절 엔드포인트의 요청 · 응답 필드다. 구현을 시작하는 영역부터 이 절에 더한다 (머리말, 5절 절차). 형식(camelCase, 날짜 · 시각, 페이지)과 오류 모양은 2 · 3절을 따른다.

### 세션 · 매장 계정 · 스탭 (ACC)

**`POST /api/shops`** 매장 가입 (FR-ACC-01). 비로그인. 성공하면 `201`이고 로그인은 되지 않는다 (로그인은 `POST /api/session`).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `email` | string | 예 | 이메일 형식, 255자 이하. 전역 고유, 이미 있으면 `duplicate` 409 (F11) |
| `password` | string | 예 | 8~64자. 명세서에 규칙이 없어 정한 제안값 |
| `shopName` | string | 예 | 1~100자 |
| `ownerName` | string | 예 | 원장 스탭 이름, 1~50자 |
| `ownerPin` | string | 예 | 숫자 4~6자리 (FR-ACC-03) |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `shopId` | number | 만든 매장 ID |

규칙을 어기면 `invalid` 400이고 `details`에 칸별 사유가 들어간다: `[{ "field": "ownerPin", "reason": "PIN은 숫자 4~6자리입니다" }]`.

**`POST /api/session`** 매장 로그인 (FR-ACC-02). 비로그인. 성공하면 `200`이고 세션을 새로 발급한다 (세션 고정 방지). 로그인 직후에는 근무자가 없어 근무자 PIN 입력(`PUT /api/session/worker`)만 할 수 있다 (FR-ACC-10).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `email` | string | 예 | 비어 있지 않음 |
| `password` | string | 예 | 비어 있지 않음 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `shopId` | number | 로그인한 매장 ID |
| `shopName` | string | 매장 이름 |

- 이메일이 없거나 비밀번호가 틀리면 둘을 구분하지 않고 `login_failed` 401
- 5회 연속 실패하면 15분 동안 `login_locked` 429. 잠금 중에는 맞는 비밀번호도 거부한다 (C1). 원장 PIN 재설정의 비밀번호 확인 실패도 같은 횟수에 넣는다 (F11 · F14). 성공하면 횟수를 0으로 되돌린다

**`GET /api/session`** 세션 조회 (FR-ACC-08 · 10). 매장 세션이면 근무자가 없어도 된다. 조회는 PIN 인증 만료 시각을 연장하지 않는다 (연장은 잠긴 기능을 쓸 때, `docs/ARCHITECTURE.md` 「6」).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `shopId` | number | 매장 ID |
| `shopName` | string | 매장 이름 |
| `currentStaff` | object \| null | 현재 근무자 `{ "id", "name" }`. 없으면 null (화면 상단 표시, FR-ACC-10) |
| `pinStaff` | object \| null | PIN 인증 스탭 `{ "id", "name" }`. 인증이 없거나 만료되면 null (FR-ACC-08) |
| `pinExpiresAt` | string \| null | PIN 인증 만료 시각. `pinStaff`가 null이면 null |
| `features` | object | 기능 키(3절) → `PUBLIC` · `PIN` · `OWNER_PIN`. 13개 키가 모두 들어간다. 고정 항목도 같은 값으로 들어간다 |

**`DELETE /api/session`** 로그아웃 (FR-ACC-02 · 10). 매장 세션. 성공하면 `204`이고 세션이 사라져 근무자 · PIN 인증도 함께 해제된다.
