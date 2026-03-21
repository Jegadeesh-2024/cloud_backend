import pool from "../database/db.js";
import { v4 as uuidv4 } from "uuid";

export const createFolder = async (req, res) => {
  console.log(req.user);
  const { name, parent_id } = req.body;

  try {

    const result = await pool.query(
      `INSERT INTO folders(id,name,parent_id,owner_id)
       VALUES($1,$2,$3,$4)
       RETURNING *`,
      [
        uuidv4(),
        name,
        parent_id || null,
        req.user.id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const renameFolder = async (req, res) => {

  const { id, name } = req.body;

  try {

    const result = await pool.query(
      "UPDATE folders SET name=$1 WHERE id=$2 RETURNING *",
      [name, id]
    );

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};
export const deleteFolder = async (req,res)=>{

  const { id } = req.params;

  await pool.query(
    "UPDATE folders SET is_deleted=true WHERE id=$1",
    [id]
  );

  res.json({message:"Folder moved to trash"});
};
export const getFolders = async (req, res) => {

  try {

    const result = await pool.query(
      `SELECT * FROM folders
       WHERE owner_id = $1
       AND is_deleted = false
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};
// GET /files/folder/:folderId
