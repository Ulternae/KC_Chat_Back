import z from 'zod'

const groupSchema = z.object({
  name: z.string(),
  description: z.string(),
  is_public: z.boolean().default(false),
})

const groupMembersSchema  = z.object({
  users_ids: z.array(z.string())
})

const validateGroup = (object) => {
  return groupSchema.safeParse(object)
}

const validateGroupUsersSchema = (object) => {
  return groupMembersSchema.safeParse(object)
}

const partialValidateGroup = (object) => {
  return groupSchema.partial().safeParse(object)
}

export { validateGroup, partialValidateGroup, validateGroupUsersSchema }