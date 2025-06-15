const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Multer config for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

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

// Add post page (GET)
router.get('/add-post', isAuthenticated, (req, res) => {
    res.render('add-post', { user: req.user });
});

// Add post (POST)
router.post('/add-post', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!req.file) {
            req.flash('error_msg', 'Please upload an image');
            return res.redirect('/add-post');
        }
        const image = '/uploads/' + req.file.filename;
        const post = new Post({
            title,
            image,
            description,
            author: req.user._id
        });
        await post.save();
        req.flash('success_msg', 'Post added successfully!');
        res.redirect('/gallery');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding post');
        res.redirect('/add-post');
    }
});

// Profile page
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const userPosts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.render('profile', { user: req.user, posts: userPosts });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/');
    }
});

// Update profile
router.post('/profile/update', isAuthenticated, async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
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
        user.username = username;
        user.email = email;
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
router.get('/gallery', isAuthenticated, async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
        res.render('gallery', { user: req.user, posts });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading gallery');
        res.render('gallery', { user: req.user, posts: [] });
    }
});

// Top creators page
router.get('/top', isAuthenticated, (req, res) => {
    res.render('top', { user: req.user });
});

// Детальний перегляд поста
router.get('/post/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'username');
        if (!post) {
            req.flash('error_msg', 'Post not found');
            return res.redirect('/gallery');
        }
        res.render('post', { user: req.user, post });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading post');
        res.redirect('/gallery');
    }
});

// Редагування поста
router.get('/post/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            req.flash('error_msg', 'Post not found');
            return res.redirect('/gallery');
        }
        if (post.author.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Not authorized');
            return res.redirect('/gallery');
        }
        res.render('edit-post', { user: req.user, post });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading post');
        res.redirect('/gallery');
    }
});

router.post('/post/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            req.flash('error_msg', 'Post not found');
            return res.redirect('/gallery');
        }
        if (post.author.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Not authorized');
            return res.redirect('/gallery');
        }
        post.title = req.body.title;
        post.description = req.body.description;
        await post.save();
        req.flash('success_msg', 'Post updated successfully');
        res.redirect(`/post/${post._id}`);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating post');
        res.redirect('/gallery');
    }
});

const storageAvatar = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({ storage: storageAvatar });

router.post('/profile/avatar', isAuthenticated, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error_msg', 'No file uploaded');
            return res.redirect('/profile');
        }
        const avatarPath = '/uploads/avatars/' + req.file.filename;
        await User.findByIdAndUpdate(req.user._id, { avatar: avatarPath });
        req.flash('success_msg', 'Avatar updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating avatar');
        res.redirect('/profile');
    }
});

router.get('/profile/settings', isAuthenticated, (req, res) => {
    res.render('settings', { user: req.user });
});

module.exports = router; 