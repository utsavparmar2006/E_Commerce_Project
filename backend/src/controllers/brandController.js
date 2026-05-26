import Brand from '../models/Brand.js';
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
 * @desc    Create new brand
 * @route   POST /api/brands
 * @access  Private/Admin
 */
export const createBrand = async (req, res, next) => {
  const { name, slug, logo, isFeatured } = req.body;

  try {
    if (!name) {
      res.status(400);
      throw new Error('Please provide a brand name');
    }

    const finalSlug = slug ? generateSlug(slug) : generateSlug(name);

    // Check duplicate slug
    const duplicate = await Brand.findOne({ slug: finalSlug, isDeleted: false });
    if (duplicate) {
      res.status(400);
      throw new Error('A brand with this name or slug already exists');
    }

    const brand = await Brand.create({
      name: name.trim(),
      slug: finalSlug,
      logo: logo || null,
      isFeatured: !!isFeatured,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json(brand);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all brands
 * @route   GET /api/brands
 * @access  Public
 */
export const getBrands = async (req, res, next) => {
  try {
    const { isFeatured, search } = req.query;
    const query = { isDeleted: false };

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (search) {
      query.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    const brands = await Brand.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json(brands);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get brand by ID
 * @route   GET /api/brands/:id
 * @access  Public
 */
export const getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }

    res.status(200).json(brand);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update brand
 * @route   PUT /api/brands/:id
 * @access  Private/Admin
 */
export const updateBrand = async (req, res, next) => {
  const { name, slug, logo, isFeatured } = req.body;

  try {
    const brand = await Brand.findOne({ _id: req.params.id, isDeleted: false });

    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }

    if (name) brand.name = name.trim();
    if (slug) {
      brand.slug = generateSlug(slug);
    } else if (name) {
      brand.slug = generateSlug(name);
    }

    if (logo !== undefined) brand.logo = logo || null;
    if (isFeatured !== undefined) brand.isFeatured = !!isFeatured;

    brand.updatedBy = req.user._id;

    // Check duplicate slug (excluding self)
    if (name || slug) {
      const duplicate = await Brand.findOne({
        slug: brand.slug,
        _id: { $ne: brand._id },
        isDeleted: false,
      });
      if (duplicate) {
        res.status(400);
        throw new Error('Another brand with this name or slug already exists');
      }
    }

    const updatedBrand = await brand.save();
    res.status(200).json(updatedBrand);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete brand
 * @route   DELETE /api/brands/:id
 * @access  Private/Admin
 */
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, isDeleted: false });

    if (!brand) {
      res.status(404);
      throw new Error('Brand not found');
    }

    brand.isDeleted = true;
    brand.updatedBy = req.user._id;
    await brand.save();

    res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};
