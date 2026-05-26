import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Utility function to dynamically compute dynamic subtotals and populating cart items
 */
const getPopulatedCartWithTotals = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' }
    ]
  });

  if (!cart) {
    // Return empty payload if no cart has been recorded yet
    return { items: [], totalPrice: 0 };
  }

  // Filter out any cart items where the product might have been deleted in the catalog
  const originalCount = cart.items.length;
  cart.items = cart.items.filter(item => item.product && !item.product.isDeleted);
  
  if (cart.items.length !== originalCount) {
    await cart.save();
  }

  // Calculate pricing metrics dynamically on-the-fly to guarantee accuracy
  let totalPrice = 0;
  const items = cart.items.map((item) => {
    const p = item.product;
    const priceUnit = p.discountPrice !== undefined && p.discountPrice !== null ? p.discountPrice : p.price;
    const subtotal = priceUnit * item.quantity;
    totalPrice += subtotal;

    return {
      product: {
        _id: p._id,
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: p.stock,
        image: p.images?.find(img => img.isPrimary)?.url || p.images?.[0]?.url || '',
        category: p.category,
        brand: p.brand
      },
      quantity: item.quantity,
      subtotal,
    };
  });

  return {
    _id: cart._id,
    user: cart.user,
    items,
    totalPrice,
    updatedAt: cart.updatedAt
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    const cartData = await getPopulatedCartWithTotals(req.user._id);
    res.status(200).json(cartData);
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    if (qty < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1');
    }

    // Verify catalog item exists and is active
    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive) {
      res.status(404);
      throw new Error('Product not found or currently unavailable');
    }

    // Check inventory stock limits
    if (product.stock < qty) {
      res.status(400);
      throw new Error(`Insufficient stock. Only ${product.stock} units available.`);
    }

    // Retrieve or dynamically create cart for authenticated user
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Search for existing index
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;
      // Double check inventory bounds
      if (product.stock < newQty) {
        res.status(400);
        throw new Error(`Cannot add more. Only ${product.stock} units exist in stock, and you have ${cart.items[itemIndex].quantity} already in cart.`);
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();

    const cartData = await getPopulatedCartWithTotals(req.user._id);
    res.status(200).json({
      message: 'Item successfully added to cart',
      cart: cartData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (isNaN(qty) || qty < 1) {
      res.status(400);
      throw new Error('Valid quantity of 1 or more is required');
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      res.status(404);
      throw new Error('Product does not exist or has been deleted');
    }

    if (product.stock < qty) {
      res.status(400);
      throw new Error(`Cannot select ${qty} units. Only ${product.stock} units in stock.`);
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Shopping cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Product not found in your cart');
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    const cartData = await getPopulatedCartWithTotals(req.user._id);
    res.status(200).json({
      message: 'Cart quantity updated successfully',
      cart: cartData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Shopping cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const cartData = await getPopulatedCartWithTotals(req.user._id);
    res.status(200).json({
      message: 'Item removed from cart',
      cart: cartData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      message: 'Cart cleared successfully',
      cart: { items: [], totalPrice: 0 },
    });
  } catch (error) {
    next(error);
  }
};
