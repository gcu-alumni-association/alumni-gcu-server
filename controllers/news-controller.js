const News = require('../model/News');
const { validationResult } = require("express-validator");

const getNews = async (req, res) => {
  try {
    const news = await News.find().select('title content imageUrl date');
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSingleNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).select('title content imageUrl date');
    if (!news) {
      return res.status(404).json({ message: "News item not found" });
    }
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadNews = async (req, res) => {
  console.log('Raw body:', req.body);
  console.log('Received file:', req.file);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const news = new News({
      title: req.body.title,
      content: req.body.content,
      imageUrl: req.file ? req.file.location : null
    });

    const newNews = await news.save();
    console.log('News saved to MongoDB:', newNews);

    res.status(201).json(newNews);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "An error occurred", error: err.toString() });
  }
};

module.exports = { getNews, uploadNews, getSingleNews, };