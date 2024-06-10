import dotenv from "dotenv";
import { generateToken } from "../../utils/jwt.js";
import { createClient } from "@libsql/client";
import { encryptedPassword } from "../../utils/bcrypt.js";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

class RegisterModel {
  static async create({ id, input }) {
    const password = await encryptedPassword({ password: input.password });
    const { username, email, nickname, avatar_id } = input;
    const token = generateToken({ id, nickname, email });

    try {
      await client.execute({
        sql: `INSERT INTO users 
              (user_id, avatar_id, nickname, username, email, password) VALUES
              (?,?,?,?,?,?)`,
        args: [id, avatar_id, nickname, username, email, password],
      });

      return {
        data: { id, ...input },
        message: "Successfully registered user",
        token,
      };
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT") {
        if (error.message.includes("UNIQUE constraint failed")) {
          const field = error.message.split(".").pop();
          throw {
            status: 400,
            error: `The ${field} is already in use. Please select another.`,
            type: `${field}InUse`,
            field 
          };
        }
      }
      throw {
        status: 500,
        error: "There was an error in the database.",
        type: 'Database_Error',
        details: error
      };
    }
  }
}

export { RegisterModel };
