const API_BASE = 'http://localhost:5000/api/wishlist';

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
 * Fetch authenticated user's wishlist from backend
 */
export const fetchWishlistApi = async (token) => {
  const response = await fetch(API_BASE, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch wishlist');
  }
  return response.json();
};

/**
 * Add a product to the wishlist on backend
 */
export const addToWishlistApi = async (productId, token) => {
  const response = await fetch(`${API_BASE}/${productId}`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add item to wishlist');
  }
  return response.json();
};

/**
 * Remove product from backend wishlist
 */
export const removeFromWishlistApi = async (productId, token) => {
  const response = await fetch(`${API_BASE}/${productId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to remove item from wishlist');
  }
  return response.json();
};
