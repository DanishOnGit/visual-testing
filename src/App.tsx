import { useState } from 'react';
import './App.css';
import { Box, Button, Text } from '@razorpay/blade/components';
import Input from './components/Input';
import ImageUpload from './components/ImageUpload';
import ScreenshotCapture from './components/ScreenshotCapture';

function App() {
  const [count, setCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
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
            <ScreenshotCapture url={imageUrl} />
          </div>
          
          <div className="form-group">
            <ImageUpload 
              onImageUpload={handleImageUpload} 
              label="Or upload an image"
            />
          </div>
          
          <Button 
            onClick={() => setCount((count) => count + 1)}
            variant="secondary"
          >
            count is {count}
          </Button>
          
          <Text>
            Edit <code>src/App.tsx</code> and save to test HMR
          </Text>
        </div>
      </Box>
      
      <Text>
        {uploadedImage ? 
          `Selected file: ${uploadedImage.name} (${Math.round(uploadedImage.size / 1024)} KB)` : 
          'No file selected'}
      </Text>
    </div>
  );
}

export default App;
