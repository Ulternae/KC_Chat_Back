import { verifyToken } from "../utils/jwt.js";

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = verifyToken({ token });
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
};

export { authenticateSocket };
