import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

class ChatModel {
  static async create({ user, friend_id, chat_id }) {
    const user_id = user.id;

    let validUser;
    let existingChat;

    try {
      validUser = await client.execute({
        sql: `SELECT nickname, user_id FROM users WHERE user_id = ?`,
        args: [friend_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error fetching the user.",
        type: "databaseError",
        field: "users",
        details: error.message,
      };
    }

    if (validUser.rows.length === 0) {
      throw {
        status: 400,
        error: "The friend for creating the chat does not exist.",
        type: "Friend_not_exist",
        field: "users",
        details: "The specified user does not exist.",
      };
    }

    try {
      existingChat = await client.execute({
        sql: ` 
        SELECT c.chat_id 
        FROM chat_users cu
        INNER JOIN chats c ON c.chat_id = cu.chat_id
        WHERE c.is_group = false
          AND cu.chat_id IN (
            SELECT cu1.chat_id 
            FROM chat_users cu1
            WHERE cu1.user_id = ?
            INTERSECT
            SELECT cu2.chat_id 
            FROM chat_users cu2
            WHERE cu2.user_id = ?
          );
        `,
        args: [user_id, friend_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error checking existing chats.",
        type: "databaseError",
        field: "chat_users",
        details: error.message,
      };
    }

    if (existingChat.rows.length > 0) {
      throw {
        status: 404,
        error: "A chat already exists between these users.",
        type: "Chat_already_exists",
        field: "chat_id",
      };
    }

    try {
      const usersInChat = [user_id, friend_id];
      const transaction = await client.transaction("write");

      try {
        await transaction.execute({
          sql: `INSERT INTO chats (chat_id, is_group) VALUES (?, ?)`,
          args: [chat_id, false],
        });
      } catch (error) {
        await transaction.rollback();
        throw {
          status: 500,
          error: "There was an error creating the chat.",
          type: "databaseError",
          field: "chats",
          details: error.message,
        };
      }

      try {
        await Promise.all(
          usersInChat.map((idUserChat) =>
            transaction.execute({
              sql: `INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?)`,
              args: [chat_id, idUserChat],
            })
          )
        );
      } catch (error) {
        await transaction.rollback();
        throw {
          status: 500,
          error: "There was an error adding users to the chat.",
          type: "databaseError",
          field: "chat_users",
          details: error.message,
        };
      }

      await transaction.commit();
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error adding users to the chat.",
        type: "databaseError",
        field: "chat_users",
        details: error.message,
      };
    }

    return { message: "Chat created successfully", chat_id };
  }

  static async getChats({ user }) {
    const user_id = user.id;
    let nickname = user.nickname;

    if (!nickname) {
      try {
        const nicknameResult = await client.execute({
          sql: `
            SELECT nickname
            FROM users
            WHERE user_id = ?
          `,
          args: [user_id],
        });

        if (nicknameResult.rows.length === 0) {
          throw new Error("User not found");
        }

        nickname = nicknameResult.rows[0].nickname;
      } catch (error) {
        throw {
          status: 404,
          error: "User not found",
          type: "userNotFound",
          field: "user_id",
        };
      }
    }

    try {
      // Obtener los chats del usuario
      const chatRows = await client
        .execute({
          sql: `
          SELECT c.chat_id, c.is_group
          FROM chats AS c
          INNER JOIN chat_users AS cu ON cu.chat_id = c.chat_id
          WHERE cu.user_id = ?
        `,
          args: [user_id],
        })
        .then((data) => data.rows);

      // Obtener detalles de cada chat
      const chatDetails = await Promise.all(
        chatRows.map(({ chat_id }) =>
          client
            .execute({
              sql: `
            SELECT 
              c.chat_id,
              c.name,
              c.is_group,
              u.user_id,
              u.nickname,
              u.email,
              u.avatar_id,
              a.url AS avatar_url
            FROM chats AS c
            INNER JOIN chat_users AS cu ON cu.chat_id = c.chat_id
            INNER JOIN users AS u ON u.user_id = cu.user_id
            LEFT JOIN avatars AS a ON u.avatar_id = a.avatar_id 
            WHERE c.chat_id = ?
          `,
              args: [chat_id],
            })
            .then((response) => response.rows)
        )
      );

      const responseChatIds = [];
      const responseGroupsIds = [];

      chatDetails.forEach((chat) => {
        const isGroup = chat[0].is_group;
        let name = chat[0].name;

        if (!isGroup) {
          const otherUser = chat.find(
            (u) => u.nickname.toLowerCase() !== nickname.toLowerCase()
          );
          name = otherUser ? otherUser.nickname : name;
        }

        const data = {
          chat_id: chat[0].chat_id,
          name,
          is_group: chat[0].is_group,
          users: chat.map((user) => ({
            nickname: user.nickname,
            email: user.email,
            user_id: user.user_id,
            avatar_url: user.avatar_url,
            avatar_id: user.avatar_id,
          })),
        };

        if (isGroup) {
          responseGroupsIds.push(data);
        } else {
          responseChatIds.push(data);
        }
      });

      const chatsGroups = {
        chats: responseChatIds,
        groups: responseGroupsIds,
      };

      return chatsGroups;
    } catch (error) {
      console.log(error)
      throw {
        status: 500,
        error: "There was an error fetching the chats",
        type: "databaseError",
        field: "chats",
        details: error.message,
      };
    }
  }

  static async sendMessage({ user, content, chat_id }) {
    const user_id = user.id;

    let validChat;

    try {
      const response = await client.execute({
        sql: `SELECT is_group FROM chats WHERE chat_id = ?`,
        args: [chat_id],
      });

      validChat = response.rows;
    } catch (error) {
      throw {
        status: 500,
        error: "Error fetching chat information",
        type: "databaseError",
        field: "chat_id",
        details: error.message,
      };
    }

    if (validChat.length === 0) {
      throw {
        status: 404,
        error: "Chat not found",
        type: "Not_Found",
        field: "chat_id",
        details: `No chat found with chat_id ${chat_id}`,
      };
    }

    try {
      const response = await client.execute({
        sql: `INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`,
        args: [chat_id, user_id, content],
      });

      if (response.rowsAffected < 1) {
        throw {
          status: 500,
          error: "Failed to send message",
          type: "databaseError",
          field: "message",
          details: "No rows were affected by the insert operation",
        };
      }
    } catch (error) {
      throw {
        status: 500,
        error: "Error sending message",
        type: "databaseError",
        field: "message",
        details: error.message || "Failed to insert message into database",
      };
    }

    return { success: `Message sent successfully: ${content}` };
  }

  static async getMessages({ user, chat_id }) {
    const user_id = user.id;
    const { nickname } = user;

    let validChat;
    try {
      const response = await client.execute({
        sql: `SELECT is_group FROM chats WHERE chat_id = ?`,
        args: [chat_id],
      });

      validChat = response.rows;
    } catch (error) {
      throw {
        status: 500,
        error: "Error fetching chat information",
        type: "databaseError",
        field: "chat_id",
        details: error.message,
      };
    }

    if (validChat.length === 0) {
      throw {
        status: 404,
        error: "Chat not found",
        type: "Not_Found",
        field: "chat_id",
        details: `No chat found with chat_id ${chat_id}`,
      };
    }

    let messages;
    const responseChat = {
      name_chat: "",
      is_group: 0,
      messages: [],
    };
    try {
      const res = await client.execute({
        sql: `SELECT 
            c.name, c.is_group, 
            m.sender_id, m.content, m.sent_at, 
            u.nickname,
            a.url AS avatar_url
          FROM chats AS c
            INNER JOIN messages AS m ON m.chat_id = c.chat_id
            INNER JOIN users AS u ON u.user_id = m.sender_id
            INNER JOIN avatars AS a ON u.avatar_id = a.avatar_id
          WHERE c.chat_id = ?
    `,
        args: [chat_id],
      });
      messages = res.rows;
    } catch (error) {
      throw {
        status: 500,
        error: "Error fetching messages",
        type: "databaseError",
        field: "chat_id",
        details: error.message,
      };
    }

    messages.forEach((value) => {
      const isUserPrincipal =
        nickname.toLowerCase() === value.nickname.toLowerCase();
      let name = value.name;

      if (!name) {
        nickname.toLowerCase() !== value.nickname.toLowerCase()
          ? (name = value.nickname)
          : null;
      }

      if (name) {
        responseChat.name_chat = name;
        responseChat.is_group = value.is_group;
      }

      responseChat.messages.push({
        isUserPrincipal,
        nickname: value.nickname,
        content: value.content,
        sent_at: value.sent_at,
        avatar_url: value.avatar_url,
        user_id: value.sender_id,
      });
    });

    return responseChat;
  }

  static async getChatById({ user, chat_id }) {
    const { nickname } = user;
    let validChat;

    try {
      const response = await client.execute({
        sql: `SELECT is_group FROM chats WHERE chat_id = ?`,
        args: [chat_id],
      });

      validChat = response.rows;
    } catch (error) {
      throw {
        status: 500,
        error: "Error fetching chat information",
        type: "databaseError",
        field: "chat_id",
        details: error.message,
      };
    }

    if (validChat.length === 0) {
      throw {
        status: 404,
        error: "Chat not found",
        type: "Not_Found",
        field: "chat_id",
        details: `No chat found with chat_id ${chat_id}`,
      };
    }

    let chatInfo;
    try {
      chatInfo = await client
        .execute({
          sql: ` SELECT 
                    c.chat_id,
                    c.name,
                    c.is_group,
                    u.user_id,
                    u.nickname,
                    u.username,
                    u.email,
                    u.avatar_id,
                    a.url AS avatar_url
                  FROM chats AS c
                  INNER JOIN chat_users AS cu ON cu.chat_id = c.chat_id 
                  INNER JOIN users AS u ON u.user_id = cu.user_id
                  LEFT JOIN avatars AS a ON a.avatar_id = u.avatar_id
                  WHERE c.chat_id = ?
      `,
          args: [chat_id],
        })
        .then((res) => res.rows);
    } catch (error) {
      throw {
        status: 500,
        error: "Error fetching chat details",
        type: "databaseError",
        field: "chat_id",
        details: error.message,
      };
    }

    const responseChats = {
      chat_id: "",
      name: "",
      is_group: 0,
      users: [],
    };

    chatInfo.forEach((chat) => {
      const isSameUser = nickname.toLowerCase() === chat.nickname.toLowerCase();

      if (!responseChats.chat_id) {
        responseChats.chat_id = chat.chat_id;
      }

      responseChats.name = chat.name;

      if (!responseChats.name) {
        responseChats.name =
          !chat.name && isSameUser ? chat.name : chat.nickname;
      }

      if (!responseChats.is_group) {
        responseChats.is_group = chat.is_group;
      }

      responseChats.users.push({
        nickname: chat.nickname,
        email: chat.email,
        user_id: chat.user_id,
        avatar_id: chat.avatar_id,
        avatar_url: chat.avatar_url,
        username: chat.username
      });
    });

    return responseChats;
  }
}

export { ChatModel };
