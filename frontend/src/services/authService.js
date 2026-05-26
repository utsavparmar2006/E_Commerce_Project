const AUTH_API_BASE = 'http://localhost:5000/api/auth';

async function parseJsonResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function registerUser(registerPayload) {
  const response = await fetch(`${AUTH_API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(registerPayload),
  });

  return parseJsonResponse(response);
}

export async function loginUser(loginPayload) {
  const response = await fetch(`${AUTH_API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(loginPayload),
  });

  return parseJsonResponse(response);
}

export async function loginWithGoogle(idToken) {
  const response = await fetch(`${AUTH_API_BASE}/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  });

  return parseJsonResponse(response);
}

/**
 * Use the HTTP-Only refresh token cookie to silently obtain a fresh access token.
 * Called automatically on every app mount to rehydrate the in-memory session
 * without requiring the user to log in again.
 * The browser sends the cookie automatically — no JS token handling required.
 */
export async function refreshAccessToken() {
  const response = await fetch(`${AUTH_API_BASE}/refresh`, {
    method: 'POST',
    credentials: 'include', // sends the HTTP-only refreshToken cookie automatically
  });

  return parseJsonResponse(response);
}

export async function logoutUser() {
  const response = await fetch(`${AUTH_API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return parseJsonResponse(response);
}

export async function fetchUserProfile(token) {
  const response = await fetch(`${AUTH_API_BASE}/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  return parseJsonResponse(response);
}

export async function updateUserProfile(profilePayload, token) {
  const response = await fetch(`${AUTH_API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(profilePayload),
  });

  return parseJsonResponse(response);
}
