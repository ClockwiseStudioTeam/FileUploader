const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['https://trifile.netlify.app', 'https://www.trifile.netlify.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// File model
const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const File = mongoose.model('File', FileSchema);

// Configure multer storage for Netlify Functions
// Since we can't write to the filesystem in Netlify Functions,
// we'll use memory storage and then upload to MongoDB
const storage = multer.memoryStorage();

// File filter to accept only PDFs and other document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, and image files are allowed.'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload file route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUuid = uuidv4();
    const fileExt = path.extname(req.file.originalname);
    const filename = `${fileUuid}${fileExt}`;
    
    // For Netlify, we'll store the file data in MongoDB directly
    // In a production environment, you'd want to use a proper file storage service like AWS S3
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
    const fileUrl = `${baseUrl}/api/files/${fileUuid}`;

    // Create a new file document in MongoDB
    const file = new File({
      filename: filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uuid: fileUuid,
      path: `/api/files/${fileUuid}`,
      url: fileUrl,
      data: req.file.buffer // Store the file data in MongoDB
    });

    await file.save();

    // Return the file information
    return res.status(201).json({
      success: true,
      file: {
        id: file._id,
        uuid: file.uuid,
        originalname: file.originalname,
        url: file.url
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Server error during file upload' });
  }
});

// Get file by UUID
app.get('/files/:uuid', async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // If this is a data request (not metadata)
    if (req.query.data === 'true' && file.data) {
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalname}"`);
      return res.send(file.data);
    }
    
    return res.json({
      success: true,
      file: {
        id: file._id,
        uuid: file.uuid,
        originalname: file.originalname,
        url: file.url,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return res.status(500).json({ error: 'Server error while retrieving file' });
  }
});

// Get all files
app.get('/files', async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      count: files.length,
      files: files.map(file => ({
        id: file._id,
        uuid: file.uuid,
        originalname: file.originalname,
        url: file.url,
        mimetype: file.mimetype,
        createdAt: file.createdAt
      }))
    });
  } catch (error) {
    console.error('Error retrieving files:', error);
    return res.status(500).json({ error: 'Server error while retrieving files' });
  }
});

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'PDF Uploader API is running' });
});

// Export the serverless function
module.exports.handler = serverless(app); 