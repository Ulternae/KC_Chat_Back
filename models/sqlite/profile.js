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
            field,
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

  static async delete({ user }) {
    const transaction = await client.transaction("write");
    const user_id = user.id;

    let getGroupsOwnerIsUser = [];
    let getGroupsUserIsMember = [];

    try {
      // 1. Obtener grupos donde el usuario es el creador
      getGroupsOwnerIsUser = await transaction
        .execute({
          sql: `SELECT group_id FROM groups WHERE creator_id = ?`,
          args: [user_id],
        })
        .then((res) => res.rows);

      // Manejo de grupos donde el usuario es el creador
      for (const { group_id } of getGroupsOwnerIsUser) {
        // Obtener todos los chats del grupo
        const getChatsByGroup = await transaction
          .execute({
            sql: `SELECT chat_id FROM group_chats WHERE group_id = ?`,
            args: [group_id],
          })
          .then((res) => res.rows);

        for (const { chat_id } of getChatsByGroup) {
          // 1.1. Eliminar todos los mensajes del chat
          await transaction.execute({
            sql: `DELETE FROM messages WHERE chat_id = ?`,
            args: [chat_id],
          });

          // 1.2. Eliminar todas las relaciones chat_users del chat
          await transaction.execute({
            sql: `DELETE FROM chat_users WHERE chat_id = ?`,
            args: [chat_id],
          });

          // 1.3. Eliminar la relación group_chats del chat
          await transaction.execute({
            sql: `DELETE FROM group_chats WHERE chat_id = ?`,
            args: [chat_id],
          });

          // 1.4. Eliminar el chat
          await transaction.execute({
            sql: `DELETE FROM chats WHERE chat_id = ?`,
            args: [chat_id],
          });
        }

        // 1.5. Eliminar todos los miembros del grupo
        await transaction.execute({
          sql: `DELETE FROM group_members WHERE group_id = ?`,
          args: [group_id],
        });

        // 1.6. Eliminar el grupo
        await transaction.execute({
          sql: `DELETE FROM groups WHERE group_id = ?`,
          args: [group_id],
        });
      }

      // 2. Obtener grupos donde el usuario es miembro, pero no el creador
      getGroupsUserIsMember = await transaction
        .execute({
          sql: `SELECT g.group_id
                FROM groups AS g
                LEFT JOIN group_members AS gm ON g.group_id = gm.group_id
                WHERE NOT g.creator_id = ? AND gm.user_id = ?`,
          args: [user_id, user_id],
        })
        .then((res) => res.rows);

      // Manejo de grupos donde el usuario es miembro pero no el creador
      for (const { group_id } of getGroupsUserIsMember) {
        const getChatsByGroup = await transaction
          .execute({
            sql: `SELECT DISTINCT gc.chat_id 
                FROM group_chats AS gc
                JOIN chat_users AS cu ON gc.chat_id = cu.chat_id
                WHERE gc.group_id = ?
                  AND cu.user_id = ?`,
            args: [group_id, user_id],
          })
          .then((res) => res.rows);

        for (const { chat_id } of getChatsByGroup) {
          const chatUsersCount = await transaction
            .execute({
              sql: `SELECT COUNT(user_id) AS user_count FROM chat_users WHERE chat_id = ?`,
              args: [chat_id],
            })
            .then((res) => res.rows[0].user_count);

          if (chatUsersCount <= 2) {
            // 2.1. Eliminar todos los mensajes del chat si hay solo 2 usuarios
            await transaction.execute({
              sql: `DELETE FROM messages WHERE chat_id = ?`,
              args: [chat_id],
            });

            // 2.2. Eliminar todas las relaciones chat_users del chat
            await transaction.execute({
              sql: `DELETE FROM chat_users WHERE chat_id = ?`,
              args: [chat_id],
            });

            // 2.3. Eliminar la relación group_chats del chat
            await transaction.execute({
              sql: `DELETE FROM group_chats WHERE chat_id = ?`,
              args: [chat_id],
            });

            // 2.4. Eliminar el chat
            await transaction.execute({
              sql: `DELETE FROM chats WHERE chat_id = ?`,
              args: [chat_id],
            });
          } else {
            // 2.1. Eliminar solo los mensajes del usuario en el chat grupal
            await transaction.execute({
              sql: `DELETE FROM messages WHERE chat_id = ? AND sender_id = ?`,
              args: [chat_id, user_id],
            });

            // 2.2. Eliminar solo la relación chat_users del usuario
            await transaction.execute({
              sql: `DELETE FROM chat_users WHERE chat_id = ? AND user_id = ?`,
              args: [chat_id, user_id],
            });
          }
        }

        // 2.3. Eliminar la relación group_members del usuario
        await transaction.execute({
          sql: `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
          args: [group_id, user_id],
        });
      }

      // 3. Eliminar amistades donde el usuario es user_id o friend_id
      await transaction.execute({
        sql: `DELETE FROM friends WHERE user_id = ? OR friend_id = ?`,
        args: [user_id, user_id],
      });

      // 4. Eliminar configuraciones del usuario
      await transaction.execute({
        sql: `DELETE FROM settings WHERE user_id = ?`,
        args: [user_id],
      });

      // 5. Eliminar chats huérfanos que no pertenecen a ningún grupo
      const orphanChats = await transaction
        .execute({
          sql: `SELECT c.chat_id 
              FROM chats AS c
              LEFT JOIN chat_users cu ON c.chat_id = cu.chat_id
              LEFT JOIN group_chats gc ON c.chat_id = gc.chat_id
              WHERE c.is_group = 0 
                AND c.name IS NULL
                AND cu.user_id = ?
                AND gc.group_id IS NULL`,
          args: [user_id],
        })
        .then((res) => res.rows);

      for (const { chat_id } of orphanChats) {
        // 5.1. Eliminar todos los mensajes del chat huérfano
        await transaction.execute({
          sql: `DELETE FROM messages WHERE chat_id = ?`,
          args: [chat_id],
        });

        // 5.2. Eliminar todas las relaciones chat_users del chat huérfano
        await transaction.execute({
          sql: `DELETE FROM chat_users WHERE chat_id = ?`,
          args: [chat_id],
        });

        // 5.3. Eliminar el chat huérfano
        await transaction.execute({
          sql: `DELETE FROM chats WHERE chat_id = ?`,
          args: [chat_id],
        });
      }

      // 6. Eliminar al usuario en posibles chats que pertenezca a grupos sin ser parte de el

      const chatsUserWithoutGroup = await transaction
        .execute({
          sql: `SELECT DISTINCT c.chat_id
              FROM chats AS c
              LEFT JOIN chat_users AS cu ON c.chat_id = cu.chat_id
              WHERE cu.user_id = ?
            `,
          args: [user_id],
        })
        .then((res) => res.rows);

      for (const { chat_id } of chatsUserWithoutGroup) {
        const chatUsersCount = await transaction
          .execute({
            sql: `SELECT COUNT(user_id) AS user_count FROM chat_users WHERE chat_id = ?`,
            args: [chat_id],
          })
          .then((res) => res.rows[0].user_count);

        if (chatUsersCount <= 2) {
          // 6.1. Eliminar todos los mensajes del chat si hay solo 2 usuarios
          await transaction.execute({
            sql: `DELETE FROM messages WHERE chat_id = ?`,
            args: [chat_id],
          });

          // 6.2. Eliminar todas las relaciones chat_users del chat
          await transaction.execute({
            sql: `DELETE FROM chat_users WHERE chat_id = ?`,
            args: [chat_id],
          });

          // 6.3. Eliminar la relación group_chats del chat
          await transaction.execute({
            sql: `DELETE FROM group_chats WHERE chat_id = ?`,
            args: [chat_id],
          });

          // 6.4. Eliminar el chat
          await transaction.execute({
            sql: `DELETE FROM chats WHERE chat_id = ?`,
            args: [chat_id],
          });
        } else {
          // 6.1. Eliminar solo los mensajes del usuario en el chat grupal
          await transaction.execute({
            sql: `DELETE FROM messages WHERE chat_id = ? AND sender_id = ?`,
            args: [chat_id, user_id],
          });

          // 6.2. Eliminar solo la relación chat_users del usuario
          await transaction.execute({
            sql: `DELETE FROM chat_users WHERE chat_id = ? AND user_id = ?`,
            args: [chat_id, user_id],
          });
        }
      }
    
      // 7. Eliminar usuario
      await transaction.execute({
        sql: `DELETE FROM users WHERE user_id = ?`,
        args: [user_id],
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw errorDatabase({ error });
    }

    return { message: "Success delete" };
  }
}

export { ProfileModel };
