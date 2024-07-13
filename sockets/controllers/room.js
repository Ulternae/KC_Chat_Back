import { validateJoinRoom } from "../schemas/room.js";

class RoomController {
  constructor({ roomModel }) {
    this.roomModel = roomModel
  }

  joinRoom = async ({socket, io, room}) => {
    const roomInfo = validateJoinRoom({ room })

    if (!roomInfo.success) {
      socket.emit("error", { status: 422, error: roomInfo.error.issues });
      return;
    }

    try {
      socket.join(room)
      const data = await this.roomModel.roomChats({ room })
      socket.emit("loadMessages" , data , room)
    } catch (error) {
      console.log(error)
      socket.emit("error", { status: 500, error: "Error join room" });
    }
  }
}

export { RoomController }