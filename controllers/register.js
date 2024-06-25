import { OAuth2Client } from "google-auth-library";
import { validateRegister } from "../schemas/register.js";
import dotenv from "dotenv";
import { validateSettings } from "../schemas/settings.js";

dotenv.config();

const clientAuth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class RegisterController {
  constructor({ registerModel }) {
    this.registerModel = registerModel;
  }

  create = async (req, res) => {
    const username = req.body.username || req.body.nickname
    const avatar_id = req.body.avatar_id || 1
    const result = validateRegister({...req.body, username, avatar_id});
    const resultSettings = validateSettings({ ...req.body.settings})
    if (!result.success || !resultSettings.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }
  
    try {
      const data = await this.registerModel.create({
        id: crypto.randomUUID(),
        input: result.data,
        settings: resultSettings.data
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
    const resultSettings = validateSettings({ ...req.body.settings})

    if (!resultSettings.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }
  
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
      const data = await this.registerModel.createWithGoogle({
        id: payload.sub,
        input: userData,
        settings: resultSettings.data
      });

      res.status(201).json(data);
    } catch (error) {
      console.log(error)
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
