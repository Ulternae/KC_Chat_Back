import { Router } from "express";
import { GroupChatController } from "../controllers/groupChat.js";
import { authToken } from "../middlewares/authToken.js";

const CreateGroupChatRoute = ({ groupChatModel }) => {
  const router = Router();
  const controller = new GroupChatController({ groupChatModel });

  router.post('/:group_id/chats', authToken, controller.createChatInGroup);
  router.get('/:group_id/chats', authToken, controller.getChatsInGroup);
  router.get('/:group_id/chats/:chat_id', authToken, controller.getChatDetailsInGroup);
  router.patch('/:group_id/chats/:chat_id', authToken, controller.updateChatInGroup);
  router.delete('/:group_id/chats/:chat_id', authToken, controller.deleteChatInGroup);

  return router

};

export { CreateGroupChatRoute }