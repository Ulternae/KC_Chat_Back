import { validateUserPassword } from "../schemas/user.js"
import { OAuth2Client } from "google-auth-library";

const clientAuth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  validatePasswordUser = async (req, res) => {
    const result = validateUserPassword(req.body)

    if (!result.success) {
      return res.status(422).json({ error: JSON.parse(result.error.message) });
    }

    try {
      const data = await this.userModel.validatePasswordUser({ user: req.user, password: result.data.password });
      res.json(data);
    } catch (error) {
      res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  }

  validatePasswordUserGoogle = async (req, res) => {
    const { token } = req.body;
  
    if (!token) {
      return res.status(422).json({ error: 'You need a token Id for create account' });
    }
  
    let ticket;
  
    try {
      ticket = await clientAuth.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      return res.status(422).json({ error: 'The token for google is invalid, try new', type: 'invalidTokenGoogle' });
    }
  
    const payload = ticket.getPayload();
    const idUserGoogle = payload.sub;
  
    const userData = {
      username: payload.name,
      email: payload.email,
      nickname: payload.name,
    };
  
    try {
      const data = await this.userModel.validatePasswordUserGoogle({ user: req.user, idUserGoogle, userData });
      return res.json(data); // Enviar respuesta sólo aquí si la validación es exitosa
    } catch (error) {
      return res.status(error.status).json({
        error: error.error,
        type: error.type,
        field: error.field,
        details: error.details,
      });
    }
  
  }
}

export { UserController } 