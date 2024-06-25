import { verifyToken } from "../utils/jwt.js";

const authToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1] || '';

  if (token === 'undefined') {
    return res.status(401).json({ message: "Access denied", type: 'accessDenied' }
    )
  };

  if (token === '') {
    return res.status(403).json({ message: "Session Expired", type: 'sessionExpired' }
    )
  };

  try {
    const decoded = verifyToken({ token });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Session Expired", type: 'sessionExpired' });
  }
};

export { authToken };
