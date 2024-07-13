import { MessageController } from "../controllers/message.js";

const EventMessage = ({ socket, io, messageModel }) => {
  const controller = new MessageController({ messageModel})
  socket.on("sendMessage", (room, message, type) => {
    controller.sendMessage(socket, io, room, message, type);
  });
};

export { EventMessage };
