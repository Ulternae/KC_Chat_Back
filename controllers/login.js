import { validateLogin } from "../schemas/login.js";

class LoginController {
  constructor({ loginModel }) {
    this.loginModel = loginModel;
  }

  login = async (req, res) => {
    const result = validateLogin(req.body);

    if (!result.success) {
      res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.loginModel.login({
        input: result.data,
      });
      res.status(200).json(data);
    } catch (error) {
      res
        .status(error.status)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details});
    }
  };
}

export { LoginController };
