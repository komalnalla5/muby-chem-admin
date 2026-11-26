import multer from "multer";
import path from "path";
import fs from "fs";

export const categoryUploadDir = process.env.CATEGORY_UPLOAD_DIR || path.join(process.cwd(), "uploads", "categories");
fs.mkdirSync(categoryUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, categoryUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base =
      path
        .basename(file.originalname, path.extname(file.originalname))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "image";

    let name;
    do {
      name = `${base}-${Math.floor(1000 + Math.random() * 9000)}${ext}`;
    } while (fs.existsSync(path.join(categoryUploadDir, name)));
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or WebP images are allowed"));
  },
});

// reads one file from the form field "category_img"
export const uploadCategoryImage = (req, res, next) => {
  upload.single("category_img")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Image must be under 1 MB" : err.message;
      return res.status(400).json({ success: false, message });
    }
    next();
  });
};