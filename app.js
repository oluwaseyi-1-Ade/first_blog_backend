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




const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  console.log(`Server is up and listening on port ${PORT}`);
})