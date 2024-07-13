import { createApp } from "./app.js";

import { GroupModel } from "./models/sqlite/group.js";
import { ChatModel } from "./models/sqlite/chat.js";
import { UserModel } from "./models/sqlite/user.js";
import { AvatarModel } from "./models/sqlite/avatar.js";
import { ProfileModel } from "./models/sqlite/profile.js";
import { RegisterModel } from "./models/sqlite/register.js";
import { LoginModel } from "./models/sqlite/login.js";
import { FriendModel } from "./models/sqlite/friend.js";
import { GroupChatModel } from "./models/sqlite/groupChat.js";
import { JoinModel } from "./models/sqlite/join.js";
import { SettingsModel } from "./models/sqlite/settings.js";
import { MessageModel } from "./sockets/models/message.js";
import { RoomModel } from "./sockets/models/room.js";

const modelExpress = {
  groupModel: GroupModel,
  loginModel: LoginModel,
  registerModel: RegisterModel,
  profileModel: ProfileModel,
  avatarModel: AvatarModel,
  userModel: UserModel,
  chatModel: ChatModel,
  friendModel: FriendModel,
  groupChatModel: GroupChatModel,
  joinModel: JoinModel,
  settingsModel: SettingsModel,
};

const modelSockets = {
  messageModel: MessageModel,
  roomModel: RoomModel
}
createApp({ modelExpress , modelSockets});
