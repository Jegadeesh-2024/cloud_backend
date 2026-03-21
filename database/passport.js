import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "../database/db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback"
    },

    async (accessToken, refreshToken, profile, done) => {

      try {

        const email = profile.emails[0].value;
        const name = profile.displayName;
        const image = profile.photos[0].value;

        // check user exists
        const existingUser = await pool.query(
          "SELECT * FROM users WHERE email=$1",
          [email]
        );

        if(existingUser.rows.length > 0){
          return done(null, existingUser.rows[0]);
        }

        // insert new user
        const newUser = await pool.query(
          `INSERT INTO users (email,name,image_url)
           VALUES ($1,$2,$3)
           RETURNING *`,
          [email,name,image]
        );

        return done(null,newUser.rows[0]);

      } catch(error){
        return done(error,null);
      }

    }
  )
);