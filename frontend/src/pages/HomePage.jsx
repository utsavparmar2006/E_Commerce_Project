import { useEffect, useState } from 'react';
import { features, testimonials } from '../data/homeContent.js';
import { fetchCategories } from '../services/categoryService.js';
import { fetchBrands } from '../services/brandService.js';
import { fetchProducts } from '../services/productService.js';
import Footer from '../components/layout/Footer.jsx';
import HomeHeader from '../components/layout/HomeHeader.jsx';
import Icon from '../components/common/Icon.jsx';
import SectionHeader from '../components/common/SectionHeader.jsx';
import ProductCard from '../components/common/ProductCard.jsx';

function HomePage({ authSession, navigate, onLogout }) {
  const [dbCategories, setDbCategories] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getInitials = (name) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCategories().catch(err => {
        console.error('Failed to fetch categories:', err);
        return [];
      }),
      fetchBrands().catch(err => {
        console.error('Failed to fetch brands:', err);
        return [];
      }),
      fetchProducts({ limit: 4, isFeatured: true }).catch(err => {
        console.error('Failed to fetch products:', err);
        return { products: [] };
      })
    ]).then(([categoriesData, brandsData, productsData]) => {
      if (!active) return;
      setDbCategories(categoriesData);
      setDbBrands(brandsData);

      const items = (productsData.products || []).map((p) => {
        const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url || '';
        return {
          id: p._id,
          _id: p._id,
          slug: p.slug,
          title: p.title,
          description: p.description,
          price: p.price,
          discountPrice: p.discountPrice,
          image: primaryImg || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
          rating: p.averageRating || 4.5,
          reviewsCount: p.totalReviews || 0,
          original: p
        };
      });
      setDbProducts(items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const displayedCategories = dbCategories;
  const displayedBrands = dbBrands;

  return (
    <>
      <HomeHeader authSession={authSession} navigate={navigate} onLogout={onLogout} />

      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="mx-auto grid min-h-[760px] max-w-7xl lg:grid-cols-[1.05fr_1fr]">
            <div className="flex items-center px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
              <div className="max-w-xl">
                <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-[-0.08em] text-brand-navy sm:text-6xl lg:text-7xl">
                  Elevate Your Everyday Style
                </h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-brand-muted sm:text-lg">
                  Discover the latest arrivals in luxury fashion and lifestyle. Meticulously curated collections designed
                  for the modern connoisseur.
                </p>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={() => {
                      const el = document.getElementById('best-sellers');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-full bg-brand-navy px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-brand-accent"
                  >
                    Shop Now
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById('shop-by-category');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-full border border-brand-line bg-white px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    Explore Categories
                  </button>
                </div>
              </div>
            </div>

            <div className="relative min-h-[440px] overflow-hidden bg-[#dfe4f6]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSl-iuTDvLldxju_UW1eazn9bVAuTDHOLhLG4hbMbkFj2ZnX_B89U_5vRQNYzy_gdf_YV31_PzG54WDMrz0yl03Vc3JPjeQEB4_D4cTrcYGxZ-1WHxKYulrwHlhGGuGL_pIuv0QTYEEd_Cy03Psnj9bX9AKQH38KhCYt9eUN0NfDMZZl-AvkqzPsJChVfaZ7Upj6-pnbanMUFf8lR5br2X7b1qp3saDYDehAs4lhm5aePoNaps9fWLOX7stYhpP4MqKAze6UqDIBI"
                alt="Premium lifestyle hero collage"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </section>

        <section id="shop-by-category" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <SectionHeader
            title="Shop by Category"
            description="Find your perfect fit across our refined selections."
            centered={false}
          />
          {displayedCategories.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-white py-12 px-4 text-center shadow-luxe">
              <span className="text-3xl mb-3">🏷️</span>
              <p className="font-display text-sm font-semibold text-brand-navy">No Categories Registered</p>
              <p className="text-xs text-brand-muted mt-1">Please populate categories in the admin dashboard to display them here.</p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {displayedCategories.map((category) => {
                const categorySlug = category.slug || (category.name || category.title || '').toLowerCase().replace(/\s+/g, '-');
                return (
                  <a
                    key={category._id || category.title}
                    href={`/category/${categorySlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/category/${categorySlug}`);
                    }}
                    className="group relative aspect-[0.72] overflow-hidden rounded-2xl bg-brand-card shadow-luxe"
                  >
                    <img
                      src={category.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop'}
                      alt={category.name || category.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/20 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4">
                      <p className="font-display text-lg font-semibold text-white">{category.name || category.title}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">Shop Now</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section id="best-sellers" className="bg-[#f3f4fb] py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionHeader
              title="The Best Sellers"
              description="Explore the pieces our community is currently loving."
              centered
            />
            {dbProducts.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-white py-16 px-4 text-center shadow-luxe max-w-2xl mx-auto">
                <span className="text-3xl mb-3">🛍️</span>
                <p className="font-display text-lg font-semibold text-brand-navy">Best Sellers Shelf is Empty</p>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Currently restocking our featured products. Add products in the admin panel and flag them as featured to display them here!
                </p>
              </div>
            ) : (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {dbProducts.map((product) => (
                  <ProductCard key={product.id || product._id || product.title} product={product} navigate={navigate} />
                ))}
              </div>
            )}
            {dbProducts.length > 0 && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => navigate('/shop')}
                  className="border-b border-brand-navy pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy transition hover:border-brand-accent hover:text-brand-accent"
                >
                  View All Best Sellers
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border-y border-brand-line py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <SectionHeader
              title="Shop by Designer"
              description="Curated capsules from the world's most prestigious luxury houses."
              centered
            />
            {displayedBrands.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-white py-12 px-4 text-center shadow-luxe max-w-2xl mx-auto">
                <span className="text-3xl mb-3">✨</span>
                <p className="font-display text-sm font-semibold text-brand-navy">No Designers Registered</p>
                <p className="text-xs text-brand-muted mt-1">Populate designer brands in the admin dashboard to showcase them here.</p>
              </div>
            ) : (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {displayedBrands.map((brand) => {
                  const brandSlug = brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <a
                      key={brand._id || brand.name}
                      href={`/brand/${brandSlug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/brand/${brandSlug}`);
                      }}
                      className="group flex flex-col items-center gap-4 focus:outline-none"
                    >
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-brand-line bg-brand-soft shadow-luxe p-1 transition-all duration-300 group-hover:scale-105 group-hover:border-brand-accent group-hover:shadow-xl">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-navy text-white font-display text-xl font-bold tracking-wider">
                            {getInitials(brand.name)}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-display text-sm font-semibold tracking-wide text-brand-navy group-hover:text-brand-accent transition">
                        {brand.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-navy">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAmtterLbXqUVV-rLiEqChxAZXJkkpbUMpZXFMHCLExJCvCk1XJ7IptOKav1FpisHUsj13BbHRyfoCm5pku8AxY_TCChaejARRR6h-yt_6E5sAIwGjICoM3pvLC7Dm-jqX2m8gprWytwnSc6leO7qoEOYnFeQpNEoLk9zxq_YQ36q-un38a-e5sTtxZOzCzfnyOEV73BMqrPwmif9w0udynz85VsScHRIMtTjJvizpVcIU6P0wgiYQ1AqOEE7X0wTp5KXFE4V8eIs"
              alt="Summer essentials collection"
              className="absolute inset-0 h-full w-full object-cover opacity-65"
            />
            <div className="relative px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
              <div className="max-w-xl text-white">
                <h2 className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">Summer Essentials Collection</h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/88 sm:text-base">
                  Crafted for the sun-seekers and the dreamers. Our latest collection blends coastal effortless with
                  metropolitan precision.
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById('best-sellers');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-8 rounded-full bg-white px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy transition hover:bg-brand-accent hover:text-white"
                >
                  Discover the Collection
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl border-b border-brand-line px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-[1.75rem] border border-brand-line bg-white p-8 text-center shadow-luxe">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-card text-brand-navy">
                  <Icon name={feature.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-brand-navy">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-brand-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <SectionHeader title="Customer Stories" centered />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="relative rounded-[2rem] bg-[#f0f2fd] p-8 shadow-luxe">
                <div className="flex items-center gap-1 text-brand-accent">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon key={`${testimonial.name}-rating-${index}`} name="star" className="h-3.5 w-3.5 fill-current" filled />
                  ))}
                </div>
                <div className="absolute right-6 top-6 text-brand-accent/35">
                  <Icon name="quote" className="h-10 w-10" />
                </div>
                <p className="mt-6 text-sm leading-7 text-brand-muted">{testimonial.quote}</p>
                <div className="mt-8 flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-brand-navy">{testimonial.name}</p>
                    <p className="text-xs text-brand-muted">{testimonial.label}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-10 lg:pb-20">
          <div className="newsletter-grid relative overflow-hidden rounded-[2rem] bg-brand-navy px-6 py-16 text-center text-white sm:px-10 lg:px-16 lg:py-20">
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">Join the LUXE Club</h2>
              <p className="mt-5 text-sm leading-7 text-white/82 sm:text-base">
                Subscribe to receive exclusive early access to collections, private event invitations, and a first look
                at seasonal sales.
              </p>
              <form className="mx-auto mt-9 flex max-w-xl flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm text-white outline-none placeholder:text-white/55 focus:border-white/35"
                />
                <button className="rounded-full bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-navy transition hover:bg-brand-accent hover:text-white">
                  Subscribe
                </button>
              </form>
              <p className="mt-5 text-xs text-white/50">By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
