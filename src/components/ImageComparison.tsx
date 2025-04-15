import React, { useState } from 'react';
import { Box, Text, Button, Modal, ModalBody, ModalHeader, Divider } from '@razorpay/blade/components';
import ComparisonReport from './ComparisonReport';

interface ImageComparisonProps {
  screenshotUrl?: string;
  screenshotPath?: string;
  uploadedImageUrl?: string;
  uploadedImagePath?: string;
  imageComparisonOpen: boolean;
  setImageComparisonOpen: (open: boolean) => void;
}

interface ParameterScores {
  typography: number;
  layoutAlignment: number;
  visualStyling: number;
  copy: number;
}

interface ParameterAnalysisType{
  score:number;
  explanation:string;
}
interface ParameterAnalysis {
  typography?: ParameterAnalysisType;
  layoutAlignment?: ParameterAnalysisType;
  visualStyling?: ParameterAnalysisType;
  copy?: ParameterAnalysisType;
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
  imageComparisonOpen,
  setImageComparisonOpen,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'openai' | 'gemini' | 'pixelmatch'>('openai');
  const [diffImage, setDiffImage] = useState<string | null>(null);

  const compareImages = async () => {
    if (!screenshotPath || !uploadedImagePath) {
      setError('Both a screenshot and an uploaded image are required for comparison');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setDiffImage(null);

    try {
      // Determine which endpoint to use based on model type
      let endpoint = 'http://localhost:3001/api/compare';
      
      if (modelType === 'gemini') {
        endpoint = 'http://localhost:3001/api/compare-with-gemini';
      } else if (modelType === 'pixelmatch') {
        endpoint = 'http://localhost:3001/api/compare-pixels';
      }
      
      // Call the comparison API
      console.log({ screenshotPath, uploadedImagePath });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenshotPath,
          uploadedImagePath,
          threshold: 0.1 // Only used for pixelmatch
        }),
      });

      const data = await response.json();
      console.log(`${modelType.toUpperCase()} Comparison API response:`, data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to compare images');
      }
      
      if (data.success === false && data.comparison?.error === 'Image dimensions do not match') {
        // Special handling for dimension mismatch
        setError(`Image dimensions do not match. Screenshot: ${data.comparison.details.screenshot.width}x${data.comparison.details.screenshot.height}, Uploaded: ${data.comparison.details.uploaded.width}x${data.comparison.details.uploaded.height}`);
        setResult(data.comparison);
        return;
      }
      
      if (data.success && data.comparison) {
        setResult(data.comparison);
        
        // Handle diff image if present
        if (data.comparison.diffImage?.path) {
          setDiffImage(data.comparison.diffImage.path);
        }
      } else {
        throw new Error(`Invalid response from ${modelType} comparison API`);
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
  
  const renderParameterScore = (name: string, score: number, analysis?: {score:number,explanation:string}) => (
    <div className="parameter-score" key={name}>
      <div className="parameter-header">
        <div className="parameter-name"><Text>{name}</Text></div>
        <div className="parameter-value"><Text>{analysis?.score}%</Text></div>
      </div>
      <div className="score-bar">
        <div 
          className="score-fill" 
          style={{ 
            width: `${analysis?.score}%`, 
            backgroundColor: getScoreColor(analysis?.score || 0) 
          }}
        />
      </div>
      {analysis && (
        <div className="parameter-analysis"><Text>{analysis.explanation}</Text></div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={imageComparisonOpen}
      onDismiss={() => setImageComparisonOpen(false)}
      size="medium"
    >
      <ModalHeader title="Compare Images" />
      <ModalBody>
        <div className="comparison-images">
          {screenshotUrl && uploadedImageUrl && (
            <div className="image-grid">
              <div className="image-item">
                <Text>Screenshot</Text>
                <img
                  src={screenshotUrl}
                  alt="Screenshot"
                  className="comparison-image"
                />
              </div>
              <div className="image-item">
                <Text>Uploaded Image</Text>
                <img
                  src={uploadedImageUrl}
                  alt="Uploaded"
                  className="comparison-image"
                />
              </div>
              {diffImage && (
                <div className="image-item">
                  <Text>Difference Map</Text>
                  <img
                    src={diffImage}
                    alt="Diff"
                    className="comparison-image"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <Box display="flex" flexDirection="column" gap="spacing.3" padding="spacing.5">
          <Box display="flex" gap="spacing.3">
            <Button
              onClick={compareImages}
              isDisabled={isLoading || !screenshotPath || !uploadedImagePath}
              variant="primary"
            >
              {isLoading ? 'Comparing...' : `Compare with ${modelType === 'openai' ? 'OpenAI' : modelType === 'gemini' ? 'Gemini' : 'Pixel Match'}`}
            </Button>
          </Box>
          
          <Box display="flex" gap="spacing.3" marginTop="spacing.3">
            <Text size="small" weight="medium">Select comparison method:</Text>
            <Button 
              onClick={() => setModelType('openai')}
              variant={modelType === 'openai' ? "primary" : "secondary"}
              size="small"
              isDisabled={isLoading}
            >
              OpenAI
            </Button>
            <Button 
              onClick={() => setModelType('gemini')}
              variant={modelType === 'gemini' ? "primary" : "secondary"}
              size="small"
              isDisabled={isLoading}
            >
              Gemini
            </Button>
            <Button 
              onClick={() => setModelType('pixelmatch')}
              variant={modelType === 'pixelmatch' ? "primary" : "secondary"}
              size="small"
              isDisabled={isLoading}
            >
              Pixel Match
            </Button>
          </Box>
        </Box>

        {error && (
          <div className="comparison-error">
            <Text>{error}</Text>
          </div>
        )}

        {/* {result && (
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
      )} */}
        <Divider height={"spacing.5"} />
        {result && (
          <Box padding={"spacing.5"}>
            <ComparisonReport
              score={result?.score || 0}
              analysis={result?.analysis || ""}
              differences={result?.differences || []}
              parameters={result?.parameters}
              parameterAnalysis={result?.parameterAnalysis}
            />
          </Box>
        )}
      </ModalBody>
    </Modal>
  );
};

export default ImageComparison; 