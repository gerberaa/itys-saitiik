const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to access this page');
    res.redirect('/auth/login');
};

// Home page
router.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// Profile page
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

// Update profile
router.post('/profile/update', isAuthenticated, async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        // Check if username or email is already taken
        const existingUser = await User.findOne({
            $or: [
                { username, _id: { $ne: user._id } },
                { email, _id: { $ne: user._id } }
            ]
        });

        if (existingUser) {
            req.flash('error_msg', 'Username or email is already taken');
            return res.redirect('/profile');
        }

        // Update basic info
        user.username = username;
        user.email = email;

        // Update password if provided
        if (currentPassword && newPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                req.flash('error_msg', 'Current password is incorrect');
                return res.redirect('/profile');
            }
            user.password = newPassword;
        }

        await user.save();
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while updating profile');
        res.redirect('/profile');
    }
});

// Search page
router.get('/search', isAuthenticated, (req, res) => {
    res.render('search', { user: req.user });
});

// Gallery page
router.get('/gallery', isAuthenticated, (req, res) => {
    res.render('gallery', { user: req.user });
});

// Top creators page
router.get('/top', isAuthenticated, (req, res) => {
    res.render('top', { user: req.user });
});

module.exports = router; 