const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

// Login page
router.get('/login', (req, res) => {
    res.render('auth/login', { error: req.flash('error') });
});

// Login process
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

// Register page
router.get('/register', (req, res) => {
    res.render('auth/register', { error: req.flash('error') });
});

// Register process
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            req.flash('error', 'User already exists');
            return res.redirect('/auth/register');
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Log in the new user
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    } catch (error) {
        req.flash('error', 'Error creating user');
        res.redirect('/auth/register');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router; 