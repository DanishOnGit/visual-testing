import React, { useState, ChangeEvent, useRef } from 'react';
import { Box, Text, Button } from '@razorpay/blade/components';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  label = 'Upload Image',
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    onImageUpload(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      {label && <Text>{label}</Text>}
      
      <div className="image-upload-container">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        
        <Button onClick={handleButtonClick} variant="secondary">
          Choose Image
        </Button>
        
        {filename && <Text>Selected: {filename}</Text>}
        
        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }} />
          </div>
        )}
      </div>
    </Box>
  );
};

export default ImageUpload; 