import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { uploadCategoryImage } from "../middleware/uploadCategory.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", uploadCategoryImage, createCategory);
router.put("/:id", uploadCategoryImage, updateCategory);
router.delete("/:id", deleteCategory);

export default router;