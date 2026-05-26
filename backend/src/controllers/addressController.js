import Address from '../models/Address.js';

/**
 * @desc    Get all saved addresses for logged-in user
 * @route   GET /api/addresses
 * @access  Private
 */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new shipping address
 * @route   POST /api/addresses
 * @access  Private
 */
export const createAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      mobile,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      addressType,
      isDefault,
    } = req.body;

    const addressCount = await Address.countDocuments({ user: req.user._id });

    // Force default if it is the user's first saved address
    const defaultFlag = addressCount === 0 ? true : !!isDefault;

    if (defaultFlag) {
      // Clear other defaults
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      mobile,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country: country || 'India',
      addressType: addressType || 'home',
      isDefault: defaultFlag,
    });

    res.status(201).json(address);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a saved shipping address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
export const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    const {
      fullName,
      mobile,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      addressType,
      isDefault,
    } = req.body;

    address.fullName = fullName !== undefined ? fullName : address.fullName;
    address.mobile = mobile !== undefined ? mobile : address.mobile;
    address.addressLine1 = addressLine1 !== undefined ? addressLine1 : address.addressLine1;
    address.addressLine2 = addressLine2 !== undefined ? addressLine2 : address.addressLine2;
    address.landmark = landmark !== undefined ? landmark : address.landmark;
    address.city = city !== undefined ? city : address.city;
    address.state = state !== undefined ? state : address.state;
    address.pincode = pincode !== undefined ? pincode : address.pincode;
    address.country = country !== undefined ? country : address.country;
    address.addressType = addressType !== undefined ? addressType : address.addressType;

    // Handle isDefault changes
    if (isDefault !== undefined && isDefault !== address.isDefault) {
      if (isDefault) {
        await Address.updateMany({ user: req.user._id }, { isDefault: false });
        address.isDefault = true;
      } else {
        // If they try to turn off default, check if they have other addresses
        const otherAddress = await Address.findOne({ user: req.user._id, _id: { $ne: address._id } });
        if (otherAddress) {
          otherAddress.isDefault = true;
          await otherAddress.save();
          address.isDefault = false;
        } else {
          // If only 1 address, it must stay default
          address.isDefault = true;
        }
      }
    }

    const updatedAddress = await address.save();
    res.status(200).json(updatedAddress);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a saved shipping address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: address._id });

    // If deleted address was default, promote the next available address to default
    if (wasDefault) {
      const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set a saved address as the default address
 * @route   PATCH /api/addresses/:id/default
 * @access  Private
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    address.isDefault = true;
    const updatedAddress = await address.save();

    res.status(200).json(updatedAddress);
  } catch (error) {
    next(error);
  }
};
