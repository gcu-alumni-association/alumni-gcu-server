const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const { addEvents, getEvents } = require('../controllers/events-controller.js')

router.post("/upload", [
    check("title").not().isEmpty(),
    check("content").not().isEmpty(),
    check("event_date").isISO8601(),
], verifyToken, checkAdmin, addEvents );

router.get("/get-events", getEvents);

module.exports = router;