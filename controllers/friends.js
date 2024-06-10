import { validateSendRequest } from "../schemas/friends.js";

class FriendController {
  constructor({ friendModel }) {
    this.friendModel = friendModel;
  }

  createRequest = async (req, res) => {
    const result = validateSendRequest(req.body);

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    const friend_id = result.data.friend_id;

    try {
      const data = await this.friendModel.createRequest({
        user: req.user,
        friend_id,
      });
      res.json(data);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  getAll = async (req, res) => {
    try {
      const data = await this.friendModel.getAll({ user: req.user });
      res.json(data);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  updateStatus = async (req, res) => {
    try {
      const data = await this.friendModel.updateStatus({
        user: req.user,
        params: req.params,
      });
      res.json(data);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  delete = async (req, res) => {
    try {
      const data = await this.friendModel.delete({
        user: req.user,
        params: req.params,
      });
      res.json(data);
    } catch (error) {
      res
        .status(error.status || 500)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };
}

export { FriendController };
