import { useRef, useState } from 'react';
import FieldError from '../components/common/FieldError.jsx';
import FormField from '../components/common/FormField.jsx';
import Icon from '../components/common/Icon.jsx';
import StatusMessage from '../components/common/StatusMessage.jsx';
import Footer from '../components/layout/Footer.jsx';
import RegisterHeader from '../components/layout/RegisterHeader.jsx';
import { registerUser, loginWithGoogle } from '../services/authService.js';
import { convertFileToDataUrl, validateRegisterForm } from '../utils/registerForm.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { GoogleLogin } from '@react-oauth/google';


function RegisterPage({ navigate, onRegisterSuccess, authSession, onLogout }) {
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    termsAccepted: false,
    avatar: '',
    avatarName: '',
    avatarFile: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(authSession?.user?.avatar || '');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // If already logged in, redirect based on role
  if (authSession) {
    const target = authSession.user?.role === 'admin' ? '/admin' : '/';
    window.setTimeout(() => navigate(target), 0);
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setStatus(null);
    setIsSubmitting(true);

    try {
      const payload = await loginWithGoogle(credentialResponse.credential);

      setStatus({
        tone: 'success',
        text: 'Signed in successfully. Redirecting you to the homepage.',
      });

      window.setTimeout(() => onRegisterSuccess(payload), 800);
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error.message || 'Google authentication failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setStatus({
      tone: 'error',
      text: 'Google Sign-In was cancelled or failed.',
    });
  };


  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleAvatarChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setErrors((current) => ({
        ...current,
        avatar: 'Please upload a JPG or PNG image.',
      }));
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        avatar: 'Profile picture must be smaller than 2MB.',
      }));
      return;
    }

    try {
      const dataUrl = await convertFileToDataUrl(selectedFile);
      setAvatarPreview(dataUrl);
      setFormData((current) => ({
        ...current,
        avatar: dataUrl,
        avatarName: selectedFile.name,
        avatarFile: selectedFile,
      }));
      setErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors.avatar;
        return nextErrors;
      });
    } catch {
      setErrors((current) => ({
        ...current,
        avatar: 'We could not read that image. Please try another file.',
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let finalAvatarUrl = null;

      if (formData.avatarFile) {
        setIsUploading(true);
        try {
          finalAvatarUrl = await uploadToCloudinary(formData.avatarFile);
        } catch (uploadError) {
          throw new Error(`Profile photo upload failed: ${uploadError.message}`);
        } finally {
          setIsUploading(false);
        }
      }

      const payload = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null,
        avatar: finalAvatarUrl,
      });

      setStatus({
        tone: 'success',
        text: 'Account created successfully. Redirecting you to the homepage.',
      });

      window.setTimeout(() => onRegisterSuccess(payload), 800);
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error.message || 'We could not create your account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <RegisterHeader navigate={navigate} authSession={authSession} onLogout={onLogout} />

      <main className="flex min-h-[calc(100vh-88px)] flex-col md:flex-row">
        <section className="register-visual relative hidden overflow-hidden bg-brand-card md:sticky md:top-[88px] md:block md:h-[calc(100vh-88px)] md:w-1/2 lg:w-3/5">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvLuwvniFiqmTwDO3mf1S_qfMqf1rIgYgPOyy8xaWkEbs9cN-Zl5NU4gqAPQUm7WkMiQDtYOuTisfTd5-LT_NBYvfOUHxGW_XDG9WTweOaWIi63pZO2u847R2uNJRDnUu5tuyzCahbFQychpzRb8wZuuliV34wknktVUXx7qZCVDkI24ZHRFepE60fdfxluviIkOTsxhPU65flj1jh7ymSu4SyUxsfeorTTmx4T5ZiNZ1hafxkHLvya7k_2p7V_yRaF8Zx9HLjbM4"
            alt="Editorial fashion boutique scene"
            className="h-full w-full object-cover"
          />
          <div className="register-visual-overlay absolute inset-0" />
          <div className="absolute bottom-12 left-12 max-w-lg text-white">
            <h2 className="font-display text-6xl font-bold leading-[0.95] tracking-[-0.07em]">Elevate your standards.</h2>
            <p className="mt-6 text-2xl leading-10 text-white/90">
              Join an exclusive community dedicated to the art of modern refinement and sustainable elegance.
            </p>
          </div>
        </section>

        <section className="w-full bg-[#fbfbff] px-4 py-14 sm:px-6 lg:px-10 lg:py-20 md:w-1/2 lg:w-2/5">
          <div className="mx-auto w-full max-w-lg">
            <header className="mb-10">
              <h1 className="font-display text-5xl font-bold tracking-[-0.07em] text-brand-navy sm:text-6xl">Create Account</h1>
              <p className="mt-3 text-lg text-brand-muted">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-brand-navy transition hover:underline"
                >
                  Sign In
                </button>
              </p>
            </header>

            {status ? <StatusMessage tone={status.tone} text={status.text} /> : null}

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm uppercase tracking-[0.16em] text-brand-muted">Profile Picture</label>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.4rem] border border-brand-line bg-[#dfe4fb] text-brand-muted">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <Icon name="person" className="h-9 w-9" />
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex w-fit items-center justify-center bg-brand-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-brand-accent"
                    >
                      Upload Photo
                    </button>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">
                      {formData.avatarName || 'Max size 2MB, JPG or PNG'}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
                {errors.avatar ? <FieldError message={errors.avatar} /> : null}
              </div>

              <FormField
                label="Full Name"
                id="full_name"
                placeholder="Alexander Luxe"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                error={errors.name}
              />

              <FormField
                label="Email Address"
                id="email"
                type="email"
                placeholder="alexander@moderne.com"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                error={errors.email}
              />

              <FormField
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                error={errors.password}
                helperText="Use at least 6 characters."
                adornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="text-brand-muted transition hover:text-brand-navy"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} className="h-5 w-5" />
                  </button>
                }
              />

              <FormField
                label="Phone Number (Optional)"
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                error={errors.phone}
              />

              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(event) => updateField('termsAccepted', event.target.checked)}
                    className="mt-1 h-5 w-5 rounded-none border-brand-line text-brand-navy focus:ring-brand-navy/15"
                  />
                  <span className="text-sm leading-7 text-brand-ink">
                    I agree to the{' '}
                    <a href="#" className="font-medium text-brand-navy transition hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-medium text-brand-navy transition hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
                {errors.termsAccepted ? <FieldError message={errors.termsAccepted} /> : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-navy px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white shadow-luxe transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isUploading
                  ? 'Uploading Image...'
                  : isSubmitting
                    ? 'Creating Account...'
                    : 'Create Account'}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-brand-line/80" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest text-[9px] font-bold text-brand-muted bg-[#fbfbff]">
                  <span className="px-3 bg-[#fbfbff]">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer compact />
    </>
  );
}

export default RegisterPage;
