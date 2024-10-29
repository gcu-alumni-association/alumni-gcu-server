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
    
    //checking if an album with the same name already exists
    let gallery = await Gallery.findOne({ albumName: req.body.albumName });

    const currentDate = new Date();

    if (gallery) {
      //if the album exists, we update it
      gallery.images = [...gallery.images, ...req.filesLocations];
      gallery.date = currentDate; //uppdating the date also
    } else {
      //if the album doesn't exist, we create a new one
      gallery = new Gallery({
        albumName: req.body.albumName,
        images: req.filesLocations,
        imageFolder: path.basename(imageFolderPath),
        date: currentDate 
      });
    }

    await gallery.save();

    res.status(201).json({
      message: gallery.isNew ? "Album created and images uploaded successfully" : "Images added to existing album successfully",
      gallery: gallery
    });
  } catch (err) {
    console.error('Error in uploadImageForGallery:', err);
    res.status(500).json({ message: "An error occurred", error: err.toString() });
  }
};

const getImagesForGallery = async (req, res) => {
  try {
    const galleries = await Gallery.find().select('albumName images date');
     //making galleries to only return the last image in the images array
    const optimizedGalleries = galleries.map(gallery => {
      const lastImageIndex = gallery.images.length - 1;
      return {
        _id: gallery._id,
        albumName: gallery.albumName,
        date: gallery.date,
        lastImage: gallery.images[lastImageIndex] // sending the last image
      };
    });

    res.json(optimizedGalleries);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch images", error: err.message });
  }
};

const getAlbumNames = async (req, res) => {
  try {
    const albumNames = await Gallery.find().select('albumName');
    res.json(albumNames);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch album names", error: err.message });
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

  const deleteSelectedImages = async (req, res) => {
    const { albumId, selectedImages } = req.body;
  
    if (!albumId || !selectedImages || !Array.isArray(selectedImages)) {
      return res.status(400).json({ message: "Invalid request. Album ID and selected images are required" });
    }
  
    try {
      // Find the gallery album
      const gallery = await Gallery.findById(albumId);
      if (!gallery) {
        return res.status(404).json({ message: "Album not found" });
      }
  
      const basePath = path.join(__dirname, '..');
  
      // Delete selected images from filesystem
      const deletePromises = selectedImages.map(async (imageUrl) => {
        const relativePath = imageUrl.replace(/^\/uploads/, '');
        const absolutePath = path.join(basePath, 'uploads', relativePath);
  
        try {
          await fs.unlink(absolutePath);
          return imageUrl;
        } catch (err) {
          console.error(`Error deleting file ${absolutePath}:`, err);
          return null;
        }
      });
  
      const deletedFiles = await Promise.all(deletePromises);
      const successfullyDeleted = deletedFiles.filter(url => url !== null);
  
      // Update gallery document by removing deleted images
      gallery.images = gallery.images.filter(image => !successfullyDeleted.includes(image));
      await gallery.save();
  
      // Check if album is empty and delete folder if it is
      if (gallery.images.length === 0) {
        const albumFolderPath = path.join(basePath, 'uploads', 'gallery', gallery.imageFolder);
        try {
          await fs.rmdir(albumFolderPath);
          // If album is empty, delete the album document as well
          await Gallery.findByIdAndDelete(albumId);
          return res.json({
            message: "Album deleted successfully as it had no images",
            deletedImages: successfullyDeleted,
            albumDeleted: true
          });
        } catch (err) {
          console.error('Error deleting album folder:', err);
        }
      }
  
      res.json({
        message: "Selected images deleted successfully",
        deletedImages: successfullyDeleted,
        remainingImages: gallery.images,
        albumDeleted: false
      });
  
    } catch (err) {
      console.error('Error in deleteSelectedImages:', err);
      res.status(500).json({ message: "An error occurred", error: err.toString() });
    }
  };

// New function to delete entire album
const deleteAlbum = async (req, res) => {
  const { albumId } = req.params;

  if (!albumId) {
    return res.status(400).json({ message: "Album ID is required" });
  }

  try {
    // Find the gallery album
    const gallery = await Gallery.findById(albumId);
    if (!gallery) {
      return res.status(404).json({ message: "Album not found" });
    }

    const basePath = path.join(__dirname, '..');

    // Delete all images from filesystem
    const deletePromises = gallery.images.map(async (imageUrl) => {
      const relativePath = imageUrl.replace(/^\/uploads/, '');
      const absolutePath = path.join(basePath, 'uploads', relativePath);

      try {
        await fs.unlink(absolutePath);
        return true;
      } catch (err) {
        console.error(`Error deleting file ${absolutePath}:`, err);
        return false;
      }
    });

    await Promise.all(deletePromises);

    // Delete the album folder
    const albumFolderPath = path.join(basePath, 'uploads', 'gallery', gallery.imageFolder);
    try {
      await fs.rmdir(albumFolderPath);
    } catch (err) {
      console.error('Error deleting album folder:', err);
    }

    // Delete the album document from MongoDB
    await Gallery.findByIdAndDelete(albumId);

    res.json({
      message: "Album deleted successfully",
      albumDeleted: true
    });

  } catch (err) {
    console.error('Error in deleteAlbum:', err);
    res.status(500).json({ message: "An error occurred", error: err.toString() });
  }
};

module.exports = {  
                    uploadImageForGallery, 
                    getImagesForGallery,
                    getSingleAlbum,
                    getAllImages,
                    getAlbumNames,
                    deleteSelectedImages,
                    deleteAlbum
                };