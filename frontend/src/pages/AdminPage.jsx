import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteUser,
  fetchAllUsers,
  fetchDashboardStats,
  fetchUserById,
  toggleBlockUser,
} from '../services/adminService.js';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService.js';
import {
  fetchBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../services/brandService.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService.js';
import {
  fetchAllOrders,
  updateOrderStatus,
} from '../services/orderService.js';


/* ─── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function StatCard({ label, value, accent }) {
  const accents = {
    navy: 'bg-brand-navy text-white',
    blue: 'bg-brand-accent text-white',
    green: 'bg-emerald-500 text-white',
    red: 'bg-rose-500 text-white',
    slate: 'bg-brand-card text-brand-navy',
  };
  return (
    <div className={`rounded-2xl p-6 ${accents[accent] ?? accents.navy}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold tracking-tight">
        {value ?? '—'}
      </p>
    </div>
  );
}

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="rounded-full bg-brand-navy px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
      Admin
    </span>
  ) : (
    <span className="rounded-full bg-brand-card px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
      User
    </span>
  );
}

function StatusBadge({ isBlocked }) {
  return isBlocked ? (
    <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-600">
      Blocked
    </span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
      Active
    </span>
  );
}

function UserAvatar({ user, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base' };
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} flex flex-shrink-0 items-center justify-center rounded-full bg-brand-accent font-bold text-white`}>
      {getInitials(user.name)}
    </div>
  );
}

function UserDetailModal({ user, onClose, onToggleBlock, onDelete, isActionLoading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-luxe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h3 className="font-display text-2xl font-bold text-brand-navy">{user.name}</h3>
              <p className="text-sm text-brand-muted">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-2 text-brand-muted transition hover:bg-brand-card hover:text-brand-navy"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 rounded-2xl bg-brand-soft p-5">
          {[
            { label: 'User ID', value: user._id },
            { label: 'Phone', value: user.phone || 'Not provided' },
            { label: 'Role', value: <RoleBadge role={user.role} /> },
            { label: 'Status', value: <StatusBadge isBlocked={user.isBlocked} /> },
            { label: 'Verified', value: user.isVerified ? 'Yes' : 'No' },
            { label: 'Joined', value: formatDate(user.createdAt) },
            { label: 'Last Updated', value: formatDate(user.updatedAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</span>
              <span className="text-sm font-medium text-brand-navy break-all text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions — only for non-admins */}
        {user.role !== 'admin' && (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => onToggleBlock(user._id)}
              className={`flex-1 rounded-full py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition disabled:opacity-60 ${user.isBlocked
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
            >
              {user.isBlocked ? 'Unblock User' : 'Block User'}
            </button>
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => onDelete(user._id)}
              className="flex-1 rounded-full bg-rose-500 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              Delete User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminProfileModal({ user, onClose, onLogout }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-luxe transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h3 className="font-display text-2xl font-bold text-brand-navy">{user.name}</h3>
              <p className="text-sm text-brand-muted">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-2 text-brand-muted transition hover:bg-brand-card hover:text-brand-navy"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 rounded-2xl bg-brand-soft p-5">
          {[
            { label: 'Role', value: 'Administrator' },
            { label: 'Email Address', value: user.email },
            { label: 'Status', value: 'Active Session' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{label}</span>
              <span className="text-sm font-medium text-brand-navy break-all text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-brand-line py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-navy transition hover:bg-brand-card"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex-1 rounded-full bg-rose-500 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-rose-600 shadow-luxe"
          >
            Logout Session
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdateStatus, isActionLoading }) {
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);

  const handleSave = () => {
    onUpdateStatus(order._id, { orderStatus, paymentStatus });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-luxe overflow-y-auto max-h-[90vh] scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-brand-line pb-4 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">
              Fulfillment Management
            </span>
            <h3 className="font-display text-xl font-bold text-brand-navy mt-1">
              Order #{order._id.substring(order._id.length - 8).toUpperCase()}
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-muted hover:bg-brand-card hover:text-brand-navy transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content columns */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer & Shipping */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-line bg-brand-soft/30 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b border-brand-line/60 pb-1.5">
                Customer Details
              </h4>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-brand-navy">{order.user?.name || 'Customer'}</p>
                <p className="text-xs text-brand-muted">{order.user?.email || 'N/A'}</p>
                <p className="text-xs text-brand-muted">Payment Method: <span className="font-bold text-brand-navy">{order.paymentMethod}</span></p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-line bg-brand-soft/30 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b border-brand-line/60 pb-1.5">
                Shipping Address
              </h4>
              <div className="space-y-1 text-xs text-brand-navy leading-relaxed">
                <p className="font-semibold text-sm">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p>Phone: {order.shippingAddress.mobile}</p>
              </div>
            </div>
          </div>

          {/* Status Controls */}
          <div className="rounded-2xl border border-brand-line bg-brand-soft/30 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b border-brand-line/60 pb-1.5">
                Update Order Milestones
              </h4>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                  Fulfillment Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-xs text-brand-navy outline-none cursor-pointer focus:border-brand-accent transition"
                >
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full rounded-xl border border-brand-line bg-white px-4 py-2.5 text-xs text-brand-navy outline-none cursor-pointer focus:border-brand-accent transition"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={isActionLoading || (orderStatus === order.orderStatus && paymentStatus === order.paymentStatus)}
              onClick={handleSave}
              className="mt-6 w-full rounded-full bg-brand-navy hover:bg-brand-accent py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-luxe transition-all disabled:opacity-50"
            >
              {isActionLoading ? 'Saving...' : 'Update Fulfillment'}
            </button>
          </div>
        </div>

        {/* Ordered items list */}
        <div className="mt-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy border-b border-brand-line pb-1.5 mb-4">
            Ordered Boutique Items ({order.items.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-xl border border-brand-line/60 bg-white">
                <div className="h-12 w-12 rounded-lg border border-brand-line overflow-hidden bg-brand-soft shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-[9px] font-extrabold opacity-30">LUXE</div>
                  )}
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-brand-navy">{item.title}</p>
                    <p className="text-[10px] text-brand-muted mt-0.5">₹{item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-brand-navy">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing breakdown summary */}
        <div className="mt-6 border-t border-brand-line pt-4 flex flex-col items-end">
          <div className="w-full max-w-xs space-y-1.5 text-xs text-brand-muted">
            <div className="flex justify-between">
              <span>Items Total</span>
              <span className="font-semibold text-brand-navy">₹{order.itemsPrice.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-brand-accent">
                <span>Discount Code ({order.couponCode || 'PROMO'})</span>
                <span className="font-bold">-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Express Shipping</span>
              <span>{order.shippingPrice === 0 ? <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">Free</span> : `₹${order.shippingPrice.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-brand-line/60 pt-1.5 flex justify-between text-sm font-bold text-brand-navy">
              <span>Grand Total</span>
              <span className="text-base text-brand-accent font-display">₹{order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryBrandModal({
  type, // 'category' or 'brand'
  item, // null for create, object for edit
  onClose,
  onSubmit,
  isSaving,
}) {
  const [name, setName] = useState(item?.name || '');
  const [slug, setSlug] = useState(item?.slug || '');
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured || false);
  const [imagePreview, setImagePreview] = useState(item?.image || item?.logo || '');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a JPG or PNG image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB.');
      return;
    }

    // Display local preview instantly
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    setImageFile(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    if (!/^[a-zA-Z0-9\s&-]+$/.test(name.trim())) {
      setError('Name can only contain letters, numbers, spaces, ampersands (&), and hyphens (-)');
      return;
    }
    if (slug.trim() && !/^[a-z0-9-]+$/.test(slug.trim())) {
      setError('Custom Slug can only contain lowercase letters, numbers, and hyphens (e.g. brand-name)');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      let imageUrl = imagePreview;

      // Upload new image to Cloudinary if selected
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        isFeatured,
      };

      if (type === 'category') {
        payload.image = imageUrl || null;
      } else {
        payload.logo = imageUrl || null;
      }

      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-luxe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-brand-navy">
            {item ? `Edit ${type === 'category' ? 'Category' : 'Brand'}` : `Add New ${type === 'category' ? 'Category' : 'Brand'}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-muted transition hover:bg-brand-card hover:text-brand-navy"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-600">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image/Logo upload */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">
              {type === 'category' ? 'Category Cover Banner' : 'Brand Logo'}
            </label>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.2rem] border border-brand-line bg-[#dfe4fb] text-brand-muted">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex w-fit items-center justify-center bg-brand-navy px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-brand-accent"
                >
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-[9px] uppercase tracking-[0.12em] text-brand-muted">
                  Max size 2MB, JPG or PNG
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="modal_name" className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">
              Name
            </label>
            <input
              id="modal_name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'category' ? 'e.g. Luxury Dresses' : 'e.g. Chanel'}
              className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
            />
          </div>

          <div>
            <label htmlFor="modal_slug" className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">
              Custom Slug (Optional)
            </label>
            <input
              id="modal_slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. luxury-dresses (auto-generated if empty)"
              className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="modal_featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-5 w-5 rounded-none border-brand-line text-brand-navy focus:ring-brand-navy/15"
            />
            <label htmlFor="modal_featured" className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-navy">
              Mark as Featured
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-brand-line py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-navy transition hover:bg-brand-card"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 rounded-full bg-brand-navy py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-luxe transition hover:bg-brand-accent disabled:opacity-60"
            >
              {isUploading ? 'Uploading Image...' : isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductModal({
  item, // null for create, object for edit
  categories,
  brands,
  onClose,
  onSubmit,
  isSaving,
}) {
  const [title, setTitle] = useState(item?.title || '');
  const [sku, setSku] = useState(item?.sku || '');
  const [slug, setSlug] = useState(item?.slug || '');
  const [description, setDescription] = useState(item?.description || '');
  const [shortDescription, setShortDescription] = useState(item?.shortDescription || '');
  const [price, setPrice] = useState(item?.price !== undefined ? item.price : '');
  const [discountPrice, setDiscountPrice] = useState(item?.discountPrice !== undefined && item.discountPrice !== null ? item.discountPrice : '');
  const [stock, setStock] = useState(item?.stock !== undefined ? item.stock : 0);
  const [category, setCategory] = useState(item?.category?._id || item?.category || '');
  const [brand, setBrand] = useState(item?.brand?._id || item?.brand || '');
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured || false);
  const [isActive, setIsActive] = useState(item?.isActive !== undefined ? item.isActive : true);

  const [images, setImages] = useState(item?.images || []);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    const newUploadingFiles = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      status: 'uploading',
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    await Promise.all(
      newUploadingFiles.map(async (uploadItem) => {
        try {
          const url = await uploadToCloudinary(uploadItem.file);

          setImages((prevImages) => {
            const hasPrimary = prevImages.some((img) => img.isPrimary);
            return [
              ...prevImages,
              {
                url,
                alt: uploadItem.name.split('.')[0] || '',
                isPrimary: !hasPrimary && prevImages.length === 0,
              },
            ];
          });

          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadItem.id ? { ...f, status: 'success' } : f))
          );
        } catch (err) {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadItem.id ? { ...f, status: 'error', error: err.message } : f))
          );
        }
      })
    );

    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.status !== 'success'));
    }, 2000);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (prev[index]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const handleSetPrimary = (index) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    );
  };

  const handleAltChange = (index, value) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, alt: value } : img))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Title validation
    if (!title.trim()) return setError('Product title is required');
    if (title.trim().length < 3) return setError('Product title must be at least 3 characters long');

    // SKU validation
    if (sku.trim() && sku.trim().length < 3) return setError('SKU Code must be at least 3 characters long');
    if (sku.trim() && !/^[a-zA-Z0-9_-]+$/.test(sku.trim())) return setError('SKU Code can only contain letters, numbers, hyphens, and underscores');

    // Custom Slug validation
    if (slug.trim() && !/^[a-z0-9-]+$/.test(slug.trim())) return setError('Custom Slug can only contain lowercase letters, numbers, and hyphens (e.g. product-slug)');

    // Category selection
    if (!category) return setError('Please select a category');

    // Price validation
    if (price === '' || isNaN(price) || Number(price) <= 0) {
      return setError('Please enter a valid regular price greater than 0');
    }

    // Discount Price validation
    if (discountPrice !== '') {
      if (isNaN(discountPrice) || Number(discountPrice) <= 0) {
        return setError('Please enter a valid discount price greater than 0');
      }
      if (Number(discountPrice) >= Number(price)) {
        return setError('Discount price must be less than the regular price');
      }
    }

    // Stock validation
    if (stock === '' || isNaN(stock) || Number(stock) < 0) {
      return setError('Please enter a valid stock level');
    }
    if (Number(stock) % 1 !== 0) {
      return setError('Stock level must be a whole number');
    }

    // Short Description validation
    if (!shortDescription.trim()) return setError('Short description is required');
    if (shortDescription.trim().length < 10) return setError('Short description must be at least 10 characters long');

    // Detailed Description validation
    if (!description.trim()) return setError('Product description is required');
    if (description.trim().length < 20) return setError('Product description must be at least 20 characters long');

    // Image gallery validation
    if (images.length === 0) {
      return setError('Please upload at least one product photo to showcase your item');
    }

    if (images.length > 0) {
      const hasPrimary = images.some((img) => img.isPrimary);
      if (!hasPrimary) {
        images[0].isPrimary = true;
      }
    }

    try {
      const payload = {
        title: title.trim(),
        sku: sku.trim() || undefined,
        slug: slug.trim() || undefined,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        price: Number(price),
        discountPrice: discountPrice !== '' ? Number(discountPrice) : null,
        stock: Number(stock),
        category,
        brand: brand || null,
        isFeatured,
        isActive,
        images,
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Failed to save product');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-8 shadow-luxe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 border-b border-brand-line pb-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-brand-navy">
              {item ? 'Edit Premium Product' : 'Add Luxury Product'}
            </h3>
            <p className="text-xs text-brand-muted mt-1 uppercase tracking-wider">
              {item ? `Updating SKU: ${item.sku || 'N/A'}` : 'Introduce a new catalog listing'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-muted transition hover:bg-brand-card hover:text-brand-navy"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-600">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-navy border-b border-brand-line pb-2">
                General details
              </h4>

              <div>
                <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Classic Silk Scarf"
                  className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. CLS-SLK-01"
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Custom Slug (Optional)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. classic-silk-scarf"
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Category</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  >
                    <option value="">No Brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1200"
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="e.g. 999"
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="15"
                    className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Short Description</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Handcrafted from 100% fine Italian silk twill"
                  className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">Detailed Description</label>
                <textarea
                  rows="4"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide rich marketing details..."
                  className="mt-2 w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10 resize-none"
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <input
                    id="p_featured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-5 w-5 border-brand-line text-brand-navy focus:ring-brand-navy/15"
                  />
                  <label htmlFor="p_featured" className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-navy">
                    Featured Item
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="p_active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 border-brand-line text-brand-navy focus:ring-brand-navy/15"
                  />
                  <label htmlFor="p_active" className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-navy">
                    Active Catalog
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-navy border-b border-brand-line pb-2">
                Product Gallery & Photos
              </h4>

              <div className="rounded-2xl border-2 border-dashed border-brand-line bg-brand-soft/30 p-6 text-center hover:bg-brand-soft/50 transition">
                <svg className="mx-auto h-10 w-10 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18-10.125a1.8 1.8 0 00-1.8 1.8v10.125a1.8 1.8 0 001.8 1.8h16.2a1.8 1.8 0 001.8-1.8V5.175a1.8 1.8 0 00-1.8-1.8H3.75z" />
                </svg>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center bg-brand-navy px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-brand-accent rounded-full font-display"
                  >
                    Select Photos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                  <p className="mt-2 text-[10px] text-brand-muted uppercase tracking-wider">
                    Select multiple photos (JPG, PNG)
                  </p>
                </div>
              </div>

              {uploadingFiles.length > 0 && (
                <div className="space-y-2 bg-brand-soft rounded-2xl p-4 border border-brand-line">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                    Uploading status
                  </p>
                  {uploadingFiles.map((uf) => (
                    <div key={uf.id} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[70%] font-medium text-brand-navy">{uf.name}</span>
                      <span className={`font-semibold uppercase tracking-wider text-[9px] ${uf.status === 'success' ? 'text-emerald-600' : uf.status === 'error' ? 'text-rose-500' : 'text-brand-accent animate-pulse'
                        }`}>
                        {uf.status === 'success' ? '✔ Done' : uf.status === 'error' ? '✖ Failed' : 'Uploading...'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
                  Current Gallery Images ({images.length})
                </p>

                {images.length === 0 ? (
                  <div className="rounded-2xl border border-brand-line p-8 text-center text-xs text-brand-muted uppercase tracking-wider">
                    No images uploaded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-4 p-3 rounded-2xl border transition ${img.isPrimary ? 'border-brand-accent bg-brand-soft/20 shadow-sm' : 'border-brand-line bg-white'
                          }`}
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-brand-line">
                          <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={img.alt}
                              onChange={(e) => handleAltChange(idx, e.target.value)}
                              placeholder="Alt description"
                              className="w-full rounded-lg border border-brand-line bg-white px-2 py-1 text-xs text-brand-ink outline-none transition focus:border-brand-accent"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className={`text-[9px] font-bold uppercase tracking-wider transition ${img.isPrimary ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-navy'
                                }`}
                            >
                              {img.isPrimary ? '★ Primary Image' : '☆ Make Primary'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-line flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-brand-line py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-navy transition hover:bg-brand-card"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || uploadingFiles.some((f) => f.status === 'uploading')}
              className="flex-1 rounded-full bg-brand-navy py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-luxe transition hover:bg-brand-accent disabled:opacity-60"
            >
              {isSaving ? 'Saving Product...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main AdminPage ────────────────────────────────────────────────────── */

function AdminPage({ authSession, navigate, onLogout }) {
  const { accessToken, user: adminUser } = authSession;

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('category'); // 'category' or 'brand'
  const [editingItem, setEditingItem] = useState(null); // item to edit, null for create

  // Products State
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const productDebounceRef = useRef(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const orderDebounceRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoadingRecentUsers, setIsLoadingRecentUsers] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showAdminProfile, setShowAdminProfile] = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const debounceRef = useRef(null);

  const showNotification = (message, tone = 'success') => {
    setNotification({ message, tone });
    window.setTimeout(() => setNotification(null), 3500);
  };

  // Load stats once
  useEffect(() => {
    fetchDashboardStats(accessToken)
      .then(setStats)
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setIsLoadingStats(false));
  }, [accessToken]);

  // Load users on filter / page change
  const loadUsers = useCallback(() => {
    setIsLoadingUsers(true);
    fetchAllUsers(accessToken, { page, search, role: roleFilter, status: statusFilter })
      .then(({ users: list, pagination: pg }) => {
        setUsers(list);
        setPagination(pg);
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setIsLoadingUsers(false));
  }, [accessToken, page, search, roleFilter, statusFilter]);

  const loadRecentUsers = useCallback(() => {
    setIsLoadingRecentUsers(true);
    fetchAllUsers(accessToken, { page: 1, limit: 5 })
      .then(({ users: list }) => {
        setRecentUsers(list);
      })
      .catch(() => setError('Failed to load recent users.'))
      .finally(() => setIsLoadingRecentUsers(false));
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === 'Users') {
      loadUsers();
    }
  }, [loadUsers, activeTab]);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const loadBrands = useCallback(async () => {
    setIsLoadingBrands(true);
    try {
      const data = await fetchBrands();
      setBrands(data);
    } catch {
      setError('Failed to load brands.');
    } finally {
      setIsLoadingBrands(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await fetchProducts({
        page: productPage,
        search: productSearch,
        category: productCategoryFilter,
        brand: productBrandFilter,
        adminMode: true,
        limit: 10,
      });
      setProducts(data.products || []);
      setProductPagination({
        currentPage: data.page,
        totalPages: data.pages,
        totalCount: data.totalProducts,
        hasPrevPage: data.page > 1,
        hasNextPage: data.page < data.pages,
      });
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productPage, productSearch, productCategoryFilter, productBrandFilter]);

  const handleToggleProductField = async (productId, field, currentValue) => {
    setIsActionLoading(true);
    try {
      await updateProduct(accessToken, productId, { [field]: !currentValue });
      showNotification(`Product ${field === 'isActive' ? 'status' : 'featured flag'} updated successfully`);
      loadProducts();
    } catch (err) {
      showNotification(err.message || 'Operation failed', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleProductSearchInput = (e) => {
    const value = e.target.value;
    setProductSearchInput(value);
    clearTimeout(productDebounceRef.current);
    productDebounceRef.current = window.setTimeout(() => {
      setProductSearch(value.trim());
      setProductPage(1);
    }, 400);
  };

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await fetchAllOrders(accessToken, {
        page: orderPage,
        search: orderSearch,
        status: orderStatusFilter,
        limit: 10,
      });
      setOrders(data.orders || []);
      setOrderPagination({
        currentPage: data.page,
        totalPages: data.pages,
        totalCount: data.totalOrders,
        hasPrevPage: data.page > 1,
        hasNextPage: data.page < data.pages,
      });
    } catch {
      setError('Failed to load orders.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, [accessToken, orderPage, orderSearch, orderStatusFilter]);

  const handleOrderSearchInput = (e) => {
    const value = e.target.value;
    setOrderSearchInput(value);
    clearTimeout(orderDebounceRef.current);
    orderDebounceRef.current = window.setTimeout(() => {
      setOrderSearch(value.trim());
      setOrderPage(1);
    }, 400);
  };

  const handleUpdateOrderStatus = async (orderId, statusData) => {
    setIsActionLoading(true);
    try {
      const result = await updateOrderStatus(orderId, statusData, accessToken);
      showNotification(result.message || 'Order updated successfully');
      loadOrders();
      // Update selected order in modal if open
      setSelectedOrder((prev) => prev && prev._id === orderId ? { ...prev, ...result.order } : prev);
      // Reload stats too to update counts
      fetchDashboardStats(accessToken).then(setStats).catch(() => { });
    } catch (err) {
      showNotification(err.message || 'Failed to update status', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Load when active tab changes
  useEffect(() => {
    if (activeTab === 'Categories') {
      loadCategories();
    } else if (activeTab === 'Brands') {
      loadBrands();
    } else if (activeTab === 'Products') {
      loadCategories();
      loadBrands();
      loadProducts();
    } else if (activeTab === 'Orders') {
      loadOrders();
    } else if (activeTab === 'Users') {
      loadUsers();
    } else if (activeTab === 'Dashboard') {
      setIsLoadingStats(true);
      fetchDashboardStats(accessToken)
        .then(setStats)
        .catch(() => setError('Failed to load stats.'))
        .finally(() => setIsLoadingStats(false));
      loadOrders();
      loadRecentUsers();
    }
  }, [activeTab, loadCategories, loadBrands, loadProducts, loadOrders, loadUsers, loadRecentUsers, accessToken]);

  const handleModalSubmit = async (payload) => {
    setIsActionLoading(true);
    try {
      if (modalType === 'category') {
        if (editingItem) {
          await updateCategory(accessToken, editingItem._id, payload);
          showNotification('Category updated successfully');
        } else {
          await createCategory(accessToken, payload);
          showNotification('Category created successfully');
        }
        loadCategories();
      } else if (modalType === 'brand') {
        if (editingItem) {
          await updateBrand(accessToken, editingItem._id, payload);
          showNotification('Brand updated successfully');
        } else {
          await createBrand(accessToken, payload);
          showNotification('Brand created successfully');
        }
        loadBrands();
      } else if (modalType === 'product') {
        if (editingItem) {
          await updateProduct(accessToken, editingItem._id, payload);
          showNotification('Product updated successfully');
        } else {
          await createProduct(accessToken, payload);
          showNotification('Product created successfully');
        }
        loadProducts();
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      showNotification(err.message || 'Operation failed', 'error');
      throw err; // rethrow to let modal show the error
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(`Permanently delete this ${type}?`)) return;
    setIsActionLoading(true);
    try {
      if (type === 'category') {
        await deleteCategory(accessToken, id);
        showNotification('Category deleted successfully');
        loadCategories();
      } else if (type === 'brand') {
        await deleteBrand(accessToken, id);
        showNotification('Brand deleted successfully');
        loadBrands();
      } else if (type === 'product') {
        await deleteProduct(accessToken, id);
        showNotification('Product deleted successfully');
        loadProducts();
      }
    } catch (err) {
      showNotification(err.message || 'Delete failed', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };


  // Debounced search
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, 400);
  };

  const handleViewUser = async (userId) => {
    try {
      const user = await fetchUserById(accessToken, userId);
      setSelectedUser(user);
    } catch {
      showNotification('Could not load user details.', 'error');
    }
  };

  const handleToggleBlock = async (userId) => {
    setIsActionLoading(true);
    try {
      const result = await toggleBlockUser(accessToken, userId);
      showNotification(result.message);
      loadUsers();
      // Update the modal if open
      setSelectedUser((prev) => prev && prev._id === userId
        ? { ...prev, isBlocked: result.isBlocked }
        : prev
      );
    } catch (err) {
      showNotification(err.message || 'Action failed.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    setIsActionLoading(true);
    try {
      const result = await deleteUser(accessToken, userId);
      showNotification(result.message);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      showNotification(err.message || 'Delete failed.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-soft">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col bg-brand-navy text-white">
        {/* Logo */}
        <div className="border-b border-white/10 px-6 py-6">
          <button
            type="button"
            onClick={() => setActiveTab('Dashboard')}
            className="font-display text-2xl font-bold tracking-[-0.08em] text-white transition hover:opacity-75"
          >
            LUXE
          </button>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Admin Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {[
            { label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', disabled: false },
            { label: 'Categories', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            { label: 'Brands', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z' },
            { label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', disabled: false },
            { label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', disabled: false },
          ].map(({ label, icon, disabled }) => {
            const isActive = activeTab === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (!disabled) {
                    setActiveTab(label);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition ${isActive
                  ? 'bg-white/10 text-white'
                  : disabled
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
                {disabled && (
                  <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white/40">
                    SOON
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin profile */}
        <div className="border-t border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={() => setShowAdminProfile(true)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-[11px] font-bold text-white">
              {getInitials(adminUser.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{adminUser.name}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Administrator</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 border-b border-brand-line bg-white/90 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-[-0.05em] text-brand-navy">
                {activeTab}
              </h1>
              <p className="text-sm text-brand-muted">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {notification && (
              <div className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-luxe transition-all ${notification.tone === 'error'
                ? 'bg-rose-500 text-white'
                : 'bg-emerald-500 text-white'
                }`}>
                {notification.message}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Error banner */}
          {error && (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-600">
              ⚠ {error}
            </div>
          )}

          {activeTab === 'Dashboard' && (
            <>
              {/* ── Stats Cards ── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                    Boutique Performance Overview
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                      Live Store Stats
                    </span>
                  </div>
                </div>
                {isLoadingStats ? (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-card" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Total Sales" value={`₹${(stats?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} accent="navy" />
                    <StatCard label="Total Orders" value={stats?.totalOrders || 0} accent="blue" />
                    <StatCard label="Fulfillments Pending" value={stats?.pendingOrders || 0} accent="red" />
                    <StatCard label="Completed Shipments" value={stats?.deliveredOrders || 0} accent="green" />
                  </div>
                )}
              </section>

              {/* ── Two Column Insights Layout ── */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left Column: Recent Orders Queue */}
                <section className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-brand-navy">
                        Recent Orders Queue
                      </h3>
                      <p className="text-xs text-brand-muted mt-1 uppercase tracking-wider">
                        Live queue of incoming boutique purchases
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Orders')}
                      className="rounded-full bg-brand-navy px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-accent transition duration-200"
                    >
                      Manage All Orders
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
                    {isLoadingOrders ? (
                      <div className="space-y-0 divide-y divide-brand-line bg-white">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-1/3 bg-brand-card rounded" />
                              <div className="h-3 w-1/4 bg-brand-card rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="py-16 text-center text-sm text-brand-muted uppercase tracking-wider border border-dashed border-brand-line rounded-2xl m-4 bg-brand-soft/20">
                        No orders recorded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-brand-line bg-brand-soft">
                              {['Order Code', 'Buyer info', 'Amount', 'Fulfillment', 'Actions'].map((h) => (
                                <th key={h} className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line">
                            {orders.slice(0, 5).map((o) => (
                              <tr
                                key={o._id}
                                className="transition hover:bg-brand-soft/30 cursor-pointer"
                                onDoubleClick={() => setSelectedOrder(o)}
                              >
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-navy">
                                  #{o._id.substring(o._id.length - 8).toUpperCase()}
                                </td>
                                <td className="px-6 py-4">
                                  {o.user?._id ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('Users');
                                        if (o.user.email) {
                                          setSearch(o.user.email);
                                          setSearchInput(o.user.email);
                                        }
                                        handleViewUser(o.user._id);
                                      }}
                                      className="text-left group text-brand-navy"
                                      title="View user details & profile"
                                    >
                                      <div className="text-xs font-semibold group-hover:text-brand-accent transition">
                                        {o.shippingAddress?.fullName || o.user?.name || 'Customer'}
                                      </div>
                                      <div className="text-[10px] text-brand-muted group-hover:underline">
                                        {o.user?.email || 'N/A'}
                                      </div>
                                    </button>
                                  ) : (
                                    <>
                                      <div className="text-xs font-semibold text-brand-navy">
                                        {o.shippingAddress?.fullName || o.user?.name || 'Customer'}
                                      </div>
                                      <div className="text-[10px] text-brand-muted">
                                        {o.user?.email || 'N/A'}
                                      </div>
                                    </>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-brand-accent">
                                  ₹{o.totalPrice.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${o.orderStatus === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : o.orderStatus === 'Cancelled'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                        : o.orderStatus === 'Processing'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                          : 'bg-purple-50 text-purple-700 border border-purple-100'
                                    }`}>
                                    {o.orderStatus}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrder(o)}
                                    className="rounded-full bg-brand-soft px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-navy hover:bg-brand-navy hover:text-white transition duration-200"
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ── Recent Signups Section ── */}
                  <div className="flex items-center justify-between mt-8">
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-brand-navy">
                        Recent Registrations Overview
                      </h3>
                      <p className="text-xs text-brand-muted mt-1 uppercase tracking-wider">
                        Newest accounts registered in the boutique store
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Users')}
                      className="rounded-full bg-brand-navy px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-accent transition duration-200"
                    >
                      Manage All Users
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm mt-4">
                    {isLoadingRecentUsers ? (
                      <div className="space-y-0 divide-y divide-brand-line bg-white">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-brand-card" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-1/3 bg-brand-card rounded" />
                              <div className="h-3 w-1/4 bg-brand-card rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentUsers.length === 0 ? (
                      <div className="py-16 text-center text-sm text-brand-muted uppercase tracking-wider border border-dashed border-brand-line rounded-2xl m-4 bg-brand-soft/20">
                        No users registered yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-brand-line bg-brand-soft">
                              {['Customer', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                                <th key={h} className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-line">
                            {recentUsers.map((u) => (
                              <tr
                                key={u._id}
                                className="transition hover:bg-brand-soft/30 cursor-pointer"
                                onClick={() => {
                                  setActiveTab('Users');
                                  if (u.email) {
                                    setSearch(u.email);
                                    setSearchInput(u.email);
                                  }
                                  handleViewUser(u._id);
                                }}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <UserAvatar user={u} size="sm" />
                                    <span className="max-w-[140px] truncate text-xs font-semibold text-brand-navy">
                                      {u.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-brand-muted">
                                  {u.email}
                                </td>
                                <td className="px-6 py-4">
                                  <RoleBadge role={u.role} />
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge isBlocked={u.isBlocked} />
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTab('Users');
                                      if (u.email) {
                                        setSearch(u.email);
                                        setSearchInput(u.email);
                                      }
                                      handleViewUser(u._id);
                                    }}
                                    className="rounded-full bg-brand-soft px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-navy hover:bg-brand-navy hover:text-white transition duration-200"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>

                {/* Right Column: Store Health & Shortcuts */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Quick Actions Card */}
                  <section className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm">
                    <h3 className="font-display text-sm font-bold tracking-tight text-brand-navy mb-4">
                      Quick Shortcuts
                    </h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setModalType('product');
                          setEditingItem(null);
                          setIsModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-brand-line bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy hover:border-brand-accent hover:text-brand-accent transition duration-200"
                      >
                        <svg className="h-4 w-4 text-brand-muted animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Product
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalType('category');
                          setEditingItem(null);
                          setIsModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-brand-line bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy hover:border-brand-accent hover:text-brand-accent transition duration-200"
                      >
                        <svg className="h-4 w-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Category
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalType('brand');
                          setEditingItem(null);
                          setIsModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-brand-line bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy hover:border-brand-accent hover:text-brand-accent transition duration-200"
                      >
                        <svg className="h-4 w-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Brand
                      </button>
                    </div>
                  </section>

                  {/* System/Boutique Health Card */}
                  <section className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm">
                    <h3 className="font-display text-sm font-bold tracking-tight text-brand-navy mb-4">
                      Boutique Diagnostics
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-center justify-between border-b border-brand-line/50 pb-2">
                        <span className="text-xs text-brand-muted font-medium">Database Node</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Operational
                        </span>
                      </li>
                      <li className="flex items-center justify-between border-b border-brand-line/50 pb-2">
                        <span className="text-xs text-brand-muted font-medium">Stripe Gateway</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Connected
                        </span>
                      </li>
                      <li className="flex items-center justify-between border-b border-brand-line/50 pb-2">
                        <span className="text-xs text-brand-muted font-medium">Registered Shoppers</span>
                        <span className="rounded bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-navy">
                          {stats?.total || 0}
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-xs text-brand-muted font-medium">Active Administrators</span>
                        <span className="rounded bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-navy">
                          {stats?.admins || 0}
                        </span>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ── Users Tab (Moved from Dashboard) ── */}
          {activeTab === 'Users' && (
            <>
              {/* ── Stats Cards ── */}
              <section>
                <div className="mb-4">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                    Boutique User Statistics
                  </h2>
                </div>
                {isLoadingStats ? (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-card" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Total Users" value={stats?.total} accent="navy" />
                    <StatCard label="New Today" value={stats?.newToday} accent="blue" />
                    <StatCard label="Active Users" value={stats?.active} accent="green" />
                    <StatCard label="Blocked" value={stats?.blocked} accent="red" />
                  </div>
                )}
              </section>

              {/* ── Users Table ── */}
              <section>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                    User Accounts Directory
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search name or email..."
                        value={searchInput}
                        onChange={handleSearchInput}
                        className="w-56 rounded-xl border border-brand-line bg-white px-4 py-2.5 pr-10 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                      />
                      <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {/* Role filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                      className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent"
                    >
                      <option value="">All Roles</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                      className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
                  {isLoadingUsers ? (
                    <div className="space-y-0 divide-y divide-brand-line">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4">
                          <div className="h-10 w-10 animate-pulse rounded-full bg-brand-card" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-32 animate-pulse rounded bg-brand-card" />
                            <div className="h-3 w-48 animate-pulse rounded bg-brand-card" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="py-16 text-center text-sm text-brand-muted">
                      No users found matching your filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-brand-line bg-brand-soft">
                            {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                              <th
                                key={h}
                                className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-line">
                          {users.map((u) => (
                            <tr key={u._id} className="transition hover:bg-brand-soft/50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <UserAvatar user={u} size="sm" />
                                  <span className="max-w-[140px] truncate text-sm font-semibold text-brand-navy">
                                    {u.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-brand-muted">{u.email}</td>
                              <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                              <td className="px-6 py-4"><StatusBadge isBlocked={u.isBlocked} /></td>
                              <td className="px-6 py-4 text-sm text-brand-muted whitespace-nowrap">
                                {formatDate(u.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {/* View */}
                                  <button
                                    type="button"
                                    title="View details"
                                    onClick={() => handleViewUser(u._id)}
                                    className="rounded-lg border border-brand-line bg-white p-1.5 text-brand-muted transition hover:border-brand-accent hover:text-brand-accent"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  {/* Block / Unblock — only for non-admins */}
                                  {u.role !== 'admin' && (
                                    <button
                                      type="button"
                                      title={u.isBlocked ? 'Unblock' : 'Block'}
                                      disabled={isActionLoading}
                                      onClick={() => handleToggleBlock(u._id)}
                                      className={`rounded-lg border p-1.5 transition disabled:opacity-50 ${u.isBlocked
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                        : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                        }`}
                                    >
                                      {u.isBlocked ? (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                  {/* Delete — only for non-admins */}
                                  {u.role !== 'admin' && (
                                    <button
                                      type="button"
                                      title="Delete user"
                                      disabled={isActionLoading}
                                      onClick={() => handleDelete(u._id)}
                                      className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 transition hover:bg-rose-100 disabled:opacity-50"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-brand-line px-6 py-4">
                      <p className="text-sm text-brand-muted">
                        Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} users)
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!pagination.hasPrevPage}
                          onClick={() => setPage((p) => p - 1)}
                          className="rounded-xl border border-brand-line px-4 py-2 text-sm text-brand-navy transition hover:bg-brand-card disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ← Prev
                        </button>
                        <button
                          type="button"
                          disabled={!pagination.hasNextPage}
                          onClick={() => setPage((p) => p + 1)}
                          className="rounded-xl border border-brand-line px-4 py-2 text-sm text-brand-navy transition hover:bg-brand-card disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'Categories' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-brand-navy">
                    Category Management
                  </h2>
                  <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">
                    Organize your boutique catalogs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('category');
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-luxe transition hover:bg-brand-accent"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Category
                </button>
              </div>

              {isLoadingCategories ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-64 animate-pulse rounded-3xl bg-brand-card" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-brand-line bg-white py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-brand-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <p className="mt-4 text-sm font-semibold text-brand-navy">No categories found</p>
                  <p className="mt-1 text-xs text-brand-muted">Get started by creating your first luxury catalog category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat) => (
                    <div key={cat._id} className="group relative overflow-hidden rounded-3xl border border-brand-line bg-white shadow-sm transition hover:shadow-luxe">
                      {/* Cover Image Banner */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-soft">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0e5fc] to-[#f4f6ff] text-brand-muted">
                            <span className="font-display text-4xl font-extrabold opacity-20 tracking-tight">LUXE</span>
                          </div>
                        )}

                        {/* Featured Badge */}
                        {cat.isFeatured && (
                          <span className="absolute left-4 top-4 rounded-full bg-brand-navy/95 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-6">
                        <h3 className="font-display text-lg font-bold text-brand-navy group-hover:text-brand-accent transition">
                          {cat.name}
                        </h3>
                        <p className="mt-1 font-mono text-[11px] text-brand-muted">
                          slug: {cat.slug}
                        </p>

                        <div className="mt-4 border-t border-brand-line pt-4 flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-wider text-brand-muted">
                            By {cat.createdBy?.name || 'Administrator'}
                          </span>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setModalType('category');
                                setEditingItem(cat);
                                setIsModalOpen(true);
                              }}
                              className="rounded-full bg-brand-soft p-2 text-brand-navy transition hover:bg-brand-navy hover:text-white"
                              title="Edit Category"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem('category', cat._id)}
                              className="rounded-full bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                              title="Delete Category"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'Brands' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-brand-navy">
                    Designer Brands
                  </h2>
                  <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">
                    Manage couture fashion houses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('brand');
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-luxe transition hover:bg-brand-accent"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Brand
                </button>
              </div>

              {isLoadingBrands ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 animate-pulse rounded-3xl bg-brand-card" />
                  ))}
                </div>
              ) : brands.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-brand-line bg-white py-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-brand-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <p className="mt-4 text-sm font-semibold text-brand-navy">No brands found</p>
                  <p className="mt-1 text-xs text-brand-muted">Get started by creating your first luxury partner brand.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {brands.map((brand) => (
                    <div key={brand._id} className="group relative rounded-3xl border border-brand-line bg-white p-6 text-center shadow-sm transition hover:shadow-luxe">
                      {/* Logo Circle */}
                      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-brand-line bg-brand-soft shadow-inner">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <span className="font-display text-2xl font-bold text-brand-navy">
                            {brand.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="mt-4">
                        <h3 className="font-display text-base font-bold text-brand-navy">
                          {brand.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-[10px] text-brand-muted">
                          slug: {brand.slug}
                        </p>

                        {brand.isFeatured && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                            ★ Featured Brand
                          </span>
                        )}
                      </div>

                      {/* Action buttons on card hover or bottom */}
                      <div className="mt-6 border-t border-brand-line pt-4 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setModalType('brand');
                            setEditingItem(brand);
                            setIsModalOpen(true);
                          }}
                          className="rounded-full bg-brand-soft p-2 text-brand-navy transition hover:bg-brand-navy hover:text-white"
                          title="Edit Brand"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem('brand', brand._id)}
                          className="rounded-full bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                          title="Delete Brand"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'Products' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-brand-navy">
                    Premium Products Catalog
                  </h2>
                  <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">
                    Manage boutique collections and stock inventory
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('product');
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-luxe transition hover:bg-brand-accent"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Product
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-brand-line shadow-sm">
                <div className="flex flex-wrap gap-3">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search title, description, SKU..."
                      value={productSearchInput}
                      onChange={handleProductSearchInput}
                      className="w-64 rounded-xl border border-brand-line bg-white px-4 py-2.5 pr-10 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                    />
                    <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {/* Category filter */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => { setProductCategoryFilter(e.target.value); setProductPage(1); }}
                    className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent transition"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {/* Brand filter */}
                  <select
                    value={productBrandFilter}
                    onChange={(e) => { setProductBrandFilter(e.target.value); setProductPage(1); }}
                    className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent transition"
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                  Total Catalog Items: {productPagination?.totalCount || 0}
                </div>
              </div>

              {/* Data Grid Table */}
              <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
                {isLoadingProducts ? (
                  <div className="space-y-0 divide-y divide-brand-line">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                        <div className="h-12 w-12 rounded-xl bg-brand-card" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 bg-brand-card rounded" />
                          <div className="h-3 w-1/4 bg-brand-card rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="py-16 text-center text-sm text-brand-muted uppercase tracking-wider border border-dashed border-brand-line rounded-2xl m-4 bg-brand-soft/20">
                    No products found matching filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-line bg-brand-soft">
                          {['Product info', 'SKU', 'Category & Brand', 'Price', 'Stock', 'Featured', 'Active', 'Actions'].map((h) => (
                            <th key={h} className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-line">
                        {products.map((p) => {
                          const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || '';
                          return (
                            <tr key={p._id} className="transition hover:bg-brand-soft/30">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-xl border border-brand-line overflow-hidden bg-brand-soft flex-shrink-0 flex items-center justify-center">
                                    {primaryImg ? (
                                      <img src={primaryImg} alt={p.title} className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="font-display text-[9px] font-extrabold opacity-30">LUXE</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block text-sm font-semibold text-brand-navy truncate max-w-[200px]" title={p.title}>
                                      {p.title}
                                    </span>
                                    {p.shortDescription && (
                                      <span className="block text-[11px] text-brand-muted truncate max-w-[200px]" title={p.shortDescription}>
                                        {p.shortDescription}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 font-mono text-xs text-brand-navy">
                                {p.sku || 'N/A'}
                              </td>

                              <td className="px-6 py-4">
                                <div className="text-xs font-semibold text-brand-navy">
                                  {p.category?.name || 'N/A'}
                                </div>
                                <div className="text-[10px] text-brand-muted uppercase tracking-wider">
                                  {p.brand?.name || 'No Brand'}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                {p.discountPrice ? (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-brand-accent">
                                      ₹{p.discountPrice.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-brand-muted line-through">
                                      ₹{p.price.toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-semibold text-brand-navy">
                                    ₹{p.price.toFixed(2)}
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.stock === 0
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : p.stock < 5
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>
                                  {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductField(p._id, 'isFeatured', p.isFeatured)}
                                  disabled={isActionLoading}
                                  className={`text-lg transition disabled:opacity-50 ${p.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'
                                    }`}
                                  title={p.isFeatured ? 'Unmark Featured' : 'Mark Featured'}
                                >
                                  ★
                                </button>
                              </td>

                              <td className="px-6 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductField(p._id, 'isActive', p.isActive)}
                                  disabled={isActionLoading}
                                  className="disabled:opacity-50"
                                >
                                  {p.isActive ? (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-200">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-200">
                                      Inactive
                                    </span>
                                  )}
                                </button>
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalType('product');
                                      setEditingItem(p);
                                      setIsModalOpen(true);
                                    }}
                                    className="rounded-full bg-brand-soft p-2 text-brand-navy transition hover:bg-brand-navy hover:text-white"
                                    title="Edit Product"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem('product', p._id)}
                                    className="rounded-full bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                                    title="Delete Product"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {productPagination && productPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-brand-line px-6 py-4 bg-white">
                    <p className="text-sm text-brand-muted">
                      Showing page {productPagination.currentPage} of {productPagination.totalPages} ({productPagination.totalCount} products)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!productPagination.hasPrevPage}
                        onClick={() => setProductPage((p) => p - 1)}
                        className="rounded-xl border border-brand-line px-4 py-2 text-sm text-brand-navy transition hover:bg-brand-card disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={!productPagination.hasNextPage}
                        onClick={() => setProductPage((p) => p + 1)}
                        className="rounded-xl border border-brand-line px-4 py-2 text-sm text-brand-navy transition hover:bg-brand-card disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'Orders' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-brand-navy">
                    Order Fulfillment
                  </h2>
                  <p className="text-xs text-brand-muted uppercase tracking-wider mt-1">
                    Fulfill luxury customer shipments and verify payment status
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-muted uppercase tracking-wider shadow-sm">
                    Total Revenue: <span className="text-brand-accent font-bold font-display ml-1">₹{(stats?.totalSales || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total Orders" value={stats?.totalOrders || 0} accent="navy" />
                <StatCard label="Fulfillments Pending" value={stats?.pendingOrders || 0} accent="blue" />
                <StatCard label="Shipped Shipments" value={stats?.shippedOrders || 0} accent="green" />
                <StatCard label="Completed Orders" value={stats?.deliveredOrders || 0} accent="slate" />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-brand-line shadow-sm">
                <div className="flex flex-wrap gap-3">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search buyer name, email, ref..."
                      value={orderSearchInput}
                      onChange={handleOrderSearchInput}
                      className="w-64 rounded-xl border border-brand-line bg-white px-4 py-2.5 pr-10 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/10"
                    />
                    <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {/* Status filter */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}
                    className="rounded-xl border border-brand-line bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-accent transition"
                  >
                    <option value="">All Statuses</option>
                    <option value="Processing">Processing</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
                  Total Orders Listed: {orderPagination?.totalCount || 0}
                </div>
              </div>

              {/* Orders Data Table */}
              <div className="overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm">
                {isLoadingOrders ? (
                  <div className="space-y-0 divide-y divide-brand-line">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 bg-brand-card rounded" />
                          <div className="h-3 w-1/4 bg-brand-card rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center text-sm text-brand-muted uppercase tracking-wider border border-dashed border-brand-line rounded-2xl m-4 bg-brand-soft/20">
                    No orders found matching filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-brand-line bg-brand-soft">
                          {['Order Code', 'Buyer info', 'Purchase date', 'Amount', 'Payment status', 'Fulfillment', 'Actions'].map((h) => (
                            <th key={h} className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-line">
                        {orders.map((o) => (
                          <tr
                            key={o._id}
                            className="transition hover:bg-brand-soft/30 cursor-pointer"
                            onDoubleClick={() => setSelectedOrder(o)}
                          >
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-navy">
                              #{o._id.substring(o._id.length - 8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4">
                              {o.user?._id ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('Users');
                                    if (o.user.email) {
                                      setSearch(o.user.email);
                                      setSearchInput(o.user.email);
                                    }
                                    handleViewUser(o.user._id);
                                  }}
                                  className="text-left group text-brand-navy"
                                  title="View user details & profile"
                                >
                                  <div className="text-xs font-semibold group-hover:text-brand-accent transition">
                                    {o.shippingAddress?.fullName || o.user?.name || 'Customer'}
                                  </div>
                                  <div className="text-[10px] text-brand-muted group-hover:underline">
                                    {o.user?.email || 'N/A'}
                                  </div>
                                </button>
                              ) : (
                                <>
                                  <div className="text-xs font-semibold text-brand-navy">
                                    {o.shippingAddress?.fullName || o.user?.name || 'Customer'}
                                  </div>
                                  <div className="text-[10px] text-brand-muted">
                                    {o.user?.email || 'N/A'}
                                  </div>
                                </>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-brand-navy whitespace-nowrap">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-brand-accent">
                              ₹{o.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${o.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : o.paymentStatus === 'Failed'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                }`}>
                                {o.paymentStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${o.orderStatus === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : o.orderStatus === 'Cancelled'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : o.orderStatus === 'Processing'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : 'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                {o.orderStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(o)}
                                className="rounded-full bg-brand-soft px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-navy hover:bg-brand-navy hover:text-white transition duration-200"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {orderPagination && orderPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-brand-line px-6 py-4 bg-white">
                    <p className="text-sm text-brand-muted">
                      Showing page {orderPagination.currentPage} of {orderPagination.totalPages} ({orderPagination.totalCount} orders)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!orderPagination.hasPrevPage}
                        onClick={() => setOrderPage((p) => p - 1)}
                        className="rounded-xl border border-brand-line px-4 py-2 text-sm text-brand-navy transition hover:bg-brand-card disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={!orderPagination.hasNextPage}
                        onClick={() => setOrderPage((p) => p + 1)}
                        className="rounded-xl border border-brand-line px-4 py-2 text-sm text-brand-navy transition hover:bg-brand-card disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleBlock={handleToggleBlock}
          onDelete={handleDelete}
          isActionLoading={isActionLoading}
        />
      )}

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          isActionLoading={isActionLoading}
        />
      )}

      {/* ── Category / Brand Modal ── */}
      {isModalOpen && modalType !== 'product' && (
        <CategoryBrandModal
          type={modalType}
          item={editingItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleModalSubmit}
          isSaving={isActionLoading}
        />
      )}

      {/* ── Product Modal ── */}
      {isModalOpen && modalType === 'product' && (
        <ProductModal
          item={editingItem}
          categories={categories}
          brands={brands}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleModalSubmit}
          isSaving={isActionLoading}
        />
      )}

      {/* ── Admin Profile Modal ── */}
      {showAdminProfile && (
        <AdminProfileModal
          user={adminUser}
          onClose={() => setShowAdminProfile(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}

export default AdminPage;
