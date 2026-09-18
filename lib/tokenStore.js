// Web stand-in for the mobile app's services/tokenManager.js (expo-secure-store).
//
// The browser has no secure-store equivalent, so tokens live in localStorage.
// That is the same trade-off kepix-admin already makes, and it is what the
// backend expects: it returns the pair in the JSON body and reads the access
// token from the Authorization header, with no cookie involved.
//
// Every access is wrapped: localStorage throws in private-mode Safari and when
// a browser blocks site data, and a thrown error here would take down the whole
// app shell rather than just signing the vendor out.

const ACCESS_KEY = 'keplix_vendor_access';
const REFRESH_KEY = 'keplix_vendor_refresh';
const USER_KEY = 'keplix_vendor_user';

const read = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the session simply will not survive a reload.
  }
};

export const tokenStore = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),
  setAccessToken: (token) => write(ACCESS_KEY, token),
  setRefreshToken: (token) => write(REFRESH_KEY, token),

  setTokens: ({ access, refresh }) => {
    if (access) write(ACCESS_KEY, access);
    if (refresh) write(REFRESH_KEY, refresh);
  },

  clearTokens: () => {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },

  getUser: () => {
    const raw = read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser: (user) => write(USER_KEY, user ? JSON.stringify(user) : null),

  clearAll: () => {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
    write(USER_KEY, null);
  },
};

export default tokenStore;
