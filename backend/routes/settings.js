const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      settings: {
        profile: {
          username: user.username,
          email: user.email,
          tier: user.tier,
          balance: user.balance,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        notifications: user.notifications || {
          email: true,
          push: true,
          matches: true,
          leaderboard: false,
          achievements: true,
          trading: true
        },
        privacy: user.privacy || {
          showStats: true,
          showBalance: false,
          showTrades: true,
          allowDirectMessages: true
        },
        trading: user.trading || {
          defaultLeverage: 10,
          defaultMarginMode: 'isolated',
          autoCloseOnLoss: false,
          maxLossPercentage: 50
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/profile
// @desc    Update profile settings
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username is already taken (if changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }

    // Check if email is already taken (if changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        tier: user.tier
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/password
// @desc    Update password
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/notifications
// @desc    Update notification preferences
// @access  Private
router.put('/notifications', auth, async (req, res) => {
  try {
    const { notifications } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.notifications = {
      email: notifications.email || false,
      push: notifications.push || false,
      matches: notifications.matches || false,
      leaderboard: notifications.leaderboard || false,
      achievements: notifications.achievements || false,
      trading: notifications.trading || false
    };

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      notifications: user.notifications
    });

  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/privacy
// @desc    Update privacy settings
// @access  Private
router.put('/privacy', auth, async (req, res) => {
  try {
    const { privacy } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.privacy = {
      showStats: privacy.showStats || false,
      showBalance: privacy.showBalance || false,
      showTrades: privacy.showTrades || false,
      allowDirectMessages: privacy.allowDirectMessages || false
    };

    await user.save();

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      privacy: user.privacy
    });

  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/trading
// @desc    Update trading preferences
// @access  Private
router.put('/trading', auth, async (req, res) => {
  try {
    const { trading } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.trading = {
      defaultLeverage: Math.min(Math.max(trading.defaultLeverage || 10, 1), 75),
      defaultMarginMode: trading.defaultMarginMode || 'isolated',
      autoCloseOnLoss: trading.autoCloseOnLoss || false,
      maxLossPercentage: Math.min(Math.max(trading.maxLossPercentage || 50, 10), 90)
    };

    await user.save();

    res.json({
      success: true,
      message: 'Trading preferences updated successfully',
      trading: user.trading
    });

  } catch (error) {
    console.error('Update trading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trading preferences',
      error: error.message
    });
  }
});

// @route   DELETE /api/settings/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password before deletion
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

module.exports = router;
