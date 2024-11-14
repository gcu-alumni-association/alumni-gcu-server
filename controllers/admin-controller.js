const User = require('../model/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require("express-validator"); //For validation
const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const AlumniRecord = require('../model/AlumniRecord');


// const register = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//     const { name, email, phone, batch, branch } = req.body;
//     try {
//       const user = new User({ name, email, phone, batch, branch });
//       await user.save();  
//       console.log('New user registration pending approval:', user); 
//       res.status(201).json({ message: 'Registration successful, pending admin approval.' });
//     } catch (error) {
//       res.status(500).json({ error: 'Server error' });
//     }
//   };

  
const pendingUsers = async (req, res) => {
      try {
      const users = await User.find({ isVerified: false });
      res.json(users);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const approvedUsers = async (req, res) => {
  const { batch, branch } = req.query; // Extract batch and branch from query params

  try {
    const filter = { isVerified: true };

    if (batch) {
      filter.batch = Number(batch); // Add batch filter if provided
    }
    if (branch) {
      filter.branch = branch; // Add branch filter if provided
    }

    const users = await User.find(filter).select('-password -__v -_id -isVerified -role');
    res.json(users);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const approve = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email } = req.body;
  
    try {
      // Find the user by email in the database
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Approve the user by setting isVerified to true
      user.isVerified = true;
      await user.save();
  
      res.json({ message: 'User approved successfully' });
    } catch (error) {
      console.error('Approval process error:', error);
      res.status(500).json({ error: 'Server error' });
    }
};
  
const rejectUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    try {
        // Find the user by email in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete the user from the database
        await User.deleteOne({ email });
        
        res.json({ message: 'User rejected and deleted successfully' });
    } catch (error) {
        console.error('Reject user process error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const sendEmail = async (users, emailContent, subject) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mayra.rau74@ethereal.email',
        pass: 'CssjERRDPCrwvKxt23'
      }
    });

    // Ensure `users` is an array even if a single user is passed
    const recipients = Array.isArray(users) ? users : [users];

    // Loop through users and send email to each one
    for (let user of recipients) {
      const mailOptions = {
        from: 'mayra.rau74@ethereal.email',
        to: user.email,  // Send to the current user's email
        subject: subject || 'Notification',  // Subject provided or default
        text: emailContent || `Your account has been updated.`,  // Default message or provided email content
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${user.email}:`, info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send email(s)');
  }
};


const upload = multer({ dest: 'uploads/' });

const requiredHeaders = ['name', 'roll_no', 'batch', 'branch'];

// Bulk insert alumni data from CSV
const bulkAddAlumni = async (req, res) => {
  const filePath = req.file.path;
  const alumniData = [];
  let validationError = false;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headers) => {
      const invalidHeaders = headers.filter(header => !requiredHeaders.includes(header));
      if (invalidHeaders.length > 0 || headers.length !== requiredHeaders.length) {
        validationError = true;
        return res.status(400).json({ error: 'Invalid CSV format. Required headers: name, roll_no, batch, branch.' });
      }
    })
    .on('data', (row) => {
      if (!validationError) {
        const { name, roll_no, batch, branch } = row;

        // Validate row data
        if (!name || !roll_no || !batch || !branch) {
          validationError = true;
          return res.status(400).json({ error: `Invalid data in row: ${JSON.stringify(row)}` });
        }

        // Validate batch year
        const currentYear = new Date().getFullYear();
        if (isNaN(batch) || batch < 2006 || batch > currentYear + 4) {
          validationError = true;
          return res.status(400).json({ error: `Invalid batch year in row: ${JSON.stringify(row)}. Batch must be between 2006 and ${currentYear + 4}.` });
        }

        alumniData.push(row);
      }
    })
    .on('end', async () => {
      if (!validationError) {
        try {
          console.log('Alumni data to insert:', alumniData); // Log data for insertion
          await AlumniRecord.insertMany(alumniData);
          res.status(201).json({ message: 'Alumni records added successfully.' });
        } catch (error) {
          console.error('Error inserting records:', error); // Detailed logging
          res.status(500).json({ error: 'Failed to add alumni records.' });
        } finally {
          fs.unlinkSync(filePath); // Clean up
        }
      }
    })
    .on('error', (error) => {
      console.error('Error processing the file:', error);
      res.status(500).json({ error: 'Error processing the file.' });
      fs.unlinkSync(filePath); // Clean up
    });
};




module.exports = {
    approve,
    pendingUsers,
    rejectUser,
    sendEmail, 
    approvedUsers,
    bulkAddAlumni
}
