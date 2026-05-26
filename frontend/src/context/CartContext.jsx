import { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from '../services/cartService.js';

const CartContext = createContext(null);

export const CartProvider = ({ children, authSession }) => {
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = authSession?.accessToken ?? null;
  const isLoggedIn = !!token;

  // ── Sync or Initialize Cart State ──────────────────────────────────────────
  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      setError(null);

      if (isLoggedIn) {
        try {
          // Check if there is an anonymous guest cart to merge
          const guestCartRaw = localStorage.getItem('luxe_guest_cart');
          if (guestCartRaw) {
            const guestCart = JSON.parse(guestCartRaw);
            if (guestCart.items && guestCart.items.length > 0) {
              const failedItems = [];
              const failedReasons = [];

              // Merge each local guest item into MERN backend sequentially
              for (const item of guestCart.items) {
                try {
                  await addToCartApi(item.product._id || item.product.id, item.quantity, token);
                } catch (e) {
                  console.error('Failed to merge item to database:', e.message);
                  failedItems.push(item);
                  failedReasons.push(`${item.product.title} (${e.message})`);
                }
              }

              if (failedItems.length > 0) {
                // Retain failed items in local guest cart and set a clear descriptive alert
                const remainingGuestCart = {
                  items: failedItems,
                  totalPrice: failedItems.reduce((acc, item) => {
                    const p = item.product;
                    const priceUnit = p.discountPrice !== undefined && p.discountPrice !== null ? p.discountPrice : p.price;
                    return acc + priceUnit * item.quantity;
                  }, 0)
                };
                localStorage.setItem('luxe_guest_cart', JSON.stringify(remainingGuestCart));
                setError(`Could not merge some guest cart items: ${failedReasons.join(', ')}`);
              } else {
                // Clear the guest cart from localStorage after successful merge
                localStorage.removeItem('luxe_guest_cart');
              }
            }
          }

          // Fetch the final merged database cart
          const serverCart = await fetchCartApi(token);
          setCart(serverCart);
        } catch (err) {
          setError(err.message || 'Failed to sync database cart');
        }
      } else {
        // Logged out / Guest Mode: Load from localStorage
        try {
          const guestCartRaw = localStorage.getItem('luxe_guest_cart');
          if (guestCartRaw) {
            const parsed = JSON.parse(guestCartRaw);
            setCart(parsed);
          } else {
            setCart({ items: [], totalPrice: 0 });
          }
        } catch (err) {
          console.error('Failed to read guest cart from localStorage:', err);
          setCart({ items: [], totalPrice: 0 });
        }
      }
      setLoading(false);
    };

    initializeCart();
  }, [isLoggedIn, token]);

  // ── Guest Helper: Recalculate guest cart totals client-side ────────────────
  const recalculateGuestCart = (items) => {
    const totalPrice = items.reduce((acc, item) => {
      const p = item.product;
      const priceUnit = p.discountPrice !== undefined && p.discountPrice !== null ? p.discountPrice : p.price;
      return acc + priceUnit * item.quantity;
    }, 0);

    const updatedCart = { items, totalPrice };
    localStorage.setItem('luxe_guest_cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  // ── Add Item to Cart ────────────────────────────────────────────────────────
  const addToCart = async (product, quantity = 1) => {
    setError(null);
    if (!product) return;
    const productId = product._id || product.id;
    if (!productId) return;

    if (isLoggedIn) {
      try {
        setLoading(true);
        const res = await addToCartApi(productId, quantity, token);
        setCart(res.cart);
        setCartOpen(true); // Slide open the cart drawer for premium UX
        window.dispatchEvent(new CustomEvent('luxe-toast', {
          detail: { type: 'cart', text: `Added "${product.title || 'Product'}" to your cart successfully.` }
        }));
      } catch (err) {
        setError(err.message || 'Failed to add item to server cart');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest Mode: Local Manipulation
      const newItems = [...cart.items];
      const existingIdx = newItems.findIndex(item => (item.product._id || item.product.id) === productId);

      // Verify stock bounds in guest mode
      const currentQty = existingIdx > -1 ? newItems[existingIdx].quantity : 0;
      const targetQty = currentQty + quantity;

      if (product.stock !== undefined && product.stock < targetQty) {
        throw new Error(`Insufficient stock. Only ${product.stock} units available.`);
      }

      const itemPrice = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
      const itemDiscountPrice = product.discountPrice !== undefined && product.discountPrice !== null
        ? (typeof product.discountPrice === 'string' ? parseFloat(product.discountPrice.replace(/[^\d.]/g, '')) : product.discountPrice)
        : null;

      if (existingIdx > -1) {
        newItems[existingIdx].quantity = targetQty;
        newItems[existingIdx].subtotal = (itemDiscountPrice ?? itemPrice) * targetQty;
      } else {
        newItems.push({
          product: {
            _id: productId,
            id: productId,
            title: product.title,
            slug: product.slug,
            sku: product.sku,
            price: itemPrice,
            discountPrice: itemDiscountPrice,
            stock: product.stock,
            image: product.image || product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || ''
          },
          quantity,
          subtotal: (itemDiscountPrice ?? itemPrice) * quantity
        });
      }

      recalculateGuestCart(newItems);
      setCartOpen(true);
      window.dispatchEvent(new CustomEvent('luxe-toast', {
        detail: { type: 'cart', text: `Added "${product.title || 'Product'}" to your cart successfully.` }
      }));
    }
  };

  // ── Update Item Quantity ───────────────────────────────────────────────────
  const updateQuantity = async (productId, quantity) => {
    setError(null);
    if (quantity < 1) return;

    if (isLoggedIn) {
      try {
        setLoading(true);
        const res = await updateCartItemApi(productId, quantity, token);
        setCart(res.cart);
      } catch (err) {
        setError(err.message || 'Failed to update item quantity');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest Mode
      const newItems = [...cart.items];
      const idx = newItems.findIndex(item => (item.product._id || item.product.id) === productId);
      if (idx > -1) {
        const product = newItems[idx].product;
        if (product.stock !== undefined && product.stock < quantity) {
          throw new Error(`Only ${product.stock} units available.`);
        }
        newItems[idx].quantity = quantity;
        const itemPrice = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
        const itemDiscountPrice = product.discountPrice !== undefined && product.discountPrice !== null
          ? (typeof product.discountPrice === 'string' ? parseFloat(product.discountPrice.replace(/[^\d.]/g, '')) : product.discountPrice)
          : null;
        newItems[idx].subtotal = (itemDiscountPrice ?? itemPrice) * quantity;
        recalculateGuestCart(newItems);
      }
    }
  };

  // ── Remove Item from Cart ──────────────────────────────────────────────────
  const removeFromCart = async (productId) => {
    setError(null);

    if (isLoggedIn) {
      try {
        setLoading(true);
        const res = await removeCartItemApi(productId, token);
        setCart(res.cart);
      } catch (err) {
        setError(err.message || 'Failed to remove item');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest Mode
      const newItems = cart.items.filter(item => (item.product._id || item.product.id) !== productId);
      recalculateGuestCart(newItems);
    }
  };

  // ── Clear Entire Cart ──────────────────────────────────────────────────────
  const clearCart = async () => {
    setError(null);

    if (isLoggedIn) {
      try {
        setLoading(true);
        const res = await clearCartApi(token);
        setCart(res.cart);
      } catch (err) {
        setError(err.message || 'Failed to clear cart');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest Mode
      recalculateGuestCart([]);
    }
  };

  // Get unified active item counts
  const totalItemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        loading,
        error
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
};
