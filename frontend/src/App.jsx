import { useEffect, useState } from 'react';
import ToastBanner from './components/common/ToastBanner.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import HomePage from './pages/HomePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import BrandPage from './pages/BrandPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartDrawer from './components/common/CartDrawer.jsx';
import WishlistDrawer from './components/common/WishlistDrawer.jsx';
import GlobalToaster from './components/common/GlobalToaster.jsx';
import { logoutUser, refreshAccessToken } from './services/authService.js';
import { buildUserFromApi, clearUser, loadUser, persistUser } from './utils/authStorage.js';
import { getRouteFromPath, navigateToPath } from './utils/routing.js';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';

function App() {
  const [route, setRoute] = useState(() => getRouteFromPath(window.location.pathname));

  // User profile loaded from sessionStorage — gives instant UI without a flash.
  // NOTE: This alone does NOT mean the user is authenticated. The access token
  // must also be present (rehydrated via the refresh cookie below).
  const [user, setUser] = useState(() => loadUser());

  // Access token lives in React state (in-memory) ONLY.
  // It is NEVER written to sessionStorage, localStorage, or any persistent storage.
  // Lost on page refresh → silently restored via the HTTP-Only refresh cookie below.
  const [accessToken, setAccessToken] = useState(null);

  // True while the app is calling /refresh on mount to silently restore the session.
  // Prevents the UI from flashing as "logged out" before the token is back.
  const [isInitializing, setIsInitializing] = useState(true);

  const [notice, setNotice] = useState(null);

  // ── Silent session rehydration on every page load ────────────────────────
  // On mount, we send the HTTP-Only refresh cookie to the backend to get a
  // fresh access token. If the cookie is expired/missing, the user is logged out.
  useEffect(() => {
    refreshAccessToken()
      .then(({ accessToken: freshToken }) => {
        setAccessToken(freshToken);
      })
      .catch(() => {
        // No valid refresh cookie → clear any stale user data from sessionStorage
        setUser(null);
        clearUser();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const navigate = (path) => {
    navigateToPath(path);
    setRoute(getRouteFromPath(path));
  };

  // Shared handler for both login and register success
  const handleAuthSuccess = (apiResponse, welcomeText) => {
    const freshUser = buildUserFromApi(apiResponse);

    // Store only the user profile in sessionStorage — never the token
    persistUser(freshUser);
    setUser(freshUser);

    // Store the access token in React state only (in-memory)
    setAccessToken(apiResponse.accessToken);

    setNotice({ tone: 'success', text: welcomeText });
    
    if (freshUser.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleRegisterSuccess = (apiResponse) => {
    handleAuthSuccess(
      apiResponse,
      `Welcome, ${apiResponse.name}. Your account has been created successfully.`,
    );
  };

  const handleLoginSuccess = (apiResponse) => {
    handleAuthSuccess(
      apiResponse,
      `Welcome back, ${apiResponse.name}. You have signed in successfully.`,
    );
  };

  const handleLogout = async () => {
    try {
      await logoutUser(); // instructs the backend to clear the HTTP-Only refresh cookie
    } catch {
      // Proceed with local cleanup even if the network call fails
    }

    setUser(null);
    setAccessToken(null); // wipe from memory
    clearUser();           // wipe from sessionStorage
    setNotice({ tone: 'info', text: 'You have been signed out.' });
    navigate('/register');
  };

  const handleProfileUpdate = (updatedUserData, newAccessToken) => {
    const safeUser = buildUserFromApi(updatedUserData);
    persistUser(safeUser);
    setUser(safeUser);
    if (newAccessToken) {
      setAccessToken(newAccessToken);
    }
    setNotice({ tone: 'success', text: 'Your profile has been updated successfully.' });
  };

  // Show a branded loading screen while the refresh call is in flight.
  // This prevents the UI from incorrectly rendering as "logged out"
  // for the brief moment before the access token is restored.
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <p className="animate-pulse font-display text-4xl font-bold tracking-[-0.08em] text-brand-navy">
          LUXE
        </p>
      </div>
    );
  }

  // authSession is only truthy when BOTH the user profile AND the in-memory
  // access token are present. This is the single source of auth truth.
  const authSession = user && accessToken ? { user, accessToken } : null;

  const renderContent = () => {
    if (route === 'register') {
      return (
        <RegisterPage
          authSession={authSession}
          navigate={navigate}
          onRegisterSuccess={handleRegisterSuccess}
          onLogout={handleLogout}
        />
      );
    }

    if (route === 'login') {
      return (
        <LoginPage
          authSession={authSession}
          navigate={navigate}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      );
    }

    if (route === 'admin') {
      // Guard: must be logged in AND have admin role
      if (!authSession || authSession.user?.role !== 'admin') {
        // Redirect to login if not authenticated, or home if not an admin
        window.setTimeout(() => navigate(authSession ? '/' : '/login'), 0);
        return null;
      }
      return <AdminPage authSession={authSession} navigate={navigate} onLogout={handleLogout} />;
    }

    if (route === 'category') {
      const parts = window.location.pathname.split('/');
      const categorySlug = parts[parts.length - 1] || '';
      return (
        <CategoryPage
          categorySlug={categorySlug}
          authSession={authSession}
          navigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    if (route === 'brand') {
      const parts = window.location.pathname.split('/');
      const brandSlug = parts[parts.length - 1] || '';
      return (
        <BrandPage
          brandSlug={brandSlug}
          authSession={authSession}
          navigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    if (route === 'checkout') {
      return <CheckoutPage authSession={authSession} navigate={navigate} />;
    }

    if (route === 'product') {
      const parts = window.location.pathname.split('/');
      const productSlug = parts[parts.length - 1] || '';
      return (
        <ProductPage
          productSlug={productSlug}
          authSession={authSession}
          navigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    if (route === 'orders') {
      return <OrdersPage authSession={authSession} navigate={navigate} onLogout={handleLogout} />;
    }

    if (route === 'profile') {
      if (!authSession) {
        window.setTimeout(() => navigate('/login'), 0);
        return null;
      }
      return (
        <ProfilePage
          authSession={authSession}
          navigate={navigate}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
        />
      );
    }

    return <HomePage authSession={authSession} navigate={navigate} onLogout={handleLogout} />;
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "336592233959-dummy.apps.googleusercontent.com"}>
      <CartProvider authSession={authSession}>
        <WishlistProvider authSession={authSession}>
          <div className="bg-brand-soft text-brand-ink">
            {notice ? <ToastBanner notice={notice} onDismiss={() => setNotice(null)} /> : null}
            {renderContent()}
            <CartDrawer navigate={navigate} authSession={authSession} />
            <WishlistDrawer navigate={navigate} authSession={authSession} />
            <GlobalToaster />
          </div>
        </WishlistProvider>
      </CartProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
