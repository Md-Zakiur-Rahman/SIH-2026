export function calculateFinance(margin) {
  const numericMargin = Number(margin);
  if (!Number.isFinite(numericMargin) || numericMargin <= 0) throw new Error('INVALID_MARGIN');
  const projectCost = numericMargin / 0.1;
  const loanAmount = projectCost * 0.9;
  let scheme = 'Not Eligible';
  let interest = 0;
  let tenureYears = 0;
  let moratoriumMonths = 0;
  let maxLoan = 0;
  let eligible = true;

  if (projectCost <= 140000) {
    scheme = 'Micro Finance Scheme'; interest = 6.5; tenureYears = 3; moratoriumMonths = 3; maxLoan = 125000;
  } else if (projectCost <= 5000000) {
    scheme = 'Term Loan Scheme'; interest = 8; tenureYears = 7; moratoriumMonths = 6; maxLoan = 4500000;
  } else eligible = false;

  const sanctionedLoan = eligible ? Math.min(loanAmount, maxLoan) : 0;
  const repayMonths = eligible ? tenureYears * 12 - moratoriumMonths : 0;
  const monthlyRate = interest / 12 / 100;
  const emi = sanctionedLoan && monthlyRate
    ? sanctionedLoan * monthlyRate * Math.pow(1 + monthlyRate, repayMonths) / (Math.pow(1 + monthlyRate, repayMonths) - 1)
    : 0;
  return { projectCost, loanAmount, sanctionedLoan, scheme, interest, tenureYears, moratoriumMonths, maxLoan, emi, repayMonths, eligible, reason: eligible ? '' : 'Project cost exceeds ₹50 lakh limit.' };
}

export function buildAmortization(finance) {
  if (!finance.eligible || !finance.sanctionedLoan) return [];
  const monthlyRate = finance.interest / 12 / 100;
  let balance = finance.sanctionedLoan;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  return Array.from({ length: finance.repayMonths }, (_, index) => {
    const interest = balance * monthlyRate;
    const principal = Math.min(finance.emi - interest, balance);
    balance = Math.max(0, balance - principal);
    cumulativePrincipal += principal;
    cumulativeInterest += interest;
    return { month: index + 1, principal, interest, cumulativePrincipal, cumulativeInterest, balance };
  });
}

export function buildQuarterlySchedule(finance) {
  const monthly = buildAmortization(finance);
  return Array.from({ length: Math.ceil(monthly.length / 3) }, (_, index) => {
    const months = monthly.slice(index * 3, index * 3 + 3);
    return { quarter: index + 1, emi: finance.emi * months.length, principal: months.reduce((sum, item) => sum + item.principal, 0), interest: months.reduce((sum, item) => sum + item.interest, 0), balance: months.at(-1)?.balance || 0 };
  });
}

export function formatCurrency(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}
