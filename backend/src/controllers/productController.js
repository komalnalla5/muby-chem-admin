import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { uploadDir } from "../middleware/upload.js";

// Fetch products LIST  
export const getProducts = async (req, res) => {
  try {
    // pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;

    // filters
    const search = (req.query.search || "").trim();
    const status = req.query.status;
    const categoryId = Number(req.query.category) || 0;

    const where = ["p.deleted_at IS NULL"];
    const params = [];

    if (search) {
      where.push("p.product_name LIKE ?");
      params.push(`%${search}%`);
    }

    if (status === "active" || status === "inactive") {
      where.push("p.status = ?");
      params.push(status);
    }

    // chosen category, or any of its sub-categories
    if (categoryId) {
      where.push(
        `EXISTS (
           SELECT 1 FROM product_categories pc
           WHERE pc.product_id = p.id
             AND (pc.category_id = ?
                  OR pc.category_id IN (SELECT id FROM categories WHERE parent_id = ?))
         )`
      );
      params.push(categoryId, categoryId);
    }

    const whereSql = where.join(" AND ");

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p WHERE ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
    `SELECT p.*,
            (SELECT GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ')
                FROM product_categories pc
                JOIN categories c ON c.id = pc.category_id
                WHERE pc.product_id = p.id) AS categories,
            (SELECT GROUP_CONCAT(d.name ORDER BY d.name SEPARATOR ', ')
                FROM product_dosage_forms pd
                JOIN dosage_forms d ON d.id = pd.dosage_form_id
                WHERE pd.product_id = p.id) AS dosage_forms
        FROM products p
        WHERE ${whereSql}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?`,
    [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// Get prodict id wise product details for view product
export const getProductById  = async (req, res) => {
    try{
       const id = Number(req.params.id);
       if(!id){
        return res.status(400).json({ success: false, message: "Invalid product id" });;
       }

      const [rows] = await pool.query(
        "SELECT * FROM products WHERE id = ? AND deleted_at IS NULL",
        [id]
      );

      if (rows.length === 0) {
        return res
        .status(404)
        .json({ success: false, message: "Product not found" });
      }

      const[categories]= await pool.query(
        `SELECT c.id, c.name
            FROM product_categories pc
            JOIN categories c ON c.id = pc.category_id
            WHERE pc.product_id = ?
            ORDER BY c.name`,
        [id]
      );

      const [dosageForms]= await pool.query(
        `SELECT d.id, d.name
            FROM product_dosage_forms pd
            JOIN dosage_forms d ON d.id = pd.dosage_form_id
            WHERE pd.product_id = ?
            ORDER BY d.name`,
        [id]
      );

      res.json({
        success: true,
        data: { ...rows[0], categories, dosage_forms: dosageForms },
      });


    }
    catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

const makeSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

const clean = (value) => {
  const text = (value ?? "").toString().trim();
  return text === "" ? null : text;
};

// ids arrive as a JSON text like "[1,2]", because FormData can't send lists
const parseIds = (value) => {
  try {
    const list = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(list)) return [];
    return [...new Set(list.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  } catch {
    return [];
  }
};
const removeUploadedFile = (req) => {
  if (req.file) fs.unlink(req.file.path, () => {});
};

// add product functionality
export const createProduct = async (req, res) => {
  const body = req.body || {};
  const productName = (body.product_name || "").trim();

  if (!productName) {
    removeUploadedFile(req);
    return res
      .status(400)
      .json({ success: false, message: "Product name is required" });
  }

  if (!req.file) {
  return res
    .status(400)
    .json({ success: false, message: "Product image is required" });
  }

  const slug = makeSlug((body.slug || "").trim() || productName);
  const status = body.status === "inactive" ? "inactive" : "active";
  const categoryIds = parseIds(body.category_ids);
  const dosageIds = parseIds(body.dosage_ids);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
      const [result] = await conn.query(
        `INSERT INTO products
          (product_name, slug, cas_no, grade, therapeutic_category, brand_name,
          intro_by, \`register\`, certificate, ec_number, formula, molecular_weight,
          product_status, product_img, product_img_alt,
          mechanism_of_action, indication,
          meta_title, meta_keyword, meta_description, meta_schema, meta_canonical,
          status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productName,
          slug,
          clean(body.cas_no),
          clean(body.grade),
          clean(body.therapeutic_category),
          clean(body.brand_name),
          clean(body.intro_by),
          clean(body.register),
          clean(body.certificate),
          clean(body.ec_number),
          clean(body.formula),
          clean(body.molecular_weight),
          clean(body.product_status) || "Commercially Available",
          req.file ? req.file.filename : null,
          clean(body.product_img_alt),
          clean(body.mechanism_of_action),
          clean(body.indication),
          clean(body.meta_title),
          clean(body.meta_keyword),
          clean(body.meta_description),
          clean(body.meta_schema),
          clean(body.meta_canonical),
          status,
        ]
      );
    const productId = result.insertId;
    // 2. its categories
    if (categoryIds.length > 0) {
      await conn.query(
        "INSERT INTO product_categories (product_id, category_id) VALUES ?",
        [categoryIds.map((id) => [productId, id])]
      );
    }

    // 3. its dosage forms
    if (dosageIds.length > 0) {
      await conn.query(
        "INSERT INTO product_dosage_forms (product_id, dosage_form_id) VALUES ?",
        [dosageIds.map((id) => [productId, id])]
      );
    }
    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Product created",
      data: { id: productId },
    });
  } catch (err) {
    await conn.rollback();
    removeUploadedFile(req);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "Invalid category or dosage form",
      });
    }

    console.error("createProduct error:", err);
    res.status(500).json({ success: false, message: "Failed to create product" });
  } finally {
    conn.release();
  }
};

// UPDATE products 
export const updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const productName = (body.product_name || "").trim();

  if (!id) {
    removeUploadedFile(req);
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  if (!productName) {
    removeUploadedFile(req);
    return res
      .status(400)
      .json({ success: false, message: "Product name is required" });
  }

  const slug = makeSlug((body.slug || "").trim() || productName);
  const status = body.status === "inactive" ? "inactive" : "active";
  const categoryIds = parseIds(body.category_ids);
  const dosageIds = parseIds(body.dosage_ids);
  const conn = await pool.getConnection();

  try {
    const [rows] = await conn.query(
      "SELECT id, product_img FROM products WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (rows.length === 0) {
      removeUploadedFile(req);
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const oldImg = rows[0].product_img;
    let newImg = oldImg;
    if (req.file) newImg = req.file.filename;
    else if (body.remove_image === "1") newImg = null;
    await conn.beginTransaction();

    // 1.  product table update
    await conn.query(
      `UPDATE products SET
         product_name = ?, slug = ?, cas_no = ?, grade = ?, therapeutic_category = ?,
         brand_name = ?, intro_by = ?, \`register\` = ?, certificate = ?, ec_number = ?,
         formula = ?, molecular_weight = ?, product_status = ?, product_img = ?,
         product_img_alt = ?, mechanism_of_action = ?, indication = ?,
         meta_title = ?, meta_keyword = ?, meta_description = ?, meta_schema = ?,
         meta_canonical = ?, status = ?
       WHERE id = ?`,
      [
        productName,
        slug,
        clean(body.cas_no),
        clean(body.grade),
        clean(body.therapeutic_category),
        clean(body.brand_name),
        clean(body.intro_by),
        clean(body.register),
        clean(body.certificate),
        clean(body.ec_number),
        clean(body.formula),
        clean(body.molecular_weight),
        clean(body.product_status) || "Commercially Available",
        newImg,
        clean(body.product_img_alt),
        clean(body.mechanism_of_action),
        clean(body.indication),
        clean(body.meta_title),
        clean(body.meta_keyword),
        clean(body.meta_description),
        clean(body.meta_schema),
        clean(body.meta_canonical),
        status,
        id,
      ]
    );

    // 2. categories: remove the old links, add the chosen data
    await conn.query("DELETE FROM product_categories WHERE product_id = ?", [id]);
    if (categoryIds.length > 0) {
      await conn.query(
        "INSERT INTO product_categories (product_id, category_id) VALUES ?",
        [categoryIds.map((cid) => [id, cid])]
      );
    }

    // 3. dosage forms: remove the old links, add the chosen data
    await conn.query("DELETE FROM product_dosage_forms WHERE product_id = ?", [id]);
    if (dosageIds.length > 0) {
      await conn.query(
        "INSERT INTO product_dosage_forms (product_id, dosage_form_id) VALUES ?",
        [dosageIds.map((did) => [id, did])]
      );
    }
    await conn.commit();

    //remove old image file from folder
    if (oldImg && oldImg !== newImg) {
      fs.unlink(path.join(uploadDir, path.basename(oldImg)), () => {});
    }

    res.json({ success: true, message: "Product updated" });
  } catch (err) {
    await conn.rollback();
    removeUploadedFile(req);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "Invalid category or dosage form",
      });
    }

    console.error("updateProduct error:", err);
    res.status(500).json({ success: false, message: "Failed to update product" });
  } finally {
    conn.release();
  }
};

// DELETE product API
export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const [result] = await pool.query(
      "UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product moved to trash" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};