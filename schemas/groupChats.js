import z from 'zod'

const groupChatShema = z.object({
  name: z.string() ,
  chat_users: z.array(z.string()),
  chat_id: z.string()
})

const validateGroupChat = (object) => {
  return groupChatShema.safeParse(object)
}

const partialValidateGroupChat = (object) => {
  return groupChatShema.partial().safeParse(object)
}

export { validateGroupChat , partialValidateGroupChat }