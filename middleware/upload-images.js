const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();
const Photos = require('../model/Photos'); 


// AWS and multer configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadImage = async (req, res) => {
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
    //Uploading file to S3
    const s3Data = await s3.upload(params).promise();
    console.log('File uploaded successfully:', s3Data.Location);

    //Saving URL to MongoDB
    const newPhoto = new Photos({
      url: s3Data.Location
    });

    await newPhoto.save();
    console.log('Photo URL saved to MongoDB');

    res.status(200).send(`File uploaded successfully. ${s3Data.Location}`);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send({ message: "An error occurred", error: err });
  }
};

module.exports = { 
  uploadImage,
  upload
}