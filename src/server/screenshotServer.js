import express from "express";
import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI with Azure OpenAI configuration
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

// Enable CORS and JSON parsing
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

    // Navigate to URL
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

    // Take screenshot
    await page.screenshot({
      path: filePath,
      fullPage,
    });

    // Return success with file info
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
  if (!screenshotPath || !uploadedImagePath) {
    return res
      .status(400)
      .json({ error: "Both screenshot and uploaded image paths are required" });
  }

  // Convert relative paths to absolute if needed
  // const fullScreenshotPath = screenshotPath;

  // const fullUploadedImagePath = uploadedImagePath;
  const fullScreenshotPath = screenshotPath.startsWith("/")
    ? screenshotPath
    : path.join(__dirname, screenshotPath.slice(1));

  const fullUploadedImagePath = uploadedImagePath.startsWith("/")
    ? uploadedImagePath
    : path.join(__dirname, uploadedImagePath.slice(1));
  try {
    // Check if files exist
    if (!fs.existsSync(fullScreenshotPath)) {
      return res.status(404).json({ error: "Screenshot file not found" });
    }

    if (!fs.existsSync(fullUploadedImagePath)) {
      return res.status(404).json({ error: "Uploaded image file not found" });
    }

    // Read image files as base64
    const screenshotBuffer = await fs.promises.readFile(fullScreenshotPath);
    const uploadedImageBuffer = await fs.promises.readFile(
      fullUploadedImagePath
    );

    const screenshotBase64 = screenshotBuffer.toString("base64");
    const uploadedImageBase64 = uploadedImageBuffer.toString("base64");

    // Log API settings
    console.log("Using OpenAI API with:");
    console.log(
      "- API Key:",
      process.env.VITE_OPENAI_API_KEY
        ? "[Using VITE_OPENAI_API_KEY]"
        : process.env.OPENAI_API_KEY
        ? "[Using OPENAI_API_KEY]"
        : "[No API Key found]"
    );
    console.log(
      "- Base URL:",
      process.env.VITE_OPENAI_BASE_URL || "[Default OpenAI URL]"
    );

    // Send request to OpenAI
    const response = await openai.chat.completions.create({
      model: "Proton",
      messages: [
        {
          role: "system",
          content:
            "You are a visual testing expert that compares website screenshots for UI/UX testing.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Compare these two images. The first is a reference screenshot and the second is a test image. Provide a similarity score from 0 to 100, where 100 means identical. Analyze layout differences, color variations, and missing elements. Return a JSON with: score (number), analysis (string), and differences (array of strings).",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${uploadedImageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content || "";
    const result = JSON.parse(content);

    res.json({
      success: true,
      comparison: {
        score: result.score || 0,
        analysis: result.analysis || "No analysis provided",
        differences: result.differences || [],
      },
    });
  } catch (error) {
    console.error("Error comparing images:", error);
    res.status(500).json({
      error: "Failed to compare images",
      message: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Screenshot server running on port ${port}`);
});

export default app;
