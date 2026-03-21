import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from "cors";
import pool from "./database/db.js";

import router from "./routes/route.js";

import passport from "passport";
import session from "express-session";
import "./database/passport.js";
import googleAuth from "./routes/googleAuth.js";
import fileRoutes from "./routes/fileRoutes.js";

import folderRoutes from "./routes/folderRoutes.js";


const app = express();

const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);
app.use("/auth", googleAuth);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);


app.get("/", (req, res) => {
  res.send("API Work");
});
app.get("/testdb", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    res.status(500).send("Database error");
  }
});

app.listen(port, () => {
  console.log(` server running on http://localhost:${port}`);
});
