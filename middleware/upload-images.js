const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Updated uploadImage function to handle multiple images
const uploadImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    console.log('No files uploaded');
    return next(); // continue without uploading if no files are present
  }

  try {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const category = req.body.category || 'gallery'; // Default to 'gallery' if not specified
    const categoryDir = path.join(uploadDir, category);

    // Ensure the category directory exists
    await fs.mkdir(categoryDir, { recursive: true });

    // Process each file
    const uploadedFiles = await Promise.all(req.files.map(async (file) => {
      const compressedImage = await sharp(file.buffer)
        .resize({ width: 800 })
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toBuffer();

      const filename = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const filepath = path.join(categoryDir, filename);

      await fs.writeFile(filepath, compressedImage);
      console.log('File uploaded successfully:', filepath);

      return `/uploads/${category}/${filename}`; // Store the location of the uploaded file
    }));

    req.filesLocations = uploadedFiles; // Save the locations to the request object for further use
    next();
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ message: "An error occurred", error: err });
  }
};

module.exports = { 
  uploadImage,
  upload
};