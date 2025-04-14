import React, { useState } from 'react';
import { Box, Text, Button } from '@razorpay/blade/components';

interface ImageComparisonProps {
  screenshotUrl?: string;
  screenshotPath?: string;
  uploadedImageUrl?: string;
  uploadedImagePath?: string;
}

interface ParameterScores {
  typography: number;
  layoutAlignment: number;
  visualStyling: number;
  copy: number;
}

interface ParameterAnalysis {
  typography?: string;
  layoutAlignment?: string;
  visualStyling?: string;
  copy?: string;
}

interface ComparisonResult {
  score: number;
  analysis: string;
  differences: string[];
  parameters?: ParameterScores;
  parameterAnalysis?: ParameterAnalysis;
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
      console.log('Comparison API response:', data);
      
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
  
  const renderParameterScore = (name: string, score: number, analysis?: string) => (
    <div className="parameter-score" key={name}>
      <div className="parameter-header">
        <div className="parameter-name"><Text>{name}</Text></div>
        <div className="parameter-value"><Text>{score}%</Text></div>
      </div>
      <div className="score-bar">
        <div 
          className="score-fill" 
          style={{ 
            width: `${score}%`, 
            backgroundColor: getScoreColor(score) 
          }}
        />
      </div>
      {analysis && (
        <div className="parameter-analysis"><Text>{analysis}</Text></div>
      )}
    </div>
  );

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
            <div className="overall-score-title"><Text>Overall Similarity Score</Text></div>
            <div className="overall-score-value"><Text>{result.score}%</Text></div>
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
          
          {result.parameters && (
            <div className="parameters-section">
              <div className="parameters-title"><Text>Detailed Analysis</Text></div>
              
              <div className="parameters-grid">
                {renderParameterScore('Typography', result.parameters.typography, result.parameterAnalysis?.typography)}
                {renderParameterScore('Layout & Alignment', result.parameters.layoutAlignment, result.parameterAnalysis?.layoutAlignment)}
                {renderParameterScore('Visual Styling', result.parameters.visualStyling, result.parameterAnalysis?.visualStyling)}
                {renderParameterScore('Content/Copy', result.parameters.copy, result.parameterAnalysis?.copy)}
              </div>
            </div>
          )}
          
          <div className="analysis-section">
            <div className="analysis-title"><Text>Overall Analysis</Text></div>
            <Text>{result.analysis}</Text>
          </div>
          
          {result.differences.length > 0 && (
            <div className="differences-section">
              <div className="differences-title"><Text>Key Differences</Text></div>
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