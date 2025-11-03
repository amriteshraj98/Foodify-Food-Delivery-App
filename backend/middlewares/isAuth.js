import jwt from "jsonwebtoken";
const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "token not found" });
    }
    // token ko verify karna hai
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodeToken) {
      return res.status(400).json({ message: "token not verify" });
    }
    // req me userId ko store kar denge taki aage ke controllers me use kar ske
    // req mein ek userId naam ka property bana denge jisme user ka id store ho jayega
    req.userId = decodeToken.userId;
    next();
  } catch (error) {
    return res.status(500).json({ message: "isAuth error" });
  }
};

export default isAuth;
