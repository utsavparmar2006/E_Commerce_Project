import { useEffect, useState, useMemo } from 'react';
import { fetchBrands } from '../services/brandService.js';
import { fetchProducts } from '../services/productService.js';
import HomeHeader from '../components/layout/HomeHeader.jsx';
import Footer from '../components/layout/Footer.jsx';
import Icon from '../components/common/Icon.jsx';
import ProductCard from '../components/common/ProductCard.jsx';

function BrandPage({ brandSlug, authSession, navigate, onLogout }) {
  const [dbBrands, setDbBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Products Database States
  const [dbProducts, setDbProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filter local states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [maxPrice, setMaxPrice] = useState(1000);



  const getInitials = (name) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Fetch designer brands from DB to sync with Admin Panel additions
  useEffect(() => {
    fetchBrands()
      .then((data) => {
        setDbBrands(data);
      })
      .catch((err) => {
        console.error('Failed to load brands:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sync brand products from live Database
  useEffect(() => {
    if (!brandSlug) return;
    
    setLoadingProducts(true);
    const dbMatch = dbBrands.find(
      (br) => br.slug === brandSlug || br.name.toLowerCase().replace(/\s+/g, '-') === brandSlug
    );

    if (dbMatch) {
      fetchProducts({ brand: dbMatch._id, limit: 100 })
        .then((res) => {
          setDbProducts(res.products || []);
        })
        .catch((err) => {
          console.error('Failed to fetch brand products:', err);
          setDbProducts([]);
        })
        .finally(() => {
          setLoadingProducts(false);
        });
    } else {
      setDbProducts([]);
      setLoadingProducts(false);
    }
  }, [brandSlug, dbBrands]);

  // Determine active brand details dynamically
  const activeBrand = useMemo(() => {
    // Search database brands
    const dbMatch = dbBrands.find(
      (br) => br.slug === brandSlug || br.name.toLowerCase().replace(/\s+/g, '-') === brandSlug
    );
    if (dbMatch) {
      return {
        name: dbMatch.name,
        logo: dbMatch.logo,
        description: dbMatch.description || 'Exclusive luxury designer house collections.'
      };
    }

    // Fallback for custom slugs
    return {
      name: brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      logo: '',
      description: 'Exclusive collections from one of our selected luxury partners.'
    };
  }, [dbBrands, brandSlug]);

  // Filter products belonging to the active brand from dynamic Database
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
        brand: brandSlug,
        isDbProduct: true,
        original: p
      };
    });

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Max budget price filter
    items = items.filter((p) => p.price <= maxPrice);

    // Sorting
    if (sortBy === 'price-low') {
      items = [...items].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      items = [...items].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      items = [...items].sort((a, b) => b.rating - a.rating);
    }

    return items;
  }, [brandSlug, searchQuery, maxPrice, sortBy, dbProducts]);

  // Dynamically calculate limit price of products for the slider cap
  const dynamicLimitPrice = useMemo(() => {
    const maxVal = dbProducts.length > 0 ? Math.max(...dbProducts.map((p) => p.price), 100) : 1000;
    return Math.ceil(maxVal / 50) * 50; // round up to nearest 50
  }, [dbProducts]);

  // Sync maximum price whenever the brand slug changes
  useEffect(() => {
    setMaxPrice(dynamicLimitPrice);
  }, [dynamicLimitPrice]);

  return (
    <>
      <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />

      <main className="min-h-screen bg-brand-soft">
        {/* ── Premium Glassmorphism Brand Banner ──────────────────── */}
        <section className="relative overflow-hidden bg-brand-navy py-16 text-white sm:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-accent/25 via-brand-navy/60 to-brand-navy" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
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
              <span className="text-[10px] text-white/35">/</span>
              <span className="text-white/35">Brands</span>
              <span className="text-[10px] text-white/35">/</span>
              <span className="text-white">{activeBrand.name}</span>
            </nav>

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
              {/* Circular Medallion */}
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 p-1 shadow-luxe backdrop-blur-md">
                {activeBrand.logo ? (
                  <img
                    src={activeBrand.logo}
                    alt={activeBrand.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-accent text-white font-display text-2xl font-bold tracking-wider">
                    {getInitials(activeBrand.name)}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-accent">
                  Designer Fashion House
                </span>
                <h1 className="font-display text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl mt-1">
                  {activeBrand.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
                  {activeBrand.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filter & Shelf Display Grid ─────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* 1. Filter Control Panel */}
            <aside className="h-fit rounded-3xl border border-brand-line bg-white p-6 shadow-luxe lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-brand-line pb-4">
                <h3 className="font-display text-lg font-bold text-brand-navy">Filter Products</h3>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSortBy('recommended');
                    setMaxPrice(dynamicLimitPrice);
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-accent transition"
                >
                  Reset
                </button>
              </div>

              {/* Keyword Search */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                  Search Brand Shelf
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search model, item..."
                    className="w-full rounded-full border border-brand-line bg-brand-soft px-4 py-2.5 pl-10 text-xs text-brand-navy outline-none placeholder:text-brand-muted focus:border-brand-accent transition"
                  />
                  <span className="absolute left-3.5 top-3 text-brand-muted">
                    <Icon name="search" className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              {/* Sorting Mode */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-2 w-full rounded-full border border-brand-line bg-brand-soft px-4 py-2.5 text-xs text-brand-navy outline-none cursor-pointer focus:border-brand-accent transition"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Price Range Slider */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                    Price Budget
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
                  <span>Authorized Luxury Retailer</span>
                </div>
              </div>
            </aside>

            {/* 2. Brand Catalog Display */}
            <div>
              {/* Toolbar metadata */}
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-brand-muted">
                  Showing <span className="font-semibold text-brand-navy">{filteredProducts.length}</span> signature pieces
                </p>
                <div className="h-px flex-1 bg-brand-line hidden sm:block mx-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-muted">
                  {activeBrand.name} Premium Shelf
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
                /* Branded Premium Empty Brand Shelf */
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-brand-line bg-white py-24 px-6 text-center shadow-luxe">
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand-navy">
                    <Icon name="shield" className="h-10 w-10 text-brand-navy" />
                    <div className="absolute inset-0 rounded-full border border-brand-navy/20 animate-ping" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-brand-navy">Exquisite Creations Pending Curation</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted">
                    We are currently curating and cataloging the signature offerings from the design house of <span className="font-semibold text-brand-navy">{activeBrand.name}</span>. Explore our other luxury partners in the meantime.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-8 rounded-full bg-brand-navy px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-brand-accent shadow-luxe"
                  >
                    Return to Atelier
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Empty/No matches state when filters are active */
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-white py-20 px-4 text-center shadow-luxe">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-muted">
                    <Icon name="search" className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-brand-navy">No products match selection</h3>
                  <p className="mt-2 max-w-sm text-sm text-brand-muted">
                    Adjust price filters, keywords, or sorting configurations to find what you are looking for.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('recommended');
                      setMaxPrice(dynamicLimitPrice);
                    }}
                    className="mt-6 rounded-full bg-brand-navy px-6 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-brand-accent"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                /* Dynamic product grid */
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

export default BrandPage;
