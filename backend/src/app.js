import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dosageRoutes from "./routes/dosageRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { uploadDir } from "./middleware/upload.js";
import { categoryUploadDir } from "./middleware/uploadCategory.js";

const app = express();

app.use(cors({ origin: (process.env.CORS_ORIGIN || "").split(",") }));
app.use(express.json());
app.use("/product-images", express.static(uploadDir));
app.use("/api/categories", categoryRoutes); //controller path calling
app.use("/api/dosage-forms", dosageRoutes);
app.use("/api/products", productRoutes);
app.use("/category-images", express.static(categoryUploadDir));

export default app;