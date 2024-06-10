import { validateGroupChat , partialValidateGroupChat } from '../schemas/groupChats.js'

class GroupChatController {
  constructor({ groupChatModel }) {
    this.groupChatModel = groupChatModel;
  }

  createChatInGroup = async (req, res) => {
    const response = validateGroupChat(req.body)
    
    if (!response.success) {
      return res.status(422).json({ error: JSON.parse(response.error.message) });
    }
    try {
      const data = await this.groupChatModel.createChatInGroup({ user_id : req.user.id , group_id: req.params.group_id, input: response.data });
      res.json(data);
    } catch (error) {
      res
      .status(error.status || 500)
      .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
    
  };

  getChatsInGroup = async (req, res) => {
    try {
      const data = await this.groupChatModel.getChatsInGroup({ user_id : req.user.id , group_id: req.params.group_id });
      res.json(data);
    } catch (error) {
      res
      .status(error.status || 500)
      .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  };

  getChatDetailsInGroup = async (req, res) => {
    try {
      const data = await this.groupChatModel.getChatDetailsInGroup({ user_id : req.user.id , group_id: req.params.group_id, chat_id: req.params.chat_id });
      res.json(data);
    } catch (error) {
      res
      .status(error.status || 500)
      .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  };

  updateChatInGroup = async (req, res) => {
    const response = partialValidateGroupChat(req.body)
    if (!response.success) {
      return res.status(422).json({ error: JSON.parse(response.error.message) });
    }

    try {
      const data = await this.groupChatModel.updateChatInGroup({ user_id : req.user.id , group_id: req.params.group_id, chat_id: req.params.chat_id,  input: response.data });
      res.json(data);
    } catch (error) {
      res
      .status(error.status || 500)
      .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }

  };

  deleteChatInGroup = async (req, res) => {
    try {
      const data = await this.groupChatModel.deleteChatInGroup({ user_id : req.user.id , group_id: req.params.group_id, chat_id: req.params.chat_id });
      res.json(data);
    } catch (error) {
      res
      .status(error.status || 500)
      .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }

  };
}

export { GroupChatController };
