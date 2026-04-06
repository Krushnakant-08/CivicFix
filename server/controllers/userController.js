import User from '../models/User.js';

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role, department } = req.body;

    if (!['citizen', 'department', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    user.department = role === 'department' ? department : null;
    await user.save({ validateBeforeSave: false });

    res.json({
      message: `User role updated to ${role}`,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('UpdateUserRole error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/users/:id/status
 * @desc    Activate/Deactivate user (admin only)
 * @access  Private/Admin
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('ToggleUserStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
