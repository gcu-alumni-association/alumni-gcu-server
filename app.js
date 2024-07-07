const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const cors = require('cors');
const helmet = require("helmet");
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");

require('dotenv').config();

const app = express();

// Middleware setup
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('combined')); //Used for Logging

//Rate Limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per `window` 
});
app.use(limiter); // Apply the rate limiting middleware to all requests

//Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

//User Routes
const authRoutes = require('./routes/user-routes');
app.use('/api/auth', authRoutes);

//News Routes
const newsRoutes = require('./routes/news-routes');
app.use('/api/news', newsRoutes);

//Error handling middleware
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ error: "Something went wrong"});
});

//Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});