import { Router } from "express";
import { AvatarController } from "../controllers/avatar.js";
import { authToken } from "../middlewares/authToken.js";

const CreateAvatarsRoute = ({ avatarModel }) => {
  const router = Router();
  const controller = new AvatarController({ avatarModel })

  router.get('/', authToken, controller.getAll);
  router.get('/:avatar_id', authToken, controller.getById )
  router.post('/', authToken, controller.create)

  return router
}

export { CreateAvatarsRoute }