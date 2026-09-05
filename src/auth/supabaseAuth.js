// Placeholder for the future Supabase adapter. It intentionally has the same contract as mockAuth.
export async function login() { throw new Error('SUPABASE_NOT_CONFIGURED'); }
export async function signup() { throw new Error('SUPABASE_NOT_CONFIGURED'); }
export async function logout() { return true; }
