import { RoomController } from "../controllers/room.js";

const EventRoom = ({ socket, io, roomModel }) => {
  const constroller = new RoomController({ roomModel });

  socket.on("joinRoom", (room) => {
    constroller.joinRoom({ socket, io, room });
  });
};

export { EventRoom };
