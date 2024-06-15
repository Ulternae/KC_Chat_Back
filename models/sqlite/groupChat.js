import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

const client = createClient({
  authToken: process.env.TURSO_AUTH_TOKEN,
  url: process.env.TURSO_DATABASE_URL
});

const errorDatabase = ({ error }) => {
  return {
    status: 500,
    error: "Error in the database",
    type: "databaseError",
    field: "groups",
    details: error.message,
  };
};

const unauthorized = ({ field, details }) => {
  return {
    status: 401,
    error: "This user does not have access to do this action",
    type: "unauthorized",
    field,
    details,
  };
};
const insufficientMembersChat = {
  status: 400,
  error: "Insufficient Members for create chat",
  type: "Insufficient_members",
  field: "chats",
  details: "You need minimum 2 members valid for create chat",
};

class GroupChatModel {
  static async validGroup({ group_id }) {
    const existingGroup = await client.execute({
      sql: `SELECT 
              name, 
              group_id,
              creator_id,
              created_at,
              description,
              is_public
            FROM groups
            WHERE group_id = ?`,
      args: [group_id],
    });

    if (existingGroup.rows.length === 0) {
      throw {
        status: 400,
        error: "The group not found",
        type: "Group_not_found",
        field: "groups",
        details: "The group selected not found in database",
      };
    }

    const membersInGroup = await client.execute({
      sql: `SELECT 
              user_id, 
              is_moderator 
            FROM group_members 
            WHERE group_id = ?`,
      args: [group_id],
    });

    const response = {
      group: existingGroup.rows[0],
      members: [...membersInGroup.rows],
    };

    return response;
  }
  static async validPermissions({ user_id, members, creator_id }) {
    if (creator_id === user_id) return true;

    const userInGroup = members.some(
      (member) => member.user_id === user_id && !!member.is_moderator
    );

    if (!userInGroup) {
      throw unauthorized({
        field: "groups",
        details: `The user ${user_id} selected no have authorized for do this action`,
      });
    }
  }
  static async validChat({ chat_id }) {
    const existingChat = await client.execute({
      sql: `SELECT 
              chat_id ,
              name ,
              is_group ,
              created_at
            FROM chats
            WHERE chat_id = ?`,
      args: [chat_id],
    });

    if (existingChat.rows.length === 0) {
      throw {
        status: 400,
        error: "The chat not found",
        type: "Chat_not_found",
        field: "chats",
        details: "The chat selected not found in database",
      };
    }

    const participant = await client.execute({
      sql: `SELECT 
              user_id
            FROM chat_users
            WHERE chat_id = ?`,
      args: [chat_id],
    });

    const response = {
      chat: existingChat.rows,
      members: participant.rows,
    };

    return response;
  }

  static async validUserInGroup({ members, user_id, creator_id }) {
    if (creator_id === user_id) return true;

    const isUserInGroup = members.some((member) => member.user_id === user_id);

    if (!isUserInGroup) {
      throw unauthorized({
        field: "groups",
        details: `The user ${user_id} selected no have authorized for see the group`,
      });
    }
  }

  static async createChatInGroup({ user_id, group_id, input }) {
    const { group, members } = await this.validGroup({ group_id });
    const creator_id = group.creator_id;
    const chat_users = input.chat_users;
    const chat_id = crypto.randomUUID();

    await this.validPermissions({ members, user_id, creator_id });

    const { validMembers, invalidMembers } = chat_users.reduce(
      (acc, user) => {
        if (
          user === creator_id ||
          members.some(({ user_id }) => user_id === user)
        ) {
          acc.validMembers.push(user);
        } else {
          acc.invalidMembers.push(user);
        }
        return acc;
      },
      { validMembers: [], invalidMembers: [] }
    );

    if (validMembers.length < 2) {
      throw insufficientMembersChat;
    }

    try {
      const transaction = await client.transaction("write");

      try {
        await transaction.execute({
          sql: `INSERT INTO chats (
                  chat_id,
                  name, 
                  is_group
                ) VALUES (?, ?, ?)`,
          args: [chat_id, input.name, true],
        });

        await Promise.all(
          validMembers.map(async (member) => {
            await transaction.execute({
              sql: `INSERT INTO chat_users (
                    chat_id,
                    user_id
                  ) VALUES (?, ?)`,
              args: [chat_id, member],
            });
          })
        );

        await transaction.execute({
          sql: `INSERT INTO group_chats (
                  group_id ,
                  chat_id
                ) VALUES ( ? , ? )`,
          args: [group_id, chat_id],
        });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      throw errorDatabase({ error });
    }

    const warnings = invalidMembers.length === 0 ? undefined : invalidMembers;

    const response = await this.validChat({ chat_id });
    return {
      message: "Succesfully create chat in group",
      response,
      warnings,
    };
  }

  static async getChatsInGroup({ user_id, group_id }) {
    const { group, members } = await this.validGroup({ group_id });
    const creator_id = group.creator_id;
    await this.validUserInGroup({ members, user_id, creator_id });

    let response;
    try {
      const chats = await client.execute({
        sql: `SELECT chat_id 
              FROM group_chats 
              WHERE group_id = ?`,
        args: [group_id],
      });

      if (chats.rows.length > 0) {
        response = await Promise.all(
          chats.rows.map(async ({ chat_id }) => {
            const chatData = await client.execute({
              sql: `SELECT
                    chat_id,
                    name,
                    is_group,
                    created_at
                  FROM chats
                  WHERE chat_id = ?`,
              args: [chat_id],
            });
            return chatData.rows[0];
          })
        );
      }
    } catch (error) {
      throw errorDatabase({ error });
    }

    return response;
  }
  static async getChatDetailsInGroup({ user_id, group_id, chat_id }) {
    const { group, members } = await this.validGroup({ group_id });
    const creator_id = group.creator_id;
    await this.validUserInGroup({ members, user_id, creator_id });
    const chat = await this.validChat({ chat_id });
    const membersInChat = chat.members;
    const members_details = [];

    try {
      await Promise.all(
        membersInChat.map(async ({ user_id }) => {
          const member = await client.execute({
            sql: `SELECT
                    u.nickname, 
                    u.avatar_id,
                    u.user_id,
                    gm.is_moderator 
                  FROM group_members AS gm
                  INNER JOIN users AS u ON u.user_id = gm.user_id
                  WHERE u.user_id = ? 
                  AND gm.group_id = ?`,
            args: [user_id, group_id],
          });

          if (member.rows.length === 0 && user_id === creator_id) {
            const dataCreator = await client.execute({
              sql: `SELECT
                    u.nickname , 
                    u.avatar_id ,
                    u.user_id
                  FROM users AS u 
                  WHERE u.user_id = ?`,
              args: [user_id],
            });
            members_details.push({
              ...dataCreator.rows[0],
              is_moderator: 1,
            });
          } else {
            members_details.push(member.rows[0]);
          }
        })
      );
    } catch (error) {
      throw errorDatabase({ error });
    }

    const response = {
      group,
      ...chat,
      members_details,
    };

    return response;
  }

  static async updateChatInGroup({ user_id, group_id, chat_id, input }) {
    const { group, members } = await this.validGroup({ group_id });
    const creator_id = group.creator_id;
    const name = input.name
    const chat_users = input.chat_users || []

    await this.validPermissions({ members, user_id, creator_id });
    const validChat = await this.validChat({ chat_id })
    const membersInChat = validChat.members

    const newMembers = []

    chat_users.forEach((user) => {
      const memberExisting = membersInChat.some(({ user_id }) => user_id === user)
      const validNewMember = members.some(({user_id}) => user_id === user)
      if (!memberExisting && validNewMember) {
        newMembers.push(user)
      }
    })

    try {
      if (!!name) {
        await client.execute({
          sql: `UPDATE chats
                SET name = ?
                WHERE chat_id = ?`,
          args: [ name, chat_id ]
        })
      }

      if (newMembers.length > 0) {
        await Promise.all( newMembers.map(async(member) => (
          await client.execute({
            sql: `INSERT INTO chat_users (
                  chat_id ,
                  user_id
                  ) VALUES ( ? , ? )`,
            args: [chat_id , member]
          })
        ) ))
      }
    } catch (error) {
      throw errorDatabase({ error })
    }

    return { message: "Succesfully Update Chat" };
  }
  static async deleteChatInGroup({ user_id, group_id, chat_id }) {
    const { group, members } = await this.validGroup({ group_id });
    const creator_id = group.creator_id
    await this.validChat({ chat_id })
    await this.validPermissions({ members, user_id, creator_id });


    try {
      const transaction = await client.transaction("write")
      
      await transaction.execute({
        sql: `DELETE FROM chat_users
              WHERE chat_id = ?` ,
        args: [chat_id]
      })

      await transaction.execute({
        sql: `DELETE FROM group_chats
              WHERE chat_id = ?`,
        args: [chat_id]
      })

      await transaction.execute({
        sql: `DELETE FROM messages
              WHERE chat_id = ?`,
        args: [chat_id]
      })

      await transaction.execute({
        sql: `DELETE FROM chats
              WHERE chat_id = ?`,
        args: [chat_id]
      })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw errorDatabase({ error })
    }
    return { message: "Succesfully Delete Chat" };
  }
}

export { GroupChatModel };
 