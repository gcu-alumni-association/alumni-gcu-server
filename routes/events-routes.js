const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const { addEvents, getEvents, getSingleEvent } = require("../controllers/events-controller.js");
const { uploadImage, upload } = require("../middleware/upload-images");

router.post(
  "/upload",
  verifyToken,
  checkAdmin,
  upload.array("images", 5),
  uploadImage,
  [
    check("title").not().isEmpty(),
    check("content").not().isEmpty(),
    check("event_date").isISO8601(),
  ],
  addEvents
);

router.get("/get-events", getEvents);

router.get("/get-event/:id", getSingleEvent);

module.exports = router;