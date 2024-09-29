const express = require('express');
const router = express.Router();
const Post = require('../model/Post');

router.post('/', async (req, res) => {
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

        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
