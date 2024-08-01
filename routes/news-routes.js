const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { getNews, uploadNews, getSingleNews } = require('../controllers/news-controller');

// Middleware to set Cache-Control header
const setCacheControl = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  next();
};

router.post("/upload", [
    check("title").not().isEmpty(),
    check("content").not().isEmpty()
], verifyToken, checkAdmin, uploadNews);

router.get("/get-news", setCacheControl, getNews);

router.get("/get-news/:id", setCacheControl, getSingleNews);

module.exports = router;
