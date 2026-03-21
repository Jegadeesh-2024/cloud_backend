import supabase from "../database/supabase.js";
import { v4 as uuidv4 } from "uuid";
import pool from "../database/db.js";

export const uploadFile = async (req, res) => {
  try {

    const file = req.file;
    const { folder_id } = req.body; // ✅ important
    console.log("Folder ID",folder_id);
    
    

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileId = uuidv4();
    const storageKey = `${fileId}-${file.originalname}`;

    const { data, error } = await supabase.storage
      .from("files")
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

        // Save metadata in PostgreSQL
    const result = await pool.query(
      `INSERT INTO files 
      (id, name, mime_type,folder_id, size_bytes, storage_key, owner_id, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *`,
      [
        fileId,
        file.originalname,
        file.mimetype,
        folder_id,
        file.size,
        storageKey,
        req.user?.id || null,
        
      ]
    );

    res.json({
      message: "File uploaded successfully",
      file: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getTrashFiles = async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT * FROM files
       WHERE owner_id=$1 AND is_deleted=true
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const permanentDeleteFile = async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      "DELETE FROM files WHERE id=$1",
      [id]
    );

    res.json({ message: "File permanently deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const listFiles = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const offset = (page - 1) * limit;

  try {

    // 🔥 Get files
    const filesResult = await pool.query(
      `SELECT * FROM files
       WHERE owner_id=$1 AND is_deleted=false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // 🔥 Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM files
       WHERE owner_id=$1 AND is_deleted=false`,
      [req.user.id]
    );

    const total = parseInt(countResult.rows[0].count);

    res.json({
      files: filesResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};
export const renameFile = async (req, res) => {

  const { id, name } = req.body;

  try {

    const result = await pool.query(
      "UPDATE files SET name=$1 WHERE id=$2 RETURNING *",
      [name, id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};
export const deleteFile = async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      "UPDATE files SET is_deleted=true WHERE id=$1",
      [id]
    );

    res.json({ message: "File moved to trash" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};
export const searchFiles = async (req, res) => {

  const { q = "", page = 1, limit = 5 } = req.query;

  const offset = (page - 1) * limit;

  try {

   const result = await pool.query(
  `SELECT id, name
   FROM files
   WHERE (
     search_vector @@ plainto_tsquery('english', $1)
     OR name ILIKE $2
   )
   AND owner_id = $3
   AND is_deleted = false
   LIMIT $4 OFFSET $5`,
  [q, `%${q}%`, req.user.id, limit, offset]
);
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};
export const restoreFile = async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      "UPDATE files SET is_deleted=false WHERE id=$1",
      [id]
    );

    res.json({ message: "File restored" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// export const getFilesByFolder = async (req, res) => {

//   const { folderId } = req.params;
//    console.log("FolderId:", folderId);
//    const getPublicUrl = (key) => {
//   return `${process.env.SUPABASE_URL}/storage/v1/object/public/files/${key}`;
// };

//   try {

//     const result = await pool.query(
//       `SELECT * FROM files
//        WHERE folder_id=$1 AND is_deleted=false
//        ORDER BY created_at DESC`,
//       [folderId]
//     );

//    const filesWithUrl = result.rows.map(file => ({
//   ...file,
//   url: getPublicUrl(file.storage_key)
// }));

// res.json({
//   files: filesWithUrl
// });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }

// };
export const getFilesByFolder = async (req, res) => {

  const { folderId } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const offset = (page - 1) * limit;

  const getPublicUrl = (key) => {
    return `${process.env.SUPABASE_URL}/storage/v1/object/public/files/${key}`;
  };

  try {

    // ✅ Get paginated files
    const result = await pool.query(
      `SELECT * FROM files
       WHERE folder_id=$1 AND is_deleted=false
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [folderId, limit, offset]
    );

    // ✅ Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM files
       WHERE folder_id=$1 AND is_deleted=false`,
      [folderId]
    );

    const totalFiles = parseInt(countResult.rows[0].count);

    const filesWithUrl = result.rows.map(file => ({
      ...file,
      url: getPublicUrl(file.storage_key)
    }));

    res.json({
      files: filesWithUrl,
      totalPages: Math.ceil(totalFiles / limit) // 🔥 MAIN FIX
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};