const defaultUsers = [
  { id: 'demo-user', name: 'Demo User', email: 'demo@arthniti.in', role: 'user', password: 'demo123' },
  { id: 'demo-bank', name: 'SCA Officer', email: 'bank@arthniti.in', role: 'bank', password: 'bank123' },
];
const USERS_KEY = 'arthniti_mock_users';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || [...defaultUsers]; } catch { return [...defaultUsers]; }
}

function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function normalizeMobile(value) { return value.replace(/\D/g, '').replace(/^91/, ''); }

export async function login(identifier, password) {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const normalized = identifier.trim().toLowerCase();
  const match = getUsers().find((user) => (user.email === normalized || user.id === normalized) && user.password === password);
  if (!match) throw new Error('INVALID_CREDENTIALS');
  const { password: _password, ...safeUser } = match;
  return safeUser;
}

export async function signup({ fullName, mobile, email, password }) {
  await new Promise((resolve) => setTimeout(resolve, 550));
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMobile = normalizeMobile(mobile);
  const users = getUsers();
  if (users.some((user) => user.email === normalizedEmail || user.mobile === normalizedMobile)) throw new Error('ACCOUNT_EXISTS');
  const user = { id: `user-${Date.now()}`, name: fullName.trim(), email: normalizedEmail, mobile: normalizedMobile, role: 'user', password };
  users.push(user);
  saveUsers(users);
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function logout() { return true; }
