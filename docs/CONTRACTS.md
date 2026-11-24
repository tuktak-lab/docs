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
| 목록 API는 페이징한다. 고객 목록은 20건. 기간 조회는 기간을 최대 7일로 제한하고 페이징하지 않는다. 스탭 · 시술 메뉴 목록은 페이징하지 않고, 휴무일 조회는 최대 31일로 제한하고 페이징하지 않는다 | NFR-01, FR-CUS-02, C13, F13, F22 |
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
| 시:분 | `HH:mm` 24시간 (`09:30`). 영업시간처럼 날짜 없는 시각 (F20) |
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
| 성별 | `FEMALE` `MALE` `OTHER` | 제안 (FR-CUS-01) |
| 선호 언어 | `KO` `EN` `ZH` `JA` `ETC` | 제안 (FR-I18N-01) |
| 결제 수단 | `CARD` `CASH` `TRANSFER` `ETC` | 제안 (C9) |
| 방문 출처 | `NORMAL` `IMPORT` | 제안 |
| 고객 상태 | `ACTIVE` `DELETED` | 제안 (C12) |
| 스탭 상태 | `ACTIVE` `INACTIVE` | 제안 (FR-ACC-04) |
| 요일 | `MONDAY` `TUESDAY` `WEDNESDAY` `THURSDAY` `FRIDAY` `SATURDAY` `SUNDAY` (영업시간, 스탭 정기 휴무 요일) | 결정 F20 |
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

**`PUT /api/session/worker`** 근무자 PIN 입력 · 근무자 전환 (FR-ACC-10). 매장 세션. 교대할 때도 같은 API에 다른 PIN을 넣는다. 잠긴 기능 PIN 인증(`POST /api/session/pin`)은 바꾸지 않는다 (D6).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `pin` | string | 예 | 숫자 4~6자리 (C21). 형식이 틀리면 `invalid` 400이고 실패 횟수에 넣지 않는다 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 현재 근무자가 된 스탭 ID |
| `name` | string | 스탭 이름 |

- 맞는 활성 스탭이 없으면(틀린 PIN, 비활성 스탭) `pin_invalid` 400
- 매장 단위로 5회 연속 실패하면 5분 동안 `pin_locked` 429. 잠긴 기능 PIN 인증과 실패 횟수를 같이 센다 (C22). 성공하면 0으로 되돌린다

**`POST /api/session/pin`** 잠긴 기능 PIN 인증 (FR-ACC-08). 근무자. "잠긴 기능 사용 허용" 스탭의 PIN만 통과하고, 현재 근무자가 아니어도 된다 (D6). 원장 스탭은 항상 허용이다 (FR-ACC-01).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `pin` | string | 예 | 숫자 4~6자리 (C21). 형식이 틀리면 `invalid` 400이고 실패 횟수에 넣지 않는다 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | PIN 인증 스탭 ID |
| `name` | string | 스탭 이름 (화면 상단 표시, FR-ACC-08) |
| `expiresAt` | string | 인증 만료 시각. 5분 동안 잠긴 기능을 쓰지 않으면 풀리고, 쓸 때마다 5분 연장된다 (C23) |

- 틀린 PIN, "잠긴 기능 사용 허용"이 꺼진 스탭, 비활성 스탭은 모두 `pin_invalid` 400
- 실패 차단은 근무자 PIN과 같은 매장 단위 횟수다: 5회 연속 실패하면 5분 동안 `pin_locked` 429 (C22)
- 다른 스탭이 인증하면 그 스탭으로 바뀐다

**`DELETE /api/session/pin`** [잠금] (FR-ACC-08). 근무자. 성공하면 `204`이고 PIN 인증만 해제된다. 현재 근무자는 그대로다.

**`GET /api/staff`** 활성 스탭 목록 (FR-RSV-01, FR-ACC-04). 근무자. 담당 스탭 선택용이라 비활성 스탭은 빠진다. 페이징 없음 (F22).

| 응답 필드 (배열의 원소) | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 스탭 ID |
| `name` | string | 이름 |

- 정렬: 원장 먼저, 그다음 등록 순(ID)

**`GET /api/staff?includeInactive=true`** 스탭 관리 화면용 목록 (FR-ACC-04, FR-SET-05). `OWNER_PIN`. 비활성 스탭도 넣는다. 위 필드에 아래를 더한다. PIN 해시는 어느 응답에도 넣지 않는다.

| 응답 필드 (추가) | 타입 | 설명 |
| --- | --- | --- |
| `owner` | boolean | 원장 여부 (FR-ACC-01) |
| `lockedFeatureAllowed` | boolean | "잠긴 기능 사용 허용" (FR-ACC-03). 원장은 항상 true |
| `regularDaysOff` | string[] | 정기 휴무 요일(3절 「요일」), `MONDAY`부터 순서. 없으면 빈 배열 (FR-SET-07, F20) |
| `status` | string | `ACTIVE` 또는 `INACTIVE` (FR-ACC-04) |

- 정렬: 활성 스탭 먼저, 그 안에서 원장 먼저, 그다음 등록 순(ID)

**`POST /api/staff`** 스탭 등록 (FR-ACC-03). `OWNER_PIN`. 성공하면 `201`과 `{ "id": number }`. 개인 계정 · 초대 링크는 없다 (C2 제외). 원장 스탭은 가입 때만 생긴다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` | string | 예 | 1~50자 |
| `pin` | string | 예 | 숫자 4~6자리 (C21). 같은 매장 스탭(비활성 포함)의 PIN과 같으면 `duplicate` 409 (명세서 5장 staff) |
| `lockedFeatureAllowed` | boolean | 아니요 | "잠긴 기능 사용 허용". 기본 false (FR-ACC-03) |
| `regularDaysOff` | string[] | 아니요 | 정기 휴무 요일(3절 「요일」), 중복 없이. 기본 빈 배열 (FR-SET-07) |

- 규칙을 어기면 `invalid` 400이고 `details`에 칸별 사유

**`PATCH /api/staff/{staffId}`** 스탭 수정 (FR-ACC-03, FR-SET-07). `OWNER_PIN`. 보낸 칸만 바꾼다. PIN은 `PUT /api/staff/{staffId}/pin`으로 바꾼다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` | string | 아니요 | 1~50자 |
| `lockedFeatureAllowed` | boolean | 아니요 | 원장 스탭에 false면 `invalid` 400 (FR-ACC-01) |
| `regularDaysOff` | string[] | 아니요 | 정기 휴무 요일 전체(3절 「요일」), 중복 없이. 빈 배열이면 정기 휴무 없음 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `pushedReservations` | object[] | 바꾼 뒤 정기 휴무 요일에 걸리는 이 스탭의 확정 예약(지금 이후), 시작 시각순. `{ "id": number, "startAt": string, "customerName": string \| null }`. 자동 취소하지 않는다 (F12). 없으면 빈 배열 |

- 다른 매장 · 없는 스탭이면 `not_found` 404

**`PUT /api/staff/{staffId}/pin`** 스탭 PIN 재설정 (FR-ACC-03). `OWNER_PIN`. 성공하면 `204`. 원장이 직원 스탭의 PIN을 새로 정한다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `pin` | string | 예 | 숫자 4~6자리 (C21). 같은 매장 다른 스탭(비활성 포함)의 PIN과 같으면 `duplicate` 409. 그 스탭의 지금 PIN과 같은 것은 허용 |

- 원장 스탭이면 `invalid` 400. 원장 PIN은 매장 계정 비밀번호를 다시 확인하는 `PUT /api/owner-pin`(FR-ACC-09, F11)으로만 바꾼다
- 다른 매장 · 없는 스탭이면 `not_found` 404
- 그 스탭의 현재 근무자 · PIN 인증 세션은 그대로 둔다 (다음 PIN 입력부터 새 PIN)

**`POST /api/staff/{staffId}/deactivate`** 스탭 비활성화 (FR-ACC-04). `OWNER_PIN`. 본문 없음, 성공하면 `204`. 작성한 기록 · 메모는 그대로 남는다.

- 그 스탭의 확정 예약이 있으면 `conflict` 409이고 비활성화하지 않는다. 지금 이후 예약과 마감 안 된 지난 예약(FR-DSH-05, E4)을 모두 보며, 고객 없는 예약도 포함한다 (E3, F34). `details`는 그 예약 목록, 시작 시각순 `[{ "id": number, "startAt": string, "customerName": string | null }]` (`pushedReservations`와 같은 모양). 다른 스탭으로 옮기거나(`PATCH /api/reservations/{reservationId}`) 마감 · 취소한 뒤 다시 부른다
- 원장 스탭이면 `invalid` 400 (FR-ACC-01). 이미 비활성이면 바꾸지 않고 `204`
- 다른 매장 · 없는 스탭이면 `not_found` 404
- 비활성 스탭은 근무자 전환 · PIN 인증을 할 수 없고 `GET /api/staff`(담당 스탭 선택)에서 빠진다. 지금 어느 세션의 현재 근무자이면 다음 요청부터 `worker_required` 403, PIN 인증 스탭이면 `pin_required` 403(원장 PIN 기능은 `owner_pin_required`) (F34)

**`PUT /api/feature-locks`** 기능별 공용/PIN 설정 변경 (FR-ACC-05, A3). `OWNER_PIN`. 성공하면 `204`. 바꾼 값은 다음 요청부터 바로 권한 검사에 쓰인다 (1절). 지금 값은 `GET /api/session`의 `features`로 본다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `features` | object | 예 | 기능 키(3절) → `PUBLIC` 또는 `PIN`. **보낸 키만 바꾼다** (F38). `GET /api/session`의 `features`를 고쳐 통째로 보내도 된다 |

- 고정 키(`DASHBOARD_SEARCH` · `CONSENT` · `OWNER_PIN`)는 3절의 고정 값과 같으면 그대로 두고, 다르면 `invalid` 400 (E8, F38)
- 모르는 키, 토글 가능한 키에 `PUBLIC` · `PIN` 외의 값(`OWNER_PIN` 포함), 빈 `features`면 `invalid` 400

### 고객 (CUS)

**`POST /api/customers`** 고객 등록 (FR-CUS-01). `CUSTOMER_WRITE`. 성공하면 `201`. 처리 스탭은 현재 근무자다 (FR-ACC-10).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` | string | 예 | 1~50자 |
| `phone` | string | 예 | `010`으로 시작하는 11자리, 하이픈은 있어도 없어도 된다. `010-0000-0000` 형태로 저장한다. 같은 매장에 있으면 `duplicate` 409 |
| `consents` | string[] | 예 | 동의한 항목(3절 「동의 항목」). `PRIVACY`가 없으면 `invalid` 400 (E3). 동의하지 않은 항목은 넣지 않는다 |
| `consentMethod` | string | 예 | `TABLET` · `PAPER` · `VERBAL`. 등록 때 받은 동의 모두에 쓴다 (`IMPORT`는 CSV 전용) |
| `gender` | string | 아니오 | 3절 「성별」 |
| `birthYear` | number | 아니오 | 1900 ~ 올해 |
| `preferredLanguage` | string | 아니오 | 3절 「선호 언어」 |
| `acquisitionChannel` | string | 아니오 | 3절 「유입 경로」 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `customerId` | number | 만든 고객 ID |

- `consents`의 항목마다 동의 이력 행(동의함, 동의 방법, 처리 스탭)을 만든다. 동의하지 않은 항목은 행을 만들지 않으므로 "동의를 받은 적 없음"이 된다 (F19)
- 같은 번호의 삭제된 고객은 번호가 비어 있어 중복으로 보지 않고, 예전 기록과 연결하지 않은 새 고객이 된다 (C12 보완)

**`GET /api/customers`** 고객 목록 · 검색 · 필터 (FR-CUS-02). `CUSTOMER_VIEW`. 삭제된 고객은 나오지 않는다 (FR-CUS-10). 정렬은 최근 등록순.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `q` | string | 아니오 | 숫자 4자리면 휴대폰 뒷자리 일치, 그 밖에는 이름에 포함 |
| `visitCountMin` · `visitCountMax` | number | 아니오 | 총 방문 횟수 범위(가져온 방문 · 주기 계산 제외 방문 포함, FR-CUS-11과 같은 기준). 0 이상, 최소 ≤ 최대 |
| `category` | string | 아니오 | 3절 「시술 카테고리」. 그 카테고리 시술을 받은 적 있는 고객 |
| `predictionStatus` | string | 아니오 | 3절 「예측 상태」. 오늘 기준으로 그 상태인 카테고리가 하나라도 있는 고객. `category`와 함께 주면 그 카테고리의 상태 (FR-PRD-04) |
| `staffId` | number | 아니오 | 가장 최근 방문의 시술 담당 스탭 중 한 명이라도 이 스탭인 고객 |
| `marketingConsent` | boolean | 아니오 | 마케팅 동의 현재 상태(최신 행). `false`는 미동의 · 철회 · 받은 적 없음 |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `customerId` | number | 고객 ID |
| `name` | string | 이름 |
| `phone` | string | 마스킹한 휴대폰 `010-****-1234` (NFR-04, A4). 전체 번호는 `GET /api/customers/{customerId}/contact` |
| `visitCount` | number | 총 방문 횟수 |
| `lastVisitDate` | string \| null | 마지막 방문일. 방문이 없으면 null |
| `marketingConsent` | boolean | 마케팅 동의 현재 상태 |

- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400

**`GET /api/customers/{customerId}`** 고객 상세 (FR-CUS-03 · 04 · 05 · 11). `CUSTOMER_VIEW`. 다른 매장 · 삭제된 고객이면 `not_found` 404. 예약 · 예측 · 히스토리 · 상담 메모 · 동의 · 수신 이력 · 결제 · 연락처 전체는 기능 키가 달라 4절의 각 API로 따로 읽는다 (명세서 2장).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `customerId` | number | 고객 ID |
| `name` | string | 이름 |
| `phone` | string | 마스킹한 휴대폰 `010-****-1234` (NFR-04, A4). 전체 번호는 `GET /api/customers/{customerId}/contact` |
| `gender` · `birthYear` · `preferredLanguage` · `acquisitionChannel` | string · number · string · string | 등록 때 받은 선택 항목. 없으면 null (`POST /api/customers` 요청 필드) |
| `registeredAt` | string | 등록 일시 |
| `serviceCaution` | string \| null | 시술 주의사항 (FR-CUS-05). 없으면 null |
| `healthCaution` | string \| null | 건강 주의사항 (FR-CUS-05, D7). 없으면 null |
| `noShowCount` | number | 노쇼 예약 수 (C8). 1 이상이면 화면 상단에 표시 |
| `bookingRestricted` | boolean | 예약 제한 여부 (FR-CUS-14, P2) |
| `bookingRestrictionReason` | string \| null | 예약 제한 사유. 제한이 아니면 null |
| `preferenceTags` | object[] | 취향 태그 `{ "category", "tag" }` (FR-CUS-04). 카테고리 · 태그 이름 순. 없으면 빈 배열 |
| `preferenceMemo` | string \| null | 취향 자유 메모 (FR-CUS-04). 없으면 null |
| `visitSummary` | object | 방문 요약 (FR-CUS-11). 아래 표 |

| `visitSummary` 필드 | 타입 | 설명 |
| --- | --- | --- |
| `visitCount` | number | 총 방문 횟수. 주기 계산 제외 방문 · 가져온 방문 포함 (C6, E5) |
| `serviceCount` | number | 총 시술 건수. 한 방문의 시술 항목을 각각 센다 (C6) |
| `firstVisitDate` · `lastVisitDate` | string \| null | 첫 · 마지막 방문일. 방문이 없으면 null |
| `categories` | object[] | 시술 카테고리별 `{ "category", "visitCount", "averageIntervalDays" }`, 3절 「시술 카테고리」 순. 방문한 카테고리만 |
| `menus` | object[] | 시술 메뉴별 `{ "serviceMenuId", "name", "category", "count" }`, 횟수가 많은 순. 한 방문에 여러 메뉴면 메뉴마다 센다 |

- 카테고리 `visitCount`는 그 카테고리 시술이 있는 방문 수다 (주기 계산 제외 방문 포함)
- `averageIntervalDays`는 예측(`customer_prediction`)의 평균 간격과 같은 값이다: 주기 계산 제외 방문을 뺀 최근 5개 간격 평균(반올림, FR-PRD-01). 그 근거 방문이 3회 미만이면 null이고 화면은 "—"로 표시한다
- 메뉴 없는 가져온 방문(A13)은 카테고리마다 `serviceMenuId` · `name`이 null인 행 하나로 모으고, 화면은 "메뉴 미상"으로 표시한다
- 단골 · 세그먼트 같은 라벨은 두지 않는다 (C15)
- 조회는 그 고객의 개인정보 조회로 접근 로그에 남긴다 (NFR-06)

**`GET /api/customers/{customerId}/reservations`** 고객의 예약 목록 (FR-CUS-03). `RESERVATION`. 고객 상세 화면이 공용이어도 이 영역은 "예약 등록 · 수정" 설정을 따른다 (명세서 2장). 상태와 관계없이 모두 넣고, 시작 시각이 늦은 순(같으면 ID가 큰 순)이다.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

응답은 3절 페이지 응답이고, 항목 필드는 `GET /api/reservations`의 「예약 필드」와 같다 (`id` · `status` · `startAt` · `minutes` · `staff` · `consultFirst` · `channel` · `customer` · `services`).

- 다른 매장 · 없는 · 삭제된 고객이면 `not_found` 404
- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400

**`GET /api/customers/{customerId}/predictions`** 카테고리별 예측 (FR-PRD-02 · 03 · 04, FR-CUS-03). `INSIGHT`. 고객 상세 화면이 공용이어도 이 영역은 "인사이트" 설정을 따른다 (A3 보완). 다른 매장 · 삭제된 고객이면 `not_found` 404 (삭제하면 예측도 지운다, FR-CUS-10).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `predictions` | object[] | 그 고객이 받은 적 있는 시술 카테고리마다 한 행, 3절 「시술 카테고리」 순서. 방문이 없으면 빈 배열 |

| `predictions` 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `category` | string | 3절 「시술 카테고리」 |
| `status` | string \| null | 오늘(Asia/Seoul) 기준 3절 「예측 상태」. 다음 예약(오늘 이후 확정 예약, 아직 완료되지 않은 오늘 예약 포함)에 이 카테고리 시술이 있으면 관리 대상이 아니라 null (FR-PRD-04) |
| `lastServiceDate` | string \| null | 이 카테고리 마지막 시술일 (주기 계산 제외 방문은 뺌). 예측 없음이면 null |
| `startDate` · `endDate` | string \| null | 예측 기간 (방문 리듬 타임라인의 예측 기간, FR-CUS-03). 예측 없음이면 null. 종료 신호면 둘 다 종료 신호 방문일 |
| `averageIntervalDays` | number \| null | 평균 간격(최근 5개 간격 평균). `defaultCycleBased`가 true면 시술 기본 주기 최대값. 예측 없음이면 null |
| `basisVisitCount` | number | 근거 방문 수 "방문 n회" (주기 계산 제외 방문은 세지 않음) |
| `defaultCycleBased` | boolean | 근거 방문이 1~2회라 "시술 평균 주기 기준"으로 표시할지 (FR-PRD-03) |
| `endSignal` | boolean | 종료 신호 예측인지 (FR-PRD-01 ②) |

- 모든 방문이 주기 계산 제외인 카테고리도 행이 있고 `status`는 `NO_PREDICTION`, 예측 칸은 null, `basisVisitCount`는 0이다 (FR-PRD-01 ①)

**`GET /api/customers/{customerId}/contact`** 연락처 전체 (명세서 2장 「고객 연락처 전체 보기」, A4). `CONTACT_FULL` (기본 PIN, 토글 가능). 다른 응답은 모두 마스킹한 번호를 주고, 전체 번호는 이 API로만 준다 (NFR-04).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `phone` | string | 전체 휴대폰 번호 `010-0000-0000` |

- PIN으로 잠겨 있는데 PIN 인증이 없거나 만료됐으면 `pin_required` 403이고 번호를 주지 않는다. 공용으로 바꾸면 바로 PIN 없이 된다 (FR-ACC-05)
- 다른 매장 · 삭제된 고객이면 `not_found` 404
- 조회는 접근 로그에 남긴다. 잠긴 상태면 PIN 인증 스탭, 공용이면 현재 근무자로 기록한다 (NFR-06, ARCHITECTURE 6장 「기록에 남는 사람」)

**`PATCH /api/customers/{customerId}`** 고객 기본 정보 수정 (명세서 2장 「고객 기본 정보 수정」). `CUSTOMER_EDIT` (기본 PIN, 토글 가능). 성공하면 `204`. `POST /api/customers`의 기본 정보 칸을 통째로 보내고, 빠진 선택 칸은 비운다. 주의사항 · 취향 · 동의 · 예약 제한은 이 API로 바꾸지 않는다 (각 API).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` · `phone` · `gender` · `birthYear` · `preferredLanguage` · `acquisitionChannel` | | | `POST /api/customers`와 같다. `phone`이 매장 안 다른 고객과 같으면 `duplicate` 409 (자기 번호는 그대로 둬도 된다) |

- 다른 매장 · 삭제된 고객이면 `not_found` 404
- 수정은 접근 로그에 남긴다. 잠긴 상태면 PIN 인증 스탭, 공용이면 현재 근무자로 기록한다 (NFR-06, ARCHITECTURE 6장 「기록에 남는 사람」)

**`PUT /api/customers/{customerId}/cautions`** 시술 · 건강 주의사항 (FR-CUS-05, D7). `CUSTOMER_WRITE`. 성공하면 `204`. 두 칸을 통째로 보내고, null · 빈 문자열 · 공백만이면 그 칸을 지운다. 앞뒤 공백은 뺀다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `serviceCaution` | string \| null | 아니오 | 시술 주의사항. 1,000자 이하 |
| `healthCaution` | string \| null | 아니오 | 건강 주의사항. 1,000자 이하. 건강 정보 동의(`HEALTH`)의 현재 상태가 동의일 때만 넣을 수 있다 |

- 건강 정보 동의를 받은 적 없거나 철회한 고객에 `healthCaution` 값을 보내면 `consent_required` 409이고 두 칸 모두 바뀌지 않는다. 지우기(null)는 동의 없이도 된다
- 다른 매장 · 삭제된 고객이면 `not_found` 404, 1,000자를 넘으면 `invalid` 400
- 수정은 접근 로그에 남긴다 (NFR-06)

**`PUT /api/customers/{customerId}/preferences`** 취향 태그 · 자유 메모 (FR-CUS-04). `CUSTOMER_WRITE`. 성공하면 `204`. 태그 목록과 메모를 통째로 보낸다 (빈 목록이면 태그를 모두 지운다).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `tags` | object[] | 예 | `{ "category", "tag" }`, 50개까지. 고객 상세 `preferenceTags`와 같은 모양 |
| `tags[].category` | string | 예 | 3절 「시술 카테고리」 |
| `tags[].tag` | string | 예 | 앞뒤 공백을 뺀 1~50자. 같은 카테고리에 대소문자만 다른 태그가 여럿이면 처음 것만 남긴다 |
| `memo` | string \| null | 아니오 | 취향 자유 메모, 1,000자 이하. null · 빈 문자열 · 공백만이면 지운다 |

- 다른 매장 · 삭제된 고객이면 `not_found` 404, 칸 규칙을 어기면 `invalid` 400

**`GET /api/preference-tags?category=`** 매장에서 쓴 취향 태그 (FR-CUS-04, F3). `CUSTOMER_VIEW`. 세션 매장 고객들의 태그를 그 카테고리 안에서 중복 없이 이름 순으로 준다. 페이징 없음.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `category` | string | 예 | 3절 「시술 카테고리」. 없거나 값이 아니면 `invalid` 400 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `tags` | string[] | 태그 이름. 없으면 빈 배열 |

**`POST /api/customers/{customerId}/consult-notes`** 상담 메모 작성 (FR-CUS-06). `CUSTOMER_WRITE`. 성공하면 `201`. 작성 스탭은 현재 근무자, 작성 시각은 서버 시각이다 (FR-ACC-10, D6).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `content` | string | 예 | 1~2,000자. 공백만이면 `invalid` 400 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `noteId` | number | 만든 메모 ID (수정 · 삭제 `PATCH` · `DELETE /api/consult-notes/{noteId}`의 대상) |

**`GET /api/customers/{customerId}/consult-notes`** 상담 메모 목록 (FR-CUS-06). `CUSTOMER_VIEW`. 최신 작성순(같으면 ID가 큰 순).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

응답은 3절 페이지 응답이다.

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `noteId` | number | 메모 ID |
| `content` | string | 내용 |
| `staff` | object | 작성 스탭 `{ "id", "name" }`. 비활성 스탭도 그대로 보여준다 |
| `writtenAt` | string | 작성 일시 |

- 두 API 모두 다른 매장 · 삭제된 고객이면 `not_found` 404
- 목록 조회는 그 고객의 개인정보 조회로 접근 로그에 남긴다 (NFR-06)

**`GET /api/customers/{customerId}/consents`** 동의 현재 상태와 이력 (FR-CUS-09). `CUSTOMER_VIEW`. 다른 매장 · 삭제된 고객이면 `not_found` 404 (삭제하면 동의 이력도 지운다, C12).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `current` | object[] | 항목별 현재 상태. 3절 「동의 항목」 다섯 개가 그 순서로 모두 들어간다 |
| `history` | object[] | 동의 이력 전체, 기록한 순서(오래된 것부터) |

| `current` 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `item` | string | 3절 「동의 항목」 |
| `agreed` | boolean | 그 항목 최신 이력 행의 여부. 받은 적 없으면 false |
| `recordedAt` | string \| null | 최신 이력 행의 일시. 받은 적 없으면 null (F19 "동의를 받은 적 없음"과 철회를 이 값으로 구분) |

| `history` 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `consentId` | number | 이력 행 ID (정정 `POST /api/consents/{consentId}/corrections`의 대상) |
| `item` | string | 3절 「동의 항목」 |
| `agreed` | boolean | 동의면 true, 철회면 false |
| `recordedAt` | string | 일시 |
| `staff` | object \| null | 처리 스탭 `{ "id", "name" }`. 가상 휴대폰 [수신거부]처럼 스탭 없이 들어온 철회면 null |
| `method` | string \| null | 3절 「동의 방법」. 스탭 없이 들어온 철회면 null |
| `withdrawalPath` | string \| null | 3절 「철회 경로」. 철회 행에만 있고 동의 행은 null |

- 조회는 그 고객의 개인정보 조회로 접근 로그에 남긴다 (NFR-06)

**`GET /api/customers/{customerId}/messages`** 수신 이력 · 캠페인 연결 기록 (FR-CUS-03, FR-ANL-04). `CAMPAIGN_VIEW`. 고객 상세 화면이 공용이어도 이 영역은 "캠페인 목록·결과 조회" 설정을 따른다 (명세서 2장). 다른 매장 · 삭제된 고객이면 `not_found` 404. 그 고객이 **받은** 메시지(발송 성공 `SENT`)만, 종류(광고 · 수신 거부 처리 안내 · 동의 재확인 안내)와 상관없이 받은 시각 최신순으로 준다. 대기 · 실패 · 대조군 행은 넣지 않는다 (결정 F37). 결제 금액은 `GET /api/customers/{customerId}/payments`다.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

응답은 3절 페이지 응답이다.

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `messageId` | number | 발송 기록 ID (귀속 발송 ID, F15) |
| `kind` | string | 3절 「발송 메시지 종류」 |
| `receivedAt` | string | 받은 시각(3절, 발송 결과 시각) |
| `campaign` | object \| null | `{ "id": number, "name": string }`. 수신 거부 처리 안내면 null (FR-CMP-11) |
| `category` | string \| null | 3절 「시술 카테고리」. 광고 캠페인의 카테고리이고, 수신 거부 처리 안내 · 동의 재확인 안내면 null (E7) |
| `reservations` | object[] | 이 발송이 귀속된 예약 `{ "id": number, "startAt": string, "status": string }`, 시작 시각 순. 예약이 나중에 취소 · 노쇼돼도 남고 `status`로 보인다 (FR-ANL-01). 다음 예약이 같은 발송을 이어받으면 둘 다 나온다 (FR-VIS-04). 없으면 빈 배열 |
| `visits` | object[] | 이 발송이 귀속된 방문 `{ "id": number, "visitDate": string }`, 방문일 순. 없으면 빈 배열 |

- 귀속 판정은 퍼널(`GET /api/campaigns/{campaignId}/funnel`)과 같다: 예약 시술 · 방문 시술의 귀속 발송 ID(F15)가 이 광고 메시지이고 그 시술이 같은 카테고리인 것 (A8, E7). 귀속된 예약에서 생긴 방문은 방문일이 귀속 기간 밖이어도 나온다 (F33). CSV로 가져온 방문은 빠진다 (FR-CUS-13). 재예약 고객으로 좁히지 않는다 (F35는 퍼널에만). 안내 메시지는 카테고리가 없어 두 배열이 늘 비어 있다
- 수신 번호 · 본문은 넣지 않는다. 결제 금액(`SALES_ANALYTICS`)은 이 응답에 넣지 않는다 (명세서 2장)
- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400
- 조회는 그 고객의 개인정보 조회로 접근 로그에 남긴다 (NFR-06)

**`GET /api/customers/{customerId}/payments`** 결제 금액 이력 (FR-ANL-04). `SALES_ANALYTICS`. 고객 상세 화면이 공용이어도 이 영역은 "매출·성과 분석 조회" 설정을 따른다 (명세서 2장). 다른 매장 · 삭제된 고객이면 `not_found` 404. 정렬은 결제 시각 최신순. 취소된 결제도 이력으로 남아 있으므로 빼지 않고 `canceled`로 표시한다 (명세서 5장 payment, F8).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

응답은 3절 페이지 응답이다.

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `paymentId` | number | 결제 ID (결제 수정 · 취소 `PATCH /api/payments/{paymentId}` · `POST /api/payments/{paymentId}/cancel`의 대상) |
| `paidAt` | string | 결제 시각 |
| `amount` | number | 금액(원). 취소된 결제도 취소 전 금액 그대로 |
| `method` | string | 3절 「결제 수단」 |
| `canceled` | boolean | 취소 여부 (FR-PAY-02, F8) |
| `reservationId` | number | 결제를 등록한 예약 ID (FR-VIS-02) |
| `visitId` | number \| null | 결제가 붙은 방문 ID. 방문 삭제(마감 되돌리기)로 취소된 결제면 null (F8) |

- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400
- 조회는 그 고객의 개인정보 조회로 접근 로그에 남긴다 (NFR-06)

### 예약 (RSV)

**`GET /api/reservations`** 기간 예약 · 주간 캘린더 · 일간 보기 (FR-RSV-02 · 05). 기능 키 `RESERVATION`. 페이징 없음 (F13).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `from` · `to` | string | 예 | 날짜(3절, Asia/Seoul). `to`를 포함하고 `from` ≤ `to`, 최대 7일. 주간은 월요일부터 7일(F10), 일간은 `from` = `to` |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `reservations` | object[] | 시작 시각이 기간 안인 예약, 시작 시각 순. 취소 · 노쇼도 포함하고 화면이 `status`로 거른다 |

| 예약 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 예약 ID |
| `status` | string | 예약 상태(3절) |
| `startAt` | string | 시작 시각(3절 시각 형식) |
| `minutes` | number | 소요 시간(분) |
| `staff` | object | 담당 스탭 `{ "id": number, "name": string }`. 스탭별 열은 화면이 이 값으로 묶는다 |
| `consultFirst` | boolean | [상담 후 진행] (A13) |
| `channel` | string | 예약 경로(3절) |
| `customer` | object \| null | `{ "id": number, "name": string \| null }`. null이면 고객 없는 예약이라 화면은 예약 경로와 예정 시술로 표시한다 (E3). 연락처는 넣지 않는다 |
| `services` | object[] | 예정 시술 `{ "serviceMenuId": number, "name": string }`, 등록 순 |

- `from` · `to`가 없거나 날짜가 아니거나, `from` > `to`이거나 7일을 넘으면 `invalid` 400

**`GET /api/reservations/available-times`** 예약 가능한 시작 시각 (FR-RSV-04). 기능 키 `RESERVATION`.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `staffId` | number | 예 | 담당 스탭. 다른 매장 스탭이면 `not_found` 404, 비활성 스탭이면 `invalid` 400 (FR-ACC-04) |
| `date` | string | 예 | 날짜 (`YYYY-MM-DD`) |
| `minutes` | number | 예 | 소요 시간. 30분 단위가 아니면 `invalid` 400 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `startTimes` | string[] | 고를 수 있는 시작 시각(3절 시각 형식), 이른 순. 영업시간 밖 · 휴무일 · 확정 · 완료 예약과 겹치는 시각은 빠진다. 없으면 빈 배열 (C7) |

**`POST /api/reservations`** 예약 등록 (FR-RSV-01). 기능 키 `RESERVATION`. 성공하면 `201`이고 상태는 `CONFIRMED`다. 저장할 때 서버가 겹침을 다시 검사하고, 동시에 같은 시간을 잡으면 하나만 저장한다 (1절).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `customerId` | number \| null | 아니요 | null이면 고객 없는 예약 (E3). 다른 매장 · 삭제된 고객이면 `not_found` 404 |
| `staffId` | number | 예 | 담당 스탭. 다른 매장 스탭 `not_found` 404, 비활성 스탭 `invalid` 400 |
| `startAt` | string | 예 | 시작 시각(3절 시각 형식). 30분 단위 |
| `minutes` | number | 아니요 | 소요 시간, 30분 단위. 빼면 예정 시술 메뉴 소요 시간 합계 |
| `channel` | string | 아니요 | 예약 경로(3절). 빼면 `STORE` |
| `consultFirst` | boolean | 아니요 | [상담 후 진행] (A13). 빼면 false |
| `memo` | string \| null | 아니요 | 1,000자 이하. 고객 없는 예약에 보내면 `invalid` 400 (E3) |
| `serviceMenuIds` | number[] | 예 | 예정 시술 메뉴, 1개 이상 (A13). 다른 매장 메뉴면 `not_found` 404 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 만든 예약 ID |

- 겹침 · 영업시간 밖 · 매장 · 스탭 휴무면 `reservation_conflict` 409 (FR-RSV-04)
- 예약 제한 고객인데 원장 PIN 인증이 없으면 `owner_pin_required` 403이고 `message`에 사유가 들어간다: `"예약 제한 고객입니다. 사유: …"` (FR-CUS-14)

**`PATCH /api/reservations/{reservationId}`** 예약 수정 (FR-RSV-01). 기능 키 `RESERVATION`. 확정 예약만 수정한다 (F30). 성공하면 `204`. 등록과 같은 본문을 통째로 보내고, 빠진 선택 칸은 등록과 같은 기본값이 된다. 고객은 이 API로 바꾸지 않는다 (고객 없는 예약의 고객 연결은 `PUT /api/reservations/{reservationId}/customer`).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `staffId` · `startAt` · `minutes` · `channel` · `consultFirst` · `memo` · `serviceMenuIds` | | | `POST /api/reservations`와 같다 |

- 같은 담당 스탭의 다른 확정 · 완료 예약과 겹치거나 영업시간 밖 · 매장 · 스탭 휴무면 `reservation_conflict` 409. 자기 자신과의 겹침은 보지 않는다 (FR-RSV-04)
- 완료 · 취소 · 노쇼 예약이면 `conflict` 409 (F30), 다른 매장 · 없는 예약이면 `not_found` 404

**`GET /api/reservations/{reservationId}`** 예약 상세 (FR-RSV-01, FR-CUS-05, FR-DSH-01). 기능 키 `RESERVATION`. 상태와 관계없이 조회한다.

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 예약 ID |
| `status` | string | 예약 상태(3절) |
| `startAt` | string | 시작 시각(3절 시각 형식) |
| `minutes` | number | 소요 시간(분) |
| `channel` | string | 예약 경로(3절) |
| `consultFirst` | boolean | [상담 후 진행] (A13). true면 화면에 "상담 후 진행"으로 표시한다 |
| `memo` | string \| null | 메모. 고객 없는 예약이면 null (E3) |
| `staff` | object | 담당 스탭 `{ "id": number, "name": string }`. 비활성 스탭도 그대로 보여준다 |
| `services` | object[] | 예정 시술 `{ "serviceMenuId": number, "name": string, "price": number }`, 등록 순. `price`는 지금 메뉴 가격(원) |
| `customer` | object \| null | `{ "id": number, "name": string \| null, "serviceCaution": string \| null, "healthCaution": string \| null }`. 주의사항은 상단 표시용이다 (FR-CUS-05). `healthCaution`은 건강 정보 동의 고객만 값이 있다 (D7). 삭제된 고객이면 `name`이 null (C12). 연락처는 넣지 않는다 (고객 상세에서 본다, NFR-04) |
| `visitId` | number \| null | 완료된 예약의 방문 ID |

- `customer`가 null이면 고객 없는 예약이다. 확정 상태면 `PUT /api/reservations/{reservationId}/customer`로 고객을 연결한다 (E3, FR-DSH-01)
- 고객이 있는 예약을 조회하면 그 고객의 개인정보 조회로 접근 로그에 남긴다 (NFR-06)
- 다른 매장 · 없는 예약이면 `not_found` 404

**`POST /api/reservations/{reservationId}/cancel`** 예약 취소 · **`POST /api/reservations/{reservationId}/no-show`** 노쇼 (FR-RSV-03). 기능 키 `RESERVATION`. 본문 없음, 성공하면 `204`.

- 확정이 아닌 예약이면 `conflict` 409. 노쇼는 시작 시각이 지난 뒤에만 되고, 그 전이면 `conflict` 409 (C8)
- 고객 없는 예약도 노쇼 처리할 수 있다 (E3)

**`PUT /api/reservations/{reservationId}/customer`** 고객 없는 예약에 고객 연결 (FR-RSV-01, FR-DSH-01). 기능 키 `RESERVATION`.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `customerId` | number | 예 | 다른 매장 · 삭제된 고객이면 `not_found` 404 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `notice` | string \| null | 예약 제한 고객이면 `"예약 제한 고객입니다. 사유: …"`, 아니면 null. 제한 고객도 PIN 없이 연결한다 (FR-CUS-14, E3) |

- 이미 고객이 있거나 확정이 아닌 예약이면 `conflict` 409

### 방문 (VIS)

**`POST /api/reservations/{reservationId}/complete`** 결제 없이 완료 처리 (FR-VIS-01). 기능 키 `RESERVATION`. 같은 고객 · 같은 날 방문이 있으면 그 방문에 시술을 더한다 (C6). 방문일은 예약일이다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `serviceMenuIds` | number[] | 아니요 | 확인한 실제 시술, 1개 이상. 빼면 예정 시술 그대로. [상담 후 진행] 예약은 보내야 하고, 빼면 `invalid` 400 (A13) |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `visitId` | number | 연결된 방문 ID |

- 고객 없는 예약(시술 마감 카드로만 완료, E3) · 확정이 아닌 예약이면 `conflict` 409

**`PATCH /api/visits/{visitId}`** 방문의 실제 시술 · 시술별 담당 스탭 · 주기 계산 제외 수정 (FR-VIS-03 · 05). 기능 키 `CUSTOMER_EDIT`. 성공하면 `204`. 고객이 있는 방문이면 같은 트랜잭션에서 그 고객의 예측을 다시 계산한다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `services` | object[] | 예 | 방문의 실제 시술 전체 `{ "serviceMenuId": number, "staffId": number, "cycleExcluded"?: boolean }`, 1개 이상. 이 목록으로 바꾼다. 다른 매장 메뉴 · 스탭이면 `not_found` 404. 고객 없음으로 마감한 방문에 `cycleExcluded: true`면 `invalid` 400 (E3) |

- 같은 메뉴의 기존 시술은 그 행을 남기고 담당 스탭 · 주기 계산 제외만 바꾼다(귀속 발송 F15 유지). 목록에서 빠진 메뉴의 시술은 지우고, 새 메뉴는 그 방문에 연결된 가장 이른 예약의 시술로 더한다 (F25)
- "앞으로 ○○ 메뉴를 모두 주기 계산에서 제외할까요?" 안내(FR-VIS-05)는 응답에 넣지 않는다. 화면이 `GET /api/service-menus`의 `predictionAttribute`가 `NORMAL`인 메뉴에 체크하는 순간 띄우고, [예]면 `PATCH /api/service-menus/{menuId}`(`OWNER_PIN`)로 바꾼다
- CSV로 가져온 방문이면 `conflict` 409 (F25), 다른 매장 · 없는 방문이면 `not_found` 404

**`DELETE /api/visits/{visitId}`** 방문 삭제 = 그 방문의 마감 되돌리기 (FR-VIS-03, F8). 기능 키 `CUSTOMER_EDIT`이고, 그 방문에 취소되지 않은 결제가 있으면 `PAYMENT_EDIT`도 검사한다 (4장). 본문 없음, 성공하면 `204`.

- 한 트랜잭션에서 연결된 예약을 모두 `CONFIRMED`로 되돌리고, 결제를 모두 취소 표시하고(이력은 남음), 시술 · 방문 메모 · 사진과 방문을 지운다
- 고객 없음으로 마감한 방문이면 `conflict` 409 (E3), 다른 매장 · 없는 방문이면 `not_found` 404

### 시술 마감 · 결제 (PAY)

**`GET /api/reservations/{reservationId}/closing`** 시술 마감 카드 채울 값 (FR-PAY-01 · 04, FR-VIS-05). 기능 키 `RESERVATION`. 확정 · 완료 예약만 연다.

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `reservationId` | number | 예약 ID |
| `status` | string | `CONFIRMED` 또는 `COMPLETED`. `COMPLETED`면 실제 시술은 읽기 전용이고 결제 · 사진 · 메모만 더한다 (E4) |
| `servicesConfirmRequired` | boolean | 확정 상태의 [상담 후 진행] 예약이면 true. 저장할 때 `services`를 보내야 한다 (A13) |
| `visitId` | number \| null | 완료된 예약의 방문 ID. 사진은 이 ID로 올린다 (F9) |
| `customer` | object \| null | `{ "id": number, "name": string \| null }`. null이면 확정 상태에선 고객 연결(`PUT /api/reservations/{reservationId}/customer`) 또는 `noCustomer` 마감이 먼저 필요하고, 완료 상태에선 고객 없음으로 마감한 방문이다 (E3). 연락처는 넣지 않는다 (NFR-04) |
| `services` | object[] | 실제 시술 `{ "serviceMenuId": number, "name": string, "category": string, "price": number, "predictionAttribute": string, "staff": { "id": number, "name": string }, "cycleExcluded": boolean }`. 확정 예약이면 예정 시술을 예약 담당 스탭 · `cycleExcluded: false`로 채우고, 완료 예약이면 이 예약으로 기록된 방문의 실제 시술이다 (A13). `price`는 지금 메뉴 가격(원), `predictionAttribute`는 3절 「메뉴 예측 속성」(`NORMAL` 메뉴에 주기 계산 제외를 체크하면 FR-VIS-05 안내를 띄운다) |
| `photoAllowed` | boolean | 사진 동의 현재 상태(최신 행). 고객이 없으면 false (FR-CUS-08) |
| `consentsToRequest` | string[] | 동의 받기 대상. `PHOTO` `MARKETING` `NIGHT_AD` `HEALTH` 중 현재 동의 상태가 아닌 항목(3절 순서). 고객이 없으면 빈 배열 (E3) |

- 결제 수단은 3절 「결제 수단」 값을 그대로 쓴다 (응답에 넣지 않는다)
- 취소 · 노쇼 예약이면 `conflict` 409, 다른 매장 · 없는 예약이면 `not_found` 404

**`POST /api/reservations/{reservationId}/closing`** 시술 마감 카드 저장 (FR-PAY-01 · 04). 기능 키 `RESERVATION`. 결제 · 방문 생성 · 방문 메모 · 예약 완료를 한 트랜잭션으로 처리한다. 완료된 예약이면 같은 방문에 결제 · 메모만 더한다 (E4). 사진(`POST /api/visits/{visitId}/photos`)과 동의 받기는 따로 저장한다 (F9).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `services` | object[] \| null | 아니요 | 실제 시술 `{ "serviceMenuId": number, "staffId": number, "cycleExcluded"?: boolean }`, 1개 이상. 빼면 예정 시술을 예약 담당 스탭으로 채운다. [상담 후 진행] 예약은 보내야 한다 (A13). 완료된 예약에 보내면 `invalid` 400 (시술 수정은 방문 수정, E4). 다른 매장 메뉴 · 스탭이면 `not_found` 404 |
| `amount` | number | 예 | 원 단위 정수, 0 이상 |
| `method` | string | 예 | 결제 수단(3절) |
| `memo` | string \| null | 아니요 | 방문 메모, 1,000자 이하 (F1). 고객 없음 마감 · 고객 없는 방문이면 `invalid` 400 (E3) |
| `noCustomer` | boolean | 아니요 | 고객 없는 예약을 "고객 없음"으로 마감 (E3). 이때 `cycleExcluded`와 `memo`는 받지 않는다. 고객이 있는 예약에 true면 `invalid` 400 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `visitId` | number | 결제가 붙은 방문 ID. 사진은 이 ID로 올린다 (F9) |

- 고객 없는 예약을 고객 연결 없이(`noCustomer` 없이) 마감하면 `conflict` 409. 먼저 `PUT /api/reservations/{reservationId}/customer`로 연결한다
- 취소 · 노쇼 예약이면 `conflict` 409 (FR-PAY-01)

**`PATCH /api/payments/{paymentId}`** 결제 수정 (FR-PAY-02). 기능 키 `PAYMENT_EDIT`. 성공하면 `204`.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `amount` | number | 예 | 원 단위 정수, 0 이상 |
| `method` | string | 예 | 결제 수단(3절) |

- 취소된 결제면 `conflict` 409, 다른 매장 · 없는 결제면 `not_found` 404

**`POST /api/payments/{paymentId}/cancel`** 결제 취소 (FR-PAY-02, F8). 기능 키 `PAYMENT_EDIT`. 본문 없음, 성공하면 `204`. 결제만 취소하고 방문은 그대로 둔다 (방문까지 되돌리려면 `DELETE /api/visits/{visitId}`).

- 이미 취소된 결제면 `conflict` 409, 다른 매장 · 없는 결제면 `not_found` 404

### 예측 · 인사이트 (PRD)

구현을 시작할 때 이 소절에 채운다. 다른 영역 소절은 건드리지 않는다.

### 캠페인 · 발송 · 가상 휴대폰 (CMP)

구현을 시작할 때 이 소절에 채운다. 다른 영역 소절은 건드리지 않는다.

**`GET /api/message-templates`** 템플릿 목록 (FR-CMP-03). `CAMPAIGN_VIEW`. 세션 매장 템플릿만, 만든 순서(오래된 것 먼저)로 준다.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 템플릿 ID |
| `name` | string | 이름 |
| `body` | string | 치환 전 본문. 변수는 FR-CMP-03 · C10 (`{고객명}` 등) |
| `purpose` | string | 3절 「템플릿 용도」 |
| `messageKind` | string | 3절 「캠페인 메시지 종류」. 용도로 정해진다: `CONSENT_RECONFIRM`만 `INFO`, 나머지는 `AD` |

- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400

**`POST /api/message-templates`** 템플릿 작성 · **`PATCH /api/message-templates/{templateId}`** 수정 (FR-CMP-03, C10). `CAMPAIGN_SEND`. 작성은 `201`과 `{ "id": number }`, 수정은 `204`. 수정은 같은 본문을 통째로 보낸다.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` | string | 예 | 1~100자 |
| `body` | string | 예 | 치환 전 본문. 2,000바이트 이하(2장, FR-CMP-05와 같은 셈법: ASCII가 아닌 문자 2바이트, ASCII · 줄바꿈 1바이트). 광고 표기는 넣지 않아도 된다 (발송할 때 붙음, FR-CMP-04) |
| `purpose` | string | 예 | 3절 「템플릿 용도」. 메시지 종류는 이 값으로 정해진다 |

- 변수는 `{` `}`로 감싼 이름이다. 쓸 수 있는 변수: 모든 용도 `{고객명}` `{매장명}`, `CONSENT_RECONFIRM`이 아닌 용도 `{최근시술}` `{경과일}`, `CONSENT_RECONFIRM`만 `{동의일}` `{야간광고동의}` (C10). 그 밖의 변수가 있으면 `invalid` 400이고 `details`에 `field: "body"`
- 다른 매장 · 없는 템플릿이면 `not_found` 404

**`DELETE /api/message-templates/{templateId}`** 템플릿 삭제 (FR-CMP-03). `CAMPAIGN_SEND`. 본문 없음, 성공하면 `204`. 기본 템플릿도 지울 수 있다.

- 캠페인이 쓰고 있는 템플릿이면 `conflict` 409 (캠페인 기록을 남기기 위해), 다른 매장 · 없는 템플릿이면 `not_found` 404

**매장 기본 템플릿** (FR-CMP-03 · 13, D1). 매장 가입(`POST /api/shops`) 때 아래 4개를 그 매장 템플릿으로 만든다. 매장이 고칠 수 있는 일반 템플릿이다. 광고 본문 앞뒤의 광고 표기 · 매장명 · 전화번호 · 무료수신거부(FR-CMP-04)는 발송할 때 붙으므로 본문에 넣지 않는다.

| 이름 | 용도 | 본문 |
| --- | --- | --- |
| 재방문 안내 | `REVISIT` | `{고객명}님, {매장명}입니다. 지난 {최근시술} 시술 후 {경과일}일이 지났어요. 편하실 때 예약해 주세요.` |
| 안부 · 혜택 | `CHECK_IN` | `{고객명}님, {매장명}입니다. 지난 {최근시술} 시술은 마음에 드셨나요? 다음 방문 때 드릴 작은 혜택을 준비해 두었어요.` |
| 재방문 혜택 | `WIN_BACK` | `{고객명}님, {매장명}입니다. {최근시술} 시술 후 {경과일}일이 지났네요. 다시 찾아 주시면 드릴 혜택을 준비했어요. 예약할 때 이 문자를 보여 주세요.` |
| 동의 재확인 (철회 방법 안내형) | `CONSENT_RECONFIRM` | `[{매장명}] {고객명}님은 {동의일}에 {매장명}의 광고성 정보 수신에 동의하셨습니다 (야간 광고 수신: {야간광고동의}). 동의는 그대로 유지됩니다. 더 받지 않으시려면 [수신거부]를 누르거나 매장에 말씀해 주세요.` |

- 동의 재확인 템플릿은 전송자 명칭(`{매장명}`) · 동의 일자(`{동의일}`) · 유지 또는 철회 방법을 담는다 (FR-CMP-13, D1). 철회 방법의 [수신거부]는 가상 휴대폰의 수신 거부 접수다 (FR-CMP-11)

**`GET /api/virtual-phone/messages?phone=`** 가상 수신함 (FR-CMP-16). `CAMPAIGN_SEND`. 세션 매장이 그 번호로 보낸 메시지 중 받은 것(`SENT`)만, 받은 시각 최신순 (F26). 종류(광고 · 수신 거부 처리 안내 · 동의 재확인 안내)와 상관없다 (명세서 5장).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `phone` | string | 예 | `010`으로 시작하는 11자리, 하이픈은 있어도 없어도 된다 (고객 `phone`과 같은 규칙) |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 발송 기록 ID |
| `kind` | string | 3절 「발송 메시지 종류」 |
| `messageType` | string | 3절 「메시지 유형」 |
| `body` | string | 받은 본문 (광고 표기 포함) |
| `receivedAt` | string | 받은 시각(3절, 발송 결과 시각) |

- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400. 받은 메시지가 없으면 빈 페이지

### 성과 · 대시보드 · 검색 (ANL · DSH · SCH)

구현을 시작할 때 이 소절에 채운다. 다른 영역 소절은 건드리지 않는다.

**`GET /api/campaigns/{campaignId}/funnel`** 캠페인 전환 퍼널 (FR-ANL-01 · 03). `CAMPAIGN_VIEW`. 모든 단계를 **고객 수**로 센다 (한 캠페인에서 고객당 발송 행은 하나, 재예약 단계 수는 고객당 1, FR-ANL-03). 대조군은 어느 단계에도 넣지 않는다 (E2). 재예약 · 재방문은 예약 시술 · 방문 시술에 저장된 귀속 발송 ID(F15)가 이 캠페인의 발송 성공 광고 메시지(실패 · 대조군 제외, 명세서 5장 campaign_message)이고 그 시술이 캠페인과 같은 카테고리인 것만 센다 (A8, E7). 기간 쿼리는 없다: 귀속 기간은 저장할 때 이미 적용됐고, 귀속된 예약에서 생긴 방문은 방문일이 귀속 기간 밖이어도 든다 (결정 F33). 화면은 결과를 "모의 데이터로 생성한 결과값"으로 밝힌다 (E9).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `sentCount` | number | 발송: 대조군이 아닌 발송 대상 고객 수. 대기 · 실패 포함 |
| `reachedCount` | number | 도달: 그중 발송 성공(`SENT`, MVP는 가상 발송 성공, A6) 고객 수 |
| `rebookedCount` | number | 재예약: 이 캠페인 발송이 귀속된 예약 시술이 하나라도 있는 고객 수. 예약이 나중에 취소 · 노쇼돼도 남는다 (FR-ANL-01). 다음 예약이 같은 발송을 이어받아도 고객당 1 (FR-ANL-03) |
| `revisitedCount` | number | 재방문: 재예약 단계에 든 고객 중 이 캠페인 발송이 귀속된 방문 시술이 하나라도 있는 고객 수. 방문만 귀속된 고객(발송 전에 잡아 둔 예약의 방문 등)은 넣지 않아 `revisitedCount` ≤ `rebookedCount`다 (결정 F35). CSV로 가져온 방문은 빼고(FR-CUS-13), 귀속된 예약에서 생긴 방문은 넣는다(F33). 귀속된 예약이 취소 · 노쇼되고 이어받은 예약도 없으면 방문이 없어 빠진다 (FR-ANL-01) |

- 각 단계는 앞 단계 고객 수를 넘지 않는다 (F35). 전환율은 화면이 앞 단계 수로 나눠 계산한다. 재예약 전환율(`rebookedCount ÷ reachedCount`)은 기획서 4장 지표와 같다. 앞 단계가 0이면 전환율을 보이지 않는다
- 삭제된 고객도 그대로 센다 (C12). 동의 재확인 안내 캠페인은 카테고리가 없어 귀속이 없으므로 재예약 · 재방문이 0이다 (E7)
- 캠페인이 없거나 다른 매장 것이면 `not_found` 404 (NFR-03)
- 기능 키가 PIN으로 잠겨 있고 인증이 없으면 `pin_required` 403

**`GET /api/campaigns/{campaignId}/revenue`** 캠페인 연결 매출 (FR-ANL-02). `SALES_ANALYTICS`. 귀속 판정은 퍼널과 같다 (발송 성공 광고 메시지 · 같은 카테고리, A8 · E7 · F33). 재예약 여부로 좁히지 않고 저장된 방문 귀속을 그대로 쓴다 (F35는 퍼널에만 적용). 화면은 결과를 "모의 데이터로 생성한 결과값"으로 밝힌다 (E9).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `revenue` | number | 연결 매출(원): 이 캠페인 발송이 귀속된 방문 시술이 하나라도 있는 방문의 취소되지 않은 결제 합계 (FR-PAY-02). 결제는 시술별로 나눌 수 없어 방문 결제 전액을 세고(A13), 같은 방문에 이 캠페인 귀속 시술이 여럿이어도 한 번만 센다. 다른 캠페인에도 귀속된 방문은 그 캠페인 매출에도 전액 들어간다 (FR-ANL-02). CSV로 가져온 방문은 빠진다 (FR-CUS-13). 결제일 · 방문일로 거르지 않는다 (F33) |

- 매장 전체 합계에서 한 방문을 한 번만 세는 규칙(FR-ANL-02)은 매장 기본 지표(`GET /api/analytics/summary`, 결제 기준)가 지킨다. 이 응답은 캠페인 하나의 값이다
- 삭제된 고객의 결제도 그대로 센다 (C12)
- 캠페인이 없거나 다른 매장 것이면 `not_found` 404 (NFR-03)
- 기능 키가 PIN으로 잠겨 있고 인증이 없으면 `pin_required` 403

**`GET /api/analytics/summary`** 매장 기본 지표 (FR-ANL-05 · 06). `SALES_ANALYTICS`. 산식은 결정 F24. 날짜는 Asia/Seoul (NFR-12). 화면은 결과를 "모의 데이터로 생성한 결과값"으로 밝힌다 (E9). 주기 내 재방문율은 아직 응답에 없다 (F24, 스키마 결정 뒤 이 응답에 더함).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `period` | string | 예 | `TODAY` · `THIS_WEEK`(이번 주 월요일~일요일, F10) · `THIS_MONTH` · `LAST_MONTH` · `CUSTOM` |
| `from` · `to` | string | `CUSTOM`이면 예 | 날짜(3절), 둘 다 포함. `from` ≤ `to`, 길이 제한 없음. `CUSTOM`이 아니면 읽지 않는다 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `from` · `to` | string | 계산에 쓴 기간(3절 날짜, 둘 다 포함) |
| `revenue` | number | 매출(원): 결제일이 기간 안이고 취소되지 않은 결제 합계. 고객 없는 방문 · 삭제된 고객의 결제 포함 (FR-PAY-02, E3, C12) |
| `visitCount` | number | 방문일이 기간 안인 방문 수. CSV로 가져온 방문은 빼고 고객 없는 방문은 넣는다 (FR-CUS-13, E3) |
| `newCustomerCount` | number | 첫 방문일(가져온 방문 포함)이 기간 안인 고객 수. 고객 없는 방문은 빠지고 삭제된 고객은 센다 (E9, C12) |

- `period`가 없거나 값이 틀리면, `CUSTOM`인데 `from` · `to`가 없거나 날짜가 아니거나 `from` > `to`이면 `invalid` 400
- 기능 키가 PIN으로 잠겨 있고 인증이 없으면 `pin_required` 403

**`GET /api/analytics/prediction-accuracy`** 예측 정확도 (FR-ANL-07). `SALES_ANALYTICS`. 평가 대상과 산식은 결정 F29: 예측 종료일이 기간 안이고 오늘(Asia/Seoul)보다 이전인 예측 스냅샷(FR-PRD-08)만 평가하고, 삭제된 고객의 스냅샷도 넣는다 (FR-CUS-10). 카테고리로 나누지 않는다. 화면은 결과를 "모의 데이터로 생성한 결과값"으로 밝힌다 (E9).

쿼리는 `GET /api/analytics/summary`와 같다 (`period`, `CUSTOM`이면 `from` · `to`).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `from` · `to` | string | 계산에 쓴 기간(3절 날짜, 둘 다 포함) |
| `evaluatedCount` | number | 평가한 스냅샷 수. 적중률의 분모 |
| `hitCount` | number | 그중 적중(다음 방문이 예측 기간 안) 수. 끝났는데 다음 방문이 없는 스냅샷은 빗나감이라 여기에 들지 않는다. 적중률은 `hitCount / evaluatedCount`로 화면이 계산하고, `evaluatedCount`가 0이면 적중률을 보이지 않는다 |
| `averageErrorDays` | number \| null | 평균 오차(일): 실제 다음 방문일이 있는 스냅샷만으로 `\|실제 방문일 − 예측 중앙일\|`의 평균, 소수 첫째 자리 반올림. 중앙일은 시작 · 종료일의 정확한 가운데(반일 가능). 계산할 스냅샷이 없으면 null |

- 쿼리 오류는 `GET /api/analytics/summary`와 같이 `invalid` 400
- 기능 키가 PIN으로 잠겨 있고 인증이 없으면 `pin_required` 403

**`GET /api/dashboard/today`** 오늘 예약 · 마감 안 된 예약 · 이번 주 예약 요약 (FR-DSH-01 · 03 · 05). 기능 키 `DASHBOARD_SEARCH`. "오늘" · "지금" · "이번 주"는 Asia/Seoul 기준이고 (NFR-12), 이번 주는 오늘이 속한 주의 월요일부터 일요일까지다 (F10). 페이징 없음.

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `today` | object[] | 시작 시각이 오늘인 예약, 시작 시각 순. 취소 · 노쇼도 포함하고 화면이 `status`로 거른다 (FR-DSH-01) |
| `unclosed` | object[] | 마감 안 된 예약: 시작 시각이 지금보다 이른 확정(`CONFIRMED`) 예약 전부, 시작 시각 순(오래된 것 먼저). 고객 없는 예약도 넣는다 (FR-DSH-05, FR-RSV-01, E4). `today`와 겹칠 수 있다 |
| `week` | object[] | 이번 주 요일별 예약 건수, 월요일부터 7개 (FR-DSH-03, F10) |

| 예약 필드 (`today` · `unclosed`) | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 예약 ID. `unclosed`에서 누르면 이 ID로 시술 마감 카드(`GET /api/reservations/{reservationId}/closing`)를 연다 (E4) |
| `status` | string | 예약 상태(3절) |
| `startAt` | string | 시작 시각(3절 시각 형식) |
| `minutes` | number | 소요 시간(분) |
| `staff` | object | 담당 스탭 `{ "id": number, "name": string }` |
| `consultFirst` | boolean | [상담 후 진행] (A13) |
| `channel` | string | 예약 경로(3절) |
| `customer` | object \| null | `{ "id": number, "name": string \| null, "hasCaution": boolean }`. 누르면 고객 상세로 간다. null이면 고객 없는 예약이라 화면은 예약 경로와 예정 시술로 표시하고, 누르면 예약 상세로 간다 (E3, FR-DSH-01). `hasCaution`은 시술 · 건강 주의사항 중 하나라도 있으면 true (주의 아이콘, FR-CUS-05). 삭제된 고객이면 `name`이 null (C12). 연락처는 넣지 않는다 (NFR-04) |
| `services` | object[] | 예정 시술 `{ "serviceMenuId": number, "name": string }`, 등록 순 |

| 요일 필드 (`week`) | 타입 | 설명 |
| --- | --- | --- |
| `date` | string | 날짜(3절) |
| `counts` | object | 시작 시각이 그 날인 예약을 예약 상태(3절)마다 센 건수, 0건 포함: `{ "CONFIRMED": number, "COMPLETED": number, "CANCELED": number, "NO_SHOW": number }`. 어떤 상태를 합쳐 "예약 건수"로 보일지는 화면이 고른다 |

- 다른 매장 예약은 나오지 않는다 (NFR-03)

**`GET /api/dashboard/booking-channels`** 예약 경로 통계 (FR-DSH-06, P2). 기능 키 `DASHBOARD_SEARCH`. 대상은 결정 F27: 시작일(Asia/Seoul, NFR-12)이 기간 안인 예약을 상태와 관계없이(취소 · 노쇼 포함) 모두 세고, 고객 없는 예약도 넣는다 (E3). 화면은 결과를 시드 데이터 비율로 밝힌다 (FR-DSH-06).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `period` · `from` · `to` | string | `GET /api/analytics/summary`와 같음 | 같은 값과 규칙 (F24) |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `from` · `to` | string | 계산에 쓴 기간(3절 날짜, 둘 다 포함) |
| `total` | number | 기간 안 예약 수 |
| `channels` | object[] | 예약 경로(3절)마다 하나, 3절 순서(`NAVER` `KAKAO` `PHONE` `STORE` `ETC`)로 5개. 0건 경로도 넣는다 |

| 경로 필드 (`channels`) | 타입 | 설명 |
| --- | --- | --- |
| `channel` | string | 예약 경로(3절) |
| `count` | number | 그 경로의 예약 수 |
| `ratio` | number | `count` ÷ `total`, 0~1 (반올림하지 않음, 표시 자리수는 화면이 정한다). `total`이 0이면 0 |

- `period` · `from` · `to`가 규칙에 맞지 않으면 `invalid` 400 (`GET /api/analytics/summary`와 같음)
- 다른 매장 예약은 세지 않는다 (NFR-03)

**`GET /api/search/customers`** 상단 검색창의 고객 결과 (FR-SCH-04). `CUSTOMER_VIEW`. 기능 검색 자체는 `DASHBOARD_SEARCH`지만 고객 결과는 "고객 조회" 설정을 따른다 (명세서 2장). "고객 조회"가 PIN으로 잠겨 있으면 `pin_required` 403이고, 화면은 고객 결과를 자물쇠로 표시했다가 PIN 인증 뒤 다시 요청한다 (FR-SCH-05). 삭제된 고객은 나오지 않는다 (FR-CUS-10). 정렬은 최근 등록순.

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `q` | string | 예 | 앞뒤 공백을 뺀 값이 숫자 4자리면 휴대폰 뒷자리 일치, 그 밖에는 이름에 포함 (`GET /api/customers`의 `q`와 같은 규칙). 비어 있으면 `invalid` 400 |
| `page` · `size` | number | 아니오 | 1절 페이지 규칙. `size`는 1~100, 기본 20 |

응답은 3절 페이지 응답이다.

| 항목 필드 | 타입 | 설명 |
| --- | --- | --- |
| `customerId` | number | 고객 ID (고객 상세 `GET /api/customers/{customerId}`로 이동) |
| `name` | string | 이름 |
| `phone` | string | 마스킹한 휴대폰 `010-****-1234` (NFR-04, A4). 전체 번호는 `GET /api/customers/{customerId}/contact` |

- 쿼리 값이 규칙에 맞지 않으면 `invalid` 400

**`POST /api/search/misses`** 결과 없는 검색어 저장 (FR-SCH-06, B9, P2). `DASHBOARD_SEARCH`. 기능 결과와 고객 결과가 **둘 다 없을 때만** 남긴다 (F28). 기능 키워드 사전은 프론트 정적 파일이라(FR-SCH-02) 기능 결과가 없을 때만 화면이 부르고, 고객 결과는 서버가 `GET /api/search/customers`와 같은 규칙으로 다시 찾아 하나라도 있으면 저장하지 않는다. 그래서 "고객 조회"가 PIN으로 잠겨 화면이 고객 결과를 모를 때도 그대로 부르면 된다. 저장했든 안 했든 응답은 같다(204, 본문 없음).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `keyword` | string | 예 | 검색창에 입력한 말. 1~100자, 앞뒤 공백을 빼고 저장한다 (명세서 5장 search_miss_log) |

- `keyword`가 없거나 비었거나 100자를 넘으면 `invalid` 400
- 매장과 저장 시각(Asia/Seoul, NFR-12)은 서버가 세션 · 시계로 채운다. 저장한 검색어를 조회하는 API는 없다 (요구사항 없음)

### 매장 설정 (SET)

**`GET /api/shop`** 매장 정보 · 영업시간 (FR-SET-01). 근무자. 매장 설정 화면과 예약 화면이 함께 쓴다 (F20).

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | string | 매장명 |
| `phone` | string \| null | 매장 연락처 (광고 표기, FR-CMP-04) |
| `senderNumber` | string \| null | 발신번호 |
| `unsubscribeNumber` | string \| null | 수신 거부 번호 |
| `openingHours` | object[] | 요일별 영업시간 7개, `MONDAY`부터 `SUNDAY` 순서. `{ "dayOfWeek": string, "open": string \| null, "close": string \| null }`. 시각은 3절 「시:분」, 정기 휴무인 요일은 `open` · `close`가 `null` (C7) |

- 근무자가 없으면 `worker_required` 403

**`PUT /api/shop`** 매장 정보 · 영업시간 수정 (FR-SET-01 · 07, C7). `OWNER_PIN`. `GET /api/shop`과 같은 모양을 통째로 보낸다 (F39). 바꾼 영업시간은 바로 예약 가능 시간 계산에 쓰인다 (FR-RSV-04). 광고 표기의 매장명 · 전화번호 · 수신 거부 방법도 이 값을 쓴다 (FR-CMP-04).

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` | string | 예 | 매장명. 1~100자, 앞뒤 공백을 빼고 저장 |
| `phone` · `senderNumber` · `unsubscribeNumber` | string \| null | 아니요 | 매장 연락처 · 발신번호 · 수신 거부 번호. 국내 전화번호(0으로 시작하는 번호 예: `02-000-0000` `010-0000-0000` `080-000-0000`, 대표번호 `1588-0000`처럼 15xx · 16xx · 18xx). 하이픈은 있어도 없어도 되고 보낸 그대로 저장. 빼거나 빈 값이면 `null` (F39, NFR-08) |
| `openingHours` | object[] | 예 | 요일별 영업시간 7개, 요일마다 한 번씩. `{ "dayOfWeek": string, "open": string \| null, "close": string \| null }`. 시각은 3절 「시:분」이고 30분 단위(`:00` · `:30`), `open` < `close`(자정 넘김 없음). 둘 다 `null`이면 정기 휴무, 하나만 `null`이면 `invalid` (C7, F39) |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `pushedReservations` | object[] | 바꾼 뒤 영업시간 밖으로 밀린 확정 예약(지금 이후), 시작 시각순. 정기 휴무가 된 요일의 예약과, 시작부터 종료까지 그날 영업시간 안에 들지 않는 예약. 모든 스탭의 예약이고 고객 없는 예약도 포함한다 (E3). `PATCH /api/staff/{staffId}`의 `pushedReservations`와 같은 모양. 자동 취소하지 않는다 (F12). 없으면 빈 배열 |

- 규칙을 어기면 `invalid` 400이고 `details`에 칸별 사유
- 임시 휴무일은 `POST /api/day-offs`, 스탭 정기 휴무 요일은 `PATCH /api/staff/{staffId}`로 바꾼다

**`GET /api/service-menus`** 시술 메뉴 (FR-SET-02). 근무자. 예약 화면이 소요 시간 합계를 기본값으로 쓴다 (FR-RSV-01). 페이징 없음 (F22).

| 응답 필드 (배열의 원소) | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 메뉴 ID |
| `category` | string | 시술 카테고리(3절) |
| `name` | string | 시술명 |
| `price` | number | 가격(원) |
| `durationMinutes` | number | 소요 시간(분), 30분 단위 |
| `cycleMinDays` | number | 기본 주기 최소(일) |
| `cycleMaxDays` | number | 기본 주기 최대(일) |
| `predictionAttribute` | string | 메뉴 예측 속성(3절) `NORMAL` `EXCLUDE` `END_SIGNAL` (E5) |

- 정렬: 카테고리(3절 순서), 그다음 등록 순(ID)

**`POST /api/service-menus`** 시술 메뉴 추가 (FR-SET-02). `OWNER_PIN`. 성공하면 `201`과 `{ "id": number }`.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `category` | string | 예 | 시술 카테고리(3절) |
| `name` | string | 예 | 1~100자, 앞뒤 공백을 빼고 저장 |
| `price` | number | 예 | 가격(원), 0 이상 정수 |
| `durationMinutes` | number | 예 | 소요 시간(분). 30 이상이고 30의 배수 (예: 90 = 1시간 30분) |
| `cycleMinDays` | number | 예 | 기본 주기 최소(일). `1 ≤ cycleMinDays ≤ cycleMaxDays` (카테고리 기본 주기와 같은 규칙) |
| `cycleMaxDays` | number | 예 | 기본 주기 최대(일) |
| `predictionAttribute` | string | 아니요 | 메뉴 예측 속성(3절) `NORMAL` `EXCLUDE` `END_SIGNAL` (E5). 기본 `NORMAL` |

- 규칙을 어기면 `invalid` 400이고 `details`에 칸별 사유
- 새 메뉴는 받은 고객이 없으므로 예측을 다시 계산하지 않는다

**`PATCH /api/service-menus/{menuId}`** 시술 메뉴 수정 (FR-SET-02, FR-VIS-05). `OWNER_PIN`. 보낸 칸만 바꾼다 (F31). 성공하면 `204`.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `name` · `price` · `durationMinutes` · `cycleMinDays` · `cycleMaxDays` · `predictionAttribute` | 추가와 같음 | 아니요 | 추가와 같은 규칙. 최소 ≤ 최대는 바꾼 뒤 값으로 검사한다 |

- `category`를 보내면 `invalid` 400. 카테고리는 바꿀 수 없고 다른 카테고리는 새 메뉴로 추가한다 (F31)
- 기본 주기(`cycleMinDays` · `cycleMaxDays`)나 `predictionAttribute`가 실제로 바뀌면 그 메뉴를 받은 고객 전체의 예측을 같은 트랜잭션에서 다시 계산한다. 이름 · 가격 · 소요 시간만 바뀌면 다시 계산하지 않는다 (FR-SET-02, FR-PRD-01)
- 방문 화면의 "앞으로 ○○ 메뉴를 모두 주기 계산에서 제외"(FR-VIS-05)는 `{ "predictionAttribute": "EXCLUDE" }`만 보낸다
- 다른 매장 · 없는 메뉴면 `not_found` 404

**`GET /api/category-cycles`** 카테고리 기본 주기 (FR-SET-02, C16). `OWNER_PIN`. 메뉴 없는 가져온 방문의 예측에 쓴다 (E5).

| 응답 필드 (배열의 원소) | 타입 | 설명 |
| --- | --- | --- |
| `category` | string | 시술 카테고리(3절). 5개 모두, 3절 순서 |
| `minDays` | number | 기본 주기 최소(일) |
| `maxDays` | number | 기본 주기 최대(일) |

**`PUT /api/category-cycles`** 카테고리 기본 주기 수정 (FR-SET-02). `OWNER_PIN`. 위와 같은 모양의 배열을 통째로 보낸다. 성공하면 `204`.

- 카테고리 5개가 한 번씩 있어야 하고, `1 ≤ minDays ≤ maxDays`. 어기면 `invalid` 400
- 값이 바뀐 카테고리는 그 카테고리에 메뉴 없는 방문이 있는 고객의 예측을 같은 트랜잭션에서 다시 계산한다 (FR-SET-02, FR-PRD-01)

**`GET /api/day-offs?from=&to=`** 매장 · 스탭 임시 휴무일 (FR-SET-07). 근무자. 캘린더가 휴무일을 고를 수 없게 표시하고(FR-RSV-02), 설정 화면이 목록으로 보여 준다. 페이징 없음 (F22).

| 쿼리 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `from` | string | 예 | 날짜(3절). 이 날부터 |
| `to` | string | 예 | 날짜(3절). 이 날까지(포함). `from` 이후이고 기간은 최대 31일. 어기면 `invalid` 400 |

| 응답 필드 (배열의 원소) | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 휴무일 ID |
| `date` | string | 날짜(3절) |
| `staffId` | number \| null | 스탭 휴무면 스탭 ID, 매장 휴무면 `null` |
| `reason` | string \| null | 사유 |

- 정렬: 날짜순, 같은 날은 매장 휴무 먼저
- 스탭 정기 휴무 요일은 여기 넣지 않는다 (`GET /api/staff?includeInactive=true`의 `regularDaysOff`)

**`POST /api/day-offs`** 휴무일 등록 (FR-SET-07, C7). `OWNER_PIN`. 성공하면 `201`.

| 요청 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| `date` | string | 예 | 날짜(3절). 오늘(Asia/Seoul) 이후. 지난 날짜면 `invalid` 400 (F32) |
| `staffId` | number \| null | 아니요 | 스탭 휴무면 스탭 ID, 빼거나 `null`이면 매장 휴무. 다른 매장 · 없는 스탭이면 `not_found` 404, 비활성 스탭이면 `invalid` 400 (FR-ACC-04, F32) |
| `reason` | string \| null | 아니요 | 사유. 100자 이하, 앞뒤 공백을 빼고 빈 값이면 `null`로 저장 |

| 응답 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | number | 휴무일 ID |
| `pushedReservations` | object[] | 그날(지금 이후) 걸리는 확정 예약, 시작 시각순. 매장 휴무면 모든 스탭의, 스탭 휴무면 그 스탭의 예약. `PATCH /api/staff/{staffId}`의 `pushedReservations`와 같은 모양 `{ "id": number, "startAt": string, "customerName": string \| null }`. 자동 취소하지 않는다 (F12). 없으면 빈 배열 |

- 같은 날 같은 대상(매장, 또는 같은 스탭)의 휴무가 이미 있으면 `duplicate` 409 (F32). 매장 휴무가 있는 날에 스탭 휴무를 따로 넣는 것은 허용
- 규칙을 어기면 `invalid` 400이고 `details`에 칸별 사유
- 등록한 날은 예약 가능 시간에서 빠진다 (FR-RSV-04)

**`DELETE /api/day-offs/{dayOffId}`** 휴무일 삭제 (FR-SET-07). `OWNER_PIN`. 본문 없음, 성공하면 `204`. 그날 다시 예약할 수 있다.

- 다른 매장 · 없는 휴무일이면 `not_found` 404
