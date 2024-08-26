const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
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
  limits: { fileSize: 5 * 1024 * 1024 } //5MB limit
});

const uploadImage = async (req, res, next) => {
  if (!req.file) {
    console.log('No file uploaded');
    return next(); //continue without uploading if no file is present
  }

  const bucketName = process.env.S3_BUCKET_NAME;

  if (!bucketName) {
    console.error("Bucket name is not set.");
    return res.status(500).send({ message: "Bucket name is not set in environment variables." });
  }

  const params = {
    Bucket: bucketName,
    Key: `${Date.now()}_${req.file.originalname}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: 'public-read'
  };

  try {
    const s3Data = await s3.upload(params).promise();
    console.log('File uploaded successfully:', s3Data.Location);
    req.file.location = s3Data.Location;
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