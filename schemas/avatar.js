import z from "zod"

const getAvatarIdSchema = z.object({
  avatar_id : z.string()
})

const createAvatarSchema = z.object({
  url: z.string().url()
})

const validateGetAvatarId = (object) => {
  return getAvatarIdSchema.safeParse(object)
}

const validateCreateAvatar = (object) => {
  return createAvatarSchema.safeParse(object)
}

export { validateCreateAvatar, validateGetAvatarId }