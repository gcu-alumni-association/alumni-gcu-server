const News = require('../model/News');
const { validationResult } = require("express-validator");
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose'); 

// Helper function to create news folder
async function createNewsFolder(newsTitle) {
  const folderName = newsTitle.toLowerCase().replace(/\s+/g, '-');
  const folderPath = path.join(__dirname, '..', 'uploads', 'news', folderName);
  
  await fs.mkdir(folderPath, { recursive: true });
  
  return folderPath;
}
// Helper function to delete news folder
async function deleteNewsFolder(folderName) {
  if (!folderName) return;
  
  try {
    const folderPath = path.join(__dirname, '..', 'uploads', 'news', folderName);
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log(`Successfully deleted folder: ${folderPath}`);
  } catch (error) {
    console.error(`Error deleting folder: ${error}`);
  }
}

// Helper function to rename news folder
async function renameNewsFolder(oldFolderName, newTitle) {
  if (!oldFolderName || !newTitle) return oldFolderName;
  
  try {
    const oldPath = path.join(__dirname, '..', 'uploads', 'news', oldFolderName);
    const newFolderName = newTitle.toLowerCase().replace(/\s+/g, '-');
    const newPath = path.join(__dirname, '..', 'uploads', 'news', newFolderName);
    
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

// Get all news
const getNews = async (req, res) => {
  try {
    const news = await News.find().select('title content images date');
    const optimizedNews = news.map(news => ({
      _id: news._id,
      title: news.title,
      content: news.content,
      date: news.date,
      firstImage: news.images[0] // Sending the first image
    }));
    res.json(optimizedNews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single news item
const getSingleNews = async (req, res) => {
  try {
    //validating id for correct error response
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Invalid news ID format" });
    }

    const news = await News.findById(req.params.id).select('title content images date');
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload new news
const uploadNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if news with the same title already exists (case-insensitive)
    const existingNews = await News.findOne({ 
      title: { $regex: new RegExp(`^${req.body.title}$`, 'i') } 
    });
    
    if (existingNews) {
      return res.status(400).json({ message: "A news item with this title already exists" });
    }

    const newsFolderPath = await createNewsFolder(req.body.title);

    const news = new News({
      title: req.body.title,
      content: req.body.content,
      date: new Date(),
      imageFolder: path.basename(newsFolderPath),
    });

    // If images were uploaded, add their paths to the news item
    if (req.filesLocations && req.filesLocations.length > 0) {
      news.images = req.filesLocations;
    }

    const newNews = await news.save();
    res.status(201).json(newNews);
  } catch (err) {
    res.status(500).json({ message: "An error occurred", error: err.toString() });
  }
};

// Edit news details (Admin only)
const editNews = async (req, res) => {
  const newsId = req.params.id;
  const { title, content, date } = req.body;

  try {
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Check if title has changed and update folder if needed
    let updatedImageFolder = news.imageFolder;
    let updatedImagePaths = [...news.images];
    
    if (title && title !== news.title && news.imageFolder) {
      // Rename the folder
      const newFolderName = await renameNewsFolder(news.imageFolder, title);
      
      if (newFolderName !== news.imageFolder) {
        updatedImageFolder = newFolderName;
        
        // Update image paths with new folder name
        updatedImagePaths = news.images.map(imagePath => {
          // Replace old folder name with new folder name in the path
          return imagePath.replace(
            `/uploads/news/${news.imageFolder}/`, 
            `/uploads/news/${newFolderName}/`
          );
        });
      }
    }

    // Update fields if provided
    news.title = title || news.title;
    news.content = content || news.content;
    news.date = date || news.date;

    news.imageFolder = updatedImageFolder;
    news.images = updatedImagePaths;

    await news.save();
    res.status(200).json({ message: "News updated successfully", news });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

// Delete news (Admin only)
const deleteNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Delete the image folder first
    await deleteNewsFolder(news.imageFolder);
    // Delete the news item
    await News.findByIdAndDelete(newsId);

    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

const deleteNewsImages = async (req, res) => {
  try {
    const newsId = req.params.id;
    const { imagesToDelete } = req.body; // Array of image filenames to delete

    if (!imagesToDelete || !Array.isArray(imagesToDelete) || imagesToDelete.length === 0) {
      return res.status(400).json({ message: "No images specified for deletion" });
    }

    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    const folderPath = path.join(__dirname, '..', 'uploads', 'news', news.imageFolder);

    // Filter and delete the selected images
    const remainingImages = [];
    for (const image of news.images) {
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

    // Update the news item with the remaining images
    news.images = remainingImages;
    await news.save();

    res.status(200).json({
      message: "Selected images deleted successfully",
      remainingImages: news.images,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

//get images for a specific news item
const getNewsImages = async (req, res) => {
  try {
    const newsId = req.params.id;
    const news = await News.findById(newsId).select('images');

    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // If no images exist, return an empty array
    if (!news.images || news.images.length === 0) {
      return res.status(200).json({ images: [] });
    }

    // Return the images with their filenames
    const images = news.images.map(imagePath => ({
      filename: path.basename(imagePath),
      fullPath: imagePath
    }));

    res.status(200).json({ images });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

//upload images to a specific news item
const addNewsImages = async (req, res) => {
  try {
    const newsId = req.params.id;
    console.log('Adding images to news ID:', newsId);
    console.log('File locations:', req.filesLocations); //from uploadImage middleware

    // Validate uploaded files
    if (!req.filesLocations || req.filesLocations.length === 0) {
      return res.status(400).json({ message: "No images provided for upload" });
    }

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    //add the new image paths to the news item
    //note: req.filesLocations already contains the correct paths
    news.images = [...news.images, ...req.filesLocations];
    
    console.log('Updated news images array:', news.images);

    await news.save();
    
    res.status(200).json({
      message: "Images added successfully",
      updatedImages: news.images,
    });
  } catch (error) {
    console.error('Error in addNewsImages:', error);
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

module.exports = { getNews, uploadNews, getSingleNews, editNews, deleteNews, deleteNewsImages, getNewsImages, addNewsImages };

