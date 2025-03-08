const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  try {
    const client = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    cachedDb = client;
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// File model
const FileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  uuid: { type: String, unique: true },
  path: String,
  url: String,
  data: Buffer,
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.models.File || mongoose.model('File', FileSchema);

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('file');

// Routes
const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'PDF Uploader API is running' });
});

// Upload file route
router.post('/upload', (req, res) => {
  console.log('Upload request received');
  
  upload(req, res, async function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }
    
    try {
      await connectToDatabase();
      
      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUuid = uuidv4();
      const fileExt = path.extname(req.file.originalname);
      const filename = `${fileUuid}${fileExt}`;
      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      const fileUrl = `${baseUrl}/api/files/${fileUuid}`;

      console.log('Creating file document:', {
        filename,
        originalname: req.file.originalname,
        size: req.file.size,
        uuid: fileUuid
      });

      const file = new File({
        filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uuid: fileUuid,
        path: `/api/files/${fileUuid}`,
        url: fileUrl,
        data: req.file.buffer
      });

      await file.save();
      console.log('File saved successfully:', fileUuid);

      return res.status(201).json({
        success: true,
        file: {
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
});

// Get file by UUID
router.get('/files/:uuid', async (req, res) => {
  try {
    await connectToDatabase();
    const file = await File.findOne({ uuid: req.params.uuid });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (req.query.data === 'true' && file.data) {
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalname}"`);
      return res.send(file.data);
    }
    
    return res.json({
      success: true,
      file: {
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

// Use the router
app.use('/', router);

// Export the serverless function
module.exports.handler = serverless(app); 