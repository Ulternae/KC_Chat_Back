import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { encryptedPassword } from "../../utils/bcrypt.js";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

class ProfileModel {
  static async get({ user }) {
    const response = await client.execute({
      sql: `SELECT 
        u.user_id ,
        u.nickname , 
        u.username ,
        u.email ,
        u.avatar_id,
        a.url AS avatar_url
        FROM users AS u 
        LEFT JOIN avatars AS a ON u.avatar_id = a.avatar_id
        WHERE u.user_id = ?`,
      args: [user.id],
    });

    if (response.rows.length === 0) {
      throw {
        status: 404,
        error: "User not found",
        type: "Not_Found",
        field: "user_id",
      };
    }

    return response.rows[0];
  }

  static async update({ user, input }) {
    const { id } = user;

    let inputData = input
    const entries = Object.entries(inputData);
    
    const hasPasswordInInput = entries.find((data) => data[0] === "password")
    if (hasPasswordInInput) {
      const password = await encryptedPassword({ password: hasPasswordInInput[1]})
      inputData = ({ ...input, password})
    }

    const updateFields = Object.keys(inputData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const updateValues = Object.values(inputData);

    const avatar_id = entries.find((data) => data[0] === "avatar_id");

    if (avatar_id) {
      const verifyAvatar = await client.execute({
        sql: `SELECT url from avatars 
              WHERE avatar_id = ?`,
        args: [avatar_id[1]],
      });

      if (verifyAvatar.rows.length === 0) {
        throw {
          status: 400,
          error: 'The avatar selected is not found',
          type: 'Not_found_Avatar',
          field: 'avatar_id'
        }
      }
    }

    const updateData = await client.execute({
      sql: `UPDATE users
            SET ${updateFields}
            WHERE user_id = ?`,
      args: [...updateValues, id],
    });

    if (updateData.rowsAffected === 0) {
      throw {
        status: 400,
        error:
          "Update operation failed. No changes were made to the user profile.",
        type: "Update_Failed",
        field: "Update",
      };
    }

    const response = await this.get({ user });

    if (Object.keys(response).length === 0) {
      throw {
        status: 500,
        error: `User not found after update`,
        type: "Not_Found_After_Update",
        field: "user_id",
      };
    }

    return response;
  }
}

export { ProfileModel };
