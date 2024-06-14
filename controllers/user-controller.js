// const User = require("../model/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const JWT_SECRET_KEY = "AlumniGCU";      //later we need to add this in the ".env" file as this key needs to be hidden from the user

// const signup = async(req, res, next) => {
//     const {name, email, password} = req.body;
    
//     //Email already exists validation
//     let existingUser;
//     try {
//         existingUser = await User.findOne({ email: email });
//     } catch(err) {
//         console.log(err);
//     }
//     if(existingUser) {
//         return res.status(400).json({message: "User already exists!"})
//     }

//     //hashing the password
//     const hashedPassword = bcrypt.hashSync(password);

//     //sending user details to database
//     const user = new User({
//         name,
//         email,
//         password: hashedPassword,
//     });
//     try {
//         await user.save();
//     } catch(err) {
//         console.log(err);
//     }
//     return res.status(201).json({message:user})
// };

// const login = async(req, res, next) => {
//     const {email,password} = req.body;

//     let existingUser;
//     try {
//         existingUser = await User.findOne({ email: email });
//     } catch(err) {
//         return new Error(err);
//     }
//     if(!existingUser) {
//         return res.status(400).json({message: "User not found!"})
//     }
    
//     const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
//     if(!isPasswordCorrect){
//         return res.status(400).json({message: "Invalid password!"})
//     }
//     //creating the jwt token with a given time validity
//     const token = jwt.sign({id: existingUser._id}, JWT_SECRET_KEY, {
//         expiresIn: "60s"
//     });

//     //setting up cookie for security of user
//     res.cookie(String(existingUser._id), token, {
//         path: "/",
//         expires: new Date(Date.now() + 1000 * 60),
//         httpOnly: true,
//         sameSite: 'lax'
//     });

//     return res.status(200).json({message:"Login Successful", user: existingUser, token});
// };

// //verifying the user token and getting the user id
// const verifyToken = (req, res, next) => {
//     const cookies = req.headers.cookie;
//     const token = cookies.split('=')[1];
//     console.log(token); //need to remove it
//     if (!token) {
//         res.status(404).json({ message: "No token provided!" });
//     }
//     jwt.verify(String(token), JWT_SECRET_KEY, (err, user) => {
//         if (err) {
//             return res.status(400).json({ message: "Invalid token!" });
//         }
//         console.log(user.id);
//         req.id = user.id;
//     });
//     next();
// };


// const getUser = async (req, res, next) => {
//     const userId = req.id;
//     let user;
//     try {
//         user = await User.findById(userId, "-password");
//     } catch (err) {
//         return new Error(err);
//     }
//     if (!user) {
//         return res.status(404).json({message: "User not found!"});
//     }
//     console.log(user)
//     return res.status(200).json({ user });
// };



// exports.signup = signup;
// exports.login = login;
// exports.verifyToken = verifyToken;
// exports.getUser = getUser;