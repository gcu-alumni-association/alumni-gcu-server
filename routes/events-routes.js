const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const { addEvents, getEvents, getSingleEvent } = require("../controllers/events-controller.js");
const { uploadImage, upload } = require("../middleware/upload-images");

// Middleware to set Cache-Control header
const setCacheControl = (req, res, next) => {
	res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
	next();
};

router.post(
	"/upload",
	upload.single("image"),
	[
		check("title").not().isEmpty(),
		check("content").not().isEmpty(),
		check("event_date").isISO8601(),
	],
	verifyToken,
	checkAdmin,
  uploadImage, 
	addEvents
);

router.get("/get-events", setCacheControl, getEvents);

router.get("/get-event/:id", getSingleEvent);

module.exports = router;
