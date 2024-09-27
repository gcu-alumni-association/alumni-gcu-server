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

const getNews = async (req, res) => {
  try {
    const news = await News.find().select('title content images date');
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const uploadNews = async (req, res) => {
  console.log('Received request body:', req.body);
  console.log('Received files:', req.files);
  console.log('File locations:', req.filesLocations);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newsFolderPath = await createNewsFolder(req.body.title);
    console.log('Created news folder:', newsFolderPath);

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
    console.log('News saved to database:', newNews);

    res.status(201).json(newNews);
  } catch (err) {
    console.error('Error in uploadNews:', err);
    res.status(500).json({ message: "An error occurred", error: err.toString() });
  }
};

module.exports = { getNews, uploadNews, getSingleNews };