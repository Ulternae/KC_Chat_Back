import z from 'zod'

const validColors = ["crimson" , "emerald" , "amber" , "sapphire" , "orchid"]

const groupSchema = z.object({
  name: z.string(),
  description: z.string(),
  is_public: z.boolean().default(false),
  category: z.string(),
  color: z.string().transform((val) => validColors.includes(val) ? val : "crimson").default("crimson"),
  avatar_id: z.number().default(1),
  group_id: z.string()
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