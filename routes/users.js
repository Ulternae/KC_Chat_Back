import { Router } from "express";
import { UserController } from "../controllers/user.js";
import { authToken } from "../middlewares/authToken.js";

const CreateUsersRoute = ({ userModel }) => {
  const router = Router();
  const controller = new UserController({ userModel })

  router.get('/', controller.getAll);
  router.post('/validate', authToken , controller.validatePasswordUser);
  router.post('/validate/google', authToken, controller.validatePasswordUserGoogle)

  return router
}

export { CreateUsersRoute }