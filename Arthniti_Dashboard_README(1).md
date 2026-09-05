# Arthniti — Dashboard & Internal Pages (Build README)

**For:** the teammate building the app (everything except the landing page)
**Stack:** React 18 + Vite + Tailwind (reuse the existing PredX frontend shell)
**Goal:** the two core modules as beautiful, working screens + supporting pages
**Timeline:** 48 hours — build against MOCK DATA first, wire the real backend last

---

## 0. Before you start

- **Reuse from the old PredX frontend:** Vite/Tailwind config, routing, layout shell (navbar/sidebar), Recharts (from the trading terminal → repurpose for amortization chart), any generic Button/Card/Modal/Spinner components, the Gemini fetch wrapper.
- **Delete/ignore:** all trading, prediction-market, NFT, Pinata, wallet-in-user-flow code.
- **Build order:** don't wait for the backend. Every page below has a **mock JSON** — hardcode it, build the UI, swap to the real API at the end. This is how we work in parallel.

---

## 1. Priority tiers (build in this order)

| Tier | Page | Why |
|---|---|---|
| 🔴 MUST | Input / Onboarding flow | Entry point, collects the 3 inputs |
| 🔴 MUST | Results — Financial Plan (Module 2) | Deterministic, always works, our safety net |
| 🔴 MUST | Results — Feasibility Report (Module 1) | The AI "wow" screen |
| 🔴 MUST | PDF Export | Judges love a downloadable deliverable |
| 🟡 NICE | Advisory Chatbot | Reuse Gemini wrapper, high value/low effort |
| 🟡 NICE | Bank / SCA Ledger View | Shows the Algorand disbursement transparency angle |
| 🟢 SKIP-if-short | Admin Dashboard | Roadmap slide if no time |
| 🟢 SKIP-if-short | Saved Plans / History | Roadmap slide if no time |

If you finish MUST tier only, we still have a winning demo.

---

## 2. Global requirements (apply to every page)

- **Language toggle** — Hindi / English (+ Telugu if time). Use a simple i18n dictionary object, not a library. Persist choice in React state.
- **Government theme** — navy `#1a237e` + saffron `#ff9933` accents, white background, Ashoka-blue for trust. Clean, official, NOT flashy/crypto-looking.
- **Mobile responsive** — judges often view on a phone. Test at 375px width.
- **Loading + error states** — every API call shows a spinner and a friendly error, never a blank screen.
- **No wallet prompts anywhere in the user flow.** The blockchain is bank-side only (see §8).

---

## 3. Routing map

```
/                    → Landing page (OTHER teammate — not your job)
/start               → Input / Onboarding flow
/results             → Results dashboard (tabs: Financial Plan | Feasibility)
/chat                → Advisory chatbot
/bank                → Bank / SCA ledger view (blockchain, isolated)
/admin               → Admin dashboard (optional)
```

---

## 4. PAGE: Input / Onboarding  `/start`

**Purpose:** collect the 3 inputs, then navigate to `/results`.

**Fields:**
1. **Location** — cascading dropdowns: State → District → Block/Village.
   For the demo, hardcode a small list (see mock below). Don't build real LGD API integration.
2. **Business Category** — dropdown: Dairy, Retail, Textiles, Poultry, Tailoring, Agri-processing, Kirana Store, Handicrafts.
3. **Available Margin Capital (₹)** — number input, with helper text: *"This is your own money — it becomes your 10% contribution."*

**UX:** one clean card, big friendly inputs (rural users), a prominent "Generate My Plan" button. Optionally a 3-step wizard.

**On submit:** store inputs in state/context, call `/api/feasibility` + `/api/calculator`, navigate to `/results`.

**Mock location data:**
```js
const LOCATIONS = {
  "Telangana": {
    "Nizamabad": ["Nizamabad Rural", "Bodhan", "Armoor"],
    "Karimnagar": ["Karimnagar Rural", "Huzurabad", "Jammikunta"],
    "Warangal": ["Warangal Rural", "Hanamkonda", "Narsampet"]
  }
};
const CATEGORIES = ["Dairy","Retail","Textiles","Poultry","Tailoring","Agri-processing","Kirana Store","Handicrafts"];
```

---

## 5. PAGE: Results — Financial Plan (Module 2)  `/results` (tab 1)

**Purpose:** show the loan structure. This is PURE MATH — build it client-side even without a backend. It must be flawless.

**The math (identical to the n8n workflow, keep them consistent):**
```js
function calculateFinance(margin) {
  const projectCost = margin / 0.10;
  const loanAmount = projectCost * 0.90;
  let scheme, interest, tenureYears, moratoriumMonths, maxLoan, eligible = true, reason = "";

  if (projectCost <= 140000) {
    scheme = "Micro Finance Scheme";
    interest = 6.5; tenureYears = 3; moratoriumMonths = 3; maxLoan = 125000;
  } else if (projectCost <= 5000000) {
    scheme = "Term Loan Scheme";
    interest = 8; tenureYears = 7; moratoriumMonths = 6; maxLoan = 4500000;
  } else {
    eligible = false;
    reason = "Project cost exceeds ₹50 lakh limit.";
    scheme = "Not Eligible"; interest = tenureYears = moratoriumMonths = maxLoan = 0;
  }

  const sanctionedLoan = eligible ? Math.min(loanAmount, maxLoan) : 0;
  let emi = 0, repayMonths = 0, totalInterest = 0, totalPayable = 0;
  if (eligible && sanctionedLoan > 0) {
    repayMonths = tenureYears * 12 - moratoriumMonths;
    const r = interest / 12 / 100, n = repayMonths;
    emi = sanctionedLoan * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);
    totalPayable = emi * n;
    totalInterest = totalPayable - sanctionedLoan;
  }
  return { projectCost, loanAmount, sanctionedLoan, scheme, interest,
           tenureYears, moratoriumMonths, emi, repayMonths, totalInterest, totalPayable };
}
```

**Components to build:**
1. **Summary cards** (top row): Your Margin (10%) | Project Cost | Loan Eligible (90%) | Monthly EMI — big numbers, ₹ formatted with Indian commas (`toLocaleString('en-IN')`).
2. **Scheme card:** name badge (Micro Finance = green, Term Loan = blue), interest %, tenure, moratorium — clearly labelled.
3. **Amortization chart** (Recharts LineChart): X = months, two lines = principal paid vs interest paid over time. Reuse the trading-terminal chart component.
4. **Quarterly repayment table:** quarter number, EMI × 3, principal, interest, remaining balance. First 4-8 quarters, scrollable.
5. **Moratorium note:** "No repayment for first N months (moratorium)."

**Number format helper:** `const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');`

---

## 6. PAGE: Results — Feasibility Report (Module 1)  `/results` (tab 2)

**Purpose:** render the AI feasibility analysis. Calls `/api/feasibility` (Gemini/Groq). Build with mock JSON first.

**Components (one card each):**
1. 🎯 **Market Reach** — consumer base estimate + distribution channels
2. 📊 **SWOT** — 4-quadrant grid (Strengths/Weaknesses/Opportunities/Threats)
3. ⚠️ **Threats** — local risks list
4. 💡 **Opportunity** — unserved niche callout
5. 🏪 **Competitor Density** — low/medium/high badge + reasoning
6. 💵 **Pricing Strategy** — recommended range + reasoning
7. 📈 **Viability Score** — a gauge/radial (0-100) with color (red<40, amber 40-70, green>70) + one-line reason
8. ✅ **Top 3 Recommendations** — numbered list

**Mock feasibility response (build against this exact shape):**
```json
{
  "market_reach": {
    "consumer_base": "~8,000 households within 10km of Nizamabad Rural",
    "channels": ["Local weekly market (santha)", "Direct home delivery", "Tie-up with 3 kirana stores"]
  },
  "swot": {
    "strengths": ["Strong local dairy demand", "Low starting capital needed"],
    "weaknesses": ["No cold-chain access", "First-time operator"],
    "opportunities": ["No organic milk supplier in block", "Growing town population nearby"],
    "threats": ["Summer feed cost spikes", "Dependence on single milk buyer"]
  },
  "unserved_niches": ["Packaged curd & buttermilk for the local town market"],
  "local_risks": ["Fodder price rises May-June", "Monsoon transport disruption"],
  "competitor_density": { "level": "medium", "reasoning": "6-8 informal dairy sellers, none branded" },
  "pricing_strategy": { "range": "₹48-55 per litre", "reasoning": "Slightly above loose milk, justified by hygiene & delivery" },
  "viability_score": 72,
  "viability_reason": "Solid demand, manageable risks, clear pricing edge",
  "top_3_recommendations": [
    "Start with 4-5 buffaloes to prove demand before scaling",
    "Lock a fodder supplier before summer",
    "Brand as hygienic/home-delivered to command premium"
  ]
}
```

---

## 7. PAGE: Advisory Chatbot  `/chat`  🟡

**Purpose:** answer scheme questions ("What is the interest rate?", "Which scheme fits me?", "What documents do I need?").

- Reuse the PredX Gemini wrapper. New system prompt = scheme rules (Micro Finance vs Term Loan details) + "you are Arthniti, a helpful rural business advisor. Answer simply."
- Standard chat UI: message list, input box, send button, typing indicator.
- No RAG needed — put scheme facts directly in the system prompt.

---

## 8. PAGE: Bank / SCA Ledger View  `/bank`  🟡

**Purpose:** the transparency angle — show that loan disbursement + repayment are recorded on an immutable ledger (Algorand). **This is bank-side, NOT villager-facing.**

- Framing on the page header: *"State Channelizing Agency View — Transparent Fund Disbursement"*
- Table of transactions: Application ID | Beneficiary (masked) | Sanctioned Amount | Disbursed (tx hash) | Repayments logged | Status
- Each tx hash links to Algorand TestNet explorer (`https://testnet.algoexplorer.io/tx/<hash>`)
- A "Record Disbursement" button that fires the on-chain tx (this reuses the kept Algorand code)
- Keep ALL wallet/algosdk code isolated to THIS route only. Never import it in the user flow.

> Coordinate with whoever owns the smart-contract/ledger piece for the tx-recording function + hash.

---

## 9. PAGE: Admin Dashboard  `/admin`  🟢 (optional)

If time allows: read all rows from Supabase `arthniti_applications` and show:
- Total applications, total loan value, avg viability score (stat cards)
- Applications by district (bar chart)
- Scheme split Micro vs Term (pie chart)
- Recent applications table

Reads directly from Supabase REST (anon key + RLS read policy) or via a `/api/admin/stats` endpoint.

---

## 10. API contracts (define now, wire last)

Backend isn't ready — build every page against the mock JSON above. When `backend/main.py` is live, these are the endpoints:

```
POST /api/calculator   body: { margin }
                       → { projectCost, loanAmount, sanctionedLoan, scheme, ... }  (§5 shape)

POST /api/feasibility  body: { location, business_category, margin }
                       → feasibility JSON  (§6 shape)

POST /api/chat         body: { message, history: [] }
                       → { reply }

GET  /api/districts    → location tree  (§4 shape)
```

Put the base URL in one config file: `src/config.js → export const API_BASE = "..."`. Use a `USE_MOCKS = true` flag so you flip from mock to real in one line.

---

## 11. Data source
Supabase table `arthniti_applications` already exists (created for the n8n bot). Same table backs the WhatsApp bot AND the web app — so a plan created on WhatsApp shows up in the admin dashboard. Columns: `phone, location, business_category, margin, project_cost, loan_amount, sanctioned_loan, scheme, emi, eligible, full_report, created_at`.

---

## 12. PDF Export (part of Results page)
- Library: `jsPDF` + `html2canvas` (or `react-to-print`).
- Button on `/results`: "Download Full Report (PDF)".
- Capture both tabs (financial + feasibility) into a clean, branded PDF with the Arthniti header.
- Test it early — html2canvas can be finicky with Tailwind; render a dedicated print-friendly component if needed.

---

## 13. Definition of Done (demo-ready checklist)
- [ ] `/start` collects 3 inputs, validates margin > 0
- [ ] `/results` financial tab shows correct numbers (test: ₹1L → ₹10L project, ₹9L loan, Term Loan, EMI ~₹15,340)
- [ ] `/results` feasibility tab renders all cards from JSON
- [ ] Amortization chart renders
- [ ] PDF downloads correctly
- [ ] Language toggle works on results
- [ ] Mobile responsive at 375px
- [ ] Loading + error states everywhere
- [ ] (nice) chatbot answers a scheme question
- [ ] (nice) `/bank` shows a ledger transaction

---

## 14. Suggested folder structure
```
src/
  config.js              # API_BASE, USE_MOCKS flag
  i18n.js                # {en:{...}, hi:{...}} dictionary
  data/mocks.js          # all mock JSON from this doc
  data/locations.js      # location tree + categories
  lib/finance.js         # calculateFinance() from §5
  lib/gemini.js          # reused Gemini wrapper
  pages/
    Onboarding.jsx
    Results.jsx          # tabs: FinancialPlan + Feasibility
    Chat.jsx
    BankLedger.jsx
    Admin.jsx
  components/
    SummaryCard.jsx
    SchemeCard.jsx
    AmortizationChart.jsx
    RepaymentTable.jsx
    SwotGrid.jsx
    ViabilityGauge.jsx
    LanguageToggle.jsx
```

Start with `lib/finance.js` + `pages/Results.jsx` financial tab — it's pure math, zero dependencies, and it's the one thing that must never break in the demo.
