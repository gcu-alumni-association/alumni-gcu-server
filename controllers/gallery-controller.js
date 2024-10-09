const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require("express-validator");
const Gallery = require('../model/Gallery'); 

// Helper function to create gallery album folder
async function createGalleryAlbumFolder(albumName) {
  const folderName = albumName.toLowerCase().replace(/\s+/g, '-');
  const folderPath = path.join(__dirname, '..', 'uploads', 'gallery', folderName);
  
  await fs.mkdir(folderPath, { recursive: true });
  
  return folderPath;
}

const uploadImageForGallery = async (req, res) => {
    if (!req.filesLocations || req.filesLocations.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
  
    try {
      const imageFolderPath = await createGalleryAlbumFolder(req.body.albumName);
      const newGallery = new Gallery({
        albumName: req.albumName,
        images: req.filesLocations,
        imageFolder: path.basename(imageFolderPath),
      });
  
      await newGallery.save();
  
      res.status(201).json({
        message: "Images uploaded successfully",
        gallery: newGallery
      });
    } catch (err) {
      console.error('Error in uploadImageForGallery:', err);
      res.status(500).json({ message: "An error occurred", error: err.toString() });
    }
  };

const getImagesForGallery = async (req, res) => {
  try {
    const galleries = await Gallery.find().select('albumName images date');
    //making galleries to only return the first image in the images array
    const optimizedGalleries = galleries.map(gallery => ({
        _id: gallery._id,
        albumName: gallery.albumName,
        date: gallery.date,
        firstImage: gallery.images[0] //sending the first image
      }));
  
      res.json(optimizedGalleries);
    } catch (err) {
      res.status(500).json({ message: "Unable to fetch images", error: err.message });
    }
  };

const getSingleAlbum = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id).select('albumName images date');
    if (!gallery) {
      return res.status(404).json({ message: "Album not found" });
    }
    res.json(gallery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllImages = async (req, res) => {
    try {
      const galleries = await Gallery.find().select('albumName images date');
      
      // Flatten the array of images from all galleries
      const allImages = galleries.reduce((acc, gallery) => {
        return acc.concat(gallery.images.map(image => ({
          image
        })));
      }, []);
  
      // Sort images by date, newest first
      allImages.sort((a, b) => b.date - a.date);
  
      res.json(allImages);
    } catch (err) {
      console.error('Error in getAllImages:', err);
      res.status(500).json({ message: "Unable to fetch all images", error: err.message });
    }
  };

module.exports = {  
                    uploadImageForGallery, 
                    getImagesForGallery,
                    getSingleAlbum,
                    getAllImages 
                };