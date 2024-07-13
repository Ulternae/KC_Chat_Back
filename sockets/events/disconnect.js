const EventDisconnect = ({ socket }) => {
  socket.on("disconnect", () => {
    console.log(`Client disconnet : ${socket.user.nickname}`);
  });
}

export { EventDisconnect }