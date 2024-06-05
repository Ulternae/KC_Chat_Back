import { Router } from "express";
import { GroupController } from "../controllers/groups.js";
import { authToken } from "../middlewares/authToken.js";

const CreateGroupRoute = ({ groupModel }) => {
  const router = Router();
  const controller = new GroupController({ groupModel })

  router.post('/', authToken, controller.createGroup);
  router.get('/', authToken, controller.getAllGroups);
  router.get('/:group_id', authToken, controller.getGroupById);
  router.patch('/:group_id', authToken, controller.updateGroup);
  router.delete('/:group_id', authToken, controller.deleteGroup);
  
  router.post('/:group_id/members', authToken, controller.addMembers);
  router.delete('/:group_id/members/all', authToken, controller.deleteAllMembers);
  router.delete('/:group_id/members/:member_id', authToken, controller.deleteMember);
  
  router.post('/:group_id/moderators', authToken, controller.assigmentModerators);
  router.delete('/:group_id/moderators/all', authToken, controller.deleteAllModerators);
  router.delete('/:group_id/moderators/:moderator_id', authToken, controller.deleteModerator);

  return router
}

export { CreateGroupRoute }