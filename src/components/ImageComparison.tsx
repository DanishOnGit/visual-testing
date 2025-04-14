import React, { useState } from 'react';
import { Box, Text, Button } from '@razorpay/blade/components';

interface ImageComparisonProps {
  screenshotUrl?: string;
  screenshotPath?: string;
  uploadedImageUrl?: string;
  uploadedImagePath?: string;
}

interface ComparisonResult {
  score: number;
  analysis: string;
  differences: string[];
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  screenshotUrl,
  screenshotPath,
  uploadedImageUrl,
  uploadedImagePath,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compareImages = async () => {
    if (!screenshotPath || !uploadedImagePath) {
      setError('Both a screenshot and an uploaded image are required for comparison');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the comparison API
      const response = await fetch('http://localhost:3001/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenshotPath,
          uploadedImagePath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to compare images');
      }

      const data = await response.json();
      
      if (data.success && data.comparison) {
        setResult(data.comparison);
      } else {
        throw new Error('Invalid response from comparison API');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Comparison error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Box>
      <Text>Compare Images</Text>

      <div className="comparison-images">
        {screenshotUrl && uploadedImageUrl && (
          <div className="image-grid">
            <div className="image-item">
              <Text>Screenshot</Text>
              <img src={screenshotUrl} alt="Screenshot" className="comparison-image" />
            </div>
            <div className="image-item">
              <Text>Uploaded Image</Text>
              <img src={uploadedImageUrl} alt="Uploaded" className="comparison-image" />
            </div>
          </div>
        )}
      </div>

      <div className="comparison-action">
        <Button
          onClick={compareImages}
          isDisabled={isLoading || !screenshotPath || !uploadedImagePath}
          variant="primary"
        >
          {isLoading ? 'Comparing...' : 'Compare Images'}
        </Button>
      </div>

      {error && (
        <div className="comparison-error">
          <Text>{error}</Text>
        </div>
      )}

      {result && (
        <div className="comparison-result">
          <div className="score-section">
            <Text>Similarity Score: {result.score}%</Text>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ 
                  width: `${result.score}%`, 
                  backgroundColor: getScoreColor(result.score) 
                }}
              />
            </div>
          </div>
          
          <div className="analysis-section">
            <Text>Analysis:</Text>
            <Text>{result.analysis}</Text>
          </div>
          
          {result.differences.length > 0 && (
            <div className="differences-section">
              <Text>Key Differences:</Text>
              <ul className="differences-list">
                {result.differences.map((diff, index) => (
                  <li key={index}>
                    <Text>{diff}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Box>
  );
};

export default ImageComparison; 