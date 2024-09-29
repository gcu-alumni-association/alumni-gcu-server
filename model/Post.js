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
    }
});

//For optimization

// const populatedPost = await Post.findById(postId).populate('author', 'name');
// console.log(populatedPost.author.name);

module.exports = mongoose.model('Post', PostSchema);
