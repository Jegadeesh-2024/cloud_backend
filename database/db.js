import pkg from "pg";

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";

const pool = isProduction
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: "postgres",
      host: "localhost",
      database: "cloudstorage",
      password: "123456",   // ✅ MUST be string
      port: 5432,
    });

export default pool;