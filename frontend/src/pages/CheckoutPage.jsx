import { useEffect, useState, useRef } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { fetchAddresses, createAddress } from '../services/addressService.js';
import { cancelOrder, placeOrder, validateCouponCode } from '../services/orderService.js';
import {
  createRazorpayOrder,
  fetchRazorpayConfig,
  verifyRazorpayPayment,
} from '../services/paymentService.js';
import Icon from '../components/common/Icon.jsx';

function CheckoutPage({ authSession, navigate }) {
  const { cart, clearCart } = useCart();
  const token = authSession?.accessToken ?? null;
  const user = authSession?.user ?? null;

  // Component mounted tracking state
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Active address management state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [error, setError] = useState(null);

  // Address creation form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    mobile: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    addressType: 'home',
    isDefault: false
  });
  const [creatingAddress, setCreatingAddress] = useState(false);

  // Checkout totals & coupons states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState({
    loading: true,
    available: false,
    message: '',
  });

  const subtotal = cart?.totalPrice || 0;
  const shippingThreshold = 5000;
  const shippingFee = 150;
  const isFreeShipping = subtotal >= shippingThreshold;
  const finalShippingPrice = subtotal > 0 && !isFreeShipping ? shippingFee : 0;
  const grandTotal = Math.max(0, subtotal + finalShippingPrice - discountAmount);

  // Guard: if not authenticated, kick off to login
  useEffect(() => {
    if (!authSession) {
      navigate('/login');
    }
  }, [authSession, navigate]);

  // Dynamically load Razorpay checkout.js once on mount
  useEffect(() => {
    if (document.getElementById('razorpay-script')) {
      setRazorpayScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayScriptLoaded(true);
    script.onerror = () => console.error('Razorpay script failed to load');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchRazorpayConfig()
      .then((data) => {
        if (!isMounted) return;

        setRazorpayConfig({
          loading: false,
          available: Boolean(data.available),
          message: data.message || '',
        });

        if (!data.available) {
          setPaymentMethod((current) => (current === 'Razorpay' ? 'COD' : current));
        }
      })
      .catch((err) => {
        if (!isMounted) return;

        setRazorpayConfig({
          loading: false,
          available: false,
          message: err.message || 'Unable to validate Razorpay configuration right now.',
        });
        setPaymentMethod((current) => (current === 'Razorpay' ? 'COD' : current));
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load user saved addresses
  useEffect(() => {
    if (token) {
      setLoadingAddresses(true);
      fetchAddresses(token)
        .then((data) => {
          setAddresses(data);
          const defaultAddr = data.find(addr => addr.isDefault) || data[0] || null;
          setSelectedAddress(defaultAddr);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch saved addresses');
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [token]);

  // Handle address input updates
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit new address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError(null);
    setCreatingAddress(true);

    try {
      const savedAddress = await createAddress(newAddress, token);
      setAddresses(prev => [savedAddress, ...prev]);
      setSelectedAddress(savedAddress);
      setShowAddressForm(false);
      // Reset form
      setNewAddress({
        fullName: '',
        mobile: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        addressType: 'home',
        isDefault: false
      });
    } catch (err) {
      setError(err.message || 'Failed to save new shipping address');
    } finally {
      setCreatingAddress(false);
    }
  };

  // Coupon code trigger
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await validateCouponCode(couponCode, subtotal, token);
      setDiscountAmount(res.discount);
      setAppliedCoupon(couponCode.trim().toUpperCase());
      setCouponSuccess(res.message);
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setDiscountAmount(0);
      setAppliedCoupon('');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // ── Razorpay payment flow ────────────────────────────────────────────────
  const rollbackFailedRazorpayOrder = async (orderId) => {
    if (!orderId || !token) return;

    try {
      await cancelOrder(orderId, token);
    } catch {
      // Best-effort rollback only. We still show the original payment error.
    }
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayConfig.available) {
      setError(razorpayConfig.message || 'Razorpay is not available right now. Please use Cash on Delivery.');
      return;
    }

    if (!razorpayScriptLoaded || !window.Razorpay) {
      setError('Razorpay is still loading. Please wait a moment and try again.');
      return;
    }

    setError(null);
    setIsPlacingOrder(true);

    let createdOrder = null;
    let preserveCreatedOrder = false;

    try {
      // Step 1: Place the LUXE order in our DB (status: Processing, unpaid)
      const orderItems = cart.items.map(item => ({
        product: item.product._id || item.product.id,
        title: item.product.title,
        image: item.product.image || '',
        price: item.product.discountPrice ?? item.product.price,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          mobile: selectedAddress.mobile,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          landmark: selectedAddress.landmark,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          country: selectedAddress.country,
        },
        paymentMethod: 'Razorpay',
        itemsPrice: subtotal,
        shippingPrice: finalShippingPrice,
        discountAmount,
        totalPrice: grandTotal,
        couponCode: appliedCoupon,
      };

      createdOrder = await placeOrder(orderData, token);

      // Step 2: Ask backend to create a Razorpay order
      const rzpOrderData = await createRazorpayOrder(createdOrder._id, token);

      // Step 3: Open Razorpay modal
      await new Promise((resolve, reject) => {
        const rzpOptions = {
          key: rzpOrderData.key,
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency,
          name: 'LUXE',
          description: `Order #${createdOrder._id}`,
          image: '',
          order_id: rzpOrderData.razorpay_order_id,
          prefill: rzpOrderData.prefill,
          theme: { color: '#4f56da' },

          // ✅ User completes payment
          handler: async (response) => {
            try {
              preserveCreatedOrder = true;
              const verifyPayload = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                luxe_order_id: createdOrder._id,
              };

              // Step 4: Verify signature on backend
              const verified = await verifyRazorpayPayment(verifyPayload, token);

              // Step 5: Drain cart + show success
              await clearCart();
              setOrderSuccessData(verified.order);
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },

          // ❌ User closed the modal without paying
          modal: {
            ondismiss: async () => {
              await rollbackFailedRazorpayOrder(createdOrder?._id);
              if (isMounted.current) {
                setError('Payment was cancelled. No charge was made and the order was not finalized.');
                setIsPlacingOrder(false);
              }
              resolve(); // resolve so promise doesn't hang
            },
          },
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.on('payment.failed', (failResponse) => {
          reject(new Error(failResponse.error?.description || 'Payment failed'));
        });
        rzp.open();
      });
    } catch (err) {
      if (createdOrder?._id && !preserveCreatedOrder) {
        await rollbackFailedRazorpayOrder(createdOrder._id);
      }
      if (isMounted.current) {
        setError(err.message || 'Payment could not be completed. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setIsPlacingOrder(false);
      }
    }
  };

  // ── COD order flow ──────────────────────────────────────────────────────
  const handleCODOrder = async () => {
    setError(null);
    setIsPlacingOrder(true);

    try {
      const orderItems = cart.items.map(item => ({
        product: item.product._id || item.product.id,
        title: item.product.title,
        image: item.product.image || '',
        price: item.product.discountPrice ?? item.product.price,
        quantity: item.quantity,
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          mobile: selectedAddress.mobile,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          landmark: selectedAddress.landmark,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          country: selectedAddress.country,
        },
        paymentMethod: 'COD',
        itemsPrice: subtotal,
        shippingPrice: finalShippingPrice,
        discountAmount,
        totalPrice: grandTotal,
        couponCode: appliedCoupon,
      };

      const completedOrder = await placeOrder(orderData, token);
      await clearCart();
      setOrderSuccessData(completedOrder);
    } catch (err) {
      setError(err.message || 'An error occurred during order submission.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ── Main dispatcher ─────────────────────────────────────────────────────

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      setError('Please select or add a shipping address.');
      return;
    }
    if (!cart.items || cart.items.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }
    if (paymentMethod === 'Razorpay') {
      handleRazorpayPayment();
    } else {
      handleCODOrder();
    }
  };

  const isRazorpayDisabled = razorpayConfig.loading || !razorpayConfig.available;

  if (orderSuccessData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft p-4">
        <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 text-center shadow-luxe border border-brand-line relative overflow-hidden">
          {/* Decorative Gold Elements */}
          <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-brand-accent/5 blur-2xl" />
          <div className="absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-brand-accent/5 blur-2xl" />

          {/* Luxury Sparkle Checkmark */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f9f5e8] border border-brand-accent/30 text-brand-accent mb-6 animate-bounce">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-accent mb-2">Order Confirmed</p>
          <h2 className="font-display text-3xl font-bold text-brand-navy tracking-[-0.05em] mb-4">
            Thank you for your purchase
          </h2>
          <p className="text-sm text-brand-muted max-w-sm mx-auto leading-relaxed mb-6">
            Your premium order <span className="font-semibold text-brand-navy">#{orderSuccessData._id}</span> is now being processed. A delivery confirmation will be sent shortly.
          </p>

          <div className="rounded-2xl bg-brand-soft p-6 text-left border border-brand-line mb-8">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-navy border-b border-brand-line/60 pb-2 mb-3">
              Delivery Details
            </h4>
            <p className="text-sm font-semibold text-brand-navy mb-1">{orderSuccessData.shippingAddress.fullName}</p>
            <p className="text-xs text-brand-muted mb-2">📞 {orderSuccessData.shippingAddress.mobile}</p>
            <p className="text-xs text-brand-muted leading-relaxed">
              {orderSuccessData.shippingAddress.addressLine1}
              {orderSuccessData.shippingAddress.addressLine2 && `, ${orderSuccessData.shippingAddress.addressLine2}`}
              {orderSuccessData.shippingAddress.landmark && ` (Near ${orderSuccessData.shippingAddress.landmark})`}
              <br />
              {orderSuccessData.shippingAddress.city}, {orderSuccessData.shippingAddress.state} - {orderSuccessData.shippingAddress.pincode}
            </p>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-brand-line/60 text-sm font-bold text-brand-navy">
              <span>
                Grand Total via{' '}
                {orderSuccessData.paymentMethod === 'Razorpay' ? '✅ Razorpay (Paid)' : 'Cash on Delivery'}
              </span>
              <span className="text-base text-brand-accent">₹{orderSuccessData.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="flex-1 rounded-full bg-brand-navy hover:bg-brand-accent text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition"
            >
              View My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 rounded-full border border-brand-line bg-white hover:bg-brand-soft text-brand-navy py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft pb-16">
      {/* Upper Branded Bar */}
      <header className="border-b border-brand-line bg-white px-8 py-5 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-display text-2xl font-bold tracking-[-0.08em] text-brand-navy"
          >
            LUXE
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
            <span className="text-brand-accent font-bold">1. Checkout</span>
            <span className="opacity-50">➔</span>
            <span className="opacity-50">2. Confirmation</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-brand-navy mb-8">Secure Checkout</h1>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm font-medium text-rose-600 mb-6">
            ⚠ {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* ── Left Column: Shipping & Payment ── */}
          <div className="space-y-8">
            {/* Shipping Address Box */}
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-luxe border border-brand-line">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-navy">
                    <Icon name="marker" className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-brand-navy">Shipping Coordinates</h3>
                </div>
                {!showAddressForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="rounded-full border border-brand-line bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-navy hover:bg-brand-soft transition"
                  >
                    + Add New Address
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div className="py-8 text-center text-sm text-brand-muted animate-pulse">Loading addresses...</div>
              ) : showAddressForm ? (
                /* Inline Address Creation Form */
                <form onSubmit={handleSaveAddress} className="space-y-4 rounded-2xl bg-brand-soft/50 p-5 border border-brand-line/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-accent mb-2">New Address Coordinates</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Full Name *</label>
                      <input
                        required
                        type="text"
                        name="fullName"
                        value={newAddress.fullName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Mobile Phone *</label>
                      <input
                        required
                        type="text"
                        name="mobile"
                        value={newAddress.mobile}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Address Line 1 *</label>
                    <input
                      required
                      type="text"
                      name="addressLine1"
                      value={newAddress.addressLine1}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                      placeholder="House No, Apartment, Suite, Street name"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        name="addressLine2"
                        value={newAddress.addressLine2}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="Area, Colony, Village"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Landmark (Optional)</label>
                      <input
                        type="text"
                        name="landmark"
                        value={newAddress.landmark}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="E.g. Near Market Square"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">City *</label>
                      <input
                        required
                        type="text"
                        name="city"
                        value={newAddress.city}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="City name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">State *</label>
                      <input
                        required
                        type="text"
                        name="state"
                        value={newAddress.state}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="State name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Pincode *</label>
                      <input
                        required
                        type="text"
                        name="pincode"
                        value={newAddress.pincode}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                        placeholder="380001"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
                    <div className="flex gap-4">
                      {['home', 'work', 'other'].map(type => (
                        <label key={type} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-brand-navy">
                          <input
                            type="radio"
                            name="addressType"
                            value={type}
                            checked={newAddress.addressType === type}
                            onChange={handleInputChange}
                            className="accent-brand-accent"
                          />
                          <span className="capitalize">{type}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="rounded-full border border-brand-line px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={creatingAddress}
                        className="rounded-full bg-brand-navy text-white px-5 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-brand-accent transition"
                      >
                        {creatingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 bg-brand-soft/40 border border-brand-line/60 rounded-2xl">
                  <p className="text-xs text-brand-muted mb-3">No saved addresses found. Please add a shipping destination to continue checkout.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="rounded-full bg-brand-navy px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                  >
                    + Add My First Address
                  </button>
                </div>
              ) : (
                /* Address Grid Selection Cards */
                <div className="grid gap-4 sm:grid-cols-2">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddress?._id === addr._id;
                    return (
                      <div
                        key={addr._id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`rounded-2xl p-5 border text-left relative cursor-pointer transition-all duration-300 ${isSelected
                            ? 'bg-[#faf6eb] border-brand-accent shadow-md shadow-brand-accent/5'
                            : 'bg-white border-brand-line hover:border-brand-navy/30'
                          }`}
                      >
                        {/* Selector Mark */}
                        <div className={`absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'bg-brand-accent border-brand-accent text-white' : 'border-brand-line'
                          }`}>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </div>

                        {addr.isDefault && (
                          <span className="rounded bg-brand-accent/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-brand-accent mb-2.5 inline-block uppercase">
                            Default
                          </span>
                        )}

                        <p className="text-sm font-semibold text-brand-navy mb-1 pr-6">{addr.fullName}</p>
                        <span className="inline-block text-[9px] uppercase font-bold text-brand-muted tracking-wider border border-brand-line px-1.5 py-0.2 rounded mb-2">
                          {addr.addressType}
                        </span>
                        <p className="text-xs text-brand-muted leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                          <br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[10px] font-medium text-brand-navy mt-2">📞 {addr.mobile}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Payment Method Section */}
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-luxe border border-brand-line">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-navy">
                  <Icon name="card" className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-display text-xl font-bold text-brand-navy">Payment Method</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* COD option */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`rounded-2xl p-5 border text-left relative cursor-pointer transition-all duration-300 ${paymentMethod === 'COD'
                      ? 'bg-[#faf6eb] border-brand-accent'
                      : 'bg-white border-brand-line hover:border-brand-navy/30'
                    }`}
                >
                  <div className={`absolute top-4 right-4 flex h-4 w-4 items-center justify-center rounded-full border ${paymentMethod === 'COD' ? 'bg-brand-accent border-brand-accent text-white' : 'border-brand-line'
                    }`}>
                    {paymentMethod === 'COD' && <span className="text-[8px]">✓</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💵</span>
                    <h4 className="text-sm font-bold text-brand-navy uppercase">Cash on Delivery</h4>
                  </div>
                  <p className="text-[10px] text-brand-muted leading-relaxed">Pay with cash or UPI at your doorstep. No advance payment required.</p>
                </div>

                {/* Razorpay option */}
                <div
                  onClick={() => {
                    if (!isRazorpayDisabled) {
                      setPaymentMethod('Razorpay');
                    }
                  }}
                  className={`rounded-2xl p-5 border text-left relative cursor-pointer transition-all duration-300 ${paymentMethod === 'Razorpay'
                      ? 'bg-[#eef1fb] border-brand-accent'
                      : 'bg-white border-brand-line hover:border-brand-navy/30'
                    } ${isRazorpayDisabled ? 'cursor-not-allowed opacity-60 hover:border-brand-line' : ''}`}
                >
                  <div className={`absolute top-4 right-4 flex h-4 w-4 items-center justify-center rounded-full border ${paymentMethod === 'Razorpay' ? 'bg-brand-accent border-brand-accent text-white' : 'border-brand-line'
                    }`}>
                    {paymentMethod === 'Razorpay' && <span className="text-[8px]">✓</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💳</span>
                    <h4 className="text-sm font-bold text-brand-navy uppercase">Razorpay</h4>
                  </div>
                  <p className="text-[10px] text-brand-muted leading-relaxed">Pay securely via UPI, Net Banking, Credit / Debit Card, or Wallet.</p>
                  {razorpayConfig.loading && (
                    <p className="text-[9px] text-brand-accent mt-1 animate-pulse">Checking payment gateway configuration...</p>
                  )}
                  {!razorpayConfig.loading && !razorpayConfig.available && (
                    <p className="text-[9px] text-rose-500 mt-1 leading-relaxed">{razorpayConfig.message}</p>
                  )}
                  {razorpayConfig.available && !razorpayScriptLoaded && (
                    <p className="text-[9px] text-brand-accent mt-1 animate-pulse">Loading payment gateway…</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ── Right Column: Summary Box ── */}
          <div className="space-y-6">
            {/* Bag overview & promo codes */}
            <section className="rounded-3xl bg-white p-6 shadow-luxe border border-brand-line flex flex-col">
              <h3 className="font-display text-lg font-bold text-brand-navy border-b border-brand-line pb-3 mb-4">
                Order Summary
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-72 overflow-y-auto mb-6 pr-1 scrollbar-thin">
                {cart.items.map((item) => (
                  <div key={item.product._id || item.product.id} className="flex gap-3">
                    <img
                      src={item.product.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=100'}
                      alt={item.product.title}
                      className="h-14 w-12 rounded-lg object-cover bg-brand-soft border border-brand-line/60 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-xs font-semibold text-brand-navy">{item.product.title}</h4>
                      <p className="text-[10px] text-brand-muted mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-brand-navy">₹{item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo input field */}
              <form onSubmit={handleApplyCoupon} className="border-t border-brand-line/60 pt-4 mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Apply Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. LUXE10, WELCOME500"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 rounded-full border border-brand-line px-4 py-2 text-xs outline-none focus:border-brand-accent uppercase placeholder:text-brand-muted/65"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon}
                    className="rounded-full bg-brand-navy hover:bg-brand-accent text-white px-5 py-2 text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] font-medium text-rose-500 mt-1.5 pl-2">{couponError}</p>}
                {couponSuccess && <p className="text-[10px] font-bold text-emerald-600 mt-1.5 pl-2">✓ {couponSuccess}</p>}
              </form>

              {/* Breakdown metrics */}
              <div className="border-t border-brand-line/60 pt-4 space-y-2.5 text-xs text-brand-muted mb-6">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-brand-navy">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Delivery</span>
                  <span>
                    {finalShippingPrice === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase tracking-wider text-[9px]">Free</span>
                    ) : (
                      <span className="font-semibold text-brand-navy">₹{finalShippingPrice.toFixed(2)}</span>
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-medium">Promotional Discount ({appliedCoupon})</span>
                    <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-brand-line/60 pt-3 flex justify-between text-sm font-bold text-brand-navy">
                  <span>Grand Total</span>
                  <span className="text-base text-brand-accent font-display">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Secure Checkout Action */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || addresses.length === 0 || !selectedAddress}
                className="w-full rounded-full bg-brand-navy hover:bg-brand-accent py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 shadow-luxe disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
              >
                {isPlacingOrder ? 'Submitting Order...' : 'Confirm and Place Order'}
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CheckoutPage;
