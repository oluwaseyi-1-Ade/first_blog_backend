const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./db');
require('dotenv').config();

// 1. Initialize App & Connect to Database
const app = express();
connectDB();

// 2. Middleware
app.use(cors()); // Allows your future frontend to talk to this API
app.use(express.json()); // Allows Express to read JSON data sent in requests

// ==========================================
// 3. THE MODEL (Database Schema)
// ==========================================
const postSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'A blog post must have a title'] 
  },
  content: { 
    type: String, 
    required: [true, 'A blog post must have content'] 
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

const Post = mongoose.model('Post', postSchema);

// ==========================================
// 4. THE ROUTES & LOGIC (CRUD Operations)
// ==========================================

// READ: Get all blog posts
app.get('/api/posts', async (req, res) => {
  try {
    // .sort({ createdAt: -1 }) ensures the newest posts show up first
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE: Add a new blog post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const newPost = await Post.create({
      title,
      content
    });

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//update 
app.patch('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 1. THE NEW SHIELD: Check if the ID format is mathematically valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog post ID format" });
    }

    // 2. Now it is safe to talk to the database
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    // 3. Check if the ID format was valid, but the post was already deleted
    if (!updatedPost) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // 4. Success!
    res.status(200).json(updatedPost);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//delete
// DELETE: Remove a blog post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 1. The Mongoose Superpower for Deleting
    const deletedPost = await Post.findByIdAndDelete(id);

    // 2. Check if the post actually existed
    if (!deletedPost) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // 3. Send a success message back to the frontend
    res.status(200).json({ message: "Blog post deleted successfully" });

  } catch (error) {
    // If the ID is completely invalid (e.g., wrong length), it lands here
    res.status(400).json({ message: error.message });
  }
});



// Admin Change Password Route
app.patch('/api/admin/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // 1. Find the admin by email
    const adminUser = await Admin.findOne({ email: email });

    // If no admin is found, stop here
    if (!adminUser) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    // 2. Verify the current password is correct
    if (adminUser.password !== currentPassword) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // 3. Prevent them from changing it to the exact same password
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the old one" });
    }

    // 4. Update the password and save it to the database
    adminUser.password = newPassword;
    await adminUser.save(); // This tells Mongoose to update this specific document

    res.status(200).json({ message: "Password updated successfully!" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 5. START THE SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`);
});