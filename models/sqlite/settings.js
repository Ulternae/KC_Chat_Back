import dotenv from "dotenv"
import { createClient } from "@libsql/client";

dotenv.config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

const errorDatabase = ({ error }) => {
  return {
    status: 500,
    error: "Error in the database",
    type: "databaseError",
    field: "settings",
    details: error.message,
  };
};


class SettingsModel {
  static async updateSettings ({ settings, user }) {
    const updateFields = Object.keys(settings).map((value) => `${value} = ?`).join(' , ')
    const updateValues = Object.values(settings)
    const user_id = user.id

    let response
    try {
      response = await client.execute({
        sql: `UPDATE settings
              SET ${updateFields}
              WHERE user_id = ?`,
        args: [...updateValues, user_id]
      })
    } catch (error) {
      throw errorDatabase({ error })
    }

    if (response.rowsAffected > 0) {
      return { message: 'Update success'}
    }

    if (true) {
      throw {
        status: 404,
        error: "Failed update settings",
        type: "failedUpdateSettings",
        field: "settings",
        details: "Configurations for the user were not updated, rowsAffected : 0",
      };
    }
  }
}

export { SettingsModel }