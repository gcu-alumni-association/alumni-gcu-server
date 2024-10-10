const express = require("express");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const { upload, uploadImage } = require("../middleware/upload-images");
const { 
  uploadImageForGallery, 
  getImagesForGallery, 
  getSingleAlbum, 
  getAllImages, 
  getAlbumNames
} = require("../controllers/gallery-controller");
const { body } = require('express-validator');

// Middleware to set Cache-Control header
// const setCacheControl = (req, res, next) => {
// 	res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
// 	next();
// };

// Get album names
router.get(
  "/album-names",
  verifyToken,
  checkAdmin,
  getAlbumNames
);

// Get all albums
router.get(
  "/albums",
  // setCacheControl,
  getImagesForGallery
);

// Get a single album
router.get(
  "/album/:id",
  // setCacheControl,
  getSingleAlbum
);

// Get all images from all albums
router.get(
  "/all-images",
  // setCacheControl,
  getAllImages
);

// Upload images to an album
router.post(
  "/upload",
  verifyToken,
  checkAdmin,
  [
    body('albumName').notEmpty().withMessage('Album name is required'),
  ],
  upload.array("images"),
  uploadImage,
  uploadImageForGallery
);

module.exports = router;