# Node.js PDF Uploader API

A simple Node.js Express API for uploading files (PDFs, documents, images) and storing them with MongoDB. Designed to be easily integrated with Webflow.

## Features

- File upload API with Express and MongoDB
- Generates unique IDs (UUIDs) for each file
- Returns file URLs that can be used in Webflow
- Supports various file types (PDF, Word, Excel, images)
- Simple Webflow integration

## Setup and Installation

### Prerequisites

- Node.js (v12 or higher)
- MongoDB Atlas account or local MongoDB instance

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/nodejs-pdf-uploader.git
   cd nodejs-pdf-uploader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   FILE_UPLOAD_PATH=./uploads
   BASE_URL=https://your-api-domain.com
   ```

   Replace `your_mongodb_connection_string` with your MongoDB connection string and `https://your-api-domain.com` with your actual domain when deployed.

4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Upload a File

**POST /api/upload**

Upload a file to the server.

- Request: Multipart form data with a `file` field
- Response: JSON object with file information
  ```json
  {
    "success": true,
    "file": {
      "id": "60f1a5b3e6b3f32a4c9b4567",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "originalname": "document.pdf",
      "url": "https://your-api-domain.com/uploads/550e8400-e29b-41d4-a716-446655440000.pdf"
    }
  }
  ```

### Get File by UUID

**GET /api/files/:uuid**

Retrieve file information by UUID.

- Response: JSON object with file information
  ```json
  {
    "success": true,
    "file": {
      "id": "60f1a5b3e6b3f32a4c9b4567",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "originalname": "document.pdf",
      "url": "https://your-api-domain.com/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
      "mimetype": "application/pdf",
      "size": 12345,
      "createdAt": "2023-07-16T12:34:56.789Z"
    }
  }
  ```

### Get All Files

**GET /api/files**

Retrieve information about all uploaded files.

- Response: JSON array of file objects
  ```json
  {
    "success": true,
    "count": 2,
    "files": [
      {
        "id": "60f1a5b3e6b3f32a4c9b4567",
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "originalname": "document.pdf",
        "url": "https://your-api-domain.com/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
        "mimetype": "application/pdf",
        "createdAt": "2023-07-16T12:34:56.789Z"
      },
      {
        "id": "60f1a5b3e6b3f32a4c9b4568",
        "uuid": "550e8400-e29b-41d4-a716-446655440001",
        "originalname": "image.jpg",
        "url": "https://your-api-domain.com/uploads/550e8400-e29b-41d4-a716-446655440001.jpg",
        "mimetype": "image/jpeg",
        "createdAt": "2023-07-16T12:35:56.789Z"
      }
    ]
  }
  ```

## Webflow Integration

### Option 1: Embed Code in Webflow

1. In your Webflow project, create a new div element with the ID `file-upload-target`.

2. Go to the project settings and add the JavaScript code from `public/webflow-embed-code.js` to the "Custom Code" section in the "Before </body> tag" area.

3. Make sure to update the `API_URL` variable in the JavaScript code to point to your deployed API:
   ```javascript
   const API_URL = 'https://your-api-domain.com/api/upload';
   ```

### Option 2: Use the HTML File

1. Create a new page in Webflow.

2. Add an Embed element to your page.

3. Copy the contents of `public/webflow-upload.html` and paste it into the Embed element.

4. Make sure to update the `API_URL` variable in the JavaScript code to point to your deployed API:
   ```javascript
   const API_URL = 'https://your-api-domain.com/api/upload';
   ```

## Deployment

### Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI.

2. Login to Heroku:
   ```
   heroku login
   ```

3. Create a new Heroku app:
   ```
   heroku create your-app-name
   ```

4. Add the MongoDB URI to Heroku config:
   ```
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   heroku config:set BASE_URL=https://your-app-name.herokuapp.com
   ```

5. Deploy to Heroku:
   ```
   git push heroku main
   ```

### Deploying to Other Platforms

The application can be deployed to any platform that supports Node.js applications, such as:

- AWS Elastic Beanstalk
- Google Cloud Run
- DigitalOcean App Platform
- Vercel
- Netlify

Make sure to set the environment variables (`MONGODB_URI`, `BASE_URL`, etc.) according to your platform's documentation.

## License

MIT 