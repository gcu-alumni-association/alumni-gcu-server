const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const {getNews, uploadNews } = require('../controllers/news-controller');

router.post("/upload", [
    check("title").not().isEmpty(),
    check("content").not().isEmpty()
], verifyToken, checkAdmin, uploadNews);

router.get("/get-news", getNews);

module.exports = router;