import OpenAI from 'openai';
import fs from 'fs';

// Initialize OpenAI client
let openai: OpenAI;

try {
  // Try to import the OpenAI instance from the index.js file
  const openaiModule = await import('../index.js');
  openai = openaiModule.openai;
} catch (error) {
  console.error('Error importing OpenAI instance:', error);
  // Fallback to creating a new instance
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '', // Get API key from environment variable
  });
}

/**
 * Compare two images using OpenAI's Vision model
 * @param screenshotPath Path to the screenshot image
 * @param uploadedImagePath Path to the uploaded image
 * @returns Comparison score and analysis
 */
export const compareImages = async (
  screenshotPath: string,
  uploadedImagePath: string
): Promise<{
  score: number;
  analysis: string;
  differences: string[];
}> => {
  try {
    // Read image files as base64
    const screenshotBuffer = await fs.promises.readFile(screenshotPath);
    const uploadedImageBuffer = await fs.promises.readFile(uploadedImagePath);
    
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const uploadedImageBase64 = uploadedImageBuffer.toString('base64');

    // Send request to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a visual testing expert that compares website screenshots for UI/UX testing.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Compare these two images. The first is a reference screenshot and the second is a test image. Provide a similarity score from 0 to 100, where 100 means identical. Analyze layout differences, color variations, and missing elements. Return a JSON with: score (number), analysis (string), and differences (array of strings).',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`,
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${uploadedImageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content || '';
    const result = JSON.parse(content);

    return {
      score: result.score || 0,
      analysis: result.analysis || 'No analysis provided',
      differences: result.differences || [],
    };
  } catch (error) {
    console.error('Error comparing images with OpenAI:', error);
    return {
      score: 0,
      analysis: `Error comparing images: ${error instanceof Error ? error.message : String(error)}`,
      differences: [],
    };
  }
}; 