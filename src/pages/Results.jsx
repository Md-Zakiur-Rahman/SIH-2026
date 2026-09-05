import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import AmortizationChart from '../components/AmortizationChart';
import { getInitialLanguage, translations } from '../i18n';
import { buildAmortization, buildQuarterlySchedule, calculateFinance, formatCurrency } from '../lib/finance';
import { getAssessmentById, getSavedPlan } from '../services/onboardingService';
import blueLogo from '../../image/blue.png';
import FullReport from '../components/FullReport';
import { downloadReportPdf } from '../lib/pdfExport';
import { ChatExperience } from './Chat';
import { buildFeasibilityData } from '../lib/feasibility';

function formatAssessmentDate(value, language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function Results() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [activeTab, setActiveTab] = useState('financial');
  const [status, setStatus] = useState('loading');
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = translations[language];

  useEffect(() => {
    try {
      const saved = searchParams.get('id') ? getAssessmentById(searchParams.get('id')) : getSavedPlan();
      if (!saved?.input || !Number.isFinite(Number(saved.input.margin)) || Number(saved.input.margin) <= 0) { setStatus(saved ? 'invalid' : 'empty'); return; }
      setPlan({ ...saved, calculator: calculateFinance(saved.input.margin) });
      setStatus('ready');
    } catch { setStatus('error'); }
  }, [searchParams]);

  if (status === 'loading') return <StatePage message={t.loadingResults} />;
  if (status !== 'ready') return <StatePage message={status === 'empty' ? t.noResults : status === 'invalid' ? t.invalidResults : t.calculationError} detail={status === 'empty' ? t.noResultsHelp : ''} action={t.goToStart} onAction={() => navigate('/start')} />;

  const finance = plan.calculator;
  const location = plan.input?.state ? `${plan.input.state}, ${plan.input.district}, ${plan.input.block}` : plan.payload?.location;
  async function handleDownload() {
    setExportError('');
    setIsGenerating(true);
    try {
      const safeName = String(plan.input?.category || 'Financial_Report').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Financial_Report';
      await downloadReportPdf(reportRef.current, `Arthniti_${safeName}.pdf`);
    } catch {
      setExportError(t.reportError);
    } finally {
      setIsGenerating(false);
    }
  }
  return <main className="results-shell" aria-hidden={isChatOpen || undefined} inert={isChatOpen || undefined}>
    <ResultsHeader t={t} language={language} setLanguage={setLanguage} onDownload={handleDownload} isGenerating={isGenerating} />
    {exportError && <p className="report-export-error" role="alert">{exportError}</p>}
    <section className="results-intro"><div><p className="kicker">{t.resultsEyebrow}</p><h1>{t.resultsTitle}</h1><p>{t.resultsSubtitle}</p></div><div className="results-context"><strong>{plan.input?.category || plan.payload?.business_category}</strong><span>{location}</span><small>{t.assessmentDate}: {formatAssessmentDate(plan.createdAt, language)}</small><small>{t.planContext}</small></div></section>
    <div className="results-tabs" role="tablist" aria-label={t.resultsSections}><TabButton active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} id="financial-tab" controls="financial-panel">{t.financialPlan}</TabButton><TabButton active={activeTab === 'feasibility'} onClick={() => setActiveTab('feasibility')} id="feasibility-tab" controls="feasibility-panel">{t.feasibilityTab}</TabButton></div>
    {activeTab === 'financial' ? <FinancialPlan finance={finance} plan={plan} t={t} /> : <FeasibilityReport t={t} plan={plan} />}
    <FullReport plan={plan} finance={finance} t={t} language={language} reportRef={reportRef} />
    <button className="ask-arthniti-fab" type="button" onClick={() => { setIsChatClosing(false); setIsChatOpen(true); }}><span>{t.askArthniti}</span><b aria-hidden="true">↗</b></button>
    {isChatOpen && createPortal(<ChatExperience overlay applicationPlan={plan} applicationFinance={finance} isClosing={isChatClosing} onClose={() => { if (isChatClosing) return; setIsChatClosing(true); window.setTimeout(() => { setIsChatOpen(false); setIsChatClosing(false); }, 300); }} />, document.body)}
  </main>;
}

function ResultsHeader({ t, language, setLanguage, onDownload, isGenerating }) { return <header className="results-header"><a className="results-logo" href="/results" aria-label="ARTHNITI"><img src={blueLogo} alt="ARTHNITI" /></a><div className="results-header-context"><a className="history-link" href="/assessments">{t.history}</a><a className="new-assessment-link" href="/start">{t.newAssessment}<span aria-hidden="true">↗</span></a><span>{t.resultsEyebrow}</span><button className="report-download-button" type="button" onClick={onDownload} disabled={isGenerating}>{isGenerating ? t.generatingReport : t.downloadReport}</button><LanguageToggle language={language} onChange={setLanguage} label={t.resultsLanguage} ariaLabel={t.changeLanguage} /></div></header>; }
function TabButton({ active, onClick, id, controls, children }) { return <button className={`results-tab ${active ? 'active-tab' : ''}`} type="button" role="tab" id={id} aria-controls={controls} aria-selected={active} onClick={onClick}>{children}</button>; }

function FinancialPlan({ finance, plan, t }) {
  const chartData = buildAmortization(finance);
  const schedule = buildQuarterlySchedule(finance);
  const repaymentTotals = schedule.reduce((totals, row) => ({
    interest: totals.interest + row.interest,
    repayment: totals.repayment + row.emi,
  }), { interest: 0, repayment: 0 });
  const schemeName = finance.scheme === 'Micro Finance Scheme' ? t.microScheme : finance.scheme === 'Term Loan Scheme' ? t.termScheme : t.notEligible;
  return <section id="financial-panel" role="tabpanel" aria-labelledby="financial-tab" className="results-content"><section className="capital-section"><SectionHeading index="01" title={t.capitalPosition} /><div className="capital-visual"><div className="capital-copy"><span>{t.contribution}</span><strong>{formatCurrency(plan.input.margin)}</strong><small>10%</small></div><div className="capital-bar"><span className="capital-margin" /><span className="capital-financing" /></div><div className="capital-copy financing-copy"><span>{t.financing}</span><strong>{formatCurrency(finance.loanAmount)}</strong><small>90%</small></div></div><p className="capital-note">{t.financialShare}</p></section><section className="summary-grid" aria-label={t.financialPlan}><Summary index="01" label={t.marginCapital} value={formatCurrency(plan.input.margin)} /><Summary index="02" label={t.projectCost} value={formatCurrency(finance.projectCost)} /><Summary index="03" label={t.loanEligible} value={formatCurrency(finance.sanctionedLoan)} /><Summary index="04" label={t.monthlyEmi} value={finance.eligible ? formatCurrency(finance.emi) : '—'} emphasis /></section><section className={`scheme-section ${finance.eligible ? '' : 'scheme-ineligible'}`}><SectionHeading index="02" title={t.recommendedScheme} status={finance.eligible ? t.eligible : t.notEligible} /><div className="scheme-details"><Detail label={t.scheme} value={schemeName} /><Detail label={t.interestRate} value={finance.eligible ? `${finance.interest}%` : '—'} /><Detail label={t.loanAmount} value={formatCurrency(finance.loanAmount)} /><Detail label={t.maximumLoan} value={finance.eligible ? formatCurrency(finance.maxLoan) : '—'} /><Detail label={t.tenure} value={finance.eligible ? `${finance.tenureYears} ${t.years}` : '—'} /><Detail label={t.moratorium} value={finance.eligible ? `${finance.moratoriumMonths} ${t.months}` : '—'} /></div>{!finance.eligible ? <p className="eligibility-reason" role="alert">{t.notEligibleReason}</p> : <p className="moratorium-note"><span className="lock-mark">▣</span>{t.repaymentBegins}</p>}</section><section className="chart-section"><SectionHeading title={t.repaymentProfile} /><div className="repayment-profile-grid"><div className="repayment-chart-column"><div className="chart-legend"><span className="principal-dot" />{t.principal}<span className="interest-dot" />{t.interest}</div><AmortizationChart data={chartData} t={t} /></div><aside className="repayment-summary"><h3>{t.repaymentSummary}</h3><dl><div><dt>{t.monthlyEmi}</dt><dd>{finance.eligible ? formatCurrency(finance.emi) : '—'}</dd></div><div><dt>{t.tenure}</dt><dd>{finance.eligible ? `${finance.tenureYears} ${t.years}` : '—'}</dd></div><div><dt>{t.totalInterest}</dt><dd>{finance.eligible ? formatCurrency(repaymentTotals.interest) : '—'}</dd></div><div><dt>{t.totalRepayment}</dt><dd>{finance.eligible ? formatCurrency(repaymentTotals.repayment) : '—'}</dd></div></dl><div className="repayment-insights"><p>{t.repaymentInsightOne}</p><p>{t.repaymentInsightTwo}</p><p>{t.repaymentInsightThree}</p></div></aside></div></section>{finance.eligible ? <RepaymentTable schedule={schedule} t={t} /> : <p className="no-repayment">{t.noRepayment}</p>}</section>;
}

function FeasibilityReport({ t, plan }) {
  const input = plan.input || {};
  const category = input.category || plan.payload?.business_category || '—';
  const location = [input.state, input.district, input.block].filter(Boolean).join(', ') || plan.payload?.location || '—';
  const data = buildFeasibilityData({ t, category, location });
  return <section id="feasibility-panel" role="tabpanel" aria-labelledby="feasibility-tab" className="results-content feasibility-content"><SectionHeading index="01" total="08" title={t.marketReach} /><div className="feasibility-selection"><div><span className="feasibility-label">{t.category}</span><strong>{category}</strong></div><div><span className="feasibility-label">{t.location}</span><strong>{location}</strong></div></div><div className="feasibility-market"><div><span className="feasibility-label">{t.consumerBase}</span><strong>{data.market}</strong></div><div><span className="feasibility-label">{t.channels}</span><ul>{data.channels.map((item) => <li key={item}>{item}</li>)}</ul></div></div><section className="feasibility-block"><SectionHeading index="02" total="08" title={t.swot} /><div className="swot-grid"><SwotItem title={t.strengths} items={data.strengths} tone="positive" /><SwotItem title={t.weaknesses} items={data.weaknesses} tone="caution" /><SwotItem title={t.opportunities} items={data.opportunities} tone="opportunity" /><SwotItem title={t.threats} items={data.threats} tone="risk" /></div></section><div className="feasibility-two-column"><InfoBlock index="03" title={t.localRisks}><ul>{data.risks.map((item) => <li key={item}>{item}</li>)}</ul></InfoBlock><InfoBlock index="04" title={t.opportunity}><span className="feasibility-label">{t.unservedNiche}</span><p>{data.niche}</p></InfoBlock><InfoBlock index="05" title={t.competition}><span className="density-badge">{t.medium}</span><p>{data.competition}</p></InfoBlock><InfoBlock index="06" title={t.pricing}><span className="feasibility-label">{t.recommendedRange}</span><strong>{data.pricingRange}</strong><p>{data.pricingReason}</p></InfoBlock></div><section className="viability-block"><SectionHeading index="07" total="08" title={t.viability} /><div className="viability-layout"><div className="viability-gauge" style={{ '--score': `${data.score * 3.6}deg` }}><strong>{data.score}</strong><span>/ 100</span></div><div><span className="feasibility-label">{t.viabilityScore}</span><p>{data.viabilityReason}</p></div></div></section><section className="recommendations-block"><SectionHeading index="08" total="08" title={t.recommendations} /><ol>{data.recommendations.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></section></section>;
}

function SectionHeading({ title, status }) { return <div className="section-heading"><div><h2>{title}</h2></div>{status && <span className="scheme-status">{status}</span>}</div>; }
function Summary({ index, label, value, emphasis }) { return <div className={`summary-item ${emphasis ? 'summary-emphasis' : ''}`}><small>{index}</small><span>{label}</span><strong>{value}</strong></div>; }
function Detail({ label, value }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function SwotItem({ title, items, tone }) { return <div className={`swot-item ${tone}`}><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function InfoBlock({ title, children }) { return <section className="info-block"><h2>{title}</h2>{children}</section>; }
function RepaymentTable({ schedule, t }) { return <section className="table-section"><SectionHeading index="04" title={t.repaymentSchedule} /><div className="repayment-table-wrap"><table><thead><tr><th>{t.quarter}</th><th>{t.quarterlyPayment}</th><th>{t.principal}</th><th>{t.interest}</th><th>{t.balance}</th></tr></thead><tbody>{schedule.slice(0, 8).map((row) => <tr key={row.quarter}><td>{t.quarterShort}{row.quarter}</td><td>{formatCurrency(row.emi)}</td><td>{formatCurrency(row.principal)}</td><td>{formatCurrency(row.interest)}</td><td>{formatCurrency(row.balance)}</td></tr>)}</tbody></table><div className="repayment-mobile-list">{schedule.slice(0, 8).map((row) => <article key={row.quarter}><div><strong>{t.quarterShort}{row.quarter}</strong><span>{formatCurrency(row.emi)}</span></div><dl><dt>{t.quarterlyPayment}</dt><dd>{formatCurrency(row.emi)}</dd><dt>{t.principal}</dt><dd>{formatCurrency(row.principal)}</dd><dt>{t.interest}</dt><dd>{formatCurrency(row.interest)}</dd><dt>{t.balance}</dt><dd>{formatCurrency(row.balance)}</dd></dl></article>)}</div></div></section>; }
function StatePage({ message, detail, action, onAction }) { return <main className="results-state"><img src={blueLogo} alt="ARTHNITI" /><p className="kicker">ARTHNITI / RESULTS</p><h1>{message}</h1>{detail && <p>{detail}</p>}{action && <button className="generate-button" type="button" onClick={onAction}>{action}<span>↗</span></button>}</main>; }
