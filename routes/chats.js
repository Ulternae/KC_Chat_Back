import { Router } from "express";
import { ChatController } from "../controllers/chat.js";
import { authToken } from "../middlewares/authToken.js";

const CreateChatsRoute = ({ chatModel }) => {
  const router = Router();
  const controller = new ChatController({ chatModel })

  router.post('/', authToken, controller.create);
  router.get('/', authToken, controller.getChats);
  router.get('/:chat_id', authToken, controller.getChatById);
  router.post('/:chat_id/messages', authToken, controller.sendMessage);
  router.get('/:chat_id/messages', authToken, controller.getMessages );

  return router
}

export { CreateChatsRoute }