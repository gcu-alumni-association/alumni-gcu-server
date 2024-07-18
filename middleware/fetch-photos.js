const Photos = require('../model/Photos'); 

const fetchPhotos = async (req, res, next) => {
  try {
    //Fetch all photo documents from MongoDB
    const photos = await Photos.find({});

    //Extract only the URLs from the photos documents
    const photoUrls = photos.map(photo => photo.url);

    req.photoUrls = photoUrls; //Store photo URLs in the request object
    next();
  } catch (err) {
    console.error('Error fetching photo URLs:', err);
    res.status(500).json({ message: 'An error occurred while fetching photo URLs' });
  }
};

module.exports = fetchPhotos;
