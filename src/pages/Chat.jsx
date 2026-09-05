import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from '../components/LanguageToggle';
import { getInitialLanguage, translations } from '../i18n';
import { formatCurrency } from '../lib/finance';
import { getSavedPlan } from '../services/onboardingService';
import { chatService } from '../services/chatService';
import blueLogo from '../../image/blue.png';
import favicon from '../../image/favicon.png';

export default function Chat() { return <ChatExperience />; }

export function ChatExperience({ overlay = false, isClosing = false, onClose, applicationPlan, applicationFinance }) {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [messages, setMessages] = useState(() => [{ id: 1, role: 'assistant', text: translations[getInitialLanguage()].chatWelcome }]);
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const endRef = useRef(null);
  const closeRef = useRef(null);
  const navigate = useNavigate();
  const t = translations[language];
  const storedPlan = useMemo(() => getSavedPlan(), []);
  const plan = applicationPlan || storedPlan;
  const finance = applicationFinance || getStoredFinance(plan);
  const context = useMemo(() => buildContext(plan, finance, t, language), [plan, finance, t, language]);
  const suggestions = [t.chatSuggestionFeasibility, t.chatSuggestionLoan, t.chatSuggestionRisks, t.chatSuggestionViability];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, isSending]);
  useEffect(() => { setMessages((current) => current.map((item) => item.id === 1 ? { ...item, text: t.chatWelcome } : item)); }, [t.chatWelcome]);
  useEffect(() => {
    if (!overlay) return undefined;
    const previousFocus = document.activeElement;
    document.body.classList.add('chat-overlay-open');
    closeRef.current?.focus();
    function handleEscape(event) { if (event.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', handleEscape);
    return () => { document.body.classList.remove('chat-overlay-open'); document.removeEventListener('keydown', handleEscape); previousFocus?.focus?.(); };
  }, [overlay]);

  async function sendMessage(nextValue = value) {
    const message = nextValue.trim();
    if (!message || isSending) return;
    setValue(''); setError(false); setLastMessage(message); setMessages((current) => [...current, { id: Date.now(), role: 'user', text: message }]); setIsSending(true);
    try { const history = messages.filter((item) => item.role === 'user' || item.role === 'assistant'); const response = await chatService.sendMessage({ message, context, history }); setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: response }]); }
    catch { setError(true); }
    finally { setIsSending(false); }
  }

  function handleKeyDown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }

  const content = <main className="chat-shell">
    <header className="chat-header"><button className="chat-identity" type="button" onClick={() => navigate('/results')} aria-label="ARTHNITI"><img src={favicon} alt="" /><span><strong>Arthniti</strong><small>{t.chatAssistant}</small></span></button><div className="chat-header-actions"><LanguageToggle language={language} onChange={setLanguage} label={t.resultsLanguage} ariaLabel={t.changeLanguage} />{overlay && <button ref={closeRef} className="chat-close" type="button" onClick={onClose} aria-label={t.chatClose}><span aria-hidden="true">×</span></button>}</div></header>
    <section className="chat-layout" aria-label={t.chatTitle}><div className="chat-context-line"><span>{t.chatContextLabel}</span><strong>{plan?.input?.category || t.chatNoPlan}</strong></div><div className="chat-thread" aria-live="polite">{messages.map((item) => <article className={`chat-message ${item.role}`} key={item.id}><span className="chat-message-label">{item.role === 'assistant' ? t.chatAssistant : t.chatYou}</span><p>{item.text}</p></article>)}{isSending && <article className="chat-message assistant"><span className="chat-message-label">{t.chatAssistant}</span><p className="chat-typing">{t.chatSending}</p></article>}{error && <div className="chat-error" role="alert"><p>{t.chatError}</p><button type="button" onClick={() => sendMessage(lastMessage)}>{t.chatRetry}</button></div>}<div ref={endRef} /></div>{messages.length === 1 && <div className="chat-suggestions"><span>{t.chatSuggested}</span><div>{suggestions.map((item) => <button type="button" key={item} onClick={() => sendMessage(item)}>{item}<b aria-hidden="true">↗</b></button>)}</div></div>}<form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><label className="sr-only" htmlFor="chat-input">{t.chatInputLabel}</label><textarea id="chat-input" rows="2" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={handleKeyDown} placeholder={t.chatPlaceholder} disabled={isSending} /><button type="submit" disabled={!value.trim() || isSending}>{isSending ? t.chatSending : t.chatSend}<span aria-hidden="true">↗</span></button></form><p className="chat-hint">{t.chatInputHint}</p></section>
  </main>;
  if (!overlay) return content;
  return <div className={`chat-overlay ${isClosing ? 'is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={t.chatTitle}><div className="chat-backdrop" onMouseDown={onClose} aria-hidden="true" /><aside className="chat-panel">{content}</aside></div>;
}

function buildContext(plan, finance, t, language) {
  const location = plan?.input ? `${plan.input.state}, ${plan.input.district}, ${plan.input.block}` : t.chatNoPlan;
  const score = 72;
  const numericMargin = Number(plan?.input?.margin);
  return { language: language === 'hi' ? 'Hindi' : language === 'te' ? 'Telugu' : 'English', category: plan?.input?.category || t.chatNoPlan, location, margin: Number.isFinite(numericMargin) ? numericMargin : null, projectCost: finance?.projectCost ?? null, loanAmount: finance?.loanAmount ?? null, sanctionedLoan: finance?.sanctionedLoan ?? null, emiValue: finance?.eligible ? finance.emi : null, loan: finance ? formatCurrency(finance.sanctionedLoan) : '-', emi: finance?.eligible ? formatCurrency(finance.emi) : '-', scheme: finance?.scheme || t.chatNoPlan, interest: finance?.eligible ? `${finance.interest}%` : '-', tenure: finance?.eligible ? `${finance.tenureYears} years` : '-', moratorium: finance?.eligible ? `${finance.moratoriumMonths} months` : '-', eligible: finance?.eligible ? 'Yes' : 'No', eligibilityReason: finance?.reason || t.chatNoPlan, score, marketReach: t.mockConsumerBase, swot: `Strengths: ${t.mockStrengths.join('; ')}. Weaknesses: ${t.mockWeaknesses.join('; ')}. Opportunities: ${t.mockOpportunities.join('; ')}. Threats: ${t.mockThreats.join('; ')}.`, risks: t.mockRisks.join('; '), opportunity: t.mockNiche, competition: t.mockCompetitionReason, pricing: `${t.mockPricingRange}; ${t.mockPricingReason}`, recommendations: t.mockRecommendations.join('; '), finance: finance || { eligible: false }, copy: t };
}

function getStoredFinance(plan) {
  const candidate = plan?.calculator;
  if (!candidate || typeof candidate !== 'object') return null;
  const required = ['projectCost', 'loanAmount', 'sanctionedLoan', 'emi'];
  if (!required.every((key) => Number.isFinite(Number(candidate[key]))) || typeof candidate.eligible !== 'boolean') return null;
  return candidate;
}
