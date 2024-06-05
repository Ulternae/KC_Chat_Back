import z from "zod"

const sendRequestSchema = z.object({
  friend_id: z.string().uuid()
})

const validateSendRequest = (object) => {
  return sendRequestSchema.safeParse(object)
}

export { validateSendRequest }