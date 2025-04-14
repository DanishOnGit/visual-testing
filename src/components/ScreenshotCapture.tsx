import React, { useState } from 'react';
import { Box, Text, Button } from '@razorpay/blade/components';

interface ScreenshotCaptureProps {
  url: string;
}

const ScreenshotCapture: React.FC<ScreenshotCaptureProps> = ({ url }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; path?: string; imageUrl?: string }>({ 
    success: false, 
    message: '' 
  });

  const captureScreenshot = async () => {
    if (!url) {
      setResult({ 
        success: false, 
        message: 'Please enter a valid URL' 
      });
      return;
    }

    setIsLoading(true);
    setResult({ success: false, message: '' });

    try {
      // Ensure URL has protocol
      const validUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Call the screenshot API server
      const response = await fetch('http://localhost:3001/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: validUrl,
          fullPage: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to capture screenshot');
      }

      const data = await response.json();
      
      setResult({
        success: true,
        message: 'Screenshot captured successfully!',
        path: data.file.fullPath,
        imageUrl: `http://localhost:3001${data.file.path}`
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture screenshot'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Button 
        onClick={captureScreenshot} 
        isDisabled={!url || isLoading || url.trim() === ''}
        variant="primary"
      >
        {isLoading ? 'Capturing...' : 'Capture Screenshot'}
      </Button>
      
      {result.message && (
        <Box>
          <Text>
            {result.message}
          </Text>
          {result.path && (
            <Text>
              Saved to: {result.path}
            </Text>
          )}
          {result.imageUrl && (
            <div className="screenshot-preview">
              <img 
                src={result.imageUrl} 
                alt="Screenshot" 
                style={{ maxWidth: '100%', marginTop: '1rem', border: '1px solid #ddd' }} 
              />
            </div>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ScreenshotCapture; 