import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { categoryUploadDir } from "../middleware/uploadCategory.js";

const makeKey = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

// category listing fetch API 
export const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.category_key, c.parent_id, c.category_img,
        p.name AS parent_name, c.status, c.is_market_served,
        c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM product_categories pc
          WHERE pc.category_id = c.id) AS product_count
        FROM categories c
        LEFT JOIN categories p ON p.id = c.parent_id
        WHERE c.deleted_at IS NULL
        ORDER BY c.id DESC`
       );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};


const removeUploadedFile = (req) => {
  if (req.file) fs.unlink(req.file.path, () => {});
};

// "" becomes null, so empty boxes are saved as NULL
const clean = (value) => {
  const text = (value ?? "").toString().trim();
  return text === "" ? null : text;
};

// delete the uploaded file, then answer with an error
const fail = (req, res, status, message) => {
  removeUploadedFile(req);
  return res.status(status).json({ success: false, message });
};

export const createCategory = async (req, res) => {
  try {
    const body = req.body || {};

    const cleanName = (body.name || "").trim();
    const cleanStatus = body.status === "inactive" ? "inactive" : "active";
    const parentId = body.parent_id ? Number(body.parent_id) : null;
    // FormData sends the checkbox as the text "true" or "false"
    const marketServed = body.is_market_served === "true" || body.is_market_served === "1" ? 1 : 0;

    if (!cleanName) return fail(req, res, 400, "Category name is required");
   if (!parentId && !req.file) return fail(req, res, 400, "Category image is required");

    const categoryKey = makeKey((body.slug || "").trim() || cleanName); 
    if (!categoryKey) {
      return fail(req, res, 400, "Slug must contain letters or numbers");
    }

    if (parentId) {
      const [parents] = await pool.query(
        "SELECT id, parent_id FROM categories WHERE id = ? AND deleted_at IS NULL",
        [parentId]
      );

      if (parents.length === 0) {
        return fail(req, res, 400, "Parent category not found");
      }
      if (parents[0].parent_id !== null) {
        return fail(req, res, 400, "Only main categories can be a parent");
      }
    }
    const imageName = !parentId && req.file ? req.file.filename : null;
    const [result] = await pool.query(
      `INSERT INTO categories
        (name, category_key, parent_id, status, is_market_served,
         category_img, category_img_alt,
         meta_title, meta_keyword, meta_description, meta_schema, meta_canonical)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanName,
        categoryKey,
        parentId,
        cleanStatus,
        marketServed,
        imageName,
        clean(body.category_img_alt),
        clean(body.meta_title),
        clean(body.meta_keyword),
        clean(body.meta_description),
        clean(body.meta_schema),
        clean(body.meta_canonical),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Category created",
      data: { id: result.insertId },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return fail(req, res, 409, "A category with this slug already exists");
    }
    console.error("createCategory error:", err);
    removeUploadedFile(req);
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const [rows] = await pool.query(
      "SELECT id, category_img FROM categories WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const [children] = await pool.query(
      "SELECT COUNT(*) AS total FROM categories WHERE parent_id = ?",
      [id]
    );
    if (children[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: "This category has sub-categories. Delete them first.",
      });
    }

    // NEW: products check
    const [products] = await pool.query(
      "SELECT COUNT(*) AS total FROM product_categories WHERE category_id = ?",
      [id]
    );
    if (products[0].total > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This category has products, so you can't delete it directly. Delete those products first, then delete this category.",
      });
    }

    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    if (rows[0].category_img) {
      fs.unlink(
        path.join(categoryUploadDir, path.basename(rows[0].category_img)),
        () => {}
      );
    }

    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};

// Get single category 
  export const getCategoryById = async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid category id" });
      }

      const [rows] = await pool.query(
        `SELECT id, name, category_key, parent_id, status, is_market_served,
                category_img, category_img_alt,
                meta_title, meta_keyword, meta_description, meta_schema, meta_canonical
        FROM categories
        WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      console.error("getCategoryById error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch category" });
    }
  };
// Update category API
export const updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(req, res, 400, "Invalid category id");
    }

    const body = req.body || {};
    const cleanName = (body.name || "").trim();
    const cleanStatus = body.status === "inactive" ? "inactive" : "active";
    const parentId = body.parent_id ? Number(body.parent_id) : null;
    const marketServed =
      body.is_market_served === "true" || body.is_market_served === "1" ? 1 : 0;

    if (!cleanName) return fail(req, res, 400, "Category name is required");

    const categoryKey = makeKey((body.slug || "").trim() || cleanName);
    if (!categoryKey) {
      return fail(req, res, 400, "Slug must contain letters or numbers");
    }

    // the category being edited must exist
    const [existing] = await pool.query(
      "SELECT id, category_img FROM categories WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    if (existing.length === 0) {
      return fail(req, res, 404, "Category not found");
    }

    if (parentId !== null) {
      if (!Number.isInteger(parentId) || parentId <= 0) {
        return fail(req, res, 400, "Invalid parent category");
      }
      if (parentId === id) {
        return fail(req, res, 400, "A category cannot be its own parent");
      }

      const [parents] = await pool.query(
        "SELECT id, parent_id FROM categories WHERE id = ? AND deleted_at IS NULL",
        [parentId]
      );
      if (parents.length === 0) {
        return fail(req, res, 400, "Parent category not found");
      }
      if (parents[0].parent_id !== null) {
        return fail(req, res, 400, "Only main categories can be a parent");
      }

      // a category that has sub-categories cannot become a sub-category
      const [children] = await pool.query(
        "SELECT COUNT(*) AS total FROM categories WHERE parent_id = ? AND deleted_at IS NULL",
        [id]
      );
      if (children[0].total > 0) {
        return fail(
          req,
          res,
          400,
          "This category has sub-categories, so it cannot have a parent category"
        );
      }
    }

    //Decide which image the category will have
   const oldImg = existing[0].category_img;
    let newImg = oldImg;
    if (req.file) newImg = req.file.filename;
    else if (body.remove_image === "1") newImg = null;

    if (parentId) {
      removeUploadedFile(req);
      newImg = null;
    } else if (!newImg) {
      return fail(req, res, 400, "Category image is required");
    }

    await pool.query(
      `UPDATE categories SET
         name = ?, category_key = ?, parent_id = ?, status = ?, is_market_served = ?,
         category_img = ?, category_img_alt = ?,
         meta_title = ?, meta_keyword = ?, meta_description = ?,
         meta_schema = ?, meta_canonical = ?
       WHERE id = ?`,
      [
        cleanName,
        categoryKey,
        parentId,
        cleanStatus,
        marketServed,
        newImg,
        clean(body.category_img_alt),
        clean(body.meta_title),
        clean(body.meta_keyword),
        clean(body.meta_description),
        clean(body.meta_schema),
        clean(body.meta_canonical),
        id,
      ]
    );

    // the old image file is not needed any more
    if (oldImg && oldImg !== newImg) {
      fs.unlink(path.join(categoryUploadDir, path.basename(oldImg)), () => {});
    }

    res.json({ success: true, message: "Category updated" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return fail(req, res, 409, "A category with this slug already exists");
    }
    console.error("updateCategory error:", err);
    removeUploadedFile(req);
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
};