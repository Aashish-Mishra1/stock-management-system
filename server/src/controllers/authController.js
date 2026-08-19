const User = require('../models/User');
const { generateToken } = require('../config/jwt');

const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.validatedData.body;
    
    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        message: 'User with this username already exists'
      });
    }
    
    // Create new user
    const userId = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });
    
    // Get created user (without password)
    const newUser = await User.findById(userId);
    
    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Remove password from user object
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, email, firstName, lastName } = req.body;
    const userId = req.user.id;
    
    // Check if email is being changed and if new email exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Check if username is being changed and if new username exists
    if (username && username !== req.user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this username already exists'
        });
      }
    }
    
    // Update user
    const updated = await User.updateById(userId, {
      username,
      email,
      first_name: firstName,
      last_name: lastName
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
    
    // Get updated user
    const updatedUser = await User.findById(userId);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
    
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Get user with password hash by ID
    const userRecord = await User.findByEmail(req.user.email);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await User.verifyPassword(currentPassword, userRecord.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    const updated = await User.updatePassword(userId, newPassword);
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to change password'
      });
    }
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }
    
    // Get user with password
    const user = await User.findByEmail(req.user.email);
    
    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }
    
    // Delete user account
    const deleted = await User.deleteById(userId);
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    // User is already authenticated via middleware
    const user = req.user;
    
    // Generate new token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  refreshToken
};