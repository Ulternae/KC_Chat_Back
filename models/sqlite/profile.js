import { createClient } from "@libsql/client";
import dotenv from "dotenv";
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
    field: "profile",
    details: error.message,
  };
};

class ProfileModel {
  static async get({ user }) {
    const response = await client.execute({
      sql: `SELECT 
        u.user_id ,
        u.nickname , 
        u.username ,
        u.email ,
        u.avatar_id,
        a.url AS avatar_url,
        s.language,
        s.theme
        FROM users AS u 
        LEFT JOIN avatars AS a ON u.avatar_id = a.avatar_id 
        LEFT JOIN settings AS s ON s.user_id = u.user_id
        WHERE u.user_id = ?`,
      args: [user.id],
    });

    if (response.rows.length === 0) {
      throw {
        status: 404,
        error: "User not found",
        type: "userNotFound",
        field: "user_id",
      };
    }

    return response.rows[0];
  }

  static async update({ user, input }) {
    const { id } = user;

    let inputData = input;
    const entries = Object.entries(inputData);

    const hasPasswordInInput = entries.find((data) => data[0] === "password");
    if (hasPasswordInInput) {
      const password = await encryptedPassword({
        password: hasPasswordInInput[1],
      });
      inputData = { ...input, password };
    }

    const updateFields = Object.keys(inputData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const updateValues = Object.values(inputData);

    const avatar_id = entries.find((data) => data[0] === "avatar_id");
    let verifyAvatar;
    let updateData;

    if (avatar_id) {
      try {
        verifyAvatar = await client.execute({
          sql: `SELECT url from avatars 
                WHERE avatar_id = ?`,
          args: [avatar_id[1]],
        });
      } catch (error) {
        throw errorDatabase({ error });
      }
    }

    if (verifyAvatar.rows.length === 0) {
      throw {
        status: 400,
        error: "The avatar selected is not found",
        type: "avatarNotFound",
        field: "avatar_id",
      };
    }

    try {
      updateData = await client.execute({
        sql: `UPDATE users
              SET ${updateFields}
              WHERE user_id = ?`,
        args: [...updateValues, id],
      });
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
      throw errorDatabase({ error });
    }

    if (updateData.rowsAffected === 0) {
      throw {
        status: 400,
        error:
          "Update operation failed. No changes were made to the user profile.",
        type: "updatedFailed",
        field: "Update",
      };
    }

    const response = await this.get({ user });

    if (Object.keys(response).length === 0) {
      throw {
        status: 404,
        error: "User not found",
        type: "userNotFound",
        field: "user_id",
      };
    }

    return response;
  }
}

export { ProfileModel };
