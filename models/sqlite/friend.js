import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { FRIENDS_REQUEST_STATUSES } from "../../utils/enums.js";

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

class FriendModel {
  static async createRequest({ user, friend_id }) {
    const user_id = user.id;
    const accepted = FRIENDS_REQUEST_STATUSES.ACCEPTED;
    if (user_id === friend_id) {
      throw {
        status: 404,
        error: "The user and friends request is the same user.",
        type: "sameUser",
        field: "user_id, friend_id",
      };
    }

    let thereIsARequest;

    try {
      thereIsARequest = await client.execute({
        sql: `SELECT 
              f.user_id,
              f.friend_id,
              f.status,
              f.id,
              MAX(c.chat_id) as chat_id
            FROM friends AS f
            LEFT JOIN chat_users AS cu1 ON cu1.user_id = f.user_id
            LEFT JOIN chat_users AS cu2 ON cu2.user_id = f.friend_id AND cu2.chat_id = cu1.chat_id
            LEFT JOIN chats AS c ON c.chat_id = cu2.chat_id
            WHERE 
              (f.user_id = :user_id AND f.friend_id = :friend_id)
              OR 
              (f.user_id = :friend_id AND f.friend_id = :user_id)
            GROUP BY f.user_id, f.friend_id, f.status, f.id
            `,
        args: {
          user_id,
          friend_id,
        },
      });
    } catch (error) {
      errorDatabase({ error });
    }

    if (thereIsARequest.rows.length === 0) {
      try {
        await client.execute({
          sql: `INSERT INTO friends (user_id, friend_id, status) VALUES ( ? , ? , ?)`,
          args: [user_id, friend_id, accepted],
        });

        const friend = await client.execute({
          sql: `SELECT nickname, username FROM users WHERE user_id = ?`,
          args: [friend_id],
        });

        const { username, nickname } = friend.rows[0];

        return {
          message: `Success sending request to user ${username} (${nickname})`,
        };
      } catch (error) {
        throw {
          status: 500,
          error: "An error occurred while creating the friend request",
          type: "databaseError",
          field: "Friends",
          details: error,
        };
      }
    }

    const { status, id } = thereIsARequest.rows[0];
    const isRejected = status === FRIENDS_REQUEST_STATUSES.REJECTED;

    const infoFriends = thereIsARequest.rows[thereIsARequest.rows.length - 1];
    if (!isRejected) {
      throw {
        status: 409,
        error: "The request already exists",
        type: "requestFriendAlreadyExists",
        field: "user_id, friend_id",
        details: infoFriends,
      };
    }

    try {
      await client.execute({
        sql: `UPDATE friends SET status = ? WHERE id = ?`,
        args: [FRIENDS_REQUEST_STATUSES.ACCEPTED, id],
      });

      const friend = await client.execute({
        sql: `SELECT nickname, username FROM users WHERE user_id = ?`,
        args: [friend_id],
      });

      const { username, nickname } = friend.rows[0];

      return {
        message: `Success updating request to user ${username} (${nickname})`,
      };
    } catch (error) {
      errorDatabase({ error });
    }
  }

  static async getAll({ user }) {
    const user_id = user.id;
    const response = {};
    let getFriends;

    try {
      getFriends = await client.execute({
        sql: `WITH FilteredFriends AS (
                SELECT id, user_id, friend_id, status
                FROM friends
                WHERE user_id = :user_id OR friend_id = :user_id
              ),
              ChatRelations AS (
                SELECT DISTINCT
                  (CASE WHEN cu1.user_id < cu2.user_id THEN cu1.user_id ELSE cu2.user_id END) AS user1,
                  (CASE WHEN cu1.user_id > cu2.user_id THEN cu1.user_id ELSE cu2.user_id END) AS user2,
                  cu1.chat_id
                FROM chat_users cu1
                INNER JOIN chat_users cu2 ON cu1.chat_id = cu2.chat_id
                INNER JOIN chats c ON cu1.chat_id = c.chat_id
                WHERE c.is_group = 0
              )
              SELECT 
                f.user_id,
                f.friend_id,
                f.status,
                cr.chat_id
              FROM FilteredFriends AS f
              LEFT JOIN ChatRelations AS cr 
                ON (CASE WHEN f.user_id < f.friend_id THEN f.user_id ELSE f.friend_id END) = cr.user1
                AND (CASE WHEN f.user_id > f.friend_id THEN f.user_id ELSE f.friend_id END) = cr.user2;`,
        args: { user_id },
      });

    } catch (error) {
      console.log(error);
      throw {
        status: 500,
        error: "There was an error getting your friend request requests.",
        type: "databaseError",
        field: "Friends",
        details: error,
      };
    }

    getFriends.rows.forEach((data) => {
      const status = data.status;
      if (!response[status]) {
        response[status] = [data];
      } else {
        response[status].push(data);
      }
    });

    return response;
  }

  static async updateStatus({ user, params }) {
    const user_id = user.id;
    const { friend_id, status } = params;

    if (user_id === friend_id) {
      throw {
        status: 400,
        error: "The user and friend request is the same user.",
        type: "Same_user",
        field: "user_id, friend_id",
      };
    }

    let response;
    try {
      response = await client.execute({
        sql: `SELECT id FROM friends 
              WHERE (user_id = :user_id AND friend_id = :friend_id)
              OR (user_id = :friend_id AND friend_id = :user_id)`,
        args: {
          user_id,
          friend_id,
        },
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error fetching the friend request.",
        type: "databaseError",
        field: "friends",
        details: error,
      };
    }

    if (response.rows.length === 0) {
      throw {
        status: 404,
        error: "No friend request found between the specified users.",
        type: "Friend_request_not_found",
        field: "friend_id",
      };
    }

    const validStatus = FRIENDS_REQUEST_STATUSES[status.toUpperCase()];
    if (!validStatus) {
      throw {
        status: 400,
        error: "Invalid status provided.",
        type: "Invalid_status",
        field: "status",
      };
    }

    let update;
    try {
      update = await client.execute({
        sql: `UPDATE friends
              SET status = :status
              WHERE id = :id`,
        args: {
          status: validStatus,
          id: response.rows[0].id,
        },
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error updating the friend request status.",
        type: "databaseError",
        field: "friends",
        details: error,
      };
    }

    if (update.rowsAffected === 0) {
      throw {
        status: 500,
        error: "Failed to update the friend request status.",
        type: "Update_failed",
        field: "friends",
      };
    }

    return { message: "Successfully updated the friend request status." };
  }

  static async delete({ user, params }) {
    const user_id = user.id;
    const { friend_id } = params;

    if (user_id === friend_id) {
      throw {
        status: 404,
        error: "The user and friends request is the same user.",
        type: "Same_user",
        field: "user_id, friend_id",
      };
    }

    let response;
    try {
      response = await client.execute({
        sql: `SELECT id FROM friends 
              WHERE (user_id = :user_id AND friend_id = :friend_id)
              OR (user_id = :friend_id AND friend_id = :user_id)`,
        args: {
          user_id,
          friend_id,
        },
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error fetching the friend request.",
        type: "databaseError",
        field: "friends",
        details: error,
      };
    }

    if (response.rows.length === 0) {
      throw {
        status: 404,
        error: "No friend request found between the specified users.",
        type: "Friend_request_not_found",
        field: "friend_id",
      };
    }

    let deleteResponse;
    try {
      deleteResponse = await client.execute({
        sql: `DELETE FROM friends 
              WHERE (user_id = :user_id AND friend_id = :friend_id)
              OR (user_id = :friend_id AND friend_id = :user_id)`,
        args: {
          user_id,
          friend_id,
        },
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error deleting the friend request.",
        type: "databaseError",
        field: "friends",
        details: error,
      };
    }

    if (deleteResponse.rowsAffected === 0) {
      throw {
        status: 500,
        error: "Failed to delete the friend request.",
        type: "Delete_failed",
        field: "friends",
      };
    }

    return { message: "Successfully deleted the friend request." };
  }
}

export { FriendModel };
