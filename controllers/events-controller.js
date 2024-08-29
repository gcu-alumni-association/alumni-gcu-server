const Events = require('../model/Events');
const { validationResult } = require('express-validator');

// To create events (admin only)
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
    imageUrl: req.file ? req.file.location : null,
  });

  try {
    const newEvents = await events.save();
    res.status(201).json(newEvents);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// To get all events
const getEvents = async (req, res) => {
  try {
    const events = await Events.find().select('title content organizer event_date event_time imageUrl posted_date');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// To get a single event by ID
const getSingleEvent = async (req, res) => {
  try {
    const event = await Events.findById(req.params.id).select('title content organizer event_date event_time imageUrl posted_date');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addEvents, getEvents, getSingleEvent };
