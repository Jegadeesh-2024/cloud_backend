import jwt from "jsonwebtoken";

const auth = (req, res, next) => {

  const token = req.header("token");
console.log("Header token:", req.header("token"));
  if (!token) {
    return res.json({
      success: false,
      message: "Token missing"
    });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    req.user = decoded;

    next();

  } catch (error) {

    return res.json({
      success: false,
      message: "Invalid token"
    });

  }

};

export default auth;