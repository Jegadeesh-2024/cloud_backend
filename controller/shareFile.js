import { v4 as uuidv4 } from "uuid";
import pool from "../database/db.js";
import supabase from "../database/supabase.js";
import crypto from "crypto";

// export const shareFile = async (req, res) => {

//   const { file_id, email, permission } = req.body;

//   try {

//     const result = await pool.query(
//       `INSERT INTO shares
//       (id,file_id,shared_by,shared_with_email,permission)
//       VALUES($1,$2,$3,$4,$5)
//       RETURNING *`,
//       [
//         uuidv4(),
//         file_id,
//         req.user.id,
//         email,
//         permission
//       ]
//     );

//     res.json(result.rows[0]);

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };



export const shareFile = async (req, res) => {

  const { file_id, email, permission } = req.body;

  try {

    // 🔥 1. check already shared
    const existing = await pool.query(
      "SELECT * FROM shares WHERE file_id=$1 AND shared_with_email=$2",
      [file_id, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Already shared with this user"
      });
    }

    // 🔥 2. insert
    const result = await pool.query(
      `INSERT INTO shares
      (id,file_id,shared_by,shared_with_email,permission)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        uuidv4(),
        file_id,
        req.user.id,
        email,
        permission
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.log(error); // 🔥 debug
    res.status(500).json({ error: error.message });

  }

};
// export const getSharedFiles = async (req, res) => {

//   try {

//     const result = await pool.query(
//       `SELECT shares.*
//        FROM files
//        JOIN shares ON files.id = shares.file_id
//        WHERE shares.shared_with_email = $1`,
//       [req.user.email]
//     );

//     res.json(result.rows);

//   } catch (error) {

//     res.status(500).json({ error: error.message });

//   }

// };

export const getSharedFiles = async (req, res) => {

  const { fileId } = req.params;

  try {

    const result = await pool.query(
      `SELECT * FROM shares WHERE file_id=$1`,
      [fileId]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};
// export const getFileShares = async (req, res) => {
//   const { fileId } = req.params;

//   try {
//     const result = await pool.query(
//       `SELECT * FROM shares WHERE file_id=$1`,
//       [fileId]
//     );

//     res.json(result.rows);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
export const getFileUrl = async (req, res) => {

  const { storage_key } = req.params;

  const { data, error } = await supabase.storage
    .from("files")
    .createSignedUrl(storage_key, 60);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};
export const updateShare = async (req, res) => {
  const { id } = req.params;
  const { permission } = req.body;

  try {
    const result = await pool.query(
      "UPDATE shares SET permission=$1 WHERE id=$2 RETURNING *",
      [permission, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const deleteShare = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM shares WHERE id=$1", [id]);
    res.json({ message: "Share removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getFilesSharedWithMe = async (req, res) => {

  try {

    const result = await pool.query(
      `SELECT files.*, shares.permission
       FROM shares
       JOIN files ON files.id = shares.file_id
       WHERE LOWER(shares.shared_with_email) =LOWER($1) `,
      [req.user.email]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};
// getsharred by link in email:
export const createShareLink = async (req, res) => {
  const { fileId } = req.params;

  try {
    // ✅ check already link exists
    const existing = await pool.query(
      "SELECT * FROM shares WHERE file_id=$1 AND is_link=true",
      [fileId]
    );

    if (existing.rows.length > 0) {
      return res.json({
        link: `${process.env.FRONTEND_URL}/share/${existing.rows[0].share_id}`,
      });
    }

    // ✅ generate new link
    const shareId = crypto.randomBytes(16).toString("hex");

    await pool.query(
      `INSERT INTO shares (id, file_id, shared_by, share_id, is_link)
       VALUES ($1,$2,$3,$4,true)`,
      [uuidv4(), fileId, req.user.id, shareId]
    );

    const link = `${process.env.FRONTEND_URL}/share/${shareId}`;

    res.json({ link });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getSharedFileByLink = async (req, res) => {
  const { shareId } = req.params;

  try {
    const result = await pool.query(
      `SELECT files.*
       FROM shares
       JOIN files ON files.id = shares.file_id
       WHERE shares.share_id=$1 AND shares.is_link=true`,
      [shareId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid link" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
