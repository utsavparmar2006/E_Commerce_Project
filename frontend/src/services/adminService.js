const ADMIN_API_BASE = 'http://localhost:5000/api/admin';

async function parseJsonResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return payload;
}

function authHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Fetch dashboard stats: total, newToday, active, blocked, admins
 */
export async function fetchDashboardStats(accessToken) {
  const response = await fetch(`${ADMIN_API_BASE}/stats`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  return parseJsonResponse(response);
}

/**
 * Fetch paginated, searchable, filterable list of all users
 */
export async function fetchAllUsers(accessToken, { page = 1, limit = 10, search = '', role = '', status = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  if (status) params.set('status', status);

  const response = await fetch(`${ADMIN_API_BASE}/users?${params}`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  return parseJsonResponse(response);
}

/**
 * Fetch a single user's full details by ID
 */
export async function fetchUserById(accessToken, userId) {
  const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  return parseJsonResponse(response);
}

/**
 * Toggle block / unblock status for a user
 */
export async function toggleBlockUser(accessToken, userId) {
  const response = await fetch(`${ADMIN_API_BASE}/users/${userId}/block`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  return parseJsonResponse(response);
}

/**
 * Permanently delete a user by ID
 */
export async function deleteUser(accessToken, userId) {
  const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  return parseJsonResponse(response);
}
