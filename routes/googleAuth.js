import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile","email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google",{session:false}),
  (req,res)=>{

    const token = jwt.sign(
      { id: req.user.id,email:req.user.email },
      process.env.JWT_KEY,
      { expiresIn:"1d"}
    );

    res.redirect(`http://localhost:5173/?token=${token}`);
  }
);
export default router