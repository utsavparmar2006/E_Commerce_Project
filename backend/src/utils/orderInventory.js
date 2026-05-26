import Product from '../models/Product.js';

export const ensureProductsAvailable = async (items, session) => {
  for (const item of items) {
    const product = await Product.findById(item.product).session(session);

    if (!product || product.isDeleted || !product.isActive) {
      throw new Error(`Product not found or unavailable: ${item.title}`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient inventory stock for: ${product.title}. Only ${product.stock} left.`);
    }
  }
};

const updateInventory = async (items, quantityFactor, session) => {
  const options = session ? { session } : undefined;

  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: {
          stock: item.quantity * quantityFactor,
          sold: -item.quantity * quantityFactor,
        },
      },
      options
    );
  }
};

export const deductInventoryForItems = async (items, session) => {
  await updateInventory(items, -1, session);
};

export const restoreInventoryForItems = async (items, session) => {
  await updateInventory(items, 1, session);
};
