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

function CartDrawer({ navigate, authSession }) {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    totalItemsCount,
    error: cartError
  } = useCart();

  // Standard shipping metrics
  const shippingThreshold = 5000;
  const shippingFee = 150;
  const subtotal = cart.totalPrice || 0;
  
  const isFreeShipping = subtotal >= shippingThreshold;
  const amountNeededForFreeShipping = shippingThreshold - subtotal;
  const shippingProgressPercentage = Math.min((subtotal / shippingThreshold) * 100, 100);

  const finalShippingPrice = subtotal > 0 && !isFreeShipping ? shippingFee : 0;
  const grandTotal = subtotal + finalShippingPrice;

  const handleIncrement = (item) => {
    const productId = item.product._id || item.product.id;
    updateQuantity(productId, item.quantity + 1).catch(err => {
      alert(err.message || 'Cannot add more units');
    });
  };

  const handleDecrement = (item) => {
    const productId = item.product._id || item.product.id;
    if (item.quantity <= 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, item.quantity - 1).catch(err => {
        alert(err.message || 'Failed to update quantity');
      });
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-brand-navy/32 backdrop-blur-sm transition-opacity duration-300 ${
          cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCartOpen(false)}
      />

      {/* Right sliding panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-white/96 shadow-2xl backdrop-blur-md border-l border-brand-line/60 flex flex-col transition-transform duration-500 ease-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-line">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-brand-navy tracking-tight">Shopping Bag</h2>
            <span className="bg-brand-soft text-brand-navy border border-brand-line/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            className="rounded-full p-2 text-brand-muted hover:bg-brand-card hover:text-brand-navy transition duration-200"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Cart error indicator */}
        {cartError && (
          <div className="bg-rose-50 text-rose-600 text-xs px-6 py-2.5 border-b border-rose-100 font-semibold tracking-wide">
            {cartError}
          </div>
        )}

        {/* Free Shipping Progress Indicator */}
        {subtotal > 0 && (
          <div className="px-6 py-4 bg-brand-soft/60 border-b border-brand-line/60">
            {isFreeShipping ? (
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">✓</span>
                Congratulations! You qualify for Free Express Shipping
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-brand-muted font-medium">
                  Add <span className="font-bold text-brand-accent">₹{amountNeededForFreeShipping.toFixed(2)}</span> more for <span className="font-semibold text-brand-navy">FREE Express Shipping</span>
                </p>
                <div className="h-1.5 w-full bg-brand-line/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-accent transition-all duration-500 ease-out"
                    style={{ width: `${shippingProgressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-12">
              <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center text-brand-muted">
                <Icon name="bag" className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-base font-semibold text-brand-navy">Your bag is empty</h3>
                <p className="text-xs text-brand-muted max-w-[240px] leading-relaxed">
                  Sign in or explore our premium collections to select your curated wardrobe items.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-full bg-brand-navy hover:bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-all duration-300"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.items.map((item) => {
              const product = item.product;
              const priceUnit = product.discountPrice !== undefined && product.discountPrice !== null ? product.discountPrice : product.price;
              const productId = product._id || product.id;

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
                          onClick={() => removeFromCart(productId)}
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

                    <div className="flex items-end justify-between mt-2">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-full border border-brand-line bg-brand-soft p-1">
                        <button
                          type="button"
                          onClick={() => handleDecrement(item)}
                          className="h-6 w-6 rounded-full flex items-center justify-center text-brand-navy hover:bg-white hover:shadow-sm transition"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold px-3 text-brand-navy min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(item)}
                          className="h-6 w-6 rounded-full flex items-center justify-center text-brand-navy hover:bg-white hover:shadow-sm transition"
                        >
                          +
                        </button>
                      </div>

                      {/* Pricing subtotal */}
                      <div className="text-right">
                        {product.discountPrice ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-brand-muted line-through">
                              ₹{(product.price * item.quantity).toFixed(2)}
                            </span>
                            <span className="text-sm font-bold text-brand-accent">
                              ₹{item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-brand-navy">
                            ₹{item.subtotal.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic checkout summary footer panel */}
        {cart.items.length > 0 && (
          <div className="border-t border-brand-line bg-brand-soft/40 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-navy">₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Shipping</span>
                <span>
                  {finalShippingPrice === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">Free</span>
                  ) : (
                    <span className="font-semibold text-brand-navy">₹{finalShippingPrice.toFixed(2)}</span>
                  )}
                </span>
              </div>

              <div className="border-t border-brand-line/60 pt-2 flex justify-between text-sm font-bold text-brand-navy">
                <span>Grand Total</span>
                <span className="text-base text-brand-accent font-display">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!authSession) {
                  alert('Please sign in to complete your checkout.');
                  setCartOpen(false);
                  navigate('/login');
                } else {
                  setCartOpen(false);
                  navigate('/checkout');
                }
              }}
              className="w-full rounded-full bg-brand-navy hover:bg-brand-accent py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-all duration-300 shadow-luxe hover:scale-[1.01]"
            >
              Secure Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;
