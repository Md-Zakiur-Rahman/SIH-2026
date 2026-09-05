const MOCK_LEDGER = [
  { id: 'APP-2026-001', beneficiary: 'R**** K****', sanctionedAmount: 450000, disbursed: false, txHash: null, repayments: 0, status: 'Pending' },
  { id: 'APP-2026-002', beneficiary: 'S**** D****', sanctionedAmount: 125000, disbursed: true, txHash: null, repayments: 1, status: 'Disbursed' },
  { id: 'APP-2026-003', beneficiary: 'M**** N****', sanctionedAmount: 275000, disbursed: true, txHash: null, repayments: 12, status: 'Repaid' },
];

export async function getBankLedger() {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return MOCK_LEDGER.map((entry) => ({ ...entry }));
}

// This mock deliberately returns no hash. Replace this boundary with the bank-side ledger integration later.
export async function recordDisbursement(applicationId) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { applicationId, status: 'Disbursed', txHash: null, isMock: true };
}
