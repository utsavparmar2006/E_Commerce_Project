import { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
} from '../services/wishlistService.js';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children, authSession }) => {
  const [wishlist, setWishlist] = useState({ products: [] });
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = authSession?.accessToken ?? null;
  const isLoggedIn = !!token;

  // ── Sync or Initialize Wishlist State ────────────────────────────────────────
  useEffect(() => {
    const initializeWishlist = async () => {
      setLoading(true);
      setError(null);

      if (isLoggedIn) {
        try {
          // Check if there is an anonymous guest wishlist to merge
          const guestWishlistRaw = localStorage.getItem('luxe_guest_wishlist');
          if (guestWishlistRaw) {
            const guestWishlist = JSON.parse(guestWishlistRaw);
            if (guestWishlist.products && guestWishlist.products.length > 0) {
              // Merge each local guest product into MERN backend sequentially
              for (const product of guestWishlist.products) {
                try {
                  const pId = product._id || product.id;
                  await addToWishlistApi(pId, token);
                } catch (e) {
                  console.error('Failed to merge product to wishlist database:', e.message);
                }
              }
              // Clear the guest wishlist from localStorage after successful merge
              localStorage.removeItem('luxe_guest_wishlist');
            }
          }

          // Fetch the final merged database wishlist
          const serverWishlist = await fetchWishlistApi(token);
          setWishlist(serverWishlist);
        } catch (err) {
          setError(err.message || 'Failed to sync database wishlist');
        }
      } else {
        // Logged out / Guest Mode: Load from localStorage
        try {
          const guestWishlistRaw = localStorage.getItem('luxe_guest_wishlist');
          if (guestWishlistRaw) {
            const parsed = JSON.parse(guestWishlistRaw);
            setWishlist(parsed);
          } else {
            setWishlist({ products: [] });
          }
        } catch (err) {
          console.error('Failed to read guest wishlist from localStorage:', err);
          setWishlist({ products: [] });
        }
      }
      setLoading(false);
    };

    initializeWishlist();
  }, [isLoggedIn, token]);

  // Helper to check if a product is in wishlist
  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.products.some(p => (p._id || p.id) === productId);
  };

  // ── Toggle Item in Wishlist ──────────────────────────────────────────────────
  const toggleWishlist = async (product) => {
    setError(null);
    if (!product) return;
    const productId = product._id || product.id;
    if (!productId) return;

    const exists = isInWishlist(productId);

    if (isLoggedIn) {
      try {
        setLoading(true);
        if (exists) {
          const res = await removeFromWishlistApi(productId, token);
          setWishlist(res.wishlist);
          window.dispatchEvent(new CustomEvent('luxe-toast', {
            detail: { type: 'wishlist-remove', text: `Removed "${product.title || 'Product'}" from your wishlist.` }
          }));
        } else {
          const res = await addToWishlistApi(productId, token);
          setWishlist(res.wishlist);
          window.dispatchEvent(new CustomEvent('luxe-toast', {
            detail: { type: 'wishlist', text: `Added "${product.title || 'Product'}" to your curated wishlist successfully.` }
          }));
        }
      } catch (err) {
        setError(err.message || 'Failed to toggle wishlist item on server');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest Mode: Local localStorage manipulation
      let newProducts = [...wishlist.products];
      if (exists) {
        newProducts = newProducts.filter(p => (p._id || p.id) !== productId);
      } else {
        // Normalize product schema structure for consistent drawer display
        const itemPrice = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
        const itemDiscountPrice = product.discountPrice !== undefined && product.discountPrice !== null
          ? (typeof product.discountPrice === 'string' ? parseFloat(product.discountPrice.replace(/[^\d.]/g, '')) : product.discountPrice)
          : null;

        newProducts.push({
          _id: productId,
          id: productId,
          title: product.title,
          slug: product.slug,
          sku: product.sku,
          price: itemPrice,
          discountPrice: itemDiscountPrice,
          stock: product.stock,
          image: product.image || product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '',
          category: product.category,
          brand: product.brand
        });
      }

      const updatedWishlist = { products: newProducts };
      localStorage.setItem('luxe_guest_wishlist', JSON.stringify(updatedWishlist));
      setWishlist(updatedWishlist);
      window.dispatchEvent(new CustomEvent('luxe-toast', {
        detail: {
          type: exists ? 'wishlist-remove' : 'wishlist',
          text: exists
            ? `Removed "${product.title || 'Product'}" from your wishlist.`
            : `Added "${product.title || 'Product'}" to your curated wishlist successfully.`
        }
      }));
    }
  };

  // Direct removeFromWishlist helper
  const removeFromWishlist = async (productId) => {
    setError(null);
    if (!productId) return;

    const product = wishlist.products.find(p => (p._id || p.id) === productId);
    const title = product?.title || 'Product';

    if (isLoggedIn) {
      try {
        setLoading(true);
        const res = await removeFromWishlistApi(productId, token);
        setWishlist(res.wishlist);
        window.dispatchEvent(new CustomEvent('luxe-toast', {
          detail: { type: 'wishlist-remove', text: `Removed "${title}" from your wishlist.` }
        }));
      } catch (err) {
        setError(err.message || 'Failed to remove wishlist item');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest Mode
      const newProducts = wishlist.products.filter(p => (p._id || p.id) !== productId);
      const updatedWishlist = { products: newProducts };
      localStorage.setItem('luxe_guest_wishlist', JSON.stringify(updatedWishlist));
      setWishlist(updatedWishlist);
      window.dispatchEvent(new CustomEvent('luxe-toast', {
        detail: { type: 'wishlist-remove', text: `Removed "${title}" from your wishlist.` }
      }));
    }
  };

  const wishlistItemsCount = wishlist.products.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistOpen,
        setWishlistOpen,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistItemsCount,
        loading,
        error
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used inside a WishlistProvider');
  }
  return context;
};
