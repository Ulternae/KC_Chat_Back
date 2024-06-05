import dotenv from 'dotenv'
import { createClient } from "@libsql/client";
import { validPassword } from '../../utils/bcrypt.js';
import { generateToken } from '../../utils/jwt.js';

dotenv.config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

class LoginModel {
  static async login({ input }) {
    const nickname = input.nickname.toLowerCase()
    const email = input.email.toLowerCase()
    const password = input.password

    const response = await client.execute({
      sql: `SELECT nickname, email, password, user_id 
            FROM users 
            WHERE LOWER(nickname) = ? OR 
            LOWER(email) = ? LIMIT 1`,
      args: [nickname , email]
    })


    if (response.rows.length === 0) {
      throw {
        status: 400,
        error: 'The username or password is incorrect',
        type: 'Invalid_Credentials',
        field: 'nickname , email'
      }
    }

    const user = response.rows[0]

    if (user.nickname.toLowerCase() !== nickname) {
      throw {
        status: 400,
        error: 'The username does not match',
        type: 'Wrong_Nickname',
        field: 'nickname'
      };
    }

    if (user.email.toLowerCase() !== email) {
      throw {
        status: 400,
        error: 'The email does not match',
        type: 'Wrong_Email',
        field: 'email'
      };
    }

    const isValidPassword = await validPassword({ db_password: user.password, password})
    
    if (!isValidPassword) {
            throw {
        status: 400,
        error: 'The password is incorrect',
        type: 'Wrong_Password',
        field: 'password'
      };
    }

    const token = generateToken({ nickname, email, id: user.user_id })

    return { token }
  }
}

export { LoginModel }