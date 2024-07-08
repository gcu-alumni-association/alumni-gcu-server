const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventsSchema = new Schema({
    title: {
        type: String,
        required: true

    },

    content: {
        type: String,
        required: true
    },

    organizer: {
        type: String,        
    },

    event_date: {
        type: Date,
        required: true
    },

    event_time: {
        type: String,
    },

    posted_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Events', eventsSchema);