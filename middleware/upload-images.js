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
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

const uploadImage = async (req, res, next) => {
  console.log('Entering uploadImage function');
  console.log('Request body:', req.body);
  console.log('Files:', req.files);

  if ((!req.files || req.files.length === 0) && ['news', 'events'].includes(req.body.category)) {
    console.log(`No files uploaded for ${req.body.category}`);
    req.filesLocations = []; 
    next();
    return;
  }
  // For other categories or if files exist, keep existing validation
  if (!req.files || req.files.length === 0) {
    console.log('No files uploaded');
    return res.status(400).send({ message: "No files uploaded" });
  }

  try {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const category = req.body.category; 
    if (!category) {
      return res.status(400).send({ message: "Category is required!!" });
    }

    let categoryDir;
    let subfolderName;
    if (category === 'gallery') {
      if (!req.body.albumName) {
        return res.status(400).send({ message: "Album name is required for gallery uploads!!" });
      }
      subfolderName = req.body.albumName.toLowerCase().replace(/\s+/g, '-');
      categoryDir = path.join(uploadDir, category, subfolderName);
      console.log('Gallery category dir:', categoryDir);
    } else if (['events', 'news'].includes(category) && req.body.title) {
      subfolderName = req.body.title.toLowerCase().replace(/\s+/g, '-');
      categoryDir = path.join(uploadDir, category, subfolderName);
      console.log(`${category} category dir:`, categoryDir);
    } else {
      categoryDir = path.join(uploadDir, category);
      console.log('Category dir:', categoryDir);
    }

    // Ensure the category directory exists
    await fs.mkdir(categoryDir, { recursive: true });
    console.log('Directory created/ensured:', categoryDir);

    // Process each file
    const uploadedFiles = await Promise.all(req.files.map(async (file, index) => {
      console.log(`Processing file ${index + 1}:`, file.originalname);

      const compressedImage = await sharp(file.buffer)
        .resize({ width: 800 })
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toBuffer();

      const filename = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const filepath = path.join(categoryDir, filename);

      await fs.writeFile(filepath, compressedImage);
      console.log('File saved to:', filepath);

      // Adjust the returned path based on the category
      let returnPath;
      if (['events', 'news', 'gallery'].includes(category) && subfolderName) {
        returnPath = `/uploads/${category}/${subfolderName}/${filename}`;
      } else {
        returnPath = `/uploads/${category}/${filename}`;
      }
      console.log('Return path:', returnPath);
      return returnPath;
    }));

    req.filesLocations = uploadedFiles;
    req.albumName = req.body.albumName;  // Pass albumName to the next middleware
    console.log('File locations saved to req.filesLocations:', req.filesLocations);
    next();
  } catch (err) {
    console.error("Error in uploadImage:", err);
    res.status(500).send({ message: "An error occurred", error: err.toString() });
  }
};

module.exports = { upload, uploadImage };