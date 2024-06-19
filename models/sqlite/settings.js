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
    field: "profile",
    details: error.message,
  };
};


class SettingsModel {
  static async updateSettings ({ settings, user }) {
    // const 
    // // const response = await client.ex
    // console.log(settings, user)
    return { message: 'Update success'}
  }
}

export { SettingsModel }