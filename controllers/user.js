class UserController {

  constructor({ userModel }) {
    this.userModel = userModel
  }
  getAll = async (req, res) => {
    const nickname = req.query.nickname

    try {
      const data = await this.userModel.getAll({ nickname })
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

export { UserController } 