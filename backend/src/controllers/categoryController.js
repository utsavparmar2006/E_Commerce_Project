import Category from '../models/Category.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
export const createCategory = async (req, res, next) => {
  const { name, slug, image, isFeatured } = req.body;

  try {
    if (!name) {
      res.status(400);
      throw new Error('Please provide a category name');
    }

    const finalSlug = slug ? generateSlug(slug) : generateSlug(name);

    // Check duplicate slug
    const duplicate = await Category.findOne({ slug: finalSlug, isDeleted: false });
    if (duplicate) {
      res.status(400);
      throw new Error('A category with this name or slug already exists');
    }

    const category = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      image: image || null,
      isFeatured: !!isFeatured,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const { isFeatured, search } = req.query;
    const query = { isDeleted: false };

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (search) {
      query.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = async (req, res, next) => {
  const { name, slug, image, isFeatured } = req.body;

  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    if (name) category.name = name.trim();
    if (slug) {
      category.slug = generateSlug(slug);
    } else if (name) {
      category.slug = generateSlug(name);
    }

    if (image !== undefined) category.image = image || null;
    if (isFeatured !== undefined) category.isFeatured = !!isFeatured;

    category.updatedBy = req.user._id;

    // Check duplicate slug (excluding self)
    if (name || slug) {
      const duplicate = await Category.findOne({
        slug: category.slug,
        _id: { $ne: category._id },
        isDeleted: false,
      });
      if (duplicate) {
        res.status(400);
        throw new Error('Another category with this name or slug already exists');
      }
    }

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDeleted: false });

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    category.isDeleted = true;
    category.updatedBy = req.user._id;
    await category.save();

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
