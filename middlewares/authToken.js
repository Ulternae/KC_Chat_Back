import { verifyToken } from "../utils/jwt.js";

const authToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied", type: 'accessDenied' });

  try {
    const decoded = verifyToken({ token });
    req.user = decoded; // en la request se le manda los datos del usuario???
    next();
  } catch (error) {
    res.status(403).json({ message: "Session Expired" , type: 'sessionExpired'});
  }
};

export { authToken };
