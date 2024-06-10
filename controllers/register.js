import { OAuth2Client } from "google-auth-library";
import { validateRegister } from "../schemas/register.js";
import dotenv from "dotenv";

dotenv.config();

const clientAuth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class RegisterController {
  constructor({ registerModel }) {
    this.registerModel = registerModel;
  }

  create = async (req, res) => {
    const nickname = req.body.nickname || req.body.username
    const avatar_id = req.body.avatar_id || 1
    const result = validateRegister({...req.body, nickname, avatar_id});

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }
  
    try {
      const data = await this.registerModel.create({
        id: crypto.randomUUID(),
        input: result.data,
      });

      res.status(201).json(data);
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  };

  createWithGoogle = async (req, res) => {
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
      username: payload.name,
      email: payload.email,
      nickname: payload.name,
      password: payload.sub,
      avatar_id: 1,
    };

    try {
      const data = await this.registerModel.create({
        id: crypto.randomUUID(),
        input: userData,
      });

      res.status(201).json(data);
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }


  };
}

export { RegisterController };
