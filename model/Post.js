const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
        minlength: [1, 'Comment cannot be empty']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

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
        enum: ['post', 'job', 'education'],
        default: 'post',
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [CommentSchema], // Existing comments array field

    // New field for flagged posts
    flagged: {
        type: Boolean,
        default: false // Default is unflagged
    }
});

module.exports = mongoose.model('Post', PostSchema);