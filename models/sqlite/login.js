import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { validPassword } from "../../utils/bcrypt.js";
import { generateToken } from "../../utils/jwt.js";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

class LoginModel {
  static async login({ input }) {
    const username = input.username.toLowerCase();
    const email = input.email.toLowerCase();
    const password = input.password;

    const dataUser = {
      username, email, password
    }
    const response = await client.execute({
      sql: `SELECT username, email, password, user_id 
            FROM users 
            WHERE LOWER(username) = ? OR 
            LOWER(email) = ? LIMIT 1`,
      args: [username, email],
    });

    if (response.rows.length === 0) {
      throw {
        status: 400,
        error: "This user no exist",
        type: "invalidCredentials",
        field: "username, email",
        dataUser
      };
    }

    const user = response.rows[0];

    if (user.username.toLowerCase() !== username) {
      throw {
        status: 400,
        error: "The username does not match",
        type: "wrongNickname",
        field: "username",
        dataUser
      };
    }

    if (user.email.toLowerCase() !== email) {
      throw {
        status: 400,
        error: "The email does not match",
        type: "wrongEmail",
        field: "email",
        dataUser
      };
    }

    const isValidPassword = await validPassword({
      db_password: user.password,
      password,
    });

    if (!isValidPassword) {
      throw {
        status: 400,
        error: "The password is incorrect",
        type: "wrongPassword",
        field: "password",
        dataUser
      };
    }

    const token = generateToken({ username, email, id: user.user_id });

    return { token };
  }
}

export { LoginModel };
