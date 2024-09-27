const Events = require('../model/Events');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

async function createEventFolder(eventTitle) {
  const folderName = eventTitle.toLowerCase().replace(/\s+/g, '-');
  const folderPath = path.join(__dirname, '..', 'uploads', 'events', folderName);
  
  await fs.mkdir(folderPath, { recursive: true });
  
  return folderPath;
}

// To create events (admin only)
const addEvents = async (req, res) => {
  console.log('Received request body:', req.body);
  console.log('Received files:', req.files);
  console.log('File locations:', req.filesLocations);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const eventFolderPath = await createEventFolder(req.body.title);
    console.log('Created event folder:', eventFolderPath);
    
    const events = new Events({
      title: req.body.title,
      content: req.body.content,
      organizer: req.body.organizer,
      event_date: req.body.event_date,
      event_time: req.body.event_time,
      posted_date: new Date(),
      imageFolder: path.basename(eventFolderPath),
    });

    if (req.filesLocations && req.filesLocations.length > 0) {
      events.images = req.filesLocations;
    }

    const newEvents = await events.save();
    console.log('Saved event to database:', newEvents);

    res.status(201).json(newEvents);
  } catch (err) {
    console.error('Error in addEvents:', err);
    res.status(400).json({ message: err.message });
  }
};

// To get all events
const getEvents = async (req, res) => {
  try {
    const events = await Events.find().select('title content organizer event_date event_time images posted_date');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// To get a single event by ID
const getSingleEvent = async (req, res) => {
  try {
    const event = await Events.findById(req.params.id).select('title content organizer event_date event_time images posted_date');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addEvents, getEvents, getSingleEvent };