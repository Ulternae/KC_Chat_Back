import z, { object } from "zod"

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long") ,
  password: z.string(),
  email: z.string().email() ,
  nickname: z.string() ,
  avatar_id: z.number()
})

const userPasswordSchema = z.object({
  password: z.string()
})

const partialValidateUser = (object) => {
  return userSchema.partial().safeParse(object)
}

const validateUserPassword = (object) => {
  return userPasswordSchema.safeParse(object)
}

export { partialValidateUser , userSchema, validateUserPassword}