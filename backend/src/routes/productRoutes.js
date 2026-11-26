import { Router } from "express";
import { getProducts, getProductById, createProduct, updateProduct,  deleteProduct} from "../controllers/productController.js";
import { uploadProductImage } from "../middleware/upload.js";

const router = Router();

router.get("/", getProducts); //product listing
router.get("/:id", getProductById); //view product
router.post("/", uploadProductImage, createProduct); // add product
router.put("/:id", uploadProductImage, updateProduct); // update product
router.delete("/:id", deleteProduct); // soft delete

export default router;