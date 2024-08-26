const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const {
	getNews,
	uploadNews,
	getSingleNews,
} = require("../controllers/news-controller");
const { uploadImage, upload } = require("../middleware/upload-images");

// const setCacheControl = (req, res, next) => {
//   res.set('Cache-Control', 'public, max-age=3600');
//   next();
// };

router.post(
	"/upload",
	upload.single("image"),
	[
		body("title").trim().notEmpty().withMessage("Title cannot be empty"),
		body("content").trim().notEmpty().withMessage("Content cannot be empty"),
	],
	verifyToken,
	checkAdmin,
	uploadImage,
	uploadNews
);

router.get(
	"/get-news",
	// setCacheControl,
	getNews
);

router.get(
	"/get-news/:id",
	// setCacheControl,
	getSingleNews
);

module.exports = router;
