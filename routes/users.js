import { Router } from "express";
import { UserController } from "../controllers/user.js";

const CreateUsersRoute = ({ userModel }) => {
  const router = Router();
  const controller = new UserController({ userModel })

  router.get('/', controller.getAll);

  return router
}

export { CreateUsersRoute }