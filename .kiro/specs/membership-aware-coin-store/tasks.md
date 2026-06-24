# Implementation Plan: Membership-Aware Coin Store

## Overview

This plan implements membership-aware logic in the coin store so non-members see subscription plans (Weekly Plans) alongside existing coin packs, while members see the unmodified coin pack experience. The implementation modifies `index.tsx` (CoinsPage) and `components/CoinStoreMobile.tsx`, adding API helpers, new state, new components, and conditional rendering logic.

## Tasks

- [x] 1. Add membership status fetch and state management in CoinsPage
  - [x] 1.1 Add `fetchMembershipStatus` helper function in `index.tsx`
    - Create the `MembershipStatusResult` type
    - Implement `fetchMembershipStatus(token, organisationId, signal)` that calls GET `/api/v1/user_center/details/get-user-details/` with `Authorization` and `X-Organisation-ID` headers
    - Return `{ isMember: Boolean(json?.data?.is_member) }`
    - Use existing `headerSafeToken` and `HOST` utilities
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Add `fetchSubscriptionPlans` helper function in `index.tsx`
    - Create the `SubscriptionPlan` type with `id`, `plan_name`, `price`, `plan_duration` fields
    - Implement `fetchSubscriptionPlans(token, organisationId, signal)` that calls GET `${HOST}/api/v1/monetization/plans/details/?plan_ids=8,5` with auth headers
    - Extract plan_id 8 and plan_id 5 from response `data` array, return `{ plan8, plan5 }` (either can be null)
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.3 Add membership check `useEffect` and state in CoinsPage component
    - Add state: `membershipLoading` (boolean, init `true`), `isMember` (boolean, init `true`), `weeklyPlan8` (SubscriptionPlan | null), `weeklyPlan5` (SubscriptionPlan | null)
    - Add `useEffect` with AbortController and 10-second timeout
    - If no token, skip API call, set `membershipLoading = false`
    - On success: set `isMember`, if non-member fetch plans; on plans failure fallback to `isMember = true`
    - On membership check failure/timeout: set `isMember = true`
    - Cleanup: abort controller and clear timeout on unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.4, 3.5_

- [x] 2. Update CoinStoreMobile component interface and add new plan components
  - [x] 2.1 Add `SubscriptionPlan` type and new props to `CoinStoreMobile`
    - Export `SubscriptionPlan` type from `CoinStoreMobile.tsx` (or define inline)
    - Extend `CoinStoreMobileProps` with `isMember: boolean`, `weeklyPlan8: SubscriptionPlan | null`, `weeklyPlan5: SubscriptionPlan | null`
    - Update the component function signature to destructure new props
    - _Requirements: 2.4, 4.1, 5.1_

  - [x] 2.2 Create `WeeklyPlanLimitedOfferCard` component in `CoinStoreMobile.tsx`
    - Render plan_id=8 in the Limited Offer visual slot with same gradient background (`bg-gradient-to-r from-[#FF5A3C] via-[#FF4D5E] to-[#FF7A52]`)
    - Show plan name, formatted price (₹ {amount}), and billing period (Weekly for 7 days)
    - Include sparkle decorations and "Limited offer" label
    - Do NOT render countdown timer or stopwatch icon
    - Support `selected` state with ring highlight
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 2.3 Create `WeeklyPlanCard` component in `CoinStoreMobile.tsx`
    - Render plan_id=5 as a card with dark background (`bg-[#0f1f3d]`)
    - Show plan name, formatted price (₹ {amount}), and plan duration
    - Support `selected` state with ring highlight (`ring-2 ring-[#3B82F6]/80`)
    - _Requirements: 5.3, 5.4_

- [x] 3. Update CoinStoreMobile render logic for conditional display
  - [x] 3.1 Update Limited Offer section rendering
    - When `isMember` is true and `timerPack` exists: render existing `LimitedOfferCard` (no change)
    - When `isMember` is false and `weeklyPlan8` exists: render `WeeklyPlanLimitedOfferCard`
    - When `isMember` is false and `weeklyPlan8` is null: hide the Limited Offer slot entirely
    - _Requirements: 2.1, 4.1, 4.4_

  - [x] 3.2 Add Weekly Plans section rendering for non-members
    - When `isMember` is false and `weeklyPlan5` exists: render a "Weekly Plans" section heading and `WeeklyPlanCard` below Limited Offer and above Exclusive Deals
    - When `isMember` is true or `weeklyPlan5` is null: do not render this section
    - _Requirements: 5.1, 5.2_

  - [x] 3.3 Ensure Exclusive Deals and Top Plans always render regardless of membership
    - Verify Exclusive Deals and Top Plans sections render for both member and non-member states
    - Non-member layout order: Limited Offer (plan 8) → Weekly Plans (plan 5) → Exclusive Deals → Top Plans
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Checkpoint - Verify conditional rendering
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Wire up plan selection and payment flow
  - [x] 5.1 Wire plan selection through `onPackSelect` handler
    - When a plan card is tapped, call `onPackSelect` with a `CoinStorePack`-compatible object: `{ id: plan.id, coins: 0, price: plan.price, name: plan.plan_name }`
    - Ensure selecting a plan deselects any coin pack and vice versa (mutual exclusion via `selectedPackageId`)
    - Enable "Recharge Now" button when any item is selected
    - _Requirements: 4.5, 5.4, 5.5, 7.4_

  - [x] 5.2 Wire subscription plan payment through `createOrderAndInitiatePayment`
    - When "Recharge Now" is tapped with a plan selected, pass `plan.id` as `coinPackId` to existing `createOrderAndInitiatePayment`
    - Backend interprets this as either coin_pack_id or plan_id in the same order creation endpoint
    - PhonePe and Easebuzz checkout paths remain unchanged
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Add loading state UI and pass new props from CoinsPage
  - [x] 6.1 Add full-page loading indicator while membership check is in progress
    - When `membershipLoading` is true, render a centered spinner/loading indicator on `bg-[#000D26]` background
    - Do not render `CoinStoreMobile` or any coin packs/plans until loading completes
    - _Requirements: 1.5_

  - [x] 6.2 Pass new props from CoinsPage to CoinStoreMobile
    - Pass `isMember`, `weeklyPlan8`, `weeklyPlan5` props from CoinsPage state to `CoinStoreMobile`
    - Ensure the component receives all required data for conditional rendering
    - _Requirements: 1.2, 2.4, 4.1, 5.1_

- [x] 7. Final checkpoint - Ensure everything is wired together
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- No test framework is currently set up in the project, so testing tasks are omitted
- The design reuses the existing `createOrderAndInitiatePayment` flow for plan purchases — no separate payment pipeline needed
- All new code lives in two existing files (`index.tsx` and `components/CoinStoreMobile.tsx`) keeping the change scope minimal
- The `SubscriptionPlan` type and helper functions are colocated with the components that use them
- Fallback behavior always defaults to the existing member coin pack experience to avoid blocking users

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "6.1", "6.2"] },
    { "id": 4, "tasks": ["5.2"] }
  ]
}
```
