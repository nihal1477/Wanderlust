const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure public/uploads exists for local fallback
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const isCloudinaryConfigured =
  process.env.CLOUD_NAME &&
  process.env.CLOUD_API_KEY &&
  process.env.CLOUD_API_SECRET &&
  process.env.CLOUD_NAME !== "your_cloud_name";

let storage;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "wanderlust_DEV",
      allowed_formats: ["png", "jpg", "jpeg", "webp", "avif"],
    },
  });
} else {
  // Graceful local disk storage fallback
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  });
}

// File filter to only allow image uploads
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|avif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedExtensions.test(file.mimetype);
  const extName = allowedExtensions.test(ext.slice(1));

  if (mimeType || extName) {
    return cb(null, true);
  }
  cb(new Error("Only image files (jpg, jpeg, png, webp, avif) are allowed!"));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

module.exports = {
  cloudinary,
  storage,
  upload,
  isCloudinaryConfigured,
};

