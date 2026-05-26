const API_BASE = 'http://localhost:5000/api/categories';

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchCategories(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured);

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  return parseJsonResponse(response);
}

export async function fetchCategoryById(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  return parseJsonResponse(response);
}

export async function createCategory(token, data) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(response);
}

export async function updateCategory(token, id, data) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(response);
}

export async function deleteCategory(token, id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJsonResponse(response);
}
