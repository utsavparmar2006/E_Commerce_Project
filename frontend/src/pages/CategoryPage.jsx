import { useEffect, useState, useMemo } from 'react';
import { fetchCategories } from '../services/categoryService.js';
import { fetchProducts } from '../services/productService.js';
import HomeHeader from '../components/layout/HomeHeader.jsx';
import Footer from '../components/layout/Footer.jsx';
import Icon from '../components/common/Icon.jsx';
import ProductCard from '../components/common/ProductCard.jsx';


function CategoryPage({ categorySlug, authSession, navigate, onLogout }) {
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Products Database States
  const [dbProducts, setDbProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filter local states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [maxPrice, setMaxPrice] = useState(1000);

  // Load categories to display correct banner and category metadata dynamically
  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setDbCategories(data);
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sync category products from live Database
  useEffect(() => {
    if (!categorySlug) return;
    
    setLoadingProducts(true);
    const dbMatch = dbCategories.find(
      (cat) => cat.slug === categorySlug || cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
    );

    if (dbMatch) {
      fetchProducts({ category: dbMatch._id, limit: 100 })
        .then((res) => {
          setDbProducts(res.products || []);
        })
        .catch((err) => {
          console.error('Failed to fetch category products:', err);
          setDbProducts([]);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    } else {
      setDbProducts([]);
      setLoadingProducts(false);
    }
  }, [categorySlug, dbCategories]);

  // Find active category detail from Database with clean dynamic fallback
  const activeCategory = useMemo(() => {
    const dbMatch = dbCategories.find(
      (cat) => cat.slug === categorySlug || cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
    );
    if (dbMatch) {
      return {
        name: dbMatch.name,
        image: dbMatch.image,
        description: dbMatch.description || 'Premium curated collection'
      };
    }

    return {
      name: categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
      description: 'Exclusive and authentic lifestyle designs.'
    };
  }, [dbCategories, categorySlug]);

  // Find products matching the category
  const filteredProducts = useMemo(() => {
    let items = dbProducts.map((p) => {
      const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || '';
      return {
        id: p._id,
        title: p.title,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        image: primaryImg || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
        rating: p.averageRating || 4.5,
        reviewsCount: p.totalReviews || 0,
        category: categorySlug,
        isDbProduct: true,
        original: p
      };
    });

    // Apply Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Apply Price filter
    items = items.filter((p) => p.price <= maxPrice);

    // Apply Sorting
    if (sortBy === 'price-low') {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      items = [...items].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      items = [...items].sort((a, b) => b.rating - a.rating);
    }

    return items;
  }, [categorySlug, searchQuery, maxPrice, sortBy, dbProducts]);

  // Determine highest price of current products to dynamically cap range slider
  const dynamicLimitPrice = useMemo(() => {
    const maxVal = dbProducts.length > 0 ? Math.max(...dbProducts.map((p) => p.price), 100) : 1000;
    return Math.ceil(maxVal / 50) * 50; // round up to nearest 50
  }, [dbProducts]);

  // Sync range slider max when category slug changes
  useEffect(() => {
    setMaxPrice(dynamicLimitPrice);
  }, [dynamicLimitPrice]);

  return (
    <>
      <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />

      <main className="min-h-screen bg-brand-soft">
        {/* ── Editorial Header Banner ──────────────────────────────── */}
        <section className="relative h-[340px] w-full overflow-hidden bg-brand-navy">
          <img
            src={activeCategory.image}
            alt={activeCategory.name}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/10 via-brand-navy/40 to-brand-navy/80" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-10">
              {/* Breadcrumb */}
              <nav className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                  className="hover:text-white transition"
                >
                  Home
                </a>
                <span className="text-[10px] text-white/40">/</span>
                <span className="text-white/40">Categories</span>
                <span className="text-[10px] text-white/40">/</span>
                <span className="text-white">{activeCategory.name}</span>
              </nav>

              <h1 className="font-display text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                {activeCategory.name}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                {activeCategory.description}
              </p>
            </div>
          </div>
        </section>

        {/* ── Filters & Product Showcase Grid ─────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* 1. Sleek Floating Sidebar Filter Panel */}
            <aside className="h-fit rounded-3xl border border-brand-line bg-white p-6 shadow-luxe lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-brand-line pb-4">
                <h3 className="font-display text-lg font-bold text-brand-navy">Filter & Refine</h3>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSortBy('recommended');
                    setMaxPrice(dynamicLimitPrice);
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-accent transition"
                >
                  Reset All
                </button>
              </div>

              {/* Live Search */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                  Search keyword
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in this shelf..."
                    className="w-full rounded-full border border-brand-line bg-brand-soft px-4 py-2.5 pl-10 text-xs text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-accent transition"
                  />
                  <span className="absolute left-3.5 top-3 text-brand-muted">
                    <Icon name="search" className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-2 w-full rounded-full border border-brand-line bg-brand-soft px-4 py-2.5 text-xs text-brand-navy outline-none cursor-pointer focus:border-brand-accent transition"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Customer Rating</option>
                </select>
              </div>

              {/* Price Slider */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                    Max Budget
                  </label>
                  <span className="text-xs font-semibold text-brand-navy">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={dynamicLimitPrice}
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="mt-3 w-full h-1 bg-brand-line rounded-lg appearance-none cursor-pointer accent-brand-navy"
                />
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-brand-muted">
                  <span>₹0</span>
                  <span>₹{dynamicLimitPrice}</span>
                </div>
              </div>

              <div className="mt-8 border-t border-brand-line pt-6">
                <div className="flex items-center gap-3 text-[11px] font-semibold text-brand-muted">
                  <Icon name="shield" className="h-4 w-4 text-[#12b76a]" />
                  <span>100% Authentic Quality</span>
                </div>
              </div>
            </aside>

            {/* 2. Products Showcase Section */}
            <div>
              {/* Toolbar metadata */}
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-brand-muted">
                  Showing <span className="font-semibold text-brand-navy">{filteredProducts.length}</span> luxury pieces
                </p>
                <div className="h-px flex-1 bg-brand-line hidden sm:block mx-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-muted">
                  LUXE Curation Shelf
                </span>
              </div>

              {loadingProducts ? (
                /* Premium Skeleton Loader */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="animate-pulse rounded-3xl border border-brand-line bg-white p-4 shadow-luxe">
                      <div className="aspect-[4/5] w-full rounded-2xl bg-brand-soft animate-pulse" />
                      <div className="mt-4 h-4 w-2/3 rounded bg-brand-soft" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-brand-soft" />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="h-4 w-1/4 rounded bg-brand-soft" />
                        <div className="h-8 w-8 rounded-full bg-brand-soft" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dbProducts.length === 0 ? (
                /* Branded Premium Empty Category Shelf */
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-brand-line bg-white py-24 px-6 text-center shadow-luxe">
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-navy">
                    <Icon name="tag" className="h-10 w-10 text-brand-navy" />
                    <div className="absolute inset-0 rounded-full border border-brand-navy/20 animate-ping" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-brand-navy">Exquisite Collection Coming Soon</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted">
                    Our curators are currently selecting and handcrafting signature designs for the <span className="font-semibold text-brand-navy">{activeCategory.name}</span> collection. Check back shortly for the grand showcase.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-8 rounded-full bg-brand-navy px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-brand-accent shadow-luxe"
                  >
                    Explore Curated Home
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Empty/No matches state when filters are active */
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-white py-20 px-4 text-center shadow-luxe">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-muted">
                    <Icon name="search" className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-brand-navy">No products matched filters</h3>
                  <p className="mt-2 max-w-sm text-sm text-brand-muted">
                    Try loosening your keyword search, raising your price budget, or changing sorting modes.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('recommended');
                      setMaxPrice(dynamicLimitPrice);
                    }}
                    className="mt-6 rounded-full bg-brand-navy px-6 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-brand-accent"
                  >
                    Clear Filter Selection
                  </button>
                </div>
              ) : (
                /* Grid of Product Cards */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} navigate={navigate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default CategoryPage;
