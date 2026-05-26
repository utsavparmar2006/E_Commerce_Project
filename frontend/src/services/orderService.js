const API_BASE = 'http://localhost:5000/api/orders';

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
 * Submit checkout payload to place a new order
 */
export const placeOrder = async (orderData, token) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to place order');
  }
  return response.json();
};

/**
 * Fetch all orders placed by the currently logged-in user
 */
export const fetchMyOrders = async (token) => {
  const response = await fetch(`${API_BASE}/my`, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch your orders');
  }
  return response.json();
};

/**
 * Fetch single order details by ID
 */
export const fetchOrderById = async (orderId, token) => {
  const response = await fetch(`${API_BASE}/${orderId}`, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch order details');
  }
  return response.json();
};

/**
 * Cancel a processing order
 */
export const cancelOrder = async (orderId, token) => {
  const response = await fetch(`${API_BASE}/${orderId}/cancel`, {
    method: 'PUT',
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to cancel order');
  }
  return response.json();
};

/**
 * Validate a checkout coupon code with items price subtotal
 */
export const validateCouponCode = async (code, itemsPrice, token) => {
  const response = await fetch(`${API_BASE}/coupon/validate`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ code, itemsPrice }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to validate coupon code');
  }
  return response.json();
};

/**
 * [Admin Only] Fetch paginated, searchable and filterable list of all orders in system
 */
export const fetchAllOrders = async (token, { page = 1, limit = 10, search = '', status = '' } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  const response = await fetch(`${API_BASE}?${params}`, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch all system orders');
  }
  return response.json();
};

/**
 * [Admin Only] Modify fulfillment or payment tracking status for an order
 */
export const updateOrderStatus = async (orderId, statusData, token) => {
  const response = await fetch(`${API_BASE}/${orderId}/status`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(statusData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update order status');
  }
  return response.json();
};
