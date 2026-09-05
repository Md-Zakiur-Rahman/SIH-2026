import { USE_MOCKS } from '../config';
import { sendGeminiMessage } from '../lib/gemini';

// Future backend contract: POST /api/chat with { message, history }.
// Keep this adapter asynchronous so the UI does not change when the API is connected.
export const chatService = {
  async sendMessage({ message, context, history = [] }) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    if (!USE_MOCKS) return sendGeminiMessage({ message, history, systemPrompt: buildSystemPrompt(context) });
    if (/simulate error/i.test(message)) throw new Error('CHAT_REQUEST_FAILED');

    const text = message.toLowerCase();
    const copy = context.copy;
    if (/feasib|why.*business|viable|market|swot/.test(text)) return fill(copy.feasibilityResponse, context);
    if (/loan|borrow|finance|emi|eligible|sanction/.test(text)) return fill(context.finance.eligible ? copy.loanEligibleResponse : copy.loanIneligibleResponse, context);
    if (/risk|threat|problem|danger/.test(text)) return fill(copy.risksResponse, context);
    if (/improve|recommend|suggest|next step|score/.test(text)) return fill(copy.recommendationsResponse, context);
    return fill(copy.generalResponse, context);
  },
};

function buildSystemPrompt(context) {
  return `You are Arthniti, a helpful rural business advisor. Answer simply, clearly, and practically.
Respond entirely in the user's selected language: ${context.language}. Do not switch languages unless the user explicitly asks.

Scheme rules:
MICRO FINANCE SCHEME: project cost <= ₹1,40,000; interest 6.5%; tenure 3 years; moratorium 3 months; maximum loan ₹1,25,000.
TERM LOAN SCHEME: project cost <= ₹50,00,000; interest 8%; tenure 7 years; moratorium 6 months; maximum loan ₹45,00,000.
Above ₹50,00,000 project cost: not eligible because project cost exceeds the ₹50 lakh limit.

Gemini is an advisor and explainer, not the financial calculation engine. Never independently recalculate or invent project cost, loan amount, sanctioned loan, EMI, eligibility, or feasibility score. Use the exact values below. For an ineligible application, clearly explain the reason and do not present a loan or EMI as eligible.

CURRENT ARTHNITI APPLICATION:
Business: ${context.category}
Location: ${context.location}
Margin: ${context.margin}
Project cost: ${context.projectCost}
Loan amount: ${context.loanAmount}
Sanctioned loan: ${context.sanctionedLoan}
Scheme: ${context.scheme}
Interest: ${context.interest}
Tenure: ${context.tenure}
Moratorium: ${context.moratorium}
EMI: ${context.emi}
Eligible: ${context.eligible}
Eligibility reason: ${context.eligibilityReason}

FEASIBILITY:
Score: ${context.score}
Market reach: ${context.marketReach}
SWOT: ${context.swot}
Local risks: ${context.risks}
Opportunity: ${context.opportunity}
Competition: ${context.competition}
Pricing: ${context.pricing}
Recommendations: ${context.recommendations}`;
}

function fill(template, context) {
  return template.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? '');
}
