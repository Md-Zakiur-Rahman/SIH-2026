import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { BUSINESS_CATEGORIES, LOCATIONS } from '../data/locations';
import { generatePlan } from '../services/onboardingService';
import { getInitialLanguage, translations } from '../i18n';
import blueLogo from '../../image/blue.png';

const initialForm = { state: '', district: '', block: '', category: '', margin: '' };

export default function Start() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();
  const t = translations[language];
  const districts = useMemo(() => form.state ? Object.keys(LOCATIONS[form.state]) : [], [form.state]);
  const blocks = useMemo(() => form.state && form.district ? LOCATIONS[form.state][form.district] : [], [form.state, form.district]);
  const errors = {
    state: !form.state ? t.required : '', district: !form.district ? t.required : '', block: !form.block ? t.required : '',
    category: !form.category ? t.required : '', margin: !form.margin || Number(form.margin) <= 0 ? t.invalidAmount : '',
  };
  const isValid = Object.values(errors).every((error) => !error);
  const update = (field, value) => { setStatus('idle'); setForm((current) => ({ ...current, [field]: value, ...(field === 'state' ? { district: '', block: '' } : {}), ...(field === 'district' ? { block: '' } : {}) })); };

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ state: true, district: true, block: true, category: true, margin: true });
    if (!isValid) return;
    setStatus('loading');
    try { const result = await generatePlan(form); navigate(`/results?id=${encodeURIComponent(result.id)}`); } catch { setStatus('error'); }
  }

  const fieldError = (field) => touched[field] && errors[field];
  return <main className="start-shell">
    <header className="start-header"><a className="start-brand" href="/start" aria-label="Arthniti home"><img src={blueLogo} alt="ARTHNITI" /></a><div className="start-meta"><span>{t.startFinance}</span><LanguageToggle language={language} onChange={setLanguage} label={t.startLanguage} ariaLabel={t.changeLanguage} /></div></header>
    <div className="start-layout">
      <aside className="start-intro"><p className="kicker">{t.startEyebrow}</p><h1>{t.startTitle}</h1><p className="start-subtitle">{t.startSubtitle}</p><div className="start-progress"><span className="progress-active">01</span><span>—</span><span>02</span><span>03</span></div><p className="progress-label">{t.step} 01 <span>/ 03</span></p></aside>
      <section className="onboarding-form-section" aria-labelledby="onboarding-heading"><div className="form-section-heading"><span className="section-index">01</span><h2 id="onboarding-heading">{t.startHeading}</h2></div>
        <form className="onboarding-form" onSubmit={handleSubmit} noValidate>
          <fieldset><legend><span className="field-number">01</span><span><strong>{t.location}</strong><small>{t.locationHelp}</small></span></legend><div className="onboarding-grid three-columns">
            <SelectField id="state" label={t.state} value={form.state} onChange={(e) => update('state', e.target.value)} options={Object.keys(LOCATIONS)} placeholder={t.chooseState} error={fieldError('state')} />
            <SelectField id="district" label={t.district} value={form.district} onChange={(e) => update('district', e.target.value)} options={districts} placeholder={t.chooseDistrict} disabled={!form.state} error={fieldError('district')} />
            <SelectField id="block" label={t.block} value={form.block} onChange={(e) => update('block', e.target.value)} options={blocks} placeholder={t.chooseBlock} disabled={!form.district} error={fieldError('block')} />
          </div></fieldset>
          <fieldset><legend><span className="field-number">02</span><span><strong>{t.business}</strong><small>{t.businessHelp}</small></span></legend><SelectField id="category" label={t.category} value={form.category} onChange={(e) => update('category', e.target.value)} options={BUSINESS_CATEGORIES} placeholder={t.chooseCategory} error={fieldError('category')} /></fieldset>
          <fieldset><legend><span className="field-number">03</span><span><strong>{t.capital}</strong><small>{t.capitalHelp}</small></span></legend><label className="onboarding-label" htmlFor="margin">{t.margin}<span className="required">*</span></label><div className={`amount-input ${fieldError('margin') ? 'has-error' : ''}`}><span>{t.rupees}</span><input id="margin" type="number" min="1" step="1" inputMode="decimal" value={form.margin} onChange={(e) => update('margin', e.target.value)} onBlur={() => setTouched((current) => ({ ...current, margin: true }))} placeholder={t.amountPlaceholder} aria-invalid={Boolean(fieldError('margin'))} required /></div>{fieldError('margin') && <p className="onboarding-error" role="alert">{fieldError('margin')}</p>}</fieldset>
          {status === 'error' && <p className="submit-error" role="alert">{t.submitError}</p>}
          <div className="submit-row"><p><span className="lock-mark">▣</span>{t.secureNote}</p><button className="generate-button" type="submit" disabled={status === 'loading'}>{status === 'loading' ? t.generating : t.continue}<span aria-hidden="true">↗</span></button></div>
        </form>
      </section>
    </div>
    <footer className="start-footer"><span>ARTHNITI / 2026</span><span className="footer-line" /><span>{t.startFinance}</span></footer>
  </main>;
}

function SelectField({ id, label, value, onChange, options, placeholder, disabled = false, error }) {
  return <div className="select-field"><label className="onboarding-label" htmlFor={id}>{label}<span className="required">*</span></label><div className={`select-wrap ${error ? 'has-error' : ''}`}><select id={id} value={value} onChange={onChange} disabled={disabled} aria-invalid={Boolean(error)} required><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><span aria-hidden="true">⌄</span></div>{error && <p className="onboarding-error" role="alert">{error}</p>}</div>;
}
