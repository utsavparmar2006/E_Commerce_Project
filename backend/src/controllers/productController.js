import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import {
  buildProductQuery,
  generateSlug,
  getProductPagination,
  getProductSortOptions,
} from '../utils/productHelpers.js';

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = async (req, res, next) => {
  const {
    category,
    brand,
    title,
    slug,
    shortDescription,
    description,
    sku,
    price,
    discountPrice,
    stock,
    images,
    isFeatured,
    isActive,
  } = req.body;

  try {
    if (!category) {
      res.status(400);
      throw new Error('Please select a category');
    }
    if (!title) {
      res.status(400);
      throw new Error('Please provide a product title');
    }
    if (!description) {
      res.status(400);
      throw new Error('Please provide a product description');
    }
    if (price === undefined || price === null) {
      res.status(400);
      throw new Error('Please provide a product price');
    }

    // Check if category exists
    const categoryExists = await Category.findOne({ _id: category, isDeleted: false });
    if (!categoryExists) {
      res.status(400);
      throw new Error('Selected category is invalid or has been deleted');
    }

    // Check if brand exists (if provided)
    if (brand) {
      const brandExists = await Brand.findOne({ _id: brand, isDeleted: false });
      if (!brandExists) {
        res.status(400);
        throw new Error('Selected brand is invalid or has been deleted');
      }
    }

    const finalSlug = slug ? generateSlug(slug) : generateSlug(title);

    // Check duplicate slug
    const duplicateSlug = await Product.findOne({ slug: finalSlug, isDeleted: false });
    if (duplicateSlug) {
      res.status(400);
      throw new Error('A product with this title or slug already exists');
    }

    // Check duplicate SKU
    if (sku) {
      const duplicateSKU = await Product.findOne({ sku: sku.trim(), isDeleted: false });
      if (duplicateSKU) {
        res.status(400);
        throw new Error('A product with this SKU code already exists');
      }
    }

    const product = await Product.create({
      category,
      brand: brand || null,
      title: title.trim(),
      slug: finalSlug,
      shortDescription: shortDescription ? shortDescription.trim() : '',
      description: description.trim(),
      sku: sku ? sku.trim() : undefined,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: stock !== undefined ? Number(stock) : 0,
      images: images || [],
      isFeatured: !!isFeatured,
      isActive: isActive !== undefined ? !!isActive : true,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products (with advanced querying, pagination, and sorting)
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      isActive,
      sortBy,
      page,
      limit,
    } = req.query;

    const query = await buildProductQuery({
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      isActive,
      adminMode: req.query.adminMode,
    });
    const { currentPage, pageLimit, skipCount } = getProductPagination({ page, limit });
    const sortOptions = getProductSortOptions(sortBy);

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skipCount)
      .limit(pageLimit)
      .populate('category', 'name slug image')
      .populate('brand', 'name slug logo')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      products,
      totalProducts,
      page: currentPage,
      pages: Math.ceil(totalProducts / pageLimit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID or Slug
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    if (isObjectId) {
      product = await Product.findOne({ _id: id, isDeleted: false });
    } else {
      product = await Product.findOne({ slug: id.toLowerCase(), isDeleted: false });
    }

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    product = await product.populate('category', 'name slug image')
    product = await product.populate('brand', 'name slug logo')
    product = await product.populate('createdBy', 'name email')
    product = await product.populate('updatedBy', 'name email');

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res, next) => {
  const {
    category,
    brand,
    title,
    slug,
    shortDescription,
    description,
    sku,
    price,
    discountPrice,
    stock,
    images,
    isFeatured,
    isActive,
  } = req.body;

  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (category) {
      const categoryExists = await Category.findOne({ _id: category, isDeleted: false });
      if (!categoryExists) {
        res.status(400);
        throw new Error('Selected category is invalid or deleted');
      }
      product.category = category;
    }

    if (brand !== undefined) {
      if (brand) {
        const brandExists = await Brand.findOne({ _id: brand, isDeleted: false });
        if (!brandExists) {
          res.status(400);
          throw new Error('Selected brand is invalid or deleted');
        }
        product.brand = brand;
      } else {
        product.brand = null;
      }
    }

    if (title) {
      product.title = title.trim();
      if (!slug) product.slug = generateSlug(title);
    }

    if (slug) {
      product.slug = generateSlug(slug);
    }

    if (shortDescription !== undefined) product.shortDescription = shortDescription ? shortDescription.trim() : '';
    if (description) product.description = description.trim();
    
    if (sku !== undefined) {
      const trimmedSku = sku ? sku.trim() : undefined;
      if (trimmedSku && trimmedSku !== product.sku) {
        const duplicateSKU = await Product.findOne({ sku: trimmedSku, isDeleted: false });
        if (duplicateSKU) {
          res.status(400);
          throw new Error('A product with this SKU code already exists');
        }
      }
      product.sku = trimmedSku;
    }

    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (stock !== undefined) product.stock = Number(stock);
    if (images !== undefined) product.images = images;
    if (isFeatured !== undefined) product.isFeatured = !!isFeatured;
    if (isActive !== undefined) product.isActive = !!isActive;

    product.updatedBy = req.user._id;

    // Check slug duplicates (excluding self)
    if (title || slug) {
      const duplicateSlug = await Product.findOne({
        slug: product.slug,
        _id: { $ne: product._id },
        isDeleted: false,
      });
      if (duplicateSlug) {
        res.status(400);
        throw new Error('Another product with this title or slug already exists');
      }
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    product.isDeleted = true;
    product.updatedBy = req.user._id;
    await product.save();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
