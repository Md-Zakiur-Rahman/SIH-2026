import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { getInitialLanguage, translations } from '../i18n';
import whiteLogo from '../../image/white.png';
import blueLogo from '../../image/blue.png';

export default function Login() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];

  async function handleSubmit(event) {
    event.preventDefault(); setStatus('loading');
    try { const user = await login(identifier, password); navigate(user.role === 'bank' ? '/bank' : '/assessments', { replace: true }); }
    catch { setStatus('error'); }
  }

  return <main className="login-shell">
    <section className="brand-panel" aria-label="ARTHNITI">
      <div className="brand-topline"><span className="saffron-rule" /> <span>ARTHNITI / 01</span></div>
      <div className="brand-lockup"><img className="brand-logo brand-logo-white" src={whiteLogo} alt="ARTHNITI" /><div className="brand-line">{t.brandLine}</div></div>
      <div className="brand-message"><p className="kicker">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      <div className="brand-footer"><span>{t.brandFooter}</span><span className="footer-line" /><span>EST. 2026</span></div>
    </section>
    <section className="login-panel">
      <header className="login-header"><img className="mobile-brand-logo" src={blueLogo} alt="ARTHNITI" /><LanguageToggle language={language} onChange={setLanguage} label={t.language} ariaLabel={t.changeLanguage} /></header>
      <div className="form-wrap">
        <div className="form-heading"><span className="section-index">01</span><p>{t.welcome}</p><h2>{t.loginHeading}</h2></div>
        <form onSubmit={handleSubmit} noValidate>
          {status === 'error' && <div className="error-message" role="alert"><span aria-hidden="true">!</span>{t.error}</div>}
          <label htmlFor="identifier">{t.identifier}<span className="required">*</span></label>
          <input id="identifier" type="text" autoComplete="username" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setStatus('idle'); }} placeholder={t.placeholderIdentifier} required />
          <span className="field-hint">{t.identifierHint}</span>
          <label htmlFor="password">{t.password}<span className="required">*</span></label>
          <div className="password-wrap"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setStatus('idle'); }} placeholder={t.placeholderPassword} required /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? t.hide : t.show}</button></div>
          <span className="field-hint">{t.passwordHint}</span>
          <button className="sign-in-button" type="submit" disabled={status === 'loading' || !identifier || !password}>{status === 'loading' ? t.signingIn : t.signIn}<span aria-hidden="true">↗</span></button>
        </form>
        <p className="auth-switch"><span>{t.newToArthniti}</span><button type="button" onClick={() => navigate('/signup')}>{t.createAccount}<span aria-hidden="true">↗</span></button></p>
        <p className="security-note"><span className="lock-mark">▣</span>{t.demoHint}</p>
      </div>
      <footer className="login-footer">{t.copyright} <span /> {t.footer}</footer>
    </section>
  </main>;
}
