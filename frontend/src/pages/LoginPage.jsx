import { useRef, useState } from 'react';
import FieldError from '../components/common/FieldError.jsx';
import FormField from '../components/common/FormField.jsx';
import Icon from '../components/common/Icon.jsx';
import StatusMessage from '../components/common/StatusMessage.jsx';
import Footer from '../components/layout/Footer.jsx';
import RegisterHeader from '../components/layout/RegisterHeader.jsx';
import { loginUser, loginWithGoogle } from '../services/authService.js';
import { GoogleLogin } from '@react-oauth/google';

function LoginPage({ navigate, onLoginSuccess, authSession, onLogout }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    setStatus(null);
    setIsSubmitting(true);

    try {
      const payload = await loginWithGoogle(credentialResponse.credential);

      setStatus({
        tone: 'success',
        text: 'Signed in successfully. Redirecting you to the homepage.',
      });

      window.setTimeout(() => onLoginSuccess(payload), 800);
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

  // If already logged in, redirect based on role
  if (authSession) {
    const target = authSession.user?.role === 'admin' ? '/admin' : '/';
    window.setTimeout(() => navigate(target), 0);
  }

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

  const handleMouseMove = (e) => {
    if (!containerRef.current || !imgRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    imgRef.current.style.transform = `scale(1.1) translate(${x * 20}px, ${y * 20}px)`;
  };

  const handleMouseLeave = () => {
    if (!imgRef.current) return;
    imgRef.current.style.transform = 'scale(1) translate(0, 0)';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    // Basic validation
    const nextErrors = {};
    if (!formData.email.trim()) {
      nextErrors.email = 'Email Address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      setStatus({
        tone: 'success',
        text: 'Signed in successfully. Redirecting you to the homepage.',
      });

      window.setTimeout(() => onLoginSuccess(payload), 800);
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error.message || 'Could not authenticate. Please check your credentials and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <RegisterHeader navigate={navigate} authSession={authSession} onLogout={onLogout} />

      <main className="flex min-h-[calc(100vh-88px)] flex-col md:flex-row bg-[#fbfbff]">
        {/* Left Side: Editorial Image */}
        <section
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative hidden md:flex w-1/2 h-[calc(100vh-88px)] overflow-hidden bg-brand-card sticky top-[88px]"
        >
          <img
            ref={imgRef}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbwPMRMvpIBbl5dbh55rfk4JrZ3wvWis4YbD8oOuojXhOq6J3OlyDtzQziDHOi9rhXR0aufp8siUOMFRiwXXcaV1xOHfO625BCEvDllALl7MRGQiUN5bpsyqlA7kLhZtDqVv360R-rqEQbXUz1JTx3rg12jr9COOzK3dIH73i_1OfkjgJLGW5k4dVYhE1hNacMMRL7B-Z7uUN3JZlrIo8wDQuMginkwZoAj4gWrom39qGq2qF-nNQSm2lymqM0-m9S_XreVoE0TIk"
            alt="Editorial fashion photography"
            className="absolute inset-0 w-full h-full object-cover grayscale-[0.1] brightness-[0.85]"
            style={{ transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 to-transparent" />
          <div className="absolute bottom-12 left-12 text-white max-w-md">
            <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-[-0.07em] mb-4">Welcome Back.</h1>
            <p className="font-sans text-xl text-white/80 leading-relaxed">
              Continue your journey in modern refinement.
            </p>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="flex-1 flex flex-col justify-center items-center px-6 py-14 sm:px-10 sm:py-20 md:px-12 md:w-1/2 lg:w-2/5">
          <div className="w-full max-w-lg">
            {/* Header */}
            <header className="mb-10">
              <h1 className="font-display text-5xl font-bold tracking-[-0.07em] text-brand-navy sm:text-6xl">Sign In</h1>
              <p className="mt-3 text-lg text-brand-muted">
                New to LUXE?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-semibold text-brand-navy transition hover:underline"
                >
                  Create Account
                </button>
              </p>
            </header>

            {status ? <StatusMessage tone={status.tone} text={status.text} /> : null}

            {/* Form */}
            <form className="space-y-8" onSubmit={handleSubmit}>
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-navy px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white shadow-luxe transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
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

export default LoginPage;
