const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function parseResponse(response, fallbackMessage) {
  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

/**
 * Step 1 of Razorpay flow:
 * Creates a Razorpay order on our backend before opening the payment modal.
 *
 * @param {string} luxeOrderId   - Our LUXE MongoDB order _id
 * @param {string} token         - JWT access token
 * @returns {Promise<{ razorpay_order_id, amount, currency, key, prefill }>}
 */
export async function createRazorpayOrder(luxeOrderId, token) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/payments/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId: luxeOrderId }),
    });
  } catch {
    throw new Error('Could not reach the payment server. Please make sure the backend is running on port 5000.');
  }

  return parseResponse(response, 'Failed to initiate Razorpay payment.');
}

export async function fetchRazorpayConfig() {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/payments/razorpay/config`);
  } catch {
    throw new Error('Could not validate Razorpay configuration. Please make sure the backend is running on port 5000.');
  }

  return parseResponse(response, 'Failed to load Razorpay configuration.');
}

/**
 * Step 3 of Razorpay flow:
 * Sends Razorpay's success callback data to our backend for cryptographic verification.
 *
 * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature, luxe_order_id }} payload
 * @param {string} token - JWT access token
 * @returns {Promise<{ success: boolean, order: object }>}
 */
export async function verifyRazorpayPayment(payload, token) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/payments/razorpay/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the payment verification server. Please contact support if payment was already deducted.');
  }

  return parseResponse(response, 'Payment verification failed. Please contact support.');
}
