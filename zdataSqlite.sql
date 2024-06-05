-- Tabla de avatares
CREATE TABLE avatars (
    avatar_id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT
);

-- Tabla de usuarios
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,  -- UUID como texto
    avatar_id INTEGER,
    nickname TEXT UNIQUE,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT,
    FOREIGN KEY (avatar_id) REFERENCES avatars(avatar_id)
);

-- Tabla de amigos (usuarios)
CREATE TABLE friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    friend_id TEXT,
    status TEXT,  -- pending, accepted, blocked
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (friend_id) REFERENCES users(user_id)
);

-- Tabla de chats
CREATE TABLE chats (
    chat_id TEXT PRIMARY KEY,  -- UUID como texto
    name TEXT, -- opcional, si tienes nombres de chat
    is_group BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios pertenecientes al chat
CREATE TABLE chat_users (
    chat_id INTEGER,
    user_id TEXT,
    PRIMARY KEY (chat_id, user_id),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Tabla de mensajes
CREATE TABLE messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    sender_id TEXT,
    content TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
);

-- Tabla de grupos
CREATE TABLE groups (
    group_id TEXT PRIMARY KEY,  -- UUID como texto
    name TEXT,
    description TEXT,
    is_public BOOLEAN,
    creator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id)
);


-- Tabla de miembros de grupo
CREATE TABLE group_members (
    group_id INTEGER,
    user_id TEXT,
    is_moderator BOOLEAN,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(group_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Tabla intermedia para conectar grupos con chats
CREATE TABLE group_chats (
    group_id TEXT,
    chat_id TEXT,
    PRIMARY KEY (group_id, chat_id),
    FOREIGN KEY (group_id) REFERENCES groups(group_id),
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id)
);
