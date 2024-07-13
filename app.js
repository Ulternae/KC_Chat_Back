import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";

import { CreateGroupRoute } from "./routes/groups.js";
import { CreateLoginRoute } from "./routes/login.js";
import { CreateRegisterRoute } from "./routes/register.js";
import { CreateChatsRoute } from "./routes/chats.js";
import { CreateUsersRoute } from "./routes/users.js";
import { CreateAvatarsRoute } from "./routes/avatar.js";
import { CreateProfileRoute } from "./routes/profile.js";
import { CreateFriendsRoute } from "./routes/friends.js";
import { CreateGroupChatRoute } from "./routes/groupChats.js";
import { CreateJoinRoute } from "./routes/join.js";
import { CreateSettingsRoute } from "./routes/settings.js";
import { authenticateSocket } from "./middlewares/authenticateSocket.js"; // Importar el middleware de autenticación
import { authTokenSockets } from "./sockets/middlewares/authToken.js";
import { EventMessage } from "./sockets/events/message.js";
import { EventRoom } from "./sockets/events/room.js";
import { EventDisconnect } from "./sockets/events/disconnect.js";
import { EventListenerUser } from "./sockets/events/user.js";
import { EventNotification } from "./sockets/events/notification.js";

dotenv.config();

const createApp = ({ modelExpress, modelSockets }) => {
  const PORT = process.env.PORT ?? 3001;
  const acceptedOrigins = process.env.ACCEPTED_ORIGINS.split(",");
  const app = express();
  const server = http.createServer(app);

  app.use(cors());
  app.disable("x-powered-by");
  app.use(express.json());

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const {
    registerModel,
    loginModel,
    profileModel,
    avatarModel,
    friendModel,
    chatModel,
    groupModel,
    groupChatModel,
    userModel,
    joinModel,
    settingsModel,
  } = modelExpress;

  const { messageModel, roomModel, loadMessagesModel } = modelSockets

  app.use("/register", CreateRegisterRoute({ registerModel }));
  app.use("/login", CreateLoginRoute({ loginModel }));
  app.use("/profile", CreateProfileRoute({ profileModel }));
  app.use("/avatars", CreateAvatarsRoute({ avatarModel }));
  app.use("/friends", CreateFriendsRoute({ friendModel }));
  app.use("/chats", CreateChatsRoute({ chatModel }));
  app.use("/groups", CreateGroupRoute({ groupModel }));
  app.use("/groups", CreateGroupChatRoute({ groupChatModel }));
  app.use("/users", CreateUsersRoute({ userModel }));
  app.use("/join", CreateJoinRoute({ joinModel }));
  app.use("/settings", CreateSettingsRoute({ settingsModel }));

  io.use(authTokenSockets);

  io.on("connection", (socket) => {
    console.log(`Client connected : ${socket.user.nickname} `);

    EventMessage({ socket, io, messageModel });
    EventRoom({ socket, io, roomModel });
    EventDisconnect({ socket })
    EventListenerUser({ socket, io })
    EventNotification({ socket, io })
  });

  server.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
  });
};

export { createApp };
