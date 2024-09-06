import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { OPTIONS_PARTICIPANTS_GROUP as OPG } from "../../constants/index.js";
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
    field: "groups",
    details: error.message,
  };
};

class GroupModel {
  static async validUsers([...users]) {
    const uniqueUsers = new Set(users);
    const usersIds = await Promise.all(
      [...uniqueUsers].map(async (user_id) =>
        client
          .execute({
            sql: `SELECT user_id FROM users WHERE user_id = ?`,
            args: [user_id],
          })
          .then((response) => response.rows[0]?.user_id)
      )
    );

    const validUsers = usersIds.filter((value) => value !== undefined);

    if (validUsers.length === 0) {
      throw {
        status: 400,
        error: "The user not exist",
        type: "User_not_found",
        field: "users",
        details: "The user not found in database",
      };
    }

    return validUsers;
  }

  static async validGroup({ group_id }) {
    const existingGroup = await client
      .execute({
        sql: `SELECT name, group_id, creator_id , created_at, description, is_public FROM groups WHERE group_id = ?`,
        args: [group_id],
      })
      .then((res) => res.rows);

    if (existingGroup.length === 0) {
      throw {
        status: 400,
        error: "The group not found",
        type: "Group_not_found",
        field: "groups",
        details: "The group selected not found in database",
      };
    }
    return existingGroup[0];
  }

  static async validPermision({ group_id, creator_id, user_id }) {
    if (creator_id === user_id) return true;

    const errorInfo = {
      status: 401,
      error: "This user does not have access to do this action",
      type: "unauthorized",
      field: "groups",
      details: `The user ${user_id} selected no have authorized for do this action : ${group_id}`,
    };

    let membersInGroup;

    try {
      membersInGroup = await client
        .execute({
          sql: `SELECT user_id, is_moderator FROM group_members WHERE group_id = ?`,
          args: [group_id],
        })
        .then((res) => res.rows);
    } catch (error) {
      throw errorInfo;
    }

    const haveAuthorization = membersInGroup.some(
      (member) => member.user_id === user_id && !!member.is_moderator
    );

    if (!haveAuthorization) {
      throw errorInfo;
    }

    return haveAuthorization;
  }

  static async getMemberGroup({ group_id }) {
    let members;

    try {
      members = await client
        .execute({
          sql: `SELECT 
                  gm.is_moderator ,
                  u.nickname ,
                  u.username ,
                  u.email ,
                  u.user_id
                FROM group_members AS gm 
                INNER JOIN users AS u ON u.user_id = gm.user_id
                WHERE gm.group_id = ?`,
          args: [group_id],
        })
        .then((res) => res.rows);
    } catch (error) {
      members = [];
    }

    return members;
  }

  static async createGroup({ user, input }) {
    const {
      name,
      description,
      is_public,
      category,
      color,
      avatar_id,
      group_id,
    } = input;
    const validUsers = await this.validUsers([user.id]);

    try {
      await client.execute({
        sql: `INSERT INTO groups (
              group_id, 
              name, 
              description, 
              is_public, 
              creator_id,
              category,
              color,
              avatar_id     
            ) VALUES (?, ?, ?, ?, ?, ? , ? ,?)`,
        args: [
          group_id,
          name,
          description,
          is_public,
          validUsers[0],
          category,
          color,
          avatar_id,
        ],
      });

      await client.execute({
        sql: `INSERT INTO group_members (
                group_id, 
                user_id, 
                is_moderator
              ) VALUES (?, ?, ?)`,
        args: [group_id, validUsers[0], true],
      });

      return {
        group_id,
        name,
        description,
        is_public,
        creator_id: validUsers[0],
      };
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error creating the group",
        type: "databaseError",
        field: "groups",
        details: error.message,
      };
    }
  }

  static async getAllGroups({ user }) {
    const user_id = user.id;
    let groups;

    try {
      groups = await client.execute({
        sql: `SELECT 
                g.group_id, 
                g.name,
                g.category,
                g.color,
                g.avatar_id, 
                g.description, 
                g.is_public, 
                g.creator_id,
                GROUP_CONCAT(
                  DISTINCT gm.user_id || ':' || gm.is_moderator
                ) AS user_ids,
                GROUP_CONCAT(
                  DISTINCT gc.chat_id
                ) AS chats_ids
              FROM groups AS g
              LEFT JOIN group_members AS gm ON gm.group_id = g.group_id
              LEFT JOIN group_chats AS gc ON gc.group_id = g.group_id
              WHERE g.creator_id = ? OR g.is_public = true
              GROUP BY g.group_id
          `,
        args: [user_id],
      });
    } catch (error) {
      throw errorDatabase({ error });
    }

    if (!groups || groups.rows.length === 0) {
      return { groupsUser: [], groupsNotBelongToUser: [] };
    }

    const usersIds = new Set(
      groups.rows.flatMap((g) => {
        return g.user_ids
          ? g.user_ids.split(",").map((u) => u.split(":")[0])
          : [];
      })
    );

    const getInfoUser = async ({ user_id }) => {
      try {
        const res = await client.execute({
          sql: `SELECT 
                  u.user_id as friend_id,
                  u.username,
                  u.nickname, 
                  u.email,
                  u.avatar_id,
                  a.url AS avatar_url
                  FROM users AS u 
                  LEFT JOIN avatars AS a ON u.avatar_id = a.avatar_id 
                  WHERE u.user_id = ?`,
          args: [user_id],
        });

        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (error) {
        throw errorDatabase({ error });
      }
    };

    let infoUsers = [];

    try {
      infoUsers = await Promise.all(
        Array.from(usersIds).map((user_id) => getInfoUser({ user_id }))
      ).then((res) => res.filter((data) => !!data));
    } catch (error) {
      throw {
        status: 404,
        error: "Error by obtaining information from users",
        type: "errorObtainInfoUsers",
        field: "users",
        details: error.message,
      };
    }

    const groupsInfo = groups.rows.map((group) => {
      const usersIds = group.user_ids ? group.user_ids.split(",") : [];
      const detailsUsers = usersIds.map((u) => {
        const [user_id, is_moderator] = u.split(":");
        const infoUser = infoUsers.find((iu) => iu.friend_id === user_id);
        const permissions = Number(is_moderator) ? OPG.MODERATOR : OPG.USER;
        return {
          ...infoUser,
          is_moderator,
          permissions,
        };
      });
      return {
        ...group,
        detailsUsers,
      };
    });

    const groupsUser = groupsInfo.filter(
      (g) => g.user_ids?.includes(user.id) || g.creator_id === user.id
    );
    const groupsNotBelongToUser = groupsInfo.filter(
      (g) => !g.user_ids?.includes(user.id)
    );
    return {
      groupsUser,
      groupsNotBelongToUser,
    };
  }

  static async getGroupById({ group_id, user }) {
    await this.validUsers([user.id]);
    const group = await this.validGroup({ group_id });
    const members = await this.getMemberGroup({ group_id });
    const { name, description, is_public, creator_id, created_at } = group;

    const response = {
      name,
      description,
      is_public,
      creator_id,
      group_id,
      created_at,
      members,
    };
    return response;
  }

  static async updateGroup({ user, input, group_id }) {
    const { creator_id } = await this.validGroup({ group_id });

    await this.validPermision({ group_id, creator_id, user_id: user.id });

    const columsUpdate = Object.keys(input)
      .map((value) => `${value} = ?`)
      .join(" , ");
    const valuesUpdate = Object.values(input);
    try {
      await client.execute({
        sql: `UPDATE groups 
                SET ${columsUpdate} WHERE group_id = ?`,
        args: [...valuesUpdate, group_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "Failed update group",
        type: "databaseError",
        field: "groups",
        details: error.message,
      };
    }
    return { message: "Updated Group Successfully" };
  }

  static async deleteGroup({ group_id, user }) {
    let transaction;

    try {
      const { creator_id } = await this.validGroup({ group_id });
      await this.validPermision({ group_id, creator_id, user_id: user.id });

      transaction = await client.transaction("write");
      let chats;

      await transaction.execute({
        sql: `DELETE FROM group_members
                WHERE group_id = ?`,
        args: [group_id],
      });

      chats = await transaction
        .execute({
          sql: `SELECT chat_id 
                  FROM group_chats 
                  WHERE group_id = ?`,
          args: [group_id],
        })
        .then((res) => res.rows);

      if (chats.length > 0) {
        const chatsDelete = chats.map(({ chat_id }) => chat_id);
        const chatsFilter = chatsDelete.filter((chat) => chat !== undefined);

        await transaction.execute({
          sql: `DELETE FROM group_chats 
                WHERE group_id = ?`,
          args: [group_id],
        });

        await Promise.all(
          chatsFilter.map(
            async (chat_id_query) =>
              await transaction.execute({
                sql: `DELETE FROM chat_users
                    WHERE chat_id = ?`,
                args: [chat_id_query],
              })
          )
        );

        await Promise.all(
          chatsFilter.map(
            async (chat_id_query) =>
              await transaction.execute({
                sql: `DELETE FROM messages 
                    WHERE chat_id = ?`,
                args: [chat_id_query],
              })
          )
        );

        await Promise.all(
          chatsFilter.map(
            async (chat_id_query) =>
              await transaction.execute({
                sql: `DELETE FROM chats 
                    WHERE chat_id = ?`,
                args: [chat_id_query],
              })
          )
        );
      }

      await transaction.execute({
        sql: `DELETE FROM groups 
              WHERE group_id = ?`,
        args: [group_id],
      });

      await transaction.commit();
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw errorDatabase({ error });
    }

    return { message: "deleteGroup" };
  }

  static async addMembers({ user, users_ids, group_id }) {
    const group = await this.validGroup({ group_id });
    const { name, description, is_public, creator_id } = group;

    const users_id = await this.validUsers([user.id]);
    const members_ids_input = await this.validUsers([...users_ids]);

    if (!is_public) {
      await this.validPermision({ group_id, creator_id, user_id: users_id[0] });
    }

    let members_ids_existings;

    try {
      members_ids_existings = await client
        .execute({
          sql: `SELECT user_id 
                FROM group_members 
                WHERE group_id = ?`,
          args: [group_id],
        })
        .then((res) => res.rows.map(({ user_id }) => user_id));
    } catch (error) {
      throw {
        status: 500,
        error: "Failed insert members of group",
        type: "databaseError",
        field: "group_members",
        details: error.message,
      };
    }

    const new_members = members_ids_input.filter(
      (id) => !members_ids_existings.includes(id)
    );

    if (new_members.length === 0) {
      return {
        name,
        description,
        is_public,
        group_id,
        creator_id,
        message: "All users selected for this group already existing",
        user_ids: members_ids_input,
      };
    }

    try {
      await Promise.all(
        new_members.map(
          async (member) =>
            await client.execute({
              sql: `INSERT INTO group_members (
                      group_id , 
                      user_id ,
                      is_moderator
                    ) VALUES ( ? , ? , ? )`,
              args: [group_id, member, false],
            })
        )
      );
    } catch (error) {
      throw {
        status: 500,
        error: "There was an insert members in group",
        type: "databaseError",
        field: "group_members",
        details: error.message,
      };
    }

    const allUsers = new Set([...members_ids_existings, ...members_ids_input]);

    return {
      name,
      description,
      is_public,
      group_id,
      creator_id,
      message: "Successfully added new members in group",
      user_ids: Array.from(allUsers),
    };
  }

  static async deleteMember({ group_id, member_id, user }) {
    const { creator_id } = await this.validGroup({ group_id });

    const [user_id] = await this.validUsers([user.id]);
    const [member_deleted_id] = await this.validUsers([member_id]);

    await this.validPermision({ group_id, creator_id, user_id });

    try {
      await client.execute({
        sql: `DELETE FROM group_members 
              WHERE group_id = ? 
              AND user_id = ?`,
        args: [group_id, member_deleted_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error a delete a member",
        type: "databaseError",
        field: "groups",
        details: error.message,
      };
    }

    return { message: "Successful member removal" };
  }

  static async deleteAllMembers({ group_id, user }) {
    const { creator_id } = await this.validGroup({ group_id });
    const [user_id] = await this.validUsers([user.id]);

    await this.validPermision({ group_id, creator_id, user_id });

    try {
      await client.execute({
        sql: `DELETE FROM group_members 
              WHERE group_id = ? 
              AND NOT user_id = ?`,
        args: [group_id, creator_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error a delete a member",
        type: "databaseError",
        field: "groups",
        details: error.message,
      };
    }

    const data = { message: "deleteAllMembers" };
    return data;
  }

  static async assigmentModerators({ group_id, users_ids, user }) {
    const { creator_id } = await this.validGroup({ group_id });

    const [user_id] = await this.validUsers([user.id]);
    const new_moderators = await this.validUsers(users_ids);

    await this.validPermision({ group_id, creator_id, user_id });

    let members;

    try {
      members = await client
        .execute({
          sql: `SELECT 
                  is_moderator, 
                  user_id 
                FROM group_members 
                WHERE group_id = ?`,
          args: [group_id],
        })
        .then((res) => res.rows);
    } catch (error) {
      throw {
        status: 500,
        error: "There was feching moderators",
        type: "databaseError",
        field: "group_members",
        details: error.message,
      };
    }

    const current_moderators = members.filter(
      ({ is_moderator }) => !!is_moderator
    );
    const current_members = members.filter(({ is_moderator }) => !is_moderator);

    const update_moderators = [];
    const create_moderators = [];

    new_moderators.forEach((id) => {
      const userExisting = current_members.some(
        ({ user_id }) => user_id === id
      );

      if (userExisting) {
        update_moderators.push(id);
      } else {
        const userIsModerator = current_moderators.some(
          ({ user_id }) => user_id === id
        );
        if (!userIsModerator) create_moderators.push(id);
      }
    });

    const haveDataToUpdate = update_moderators.length > 0;
    const haveDataToCreate = create_moderators.length > 0;

    if (!haveDataToUpdate && !haveDataToCreate) {
      return { message: "No new moderators to assign or update" };
    }

    if (haveDataToUpdate) {
      try {
        await Promise.all(
          update_moderators.map(async (id) => {
            await client.execute({
              sql: `UPDATE group_members 
                    SET is_moderator = true 
                    WHERE group_id = ? 
                    AND user_id = ?`,
              args: [group_id, id],
            });
          })
        );
      } catch (error) {
        throw {
          status: 500,
          error: "There was update moderators",
          type: "databaseError",
          field: "group_members",
          details: error.message,
        };
      }
    }

    if (haveDataToCreate) {
      try {
        await Promise.all(
          create_moderators.map(async (id) => {
            await client.execute({
              sql: `INSERT INTO group_members 
                    (group_id, user_id, is_moderator) 
                    VALUES (?, ?, ?)`,
              args: [group_id, id, true],
            });
          })
        );
      } catch (error) {
        throw {
          status: 500,
          error: "There was create moderators",
          type: "databaseError",
          field: "group_members",
          details: error.message,
        };
      }
    }

    return { message: "Successfully assigned moderators in the group" };
  }

  static async deleteModerator({ group_id, moderator_id, user }) {
    const { creator_id } = await this.validGroup({ group_id });
    const [user_id] = await this.validUsers([user.id]);

    await this.validPermision({ group_id, creator_id, user_id });

    try {
      await client.execute({
        sql: `UPDATE group_members
              SET is_moderator = 0
              WHERE user_id = ? AND group_id = ?`,
        args: [moderator_id, group_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was error an deleter a member in group",
        type: "databaseError",
        field: "group_members",
        details: error.message,
      };
    }
    const data = { message: "Successfully deleted of the member" };
    return data;
  }

  static async deleteAllModerators({ group_id, user }) {
    const { creator_id } = await this.validGroup({ group_id });
    const [user_id] = await this.validUsers([user.id]);

    await this.validPermision({ group_id, creator_id, user_id });

    try {
      await client.execute({
        sql: `DELETE FROM group_members
                WHERE group_id = ?
                AND NOT user_id = ?
                `,
        args: [group_id, creator_id],
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was error an deleter all members in group",
        type: "databaseError",
        field: "group_members",
        details: error.message,
      };
    }
    const data = { message: "Successfully deleted all members in group" };
    return data;
  }
}

export { GroupModel };
