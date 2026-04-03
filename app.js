//require dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./db");
require("dotenv").config();

//Initialize app and connect to db
const app = express();
connectDB();

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
app.post('/api/posts', async(req,res)=>{
  try {
   const { title, description, image } = req.body;
   
   const newPost = await Post.create({
      title,
      description,
      image
    });

   res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({message: error.message})
  }
})

//update post
app.patch('/api/posts/:id', async (req, res)=>{
  try {
    const id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)) {
       return res.status(400).json({ message: "Invalid blog post ID format" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id, //who to update
      req.body, //what to update it with
      { new: true, runValidators: true } // Options
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Blog post not found" });
    }

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
const deletedPost = await Post.findByIdAndDelete(id);

if(!deletedPost){
  return res.status(404).json({message: "Blog Post not found"})
}
//return deleted id response
res.status(200).json({message: "Blog post deleted successfully"})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
});

// admin profile
// admin login
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
      // 401- unauthorised
      return res.status(401).json({error: "Invalid email or password"})
    }

    //check if password matches with the password in the DB
    if(adminUser.password !== password){
      return res.status(401).json({error: "Invalid email or password"})
    }

    //if passwords matches, login
    res.status(200).json({message: "Login successful"})

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// admin change password 
// app.patch('/api/admin/change-password', async (req, res)=> {
//   const {old_password, new_password} = req.body;

//     // 1. Find the admin by email
//     // If no admin is found, stop here
//     // 2. Verify the current password is correct
//     // 3. Prevent them from changing it to the exact same password
//     // 4. Update the password and save it to the database
  
// })


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  console.log(`Server is up and listening on port ${PORT}`);
})