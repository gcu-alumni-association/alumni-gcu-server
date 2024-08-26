const express = require("express");
const router = express.Router();
const Photos = require("../model/Photos");
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const { upload, uploadImage } = require("../middleware/upload-images");
const { uploadImageForGallery, getImagesForGallery } = require("../controllers/gallery-controller");

// Middleware to set Cache-Control header
// const setCacheControl = (req, res, next) => {
// 	res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
// 	next();
// };

router.get(
	"/get-photos",
	// setCacheControl,
	getImagesForGallery
);

router.post(
	"/upload",
	upload.single("image"),
	verifyToken,
	checkAdmin,
	uploadImage,
	uploadImageForGallery
);

module.exports = router;
