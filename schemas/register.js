import { userSchema } from "./user.js";

const registerSchema = userSchema

const validateRegister = (object) => {
  return registerSchema.safeParse(object)
}

export { validateRegister }