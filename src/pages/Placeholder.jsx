import { useAuth } from '../auth/AuthContext';
export default function Placeholder({ bank = false }) {
  const { user, logout } = useAuth();
  return <main className="placeholder"><p className="kicker">ARTHNITI / {bank ? 'BANK' : 'START'}</p><h1>{bank ? 'Bank workspace' : 'Your business journey starts here.'}</h1><p>Signed in as {user.name}. This route is ready for the next product module.</p><button className="sign-in-button placeholder-button" onClick={logout}>Sign out <span>↗</span></button></main>;
}
