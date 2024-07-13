const EventListenerUser = ({ socket , io }) => {
  socket.on("listenerUser", (userId) => {
    console.log(`User connected : ${userId}`)
    socket.join(userId)
  })
}

export { EventListenerUser }