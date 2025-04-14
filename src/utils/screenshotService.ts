import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScreenshotOptions {
  url: string;
  outputPath?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  fileName?: string;
}

/**
 * Takes a screenshot of a URL using Puppeteer
 * @param options Screenshot options
 * @returns Path to the saved screenshot file
 */
export const takeScreenshot = async (options: ScreenshotOptions): Promise<string> => {
  const {
    url,
    outputPath = path.join(__dirname, '../../../screenshots'),
    width = 1280,
    height = 800,
    fullPage = false,
    fileName = `screenshot-${Date.now()}.png`
  } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  // Ensure the output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true, // Use headless mode
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Specify Chrome path
  });

  try {
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width, height });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2', // Wait until the network is idle
      timeout: 30000, // 30 seconds timeout
    });

    // Take the screenshot
    const filePath = path.join(outputPath, fileName);
    await page.screenshot({
      path: filePath,
      fullPage,
    });

    console.log(`Screenshot saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

/**
 * Takes multiple screenshots of a URL with different viewport sizes
 * @param url The URL to screenshot
 * @param outputPath Path to save screenshots
 * @returns Array of paths to the saved screenshot files
 */
export const takeResponsiveScreenshots = async (
  url: string,
  outputPath: string = path.join(__dirname, '../../../screenshots')
): Promise<string[]> => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 800, name: 'desktop' },
    { width: 1920, height: 1080, name: 'large-desktop' }
  ];

  const filePaths: string[] = [];

  for (const viewport of viewports) {
    const fileName = `${url.replace(/[^a-zA-Z0-9]/g, '-')}-${viewport.name}-${Date.now()}.png`;
    const filePath = await takeScreenshot({
      url,
      outputPath,
      width: viewport.width,
      height: viewport.height,
      fileName
    });
    filePaths.push(filePath);
  }

  return filePaths;
}; 