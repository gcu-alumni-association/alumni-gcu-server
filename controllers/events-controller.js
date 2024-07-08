const Events = require('../model/Events');
const { validationResult } = require('express-validator');

// to create events(admin only)
const addEvents = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const events = new Events({
        title: req.body.title,
        content: req.body.content,
        organizer: req.body.organizer,
        event_date: req.body.event_date,
        event_time: req.body.event_time,
        posted_date: req.body.posted_date,
    });

    try {
        const newEvents = await events.save();
        res.status(201).json(newEvents);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getEvents = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try{
        const events = await Events.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { addEvents, getEvents };