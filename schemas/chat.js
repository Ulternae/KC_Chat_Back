import z from 'zod';

const createChatSchema = z.object({
  friend_id: z.string().uuid()
});

const messageChat = z.object({
  content: z.string()
});

const validateCreateChat = (object) => {
  return createChatSchema.safeParse(object);
}

const validateMessageChat = (object) => {
  return messageChat.safeParse(object);
}

export { validateCreateChat, validateMessageChat };
