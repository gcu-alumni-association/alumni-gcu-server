// routes/feedback.js
const express = require('express');
const Feedback = require('../model/Feedback');
const { verifyToken, checkAdmin } = require('../middleware/verify-token');
const router = express.Router();

// POST: Submit feedback
router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const feedback = new Feedback({
      name,
      email,
      subject,
      message,
    });
    
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error });
  }
});

// GET: Fetch all feedbacks (Admin only)
router.get('/', verifyToken, checkAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ date: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve feedback', error });
  }
});

// DELETE: Delete feedback by ID (Admin only)
router.delete('/:id', verifyToken, checkAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete feedback', error });
  }
});

module.exports = router;
