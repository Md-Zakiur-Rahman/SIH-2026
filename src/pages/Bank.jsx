import { useEffect, useState } from 'react';
import LanguageToggle from '../components/LanguageToggle';
import { getInitialLanguage, translations } from '../i18n';
import { formatCurrency } from '../lib/finance';
import { getBankLedger, recordDisbursement } from '../services/bankLedgerService';
import blueLogo from '../../image/blue.png';

function statusKey(status) {
  return status === 'Repaid' ? 'repaid' : status === 'Disbursed' ? 'disbursedStatus' : 'pending';
}

export default function Bank() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [ledger, setLedger] = useState([]);
  const [status, setStatus] = useState('loading');
  const [activeId, setActiveId] = useState('');
  const [message, setMessage] = useState('');
  const t = translations[language];

  useEffect(() => {
    getBankLedger().then((entries) => { setLedger(entries); setStatus('ready'); }).catch(() => setStatus('error'));
  }, []);

  async function handleDisbursement(applicationId) {
    setActiveId(applicationId);
    setMessage('');
    try {
      const result = await recordDisbursement(applicationId);
      setLedger((current) => current.map((entry) => entry.id === applicationId ? { ...entry, status: result.status, disbursed: true } : entry));
      setMessage(t.mockDisbursementNotice);
    } catch { setMessage(t.disbursementError); }
    finally { setActiveId(''); }
  }

  return <main className="bank-shell">
    <header className="bank-header"><a className="bank-logo" href="/bank" aria-label="ARTHNITI"><img src={blueLogo} alt="ARTHNITI" /></a><div className="bank-header-actions"><LanguageToggle language={language} onChange={setLanguage} label={t.bankLanguage} ariaLabel={t.changeLanguage} /></div></header>
    <section className="bank-intro"><div><p className="kicker">{t.bankEyebrow}</p><h1>{t.bankTitle}</h1><p>{t.bankSubtitle}</p></div><div className="bank-intro-mark"><span>{t.bankLedgerLabel}</span><strong>{ledger.length ? String(ledger.length).padStart(2, '0') : '—'}</strong></div></section>
    {message && <p className="bank-message" role="status">{message}</p>}
    <section className="bank-ledger-section"><div className="bank-section-heading"><div><p className="kicker">{t.bankLedgerEyebrow}</p><h2>{t.bankLedgerTitle}</h2></div><span className="bank-mock-label">{t.mockData}</span></div>
      {status === 'loading' && <p className="bank-state">{t.bankLoading}</p>}
      {status === 'error' && <p className="bank-state bank-error" role="alert">{t.bankError}</p>}
      {status === 'ready' && <div className="bank-table-wrap"><table className="bank-table"><thead><tr><th>{t.applicationId}</th><th>{t.beneficiary}</th><th>{t.sanctionedAmount}</th><th>{t.disbursed}</th><th>{t.repaymentsLogged}</th><th>{t.status}</th><th>{t.action}</th></tr></thead><tbody>{ledger.map((entry) => { const labelKey = statusKey(entry.status); return <tr key={entry.id}><td data-label={t.applicationId}>{entry.id}</td><td data-label={t.beneficiary}>{entry.beneficiary}</td><td data-label={t.sanctionedAmount}>{formatCurrency(entry.sanctionedAmount)}</td><td data-label={t.disbursed}>{entry.txHash ? <a href={`https://testnet.algoexplorer.io/tx/${entry.txHash}`} target="_blank" rel="noreferrer">{entry.txHash}</a> : <span className="bank-no-tx">{t.noTransaction}</span>}</td><td data-label={t.repaymentsLogged}>{entry.repayments}</td><td data-label={t.status}><span className={`bank-status ${labelKey === 'disbursedStatus' ? 'disbursed' : labelKey}`}>{t[labelKey]}</span></td><td data-label={t.action}>{entry.status === 'Pending' ? <button className="bank-disburse-button" type="button" disabled={activeId === entry.id} onClick={() => handleDisbursement(entry.id)}>{activeId === entry.id ? t.disbursing : t.recordDisbursement}</button> : <span className="bank-action-muted">{t.recorded}</span>}</td></tr>; })}</tbody></table></div>}
    </section>
  </main>;
}
