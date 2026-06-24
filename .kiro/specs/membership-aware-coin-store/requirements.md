# Requirements Document

## Introduction

This feature adds membership-aware plan display logic to the CoinStoreMobile component. When the coin store page loads in the webview, it checks the user's membership status via the user details API. Members see the existing coin pack experience (timer-based limited offer, exclusive deals, top plans). Non-members see subscription plans (weekly plan in the Limited Offer slot, and a new Weekly Plans section above Exclusive Deals) fetched from the monetization plans API. The subscription plan purchase reuses the existing payment gateway flow (PhonePe/Easebuzz).

## Glossary

- **Coin_Store_Page**: The mobile coin store webview rendered by the CoinsPage component, opened in the app's webview with URL parameters including JWT, organisation_id, user info, device info, app info, and payment_gateway.
- **CoinStoreMobile_Component**: The presentational React component that renders Limited Offer, Exclusive Deals, and Top Plans sections.
- **Membership_API**: The GET endpoint at `/api/v1/user_center/details/get-user-details/` that returns user details including the `is_member` boolean field.
- **Plans_API**: The GET endpoint at `${HOST}/api/v1/monetization/plans/details/?plan_ids=8,5` that returns subscription plan details for non-members.
- **Weekly_Plan_8**: The subscription plan with plan_id=8, displayed in the Limited Offer box for non-members.
- **Weekly_Plan_5**: The subscription plan with plan_id=5, displayed in a new Weekly Plans section for non-members.
- **Payment_Flow**: The existing order creation and payment initiation flow (createCoinOrder → initiatePayment → PhonePe/Easebuzz checkout) used for coin pack purchases.
- **JWT**: The JSON Web Token extracted from the `id` URL parameter or localStorage, used for API authentication via the `Authorization: Bearer <jwt>` header.
- **Organisation_ID**: The organisation identifier extracted from the `organisation_id` URL parameter, sent as the `X-Organisation-ID` header.

## Requirements

### Requirement 1: Fetch Membership Status on Page Load

**User Story:** As a user opening the coin store, I want the page to determine my membership status, so that I see the correct plans or coin packs for my account type.

#### Acceptance Criteria

1. WHEN the Coin_Store_Page mounts, THE Coin_Store_Page SHALL call the Membership_API at GET `/api/v1/user_center/details/get-user-details/` with the `Authorization: Bearer <JWT>` header (where JWT is the `id` URL parameter sanitized for ISO-8859-1 compatibility) and the `X-Organisation-ID` header (where Organisation_ID is resolved from the `organisation_id` URL parameter, defaulting to the configured default Organisation_ID when absent or unrecognized).
2. WHEN the Membership_API returns an HTTP 200 response containing a JSON body with the field `data.is_member`, THE Coin_Store_Page SHALL extract the `is_member` boolean value and use it to determine whether to display membership plans or coin packs.
3. IF the `id` URL parameter is missing or empty, THEN THE Coin_Store_Page SHALL treat the user as a member and display the default coin pack experience without calling the Membership_API.
4. IF the Membership_API call fails due to a network error, returns a non-2xx HTTP status, or does not respond within 10 seconds, THEN THE Coin_Store_Page SHALL treat the user as a member and display the default coin pack experience.
5. WHILE the Membership_API call is in progress, THE Coin_Store_Page SHALL display a full-page loading indicator and SHALL NOT render coin packs or membership plans until the call completes or times out.

### Requirement 2: Display Coin Packs for Members

**User Story:** As a member, I want to see the existing coin pack experience (limited offer with timer, exclusive deals, top plans), so that I can recharge my wallet as usual.

#### Acceptance Criteria

1. WHEN the `is_member` value is `true` and `timerPack` is not null, THE CoinStoreMobile_Component SHALL display the LimitedOfferCard with a countdown timer, the coin amount, any bonus coins, and the price from the timer pack data.
2. WHEN the `is_member` value is `true` and `exclusiveDeals` contains one or more packs, THE CoinStoreMobile_Component SHALL display the "Exclusive Deals" section heading and one ExclusiveDealCard per pack, each showing the coin amount, bonus percentage badge (if bonus > 0), and price.
3. WHEN the `is_member` value is `true` and `topPlans` contains one or more packs, THE CoinStoreMobile_Component SHALL display the "Top Plans" section heading and one TopPlanCard per pack, each showing the coin amount, bonus coins (if bonus > 0), and price.
4. WHEN the `is_member` value is `true`, THE CoinStoreMobile_Component SHALL NOT render any subscription plan elements, including plan details cards, autopay disclosures, mandate initiation controls, or payment method selection for subscriptions.
5. WHEN the `is_member` value is `true` and a coin pack is selected, THE CoinStoreMobile_Component SHALL enable the "Recharge Now" button in the fixed bottom bar.

### Requirement 3: Fetch Subscription Plans for Non-Members

**User Story:** As a non-member, I want to see subscription plan options, so that I can subscribe to a weekly plan.

#### Acceptance Criteria

1. WHEN the `is_member` value is `false`, THE Coin_Store_Page SHALL call the Plans_API at `GET ${HOST}/api/v1/monetization/plans/details/?plan_ids=8,5` with the `Authorization: Bearer <JWT>` header and `X-Organisation-ID: <Organisation_ID>` header within 10 seconds of confirming non-member status.
2. WHEN the Plans_API returns a successful response containing both plan_id 8 and plan_id 5, THE Coin_Store_Page SHALL extract the plan name, price, and billing period for Weekly_Plan_8 and Weekly_Plan_5 from the response.
3. IF the Plans_API response contains only one of the two requested plans (plan_id 8 or plan_id 5), THEN THE Coin_Store_Page SHALL display only the plan that was returned and omit the missing plan without showing an error.
4. IF the Plans_API call fails due to a network error, returns an HTTP status outside the 2xx range, or does not respond within 10 seconds, THEN THE Coin_Store_Page SHALL fall back to displaying the default coin pack experience (the same coin pack grid shown to members).
5. IF the JWT is unavailable or the Organisation_ID is unavailable at the time `is_member` is determined to be `false`, THEN THE Coin_Store_Page SHALL skip the Plans_API call and fall back to displaying the default coin pack experience.

### Requirement 4: Display Weekly Plan in Limited Offer Box for Non-Members

**User Story:** As a non-member, I want to see the weekly subscription plan (plan_id=8) prominently in the Limited Offer section, so that I can easily discover and purchase it.

#### Acceptance Criteria

1. WHEN the `is_member` value is `false` and Weekly_Plan_8 data is present in the Plans_API response, THE CoinStoreMobile_Component SHALL display Weekly_Plan_8 in the Limited Offer card slot using the same gradient background and visual prominence as the existing LimitedOfferCard.
2. WHEN displaying Weekly_Plan_8 in the Limited Offer slot, THE CoinStoreMobile_Component SHALL show the plan name, price (formatted as "₹ {amount}"), and billing period (e.g., "Weekly") from the Plans_API response.
3. WHEN displaying Weekly_Plan_8 in the Limited Offer slot, THE CoinStoreMobile_Component SHALL NOT display the countdown timer or stopwatch icon.
4. IF the `is_member` value is `false` but Weekly_Plan_8 is not present in the Plans_API response, THEN THE CoinStoreMobile_Component SHALL hide the Limited Offer card slot entirely.
5. WHEN the user taps the Weekly_Plan_8 Limited Offer card, THE CoinStoreMobile_Component SHALL set the selectedPackageId state to the Weekly_Plan_8 pack id and render a visual selection indicator (ring highlight) on the card.

### Requirement 5: Display Weekly Plans Section for Non-Members

**User Story:** As a non-member, I want to see a Weekly Plans section with an additional subscription option, so that I have multiple plan choices.

#### Acceptance Criteria

1. WHEN the `is_member` value is `false` and Weekly_Plan_5 data is present in the Plans_API response, THE CoinStoreMobile_Component SHALL render a "Weekly Plans" section positioned below the Limited Offer card and above the Exclusive Deals section.
2. IF the `is_member` value is `true` OR Weekly_Plan_5 data is not present in the Plans_API response, THEN THE CoinStoreMobile_Component SHALL NOT render the "Weekly Plans" section.
3. WHILE the "Weekly Plans" section is rendered, THE CoinStoreMobile_Component SHALL display Weekly_Plan_5 as a single card showing the plan name, price (formatted as "₹ {amount}"), and plan duration as provided in the Plans_API response.
4. WHEN the user taps the Weekly_Plan_5 card in the Weekly Plans section, THE CoinStoreMobile_Component SHALL set the selectedPackageId state to the Weekly_Plan_5 pack id and render a visual selection indicator (ring highlight) on the card, enabling the "Recharge Now" button.
5. WHEN the user selects a different package from any other section after selecting Weekly_Plan_5, THE CoinStoreMobile_Component SHALL remove the selection indicator from the Weekly_Plan_5 card and apply it to the newly selected package.

### Requirement 6: Subscription Plan Payment Flow

**User Story:** As a non-member selecting a subscription plan, I want the purchase to use the same payment flow as coin recharges, so that I have a consistent payment experience.

#### Acceptance Criteria

1. WHEN the user selects a subscription plan (Weekly_Plan_8 or Weekly_Plan_5) and taps "Recharge Now", THE Payment_Flow SHALL call POST `/api/v1.2/monetization/orders/create/` with the plan's `id` as the `coin_pack_id` field and the `payment_gateway` value from the URL parameter.
2. WHEN the order creation endpoint returns a successful response with an `order_uuid`, THE Payment_Flow SHALL call POST `/api/v1.2/monetization/orders/initiate-payment/` with the `order_uuid` to obtain the payment redirect URL or token.
3. WHEN payment initiation succeeds and the `payment_gateway` URL parameter is "PhonePe", THE Payment_Flow SHALL launch the PhonePe iframe checkout using the same `phonePeIframeCheckout` utility as coin pack purchases.
4. WHEN payment initiation succeeds and the `payment_gateway` URL parameter is "Easebuzz", THE Payment_Flow SHALL launch the Easebuzz SDK checkout using the access key extracted from the initiation response.
5. WHEN the payment checkout completes (success, failure, or user cancellation), THE Payment_Flow SHALL poll POST `/api/v1.2/monetization/orders/details/` (PhonePe) or POST `/api/v1.2/monetization/easebuzz/payment/validate/` (Easebuzz) with the `order_uuid` at 5-second intervals for up to 8 attempts, and display the payment result (success/failed/pending modal) to the user.

### Requirement 7: Preserve Existing Coin Pack Sections for Non-Members

**User Story:** As a non-member, I want to still see the Exclusive Deals and Top Plans coin pack sections below the subscription plans, so that I can choose to buy coins instead.

#### Acceptance Criteria

1. WHEN the `is_member` value is `false`, THE CoinStoreMobile_Component SHALL render the Exclusive Deals section with existing coin packs below the Weekly Plans section, using the same ExclusiveDealCard components and data as the member view.
2. WHEN the `is_member` value is `false`, THE CoinStoreMobile_Component SHALL render the Top Plans section with existing coin packs below the Exclusive Deals section, using the same TopPlanCard components and data as the member view.
3. WHEN the `is_member` value is `false`, THE page layout order from top to bottom SHALL be: Limited Offer (Weekly_Plan_8) → Weekly Plans (Weekly_Plan_5) → Exclusive Deals (coin packs) → Top Plans (coin packs).
4. WHEN a non-member selects a coin pack from Exclusive Deals or Top Plans, THE CoinStoreMobile_Component SHALL deselect any previously selected subscription plan and mark the coin pack as selected, enabling the "Recharge Now" button.
