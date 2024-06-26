import { Router } from "express";
import { JoinController } from "../controllers/join.js";
import { authToken } from "../middlewares/authToken.js";

const CreateJoinRoute = ({ joinModel }) => {
  const router = Router()
  const controller = new JoinController({ joinModel })

  router.post('/group', authToken, controller.joinGroup)

  return router
}

export { CreateJoinRoute }