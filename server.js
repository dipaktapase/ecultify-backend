const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = 5000;

const api_key = process.env.API_KEY;
const url = "https://api.segmind.com/v1/live-portrait";

const allowedOrigins = [
  "https://ecultify-frontend.vercel.app/",
  "https://ecultify-frontend-git-master-dipaktapases-projects.vercel.app",
  "http://localhost:3000", // For local development
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
};

// app.use(cors());
app.use(cors(corsOptions));

const upload = multer({ dest: "uploads/" });

// Use this function to convert an image file from the filesystem to base64
function imageFileToBase64(imagePath) {
  const imageData = fs.readFileSync(path.resolve(imagePath));
  return Buffer.from(imageData).toString("base64");
}

// Use this function to fetch an image from a URL and convert it to base64
async function imageUrlToBase64(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary").toString("base64");
}

app.post("/generate-gif", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const imageBase64 = imageFileToBase64(req.file.path);

  const data = {
    face_image: imageBase64, // Use the uploaded image
    driving_video: "https://segmind-sd-models.s3.amazonaws.com/display_images/liveportrait-video.mp4",
    live_portrait_dsize: 512,
    live_portrait_scale: 2.3,
    video_frame_load_cap: 128,
    live_portrait_lip_zero: true,
    live_portrait_relative: true,
    live_portrait_vx_ratio: 0,
    live_portrait_vy_ratio: -0.12,
    live_portrait_stitching: true,
    video_select_every_n_frames: 1,
    live_portrait_eye_retargeting: false,
    live_portrait_lip_retargeting: false,
    live_portrait_lip_retargeting_multiplier: 1,
    live_portrait_eyes_retargeting_multiplier: 1,
  };

  try {
    const response = await axios.post(url, data, {
      headers: { "x-api-key": api_key },
      responseType: "arraybuffer",
    });

    res.set({
      "Content-Type": "video/mp4",
      "Content-Disposition": 'attachment; filename="generated-gif.mp4"',
    });

    res.send(response.data);

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to generate GIF" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
