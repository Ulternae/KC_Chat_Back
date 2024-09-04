import {
  partialValidateGroup,
  validateGroup,
  validateGroupUsersSchema,
} from "../schemas/groups.js";

class GroupController {
  constructor({ groupModel }) {
    this.groupModel = groupModel;
  }

  createGroup = async (req, res) => {
    const result = validateGroup(req.body);
    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.groupModel.createGroup({
        user: req.user,
        input: result.data,
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  getAllGroups = async (req, res) => {
    try {
      const data = await this.groupModel.getAllGroups({ user: req.user });
      res.json(data);
    } catch (error) {
      console.log(error)
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  getGroupById = async (req, res) => {
    try {
      const data = await this.groupModel.getGroupById({
        group_id: req.params.group_id,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  updateGroup = async (req, res) => {
    const result = partialValidateGroup(req.body);

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.groupModel.updateGroup({
        user: req.user,
        input: result.data,
        group_id: req.params.group_id,
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  deleteGroup = async (req, res) => {
    try {
      const data = await this.groupModel.deleteGroup({
        group_id: req.params.group_id,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  addMembers = async (req, res) => {
    const result = validateGroupUsersSchema(req.body);

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.groupModel.addMembers({
        user: req.user,
        users_ids: result.data.users_ids,
        group_id: req.params.group_id,
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  deleteMember = async (req, res) => {
    try {
      const data = await this.groupModel.deleteMember({
        group_id: req.params.group_id,
        member_id: req.params.member_id,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  deleteAllMembers = async (req, res) => {
    try {
      const data = await this.groupModel.deleteAllMembers({
        group_id: req.params.group_id,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  assigmentModerators = async (req, res) => {
    const result = validateGroupUsersSchema(req.body);

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.groupModel.assigmentModerators({
        group_id: req.params.group_id,
        users_ids: result.data.users_ids,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  deleteModerator = async (req, res) => {
    try {
      const data = await this.groupModel.deleteModerator({
        group_id: req.params.group_id,
        moderator_id: req.params.moderator_id,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  deleteAllModerators = async (req, res) => {
    try {
      const data = await this.groupModel.deleteAllModerators({
        group_id: req.params.group_id,
        user: req.user
      });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };
}

export { GroupController };
