const AUTH_STORAGE_KEY = 'ivote.auth';

export const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user || null,
      token: null,
    };
  } catch (error) {
    return null;
  }
};

export const saveAuth = (auth) => {
  if (!auth) return;
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: auth.user || null,
        token: null,
      })
    );
  } catch (error) {
    return;
  }
};

export const clearAuth = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    return;
  }
};
