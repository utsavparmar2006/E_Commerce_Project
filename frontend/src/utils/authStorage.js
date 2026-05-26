const USER_KEY = 'luxe-user';

/**
 * Load the persisted user profile from sessionStorage.
 * The access token is NEVER stored here — it lives in React state (in-memory) only.
 */
export function loadUser() {
  try {
    const stored = window.sessionStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Persist only the user profile (NOT the access token) to sessionStorage.
 * This allows the UI to render the correct user state immediately on page refresh
 * while the access token is being silently rehydrated from the refresh cookie.
 */
export function persistUser(user) {
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove the persisted user profile from sessionStorage on logout.
 */
export function clearUser() {
  window.sessionStorage.removeItem(USER_KEY);
}

/**
 * Extract the safe user profile fields from a backend API response.
 * The access token is intentionally excluded — set it separately in React state.
 */
export function buildUserFromApi(apiResponse) {
  return {
    _id: apiResponse._id,
    name: apiResponse.name,
    email: apiResponse.email,
    phone: apiResponse.phone,
    avatar: apiResponse.avatar,
    role: apiResponse.role,
    isVerified: apiResponse.isVerified,
    isBlocked: apiResponse.isBlocked,
  };
}
