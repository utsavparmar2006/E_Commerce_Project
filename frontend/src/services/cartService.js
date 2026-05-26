const API_BASE = 'http://localhost:5000/api/cart';

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
 * Fetch authenticated user's cart from backend
 */
export const fetchCartApi = async (token) => {
  const response = await fetch(API_BASE, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch cart');
  }
  return response.json();
};

/**
 * Add a product to the cart on backend
 */
export const addToCartApi = async (productId, quantity, token) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ productId, quantity }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add item to cart');
  }
  return response.json();
};

/**
 * Update dynamic quantity of a product inside backend cart
 */
export const updateCartItemApi = async (productId, quantity, token) => {
  const response = await fetch(`${API_BASE}/${productId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update item quantity');
  }
  return response.json();
};

/**
 * Remove product from backend cart
 */
export const removeCartItemApi = async (productId, token) => {
  const response = await fetch(`${API_BASE}/${productId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove item from cart');
  }
  return response.json();
};

/**
 * Wipes the database cart clean
 */
export const clearCartApi = async (token) => {
  const response = await fetch(API_BASE, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to clear cart');
  }
  return response.json();
};
