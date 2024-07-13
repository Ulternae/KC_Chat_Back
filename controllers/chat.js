import { validateCreateChat, validateMessageChat } from "../schemas/chat.js";

class ChatController {
  constructor({ chatModel }) {
    this.chatModel = chatModel;
  }

  create = async (req, res) => {
    const result = validateCreateChat(req.body);

    if (!result.success) {
      return res.status(422).json({ error: result.error.issues });
    }

    try {
      const data = await this.chatModel.create({
        user: req.user,
        friend_id: result.data.friend_id,
        chat_id: result.data.chat_id
      });
      return res.status(200).json(data);
    } catch (error) {
      console.log(error)
      return res
        .status(error.status || 500)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  getChats = async (req, res) => {
    try {
      const data = await this.chatModel.getChats({ user: req.user });
      res.status(200).json(data);
    } catch (error) {
      console.log(error)
      res
        .status(error.status)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  sendMessage = async (req, res) => {
    const result = validateMessageChat(req.body);

    if (!result.success) {
      return res.status(422).json({ error: result.error.issues });
    }

    try {
      const data = await this.chatModel.sendMessage({
        user: req.user,
        content: result.data.content,
        chat_id: req.params.chat_id
      });
      res.status(200).json(data);
    } catch (error) {
      console.log(error)
      res
        .status(error.status)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  getMessages = async (req, res) => {
    try {
      const data = await this.chatModel.getMessages({ user: req.user, chat_id: req.params.chat_id});
      res.status(200).json(data);
    } catch (error) {
      console.log(error)
      res
        .status(error.status)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  };

  getChatById = async (req, res) => {
    try {
      const data = await this.chatModel.getChatById({ user: req.user, chat_id: req.params.chat_id});
      res.status(200).json(data);
    } catch (error) {
      console.log(error)
      res
        .status(error.status)
        .json({
          error: error.error,
          type: error.type,
          field: error.field,
          details: error.details,
        });
    }
  }
}

export { ChatController };
