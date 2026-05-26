import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

/**
 * Utility function to get the populated wishlist for a user, filtering out any deleted products.
 */
const getPopulatedWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' }
    ]
  });

  if (!wishlist) {
    // Return empty products structure if no wishlist exists yet
    return { products: [] };
  }

  // Filter out any products that were deleted or are null
  const originalCount = wishlist.products.length;
  wishlist.products = wishlist.products.filter(p => p && !p.isDeleted);

  if (wishlist.products.length !== originalCount) {
    await wishlist.save();
  }

  const products = wishlist.products.map((p) => {
    return {
      _id: p._id,
      title: p.title,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      image: p.images?.find(img => img.isPrimary)?.url || p.images?.[0]?.url || '',
      category: p.category,
      brand: p.brand,
      isActive: p.isActive
    };
  });

  return {
    _id: wishlist._id,
    user: wishlist.user,
    products,
    updatedAt: wishlist.updatedAt
  };
};

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  try {
    const wishlistData = await getPopulatedWishlist(req.user._id);
    res.status(200).json(wishlistData);
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    // Verify catalog item exists and is active
    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive) {
      res.status(404);
      throw new Error('Product not found or currently unavailable');
    }

    // Retrieve or dynamically create wishlist for user
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    // Check if product is already in the wishlist
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const wishlistData = await getPopulatedWishlist(req.user._id);
    res.status(200).json({
      message: 'Item successfully added to wishlist',
      wishlist: wishlistData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      res.status(404);
      throw new Error('Wishlist not found');
    }

    // Remove the product from the array
    wishlist.products = wishlist.products.filter(
      (pId) => pId.toString() !== productId
    );
    await wishlist.save();

    const wishlistData = await getPopulatedWishlist(req.user._id);
    res.status(200).json({
      message: 'Item successfully removed from wishlist',
      wishlist: wishlistData,
    });
  } catch (error) {
    next(error);
  }
};
