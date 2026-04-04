//require dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./db");
require("dotenv").config();
const { extractPublicId } = require("./helpers");

//Initialize app and connect to db
const app = express();
connectDB();

const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Configure Cloudinary with your .env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Set up the storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'first_blog_images',
    allowedFormats: ['jpeg', 'png', 'jpg'], // Only allow these file types
  },
});

// 3. Initialize Multer with this storage
const upload = multer({ storage: storage });

//middleware
app.use(cors());
app.use(express.json()); // for getting json req body

//the model(post schema)
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A blog post must have a title"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    image: {
      type: String,
      required: [true, "Image is required to create a blog"],
    },
    status:{
      type: String,
      enum: ["draft", "publish"],
      required: [true, "status is required"],
    }
  },
  { timestamps: true },
);

const Post = mongoose.model("Post", postSchema);
// 1. It turns a "Blueprint" into a "Machine"
//2. The Naming Magic (Pluralization):Look closely at the first argument: 'Post'. Mongoose does
// something very clever here. It takes that singular, capitalized string 'Post', forces it to
// lowercase, and adds an "s" to the end.
//3. It gives you your CRUD superpowers

//routes-all CRUD operations

//test api
app.get('/', async(req, res)=>{
  res.status(200).json({message: 'api working fine'})
})

// get all posts 
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({message: error.message})
  }
});

//get single post
app.get('/api/posts/:id', async(req,res)=>{
  try {
  const id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({message: "Invalid blog id"});
    };

    const post = await Post.findById(id);

    if(!post){
      return res.status(404).json({message: "Blog post not found"});
    }

    res.status(200).json(post);
    
  } catch (error) {
    res.status(500).json({error: error.message})
  }
})

//create post
app.post('/api/posts', upload.single('image'), async(req,res)=>{
  try {
   const { title, description, image, status } = req.body;

   // req.file is created by Multer. 
    // req.file.path is the live Cloudinary URL!
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const imageUrl = req.file.path;
   
   const newPost = await Post.create({
      title,
      description,
      image: imageUrl,
      status
    });

   res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({message: error.message})
  }
})

//update post
app.patch('/api/posts/:id', upload.single('image'), async (req, res)=>{
  try {
    const id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)) {
       return res.status(400).json({ message: "Invalid blog post ID format" });
    }

    // Find the existing post FIRST (Before we do anything else)
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // 1. Grab all the text fields sent in the request
    const updateData = { ...req.body };

    // 2. Check if a NEW image was uploaded
    if (req.file) {
      // A. Delete the OLD image from Cloudinary using the existingPost data
      if (existingPost.image) {
        const publicId = extractPublicId(existingPost.image);
        await cloudinary.uploader.destroy(publicId);
      }

      // B. Attach the NEW image URL to our update object
      updateData.image = req.file.path;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id, //who to update
      updateData, //what to update it with
      { returnDocument: 'after', runValidators: true } // Options
    );

     res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({message: error.message});
  }
})

//delete post
app.delete('/api/posts/:id', async(req, res)=>{
  try {
      // get id
  const id = req.params.id;
//check id validity
if(!mongoose.Types.ObjectId.isValid(id)){
 return res.status(400).json({message: "Invalid blog post ID format" })
}
//filter through posts and delete the post with that id
   // 1. Find the post FIRST (before deleting it) so we can get the image URL
    const postToDelete = await Post.findById(id);

    
    if(!postToDelete){
      return res.status(404).json({message: "Blog Post not found"})
    }

      // 2. Extract the public_id and delete the image from Cloudinary
    if (postToDelete.image) {
      const publicId = extractPublicId(postToDelete.image);
      await cloudinary.uploader.destroy(publicId); 
    }

       // 3. NOW delete the post from the MongoDB database
    await Post.findByIdAndDelete(id);

//return deleted id response
res.status(200).json({message: "Blog post deleted successfully"})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
});


//app under maintenace

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  }, 
  password: {
    type: String,
    required: true
  },
  role:{
    type: String,
    required: true
  }
})

const Admin = mongoose.model('Admin', adminSchema)

//admin login
app.post('/api/admin/login', async (req, res)=>{
  try {
    //get the email and password from the req
    const {email, password} = req.body;
    // Check if an admin with this email exists in the DB
    const adminUser = await Admin.findOne({email: email});

    if(!adminUser){
      return res.status(401).json({error: "Invalid email or password"})
    }

         //check role
    if(adminUser.role !== "badmin"){
      return res.status(401).json({message: "User not authorized to perform this action"})
    }

    //check if password matches with the password in the DB
    if(adminUser.password !== password){
      return res.status(401).json({message: "Invalid email or password"})
    }

    //if passwords matches, login
    res.status(200).json({data:adminUser, message: "Login successful"})

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// admin change password 
app.patch('/api/admin/change-password', async (req, res)=> {
  try {
      const {email, old_password, new_password} = req.body;

    // 1. Find the admin by email
    const adminUser = await Admin.findOne({email: email});

    // If no admin is found, stop here
    if(!adminUser){
     return res.status(404).json({message: "Admin account not found"})
    };

    //check role
    if(adminUser.role !== "badmin"){
      return res.status(401).json({message: "User not authorized to perform this action"})
    }

    // 2. Verify the current password is correct
    if(adminUser.password !== old_password){
      return res.status(401).json({message: "Incorrect current password"})
    }

    // 3. Prevent them from changing it to the exact same password
    if(old_password == new_password){
      return res.status(400).json({message: "New password must be different from the old one"})
    }

    // 4. Update the password and save it to the database
    adminUser.password = new_password;
    await adminUser.save(); // This tells Mongoose to update this specific document

    res.status(200).json({message: "Password updated successfully!"});
  
  } catch (error) {
    res.status(500).json({message: error.message})
  }

})

// admin log out 


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  console.log(`Server is up and listening on port ${PORT}`);
})