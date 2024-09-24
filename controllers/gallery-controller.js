const path = require('path');
const fs = require('fs').promises;

const uploadImageForGallery = async (req, res) => {
    if (!req.filesLocations || req.filesLocations.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    try {
        // Log and respond with the paths of all uploaded files
        console.log("Photos saved locally:", req.filesLocations);
        res.status(201).json({
            message: "Images uploaded successfully",
            filePaths: req.filesLocations // Send back the paths of uploaded images
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getImagesForGallery = async (req, res) => {
    try {
        const galleryDir = path.join(__dirname, '..', 'uploads', 'gallery');
        const files = await fs.readdir(galleryDir);

        // Map file names to URLs for serving to the client
        const images = files.map(file => `/uploads/gallery/${file}`);
        
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch images", error: err.message });
    }
};

module.exports = { uploadImageForGallery, getImagesForGallery };
