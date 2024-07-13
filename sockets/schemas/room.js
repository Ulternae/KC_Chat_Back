import z from "zod"

const joinRoomSchema = z.object({
  room: z.string(),
})

const validateJoinRoom = (object) => {
  return joinRoomSchema.safeParse(object)
}

export { validateJoinRoom }