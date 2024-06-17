import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { validPassword } from "../../utils/bcrypt.js";

dotenv.config();

const client = createClient({
  authToken: process.env.TURSO_AUTH_TOKEN,
  url: process.env.TURSO_DATABASE_URL,
});

const errorDatabase = ({ error }) => {
  return {
    status: 500,
    error: "Error in the database",
    type: "databaseError",
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

  static async validatePasswordUser({ user, password }) {
    const user_id = user.id

    let userDatabase
    try {
      userDatabase = await client.execute({
        sql: `SELECT 
                password,
                user_id,
                nickname
              FROM users
              WHERE user_id = ?`,
        args: [user_id]
      })
    } catch (error) {
      throw errorDatabase({ error })
    }

    if (userDatabase.rows[0].length === 0) {
      throw {
        status: 400,
        error: "This user no exist",
        type: "userNotFound",
        field: "user_id",
        details: "This user is possible have been deleted  in the database may while logged in, user not found"
      };
    }

    const isValidPassword = await validPassword({ password, db_password: userDatabase.rows[0].password })
    return { isValidPassword }
  }

  static async validatePasswordUserGoogle({ user, idUserGoogle, userData }) {
    if (user.id === idUserGoogle) {
      return { isValidPassword: true }
    }

    if (user.nickname === userData.nickname
      || user.nickname === userData.username
      || user.email === userData.email) {
      return { isValidPassword: true }

    }

    if (user.id !== idUserGoogle) {
      throw {
        status: 400,
        error: "This auth not corresponding of user loged",
        type: "authWrongWithGoogle",
        field: "googleCredential",
        details: "This auth not corresponding of user logged, try login or auth again with account that you desired edit"
      };
    }

  }
}

export { UserModel };
