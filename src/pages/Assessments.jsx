import { useEffect, useState } from 'react';
import LanguageToggle from '../components/LanguageToggle';
import { getInitialLanguage, translations } from '../i18n';
import { formatCurrency } from '../lib/finance';
import { getAssessments } from '../services/onboardingService';
import blueLogo from '../../image/blue.png';

function amount(value) {
  return Number.isFinite(Number(value)) ? formatCurrency(value) : '—';
}

function formatCreatedAt(value, language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const locale = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function Assessments() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [assessments, setAssessments] = useState([]);
  const t = translations[language];

  useEffect(() => {
    setAssessments(getAssessments());
  }, []);

  return <main className="assessments-shell">
    <header className="assessments-header">
      <a className="assessments-logo" href="/assessments" aria-label="ARTHNITI"><img src={blueLogo} alt="ARTHNITI" /></a>
      <div className="assessments-header-actions">
        <a className="assessments-new-link" href="/start">{t.newAssessment}<span aria-hidden="true">↗</span></a>
        <LanguageToggle language={language} onChange={setLanguage} label={t.resultsLanguage} ariaLabel={t.changeLanguage} />
      </div>
    </header>
    <section className="assessments-intro">
      <div>
        <p className="kicker">{t.assessmentsEyebrow}</p>
        <h1>{t.recentAssessments}</h1>
        <p>{t.assessmentsSubtitle}</p>
      </div>
      <a className="assessments-primary-link" href="/start">{t.newAssessment}<span aria-hidden="true">↗</span></a>
    </section>
    {assessments.length > 0 ? <section className="assessments-list" aria-label={t.recentAssessments}>
      {assessments.map((assessment, index) => {
        const input = assessment.input || {};
        const finance = assessment.calculator || {};
        const location = [input.state, input.district, input.block].filter(Boolean).join(', ') || '—';
        return <article className="assessment-item" key={assessment.id || `${assessment.createdAt}-${index}`}>
          <div className="assessment-item-heading"><span className="assessment-index">{String(index + 1).padStart(2, '0')}</span><span className="assessment-date">{t.created}: {formatCreatedAt(assessment.createdAt, language)}</span></div>
          <h2>{input.category || '—'}</h2>
          <p className="assessment-location">{location}</p>
          <dl className="assessment-details">
            <div><dt>{t.marginCapital}</dt><dd>{amount(input.margin)}</dd></div>
            <div><dt>{t.projectCost}</dt><dd>{amount(finance.projectCost)}</dd></div>
            <div><dt>{t.loanEligible}</dt><dd>{finance.eligible ? t.eligible : t.notEligible}</dd></div>
            <div><dt>{t.scheme}</dt><dd>{finance.scheme === 'Micro Finance Scheme' ? t.microScheme : finance.scheme === 'Term Loan Scheme' ? t.termScheme : t.notEligible}</dd></div>
          </dl>
          <a className="assessment-view-link" href={`/results?id=${encodeURIComponent(assessment.id)}`}>{t.viewAssessment}<span aria-hidden="true">↗</span></a>
        </article>;
      })}
    </section> : <section className="assessments-empty">
      <p className="kicker">{t.noAssessments}</p>
      <h2>{t.startFirstAssessment}</h2>
      <a className="assessments-primary-link" href="/start">{t.newAssessment}<span aria-hidden="true">↗</span></a>
    </section>}
  </main>;
}
