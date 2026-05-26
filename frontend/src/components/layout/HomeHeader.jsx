import { useState, useEffect } from 'react';
import Avatar from '../common/Avatar.jsx';
import Icon from '../common/Icon.jsx';
import IconButton from '../common/IconButton.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { fetchCategories } from '../../services/categoryService.js';
import { fetchBrands } from '../../services/brandService.js';
import { fetchProducts } from '../../services/productService.js';

function HomeHeader({ authSession, navigate, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileBrandsOpen, setMobileBrandsOpen] = useState(false);

  // Dynamic database lists for premium navigation dropdowns
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Live search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const user = authSession?.user ?? null;
  const { setCartOpen, totalItemsCount, addToCart } = useCart();
  const { setWishlistOpen, wishlistItemsCount } = useWishlist();

  // Load active collections and designer brands directly from MongoDB
  useEffect(() => {
    fetchCategories({ limit: 12 })
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Failed to load nav categories:', err));

    fetchBrands()
      .then((data) => setBrands(data || []))
      .catch((err) => console.error('Failed to load nav brands:', err));
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(() => {
      fetchProducts({ search: searchQuery, limit: 5 })
        .then((data) => {
          setSearchResults(data.products || []);
        })
        .catch((err) => {
          console.error('Search failed:', err);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') {
      return `₹${val.toFixed(2)}`;
    }
    const valStr = String(val).trim();
    if (valStr.startsWith('₹')) return valStr;
    return `₹${valStr}`;
  };

  const handleQuickAdd = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product);
      setCartOpen(true);
      setIsSearchFocused(false);
      setSearchQuery('');
    } catch (err) {
      alert(err.message || 'Unable to add item');
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <aside className="bg-brand-navy px-4 py-2 text-center text-[10px] font-semibold tracking-[0.28em] text-white uppercase sm:text-[11px]">
        Free Shipping on Orders Over ₹5,000 | Limited Time Seasonal Sale
      </aside>

      <header className="sticky top-0 z-50 border-b border-brand-line/80 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={() => handleNavigate('/')}
              className="font-display text-3xl font-bold tracking-[-0.08em] text-brand-navy cursor-pointer"
            >
              LUXE
            </button>

            {/* ── Desktop Premium Interactive Nav Menu ─────────────────────── */}
            <nav className="hidden items-center gap-8 lg:flex">
              {/* Home Link */}
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted hover:text-brand-navy transition cursor-pointer py-2"
              >
                Home
              </button>

              {/* Categories Hover Dropdown */}
              <div className="relative group py-2">
                <button
                  type="button"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted hover:text-brand-navy transition cursor-pointer flex items-center gap-1.5"
                >
                  Categories
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-brand-muted group-hover:rotate-180 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-1 hidden w-[320px] rounded-3xl border border-brand-line bg-white/95 p-5 shadow-luxe backdrop-blur group-hover:block transition duration-300">
                  <div className="mb-3 border-b border-brand-line pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">Curated Collections</span>
                  </div>
                  {categories.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs text-brand-muted italic">No categories created yet.</p>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleNavigate('/admin')}
                          className="mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-navy hover:text-brand-accent transition cursor-pointer"
                        >
                          Create Category +
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => handleNavigate(`/category/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="flex flex-col items-start gap-1 rounded-xl bg-brand-soft p-3 hover:bg-brand-navy hover:text-white text-left transition group/item cursor-pointer w-full"
                        >
                          <span className="text-xs font-semibold text-brand-navy group-hover/item:text-white transition">{cat.name}</span>
                          <span className="text-[9px] text-brand-muted group-hover/item:text-white/60 transition truncate w-full">
                            {cat.description || 'Premium Curation'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Brands Hover Dropdown */}
              <div className="relative group py-2">
                <button
                  type="button"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted hover:text-brand-navy transition cursor-pointer flex items-center gap-1.5"
                >
                  Brands
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-brand-muted group-hover:rotate-180 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 mt-1 hidden w-[320px] rounded-3xl border border-brand-line bg-white/95 p-5 shadow-luxe backdrop-blur group-hover:block transition duration-300">
                  <div className="mb-3 border-b border-brand-line pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">Partner Houses</span>
                  </div>
                  {brands.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-xs text-brand-muted italic">No designer brands yet.</p>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleNavigate('/admin')}
                          className="mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-navy hover:text-brand-accent transition cursor-pointer"
                        >
                          Register Brand +
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                      {brands.map((br) => (
                        <button
                          key={br._id}
                          onClick={() => handleNavigate(`/brand/${br.slug || br.name.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="flex flex-col items-start gap-1 rounded-xl bg-brand-soft p-3 hover:bg-brand-navy hover:text-white text-left transition group/item cursor-pointer w-full"
                        >
                          <span className="text-xs font-semibold text-brand-navy group-hover/item:text-white transition">{br.name}</span>
                          <span className="text-[9px] text-brand-muted group-hover/item:text-white/60 transition truncate w-full">
                            {br.description || 'Designer Label'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Link */}
              <button
                type="button"
                onClick={() => {
                  const footer = document.querySelector('footer');
                  if (footer) {
                    footer.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted hover:text-brand-navy transition cursor-pointer py-2"
              >
                Contact
              </button>
            </nav>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {/* Desktop Live Search Container */}
            <div className="relative hidden lg:block">
              <label className="relative block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search collections..."
                  className="w-56 rounded-full border border-brand-line bg-brand-soft px-5 py-2.5 pr-12 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                  {isSearching ? (
                    <svg className="animate-spin h-4 w-4 text-brand-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Icon name="search" className="h-4 w-4" />
                  )}
                </span>
              </label>

              {/* Desktop Live Search Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[380px] rounded-[1.75rem] border border-brand-line bg-white/95 p-3 shadow-luxe backdrop-blur-md max-h-[380px] overflow-y-auto">
                  <div className="mb-2 border-b border-brand-line pb-1.5 px-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                      {isSearching ? 'Searching database...' : 'Matching Products'}
                    </span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-brand-muted font-medium italic">No products found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((product) => {
                        const primaryImg = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '';
                        const formattedProduct = {
                          ...product,
                          image: primaryImg || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop'
                        };
                        return (
                          <div
                            key={product._id}
                            onMouseDown={() => {
                              handleNavigate(`/category/${product.category?.slug || 'shop'}`);
                            }}
                            className="flex items-center gap-3 rounded-2xl p-2 hover:bg-brand-soft transition cursor-pointer text-left"
                          >
                            <div className="h-10 w-10 flex-shrink-0 rounded-xl overflow-hidden border border-brand-line bg-white">
                              <img
                                src={formattedProduct.image}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-brand-navy truncate">{product.title}</h4>
                              <p className="text-[9px] text-brand-muted truncate mt-0.5">{product.brand?.name || 'LUXE Collection'}</p>
                            </div>
                            <div className="text-right">
                              {product.discountPrice !== undefined && product.discountPrice !== null ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[11px] font-bold text-brand-accent">{formatPrice(product.discountPrice)}</span>
                                  <span className="text-[9px] text-brand-muted line-through">{formatPrice(product.price)}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-bold text-brand-navy">{formatPrice(product.price)}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onMouseDown={(e) => handleQuickAdd(e, formattedProduct)}
                              className="flex h-7.5 w-7.5 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy hover:bg-brand-accent text-white transition shadow-sm outline-none"
                              title="Quick add to bag"
                            >
                              <Icon name="bag" className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <IconButton
              label="Wishlist"
              icon="heart"
              badge={wishlistItemsCount > 0 ? wishlistItemsCount : false}
              onClick={() => setWishlistOpen(true)}
            />
            <IconButton
              label="Cart"
              icon="bag"
              badge={totalItemsCount > 0 ? totalItemsCount : false}
              onClick={() => setCartOpen(true)}
            />

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('/admin')}
                    className="rounded-full bg-brand-navy hover:bg-brand-accent px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition shadow-sm cursor-pointer"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile')}
                  className="group relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full overflow-hidden border border-brand-line bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:border-brand-accent focus:outline-none cursor-pointer"
                  title="View / Edit Profile"
                >
                  <Avatar user={user} size="sm" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate('/login')}
                  className="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted transition hover:text-brand-navy cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/register')}
                  className="rounded-full bg-brand-navy px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-brand-accent cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="rounded-full border border-brand-line p-2.5 text-brand-navy transition hover:bg-brand-card lg:hidden cursor-pointer"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="h-5 w-5" />
          </button>
        </div>

        {/* ── Mobile Menu Sidebar / Overlay ────────────────────────────── */}
        {mobileMenuOpen ? (
          <div className="border-t border-brand-line bg-white px-4 py-6 lg:hidden">
            <div className="mb-6 relative">
              <label className="relative block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full rounded-full border border-brand-line bg-brand-soft px-5 py-3 pr-12 text-sm text-brand-ink outline-none focus:border-brand-accent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted">
                  {isSearching ? (
                    <svg className="animate-spin h-4 w-4 text-brand-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Icon name="search" className="h-4 w-4" />
                  )}
                </span>
              </label>

              {/* Mobile Search Results */}
              {searchQuery.trim() && (
                <div className="mt-3 w-full rounded-2xl border border-brand-line bg-brand-card p-3 shadow-sm max-h-[300px] overflow-y-auto">
                  <div className="mb-2 border-b border-brand-line pb-1 px-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                      {isSearching ? 'Searching...' : 'Matching Products'}
                    </span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-brand-muted italic">No products found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchResults.map((product) => {
                        const primaryImg = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '';
                        const formattedProduct = {
                          ...product,
                          image: primaryImg || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop'
                        };
                        return (
                          <div
                            key={product._id}
                            onClick={() => {
                              handleNavigate(`/category/${product.category?.slug || 'shop'}`);
                            }}
                            className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-soft transition cursor-pointer text-left bg-white border border-brand-line/50"
                          >
                            <div className="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden border border-brand-line bg-white">
                              <img
                                src={formattedProduct.image}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[10px] font-bold text-brand-navy truncate">{product.title}</h4>
                              <p className="text-[8px] text-brand-muted truncate mt-0.5">{product.brand?.name || 'LUXE Collection'}</p>
                            </div>
                            <div className="text-right">
                              {product.discountPrice !== undefined && product.discountPrice !== null ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-brand-accent">{formatPrice(product.discountPrice)}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-brand-navy">{formatPrice(product.price)}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdd(e, formattedProduct)}
                              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-navy text-white hover:bg-brand-accent transition shadow-sm outline-none"
                            >
                              <Icon name="bag" className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion navigation links */}
            <nav className="flex flex-col gap-3">
              {/* Home */}
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-brand-navy py-2 cursor-pointer"
              >
                Home
              </button>

              {/* Categories Accordion */}
              <div className="border-t border-brand-line/50 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-navy py-2 cursor-pointer"
                >
                  <span>Categories</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-brand-muted transition-transform duration-300 ${mobileCategoriesOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {mobileCategoriesOpen && (
                  <div className="mt-2 pl-4 grid grid-cols-1 gap-1.5 transition-all duration-300">
                    {categories.length === 0 ? (
                      <p className="text-xs text-brand-muted italic py-1">No categories yet.</p>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => handleNavigate(`/category/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="flex flex-col items-start text-left py-2 px-3 rounded-lg bg-brand-soft hover:bg-brand-navy hover:text-white transition w-full cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-brand-navy">{cat.name}</span>
                          <span className="text-[10px] text-brand-muted truncate w-full">{cat.description || 'Premium Curation'}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Brands Accordion */}
              <div className="border-t border-brand-line/50 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileBrandsOpen(!mobileBrandsOpen)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-navy py-2 cursor-pointer"
                >
                  <span>Brands</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-brand-muted transition-transform duration-300 ${mobileBrandsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {mobileBrandsOpen && (
                  <div className="mt-2 pl-4 grid grid-cols-1 gap-1.5 transition-all duration-300">
                    {brands.length === 0 ? (
                      <p className="text-xs text-brand-muted italic py-1">No designer brands yet.</p>
                    ) : (
                      brands.map((br) => (
                        <button
                          key={br._id}
                          onClick={() => handleNavigate(`/brand/${br.slug || br.name.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="flex flex-col items-start text-left py-2 px-3 rounded-lg bg-brand-soft hover:bg-brand-navy hover:text-white transition w-full cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-brand-navy">{br.name}</span>
                          <span className="text-[10px] text-brand-muted truncate w-full">{br.description || 'Designer Label'}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="border-t border-brand-line/50 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    const footer = document.querySelector('footer');
                    if (footer) {
                      footer.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-navy py-2 cursor-pointer"
                >
                  Contact
                </button>
              </div>
            </nav>

            <div className="mt-6 border-t border-brand-line pt-6">
              {user ? (
                <div className="space-y-3 rounded-3xl border border-brand-line bg-brand-card px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/profile')}
                    className="flex items-center gap-3 w-full text-left group outline-none cursor-pointer"
                    title="View / Edit Profile"
                  >
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      <Avatar user={user} />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-navy group-hover:text-brand-accent transition">{user.name}</p>
                      <p className="text-sm text-brand-muted">{user.email}</p>
                    </div>
                  </button>
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('/admin')}
                      className="w-full rounded-full bg-brand-accent px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white mb-2 cursor-pointer"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleNavigate('/orders')}
                    className="w-full rounded-full bg-brand-navy px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white mb-2 cursor-pointer"
                  >
                    My Orders
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full rounded-full bg-brand-navy px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/login')}
                    className="flex-1 rounded-full border border-brand-line px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-navy cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/register')}
                    className="flex-1 rounded-full bg-brand-navy px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}

export default HomeHeader;
