import z from "zod"

const joinGroupSchema = z.object({
  group_id : z.string()
})

const validateJoinGroup = (object) => {
  return joinGroupSchema.safeParse(object)
}

export { validateJoinGroup }