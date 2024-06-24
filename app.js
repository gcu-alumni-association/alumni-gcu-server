const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}
));

mongoose.connect("mongodb+srv://admin:admingcu@cluster0.gto5c5s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const authRoutes = require('./routes/user-routes');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});