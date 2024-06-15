import { Router } from "express";
import { ProfileController } from "../controllers/profile.js";
import { authToken } from "../middlewares/authToken.js";

const CreateProfileRoute = ({ profileModel }) => {
  const router = Router();
  const controller = new ProfileController({ profileModel })

  router.get('/', authToken, controller.get);
  router.patch('/', authToken, controller.update )

  return router
}

export { CreateProfileRoute }