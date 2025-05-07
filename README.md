# Visual Testing App

A powerful visual regression testing tool for web applications that allows you to compare website screenshots with reference images using AI-powered analysis.

## Features

- **Screenshot Capture**: Take screenshots of any website by providing a URL
- **Image Comparison**: Compare captured screenshots with reference images
- **AI-Powered Analysis**: Get detailed comparison reports powered by OpenAI and Google Gemini models
- **Pixel-Level Comparison**: Use pixelmatch for precise pixel-by-pixel comparison
- **Multiple Comparison Methods**:
  - OpenAI Vision API
  - Google Gemini Vision API
  - Pixelmatch (pixel-by-pixel comparison)
  - Hybrid approach combining AI and pixel-level analysis

## Tech Stack

- **Frontend**: React with TypeScript, Vite, Blade components (Razorpay design system)
- **Backend**: Express.js server
- **Screenshot Tool**: Puppeteer
- **AI Integration**: OpenAI and Google Gemini APIs
- **Image Processing**: Sharp, Canvas, PngJS, Pixelmatch
- **File Handling**: Multer

## Setup Instructions

1. **Clone the repository**

```
git clone <repository-url>
cd visual-testing
```

2. **Install dependencies**

```
yarn install
```

3. **Environment variables**

Create a `.env` file in the root directory with the following variables:

```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_BASE_URL=your_openai_base_url (optional)
VITE_GEMINI_API_KEY=your_gemini_api_key
CHROME_PATH=/path/to/chrome (optional)
```

4. **Start the development server**

```
# Start the frontend
yarn dev

# Start the screenshot server in a separate terminal
yarn screenshot-server
```

## Usage

1. **Create a new project**
   - Click "New Project" button
   - Enter a project name
   - Enter a URL or upload a reference image

2. **Capture screenshots**
   - The app automatically captures screenshots of the provided URL

3. **Compare images**
   - Upload a reference image to compare with the captured screenshot
   - Select a comparison method (OpenAI, Gemini, Pixelmatch, or Hybrid)
   - View the detailed comparison report

4. **Analysis Report**
   - Overall similarity score (0-100%)
   - Parameter-specific scores:
     - Typography (fonts, text sizes)
     - Layout Alignment (element positioning)
     - Visual Styling (colors, borders, shadows)
     - Copy/Content (text accuracy)
   - Detailed analysis of differences
   - Difference visualization

## API Endpoints

- `POST /api/screenshot`: Capture screenshot of a URL
- `POST /api/upload`: Upload reference image
- `POST /api/compare`: Compare images using OpenAI
- `POST /api/compare-with-gemini`: Compare images using Google Gemini
- `POST /api/compare-pixels`: Compare images using pixel-level comparison
- `POST /api/compare-hybrid`: Compare images using hybrid approach

## Project Structure

- `src/`: Source code
  - `components/`: React components
    - `ComparisonReport.tsx`: Displays comparison results
    - `ImageComparison.tsx`: Main comparison interface
    - `NewProjectInput.tsx`: Project creation form
    - `ScreenshotCapture.tsx`: URL screenshot tool
    - `Input.tsx`: Reusable input component
    - `ImageUpload.tsx`: Image upload component
  - `server/`: Backend code
    - `screenshotServer.js`: Express server with all API endpoints
  - `App.tsx`: Main application component
- `screenshots/`: Captured screenshots storage
- `uploads/`: Uploaded reference images storage
