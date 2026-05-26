import { useEffect, useState } from 'react';
import { fetchMyOrders, cancelOrder } from '../services/orderService.js';
import Footer from '../components/layout/Footer.jsx';
import HomeHeader from '../components/layout/HomeHeader.jsx';
import Icon from '../components/common/Icon.jsx';

function OrdersPage({ authSession, navigate, onLogout }) {
  const token = authSession?.accessToken ?? null;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Guard: if not authenticated, redirect to login
  useEffect(() => {
    if (!authSession) {
      navigate('/login');
    }
  }, [authSession, navigate]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchMyOrders(token)
        .then((data) => {
          setOrders(data);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch your orders');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token]);

  const toggleExpandOrder = (id) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const handleCancelOrder = async (orderId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setError(null);
    setCancellingOrderId(orderId);

    try {
      const res = await cancelOrder(orderId, token);
      // Sync list
      setOrders(prev => prev.map(order => order._id === orderId ? res.order : order));
      alert('Order has been successfully cancelled.');
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusColors = (status) => {
    const maps = {
      Processing: { text: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', dot: 'bg-indigo-600' },
      Packed: { text: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-600' },
      Shipped: { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-700' },
      'Out for Delivery': { text: 'text-pink-600', bg: 'bg-pink-50 border-pink-100', dot: 'bg-pink-600' },
      Delivered: { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-700' },
      Cancelled: { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', dot: 'bg-rose-600' }
    };
    return maps[status] || { text: 'text-brand-muted', bg: 'bg-brand-soft border-brand-line', dot: 'bg-brand-muted' };
  };

  const getFulfillmentMilestones = (status) => {
    if (status === 'Cancelled') {
      return ['Processing', 'Cancelled'];
    }
    return ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  };

  const getMilestoneIndex = (status, milestones) => {
    return milestones.indexOf(status);
  };

  return (
    <>
      <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />

      <main className="min-h-screen bg-brand-soft pb-20">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-brand-navy">Order Logs</h1>
              <p className="text-xs text-brand-muted mt-1.5 uppercase tracking-[0.14em] font-semibold">Your luxury wardrobe journal</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="rounded-full border border-brand-line bg-white hover:bg-brand-soft text-brand-navy px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition flex items-center gap-1.5"
              >
                <Icon name="person" className="h-3.5 w-3.5" />
                Profile Settings
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full bg-brand-navy hover:bg-brand-accent text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition"
              >
                ➔ Return to Catalog
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm font-medium text-rose-600 mb-6">
              ⚠ {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-[2rem] bg-white border border-brand-line animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-[2.5rem] bg-white p-12 text-center shadow-luxe border border-brand-line">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand-muted mb-4">
                <Icon name="bag" className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-brand-navy mb-2">No orders placed yet</h3>
              <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed mb-6">
                Your luxury journal is currently empty. Explore our bespoke catalogs and create your signature collection.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-full bg-brand-navy hover:bg-brand-accent text-white px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] transition shadow-luxe"
              >
                Shop Luxury Collections
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order._id;
                const colors = getStatusColors(order.orderStatus);
                const milestones = getFulfillmentMilestones(order.orderStatus);
                const currentIdx = getMilestoneIndex(order.orderStatus, milestones);

                return (
                  <article
                    key={order._id}
                    onClick={() => toggleExpandOrder(order._id)}
                    className={`rounded-[2rem] bg-white border shadow-luxe overflow-hidden transition-all duration-300 cursor-pointer ${
                      isExpanded ? 'border-brand-accent/50 shadow-md ring-4 ring-brand-accent/5' : 'border-brand-line hover:border-brand-navy/20'
                    }`}
                  >
                    {/* Collapsed Headers */}
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Order reference</p>
                          <p className="text-sm font-bold text-brand-navy mt-0.5">#{order._id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Date placed</p>
                          <p className="text-xs font-semibold text-brand-navy mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Grand total</p>
                          <p className="text-xs font-bold text-brand-accent mt-0.5">₹{order.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <span className={`rounded-full border px-3.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${colors.text} ${colors.bg}`}>
                          {order.orderStatus}
                        </span>
                        {order.orderStatus === 'Processing' && (
                          <button
                            type="button"
                            disabled={cancellingOrderId === order._id}
                            onClick={(e) => handleCancelOrder(order._id, e)}
                            className="rounded-full border border-rose-200 bg-rose-50/50 hover:bg-rose-500 hover:text-white text-rose-600 px-3.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] transition"
                          >
                            {cancellingOrderId === order._id ? '...' : 'Cancel'}
                          </button>
                        )}
                        <span className="text-brand-muted">
                          <svg className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Timeline Progression Line Track */}
                    <div className="px-6 sm:px-8 pb-6 border-b border-brand-line/50">
                      <div className="relative flex justify-between items-center max-w-3xl mx-auto mt-4">
                        {/* Gray line behind */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-line/60 z-0" />
                        
                        {/* Colored progress line */}
                        {order.orderStatus !== 'Cancelled' && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-accent transition-all duration-500 z-0"
                            style={{ width: `${(currentIdx / (milestones.length - 1)) * 100}%` }}
                          />
                        )}

                        {milestones.map((milestone, idx) => {
                          const isDone = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={milestone} className="relative z-10 flex flex-col items-center">
                              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                order.orderStatus === 'Cancelled'
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : isDone
                                  ? 'bg-brand-accent border-brand-accent text-white'
                                  : 'bg-white border-brand-line text-brand-muted'
                              }`}>
                                {isDone ? (
                                  <span className="text-[9px]">✓</span>
                                ) : (
                                  <div className="h-1.5 w-1.5 rounded-full bg-brand-line" />
                                )}
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-wider mt-1.5 ${
                                isCurrent ? 'text-brand-navy' : isDone ? 'text-brand-accent' : 'text-brand-muted'
                              }`}>
                                {milestone}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expanded Items Drawer */}
                    {isExpanded && (
                      <div className="bg-brand-soft/40 p-6 sm:p-8 space-y-6 animate-fadeIn">
                        {/* Products list */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy border-b border-brand-line/60 pb-2 mb-1.5">
                            Purchased Articles
                          </h4>
                          {order.items.map((item) => (
                            <div key={item.product} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-brand-line/60">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=100'}
                                alt={item.title}
                                className="h-14 w-12 rounded-xl object-cover bg-brand-soft border border-brand-line/40 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="truncate text-xs font-bold text-brand-navy">{item.title}</h5>
                                <p className="text-[10px] text-brand-muted mt-0.5">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-brand-navy">₹{(item.price * item.quantity).toFixed(2)}</span>
                                <p className="text-[9px] text-brand-muted">₹{item.price.toFixed(2)} each</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Flat coordinates & payment specifications */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="bg-white p-5 rounded-2xl border border-brand-line/60">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy border-b border-brand-line/60 pb-2 mb-3">
                              Shipping Destination
                            </h5>
                            <p className="text-xs font-bold text-brand-navy mb-1">{order.shippingAddress.fullName}</p>
                            <p className="text-[10px] font-medium text-brand-muted mb-2">📞 {order.shippingAddress.mobile}</p>
                            <p className="text-xs text-brand-muted leading-relaxed">
                              {order.shippingAddress.addressLine1}
                              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                              {order.shippingAddress.landmark && ` (Near ${order.shippingAddress.landmark})`}
                              <br />
                              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                              <br />
                              {order.shippingAddress.country}
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-brand-line/60 flex flex-col">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy border-b border-brand-line/60 pb-2 mb-3">
                              Payment Summary
                            </h5>
                            <div className="space-y-2 text-xs text-brand-muted flex-1">
                              <div className="flex justify-between">
                                <span>Items Subtotal</span>
                                <span className="font-semibold text-brand-navy">₹{order.itemsPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shipping Delivery</span>
                                <span className="font-semibold text-brand-navy">₹{order.shippingPrice.toFixed(2)}</span>
                              </div>
                              {order.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-medium">
                                  <span>Coupon Discount ({order.couponCode})</span>
                                  <span>-₹{order.discountAmount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="border-t border-brand-line/60 pt-2 flex justify-between text-xs font-bold text-brand-navy">
                                <span>Method / status</span>
                                <span className="uppercase">{order.paymentMethod} / {order.paymentStatus}</span>
                              </div>
                              <div className="border-t border-brand-line/60 pt-2 flex justify-between text-sm font-bold text-brand-accent">
                                <span>Total Price Paid</span>
                                <span>₹{order.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default OrdersPage;
