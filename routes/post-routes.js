const express = require('express');
const router = express.Router();
const Post = require('../model/Post');
const { verifyToken, checkAdmin } = require('../middleware/verify-token');

// Create a new post
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Post content cannot be empty" });
        }
        
        const userId = req.user.id;
        
        const newPost = new Post({
            content,
            author: userId,
            createdAt: new Date()
        });
        
        await newPost.save();
        
        // Populate author information before sending response
        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'name batch branch');
        
        res.status(201).json({
            message: "Post created successfully",
            post: populatedPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get paginated posts
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // Default to 6 posts per page
        const skip = (page - 1) * limit;

        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        const posts = await Post.find()
            .populate('author', 'name batch branch')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        
        res.status(200).json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get paginated posts for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // Default to 6 posts per page
        const skip = (page - 1) * limit;

        const totalPosts = await Post.countDocuments({ author: req.params.userId });
        const totalPages = Math.ceil(totalPosts / limit);

        const posts = await Post.find({ author: req.params.userId })
            .populate('author', 'name batch branch')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        
        res.status(200).json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts
        });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//Deletion route
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is the author of the post or an admin
        if (post.author.toString() !== userId && !isAdmin) {
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }

        await Post.findByIdAndDelete(postId);

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
