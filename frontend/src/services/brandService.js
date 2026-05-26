const API_BASE = 'http://localhost:5000/api/brands';

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

export async function fetchBrands(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured);

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  return parseJsonResponse(response);
}

export async function fetchBrandById(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  return parseJsonResponse(response);
}

export async function createBrand(token, data) {
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

export async function updateBrand(token, id, data) {
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

export async function deleteBrand(token, id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJsonResponse(response);
}
