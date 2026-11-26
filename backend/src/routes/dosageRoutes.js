import { Router } from "express";
import { getDosages, deleteDosage, createDosage,  getDosageById,  updateDosage,
 } from "../controllers/dosageController.js";

const router = Router();

router.get("/", getDosages);
router.delete("/:id", deleteDosage);
router.post("/", createDosage);
router.get("/:id", getDosageById);
router.put("/:id", updateDosage);




export default router;