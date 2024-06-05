import { Router } from "express";
import { FriendController } from "../controllers/friends.js";
import { authToken } from "../middlewares/authToken.js";

const CreateFriendsRoute = ({ friendModel }) => {
  const router = Router()
  const controller = new FriendController({ friendModel })

  router.post('/', authToken, controller.createRequest)
  router.get('/', authToken, controller.getAll)
  router.put('/:friend_id/:status', authToken, controller.updateStatus)
  router.delete('/:friend_id', authToken, controller.delete)

  return router
}

export { CreateFriendsRoute }