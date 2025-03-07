const express = require("express");
const router = express.Router();
const Visitor = require("../model/Visitor");

// Increment visitor count
router.post("/", async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndUpdate(
      {}, // Find any document
      { $inc: { count: 1 } }, // Increment count
      { new: true, upsert: true } // Create if it doesn't exist
    );
    res.status(200).json({ totalVisitors: visitor.count });
  } catch (error) {
    console.error("Error updating visitor count:", error);
    res.status(500).json({ error: "Failed to update visitor count" });
  }
});

// Fetch visitor count
router.get("/", async (req, res) => {
  try {
    let visitor = await Visitor.findOne({});
    if (!visitor) {
      visitor = await Visitor.create({ count: 0 }); // Ensure document exists
    }
    res.status(200).json({ totalVisitors: visitor.count });
  } catch (error) {
    console.error("Error fetching visitor count:", error);
    res.status(500).json({ error: "Failed to fetch visitor count" });
  }
});


module.exports = router;
