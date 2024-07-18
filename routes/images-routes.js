const express = require('express');
const router = express.Router();
const fetchPhotos = require('../middleware/fetch-photos'); 
const Photos = require('../model/Photos');

router.get('/photos', async (req, res) => {
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
