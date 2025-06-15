const express = require('express');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

// Home page
router.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// Search page
router.get('/search', isAuthenticated, (req, res) => {
    res.render('search', { user: req.user });
});

// Gallery page
router.get('/gallery', isAuthenticated, (req, res) => {
    res.render('gallery', { user: req.user });
});

// Top page
router.get('/top', isAuthenticated, (req, res) => {
    res.render('top', { user: req.user });
});

// Profile page
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

module.exports = router; 