const express = require('express');
const router = express.Router();
const Post = require('../model/Post');
const { verifyToken, checkAdmin } = require('../middleware/verify-token');

// Create a new post
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { content, category } = req.body;  // Get category from request body
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Post content cannot be empty" });
        }
        
        if (!category || !['post', 'job', 'education'].includes(category)) {
            return res.status(400).json({ message: "Invalid category" });
        }
        
        const userId = req.user.id;
        
        const newPost = new Post({
            content,
            author: userId,
            category,  // Save category in the post
            createdAt: new Date(),
            likes: []
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

// Get paginated posts with optional category filter
router.get('/get-post', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        
        // Get category from query parameter (optional)
        const category = req.query.category || 'post';  // Default to 'post'
        
        // Create filter object
        const filter = { category };  // Filter by category
        
        // Count total posts based on the filter
        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limit);
        
        // Fetch posts based on the filter, sorted by creation date
        const posts = await Post.find(filter)
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
            .select('content author createdAt likes') // Include specific fields
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

//Edit posts route
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, lastEditedBy } = req.body;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Find the post by ID
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is the author of the post or an admin
        if (post.author.toString() !== userId && !isAdmin) {
            return res.status(403).json({ message: "You are not authorized to edit this post" });
        }

        // Update post content and last edited info
        post.content = content;
        post.lastEditedAt = new Date();
        if (lastEditedBy) {
            post.lastEditedBy = lastEditedBy;
        }

        await post.save();

        res.status(200).json({ message: "Post updated successfully", post });
    } catch (error) {
        console.error('Error editing post:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Toggle like on a post
router.put('/:id/like', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user has already liked the post
        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // If liked, remove the like
            post.likes = post.likes.filter((id) => id.toString() !== userId);
        } else {
            // If not liked, add the like
            post.likes.push(userId);
        }

        await post.save();

        // Send the updated likes array in the response
        res.status(200).json({ message: "Like toggled successfully", likes: post.likes });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: "Internal server error" });
    } 
});

// Add comment to a post
router.post('/:postId/comments', verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        console.log('Received comment text:', text); // Debug log

        // Strict input validation
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                message: 'Comment text must be provided as a string'
            });
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            return res.status(400).json({
                message: 'Comment text cannot be empty'
            });
        }

        // Find post and verify it exists
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Create comment document directly with mongoose
        const newComment = {
            text: trimmedText,
            author: req.user.id,
            createdAt: new Date()
        };

        // Add comment using MongoDB push operator
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            { 
                $push: { 
                    comments: newComment 
                } 
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).populate('comments.author', 'name');

        if (!updatedPost) {
            return res.status(404).json({ message: 'Failed to add comment' });
        }

        // Get the newly added comment
        const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

        // Debug logs
        console.log('New comment added:', addedComment);
        console.log('Updated post comments:', updatedPost.comments);

        res.status(201).json(addedComment);
    } catch (error) {
        console.error('Detailed error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Invalid comment data',
                details: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

module.exports = router;

// Delete a comment
  router.delete('/:postId/comments/:commentId', verifyToken, async (req, res) => {
    try {
        // Find post and verify it exists
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Find the comment in the post's comments array
        const commentIndex = post.comments.findIndex(
            comment => comment._id.toString() === req.params.commentId
        );

        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const comment = post.comments[commentIndex];

        // Check if user is authorized to delete the comment
        if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Remove the comment using MongoDB pull operator
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            {
                $pull: {
                    comments: { _id: req.params.commentId }
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Failed to delete comment' });
        }

        res.status(200).json({ 
            message: 'Comment deleted successfully',
            commentId: req.params.commentId
        });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;
