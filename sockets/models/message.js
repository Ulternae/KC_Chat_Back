import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const errorDatabase = ({ error, field }) => {
  return {
    status: 500,
    error: "Error in the database",
    type: "databaseError",
    field: field,
    details: error.message,
  };
};

class MessageModel {
  static async sendMessage({ messageInfo, userInfo }) {
    const { room , content , type } = messageInfo
    const { id , nickname } = userInfo
    const send_at = new Date().toISOString()

    try {
      await client.execute({
        sql: `INSERT INTO 
                messages (chat_id , sender_id, content, type, send_at) 
                VALUES ( ? , ? , ? , ? , ?)
              `,
        args: [ room , id , content , type, send_at ]
      })
    } catch (error) {
      console.log(error)
      errorDatabase({ error , field : 'messages'})
    }

    return {
      room,
      content,
      type,
      user_id: id,
      nickname,
      send_at
    }
  }

}

export { MessageModel }