import { useState, useEffect } from 'react';
import './App.css';
import { Box, Text } from '@razorpay/blade/components';
import Input from './components/Input';
import ImageUpload from './components/ImageUpload';
import ScreenshotCapture from './components/ScreenshotCapture';
import ImageComparison from './components/ImageComparison';

function App() {
  const [count, setCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  
  // Add states for captured screenshot and uploaded image for comparison
  const [screenshot, setScreenshot] = useState<{
    path: string;
    imageUrl: string;
  } | null>(null);
  
  const [uploadedImageDetails, setUploadedImageDetails] = useState<{
    path: string;
    imageUrl: string;
  } | null>(null);

  useEffect(() => {
    console.log('Screenshot state:', screenshot);
    console.log('Uploaded image details:', uploadedImageDetails);
  }, [screenshot, uploadedImageDetails]);

  const handleImageUpload = async (file: File) => {
    setUploadedImage(file);
    
    // Upload the image to the server
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.success) {
        setUploadedImageDetails({
          path: data.file.fullPath,
          imageUrl: `http://localhost:3001${data.file.path}`,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };
  
  const handleScreenshotCapture = (result: { success: boolean; path: string; imageUrl: string }) => {
    console.log('Screenshot capture result:', result);
    if (result.success) {
      setScreenshot({
        path: result.path,
        imageUrl: result.imageUrl,
      });
    }
  };

  return (
    <div className="container">
      <Text>Visual Testing Tool</Text>
      
      <Box>
        <div className="card">
          <div className="form-group">
            <Input
              value={imageUrl}
              onChange={setImageUrl}
              label="Website URL"
              placeholder="Enter a website URL to capture (e.g., https://example.com)"
            />
          </div>
          
          <div className="form-group">
            <ScreenshotCapture 
              url={imageUrl} 
              onCaptureComplete={handleScreenshotCapture}
            />
          </div>
          
          <div className="form-group">
            <ImageUpload 
              onImageUpload={handleImageUpload} 
              label="Or upload an image for comparison"
            />
          </div>
          
          {screenshot && uploadedImageDetails && (
            <div className="form-group">
              <ImageComparison
                screenshotUrl={screenshot.imageUrl}
                screenshotPath={screenshot.path}
                uploadedImageUrl={uploadedImageDetails.imageUrl}
                uploadedImagePath={uploadedImageDetails.path}
              />
            </div>
          )}
        </div>
      </Box>
      
      <div className="debug-info">
        <p>Debug Info:</p>
        <p>Screenshot captured: {screenshot ? 'Yes' : 'No'}</p>
        <p>Image uploaded: {uploadedImageDetails ? 'Yes' : 'No'}</p>
        <p>Compare should show: {(screenshot && uploadedImageDetails) ? 'Yes' : 'No'}</p>
      </div>
      
      <Text>
        {uploadedImage ? 
          `Selected file: ${uploadedImage.name} (${Math.round(uploadedImage.size / 1024)} KB)` : 
          'No file selected'}
      </Text>
    </div>
  );
}

export default App;
