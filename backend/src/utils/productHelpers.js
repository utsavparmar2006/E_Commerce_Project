import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import { escapeRegex } from './escapeRegex.js';

export const generateSlug = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

const resolveReferenceFilter = async (value, Model) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  const foundRecord = await Model.findOne({ slug: value, isDeleted: false });
  return foundRecord ? foundRecord._id : new mongoose.Types.ObjectId();
};

export const buildProductQuery = async ({
  category,
  brand,
  search,
  minPrice,
  maxPrice,
  isFeatured,
  isActive,
  adminMode,
}) => {
  const query = { isDeleted: false };

  if (category) {
    query.category = await resolveReferenceFilter(category, Category);
  }

  if (brand) {
    query.brand = await resolveReferenceFilter(brand, Brand);
  }

  if (search) {
    const sanitizedSearch = escapeRegex(search);
    query.$or = [
      { title: { $regex: sanitizedSearch, $options: 'i' } },
      { description: { $regex: sanitizedSearch, $options: 'i' } },
      { sku: { $regex: sanitizedSearch, $options: 'i' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true';
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  } else if (adminMode !== 'true') {
    query.isActive = true;
  }

  return query;
};

export const getProductPagination = ({ page, limit }) => {
  const currentPage = Number(page) || 1;
  const pageLimit = Number(limit) || 12;

  return {
    currentPage,
    pageLimit,
    skipCount: (currentPage - 1) * pageLimit,
  };
};

export const getProductSortOptions = (sortBy) => {
  if (sortBy === 'price-low') {
    return { price: 1 };
  }

  if (sortBy === 'price-high') {
    return { price: -1 };
  }

  if (sortBy === 'rating') {
    return { averageRating: -1 };
  }

  if (sortBy === 'sold') {
    return { sold: -1 };
  }

  return { createdAt: -1 };
};
