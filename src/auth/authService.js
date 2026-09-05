import { AUTH_MODE } from '../config';
import * as mockAuth from './mockAuth';
import * as supabaseAuth from './supabaseAuth';

const provider = AUTH_MODE === 'supabase' ? supabaseAuth : mockAuth;
export const authService = { login: provider.login, signup: provider.signup, logout: provider.logout };
