import z from "zod";

const sendMessageSchema = z.object({
  room: z.string().uuid(),
  content: z.string(),
  type: z.enum(["markdown", "text", "img"]),
});

const validateSendMessage = (object) => {
  return sendMessageSchema.safeParse(object)
}

export { validateSendMessage }