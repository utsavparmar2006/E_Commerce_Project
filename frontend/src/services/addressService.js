const API_BASE = 'http://localhost:5000/api/addresses';

/**
 * Helper to build common headers with authorization tokens
 */
const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Fetch all saved shipping addresses of the authenticated user
 */
export const fetchAddresses = async (token) => {
  const response = await fetch(API_BASE, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch addresses');
  }
  return response.json();
};

/**
 * Save a new shipping address
 */
export const createAddress = async (addressData, token) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(addressData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save address');
  }
  return response.json();
};

/**
 * Update an existing shipping address details
 */
export const updateAddress = async (addressId, addressData, token) => {
  const response = await fetch(`${API_BASE}/${addressId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(addressData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update address');
  }
  return response.json();
};

/**
 * Delete a shipping address from user's saved list
 */
export const deleteAddress = async (addressId, token) => {
  const response = await fetch(`${API_BASE}/${addressId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete address');
  }
  return response.json();
};

/**
 * Set a saved shipping address as the default address
 */
export const setDefaultAddress = async (addressId, token) => {
  const response = await fetch(`${API_BASE}/${addressId}/default`, {
    method: 'PATCH',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to set default address');
  }
  return response.json();
};
