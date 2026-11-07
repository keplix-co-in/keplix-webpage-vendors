// Stand-in for lib/supabase.js. Tests set handlers on `sb.auth.*` and read `calls`.
export const calls = [];
const record = (name) => (...args) => { calls.push([name, ...args]); return handlers[name](...args); };
export const handlers = {};
const NAMES = ['signUp', 'signInWithPassword', 'signOut', 'resend', 'verifyOtp',
  'resetPasswordForEmail', 'updateUser', 'getUser', 'signInWithIdToken', 'refreshSession'];
export const reset = () => {
  calls.length = 0;
  for (const n of NAMES) handlers[n] = async () => ({ data: {}, error: null });
};
reset();
export const supabase = { auth: Object.fromEntries(NAMES.map((n) => [n, record(n)])) };
export const holdLog = [];
export const setHoldMirror = (v) => holdLog.push(v);
export default supabase;
