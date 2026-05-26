import { useState, useEffect, useRef } from 'react';
import { updateUserProfile } from '../services/authService.js';
import Footer from '../components/layout/Footer.jsx';
import HomeHeader from '../components/layout/HomeHeader.jsx';
import Icon from '../components/common/Icon.jsx';
import FormField from '../components/common/FormField.jsx';
import StatusMessage from '../components/common/StatusMessage.jsx';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const MAX_FILE_SIZE_MB = 2;

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */
function getInitials(name) {
  const parts = (name || 'LU').trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0] || 'LU').substring(0, 2))
    .toUpperCase();
}

function InfoRow({ icon, label, value, badge }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-brand-line last:border-0">
      <span className="mt-0.5 text-brand-muted flex-shrink-0">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted leading-none mb-1">
          {label}
        </p>
        <p className="text-sm font-semibold text-brand-navy truncate">{value || '—'}</p>
      </div>
      {badge && (
        <span className="flex-shrink-0 self-center text-[9px] font-bold uppercase tracking-[0.12em] bg-brand-card border border-brand-line text-brand-muted rounded px-2 py-0.5">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────────────────────── */
function ProfilePage({ authSession, navigate, onLogout, onProfileUpdate }) {
  const token = authSession?.accessToken ?? null;
  const user = authSession?.user ?? null;

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', avatar: '', password: '', confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFileName, setAvatarFileName] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!authSession) { navigate('/login'); return; }
    if (user) {
      setFormData({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '', password: '', confirmPassword: '' });
      setAvatarPreview(user.avatar || null);
    }
  }, [authSession, user, navigate]);

  /* ── file picker ───────────────────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (JPG, PNG, WEBP, etc.).');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setAvatarError(`Image must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setAvatarFileName(file.name);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      setAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFileName('');
    setAvatarError('');
    setAvatarFile(null);
    setFormData((p) => ({ ...p, avatar: '' }));
  };

  /* ── field helpers ─────────────────────────────────────────────────────── */
  const updateField = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setFieldErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required.';
    if (formData.password) {
      if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters.';
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      let uploadedAvatarUrl = formData.avatar;

      if (avatarFile) {
        // Upload photo directly to Cloudinary prior to saving profile
        uploadedAvatarUrl = await uploadToCloudinary(avatarFile);
      }

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        avatar: uploadedAvatarUrl || null,
      };
      if (formData.password) payload.password = formData.password;
      const updated = await updateUserProfile(payload, token);
      setStatus({ tone: 'success', text: 'Your profile has been updated successfully.' });
      setFormData((p) => ({ ...p, password: '', confirmPassword: '' }));
      setAvatarFile(null);
      if (onProfileUpdate) onProfileUpdate(updated, updated.accessToken);
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not save changes. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = getInitials(formData.name || user?.name);
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : null;

  return (
    <>
      <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />

      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        id="avatar-file-input"
      />

      <main className="bg-brand-soft">

        {/* ── Hero banner — same pattern as homepage hero ────────────────── */}
        <section className="relative overflow-hidden bg-white border-b border-brand-line">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-accent mb-2">
                My Account
              </p>
              <h1 className="font-display text-4xl font-bold tracking-[-0.06em] text-brand-navy sm:text-5xl">
                Profile Settings
              </h1>
              <p className="mt-3 text-sm leading-6 text-brand-muted max-w-lg">
                Update your personal information, profile photo and security credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-shrink-0 rounded-full border border-brand-line bg-white hover:border-brand-accent hover:text-brand-accent text-brand-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition shadow-luxe"
            >
              ← Back to Lounge
            </button>
          </div>
          {/* dot-grid decoration (same as newsletter section) */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #0d0d46 1px, transparent 0)', backgroundSize: '28px 28px' }}
          />
        </section>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">

            {/* ══ LEFT COLUMN: Identity card ══════════════════════════════ */}
            <aside>
              <div className="sticky top-28 rounded-[2rem] bg-white border border-brand-line shadow-luxe overflow-hidden">

                {/* Avatar area */}
                <div className="relative bg-[#eef1fb] px-8 pt-10 pb-8 flex flex-col items-center text-center border-b border-brand-line">
                  {/* dot-grid like feature cards */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle, #0d0d46 1px, transparent 0)', backgroundSize: '24px 24px' }}
                  />

                  {/* clickable avatar circle */}
                  <div className="relative z-10 mb-5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative block h-28 w-28 rounded-full overflow-hidden ring-4 ring-white shadow-luxe focus:outline-none"
                      title="Click to change photo"
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-brand-navy">
                          <span className="font-display text-3xl font-bold text-white">{initials}</span>
                        </div>
                      )}
                      {/* camera hover overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-navy/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-xl text-white">📷</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white mt-1">Change</span>
                      </div>
                    </button>

                    {/* online dot */}
                    <span className="absolute bottom-1 right-1 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-white block" />
                  </div>

                  <h2 className="relative z-10 font-display text-xl font-bold text-brand-navy">
                    {formData.name || user?.name}
                  </h2>
                  <span className="relative z-10 mt-2 inline-flex items-center rounded-full bg-brand-accent/10 border border-brand-accent/20 px-3.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                    {user?.role} · LUXE Member
                  </span>
                  {joinedDate && (
                    <p className="relative z-10 mt-3 text-[10px] text-brand-muted">
                      Member since {joinedDate}
                    </p>
                  )}
                </div>

                {/* Info rows */}
                <div className="px-6 py-2">
                  <InfoRow icon="mail" label="Email Address" value={user?.email} badge="Locked" />
                  <InfoRow
                    icon="phone"
                    label="Phone Contact"
                    value={formData.phone || user?.phone || 'Not provided'}
                  />
                  <InfoRow icon="user" label="Account Role" value={user?.role} />
                </div>

                {/* Action Buttons: My Orders & Logout */}
                <div className="px-6 pb-6 pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy py-3 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-brand-accent shadow-sm"
                  >
                    <Icon name="bag" className="h-3.5 w-3.5" />
                    My Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy py-3 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-rose-600 shadow-sm"
                  >
                    <Icon name="logout" className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>

                {/* Security note — same card style as feature cards */}
                <div className="mx-6 mb-6 mt-2 rounded-[1.25rem] bg-brand-card border border-brand-line p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-brand-line text-brand-navy">
                      <Icon name="shield" className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] leading-relaxed text-brand-muted">
                      <strong className="text-brand-navy">Vault-Grade Security.</strong>{' '}
                      Your credentials are encrypted with enterprise-level algorithms. Email changes require support verification.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* ══ RIGHT COLUMN: Edit form ══════════════════════════════════ */}
            <div className="space-y-6">

              {status && (
                <StatusMessage tone={status.tone} text={status.text} />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Card: Personal Details ─────────────────────────── */}
                <div className="rounded-[2rem] bg-white border border-brand-line shadow-luxe p-8 sm:p-10">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-card border border-brand-line text-brand-navy">
                      <Icon name="user" className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-brand-navy">Personal Details</h3>
                      <p className="text-xs text-brand-muted mt-0.5">Your public-facing account information</p>
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2">
                    <FormField
                      label="Full Name"
                      id="name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      error={fieldErrors.name}
                    />
                    <FormField
                      label="Phone Number"
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      error={fieldErrors.phone}
                    />
                  </div>
                </div>

                {/* ── Card: Profile Photo ────────────────────────────── */}
                <div className="rounded-[2rem] bg-white border border-brand-line shadow-luxe p-8 sm:p-10">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-card border border-brand-line text-brand-navy">
                      <Icon name="camera" className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-brand-navy">Profile Photo</h3>
                      <p className="text-xs text-brand-muted mt-0.5">JPG, PNG or WEBP · Max {MAX_FILE_SIZE_MB} MB</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Thumbnail */}
                    <div className="h-24 w-24 flex-shrink-0 rounded-[1.25rem] overflow-hidden bg-brand-soft border-2 border-brand-line flex items-center justify-center shadow-sm">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-2xl font-bold text-brand-navy">{initials}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-1 space-y-3 text-center sm:text-left">
                      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-full border border-brand-line bg-white hover:border-brand-accent hover:text-brand-accent text-brand-navy px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition shadow-sm"
                        >
                          {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-rose-600 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {avatarFileName && (
                        <p className="text-[10px] font-medium text-brand-muted truncate">
                          📎 {avatarFileName}
                        </p>
                      )}
                      {avatarError && (
                        <p className="text-[11px] font-semibold text-rose-600">⚠ {avatarError}</p>
                      )}
                      {!avatarFileName && !avatarError && (
                        <p className="text-[10px] text-brand-muted">
                          No file selected. Click upload to choose from your device.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Card: Security ─────────────────────────────────── */}
                <div className="rounded-[2rem] bg-white border border-brand-line shadow-luxe p-8 sm:p-10">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-card border border-brand-line text-brand-navy">
                      <Icon name="lock" className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-brand-navy">Change Password</h3>
                      <p className="text-xs text-brand-muted mt-0.5">Leave blank to keep your current password</p>
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2">
                    <FormField
                      label="New Password"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      error={fieldErrors.password}
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="text-brand-muted transition hover:text-brand-navy"
                          aria-label={showPassword ? 'Hide' : 'Show'}
                        >
                          <Icon name={showPassword ? 'eye-off' : 'eye'} className="h-5 w-5" />
                        </button>
                      }
                    />
                    <FormField
                      label="Confirm Password"
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      error={fieldErrors.confirmPassword}
                      adornment={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="text-brand-muted transition hover:text-brand-navy"
                          aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                        >
                          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} className="h-5 w-5" />
                        </button>
                      }
                    />
                  </div>
                </div>

                {/* ── Save bar ───────────────────────────────────────── */}
                <div className="rounded-[2rem] bg-white border border-brand-line shadow-luxe px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[10px] text-brand-muted text-center sm:text-left">
                    ⚠️ Email address changes require concierge support verification.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-full bg-brand-navy hover:bg-brand-accent px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-luxe transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default ProfilePage;
