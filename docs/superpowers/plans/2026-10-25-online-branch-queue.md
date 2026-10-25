# ONLINE 지점별 줄서기·지도 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 성심당 4개 지점 탐색·앱 내 줄서기, 모든 지점의 주변 가게·쿠폰, 입장 QR 인증을 Figma 화면에 가깝게 완성한다.

**Architecture:** 순수 도메인 함수가 지점별 전체 인원·다음 발급 번호와 개인 앞사람 수를 별도로 관리한다. 저장소 인터페이스 뒤에 기기 내 구현을 두고, PIN 검증 정보는 보호 로컬 저장소에 둔다. iOS `expo-maps` Apple Maps 및 Expo Router 화면은 상태를 표현하며, 현재 기기 한 대의 데이터만 사용한다.

**Tech Stack:** Expo SDK 58, React Native, TypeScript, Expo Router, AsyncStorage, expo-secure-store, expo-maps, expo-camera, expo-crypto, Apple Liquid Glass.

**Spec:** `docs/superpowers/specs/2026-10-25-online-branch-queue-design.md`

## Global Constraints

- 단일 iPhone 체험용 MVP다. 실제 다중 사용자 웨이팅·중앙 서버 동기화·실매장 QR 인증은 없다.
- 지점은 성심당 본점·대전역점·DCC점·롯데백화점 대전점이며, 지점마다 주변 가게를 제공한다.
- `queueCount`, 지점별 `nextTicketNumber`, 개인 `peopleAhead`를 독립적으로 관리한다. 선택 지점과 실제 등록 지점도 별도다.
- 전체 인원 수동 수정은 내 순번과 앞사람 수를 절대 바꾸지 않는다. 앞사람 수는 `앞사람 처리` 또는 앞선 대기자의 취소·이탈에서만 줄인다.
- 공식 현장 줄서기·실시간 연동·확정된 제휴 혜택으로 오인시키지 않는다. UI에는 긴 `시연` 설명 대신 작은 `체험용` 표시를 둔다.
- 관리자 PIN을 통과해야 매장용 인원·쿠폰·입장 인증 화면을 사용할 수 있다. PIN 검증 정보는 `expo-secure-store`에 둔다. Git에 넣지 않은 로컬 빌드 설정의 초기 설정 코드 검증 해시를 요구하며, 재실행 시 잠근다.
- 원본 Figma의 전폭 사진, 흰 바탕, 주황색, 숫자 카드, 상단 지도/하단 목록, 하단 탭을 유지한다.
- 사용자가 직접 대기시간을 입력하거나 앱이 인원만으로 확정 입장 시각을 계산하지 않는다.
- iPhone 실기기 설치·실행까지 확인한다. 기존 `fa40006`까지의 일회성 main push 이후 추가 GitHub push는 하지 않는다.

## Review Focus

- 전체 인원을 내 번호보다 낮게 수동 수정해도 내 번호·앞사람 수·다음 발급 번호가 유지된다: Task 1 테스트.
- 중복 줄서기·잘못된 지점·반복 `앞사람 처리`가 음수 인원이나 중복 인증을 만들지 않는다: Task 1 테스트.
- 저장 v1의 수동 시간 대기가 새 활성 줄서기로 부활하지 않는다: Task 2 테스트.
- 지점 전환 뒤 이전 지점 가게·쿠폰이 현재 지점의 추천으로 섞이지 않는다: Task 3 테스트.
- PIN 오류·미설정·재실행 시 매장용 조작이 열리지 않는다: Task 4 테스트.

---

### Task 1: 지점별 대기·입장 도메인

**Files:**
- Create: `src/data/branches.ts` — 4개 지점의 ID·명칭·공식 주소·확인한 좌표.
- Modify: `src/domain/demo.ts` — 상태와 대기 전이, 쿠폰 유효성.
- Test: `tests/demo.test.mjs` — 기존 시간 기반 테스트를 교체.

**Interfaces:**
- Produces: `BranchId`, `BRANCHES`, `joinQueue(state, branchId, leaveAllowed, now)`, `setQueueCount(state, branchId, count)`, `processAhead(state, branchId)`, `cancelQueue(state, now)`, `verifyEntry(state, branchId, code, now)`, `peopleAhead(state)`.
- `WaitSession`에는 `branchId`, `ticketNumber`, `peopleAhead`, `entryCode`, `status`를 보관한다. `DemoState.queueCounts`, `DemoState.nextTicketNumbers`, `DemoState.selectedBranchId`는 서로 다른 상태다.

- [ ] **Step 1: 실패 테스트 작성** — 4개 지점 분리, 지점별 다음 번호의 중복 없는 단조 증가, 12명 뒤 접수 시 앞사람 12명, 전체 인원 1명으로 수동 수정해도 발급 번호·앞사람·다음 번호 유지, `앞사람 처리`만 감소, 0명 때 QR 활성화, 지점 오류·중복 QR 거절, 중복 줄서기·음수 방지를 단언한다. 지점 선택만 바꿔도 활성 등록 지점이 유지됨을 단언한다.
- [ ] **Step 2: 실패 확인** — `npm test`에서 새 함수/동작 테스트가 실패해야 한다.
- [ ] **Step 3: 최소 구현** — 큐 전체 수와 개인 앞사람 수를 분리하고 입장 코드를 1회 소비한다. 종료 시 미사용 쿠폰 만료, 시간 기반 자격·알림 계산 제거.
- [ ] **Step 4: 통과 확인** — `npm test` 전체 통과.
- [ ] **Step 5: 커밋** — `feat: add branch queue and entry verification domain`.

### Task 2: 영속 상태와 알림 전환

**Files:**
- Create: `src/state/queueRepository.ts` — `load`·`save` 저장소 인터페이스와 AsyncStorage 구현.
- Modify: `src/state/demo.tsx` — 새 도메인 API, 직렬화/복원, 연속 탭 안전성.
- Modify: `src/notifications/reminders.ts` — 예정시각 알림 제거, 관측한 순번 변경 안내만 사용.
- Test: `tests/demo.test.mjs` — v1 복원 및 v2 round-trip.

**Interfaces:**
- Consumes: Task 1의 전이 함수와 `DemoState`.
- Produces: `QueueRepository` 인터페이스와 `useDemo()`의 `join`, `setCount`, `advance`, `cancel`, `verifyEntry`, `selectBranch` 및 기존 일정·쿠폰 메서드.

- [ ] **Step 1: 실패 테스트 작성** — v1의 `endsAt` 대기는 활성화되지 않고 쿠폰/편집 데이터가 가능한 범위에서 보존되며, 새 버전 저장 후 선택 지점·등록 지점·전체 인원·다음 번호·개인 앞사람 수가 복구됨을 단언한다.
- [ ] **Step 2: 실패 확인** — `npm test`에서 해당 테스트 실패.
- [ ] **Step 3: 최소 구현** — 도메인 밖 `QueueRepository`를 주입 가능하게 두고 AsyncStorage 구현으로 저장 버전을 올린다. 쓰기를 직렬화하며 1초 타이머와 확정 복귀 시각 예약을 제거한다.
- [ ] **Step 4: 통과 확인** — `npm test`, TypeScript 검사 통과.
- [ ] **Step 5: 커밋** — `feat: persist branch queue state`.

### Task 3: 지점별 로컬 가게·쿠폰 데이터

**Files:**
- Modify: `src/data/stores.ts` — 지점 ID, 확인된 위치, 기존 Figma 가게 유지, 중복 가게 제거.
- Modify: `src/domain/demo.ts` — 현재 지점 필터·쿠폰 자격/만료.
- Test: `tests/demo.test.mjs` — 지점별 추천·쿠폰.

**Interfaces:**
- Produces: `storesForBranch(branchId)`, 지점별 `eligibleStores(state)`, 해당 지점 쿠폰 발급 및 1회 사용.

- [ ] **Step 1: 실패 테스트 작성** — 네 지점 각각 주변 가게 2곳 이상, 선택 지점과 실제 등록 지점이 달라도 쿠폰 자격은 등록 지점 기준, 다른 지점의 가게 제외, 앱 내 줄서기 중 1회 발급/1회 사용·중복 거절·종료 후 만료를 단언한다.
- [ ] **Step 2: 실패 확인** — `npm test`에서 지점 필터/쿠폰 테스트 실패.
- [ ] **Step 3: 최소 구현** — 공개된 위치로 확인한 각 지점 주변 가게를 등록한다. 매장 사진·좌표가 불확실하면 일반 대체 이미지를 쓰고 그 가게의 지도 핀은 생략한다. 실제 제휴 할인처럼 보이지 않게 `체험용`·`앱 내 쿠폰`으로 표시한다.
- [ ] **Step 4: 통과 확인** — `npm test` 통과, 데이터 출처·거리 확인.
- [ ] **Step 5: 커밋** — `feat: show local shops for every branch`.

### Task 4: 매장용 PIN과 QR 인증

**Files:**
- Create: `src/domain/admin.ts` — PIN 형식·해시 검증 순수 함수.
- Create: `src/state/adminCredentials.ts` — expo-secure-store 기반 PIN 검증 정보 저장과 별도 초기 설정 경계.
- Modify: `src/state/demo.tsx` — PIN 설정/확인 상태, 매장용 조작 잠금.
- Modify: `src/app/merchant.tsx` — PIN 잠금, 지점별 수 조정·앞사람 처리·혜택 관리.
- Modify: `src/app/merchant-scanner.tsx` — 쿠폰과 입장 QR 스캔/수동 코드 인증.
- Test: `tests/admin.test.mjs`, `tests/demo.test.mjs`.

**Interfaces:**
- Produces: `setAdminPin`, `unlockAdmin`, `lockAdmin`, 관리자 전용 `setCount`, `advance`, `verifyEntry`, `redeem`.

- [ ] **Step 1: 실패 테스트 작성** — 초기 설정 코드 오류·누락 시 PIN 등록 거절, 설정 코드 재사용 거절, 유효 PIN 설정/오류/복원, 잠긴 상태 조작 거절, 재실행 잠금, 쿠폰/입장 QR 중복 사용 거절을 단언한다.
- [ ] **Step 2: 실패 확인** — `npm test`에서 PIN·인증 테스트 실패.
- [ ] **Step 3: 최소 구현** — 일반 매장 화면과 분리된 초기 설정에서 설정 자격 확인 후 PIN 등록. PIN 검증 정보는 `expo-secure-store`에 보관하고 앱 재실행 시 잠근다. QR은 같은 기기의 카메라 스캔 또는 수동 코드 입력으로 인증한다.
- [ ] **Step 4: 통과 확인** — `npm test`, TypeScript 검사 통과.
- [ ] **Step 5: 커밋** — `feat: protect merchant actions with PIN and verify QR`.

### Task 5: Figma형 홈·실지도·탭 레이아웃

**Files:**
- Modify: `src/app/index.tsx` — 사진/지점 선택/대기 카드/추천.
- Modify: `src/app/search/index.tsx`, `src/components/DemoMap.tsx` — Apple Maps와 지점 마커, 핀치·드래그·줌 버튼.
- Modify: `src/components/TabBar.ios.tsx`, `src/components/TabBar.tsx`, `src/components/ui.tsx`, `src/app/_layout.tsx` — 하단 바 레이아웃과 스크롤 여백.
- Modify: `package.json`, lockfile — `expo-maps` 추가.

**Interfaces:**
- Consumes: Task 1~3의 지점·인원·가게 선택 API.
- Produces: 지도 마커 선택으로 현재 지점 변경, 홈에서 선택 지점 줄서기, 스크롤 끝 콘텐츠와 탭 바 비겹침.

- [ ] **Step 1: 실패 확인 기준 작성** — 실기기에서 핀치·드래그·마커·줌 버튼이 반응하고, 지원되지 않는 iOS 지도 기능에는 지점 목록 대체 UI가 나타나며, 홈 최하단 가게/버튼이 하단 바 위로 완전히 스크롤되는지 확인하는 수동 체크를 기록한다.
- [ ] **Step 2: 현재 실패 재현** — 기존 정적 지도와 홈 겹침을 iPhone/시뮬레이터에서 확인한다.
- [ ] **Step 3: 최소 구현** — Figma 프레임 `142:365`, `88:121`의 구성에 맞게 전폭 사진·흰 카드·상단 지도+흰 시트를 적용하고 Apple Maps 네이티브 상호작용을 연결한다. 마커 지원이 없는 iOS에서는 동일 지점을 고를 수 있는 목록을 제공한다.
- [ ] **Step 4: 통과 확인** — TypeScript/lint, 스크린샷 대조, 실기기 제스처/탭/스크롤 확인.
- [ ] **Step 5: 커밋** — `feat: add interactive branch map and figma queue home`.

### Task 6: 가게·일정·쿠폰·입장 화면 완결

**Files:**
- Modify: `src/app/search/nearby.tsx`, `src/app/search/detail.tsx`, `src/app/schedule.tsx`, `src/app/wallet.tsx`, `src/app/settings.tsx`, `src/components/ui.tsx`.
- Modify: `README.md` — 기기 내 대기/쿠폰/관리자 PIN의 범위만 간단히 명시.

**Interfaces:**
- Consumes: Task 1~5의 provider API와 지점별 가게 데이터.
- Produces: 가게 탐색→쿠폰 발급→매장용 인증, 줄서기→앞사람 처리→입장 QR→매장용 인증의 완결 UI.

- [ ] **Step 1: 실패 확인 기준 작성** — 네 지점 각각 탐색·상세·쿠폰 발급, 일정 추가/삭제, 내 차례 전 QR 숨김, 내 차례 후 QR 표시, 수동 코드/QR 인증 후 완료, 긴 `시연` 문구 검색 결과 0건과 작은 `체험용` 표시를 수동/자동 점검 항목으로 정한다.
- [ ] **Step 2: 현재 실패 재현** — 시간 입력/고정 지도/시연 문구와 QR 흐름 누락을 확인한다.
- [ ] **Step 3: 최소 구현** — Figma 프레임 `178:1137`, `151:613`, `169:882`, `169:776`의 목록·상세·QR 팝업을 살리고, 원본의 미루기/시간 문구는 앞사람 수·취소·인증으로 치환한다.
- [ ] **Step 4: 통과 확인** — `npm test`, TypeScript, lint, iOS Release 빌드, iPhone 설치·실행과 대기→순번 처리→입장 QR→완료 및 가게 선택→쿠폰 발급→관리자 인증→사용 완료 시나리오 확인. 실기기에서 실패한 항목은 미검증으로 보고한다.
- [ ] **Step 5: 커밋** — `feat: complete local discovery coupon and entry flows`.

## Self-Review

모든 요구는 Task 1~6에 배치했다. 지점/개인 순서 분리, 저장 전환, 네 지점 가게, PIN, 지도·레이아웃, 전체 UI는 각각 독립 검증 단계가 있다. 기본값·PIN 복구·타 지점 데이터 혼합·QR 재사용·화면 겹침은 Review Focus와 각 소유 Task에 연결했다.

