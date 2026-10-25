# ONLINE Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Manually registered wait to local store visit, coupon redemption and return reminder on one phone.

**Architecture:** A persisted demo state holds waiting, itinerary, offers, and coupons. Pure domain functions enforce eligibility and single use. Expo Router screens render the flow; local notifications and camera are optional device integrations.

**Tech Stack:** Expo 58, React Native, TypeScript, Expo Router, AsyncStorage, Expo notifications/camera/crypto, react-native-qrcode-svg.

**Spec:** docs/superpowers/specs/2026-10-25-online-demo-design.md

## Global Constraints
- Anchor selection begins with 성심당 본점 in 대전 은행동.
- User enters expected minutes; there is no live wait integration or entry QR.
- No leaving recommendation until user confirms the queue permits leaving.
- Coupons are demo-only and locally verifiable on the same device.
- Preserve orange/Pretendard and Liquid Glass iOS bottom navigation.
- Preserve existing changes, build iOS Release, install on connected iPhone.

## Review Focus
- Restored stale wait must not show a live queue number.
- An over-budget itinerary must not silently imply it is safe.
- Redeeming used/expired/wrong-store coupon must fail.
- Two rapid redemption attempts must not both succeed.
- Changing an offer must not change an issued coupon's terms.

---

### Task 1: Domain and persistence
**Files:** src/domain/demo.ts, src/state/demo.tsx, tests/demo.test.mjs
**Interfaces:** DemoState; startWait, addStop, removeStop, moveStop, issueCoupon, redeemCoupon, endWait, updateOffer; waitRemaining, itineraryBudget, eligibleStores.
- [x] Write tests for wait confirmation, budget, issue/use/expiry, bad scans and offer snapshot.
- [x] Run tests and confirm failures.
- [x] Implement pure domain transitions and persistence provider.
- [x] Run tests and confirm passes.
- [x] Include files in final local commit.

### Task 2: Navigation and consumer screens
**Files:** src/app/_layout.tsx, src/components/TabBar*.tsx, src/app/index.tsx, src/app/search/*.tsx, src/app/schedule.tsx, src/app/settings.tsx, src/app/wallet.tsx, src/components/ui.tsx
**Interfaces:** Consume DemoState/actions from Task 1.
- [x] Create home/manual wait; responsive discovery/list/detail; itinerary; wallet/settings.
- [x] Exercise via navigation and snapshots.
- [x] Include files in final local commit.

### Task 3: Merchant scan, offers, reminders
**Files:** src/app/merchant*.tsx, src/notifications/reminders.ts, app.json, package files
**Interfaces:** redeemCoupon and updateOffer transitions from Task 1.
- [x] Add real QR encoding, camera/manual same-device validation, offers and history.
- [x] Add opt-in local return notification lifecycle.
- [x] Run domain tests and screen checks.
- [x] Include files in final local commit.

### Task 4: Release verification
**Files:** README.md
- [x] Run lint, typecheck, tests, and iOS Release build; Expo doctor was not needed.
- [x] Install and launch on connected iPhone; inspect screenshots.
- [x] Document demo limitations and proposed backend/maps.
