export function getRouteFromPath(pathname) {
  if (pathname === '/register') return 'register';
  if (pathname === '/login') return 'login';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/category/')) return 'category';
  if (pathname.startsWith('/brand/')) return 'brand';
  if (pathname.startsWith('/product/')) return 'product';
  if (pathname === '/checkout') return 'checkout';
  if (pathname === '/orders') return 'orders';
  if (pathname === '/profile') return 'profile';
  return 'home';
}

export function navigateToPath(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
