import { Router } from "express";
import { RegisterController } from "../controllers/register.js";

const CreateRegisterRoute = ({ registerModel }) => {
  const router = Router()
  const controller = new RegisterController({ registerModel })

  router.post('/', controller.create)
  router.post('/google', controller.createWithGoogle)

  return router
}

export { CreateRegisterRoute }