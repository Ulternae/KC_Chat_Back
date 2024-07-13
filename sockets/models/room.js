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

class RoomModel {
  static async roomChats({ room }) {
    let chatInfo;

    try {
      const data = await client.execute({
        sql: `SELECT 
                m.chat_id AS room,
                m.sender_id AS user_id,
                m.content, 
                m.type,
                m.send_at,
                u.nickname
              FROM messages AS m
              LEFT JOIN users AS u ON u.user_id = m.sender_id
              WHERE m.chat_id = ?
              ORDER BY m.message_id
              `,
        args: [room],
      });
      chatInfo = data.rows;
    } catch (error) {
      console.log(error);
      errorDatabase({ error, field: "messages" });
    }

    return chatInfo;
  }
}

export { RoomModel };
