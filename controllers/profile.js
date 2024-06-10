import { partialValidateUser } from "../schemas/user.js";

class ProfileController {

  constructor({ profileModel }) {
    this.profileModel = profileModel
  }
  get = async (req, res) => {
    try {
      const data = await this.profileModel.get({ user : req.user })
      res.json(data)
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  }
  update = async (req, res) => {
    const result = partialValidateUser(req.body)

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message)})
    }

    try {
      const data = await this.profileModel.update({ user : req.user, input: result.data})
      res.json(data)
    } catch (error) {
      res
      .status(error.status || 500)
      .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
    
  }
}

export { ProfileController }