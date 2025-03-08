const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.FILE_UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const fileUuid = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `${fileUuid}${fileExt}`);
  }
});

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
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUuid = path.parse(req.file.filename).name;
    const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Create a new file document in MongoDB
    const file = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uuid: fileUuid,
      path: req.file.path,
      url: fileUrl
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
router.get('/files/:uuid', async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
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
router.get('/files', async (req, res) => {
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

module.exports = router; 