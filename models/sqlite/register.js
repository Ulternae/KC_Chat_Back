import dotenv from "dotenv";
import { generateToken } from "../../utils/jwt.js";
import { createClient } from "@libsql/client";
import { encryptedPassword } from "../../utils/bcrypt.js";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const errorDatabase = ({ error }) => {
  return {
    status: 500,
    error: "Error in the database",
    type: "databaseError",
    field: "groups",
    details: error.message,
  };
};

class RegisterModel {
  static async create({ id, input, settings }) {
    const password = await encryptedPassword({ password: input.password });
    const { username, email, nickname, avatar_id } = input;
    const { language, theme } = settings
    const token = generateToken({ id, nickname, email });

    try {
      const transaction = await client.transaction("write")

      await transaction.execute({
        sql: `INSERT INTO users 
              (user_id, avatar_id, nickname, username, email, password) VALUES
              (?,?,?,?,?,?)`,
        args: [id, avatar_id, nickname, username, email, password],
      });

      await transaction.execute({
        sql: `INSERT INTO settings
              (user_id, language, theme) VALUES
              (?,?,?)`,
        args: [id , language, theme ]
      })

      await transaction.commit();

      return {
        data: { id, ...input, settings },
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
      await transaction.rollback();
      throw errorDatabase({error})
      
    }
  }

  static async createWithGoogle({ id, input, settings }) {
    let password = await encryptedPassword({ password: input.password });
    let { username, email, nickname, avatar_id } = input;
    const { language, theme } = settings
    const token = generateToken({ id, nickname, email });

    try {
      const transaction = await client.transaction("write")

      await transaction.execute({
        sql: `INSERT INTO users 
              (user_id, avatar_id, nickname, username, email, password) VALUES
              (?,?,?,?,?,?)`,
        args: [id, avatar_id, nickname, username, email, password],
      });

      await transaction.execute({
        sql: `INSERT INTO settings
              (user_id, language, theme) VALUES
              (?,?,?)`,
        args: [id , language, theme ]
      })

      await transaction.commit();

      return {
        data: { id, ...input },
        message: "Successfully registered user",
        token,
      };
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT") {
        if (error.message.includes("UNIQUE constraint failed")) {
          const field = error.message.split(".").pop();

          if (field === 'nickname') {
            nickname = input.nickname.concat('-', parseInt(Math.random() * 2000))
            password = input.password
            const newInput = {username, email, nickname, avatar_id, password}

            return this.create({ id, settings, input: newInput})
          } else {
            throw {
              status: 400,
              error: `The ${field} is already in use. Please select another.`,
              type: `${field}InUse`,
              field
            };
          }

        }
      }

      await transaction.rollback();
      throw errorDatabase({ error })
    }
  }
}

export { RegisterModel };
