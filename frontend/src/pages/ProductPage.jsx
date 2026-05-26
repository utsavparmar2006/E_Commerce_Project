import { useEffect, useMemo, useState } from 'react';
import { fetchProductByIdOrSlug, fetchProducts } from '../services/productService.js';
import HomeHeader from '../components/layout/HomeHeader.jsx';
import Footer from '../components/layout/Footer.jsx';
import Icon from '../components/common/Icon.jsx';
import ProductCard from '../components/common/ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop';

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCategoryPath(product) {
  if (!product?.category) return '/';
  const slug = product.category.slug || product.category.name?.toLowerCase().replace(/\s+/g, '-');
  return slug ? `/category/${slug}` : '/';
}

function getBrandPath(product) {
  if (!product?.brand) return null;
  const slug = product.brand.slug || product.brand.name?.toLowerCase().replace(/\s+/g, '-');
  return slug ? `/brand/${slug}` : null;
}

function buildCardProduct(item) {
  const primaryImg = item.images?.find((img) => img.isPrimary)?.url || item.images?.[0]?.url || item.image || FALLBACK_IMAGE;

  return {
    id: item._id,
    _id: item._id,
    slug: item.slug,
    title: item.title,
    description: item.shortDescription || item.description,
    price: item.price,
    discountPrice: item.discountPrice,
    image: primaryImg,
    rating: item.averageRating || 4.5,
    reviewsCount: item.totalReviews || 0,
    original: item,
  };
}

function ProductPage({ productSlug, authSession, navigate, onLogout }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdding, setIsAdding] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (!productSlug) return;

    let isActive = true;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      setProduct(null);
      setActiveImageIndex(0);
      setQuantity(1);
      setActiveTab('overview');

      try {
        const data = await fetchProductByIdOrSlug(productSlug);
        if (!isActive) return;
        setProduct(data);
      } catch (err) {
        if (!isActive) return;
        setError(err.message || 'Product details could not be loaded.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [productSlug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productSlug]);

  useEffect(() => {
    if (!addedNotice) return undefined;
    const timer = window.setTimeout(() => setAddedNotice(false), 2800);
    return () => window.clearTimeout(timer);
  }, [addedNotice]);

  useEffect(() => {
    if (!product) return;

    let isActive = true;

    const loadRelated = async () => {
      setLoadingRelated(true);

      const categoryId = product.category?._id || product.category;
      const brandId = product.brand?._id || product.brand;

      const applyBrandFallback = async () => {
        if (!brandId) {
          if (isActive) {
            setRelatedProducts([]);
          }
          return;
        }

        try {
          const brandRes = await fetchProducts({ brand: brandId, limit: 8 });
          if (!isActive) return;
          setRelatedProducts(
            (brandRes.products || [])
              .filter((item) => item._id !== product._id)
              .slice(0, 4),
          );
        } catch {
          if (isActive) {
            setRelatedProducts([]);
          }
        }
      };

      try {
        if (!categoryId) {
          await applyBrandFallback();
          return;
        }

        const res = await fetchProducts({ category: categoryId, limit: 8 });
        if (!isActive) return;

        const filtered = (res.products || [])
          .filter((item) => item._id !== product._id)
          .slice(0, 4);

        if (filtered.length > 0) {
          setRelatedProducts(filtered);
          return;
        }

        await applyBrandFallback();
      } catch {
        await applyBrandFallback();
      } finally {
        if (isActive) {
          setLoadingRelated(false);
        }
      }
    };

    loadRelated();

    return () => {
      isActive = false;
    };
  }, [product]);

  const allImages = useMemo(() => {
    if (!product) return [];

    const normalized = (product.images || [])
      .map((img, index) => {
        if (!img) return null;
        if (typeof img === 'string') {
          return { _id: `img-${index}`, url: img, alt: product.title, isPrimary: index === 0 };
        }

        return {
          _id: img._id || `img-${index}`,
          url: img.url || FALLBACK_IMAGE,
          alt: img.alt || product.title,
          isPrimary: Boolean(img.isPrimary),
        };
      })
      .filter(Boolean);

    if (normalized.length === 0) {
      return [{ _id: 'fallback', url: FALLBACK_IMAGE, alt: product.title, isPrimary: true }];
    }

    return normalized;
  }, [product]);

  const activeImage = allImages[activeImageIndex] || allImages[0] || null;
  const displayPrice = product?.discountPrice ?? product?.price ?? 0;
  const hasDiscount = product?.discountPrice !== undefined && product?.discountPrice !== null && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const stockCount = Number(product?.stock) || 0;
  const outOfStock = stockCount <= 0;
  const lowStock = stockCount > 0 && stockCount <= 5;
  const wishlistActive = product ? isInWishlist(product._id) : false;

  const relatedCardProducts = useMemo(
    () => relatedProducts.map((item) => buildCardProduct(item)),
    [relatedProducts],
  );

  const handleAddToCart = async () => {
    if (!product || outOfStock) return;

    setIsAdding(true);
    setAddedNotice(false);

    try {
      await addToCart(
        {
          _id: product._id,
          id: product._id,
          slug: product.slug,
          title: product.title,
          sku: product.sku,
          price: product.price,
          discountPrice: product.discountPrice,
          stock: product.stock,
          image: activeImage?.url || FALLBACK_IMAGE,
          images: allImages,
          category: product.category,
          brand: product.brand,
        },
        quantity,
      );

      setAddedNotice(true);
    } catch (err) {
      alert(err.message || 'Unable to add item to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    try {
      await toggleWishlist({
        _id: product._id,
        id: product._id,
        slug: product.slug,
        title: product.title,
        sku: product.sku,
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        image: activeImage?.url || FALLBACK_IMAGE,
        images: allImages,
        category: product.category,
        brand: product.brand,
      });
    } catch (err) {
      alert(err.message || 'Unable to update wishlist.');
    }
  };

  if (loading) {
    return (
      <>
        <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />
        <main className="min-h-[calc(100vh-88px)] bg-brand-soft">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-10">
            <div className="animate-pulse rounded-[2rem] bg-white p-6 shadow-luxe">
              <div className="aspect-[4/4.8] rounded-[1.5rem] bg-brand-card" />
              <div className="mt-5 flex gap-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-20 w-20 rounded-2xl bg-brand-card" />
                ))}
              </div>
            </div>
            <div className="animate-pulse space-y-4 rounded-[2rem] bg-white p-8 shadow-luxe">
              <div className="h-3 w-32 rounded bg-brand-card" />
              <div className="h-12 w-3/4 rounded bg-brand-card" />
              <div className="h-6 w-40 rounded bg-brand-card" />
              <div className="h-24 rounded bg-brand-card" />
              <div className="h-14 rounded-full bg-brand-card" />
              <div className="h-40 rounded-[1.5rem] bg-brand-card" />
            </div>
          </div>
        </main>
        <Footer compact />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />
        <main className="flex min-h-[calc(100vh-88px)] items-center justify-center bg-brand-soft px-6">
          <div className="max-w-lg rounded-[2rem] border border-brand-line bg-white p-10 text-center shadow-luxe">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-card text-brand-navy">
              <Icon name="bag" className="h-8 w-8" />
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.06em] text-brand-navy">
              Product Not Found
            </h1>
            <p className="mt-4 text-sm leading-7 text-brand-muted">
              This product may have been removed or its link may have changed. You can head back to the storefront and continue exploring the catalog.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-8 rounded-full bg-brand-navy px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-brand-accent"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer compact />
      </>
    );
  }

  return (
    <>
      <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />

      <main className="min-h-screen bg-brand-soft">
        <section className="border-b border-brand-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
            <nav className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              <button type="button" onClick={() => navigate('/')} className="transition hover:text-brand-navy">
                Home
              </button>
              <span>/</span>
              {product.category ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(getCategoryPath(product))}
                    className="transition hover:text-brand-navy"
                  >
                    {product.category.name}
                  </button>
                  <span>/</span>
                </>
              ) : null}
              <span className="max-w-[220px] truncate text-brand-navy">{product.title}</span>
            </nav>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[2rem] border border-brand-line bg-white shadow-luxe">
                <div className="relative aspect-[4/4.75] bg-[linear-gradient(135deg,#f8f8fe_0%,#eef1fb_100%)] p-5 sm:p-8">
                  {hasDiscount ? (
                    <div className="absolute left-5 top-5 rounded-full bg-brand-accent px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      Save {discountPercent}%
                    </div>
                  ) : null}
                  <img
                    src={activeImage?.url || FALLBACK_IMAGE}
                    alt={activeImage?.alt || product.title}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {allImages.length > 1 ? (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {allImages.map((image, index) => (
                    <button
                      key={image._id}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-2xl border bg-white transition ${
                        index === activeImageIndex
                          ? 'border-brand-navy shadow-luxe'
                          : 'border-brand-line hover:border-brand-accent'
                      }`}
                    >
                      <div className="aspect-square bg-brand-card p-2">
                        <img
                          src={image.url}
                          alt={image.alt || `${product.title} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-brand-line bg-white p-6 shadow-luxe sm:p-8 xl:sticky xl:top-24">
                <div className="flex flex-wrap items-center gap-3">
                  {product.brand?.name ? (
                    <button
                      type="button"
                      onClick={() => {
                        const path = getBrandPath(product);
                        if (path) navigate(path);
                      }}
                      className="rounded-full border border-brand-line bg-brand-soft px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-navy transition hover:border-brand-accent hover:text-brand-accent"
                    >
                      {product.brand.name}
                    </button>
                  ) : null}
                  {product.category?.name ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                      {product.category.name}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-[-0.06em] text-brand-navy sm:text-5xl">
                  {product.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const isFilled = index < Math.round(product.averageRating || 0);
                      return (
                        <Icon
                          key={index}
                          name="star"
                          className={`h-4 w-4 ${isFilled ? 'text-brand-accent' : 'text-brand-line'}`}
                          filled={isFilled}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm font-semibold text-brand-navy">
                    {(product.averageRating || 4.5).toFixed(1)}
                  </span>
                  <span className="text-sm text-brand-muted">
                    {product.totalReviews || 0} reviews
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap items-end gap-4">
                  <span className="text-4xl font-bold tracking-tight text-brand-navy">
                    {formatCurrency(displayPrice)}
                  </span>
                  {hasDiscount ? (
                    <span className="pb-1 text-lg text-brand-muted line-through">
                      {formatCurrency(product.price)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      outOfStock
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : lowStock
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {outOfStock ? 'Out of Stock' : lowStock ? `Only ${stockCount} left` : 'In Stock'}
                  </span>
                  <span className="text-sm text-brand-muted">
                    SKU: <span className="font-semibold text-brand-navy">{product.sku || 'Not assigned'}</span>
                  </span>
                </div>

                <p className="mt-6 text-sm leading-7 text-brand-muted">
                  {product.shortDescription || product.description || 'Premium product details will appear here.'}
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-brand-line bg-brand-soft/65 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                        Quantity
                      </p>
                      <div className="mt-3 inline-flex items-center rounded-full border border-brand-line bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                          disabled={quantity <= 1 || outOfStock}
                          className="h-10 w-10 rounded-full text-lg font-semibold text-brand-navy transition hover:bg-brand-soft disabled:opacity-35"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-bold text-brand-navy">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((current) => Math.min(stockCount || 1, current + 1))}
                          disabled={outOfStock || quantity >= (stockCount || 1)}
                          className="h-10 w-10 rounded-full text-lg font-semibold text-brand-navy transition hover:bg-brand-soft disabled:opacity-35"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleWishlistToggle}
                      className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                        wishlistActive
                          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'border-brand-line bg-white text-brand-navy hover:border-brand-accent hover:text-brand-accent'
                      }`}
                    >
                      <Icon name="heart" className="h-4 w-4" filled={wishlistActive} />
                      {wishlistActive ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={outOfStock || isAdding}
                    className="mt-5 w-full rounded-full bg-brand-navy px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {outOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
                  </button>

                  {addedNotice ? (
                    <p className="mt-3 text-center text-[11px] font-semibold text-emerald-700">
                      Product added to your cart successfully.
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-brand-line bg-brand-soft/45 p-4">
                    <Icon name="truck" className="h-5 w-5 text-brand-navy" />
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy">
                      Fast Delivery
                    </p>
                    <p className="mt-1 text-xs leading-6 text-brand-muted">
                      Priority dispatch across your major service areas.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-line bg-brand-soft/45 p-4">
                    <Icon name="return" className="h-5 w-5 text-brand-navy" />
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy">
                      Easy Returns
                    </p>
                    <p className="mt-1 text-xs leading-6 text-brand-muted">
                      Smooth replacement and return support on eligible orders.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-line bg-brand-soft/45 p-4">
                    <Icon name="shield" className="h-5 w-5 text-brand-navy" />
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-navy">
                      Authenticity
                    </p>
                    <p className="mt-1 text-xs leading-6 text-brand-muted">
                      Carefully curated catalog with trusted product sourcing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_320px]">
            <div className="rounded-[2rem] border border-brand-line bg-white p-6 shadow-luxe sm:p-8">
              <div className="flex flex-wrap gap-4 border-b border-brand-line pb-4">
                {[
                  ['overview', 'Overview'],
                  ['details', 'Details'],
                  ['shipping', 'Shipping'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`border-b-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      activeTab === id
                        ? 'border-brand-navy text-brand-navy'
                        : 'border-transparent text-brand-muted hover:text-brand-navy'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' ? (
                <div className="pt-6 text-sm leading-8 text-brand-muted">
                  <p>{product.description || 'No full description has been added for this product yet.'}</p>
                </div>
              ) : null}

              {activeTab === 'details' ? (
                <div className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-brand-soft/55 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Product Title</p>
                      <p className="mt-2 text-sm font-semibold text-brand-navy">{product.title}</p>
                    </div>
                    <div className="rounded-2xl bg-brand-soft/55 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">SKU</p>
                      <p className="mt-2 text-sm font-semibold text-brand-navy">{product.sku || 'Not assigned'}</p>
                    </div>
                    <div className="rounded-2xl bg-brand-soft/55 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Category</p>
                      <p className="mt-2 text-sm font-semibold text-brand-navy">{product.category?.name || 'General catalog'}</p>
                    </div>
                    <div className="rounded-2xl bg-brand-soft/55 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Brand</p>
                      <p className="mt-2 text-sm font-semibold text-brand-navy">{product.brand?.name || 'LUXE'}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'shipping' ? (
                <div className="pt-6 space-y-4 text-sm leading-7 text-brand-muted">
                  <p>
                    Orders are processed after payment confirmation or order placement in the case of cash on delivery. Shipping timelines may vary by region, but we aim to keep dispatch quick and reliable.
                  </p>
                  <p>
                    If your item arrives with any issue, you can reach support through your account and order history for help with returns, replacements, or delivery concerns.
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="rounded-[2rem] border border-brand-line bg-white p-6 shadow-luxe">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                Order Summary
              </p>
              <div className="mt-5 space-y-3 text-sm text-brand-muted">
                <div className="flex items-center justify-between">
                  <span>Unit price</span>
                  <span className="font-semibold text-brand-navy">{formatCurrency(displayPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Selected quantity</span>
                  <span className="font-semibold text-brand-navy">{quantity}</span>
                </div>
                <div className="flex items-center justify-between border-t border-brand-line pt-3">
                  <span>Estimated total</span>
                  <span className="font-display text-xl font-bold text-brand-accent">
                    {formatCurrency(displayPrice * quantity)}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-t border-brand-line bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-accent">
                  More To Explore
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.05em] text-brand-navy sm:text-4xl">
                  Related Products
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-brand-muted">
                Similar catalog selections from the same category or brand, chosen to help the browsing flow feel complete.
              </p>
            </div>

            {loadingRelated ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse rounded-3xl border border-brand-line bg-brand-soft p-4">
                    <div className="aspect-square rounded-2xl bg-brand-card" />
                    <div className="mt-4 h-4 w-2/3 rounded bg-brand-card" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-brand-card" />
                  </div>
                ))}
              </div>
            ) : relatedCardProducts.length === 0 ? (
              <div className="mt-10 rounded-[2rem] border border-dashed border-brand-line bg-brand-soft/55 px-6 py-14 text-center">
                <p className="text-sm text-brand-muted">No related products are available in this collection yet.</p>
              </div>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {relatedCardProducts.map((item) => (
                  <ProductCard key={item._id} product={item} navigate={navigate} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ProductPage;
