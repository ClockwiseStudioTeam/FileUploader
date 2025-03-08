// File Upload Script for Webflow
// Copy and paste this code into Webflow's custom code section

document.addEventListener('DOMContentLoaded', function() {
  // Configuration - Replace with your actual API URL
  const API_URL = 'https://your-api-domain.com/api/upload';
  
  // Create and append the upload container to the target element
  // Replace 'file-upload-target' with the ID of your Webflow element
  const targetElement = document.getElementById('file-upload-target');
  
  if (!targetElement) {
    console.error('Target element not found. Please add an element with ID "file-upload-target" in your Webflow page.');
    return;
  }
  
  // Create the HTML structure
  targetElement.innerHTML = `
    <div class="file-upload-container" style="max-width: 500px; margin: 0 auto; padding: 20px; border-radius: 8px; background-color: #f9f9f9; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
      <h2 style="margin-top: 0; color: #333;">Upload Your File</h2>
      
      <div id="uploadForm">
        <div class="file-input-wrapper" style="position: relative; margin-bottom: 20px;">
          <input type="file" id="fileInput" style="width: 100%; padding: 10px; border: 2px dashed #ccc; border-radius: 5px; background-color: #fff; cursor: pointer; text-align: center;" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png">
          <div id="fileInfo" style="margin-top: 10px; font-size: 14px;">No file selected</div>
        </div>
        
        <button id="uploadBtn" style="display: block; width: 100%; padding: 12px; background-color: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; transition: background-color 0.3s;" disabled>Upload File</button>
        
        <div id="progressBar" style="height: 5px; background-color: #e0e0e0; margin-top: 15px; border-radius: 5px; overflow: hidden; display: none;">
          <div id="progress" style="height: 100%; background-color: #4a90e2; width: 0%; transition: width 0.3s;"></div>
        </div>
        
        <div id="errorMessage" style="color: #e74c3c; margin-top: 10px; display: none;"></div>
      </div>
      
      <div id="resultContainer" style="margin-top: 20px; padding: 20px; border-radius: 5px; background-color: #e6f7ff; border: 2px solid #4a90e2; display: none;">
        <div style="color: #4a90e2; font-size: 48px; text-align: center; margin-bottom: 10px;">✓</div>
        <h3 style="color: #333; text-align: center;">File Uploaded Successfully!</h3>
        
        <div style="background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin: 15px 0; border: 1px solid #d0e6ff;">
          <p style="margin-top: 0;"><strong>Your file is available at:</strong></p>
          <a href="#" id="fileLink" style="word-break: break-all; color: #4a90e2; text-decoration: none; font-weight: bold;" target="_blank"></a>
          <button id="copyLinkBtn" style="display: block; width: 100%; padding: 8px; margin-top: 10px; background-color: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;">Copy Link</button>
          <div id="copySuccess" style="color: #2ecc71; font-size: 14px; margin-top: 5px; display: none;">Link copied to clipboard!</div>
        </div>
        
        <p><strong>File UUID:</strong> <span id="fileUuid"></span></p>
        
        <div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404; font-size: 14px;">
          <strong>Important:</strong> Please save this link! You'll need it to access your file later.
        </div>
        
        <button id="uploadNewBtn" style="display: block; width: 100%; padding: 10px; margin-top: 15px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; transition: background-color 0.3s;">Upload Another File</button>
      </div>
    </div>
  `;
  
  // Get DOM elements
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const uploadBtn = document.getElementById('uploadBtn');
  const progressBar = document.getElementById('progressBar');
  const progress = document.getElementById('progress');
  const resultContainer = document.getElementById('resultContainer');
  const fileLink = document.getElementById('fileLink');
  const fileUuid = document.getElementById('fileUuid');
  const errorMessage = document.getElementById('errorMessage');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copySuccess = document.getElementById('copySuccess');
  const uploadNewBtn = document.getElementById('uploadNewBtn');
  
  // Check if there's a saved upload result in localStorage
  checkForSavedUploadResult();
  
  // Event Listeners
  fileInput.addEventListener('change', handleFileSelect);
  uploadBtn.addEventListener('click', uploadFile);
  copyLinkBtn.addEventListener('click', copyLinkToClipboard);
  uploadNewBtn.addEventListener('click', resetUploadForm);
  
  // Prevent accidental navigation away from the page
  window.addEventListener('beforeunload', function(e) {
    if (resultContainer.style.display === 'block') {
      // Save the current state to localStorage
      saveUploadResultToLocalStorage();
      
      // Show a confirmation dialog
      const confirmationMessage = 'You have a successful file upload. Are you sure you want to leave this page? The file link will be saved for when you return.';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });
  
  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (file) {
      fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
      uploadBtn.disabled = false;
      hideError();
    } else {
      fileInfo.textContent = 'No file selected';
      uploadBtn.disabled = true;
    }
  }
  
  // Upload file to server
  function uploadFile() {
    const file = fileInput.files[0];
    
    if (!file) {
      showError('Please select a file first');
      return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Disable button and show progress
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    progressBar.style.display = 'block';
    hideError();
    
    // Create and configure XHR request
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progress.style.width = percentComplete + '%';
      }
    });
    
    // Handle response
    xhr.onload = function() {
      if (xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Display success and file link
          uploadForm.style.display = 'none';
          resultContainer.style.display = 'block';
          fileLink.href = response.file.url;
          fileLink.textContent = response.file.url;
          fileUuid.textContent = response.file.uuid;
          
          // Save the result to localStorage
          saveUploadResultToLocalStorage();
          
          // Scroll to the result container
          resultContainer.scrollIntoView({ behavior: 'smooth' });
          
        } catch (error) {
          showError('Error parsing server response');
          resetUploadButton();
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          showError(response.error || 'Upload failed');
        } catch (error) {
          showError('Upload failed');
        }
        
        resetUploadButton();
      }
    };
    
    // Handle network errors
    xhr.onerror = function() {
      showError('Network error occurred');
      resetUploadButton();
    };
    
    // Send the request
    xhr.open('POST', API_URL, true);
    xhr.send(formData);
  }
  
  // Copy link to clipboard
  function copyLinkToClipboard() {
    const linkText = fileLink.textContent;
    
    // Use the newer clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(linkText)
        .then(() => {
          showCopySuccess();
        })
        .catch(() => {
          // Fall back to the older method if permission denied
          copyUsingLegacyMethod(linkText);
        });
    } else {
      // Use the older method for browsers that don't support the Clipboard API
      copyUsingLegacyMethod(linkText);
    }
  }
  
  // Legacy method for copying text
  function copyUsingLegacyMethod(text) {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    
    // Select and copy the text
    tempInput.select();
    document.execCommand('copy');
    
    // Remove the temporary element
    document.body.removeChild(tempInput);
    
    showCopySuccess();
  }
  
  // Show copy success message
  function showCopySuccess() {
    copySuccess.style.display = 'block';
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      copySuccess.style.display = 'none';
    }, 3000);
  }
  
  // Reset the upload form to upload a new file
  function resetUploadForm() {
    // Show the upload form again
    uploadForm.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Reset the file input
    fileInput.value = '';
    fileInfo.textContent = 'No file selected';
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Upload File';
    progressBar.style.display = 'none';
    progress.style.width = '0%';
    
    // Clear the saved result from localStorage
    localStorage.removeItem('uploadResult');
    
    // Hide any error messages
    hideError();
  }
  
  // Reset upload button state
  function resetUploadButton() {
    uploadBtn.textContent = 'Upload File';
    uploadBtn.disabled = false;
  }
  
  // Save upload result to localStorage
  function saveUploadResultToLocalStorage() {
    const resultData = {
      url: fileLink.href,
      urlText: fileLink.textContent,
      uuid: fileUuid.textContent,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem('uploadResult', JSON.stringify(resultData));
  }
  
  // Check for saved upload result in localStorage
  function checkForSavedUploadResult() {
    const savedResult = localStorage.getItem('uploadResult');
    
    if (savedResult) {
      try {
        const resultData = JSON.parse(savedResult);
        
        // Only restore if the result is less than 24 hours old
        const now = new Date().getTime();
        const resultAge = now - resultData.timestamp;
        const oneDayInMs = 24 * 60 * 60 * 1000;
        
        if (resultAge < oneDayInMs) {
          // Display the saved result
          uploadForm.style.display = 'none';
          resultContainer.style.display = 'block';
          fileLink.href = resultData.url;
          fileLink.textContent = resultData.urlText;
          fileUuid.textContent = resultData.uuid;
        } else {
          // Clear old result
          localStorage.removeItem('uploadResult');
        }
      } catch (error) {
        console.error('Error restoring saved upload result:', error);
        localStorage.removeItem('uploadResult');
      }
    }
  }
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    progressBar.style.display = 'none';
  }
  
  // Hide error message
  function hideError() {
    errorMessage.style.display = 'none';
  }
}); 