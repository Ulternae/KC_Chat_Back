import z from "zod"

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long") ,
  password: z.string(),
  email: z.string().email() ,
  nickname: z.string() ,
  avatar_id: z.number()
})

const partialValidateUser = (object) => {
  return userSchema.partial().safeParse(object)
}

export { partialValidateUser , userSchema}