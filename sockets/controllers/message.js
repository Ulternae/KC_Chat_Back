import { validateSendMessage } from "../schemas/message.js";

class MessageController {
  constructor({ messageModel }) {
    this.messageModel = messageModel;
  }

  sendMessage = async (socket, io, room, content, type) => {
    const messageInfo = validateSendMessage({ room, content, type });
    const userInfo = socket.user;

    if (!messageInfo.success) {
      socket.emit("error", { status: 422, error: messageInfo.error.issues });
      return;
    }

    try {
      const data = await this.messageModel.sendMessage({
        messageInfo: messageInfo.data,
        userInfo,
      });

      io.to(room).emit("message", data);
    } catch (error) {
      console.log(error);
      socket.emit("error", { status: 500, error: "Error sending message" });
    }
  };
}

export { MessageController };
