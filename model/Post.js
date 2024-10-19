const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastEditedAt: {
        type: Date
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    category: {
        type: String,
        enum: ['post', 'job', 'education'],  // Defining specific categories
        default: 'post',                    // Default to 'post' if not specified
        required: true
    }
    
});

// For optimization
// const populatedPost = await Post.findById(postId).populate('author', 'name').populate('lastEditedBy', 'name');
// console.log(populatedPost.author.name);
// if (populatedPost.lastEditedBy) console.log(populatedPost.lastEditedBy.name);

module.exports = mongoose.model('Post', PostSchema);
