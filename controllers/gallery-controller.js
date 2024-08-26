const Photos = require("../model/Photos");

const uploadImageForGallery = async (req, res) => {
	const photos = new Photos({
		url: req.file ? req.file.location : null,
	});
	try {
		const newPhotos = await photos.save();
		res.status(201).json(newPhotos);
		console.log("Photo uploaded to s3 and url saved to MongoDB:", newPhotos);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

const getImagesForGallery = async (req, res) => {
	try {
		const photos = await Photos.find().select('url');
		res.json(photos);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

module.exports = { uploadImageForGallery, getImagesForGallery };
