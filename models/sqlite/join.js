import dotenv from 'dotenv'
import { createClient  } from '@libsql/client';

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
    field: "groups",
    details: error.message,
  };
};

class JoinModel {
  static async validateGroup ({ group_id }) {
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


  static async joinGroup ({ user, group_id }) {
    const { group, members} = await this.validateGroup({ group_id })
    const nameGroup = group.name
    const isPublic = group.is_public
    const user_id = user.id
    const nickname = user.nickname
    if (!isPublic) {
      throw {
        status: 401,
        error: "This group not is public",
        type: "Group_private",
        field: "groups",
        details: "The group selected is private, you can´t join in group",
      };
    }

    const isMember = members.some((member) => member.user_id === user_id)
    
    if ( isMember ) {
      return { message: `Member ${nickname} already exist in the group ${nameGroup}`}
    }

    try {
      await client.execute({
        sql: `INSERT INTO group_members (
                group_id, user_id, is_moderator
              ) VALUES ( ? , ? , ?)`,
        args: [ group_id, user_id, false]
      })
    } catch (error) {
      throw errorDatabase({ error })
    }

    return { message : `Success, user ${nickname} is a member in the group ${nameGroup}`}
  }
}

export { JoinModel }