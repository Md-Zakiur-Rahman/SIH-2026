import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { useAuth } from '../auth/AuthContext';
import { getInitialLanguage, translations } from '../i18n';
import whiteLogo from '../../image/white.png';

const initialForm = { fullName: '', mobile: '', email: '', password: '', confirmPassword: '' };

export default function Signup() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];
  const errors = {
    fullName: !form.fullName.trim() ? t.signupRequired : '',
    mobile: !/^(?:\+?91[-\s]?)?[6-9]\d{9}$/.test(form.mobile.trim()) ? t.invalidMobile : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? t.invalidEmail : '',
    password: !/^(?=.*\d).{8,}$/.test(form.password) ? t.weakPassword : '',
    confirmPassword: form.password !== form.confirmPassword ? t.passwordMismatch : '',
  };
  const isValid = Object.values(errors).every((error) => !error);
  const update = (field, value) => { setStatus('idle'); setForm((current) => ({ ...current, [field]: value })); };
  const fieldError = (field) => touched[field] && errors[field];

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ fullName: true, mobile: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;
    setStatus('loading');
    try { await signup(form); navigate('/start', { replace: true }); }
    catch (error) { setStatus(error.message === 'ACCOUNT_EXISTS' ? 'exists' : 'error'); }
  }

  return <main className="signup-shell">
    <section className="signup-intro"><div className="brand-topline"><span className="saffron-rule" /><span>{t.signupEyebrow}</span></div><div className="signup-lockup"><img className="brand-logo brand-logo-white" src={whiteLogo} alt="ARTHNITI" /></div><div className="signup-copy"><p className="kicker">02 / 03</p><h1>{t.signupTitle}</h1><p>{t.signupSubtitle}</p></div><div className="signup-intro-footer">{t.signupFooter}</div></section>
    <section className="signup-panel"><header className="signup-header"><button className="back-link" type="button" onClick={() => navigate('/login')}>← {t.signupSignIn || t.signIn}</button><LanguageToggle language={language} onChange={setLanguage} label={t.signupLanguage} ariaLabel={t.changeLanguage} /></header><div className="signup-form-wrap"><div className="signup-heading"><span className="section-index">01</span><div><p>{t.signupEyebrow}</p><h2>{t.signupHeading}</h2></div></div><form className="signup-form" onSubmit={handleSubmit} noValidate>{(status === 'error' || status === 'exists') && <div className="error-message" role="alert"><span>!</span>{status === 'exists' ? t.accountExists : t.signupError}</div>}
      <SignupField id="fullName" label={t.fullName} type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} onBlur={() => setTouched((current) => ({ ...current, fullName: true }))} placeholder={t.fullNamePlaceholder} error={fieldError('fullName')} autoComplete="name" />
      <div className="signup-two-column"><SignupField id="mobile" label={t.mobile} type="tel" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} onBlur={() => setTouched((current) => ({ ...current, mobile: true }))} placeholder={t.mobilePlaceholder} error={fieldError('mobile')} autoComplete="tel" /><SignupField id="email" label={t.email} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} onBlur={() => setTouched((current) => ({ ...current, email: true }))} placeholder={t.emailPlaceholder} error={fieldError('email')} autoComplete="email" /></div>
      <div className="signup-two-column"><SignupField id="password" label={t.createPassword} type="password" value={form.password} onChange={(e) => update('password', e.target.value)} onBlur={() => setTouched((current) => ({ ...current, password: true }))} placeholder={t.createPasswordPlaceholder} error={fieldError('password')} hint={t.passwordHintSignup} autoComplete="new-password" /><SignupField id="confirmPassword" label={t.confirmPassword} type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))} placeholder={t.confirmPasswordPlaceholder} error={fieldError('confirmPassword')} autoComplete="new-password" /></div>
      <button className="generate-button signup-submit" type="submit" disabled={status === 'loading'}>{status === 'loading' ? t.creatingAccount : t.createAccountButton}<span aria-hidden="true">↗</span></button></form><p className="signup-switch">{t.alreadyHaveAccount} <button type="button" onClick={() => navigate('/login')}>{t.signupSignIn || t.signIn}</button></p><p className="security-note"><span className="lock-mark">▣</span>{t.signupPrivacy}</p></div></section>
  </main>;
}

function SignupField({ id, label, type, value, onChange, onBlur, placeholder, error, hint, autoComplete }) {
  return <div className="signup-field"><label htmlFor={id}>{label}<span className="required">*</span></label><input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} required />{hint && !error && <span className="field-hint">{hint}</span>}{error && <p className="onboarding-error" role="alert">{error}</p>}</div>;
}
