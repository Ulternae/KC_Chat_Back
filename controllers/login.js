import { OAuth2Client } from "google-auth-library";
import { validateLogin } from "../schemas/login.js";
import dotenv from "dotenv";

dotenv.config();

const clientAuth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class LoginController {
  constructor({ loginModel }) {
    this.loginModel = loginModel;
  }

  login = async (req, res) => {
    const result = validateLogin(req.body);
    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.loginModel.login({
        input: result.data,
      });
      res.status(200).json(data);
    } catch (error) {
      res
        .status(error.status)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details, dataUser: error.dataUser});
    }
  };

  loginWithGoogle = async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(422).json({ error: 'You need a token Id for create account' });
    }

    const ticket = await clientAuth.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const userData = {
      nickname: payload.name,
      email: payload.email,
      password: payload.sub
    }

    try {
      const data = await this.loginModel.login({
        input: {...userData}
      });
      res.status(200).json(data);
    } catch (error) {
      return res
        .status(error.status)
        .json({ error: error.error, type: error.type, field: error.field, details: error.details, dataUser: error.dataUser});
    }
  }
}

export { LoginController };
