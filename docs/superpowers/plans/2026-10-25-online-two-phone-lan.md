# ONLINE Two-iPhone LAN Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link one customer iPhone and one merchant iPhone to a Mac on the same Wi-Fi so queue, coupon, and one-time QR actions are shared during filming.

**Architecture:** A Node HTTP server owns a small queue/commerce aggregate and atomically persists it on the Mac. Each phone pairs for exactly one role; an app-side transport merges server queue/commerce into its local presentation state while keeping branch selection and legacy local records separate. Shared-mode writes are server-only and fail closed when disconnected.

**Tech Stack:** Expo 58, React Native 0.88, TypeScript, Node 25 built-ins (`http`, `crypto`, `fs`), Expo SecureStore, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-25-online-two-phone-lan-design.md`

## Global Constraints

- Only one customer phone and one merchant phone, both on the Mac's Wi-Fi. No cloud, official store integration, real discount, or automated penalty.
- Preserve existing Figma-inspired screens; no `체험용` label. Keep `실제 할인 없음` on coupons.
- Pair-code reissue preserves queue/coupons but revokes the old token of that role. Explicit full reset removes queue/coupons/use history and both tokens. Never merge old device records into shared state.
- Only server state can authorize shared-mode writes. All changed endpoints require the correct role; PIN remains local to the merchant phone; token is in SecureStore.
- On disconnection shared-mode mutations are disabled; do not fall back to the local repository. Branch selection remains device-local.
- New consent copy is exact as in the spec, underlined in black, and the join button stays disabled until checked; consent permits the app's visit/coupon flow.
- Do not push to GitHub without another request. Do not claim two-device testing unless two real iPhones were exercised.

## Review Focus

- Pairing with malformed/expired/used codes must fail without revealing which part was wrong (Task 2 tests).
- Reissue/reset while a phone is open must invalidate that session on its next request (Task 2 tests; Task 4 UI test).
- Rapid duplicate coupon/entry redemption must commit only once (Task 1 and Task 2 tests).
- Switching the selected branch must not alter the server-registered branch or show another branch's coupon (Task 3 and Task 4 tests).
- A write attempted during an outage must not update local queue/commerce, and must not replay silently after reconnection (Task 3 and Task 4 tests).

---

### Task 1: Server-owned queue and commerce transitions

**Files:**
- Create: `server/sharedState.mjs`
- Test: `tests/shared-state.test.mjs`

**Interfaces:**
- Consumes: `createQueueState`, `joinQueue`, `setQueueCount`, `processAhead`, `cancelQueue`, `verifyEntry` from `src/domain/queue.ts`; `createCommerceState`, `issueCoupon`, `redeemCoupon`, `expireCoupons` from `src/domain/commerce.ts`.
- Produces: `createSharedState()`, `applyAction(state, role, action, now)` returning `{ state, reason?, result? }`; action names `join`, `cancel`, `setCount`, `advance`, `verifyEntry`, `issueCoupon`, `redeemCoupon`. `result` carries the newly issued coupon code when relevant.

- [ ] **Step 1: Write failing tests** for join/advance/entry completion, duplicate entry/coupon rejection, independent branch counters, manual count change preserving ticket/peopleAhead, wrong role/branch/store, and selected-branch isolation. Use two independent action callers against one state object.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/shared-state.test.mjs`; **Expected:** FAIL because `server/sharedState.mjs` is missing.
- [ ] **Step 3: Implement** the exported functions; validate action payload and role before calling existing pure domain transitions. Keep server `selectedBranchId` implementation-only; clients must not receive it as authority for their UI selection. Generate entry/coupon codes with `crypto.randomUUID()` and preserve one-use histories.
- [ ] **Step 4: Run** the focused test; **Expected:** all tests PASS.
- [ ] **Step 5: Commit** `server/sharedState.mjs` and its tests as `feat: add shared demo queue transitions`.

### Task 2: Persistent LAN service and pairing lifecycle

**Files:**
- Create: `server/service.mjs`, `server/cli.mjs`
- Modify: `.gitignore`, `package.json`
- Test: `tests/lan-service.test.mjs`

**Interfaces:**
- Consumes: Task 1 `createSharedState`, `applyAction`.
- Produces: `createLanService({ dataPath, host, port, now })` with `listen`, `close`, `reissue(role)`, `reset()`; HTTP `POST /pair` `{code}`, `GET /state`, `POST /action` `{type,...}`. Customer projections include only their wait/coupons; merchant projections include branch counts but never customer QR/coupon codes. Neither projection includes pairing codes or tokens. `server/cli.mjs start` keeps a Mac terminal open and accepts separate `reissue customer|merchant` and `reset --confirm-reset` commands on its stdin, calling the live service rather than editing its data file behind its back.

- [ ] **Step 1: Write failing tests** using temporary directories and ephemeral ports: customer/merchant pairing, wrong-role action rejection, expired/used code rejection, duplicate redemption, persistence after service restart, reissue retaining records but revoking old role token, and full reset revoking both tokens and clearing records.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/lan-service.test.mjs`; **Expected:** FAIL because the service module is missing.
- [ ] **Step 3: Implement** Node HTTP routes, cryptographically random single-use short-lived codes, role-specific tokens, request body limits, action serialization, and atomic save by write-then-rename. Bind to `0.0.0.0` but print the Mac's selected reachable Wi-Fi address and port, never `0.0.0.0` as the phone URL. Keep reissue/reset on the running service's stdin; refuse reset without `--confirm-reset`. Ignore the runtime data file and add the documented npm start command.
- [ ] **Step 4: Run** the focused service tests; **Expected:** all tests PASS.
- [ ] **Step 5: Commit** service, CLI, scripts, ignore rule and tests as `feat: add persistent LAN pairing service`.

### Task 3: Phone transport, protected pairing, and repository boundary

**Files:**
- Create: `src/state/lanClient.ts`, `src/state/lanSession.ts`
- Modify: `src/state/queueRepository.ts`, `app.json`
- Test: `tests/lan-client.test.mjs`

**Interfaces:**
- Consumes: Task 2 HTTP contract.
- Produces: `createLanClient(baseUrl, token, fetchImpl)` with `read()` and `act(action)` returning typed server results; `createLanSessionStore(secureStorage)` with `load`, `save`, `clear`, plus a production instance backed by Expo SecureStore. Local queue repository remains unmodified by shared snapshots.

- [ ] **Step 1: Write failing transport tests** for correct URL/role token, malformed address, timeout/network error, 401 revoked session, and failed action not mutating or enqueueing local data. Include a repository test proving old local records still load after shared mode is stopped.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/lan-client.test.mjs`; **Expected:** FAIL because transport is missing.
- [ ] **Step 3: Implement** typed JSON client and protected session store; configure iOS local-network usage text and a local-only ATS allowance through Expo config, after checking versioned Expo 58 and Apple docs. Do not include secrets in log messages.
- [ ] **Step 4: Run** focused tests plus `npm run typecheck`; **Expected:** PASS.
- [ ] **Step 5: Commit** as `feat: add protected LAN client session`.

### Task 4: Shared-mode app flow and screens

**Files:**
- Modify: `src/state/demo.tsx`, `src/flows/join.ts`, `src/app/settings.tsx`, `src/app/index.tsx`, `src/app/search/index.tsx`, `src/app/search/detail.tsx`, `src/app/schedule.tsx`, `src/app/wallet.tsx`, `src/app/merchant.tsx`, `src/app/merchant-scanner.tsx`
- Test: `tests/lan-flow.test.mjs`, `tests/join-navigation.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–3 HTTP contract and client/session interfaces; existing `useDemo()` presentation contract.
- Produces: `useDemo()` pairing status/actions (`connectCustomer`, `connectMerchant`, `disconnectLan`, `connection`), async server-backed join/cancel/count/advance/entry/coupon methods, polling every 1 second while foregrounded, and concise settings UI for Mac address/code/role/status.

- [ ] **Step 1: Write failing tests** for shared join→advance→entry and coupon issuance→redemption across independent clients; rejected/revoked/offline calls must leave presentation state unchanged; selecting a different branch must retain the active wait branch and coupon scope. Update navigation test for async join.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/lan-flow.test.mjs tests/join-navigation.test.mjs`; **Expected:** FAIL because shared-mode flow is missing.
- [ ] **Step 3: Integrate** server-backed operations into the provider without persisting server queue/commerce locally. Render connection status and role in settings, refuse actions while offline, and keep merchant PIN gate on both manual and scanner paths. Update async button callbacks with pending/disabled states and remove the outdated `이 기기에서만 인증` copy in shared mode.
- [ ] **Step 4: Run** focused flow tests, `npm test`, `npm run typecheck`, `npm run lint`; **Expected:** all PASS.
- [ ] **Step 5: Commit** as `feat: link customer and merchant phones over LAN`.

### Task 5: End-to-end checks and shooting instructions

**Files:**
- Create: `docs/two-phone-shooting.md`
- Modify: existing files only to fix verified failures

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: concise Mac start/reissue/reset commands, pairing sequence for the two roles, coupon and entry shooting sequences, and limitations; no secret values committed.

- [ ] **Step 1: Run** the full test suite, typecheck, lint, `git diff --check`, and iOS Release build; **Expected:** PASS.
- [ ] **Step 2: Test** the server from two independent HTTP clients end-to-end, including restart, reissue, reset, disconnect, and duplicate code rejection; **Expected:** correct role/state behavior.
- [ ] **Step 3: Install and test** on both physical iPhones if connected. If only one is available, test that one and mark the second-phone live flow unverified; never state it passed.
- [ ] **Step 4: Write** `docs/two-phone-shooting.md` with exact commands and safety/limitations; **Expected:** a user can repeat the setup without the implementer.
- [ ] **Step 5: Commit** instructions and any verified fixes as `docs: explain two-phone LAN filming`.
