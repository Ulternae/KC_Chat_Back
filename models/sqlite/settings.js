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

  static async createSettings({ user_id, language = 'en', theme = 'darkMode' }) {
    let response
    try {
      response = await client.execute({
        sql: `INSERT INTO settings
              (user_id, language, theme) VALUES
              (?,?,?)`,
        args: [user_id, language, theme]
      })
    } catch (error) {
      throw errorDatabase({ error })
    }

    if (response.rowsAffected > 0) {
      return {
        message: 'Update success',
        settings: { language, theme }
      }
    }

    if (response.rowsAffected === 0) {
      throw {
        status: 404,
        error: "Failed create settings",
        type: "failedCreateSettings",
        field: "settings",
        details: "Configurations for the user were not create, rowsAffected : 0",
      };
    }

  }

  static async updateSettings({ settings, user }) {
    const updateFields = Object.keys(settings).map((value) => `${value} = ?`).join(' , ')
    const updateValues = Object.values(settings)
    const user_id = user.id

    let response
    let isUserSettingsExisting
    try {
      isUserSettingsExisting = await client.execute({
        sql: `SELECT language , theme 
              FROM settings
              WHERE user_id = ?`,
        args: [user_id]
      })
    } catch (error) {
      throw errorDatabase({ error })
    }


    if (isUserSettingsExisting.rows.length === 0) {
      try {
        const dataUser = await this.createSettings({ user_id, ...settings });
        return { ...dataUser }
      } catch (error) {
        throw { ...error }
      }
    } else {
      const existingSettings = isUserSettingsExisting.rows[0];

      if (existingSettings.language === settings.language && existingSettings.theme === settings.theme) {
        return {
          message: 'No changes were made to settings',
          settings: { language: existingSettings.language, theme: existingSettings.theme }
        };
      }
    }

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
      return {
        message: 'Update success',
        settings: { language: settings.language, theme: settings.theme }
      }
    }

    if (response.rowsAffected === 0) {
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