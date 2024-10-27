const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require("../middleware/verify-token");
const { addEvents, getEvents, getSingleEvent, deleteEvent, editEvent } = require("../controllers/events-controller.js"); // Ensure deleteEvent is imported
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

//deleteEvent controller
router.delete("/delete/:id", verifyToken, checkAdmin, deleteEvent);

// New route to edit an event
router.put("/edit/:id", verifyToken, checkAdmin, upload.array("images", 5), editEvent);



module.exports = router;
