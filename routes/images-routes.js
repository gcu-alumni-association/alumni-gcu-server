const express = require('express');
const router = express.Router();
const Photos = require('../model/Photos');

// Middleware to set Cache-Control header
const setCacheControl = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  next();
};

router.get('/photos', setCacheControl, async (req, res) => {
  try {
    const photos = await Photos.find({});
    const photoUrls = photos.map(photo => photo.url);
    res.status(200).json(photoUrls);
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ message: 'An error occurred while fetching photos' });
  }
});

module.exports = router;
