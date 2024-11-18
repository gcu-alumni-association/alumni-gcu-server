const News = require('../model/News');
const { validationResult } = require("express-validator");
const path = require('path');
const fs = require('fs').promises;

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
  const newImages = req.files ? req.files.map(file => file.path) : [];

  try {
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }

    // Update fields if provided
    news.title = title || news.title;
    news.content = content || news.content;
    news.date = date || news.date;

    // Update images if new ones are uploaded
    if (newImages.length > 0) {
      news.images = newImages;
    }

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

