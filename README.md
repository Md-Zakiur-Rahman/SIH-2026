# Arthniti Frontend Team Handoff

This document describes the current implementation of the Arthniti frontend and the integration seams for backend and platform work. It reflects the code in this repository first; the project README describes the intended future architecture where it differs.

## 1. Project Overview

Arthniti helps rural and local-business applicants understand their financing options. A user creates an account, enters location, business category, and margin capital, then receives a financial plan, repayment profile, feasibility report, PDF report, and conversational guidance.

Main user journey:

```text
/login -> /assessments -> /start -> /results -> /chat
                         ^           |
                         |           +--> PDF export and History
                         +-----------+
```

Bank officers use a separate `/bank` view for the SCA disbursement ledger.

Current stack:

- React and React DOM
- React Router
- Vite
- Recharts for the amortization chart
- jsPDF and html2canvas for PDF export
- Browser localStorage for mock auth and assessment history
- Fetch-based Gemini wrapper for the optional browser-side demo integration
- No Supabase, Algorand, or backend SDK dependency is currently installed

## 2. Current Routes

| Route | Audience | Protection | Current purpose |
| --- | --- | --- | --- |
| `/` | All | Public redirect | Sends authenticated bank users to `/bank`, authenticated normal users to `/assessments`, and others to `/login`. |
| `/login` | All | Public | Mock login for normal users and bank officers. |
| `/signup` | New users | Public | Creates a normal mock user and sends them to `/start`. |
| `/assessments` | Normal users | User role | Shows local assessment history and starts or opens an assessment. |
| `/start` | Normal users | User role | Fresh onboarding form for location, category, and margin capital. |
| `/results` | Normal users | User role | Financial Plan and Feasibility tabs. `?id=<assessmentId>` selects a historical assessment. |
| `/chat` | Normal users | User role | Chat page using `chatService`; Results also opens the chat overlay. |
| `/bank` | Bank role | Bank role | SCA ledger view with isolated mock disbursement service. |
| `/admin` | Admin | Not present | No admin route or page is currently implemented. The README describes this as optional future work. |

Route protection is implemented by `src/auth/ProtectedRoute.jsx`. The current auth provider is mock-based.

## 3. Current Feature Status

| Feature | Status | Current implementation |
| --- | --- | --- |
| Authentication | Implemented, mocked | `src/auth/mockAuth.js` stores demo users in localStorage. Supabase auth is a placeholder only. |
| Onboarding | Implemented, mocked | `/start` validates cascading location, category, and margin fields. Calculator and feasibility calls are mock unless explicitly enabled. |
| Financial Plan | Implemented | `/results` calculates and displays project cost, loan values, scheme, eligibility, and EMI. |
| Feasibility | Implemented with mock data | Results uses Dairy-specific mock content for Dairy and neutral translated content for other categories. |
| Repayment/amortization | Implemented | `src/lib/finance.js` builds monthly amortization and quarterly schedule data. |
| PDF export | Implemented | `FullReport.jsx` is captured with jsPDF/html2canvas and uses the selected plan and shared feasibility data. |
| Recent Assessments / History | Implemented, local only | Multiple records are stored in `arthniti_assessments`, newest first. |
| Gemini Chat | Implemented for demo | Mock responses remain available. When mocks are disabled and a key exists, `src/lib/gemini.js` calls Gemini from the browser. |
| Bank/SCA Ledger | Implemented as mock MVP | `/bank` uses `bankLedgerService.js`; no real transaction is created. |
| Admin | Not implemented | No `/admin` route exists. |

## 4. Assessment Data Flow

1. `/start` collects the form values and calls `generatePlan()` in `src/services/onboardingService.js`.
2. The service builds the API payload and calls `/api/feasibility` and `/api/calculator` through mock or live adapters.
3. A result receives a stable ID and `createdAt` timestamp.
4. The result is appended to `arthniti_assessments` in localStorage. Older records are retained.
5. `arthniti_onboarding` is also updated to the newest result for compatibility with existing code and the current Chat context.
6. `/start` navigates to `/results?id=<newId>`.
7. `/assessments` lists records newest first. View links use `/results?id=<assessmentId>`.
8. Results loads the exact ID when supplied; without an ID it loads the latest/current saved plan.
9. The selected assessment is the source of truth for Financial Plan, Feasibility, repayment data, and PDF export.

Legacy `arthniti_onboarding` data is migrated into `arthniti_assessments` when history is first read. Entries without IDs are normalized with stable generated IDs.

## 5. Finance Logic

Finance calculations live in `src/lib/finance.js`. Do not duplicate these calculations in page components or hardcode example values.

```text
Project Cost = Margin / 0.10
Loan Amount  = Project Cost x 0.90
Sanctioned Loan = min(Loan Amount, scheme maximum)
Repayment Months = (Tenure Years x 12) - Moratorium Months
```

The current scheme rules are:

- Project cost up to Rs 1,40,000: Micro Finance Scheme, 6.5%, 3 years, 3-month moratorium, maximum loan Rs 1,25,000.
- Project cost up to Rs 50,00,000: Term Loan Scheme, 8%, 7 years, 6-month moratorium, maximum loan Rs 45,00,000.
- Above Rs 50,00,000: not eligible and no normal EMI or repayment schedule.

EMI uses the standard amortization formula. Keep all finance behavior formula-driven.

## 6. Feasibility Logic

`src/lib/feasibility.js` is the shared feasibility data builder used by both:

- `src/pages/Results.jsx`
- `src/components/FullReport.jsx`

The builder selects the existing Dairy-specific mock dataset only when the selected category is exactly Dairy. All other supported categories, including Kirana Store and Textiles, use translated category-neutral mock content. The selected category and complete location are injected from the current assessment.

Do not simply replace the word Dairy with another category. That produces false claims such as milk buyers or fodder risks for a Kirana Store. If category-specific backend data becomes available, extend the builder or replace its data source while preserving the same shape:

```text
Market Reach, SWOT, Local Risks, Opportunity, Competition,
Pricing, Viability, Recommendations
```

Results and PDF must continue to use the same selected-assessment feasibility object.

## 7. Gemini / Chat Integration

The current path is:

```text
Chat.jsx -> src/services/chatService.js -> src/lib/gemini.js -> Gemini API
```

`chatService.js` preserves the mock path when `USE_MOCKS` is enabled. When mocks are disabled, `gemini.js` sends the message, recent chat history, and the system prompt to Gemini using `VITE_GEMINI_API_KEY` and `VITE_GEMINI_MODEL`.

Results passes the current plan and finance context into Chat. That context includes category, state/district/block, margin, project cost, loan data, eligibility, scheme, repayment values, and feasibility mock context.

The future backend seam is:

```text
Chat.jsx -> chatService -> POST /api/chat -> server-side Gemini
```

The current Vite key is browser-visible and is suitable only for a hackathon/demo. It is not a production secret mechanism. Never place service keys, private keys, or signing credentials in `VITE_*` variables.

## 8. API Contracts

The README defines these intended contracts:

```text
POST /api/calculator
body: { margin }
returns: { projectCost, loanAmount, sanctionedLoan, scheme, ... }

POST /api/feasibility
body: { location, business_category, margin }
returns: feasibility JSON

POST /api/chat
body: { message, history: [] }
returns: { reply }

GET /api/districts
returns: location tree
```

`src/config.js` exports `API_BASE`, sourced from `VITE_API_BASE_URL`. Onboarding uses `VITE_USE_ONBOARDING_API=true` to opt into the calculator/feasibility backend. Otherwise it uses local mocks. Chat uses `VITE_USE_MOCKS`; do not enable live calls accidentally in a shared demo environment.

## 9. Supabase

The README identifies `arthniti_applications` as the intended shared data source for WhatsApp, web, and future admin workflows. Expected columns are:

```text
phone, location, business_category, margin, project_cost,
loan_amount, sanctioned_loan, scheme, emi, eligible,
full_report, created_at
```

The current frontend is not migrated to Supabase. `src/auth/supabaseAuth.js` is a placeholder that throws `SUPABASE_NOT_CONFIGURED`, and no Supabase client is installed. Public project URL and anon key placeholders exist in `.env.example`, but they are not used by the current app.

When connecting Supabase, use RLS and the anon key only for permitted public operations. Never expose a service-role key in the browser.

## 10. Bank / Algorand

`/bank` is protected to the `bank` role and is intentionally isolated from the normal user flow. The page shows mock ledger rows with masked beneficiaries, Indian currency amounts, statuses, and no fake transaction hashes.

No real Algorand SDK, wallet, smart-contract function, contract address, node integration, or transaction recorder was found in the current project. `src/services/bankLedgerService.js` is the replacement boundary for the future integration.

The real bank-side implementation should replace `getBankLedger()` and `recordDisbursement()` there and return a verified transaction hash. Real hashes should link to the Algorand TestNet explorer. Never present a generated placeholder as a real on-chain transaction, and keep private keys, mnemonics, and signing credentials server-side.

## 11. Environment Variables

Placeholders are documented in `.env.example` and local environment files are protected by `.gitignore`.

| Variable | Purpose | Frontend-safe? |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL for the backend API. | Yes, if it is only a public endpoint. |
| `VITE_USE_MOCKS` | Selects mock versus Gemini chat behavior. | Yes. |
| `VITE_GEMINI_API_KEY` | Demo browser-side Gemini key. | Public in a Vite build; never treat as a production secret. |
| `VITE_GEMINI_MODEL` | Gemini model identifier. | Yes. |
| `VITE_SUPABASE_URL` | Public Supabase project URL placeholder. | Yes. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key placeholder, subject to RLS. | Public by design, but never a service-role key. |
| `VITE_ALGORAND_NETWORK` | Bank integration network, default `testnet`. | Yes. |
| `VITE_ALGORAND_NODE_URL` | Future public Algorand node URL. | Yes. |
| `VITE_ALGORAND_APP_ID` | Future public application ID. | Yes. |
| `VITE_USE_ONBOARDING_API` | Existing opt-in switch for live calculator/feasibility calls. | Yes. |

Never add private keys, mnemonics, seed phrases, wallet secrets, signing credentials, Supabase service-role keys, or backend-only API keys to `VITE_*` variables. `.env`, `.env.local`, and other local env variants are ignored; `.env.example` contains no secrets.

## 12. Internationalization

Translations live in `src/i18n.js`. The supported language codes are:

- `en`: English
- `hi`: Hindi
- `te`: Telugu

`LanguageToggle` is reused across implemented pages. New user-facing text must be added to all three dictionaries rather than hardcoded in JSX. Preserve language selection through the existing localStorage language behavior and test text wrapping at 375px.

## 13. PDF

`Results.jsx` passes the selected `plan`, `finance`, language, and translations to `FullReport.jsx`. The report is rendered as a hidden print-friendly component and captured by `src/lib/pdfExport.js` using html2canvas and jsPDF.

`FullReport.jsx` uses `buildFeasibilityData()` from `src/lib/feasibility.js`, so the PDF must match the currently selected Results assessment. Keep the selected ID and category/location data intact when changing report structure. The generated date is formatted dynamically.

## 14. Important Development Rules

- Do not hardcode assessment-specific values, categories, locations, or feasibility claims.
- Do not break `/results?id=<assessmentId>` historical loading.
- Do not modify finance formulas casually; test the known finance cases after changes.
- Keep blockchain and signing code isolated to the Bank route/service boundary.
- Never expose private keys or signing credentials.
- Preserve English, Hindi, and Telugu support for every new UI string.
- Test responsive behavior at a minimum width of 375px.
- Keep loading, empty, validation, success, and error states usable.
- Do not add unnecessary dependencies.
- Preserve the existing Swiss/institutional visual language.
- Do not claim a mock result is a real external transaction or API result.

## 15. Where to Work

| Feature | Main files | What to modify |
| --- | --- | --- |
| Routes | `src/App.jsx`, `src/auth/ProtectedRoute.jsx` | Add or protect routes without changing role boundaries. |
| Auth | `src/auth/*` | Replace mock provider only when the auth migration is ready. |
| Onboarding | `src/pages/Start.jsx`, `src/services/onboardingService.js` | Form and assessment persistence/API seam. |
| Assessment history | `src/pages/Assessments.jsx`, `src/services/onboardingService.js` | Local history now; future persistence adapter here. |
| Finance | `src/lib/finance.js` | Formula-driven calculations and schedules. |
| Results | `src/pages/Results.jsx`, `src/components/AmortizationChart.jsx` | Selected-plan rendering and analytical UI. |
| Feasibility | `src/lib/feasibility.js`, `src/i18n.js` | Shared mock/backend data shape and category selection. |
| PDF | `src/components/FullReport.jsx`, `src/lib/pdfExport.js` | Report content and capture pipeline. |
| Chat | `src/pages/Chat.jsx`, `src/services/chatService.js`, `src/lib/gemini.js` | Mock/live chat seam and Gemini context. |
| Bank | `src/pages/Bank.jsx`, `src/services/bankLedgerService.js` | SCA ledger and future transaction integration. |
| Configuration | `src/config.js`, `.env.example` | Public environment configuration only. |
| Translations | `src/i18n.js` | EN/HI/TE dictionary entries. |

## 16. Backend Handoff / TODO

- Connect `POST /api/calculator` and `POST /api/feasibility` behind `VITE_USE_ONBOARDING_API`.
- Connect `POST /api/chat` so Gemini runs server-side rather than exposing a browser key.
- Implement `GET /api/districts` and replace or extend the local location mock.
- Connect Supabase persistence for `arthniti_applications` with appropriate RLS policies.
- Decide how web history maps to shared Supabase application records and user identity.
- Replace neutral mock feasibility content with reviewed backend or AI-generated category-aware content where appropriate.
- Replace `bankLedgerService.js` mocks with the verified bank-side Algorand transaction recorder and ledger reader.
- Add server-side signing and keep all wallet credentials out of the frontend.
- Implement the optional `/admin` route/dashboard if required.
- Add automated tests for finance, history selection, category-specific feasibility, and ineligible applications.
- Consider code-splitting the current large production bundle; Vite currently reports a chunk-size warning but the build succeeds.

## 17. Demo Flow

```text
Login -> Recent Assessments -> New Assessment -> Results
      -> Feasibility -> PDF -> Ask Arthniti -> History -> Bank/SCA
```

Recommended demo checks:

- Create a Dairy assessment and show the Dairy feasibility dataset.
- Create a Kirana Store or Textiles assessment and show neutral, non-Dairy feasibility content.
- Open both records from History to demonstrate selected-assessment loading.
- Show the financial plan and PDF for an eligible margin.
- Open Bank with the bank demo credentials and clearly identify its ledger as mock data.

# Design System & Visual Language

This is the current visual direction for Arthniti. New pages and changes should follow these rules so the product feels like one considered financial assessment system.

## 1. Overall Design Direction

- Swiss International Typographic Style with modern Swiss editorial composition.
- A premium financial product feel rather than a generic dashboard.
- Minimal overall, with occasional strong or heavy visual elements used to establish hierarchy.
- More Swiss editorial than government-portal styling.
- More sophisticated and information-focused than generic SaaS or fintech patterns.
- Information remains the priority. Visual elements should clarify hierarchy, not decorate without purpose.

## 2. Colour Palette

The current core colours are:

- Arthniti Navy: `#1a237e`
- Arthniti Saffron: `#ff9933`
- White and off-white surfaces, primarily `#fff` and `#f7f8fa`
- Dark neutral text, including `#172033`, `#30394a`, and `#626a78`
- Trust-oriented Ashoka-blue/national-navy usage through the Arthniti Navy token

Usage:

- Navy is used for the primary brand, headings, navigation, active text, and major data emphasis.
- Saffron is used sparingly for accents, highlights, active states, rules, and important actions.
- White and off-white are the primary page surfaces and report backgrounds.
- Avoid introducing random colours or unreviewed brand colours.
- Status colours are acceptable only for semantic states such as eligible/ineligible, errors, or repayment status. Current semantic examples include muted red, green, and amber tones.

The Tailwind configuration defines `navy`, `saffron`, and `ink`. Existing CSS also uses the supporting neutral and rule colours above. There are no gradients in the design system.

## 3. Typography

The current codebase uses system-available font families; no external font package is installed or loaded.

| Role | Current font | Usage |
| --- | --- | --- |
| Display and editorial headings | `Georgia, serif` | Login, Signup, Start, Results, Assessments, Bank, feasibility headings, and PDF report headings. |
| Body and UI text | `Arial, sans-serif` | Body copy, labels, controls, buttons, metadata, tables, and supporting text. |
| Financial numbers and data | `Georgia, serif` for major figures; `Arial, sans-serif` for compact table data | Large currency values use the editorial serif hierarchy; dense schedules and metadata use the UI sans-serif treatment where appropriate. |
| Labels and captions | `Arial, sans-serif` | Kicker labels, uppercase captions, field labels, status labels, and table headers. |

The hierarchy is intentionally serif display plus sans-serif interface/body. Tailwind maps this as `fontFamily.display: Georgia` and `fontFamily.sans: Arial`; `src/index.css` applies the same families directly in existing components.

## 4. Layout & Grid

- Use Swiss grid-based composition with strong alignment between sections.
- Keep content aligned to consistent page edges and grid columns.
- Use intentional asymmetry when it improves hierarchy or reading order.
- Use whitespace deliberately, but avoid large empty areas that separate related information.
- Prefer thin rules and dividers over unnecessary containers.
- Group related information into clear analytical compositions.
- Avoid stacking unrelated floating cards or adding detached dashboard widgets.

## 5. Heavy Visual Elements

Heavy does not mean adding many components. Preferred heavy elements are:

- Oversized typography used selectively.
- Large financial figures and assessment numbers.
- Strong horizontal or vertical rules.
- Asymmetric grid compositions.
- One dominant chart or visual per analytical section.
- Large typographic section labels used sparingly.

Avoid:

- Decorative blobs or floating shapes.
- Random illustrations or excessive icons.
- Gradients.
- Glassmorphism or backdrop effects for ordinary page content.
- Crypto-style graphics.
- Excessive shadows.
- Excessive rounded cards or pill controls.
- Giant marketing CTAs.

## 6. Page-Specific Direction

### Dashboard / Recent Assessments

- This is the most visually expressive application page.
- Use strong Swiss editorial composition, oversized numbers, asymmetric grids, and heavier typography where useful.
- Assessment records must remain readable and scannable; expression must not obscure category, location, amount, eligibility, or date.

### Results / Financial Plan

- Keep the page calm and information-first.
- Financial numbers are the visual focus.
- Use typography, grid, and rules rather than card-heavy decoration.
- The selected assessment must remain visually clear through its category, location, and dynamic financial values.

### Results / Repayment

- The graph may be the dominant visual.
- Preferred composition is the graph on the left with repayment interpretation and summary on the right.
- Keep the quarterly repayment table full-width underneath.
- The graph and summary should read as one analytical unit.

### Results / Feasibility

- Use an editorial analytical style rather than a collection of generic cards.
- Use strong section headings, compact information blocks, and thin rules.
- The Viability Score can act as a visual anchor, but should remain sophisticated and restrained.
- Category and location must come from the selected assessment.

### Bank / SCA

- Use an institutional finance and data style.
- Prioritize structured ledger/table hierarchy and precise alignment.
- Use Swiss precision rather than crypto aesthetics.
- Blockchain is visually secondary to financial transparency.

### Chat

- Keep the chat experience as a minimal chat-window interface.
- Do not apply heavy dashboard decoration to the chat experience.

### PDF

- Use a formal financial-report treatment.
- Keep the PDF consistent with the web Results data, selected assessment, logo, typography, and colour system.

## 7. Components & UI Rules

- Prefer small, square, or minimally rounded corners.
- Avoid excessive pills.
- Use subtle borders and thin rules.
- Use shadows sparingly and only when they improve layering or interaction clarity.
- Tables require disciplined column alignment and clear row separators.
- Right-align monetary values where appropriate.
- Use Indian currency formatting such as `₹1,00,000`.
- Buttons should be restrained, purposeful, and visually subordinate to the information they act on unless they are the clear primary form action.
- Preserve accessible focus states and comfortable touch targets.

## 8. Responsive Design

- Desktop layouts use the full Swiss grid and available horizontal space intelligently.
- `375px` is a required breakpoint and test target.
- Asymmetric layouts must collapse cleanly into intentional mobile compositions.
- Never introduce page-level horizontal scrolling, clipped content, or fixed desktop-width containers.
- Preserve information hierarchy when stacking content.
- Recheck long Indian-formatted amounts and translated Hindi/Telugu text at mobile widths.

## 9. Internationalization

- English, Hindi, and Telugu are required for implemented user-facing experiences.
- All new visible text must use the existing `src/i18n.js` dictionary.
- Do not hardcode English UI strings in page components.
- Test translated labels, validation messages, tables, buttons, and metadata for wrapping and clarity.

## 10. Design Do / Don't

| DO | DON'T |
| --- | --- |
| Swiss grid and strong alignment | Government-portal styling |
| Strong typography and selective large numbers | Generic SaaS card grids |
| Thin rules and disciplined tables | Gradients or glassmorphism |
| Intentional asymmetry | Excessive rounding or pill controls |
| Restrained navy and saffron | Decorative clutter or random colour |
| Clear financial hierarchy | Crypto/Web3 aesthetics |
| Information-first compositions | Large marketing treatment without product purpose |
