import { validateJoinGroup } from "../schemas/join.js";

class JoinController {

  constructor({ joinModel }) {
    this.joinModel = joinModel
  }

  joinGroup = async (req, res) => {
    const result = validateJoinGroup(req.body)

    if (!result.success) {
      return res.status(422).json({ error: result.error.issues });
    }

    const group_id = result.data.group_id

    try {
      const data = await this.joinModel.joinGroup({ user: req.user, group_id })
      res.json(data)
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }

  } 
}

export { JoinController } 