import pool from "../config/db.js";

// Dosage form LIST API----------
export const getDosages = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, dosage_key, status, created_at, updated_at
       FROM dosage_forms
       ORDER BY id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getDosages error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dosage forms" });
  }
};

// DELETE dosage list API 
export const deleteDosage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dosage form id" });
    }
    const [rows] = await pool.query("SELECT id FROM dosage_forms WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dosage form not found" });
    }
    await pool.query("DELETE FROM dosage_forms WHERE id = ?", [id]);
    res.json({ success: true, message: "Dosage form deleted" });
  } catch (err) {
    console.error("deleteDosage error:", err);
    res.status(500).json({ success: false, message: "Failed to delete dosage form" });
  }
};

// ADD dosage form API
const makeKey = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const createDosage = async (req, res) => {
  try {
    const { name, status } = req.body || {};
    const cleanName = (name || "").trim();
    const cleanStatus = status === "inactive" ? "inactive" : "active";
    if (!cleanName) {
      return res
        .status(400)
        .json({ success: false, message: "Dosage form name is required" });
    }
    const dosageKey = makeKey(cleanName);
    if (!dosageKey) {
      return res.status(400).json({
        success: false,
        message: "Dosage form name must contain letters or numbers",
      });
    }
    const [result] = await pool.query(
      "INSERT INTO dosage_forms (name, dosage_key, status) VALUES (?, ?, ?)",
      [cleanName, dosageKey, cleanStatus]
    );
    res.status(201).json({
      success: true,
      message: "Dosage form created",
      data: { id: result.insertId },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A dosage form with this name already exists",
      });
    }
    console.error("createDosage error:", err);
    res.status(500).json({ success: false, message: "Failed to create dosage form" });
  }
};

// dosage id wise fetch data GET API
export const getDosageById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      "SELECT id, name, dosage_key, status FROM dosage_forms WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dosage form not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getDosageById error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dosage form" });
  }
};

// ---------- UPDATE ----------
export const updateDosage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, status } = req.body || {};
    const cleanName = (name || "").trim();
    const cleanStatus = status === "inactive" ? "inactive" : "active";
    if (!cleanName) {
      return res
        .status(400)
        .json({ success: false, message: "Dosage form name is required" });
    }
    const dosageKey = makeKey(cleanName);
    if (!dosageKey) {
      return res.status(400).json({
        success: false,
        message: "Dosage form name must contain letters or numbers",
      });
    }
    const [rows] = await pool.query("SELECT id FROM dosage_forms WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Dosage form not found" });
    }
    await pool.query(
      "UPDATE dosage_forms SET name = ?, dosage_key = ?, status = ? WHERE id = ?",
      [cleanName, dosageKey, cleanStatus, id]
    );
    res.json({ success: true, message: "Dosage form updated" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A dosage form with this name already exists",
      });
    }
    console.error("updateDosage error:", err);
    res.status(500).json({ success: false, message: "Failed to update dosage form" });
  }
};