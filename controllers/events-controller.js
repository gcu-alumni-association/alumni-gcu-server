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

// Helper function to delete Events folder
async function deleteEventFolder(folderName) {
  if (!folderName) return;
  
  try {
    const folderPath = path.join(__dirname, '..', 'uploads', 'events', folderName);
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log(`Successfully deleted folder: ${folderPath}`);
  } catch (error) {
    console.error(`Error deleting folder: ${error}`);
  }
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

// Event deletion
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const isAdmin = req.user.role === 'admin'; // Check only admin role

    // Ensure the user is an admin
    if (!isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this event' });
    }

    // Find the event by ID
    const event = await Events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete the image folder first
    await deleteEventFolder(event.imageFolder);
    // Remove the event
    await Events.findByIdAndDelete(eventId);

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Edit event details
const editEvent = async (req, res) => {
  const eventId = req.params.id;
  const { title, content, organizer, event_date, event_time, posted_date } = req.body;
  const newImages = req.files ? req.files.map(file => file.path) : [];

  try {
    const event = await Events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update fields if they are provided in the request
    event.title = title || event.title;
    event.content = content || event.content;
    event.organizer = organizer || event.organizer;
    event.event_date = event_date || event.event_date;
    event.event_time = event_time || event.event_time;
    event.posted_date = posted_date || event.posted_date;

    // Update images if new ones are uploaded
    if (newImages.length > 0) {
      // Optionally, delete old images here if required
      event.images = newImages;
    }

    await event.save();
    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addEvents, getEvents, getSingleEvent, deleteEvent, editEvent };
