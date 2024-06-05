import { Router } from "express";
import { LoginController } from "../controllers/login.js";

const CreateLoginRoute = ({ loginModel }) => {
  const router = Router()
  const controller = new LoginController({ loginModel })

  router.post('/', controller.login)

  return router
}

export { CreateLoginRoute }