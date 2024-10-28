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

    // Delete the news item
    await News.findByIdAndDelete(newsId);

    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.toString() });
  }
};

module.exports = { getNews, uploadNews, getSingleNews, editNews, deleteNews };
