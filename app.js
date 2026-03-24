//require dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const connectDB = require('./db')
require('dotenv').config();

//Initialize app and connect to db
const app = express();
connectDB();

//middleware
app.use(cors());
app.use(express.json())

//the model(post schema)
const postSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, 'A blog post must have a title']
    },
    description: {
        type: String,
        required:[true, 'Description is required']
    },
    image:{
        type: String,
        required:[true, 'Image is required to create a bog']
    }
}, {timestamps: true})