import dotenv from 'dotenv'
import { validateGetAvatarId, validateCreateAvatar } from '../schemas/avatar.js'

dotenv.config()

class AvatarController {

  constructor({ avatarModel }) {
    this.avatarModel = avatarModel
  }
  getAll = async (req, res) => {
    try {
      const data = await this.avatarModel.getAll()
      res.json(data)
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  }

  getById = async (req, res) => {

    const result = validateGetAvatarId(req.params)

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.avatarModel.getById({ id: result.data.avatar_id })
      res.json(data)
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    } 
  }

  create = async (req, res) => {

    const result = validateCreateAvatar(req.body)

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }
    
    try {
      const data = await this.avatarModel.create({user: req.user, input: result.data})
      res.json(data)
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  }
}

export { AvatarController }