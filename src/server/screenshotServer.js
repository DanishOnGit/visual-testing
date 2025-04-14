import express from 'express';
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static screenshots folder
const screenshotsDir = path.join(__dirname, '../../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
app.use('/screenshots', express.static(screenshotsDir));

// Screenshot API endpoint
app.post('/api/screenshot', async (req, res) => {
  const { url, fullPage = false, width = 1280, height = 800 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Create filename based on URL and timestamp
    const timestamp = Date.now();
    const urlSlug = url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '-');
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
      }
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({
      error: 'Failed to capture screenshot',
      message: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Start server
app.listen(port, () => {
  console.log(`Screenshot server running on port ${port}`);
});

export default app; 