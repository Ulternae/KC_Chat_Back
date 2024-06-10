import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const generateToken = ({ nickname, id, email }) => {
  return jwt.sign({ nickname, id, email }, SECRET_KEY, {
    expiresIn: "24h"
  });
};

const verifyToken = ({ token }) => {
  return jwt.verify(token, SECRET_KEY);
};

export { generateToken, verifyToken };
