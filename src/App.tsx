import { useState, useEffect, useRef } from "react";
import "./App.css";
import { Box, Text } from "@razorpay/blade/components";
import Input from "./components/Input";
import ImageUpload from "./components/ImageUpload";
import ScreenshotCapture from "./components/ScreenshotCapture";
import ImageComparison from "./components/ImageComparison";
import NewProjectInput from "./components/NewProjectInput";

function App() {
  const [count, setCount] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [projectName, setProjectName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageComparisonOpen, setImageComparisonOpen] = useState(false);
  // Add states for captured screenshot and uploaded image for comparison
  const [screenshot, setScreenshot] = useState<{
    path: string;
    imageUrl: string;
  } | null>(null);

  const [uploadedImageDetails, setUploadedImageDetails] = useState<{
    path: string;
    imageUrl: string;
  } | null>(null);

  useEffect(() => {
    console.log("Screenshot state:", screenshot);
    console.log("Uploaded image details:", uploadedImageDetails);
  }, [screenshot, uploadedImageDetails]);

  const handleFileChange = (e: { name?: string; fileList: FileList []}) => {
    console.log("File change event:", e);
    const file = e.fileList?.[0];
    if (!file) return;

    setFilename(file.name);
    setSelectedImage(file);
    handleImageUpload(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (file: File) => {
    setUploadedImage(file);

    // Upload the image to the server
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:3001/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      console.log("Upload response:", data);

      if (data.success) {
        setUploadedImageDetails({
          path: data.file.fullPath,
          imageUrl: `http://localhost:3001${data.file.path}`,
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleScreenshotCapture = (result: {
    success: boolean;
    path: string;
    imageUrl: string;
  }) => {
    console.log("Screenshot capture result:", result);
    if (result.success) {
      setScreenshot({
        path: result.path,
        imageUrl: result.imageUrl,
      });
    }
  };

  const captureScreenshot = async () => {
    if (!imageUrl) {
      const errorResult = {
        success: false,
        message: "Please enter a valid URL",
        path: "",
        imageUrl: "",
      };
      //  setResult(errorResult);
      handleScreenshotCapture(errorResult);
      return;
    }

    //  setIsLoading(true);
    //  setResult({ success: false, message: "" });

    try {
      // Ensure URL has protocol
      const validUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `https://${imageUrl}`;

      // Call the screenshot API server
      const response = await fetch("http://localhost:3001/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: validUrl,
          fullPage: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorResult = {
          success: false,
          message: errorData.message || "Failed to capture screenshot",
          path: "",
          imageUrl: "",
        };
        //  setResult(errorResult);
        handleScreenshotCapture(errorResult);
        throw new Error(errorData.message || "Failed to capture screenshot");
      }

      const data = await response.json();

      const successResult = {
        success: true,
        message: "Screenshot captured successfully!",
        path: data.file.fullPath,
        imageUrl: `http://localhost:3001${data.file.path}`,
      };

      //  setResult(successResult);

      // Call the callback with the successful result
      if (handleScreenshotCapture) {
        handleScreenshotCapture(successResult);
      }
    } catch (error) {
      console.error("Screenshot error:", error);
      const errorResult = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to capture screenshot",
        path: "",
        imageUrl: "",
      };
      //  setResult(errorResult);
      handleScreenshotCapture?.(errorResult);
    } finally {
      //  setIsLoading(false);
    }
  };

  const runTest = async() => {
    console.log("Running test...");
    try{
      await captureScreenshot();
      setImageComparisonOpen(true);
    }catch(error){
      console.error("Error running test:", error);
    }
    // handleImageUpload();
  };

  return (
    <div className="container">
      <Text>Visual Testing Tool</Text>

      <Box>
        <div className="card">
          <div className="form-group">
            <Input
              value={imageUrl}
              onChange={setImageUrl}
              label="Website URL"
              placeholder="Enter a website URL to capture (e.g., https://example.com)"
            />
          </div>

          <div className="form-group">
            <ScreenshotCapture
              url={imageUrl}
              onCaptureComplete={handleScreenshotCapture}
            />
          </div>

          <div className="form-group">
            <ImageUpload
              onImageUpload={handleImageUpload}
              label="Or upload an image for comparison"
            />
          </div>
        </div>
      </Box>
      <NewProjectInput
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        handleFileChange={handleFileChange}
        projectName={projectName}
        setProjectName={setProjectName}
        runTest={runTest}
      />
      {screenshot && uploadedImageDetails && (
        <div className="form-group">
          <ImageComparison
            screenshotUrl={screenshot.imageUrl}
            screenshotPath={screenshot.path}
            uploadedImageUrl={uploadedImageDetails.imageUrl}
            uploadedImagePath={uploadedImageDetails.path}
            imageComparisonOpen={imageComparisonOpen}
            setImageComparisonOpen={setImageComparisonOpen}
          />
        </div>
      )}
      <div className="debug-info">
        <p>Debug Info:</p>
        <p>Screenshot captured: {screenshot ? "Yes" : "No"}</p>
        <p>Image uploaded: {uploadedImageDetails ? "Yes" : "No"}</p>
        <p>
          Compare should show:{" "}
          {screenshot && uploadedImageDetails ? "Yes" : "No"}
        </p>
      </div>

      <Text>
        {uploadedImage
          ? `Selected file: ${uploadedImage.name} (${Math.round(
              uploadedImage.size / 1024
            )} KB)`
          : "No file selected"}
      </Text>
    </div>
  );
}

export default App;
