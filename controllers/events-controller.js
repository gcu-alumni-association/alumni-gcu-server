const Events = require('../model/Events');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose'); 

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

// Helper function to rename events folder
async function renameEventFolder(oldFolderName, newTitle) {
  if (!oldFolderName || !newTitle) return oldFolderName;
  
  try {
    const oldPath = path.join(__dirname, '..', 'uploads', 'events', oldFolderName);
    const newFolderName = newTitle.toLowerCase().replace(/\s+/g, '-');
    const newPath = path.join(__dirname, '..', 'uploads', 'events', newFolderName);
    
    // Check if old path exists
    await fs.access(oldPath);
    
    // Check if new path already exists and it's not the same as old path
    try {
      await fs.access(newPath);
      if (oldPath !== newPath) {
        console.log(`Destination folder already exists: ${newPath}`);
        return oldFolderName; // Return old folder name if new path already exists
      }
    } catch (error) {
      // New path doesn't exist, which is good
    }
    
    // Rename the folder
    await fs.rename(oldPath, newPath);
    console.log(`Successfully renamed folder from ${oldPath} to ${newPath}`);
    
    return newFolderName;
  } catch (error) {
    console.error(`Error renaming folder: ${error}`);
    return oldFolderName; // Return old folder name if renaming fails
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
    // Check if event with the same title already exists (case-insensitive)
    const existingEvent = await Events.findOne({ 
      title: { $regex: new RegExp(`^${req.body.title}$`, 'i') } 
    });
    
    if (existingEvent) {
      return res.status(400).json({ message: "An event with this title already exists" });
    }

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
    //validating id for correct error response
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Invalid event ID format" });
    }
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

  try {
    const event = await Events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if title has changed and update folder if needed
    let updatedImageFolder = event.imageFolder;
    let updatedImagePaths = [...event.images];
    
    if (title && title !== event.title && event.imageFolder) {
      // Rename the folder
      const newFolderName = await renameEventFolder(event.imageFolder, title);
      
      if (newFolderName !== event.imageFolder) {
        updatedImageFolder = newFolderName;
        
        // Update image paths with new folder name
        updatedImagePaths = event.images.map(imagePath => {
          // Replace old folder name with new folder name in the path
          return imagePath.replace(
            `/uploads/events/${event.imageFolder}/`, 
            `/uploads/events/${newFolderName}/`
          );
        });
      }
    }

    // Update fields if they are provided in the request
    event.title = title || event.title;
    event.content = content || event.content;
    event.organizer = organizer || event.organizer;
    event.event_date = event_date || event.event_date;
    event.event_time = event_time || event.event_time;
    event.posted_date = posted_date || event.posted_date;
    event.imageFolder = updatedImageFolder;
    event.images = updatedImagePaths;

    await event.save();
    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteEventsImages = async (req, res) => {
  try {
    const eventsId = req.params.id;
    const { imagesToDelete } = req.body; // Array of image filenames to delete

    if (!imagesToDelete || !Array.isArray(imagesToDelete) || imagesToDelete.length === 0) {
      return res.status(400).json({ message: "No images specified for deletion" });
    }

    const events = await Events.findById(eventsId);

    if (!events) {
      return res.status(404).json({ message: "Events item not found" });
    }

    const folderPath = path.join(__dirname, '..', 'uploads', 'events', events.imageFolder);

    // Filter and delete the selected images
    const remainingImages = [];
    for (const image of events.images) {
      const imageName = path.basename(image); // Extract filename from path
      if (imagesToDelete.includes(imageName)) {
        try {
          const imagePath = path.join(folderPath, imageName);
          await fs.unlink(imagePath); // Delete the file
        } catch (error) {
          console.error(`Error deleting image: ${imageName}, Error: ${error}`);
        }
      } else {
        remainingImages.push(image); // Keep non-deleted images
      }
    }

    // Update the events item with the remaining images
    events.images = remainingImages;
    await events.save();

    res.status(200).json({
      message: "Selected images deleted successfully",
      remainingImages: events.images,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

//get images for a specific events item
const getEventsImages = async (req, res) => {
  try {
    const eventsId = req.params.id;
    const events = await Events.findById(eventsId).select('images');

    if (!events) {
      return res.status(404).json({ message: "Events item not found" });
    }

    if (!events.images || events.images.length === 0) {
      return res.status(200).json({ images: [] });
    }

    // Return the images with their filenames
    const images = events.images.map(imagePath => ({
      filename: path.basename(imagePath),
      fullPath: imagePath
    }));

    res.status(200).json({ images });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

//upload images to a specific events item
const addEventsImages = async (req, res) => {
  try {
    const eventsId = req.params.id;
    console.log('Adding images to events ID:', eventsId);
    console.log('File locations:', req.filesLocations); //from uploadImage middleware

    if (!req.filesLocations || req.filesLocations.length === 0) {
      return res.status(400).json({ message: "No images provided for upload" });
    }

    const events = await Events.findById(eventsId);
    if (!events) {
      return res.status(404).json({ message: "Events item not found" });
    }

    //add the new image paths to the events item
    //note: req.filesLocations already contains the correct paths
    events.images = [...events.images, ...req.filesLocations];
    
    console.log('Updated events images array:', events.images);

    await events.save();
    
    res.status(200).json({
      message: "Images added successfully",
      updatedImages: events.images,
    });
  } catch (error) {
    console.error('Error in addEventsImages:', error);
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

module.exports = { addEvents, getEvents, getSingleEvent, deleteEvent, editEvent, deleteEventsImages, getEventsImages, addEventsImages};
