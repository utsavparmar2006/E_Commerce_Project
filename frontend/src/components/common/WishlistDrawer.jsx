import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Icon from './Icon.jsx';

const getProductImage = (product) => {
  if (!product) return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop';
  if (product.image) return product.image;
  if (product.images && product.images.length > 0) {
    const primary = product.images.find(img => img && img.isPrimary);
    if (primary && primary.url) return primary.url;
    
    const firstImg = product.images[0];
    if (firstImg) {
      if (typeof firstImg === 'string') return firstImg;
      if (firstImg.url) return firstImg.url;
    }
  }
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop';
};

function WishlistDrawer() {
  const {
    wishlist,
    wishlistOpen,
    setWishlistOpen,
    removeFromWishlist,
    wishlistItemsCount,
    error: wishlistError
  } = useWishlist();

  const { addToCart, setCartOpen } = useCart();

  const handleMoveToCart = async (product) => {
    const productId = product._id || product.id;
    try {
      // Add product to shopping cart
      await addToCart(product, 1);
      // Remove it from wishlist as it has been migrated to shopping bag
      await removeFromWishlist(productId);
      // Close wishlist drawer and open cart drawer for maximum premium dynamic feel
      setWishlistOpen(false);
      setCartOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to move item to bag');
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-brand-navy/32 backdrop-blur-sm transition-opacity duration-300 ${
          wishlistOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setWishlistOpen(false)}
      />

      {/* Right sliding panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-white/96 shadow-2xl backdrop-blur-md border-l border-brand-line/60 flex flex-col transition-transform duration-500 ease-out ${
          wishlistOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-line">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-brand-navy tracking-tight">My Wishlist</h2>
            <span className="bg-brand-soft text-brand-navy border border-brand-line/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {wishlistItemsCount} {wishlistItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => setWishlistOpen(false)}
            aria-label="Close wishlist"
            className="rounded-full p-2 text-brand-muted hover:bg-brand-card hover:text-brand-navy transition duration-200"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Wishlist error indicator */}
        {wishlistError && (
          <div className="bg-rose-50 text-rose-600 text-xs px-6 py-2.5 border-b border-rose-100 font-semibold tracking-wide">
            {wishlistError}
          </div>
        )}

        {/* Scrollable Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {wishlist.products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-12">
              <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center text-brand-muted">
                <Icon name="heart" className="h-7 w-7 text-brand-muted" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-base font-semibold text-brand-navy">Your wishlist is empty</h3>
                <p className="text-xs text-brand-muted max-w-[240px] leading-relaxed">
                  Bookmark your favorite items from our exclusive curated collections to view them here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWishlistOpen(false)}
                className="rounded-full bg-brand-navy hover:bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-all duration-300"
              >
                Explore Products
              </button>
            </div>
          ) : (
            wishlist.products.map((product) => {
              const productId = product._id || product.id;
              const priceUnit = product.discountPrice !== undefined && product.discountPrice !== null ? product.discountPrice : product.price;

              return (
                <div
                  key={productId}
                  className="flex gap-4 p-3 rounded-2xl border border-brand-line/60 bg-white shadow-sm hover:shadow-md transition duration-200"
                >
                  {/* Product thumbnail */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-brand-soft border border-brand-line/40">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Product details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-semibold text-brand-navy truncate pr-1">
                          {product.title}
                        </h4>
                        
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(productId)}
                          aria-label="Remove item"
                          className="text-brand-muted hover:text-rose-600 rounded-full p-1 transition"
                        >
                          <Icon name="close" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">
                        SKU: {product.sku || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      {/* Pricing subtotal */}
                      <div className="text-left">
                        {product.discountPrice ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-brand-muted line-through">
                              ₹{product.price.toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-brand-accent">
                              ₹{product.discountPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-brand-navy">
                            ₹{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Add to Bag conversion */}
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(product)}
                        className="rounded-full bg-brand-navy hover:bg-brand-accent text-[9px] font-bold uppercase tracking-wider px-3.5 py-2 text-white transition-all duration-300 flex items-center gap-1.5"
                      >
                        <Icon name="bag" className="h-3 w-3" />
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default WishlistDrawer;
