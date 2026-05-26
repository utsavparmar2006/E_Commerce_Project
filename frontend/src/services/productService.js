const API_BASE = 'http://localhost:5000/api/products';

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

export async function fetchProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.brand) params.append('brand', filters.brand);
  if (filters.search) params.append('search', filters.search);
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice);
  if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.adminMode !== undefined) params.append('adminMode', filters.adminMode);

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  return parseJsonResponse(response);
}

export async function fetchProductByIdOrSlug(idOrSlug) {
  const response = await fetch(`${API_BASE}/${idOrSlug}`);
  return parseJsonResponse(response);
}

export async function createProduct(token, data) {
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

export async function updateProduct(token, id, data) {
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

export async function deleteProduct(token, id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJsonResponse(response);
}
