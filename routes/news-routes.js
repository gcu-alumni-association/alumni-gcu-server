const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const {
	getNews,
	uploadNews,
	getSingleNews,
	editNews,
	deleteNews,
	deleteNewsImages,
	getNewsImages,
	addNewsImages
} = require("../controllers/news-controller");
const { uploadImage, upload } = require("../middleware/upload-images");

// const setCacheControl = (req, res, next) => {
//   res.set('Cache-Control', 'public, max-age=3600');
//   next();
// };

router.post(
	"/upload",
	verifyToken,
	checkAdmin,
	upload.array("images",10),
	[
		body("title").trim().notEmpty().withMessage("Title cannot be empty"),
		body("content").trim().notEmpty().withMessage("Content cannot be empty"),
	],
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

router.put("/edit/:id", verifyToken, checkAdmin, upload.array("images", 5), editNews);

router.delete("/delete/:id", verifyToken, checkAdmin, deleteNews);

router.delete("/delete-news-images/:id", verifyToken, checkAdmin, deleteNewsImages);

router.get("/get-news-images/:id", verifyToken, checkAdmin, getNewsImages);

router.post('/upload-news-images/:id', verifyToken, checkAdmin, upload.array('images'), uploadImage, addNewsImages);

module.exports = router;
