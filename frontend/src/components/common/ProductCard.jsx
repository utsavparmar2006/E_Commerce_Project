import Icon from './Icon.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';

function ProductCard({ product, navigate }) {
  const rating = Number(product.rating) || 4.5;
  const reviewsCount = product.reviewsCount || 0;
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const productId = product._id || product.id;
  const isBookmarked = isInWishlist(productId);

  const handleProductClick = (e) => {
    if (!navigate) return;
    e.preventDefault();
    const slug = product.slug || product.original?.slug || product.id || product._id;
    if (slug) {
      navigate(`/product/${slug}`);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product).catch((err) => {
      alert(err.message || 'Unable to add item');
    });
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product).catch((err) => {
      alert(err.message || 'Unable to toggle wishlist');
    });
  };

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') {
      return `₹${val.toFixed(2)}`;
    }
    const valStr = String(val).trim();
    if (valStr.startsWith('₹')) {
      return valStr;
    }
    if (valStr.startsWith('$')) {
      return `₹${valStr.substring(1)}`;
    }
    return `₹${valStr}`;
  };

  // Resolve discount & regular pricing schemas gracefully
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice !== null;
  const discountedPrice = hasDiscount
    ? formatPrice(product.discountPrice)
    : product.oldPrice
      ? formatPrice(product.price)
      : '';
  const originalPrice = hasDiscount
    ? formatPrice(product.price)
    : product.oldPrice
      ? formatPrice(product.oldPrice)
      : formatPrice(product.price);

  return (
    <article className="product-card flex h-full flex-col rounded-3xl bg-white p-4 shadow-luxe border border-brand-line hover:border-brand-accent transition-all duration-300">
      <div className="group relative mb-4 overflow-hidden rounded-2xl bg-brand-card">
        {product.tag ? (
          <span
            className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${product.tagTone || 'bg-brand-navy text-white'}`}
          >
            {product.tag}
          </span>
        ) : null}
        
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isBookmarked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/92 p-2 transition duration-300 shadow-sm"
        >
          <Icon
            name="heart"
            className={`h-4 w-4 transition duration-300 ${
              isBookmarked ? 'text-rose-500 fill-current scale-110' : 'text-brand-navy hover:text-brand-accent'
            }`}
            filled={isBookmarked}
          />
        </button>
        
        <button
          type="button"
          onClick={handleProductClick}
          className="w-full aspect-square overflow-hidden cursor-pointer block text-left"
          aria-label={`View details for ${product.title}`}
        >
          <img
            src={product.image}
            alt={product.title}
            className="aspect-square w-full object-cover transition duration-750 group-hover:scale-105"
          />
        </button>
        
        <div className="quick-add-btn absolute inset-x-4 bottom-4">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-full bg-brand-navy px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-brand-accent"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <div className="mb-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Icon
              key={`${product.id || product.title}-star-${index}`}
              name="star"
              className={`h-3.5 w-3.5 ${index < Math.floor(rating) ? 'fill-current text-brand-accent' : 'text-brand-line'}`}
              filled={index < Math.floor(rating)}
            />
          ))}
          <span className="ml-1 text-xs text-brand-muted">({rating})</span>
        </div>
        
        <h3 className="font-display text-base font-semibold text-brand-navy line-clamp-1">
          <button
            type="button"
            onClick={handleProductClick}
            className="cursor-pointer hover:text-brand-accent transition text-left font-semibold"
          >
            {product.title}
          </button>
        </h3>
        
        {product.description ? (
          <p className="mt-1 text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        ) : null}
        
        <div className="mt-3 flex items-center justify-between">
          {hasDiscount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-brand-accent">{discountedPrice}</span>
              <span className="text-xs text-brand-muted line-through">{originalPrice}</span>
            </div>
          ) : (
            <span className="text-base font-semibold text-brand-navy">{originalPrice}</span>
          )}
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
            {reviewsCount} reviews
          </span>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
