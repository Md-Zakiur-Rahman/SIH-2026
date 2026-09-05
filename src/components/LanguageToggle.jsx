import { getNextLanguage, persistLanguage } from '../i18n';

export default function LanguageToggle({ language, onChange, label, ariaLabel = 'Change language' }) {
  function handleChange() {
    const nextLanguage = getNextLanguage(language);
    persistLanguage(nextLanguage);
    onChange(nextLanguage);
  }

  const languageMark = language === 'en' ? 'अ' : language === 'hi' ? 'అ' : 'A';
  return <button type="button" className="language-toggle" onClick={handleChange} aria-label={ariaLabel}>
    <span className="language-mark">{languageMark}</span><span>{label}</span><span className="language-arrow" aria-hidden="true">↗</span>
  </button>;
}
