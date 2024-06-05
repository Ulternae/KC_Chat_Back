import express from "express";
import dotenv from "dotenv";

import { CreateGroupRoute } from "./routes/groups.js";
import { CreateLoginRoute } from "./routes/login.js";
import { CreateRegisterRoute } from "./routes/register.js";
import { CreateChatsRoute } from "./routes/chats.js";
import { CreateUsersRoute } from "./routes/users.js";
import { CreateAvatarsRoute } from "./routes/avatar.js";
import { CreateProfileRoute } from "./routes/profile.js";
import { corsMiddleware } from "./middlewares/cors.js";
import { CreateFriendsRoute } from "./routes/friends.js";
import { CreateGroupChatRouter } from "./routes/groupChats.js";
import { CreateJoinRouter } from "./routes/join.js";

dotenv.config();

const createApp = ({
  groupModel,
  loginModel,
  registerModel,
  profileModel,
  avatarModel,
  userModel,
  chatModel,
  friendModel,
  groupChatModel,
  joinModel
}) => {
  const PORT = process.env.PORT ?? 3001;
  const acceptedOrigins = process.env.ACCEPTED_ORIGINS.split(",");
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(corsMiddleware({ acceptedOrigins }));

  app.use("/register", CreateRegisterRoute({ registerModel })); /////////
  app.use("/login", CreateLoginRoute({ loginModel })); //////////////////
  app.use("/profile", CreateProfileRoute({ profileModel })); ////////////
  app.use("/avatars", CreateAvatarsRoute({ avatarModel })); /////////////
  app.use("/friends", CreateFriendsRoute({ friendModel })); /////////////
  app.use("/chats", CreateChatsRoute({ chatModel })); ///////////////////
  app.use("/groups", CreateGroupRoute({ groupModel })); /////////////////
  app.use("/groups", CreateGroupChatRouter({ groupChatModel })) /////////
  app.use("/users", CreateUsersRoute({ userModel })); ///////////////////
  
  app.use("/join", CreateJoinRouter({ joinModel }))

  app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
  });
};

export { createApp };
