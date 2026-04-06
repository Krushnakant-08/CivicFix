import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Only admins can create department or admin accounts
    // For public registration, force role to 'citizen'
    const allowedRole = role === 'citizen' || !role ? 'citizen' : role;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: allowedRole,
      department: allowedRole === 'department' ? department : null,
      phone: phone || null,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user & return JWT
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user profile
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/auth/create-staff
 * @desc    Admin creates department staff or admin accounts
 * @access  Private (Admin only)
 */
export const createStaffAccount = async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!['department', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be department or admin' });
    }

    if (role === 'department' && !department) {
      return res.status(400).json({ message: 'Department is required for department role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: role === 'department' ? department : null,
      phone: phone || null,
    });

    res.status(201).json({
      message: `${role} account created successfully`,
      user: user.toSafeObject(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('CreateStaff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
