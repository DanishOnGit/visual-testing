import express from "express";
import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';

dotenv.config();

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.VITE_OPENAI_BASE_URL,
  defaultQuery: {
    "api-version": "2025-01-01-preview",
  },
  defaultHeaders: {
    "api-key": process.env.VITE_OPENAI_API_KEY,
  },
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// Serve static folders
const screenshotsDir = path.join(__dirname, "../../screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
app.use("/screenshots", express.static(screenshotsDir));

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Screenshot API endpoint
app.post("/api/screenshot", async (req, res) => {
  const { url, fullPage = false, width = 1280, height = 800 } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.CHROME_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Create filename based on URL and timestamp
    const timestamp = Date.now();
    const urlSlug = url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9]/g, "-");
    const fileName = `${urlSlug}-${timestamp}.png`;
    const filePath = path.join(screenshotsDir, fileName);

    await page.screenshot({
      path: filePath,
     clip:{
      x: 0,
      y: 0,
      width: 1280,
      height: 800
     }
    });

    res.json({
      success: true,
      file: {
        name: fileName,
        path: `/screenshots/${fileName}`,
        fullPath: filePath,
      },
    });
  } catch (error) {
    console.error("Screenshot error:", error);
    res.status(500).json({
      error: "Failed to capture screenshot",
      message: error.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Image upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    success: true,
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      fullPath: req.file.path,
    },
  });
});

// Image comparison endpoint
app.post("/api/compare", async (req, res) => {
  const { screenshotPath, uploadedImagePath } = req.body;
  
  console.log('Compare API called with:', { screenshotPath, uploadedImagePath });
  
  if (!screenshotPath || !uploadedImagePath) {
    return res.status(400).json({ error: 'Both screenshot and uploaded image paths are required' });
  }
  
  // Convert relative paths to absolute if needed
  const fullScreenshotPath = screenshotPath.startsWith('/') 
  ? screenshotPath
    : path.join(__dirname, '..', '..', screenshotPath.slice(1)) 
    
  const fullUploadedImagePath = uploadedImagePath.startsWith('/') 
  ? uploadedImagePath
  : path.join(__dirname, '..', '..', uploadedImagePath.slice(1)) 

  console.log('Full paths:', { fullScreenshotPath, fullUploadedImagePath });

  try {

    if (!fs.existsSync(fullScreenshotPath)) {
      console.error('Screenshot file not found:', fullScreenshotPath);
      return res.status(404).json({ error: 'Screenshot file not found' });
    }
    
    if (!fs.existsSync(fullUploadedImagePath)) {
      console.error('Uploaded image file not found:', fullUploadedImagePath);
      return res.status(404).json({ error: 'Uploaded image file not found' });
    }
    
    // Read image files as base64
    const screenshotBuffer = await fs.promises.readFile(fullScreenshotPath);
    const uploadedImageBuffer = await fs.promises.readFile(fullUploadedImagePath);
    
    const screenshotBase64 = screenshotBuffer.toString('base64');
    const uploadedImageBase64 = uploadedImageBuffer.toString('base64');


    const response = await openai.chat.completions.create({
      model: 'Proton',
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
              text: "Compare these two images. The first is a reference screenshot and the second is a test image. Provide a similarity score from 0 to 100, where 100 means identical. Analyze layout differences, color variations, and missing elements. Return a JSON with: score (number), analysis (string), and differences (array of strings). Additionally, evaluate and provide specific scores for these parameters: typography (0-100), layoutAlignment (0-100), visualStyling (0-100), copy (0-100). For each parameter, include a brief explanation in a 'parameterAnalysis' object.",
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

    const content = response.choices[0]?.message?.content || '';
    console.log('OpenAI Response:', content);
    const result = JSON.parse(content);

    res.json({
      success: true,
      comparison: {
        score: result.score || 0,
        analysis: result.analysis || 'No analysis provided',
        differences: result.differences || [],
        parameters: {
          typography: result.typography || 0,
          layoutAlignment: result.layoutAlignment || 0,
          visualStyling: result.visualStyling || 0,
          copy: result.copy || 0
        },
        parameterAnalysis: result.parameterAnalysis || {}
      }
    });
  } catch (error) {
    console.error('Error comparing images:', error);
    res.status(500).json({
      error: 'Failed to compare images',
      message: error.message
    });
  }
});

app.post("/api/compare-with-gemini", async (req, res) => {
  const { screenshotPath, uploadedImagePath } = req.body;
  
  console.log('Gemini Compare API called with:', { screenshotPath, uploadedImagePath });
  
  if (!screenshotPath || !uploadedImagePath) {
    return res.status(400).json({ error: 'Both screenshot and uploaded image paths are required' });
  }
  
  // Convert relative paths to absolute if needed
  const fullScreenshotPath = screenshotPath.startsWith('/') 
    ? screenshotPath
    : path.join(__dirname, '..', '..', screenshotPath.slice(1));
    
  const fullUploadedImagePath = uploadedImagePath.startsWith('/') 
    ? uploadedImagePath
    : path.join(__dirname, '..', '..', uploadedImagePath.slice(1));

  console.log('Full paths:', { fullScreenshotPath, fullUploadedImagePath });

  try {
    if (!fs.existsSync(fullScreenshotPath)) {
      console.error('Screenshot file not found:', fullScreenshotPath);
      return res.status(404).json({ error: 'Screenshot file not found' });
    }
    
    if (!fs.existsSync(fullUploadedImagePath)) {
      console.error('Uploaded image file not found:', fullUploadedImagePath);
      return res.status(404).json({ error: 'Uploaded image file not found' });
    }
    
    const screenshotBuffer = await fs.promises.readFile(fullScreenshotPath);
    const uploadedImageBuffer = await fs.promises.readFile(fullUploadedImagePath);
    
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-exp-03-25",
    });
    
    const prompt = "Compare these two images. The first is a reference screenshot and the second is a test image. Provide a similarity score from 0 to 100, where 100 means identical. Analyze layout differences, color variations, and missing elements. Return a JSON with: score (number), analysis (string), and differences (array of strings). Additionally, evaluate and provide specific scores for these parameters: typography (0-100), layoutAlignment (0-100), visualStyling (0-100), copy (0-100). For each parameter, include a brief explanation in a 'parameterAnalysis' object.";


    const imageParts = [
      {
        inlineData: {
          data: screenshotBuffer.toString("base64"),
          mimeType: "image/png",
        },
      },
      {
        inlineData: {
          data: uploadedImageBuffer.toString("base64"),
          mimeType: "image/png",
        },
      },
    ];

   
    const result = await geminiModel.generateContent([prompt, ...imageParts]);
    const response = result.response;
    const text = response.text();
    
    console.log('Gemini raw response:', text);
    
    // Parse the JSON from the response text
    // Note: Gemini might not always return clean JSON, so we need to handle potential formatting issues
    let jsonResponse;
    try {
      // Try to extract JSON if it's wrapped in backticks or not in proper format
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       text.match(/```\s*([\s\S]*?)\s*```/) ||
                       text.match(/{[\s\S]*}/);
                       
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      jsonResponse = JSON.parse(jsonString.replace(/^```json/, '').replace(/```$/, ''));
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw text received:', text);
      // Create a basic structure if parsing fails
      jsonResponse = {
        score: 0,
        analysis: "Error parsing response: " + parseError.message,
        differences: ["Failed to analyze images properly"],
      };
    }


    const formattedResponse = {
      score: jsonResponse.score || 0,
      analysis: jsonResponse.analysis || 'No analysis provided',
      differences: jsonResponse.differences || [],
      parameters: {
        typography: jsonResponse.typography || 0,
        layoutAlignment: jsonResponse.layoutAlignment || 0,
        visualStyling: jsonResponse.visualStyling || 0,
        copy: jsonResponse.copy || 0
      },
      parameterAnalysis: {
        typography: jsonResponse.parameterAnalysis?.typography || { score: 0, explanation: 'No analysis' },
        layoutAlignment: jsonResponse.parameterAnalysis?.layoutAlignment || { score: 0, explanation: 'No analysis' },
        visualStyling: jsonResponse.parameterAnalysis?.visualStyling || { score: 0, explanation: 'No analysis' },
        copy: jsonResponse.parameterAnalysis?.copy || { score: 0, explanation: 'No analysis' }
      }
    };

    res.json({
      success: true,
      comparison: formattedResponse
    });

  } catch (err) {
    console.error('Gemini comparison error:', err);
    res.status(500).json({
      error: 'Failed to compare images using Gemini',
      message: err.message
    });
  }
});

// Pixel level image comparison endpoint
app.post("/api/compare-pixels", async (req, res) => {
  const { screenshotPath, uploadedImagePath, threshold = 0.1 } = req.body;
  
  console.log('Pixel Compare API called with:', { screenshotPath, uploadedImagePath, threshold });
  
  if (!screenshotPath || !uploadedImagePath) {
    return res.status(400).json({ error: 'Both screenshot and uploaded image paths are required' });
  }
  
  // Convert relative paths to absolute if needed
  const fullScreenshotPath = screenshotPath.startsWith('/') 
    ? screenshotPath
    : path.join(__dirname, '..', '..', screenshotPath.slice(1));
    
  const fullUploadedImagePath = uploadedImagePath.startsWith('/') 
    ? uploadedImagePath
    : path.join(__dirname, '..', '..', uploadedImagePath.slice(1));

  console.log('Full paths:', { fullScreenshotPath, fullUploadedImagePath });

  try {
    if (!fs.existsSync(fullScreenshotPath)) {
      console.error('Screenshot file not found:', fullScreenshotPath);
      return res.status(404).json({ error: 'Screenshot file not found' });
    }
    
    if (!fs.existsSync(fullUploadedImagePath)) {
      console.error('Uploaded image file not found:', fullUploadedImagePath);
      return res.status(404).json({ error: 'Uploaded image file not found' });
    }
    
    // Read files and get dimensions
    const [screenshotDimensions, uploadedDimensions] = await Promise.all([
      sharp(fullScreenshotPath).metadata(),
      sharp(fullUploadedImagePath).metadata()
    ]);
    
    let screenshotPNG, uploadedPNG;
    
    // Check if dimensions match
    if (screenshotDimensions.width !== uploadedDimensions.width || screenshotDimensions.height !== uploadedDimensions.height) {
      console.log('Image dimensions do not match, resizing...');
      console.log(`Screenshot: ${screenshotDimensions.width}x${screenshotDimensions.height}, Uploaded: ${uploadedDimensions.width}x${uploadedDimensions.height}`);
      
      // Resize the uploaded image to match the screenshot dimensions
      const resizedImageBuffer = await sharp(fullUploadedImagePath)
        .resize(screenshotDimensions.width, screenshotDimensions.height, {
          fit: 'fill'
        })
        .png()
        .toBuffer();
      
      // Convert both images to PNG format
      const screenshotBuffer = await sharp(fullScreenshotPath).png().toBuffer();
      
      // Save the resized image temporarily for debugging
      const resizedFileName = `resized-${Date.now()}.png`;
      const resizedFilePath = path.join(screenshotsDir, resizedFileName);
      await fs.promises.writeFile(resizedFilePath, resizedImageBuffer);
      
      console.log(`Resized image saved at ${resizedFilePath}`);
      
      // Convert buffers to PNG objects
      screenshotPNG = PNG.sync.read(screenshotBuffer);
      uploadedPNG = PNG.sync.read(resizedImageBuffer);
    } else {
      // If dimensions already match, just read as PNG
      screenshotPNG = PNG.sync.read(fs.readFileSync(fullScreenshotPath));
      uploadedPNG = PNG.sync.read(fs.readFileSync(fullUploadedImagePath));
    }
    
    // Create a new PNG for the diff
    const { width, height } = screenshotPNG;
    const diffImage = new PNG({ width, height });
    
    // Generate comparison parameters
    let comparisonOptions = {
      threshold: parseFloat(threshold),
      includeAA: true,
      alpha: 0.1,
      diffMask: true
    };
    
    // Compare images
    console.log(`Comparing images with dimensions: ${width}x${height}`);
    const numDiffPixels = pixelmatch(
      screenshotPNG.data,
      uploadedPNG.data,
      diffImage.data,
      width,
      height,
      comparisonOptions
    );
    
    // Calculate percentage of different pixels
    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;
    const matchPercentage = 100 - diffPercentage;
    
    console.log(`Diff pixels: ${numDiffPixels}, Total pixels: ${totalPixels}`);
    console.log(`Match percentage: ${matchPercentage.toFixed(2)}%`);
    
    // Save diff image
    const diffFileName = `diff-${Date.now()}.png`;
    const diffFilePath = path.join(screenshotsDir, diffFileName);
    fs.writeFileSync(diffFilePath, PNG.sync.write(diffImage));
    
    const diffAreas = [];
    
    // Basic pixel diff analysis - identify regions with differences
    if (numDiffPixels > 0) {
      diffAreas.push("There are visual differences between the images");
      
      if (numDiffPixels < totalPixels * 0.05) {
        diffAreas.push("Minor text or typography differences detected");
      } else if (numDiffPixels < totalPixels * 0.15) {
        diffAreas.push("Layout or alignment differences detected");
      } else {
        diffAreas.push("Major structural differences detected");
      }
    }
    
    const result = {
      score: parseFloat(matchPercentage.toFixed(2)),
      analysis: `Images match at ${matchPercentage.toFixed(2)}% with ${numDiffPixels} different pixels out of ${totalPixels} total pixels.`,
      differences: diffAreas,
      parameters: {
        typography: matchPercentage > 95 ? 95 : matchPercentage,
        layoutAlignment: matchPercentage > 90 ? 90 : matchPercentage,
        visualStyling: matchPercentage,
        copy: matchPercentage > 95 ? 98 : matchPercentage
      },
      parameterAnalysis: {
        typography: { 
          score: matchPercentage > 95 ? 95 : matchPercentage, 
          explanation: "Based on pixel-level differences that may affect text rendering"
        },
        layoutAlignment: { 
          score: matchPercentage > 90 ? 90 : matchPercentage, 
          explanation: "Based on structural similarities between the images"
        },
        visualStyling: { 
          score: matchPercentage, 
          explanation: "Direct measurement of visual differences"
        },
        copy: { 
          score: matchPercentage > 95 ? 98 : matchPercentage, 
          explanation: "Estimated based on overall image similarity"
        }
      },
      diffImage: {
        path: `/screenshots/${diffFileName}`,
        fullPath: diffFilePath
      }
    };
    
    res.json({
      success: true,
      comparison: result
    });
  } catch (err) {
    console.error('Pixel comparison error:', err);
    res.status(500).json({
      error: 'Failed to compare images using pixel matching',
      message: err.message
    });
  }
});

// Hybrid comparison endpoint using both pixel matching and AI
app.post("/api/compare-hybrid", async (req, res) => {
  const { screenshotPath, uploadedImagePath, aiModel = 'gemini' } = req.body;
  
  console.log('Hybrid Compare API called with:', { screenshotPath, uploadedImagePath, aiModel });
  
  if (!screenshotPath || !uploadedImagePath) {
    return res.status(400).json({ error: 'Both screenshot and uploaded image paths are required' });
  }
  
  const fullScreenshotPath = screenshotPath.startsWith('/') 
    ? screenshotPath
    : path.join(__dirname, '..', '..', screenshotPath.slice(1));
    
  const fullUploadedImagePath = uploadedImagePath.startsWith('/') 
    ? uploadedImagePath
    : path.join(__dirname, '..', '..', uploadedImagePath.slice(1));

  console.log('Full paths:', { fullScreenshotPath, fullUploadedImagePath });

  try {
    if (!fs.existsSync(fullScreenshotPath)) {
      console.error('Screenshot file not found:', fullScreenshotPath);
      return res.status(404).json({ error: 'Screenshot file not found' });
    }
    
    if (!fs.existsSync(fullUploadedImagePath)) {
      console.error('Uploaded image file not found:', fullUploadedImagePath);
      return res.status(404).json({ error: 'Uploaded image file not found' });
    }
    
    // Step 1: Run pixel comparison for layout and alignment
    const pixelComparisonResponse = await fetch('http://localhost:3001/api/compare-pixels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        screenshotPath,
        uploadedImagePath,
        threshold: 0.1
      }),
    });
    
    if (!pixelComparisonResponse.ok) {
      const errorData = await pixelComparisonResponse.json();
      throw new Error(errorData.message || 'Failed to compare images with pixel matching');
    }
    
    const pixelData = await pixelComparisonResponse.json();
    console.log('Pixel comparison results:', pixelData);
    
    // Step 2: Run AI comparison for colors, copy and typography
    const aiEndpoint = aiModel === 'gemini' ? 
      'http://localhost:3001/api/compare-with-gemini' : 
      'http://localhost:3001/api/compare';
      
    const aiComparisonResponse = await fetch(aiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        screenshotPath,
        uploadedImagePath
      }),
    });
    
    if (!aiComparisonResponse.ok) {
      const errorData = await aiComparisonResponse.json();
      throw new Error(errorData.message || `Failed to compare images with ${aiModel}`);
    }
    
    const aiData = await aiComparisonResponse.json();
    console.log(`${aiModel.toUpperCase()} comparison results:`, aiData);
    
    // Step 3: Merge the results, prioritizing pixelmatch for layout and AI for typography and colors
    const pixelResults = pixelData.comparison;
    const aiResults = aiData.comparison;
    
    // Calculate hybrid score (weighted average)
    const layoutWeight = 0.4;
    const typographyWeight = 0.2;
    const colorsWeight = 0.2;
    const copyWeight = 0.2;
    
    const hybridScore = (
      (pixelResults.parameters.layoutAlignment * layoutWeight) +
      (aiResults.parameters.typography * typographyWeight) +
      (aiResults.parameters.visualStyling * colorsWeight) +
      (aiResults.parameters.copy * copyWeight)
    );
    
    // Combine differences from both analyses
    const allDifferences = [
      ...new Set([
        ...pixelResults.differences,
        ...aiResults.differences
      ])
    ];
    
    // Create combined analysis
    const hybridAnalysis = `
      Layout Analysis: ${pixelResults.analysis}
      
      AI Analysis: ${aiResults.analysis}
      
      Combined Score: ${Math.round(hybridScore)}% match. This score gives more weight to layout and alignment 
      while utilizing AI to better evaluate typography, visual styling, and content.
    `;
    
    // Create the combined response
    const hybridResult = {
      score: Math.round(hybridScore),
      analysis: hybridAnalysis.trim(),
      differences: allDifferences,
      parameters: {
        // Use pixel comparison for layout
        layoutAlignment: pixelResults.parameters.layoutAlignment,
        // Use AI for typography, styling and copy
        typography: aiResults.parameters.typography,
        visualStyling: aiResults.parameters.visualStyling,
        copy: aiResults.parameters.copy
      },
      parameterAnalysis: {
        layoutAlignment: pixelResults.parameterAnalysis.layoutAlignment,
        typography: aiResults.parameterAnalysis.typography, 
        visualStyling: aiResults.parameterAnalysis.visualStyling,
        copy: aiResults.parameterAnalysis.copy
      },
      // Include the diff image from pixel comparison
      diffImage: pixelResults.diffImage
    };
    
    res.json({
      success: true,
      comparison: hybridResult
    });
  } catch (err) {
    console.error('Hybrid comparison error:', err);
    res.status(500).json({
      error: 'Failed to perform hybrid comparison',
      message: err.message
    });
  }
});

app.listen(port, () => {
  console.log(`Screenshot server running on port ${port}`);
});

export default app;
