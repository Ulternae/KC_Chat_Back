import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { FRIENDS_REQUEST_STATUSES } from "../../utils/enums.js";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

class FriendModel {
  static async createRequest({ user, friend_id }) {
    const user_id = user.id;
    const pending = FRIENDS_REQUEST_STATUSES.PENDING;
    if (user_id === friend_id) {
      throw {
        status: 404,
        error: "The user and friends request is the same user.",
        type: "Same_user",
        field: "user_id, friend_id",
      };
    }

    const thereIsARequest = await client.execute({
      sql: `SELECT user_id, friend_id, status, id FROM friends 
        WHERE user_id = :user_id AND friend_id = :friend_id
        OR user_id = :friend_id AND friend_id = :user_id
      `,
      args: {
        user_id,
        friend_id,
      },
    });

    if (thereIsARequest.rows.length === 0) {
      try {
        await client.execute({
          sql: `INSERT INTO friends (user_id, friend_id, status) VALUES ( ? , ? , ?)`,
          args: [user_id, friend_id, pending],
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
          type: "Database_error",
          field: "Friends",
          details: error,
        };
      }
    }

    const { status, id } = thereIsARequest.rows[0];
    const isRejected = status === FRIENDS_REQUEST_STATUSES.REJECTED;

    if (!isRejected) {
      throw {
        status: 409,
        error: "The request is already exists",
        type: "friends",
        field: "user_id, friend_id",
      };
    }

    try {
      await client.execute({
        sql: `UPDATE friends SET status = ? WHERE id = ?`,
        args: [FRIENDS_REQUEST_STATUSES.PENDING, id],
      });

      const friend = await client.execute({
        sql: `SELECT nickname, username FROM users WHERE user_id = ?`,
        args: [friend_id],
      });

      const { username, nickname } = friend.rows[0];

      return {
        message: `Success update request to user ${username} (${nickname})`,
      };
    } catch (error) {
      throw {
        status: 500,
        error: "An error occurred while creating the friend request",
        type: "Database_error",
        field: "Friends",
        details: error,
      };
    }
  }

  static async getAll({ user }) {
    const user_id = user.id;
    const response = {};
    let getFriends;

    try {
      getFriends = await client.execute({
        sql: `SELECT * FROM friends 
              WHERE user_id = :user_id OR friend_id = :user_id`,
        args: { user_id },
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error getting your friend request requests.",
        type: "Database_error",
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
        type: "Database_error",
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
          id: response.rows[0].id
        },
      });
    } catch (error) {
      throw {
        status: 500,
        error: "There was an error updating the friend request status.",
        type: "Database_error",
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
        type: "Database_error",
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
        type: "Database_error",
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
