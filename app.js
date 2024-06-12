const express = require("express");
const mongoose = require("mongoose");
const router = require('./routes/user-routes');
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "http://localhost:3000" , credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api', router);

//connecting the mongoDB atlas to the project
//mongoDB pass= admingcu
mongoose.connect("mongodb+srv://admin:admingcu@cluster0.gto5c5s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(() =>{
    app.listen(5000);    
})
.catch((err) => console.log(err));

