const EventNotification = ({ socket, io }) => {
  socket.on("notification", ({ friendId, type, content }) => {
    console.log(`Send notification : ${friendId}`)
    io.to(friendId).emit("notification", {type, content});
  })
}

export { EventNotification }
