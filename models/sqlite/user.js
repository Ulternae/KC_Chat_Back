import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

const client = createClient({
  authToken: process.env.TURSO_AUTH_TOKEN,
  url: process.env.TURSO_DATABASE_URL,
});

const errorDatabase = ({ error }) => {
  return {
    status: 500,
    error: "Error in the database",
    type: "Database_error",
    field: "users",
    details: error.message,
  };
};

class UserModel {
  static async getAll({ nickname }) {
    let users;

    try {
      const nicknameQuery = nickname || "";

      users = await client.execute({
        sql: `SELECT 
                u.user_id ,
                u.nickname , 
                u.username ,
                u.email ,
                u.avatar_id,
                a.url AS avatar_url
              FROM users AS u 
              LEFT JOIN avatars AS a ON u.avatar_id = a.avatar_id
              WHERE u.nickname LIKE ?`,
        args: [`%${nicknameQuery}%`],
      });
    } catch (error) {
      throw errorDatabase({ error });
    }

    return { users: users.rows };
  }
}

export { UserModel };
