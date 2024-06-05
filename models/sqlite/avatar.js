import dotenv from 'dotenv'
import { createClient } from "@libsql/client";
import { isAdmin } from '../../utils/admin.js';

dotenv.config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

class AvatarModel {
  static async getAll() {
    let data

    try {
      data = await client.execute(`
      SELECT avatar_id, url FROM avatars
      `)
    } catch (error) {
      throw {
        status: 500,
        error: 'An error occurred while fetching avatars from the database.',
        type: 'Database_error',
        field: 'Avatars',
        details: error
      };
    }

    if (data.rows.length === 0) {
      throw {
        status: 400,
        error: 'The avatars were not found in the database.',
        type: 'Avatars_not_found',
        field: 'Avatars'
      };
    }

    return data.rows
  }

  static async getById({ id }) {
    const avatar_id = id

    let data

    try {
      data = await client.execute({
        sql: `SELECT avatar_id, url FROM avatars WHERE avatar_id = ?`,
        args: [ avatar_id ]
      })
    } catch (error) {
      throw {
        status: 500,
        error: 'An error occurred while fetching avatars from the database.',
        type: 'Database_error',
        field: 'Avatars',
        details: error
      };
    }

    if (data.rows.length === 0) {
      throw {
        status: 400,
        error: `The avatars ${avatar_id} were not found in the database.`,
        type: 'Avatars_not_found',
        field: `Avatar_id : ${avatar_id}`,
      };
    }

    return data.rows[0]
  }

  static async create({ user, input }) {
    const { url } = input
    const { nickname , id } = user
    const userIsAdmin = isAdmin({ nickname , id })
    
    if (!userIsAdmin) {
      throw {
        status: 401,
        error: `The user ${nickname} is unauthorized for create avatars `,
        type: 'Unauthorized',
        field: 'Create Avatars',
        details: 'Only admins can create avatars'
      }
    }

    try {
      const response = await client.execute({
        sql: `INSERT INTO avatars (url) VALUES ( ? )`,
        args: [url]
      })

      const avatar_id =  Number(response.lastInsertRowid)
      const data = await this.getById({ id: avatar_id})
      return data
    } catch (error) {
      
    }

  }
}

export { AvatarModel }