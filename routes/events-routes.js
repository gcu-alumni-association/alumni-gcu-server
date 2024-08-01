const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { addEvents, getEvents } = require('../controllers/events-controller.js');

// Middleware to set Cache-Control header
const setCacheControl = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  next();
};

router.post("/upload", [
    check("title").not().isEmpty(),
    check("content").not().isEmpty(),
    check("event_date").isISO8601(),
], verifyToken, checkAdmin, addEvents);

router.get("/get-events", setCacheControl, getEvents);

module.exports = router;
