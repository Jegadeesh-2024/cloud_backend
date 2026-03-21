import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import pool from "../database/db.js";



export const register = async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  try {

    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
      [name, email, hash]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token, message: "Register successful" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error" });
  }
};
export const login = async (req, res) => {

  const { email, password } = req.body;

  try {

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const dbUser = user.rows[0];

    const isMatch = await bcrypt.compare(password, dbUser.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: dbUser.id },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token, message: "Login successful" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Server error" });
  }
};