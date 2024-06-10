import z from "zod";

const loginSchema = z.object({
  username: z.string() ,
  email: z.string().email(),
  password: z.string()
});

const validateLogin = (object) => {
  return loginSchema.safeParse(object);
};

export { validateLogin };
