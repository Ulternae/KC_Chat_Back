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
    const nickname = input.nickname.toLowerCase();
    const email = input.email.toLowerCase();
    const password = input.password;

    const dataUser = {
      nickname, email, password
    }

    const response = await client.execute({
      sql: `SELECT nickname, email, password, user_id 
            FROM users 
            WHERE LOWER(nickname) = ? OR 
            LOWER(email) = ? LIMIT 1`,
      args: [nickname, email],
    });

    if (response.rows.length === 0) {
      throw {
        status: 400,
        error: "This user no exist",
        type: "invalidCredentials",
        field: "nickname, email",
        dataUser
      };
    }

    const user = response.rows[0];

    if (user.nickname.toLowerCase() !== nickname) {
      throw {
        status: 400,
        error: "The nickname does not match",
        type: "wrongNickname",
        field: "nickname",
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

    const token = generateToken({ nickname, email, id: user.user_id });

    return { token };
  }

  static async loginWithGoogle({ input }) { 
    const { id, password, username, email } = input
    const dataUser = { ...input }
    const response = await client.execute({
      sql: `SELECT username, email, password, user_id 
            FROM users 
            WHERE user_id = ?
              OR nickname = ?
              OR email = ?
            `,
      args: [id, username, email],
    });

    if (response.rows.length === 0) {
      throw {
        status: 400,
        error: "This user no exist",
        type: "invalidCredentials",
        field: "user_id",
        dataUser
      }; 
    }

    const user = response.rows[0];

    // const isValidPassword = await validPassword({
    //   db_password: user.password,
    //   password,
    // });

    // if (!isValidPassword) {
    //   throw {
    //     status: 400,
    //     error: "The password is incorrect",
    //     type: "wrongPassword",
    //     field: "password",
    //     dataUser
    //   };
    // }

    const token = generateToken({ username: user.username, email: user.email, id: user.user_id });
    return { token };
  }
}

export { LoginModel };
