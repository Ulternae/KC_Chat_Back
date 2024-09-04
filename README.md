
# Bienvenido a KC Chat Real Time -- Backend

El backend de KC Chat Real Time está diseñado para ser robusto y confiable, capaz de manejar fallos, gestionar datos faltantes y controlar el acceso basado en permisos de usuario. Esta aplicación de chat incluye funcionalidades avanzadas como perfiles de usuario, autenticación, gestión de grupos, roles de moderador, mensajes en tiempo real, notificaciones y más. La arquitectura sigue el patrón MVC (Model-View-Controller) y BFF (Backend for Frontend), con APIs especializadas para cada funcionalidad, asegurando un rendimiento óptimo y una experiencia de usuario fluida.

## Características

- **Autenticación segura :** Se implemento autenticación con `bcryptjs` para encriptar las contraseñas y `jsonwebtoken` para la generación de tokens JWT con una duración de 24 horas, garantizando un manejo seguro de sesiones y permisos.
- **Autenticación con Google :** Integracion con Google OAuth utilizando `google-auth-library` para permitir a los usuarios registrarse e iniciar sesión a través de sus cuentas de Google.
-  **Gestión de Usuarios y Perfiles**: Soporte para la creación, actualización y eliminación de perfiles de usuario, con almacenamiento seguro de datos sensibles.
- **Chats en Tiempo Real**: Comunicación en tiempo real utilizando `socket.io` para la transmisión de mensajes en chats individuales y grupales.
- **Gestión de Grupos**: Soporte para la creación, administración y eliminación de grupos, con roles de moderador y control sobre los miembros del grupo.
- **Notificaciones en Tiempo Real**: Sistema de notificaciones en tiempo real que permite a los usuarios ver inmediatamente las actualizaciones, como nuevos amigos agregados, sin necesidad de recargar la página.
-   **Manejo de Avatares**: Opciones para que los usuarios seleccionen, personalicen y gestionen sus avatares.
- **Validación de Datos**: Uso de `zod` para la validación de datos entrantes en las solicitudes, asegurando que las entradas cumplan con los requisitos esperados y evitar ataques de SQL injection
- **Configuración y Personalización del Usuario**: Opciones para que los usuarios ajusten sus preferencias personales dentro de la aplicación, como el idioma o el tema.

## Tecnologías Usadas

-   Node.js
-   Express.js
-   Turso (SQLite)
-   Socket.io
-   bcryptjs
-   jsonwebtoken
-   Google OAuth
-   Zod

## Cómo iniciar el proyecto

1.  **Clona el repositorio :** `git clone https://github.com/Ulternae/KC_Chat_Back.git`
    
2.  **Instala las dependencias:** `npm i`
    
3.  **Crear Database:** Configura la base de datos utilizando el archivo `./zdataSqlite.sql`, que contiene toda la estructura, conexiones e información base necesaria para el proyecto

4. **Crear cuenta en la consola de Cloud** Crea una cuenta en Google Cloud y genera un _ID de cliente para Aplicación web_ para habilitar el acceso a los servicios de Google OAuth y permitir la autenticación de usuarios mediante Google.

6. **Configurar las variables de entorno**

    PORT=3000<br>
    ACCEPTED_ORIGINS=http://localhost:3000,http://tuap...<br>
    SECRET_KEY=tuClaveSecretaParaJWT<br>
    TURSO_DATABASE_URL=libsql://tursoDatabaseURL<br>
    TURSO_AUTH_TOKEN=tuTursoAuthToken<br>
    USERS_ADMIN='[{"nickname":"User1","id":"882a..."},{"nickname":"User2","id":"270q..."}]'<br>
    GOOGLE_CLIENT_ID=tuGoogleClientID<br>
    GOOGLE_SECRET_CLIENT=tuGoogleSecretClient<br>

-   `PORT`: Puerto en el que correrá el servidor.
-   `ACCEPTED_ORIGINS`: Orígenes permitidos para la aplicación, separados por comas.
-   `SECRET_KEY`: Clave secreta para la encriptación de tokens JWT.
-   `TURSO_DATABASE_URL`: URL de la base de datos Turso (SQLite).
-   `TURSO_AUTH_TOKEN`: Token de autenticación para acceder a la base de datos.
-   `USERS_ADMIN`: Lista de administradores con permisos especiales, como la creación de avatares.
-   `GOOGLE_CLIENT_ID`: ID de cliente de Google para OAuth.
-   `GOOGLE_SECRET_CLIENT`: Clave secreta del cliente de Google.

6. **Ejecutar el proyecto** `npm run dev`
    
## Estructura del Proyecto

-   **controllers/**: Contiene la lógica de controladores para las diferentes rutas de la aplicación.
-   **middlewares/**: Incluye middlewares personalizados, como la autenticación de sockets y tokens.
-   **models/**: Define la estructura de datos y la lógica de acceso a la base de datos. Está dividido en `sqlite` para los modelos relacionados con SQLite, facilitando la transición a otro sistema de base de datos si es necesario.
-   **routes/**: Define las rutas de la API, organizadas por recurso.
-   **schemas/**: Contiene los esquemas de validación y estructura de datos para las distintas solicitudes a las APIs.
-   **sockets/**: Organiza la lógica relacionada con los eventos de WebSocket.
    -   **controllers/**: Controladores específicos para los eventos de WebSocket.
    -   **events/**: Maneja los eventos de WebSocket como conexión, mensajes, notificaciones y desconexiones.
    -   **models/**: Define la estructura de datos y la lógica de acceso a la base de datos en el contexto de los eventos de WebSocket.
	-   **middlewares/**: Middleware específico para WebSocket, como la autenticación en tiempo real.    
	-   **schemas/**: Contiene los esquemas de validación y la estructura de datos para las solicitudes realizadas a través de WebSocket.
-   **utils/**: Incluye utilidades y herramientas que son usadas en diferentes partes del proyecto, como encriptación de contraseñas, generación de tokens entre otros

## Rutas API

### Registro de Usuarios (REGISTER)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/register** | Crear Cuenta
-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/register/google** | Crear Cuenta con Google

### Autenticación de Usuarios (LOGIN)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/login** | Ingresar a tu cuenta
-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/login/google** | Ingresar a la cuenta con autenticación de Google

### Perfil de Usuario (PROFILE)

-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/profile** | Obtener Perfil
-   **PATCH &nbsp;&nbsp;&nbsp;/profile** | Actualizar Perfil
-   **DELETE &nbsp;&nbsp;/profile** | Eliminar Perfil

### Gestión de Avatares (AVATARS)

-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/avatars** | Obtener todos los avatares
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/avatars/:avatar_id** | Obtener un único avatar
-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/avatars** | Agregar nuevos avatares (Acción restringida a administradores)

### Gestión de Amigos (FRIENDS)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/friends** | Crear solicitud de amistad
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/friends** | Obtener todas las solicitudes (rechazadas, aceptadas y pendientes)
-   **PUT &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/friends/:friend_id/status** | Actualizar el estatus de la solicitud, si es aceptada se crea un chat
-   **DELETE &nbsp;&nbsp;/friends/:friend_id** | Eliminar amigo y el chat generado

### Gestión de Chats (CHATS)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/chats** | Crear chat, individual o grupal
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/chats** | Obtener todos los chats del usuario, divididos en individuales y grupales
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/chats/:chat_id** | Obtener la información de un chat
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/chats/:chat_id/messages** | Obtener los mensajes de un chat
-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/chats/:chat_id/messages** | Enviar mensajes en un chat

### Gestión de Grupos (GROUPS)

### Grupos

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups** | Crear grupo
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups** | Obtener todos los grupos
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups/:group_id** | Obtener detalles de un grupo
-   **PATCH &nbsp;&nbsp;&nbsp;/groups/:group_id** | Actualizar grupo
-   **DELETE &nbsp;&nbsp;/groups/:group_id**  | Eliminar grupo

### Miembros del Grupo (GROUPS MEMBERS)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups/:group_id/members** | Agregar miembros al grupo
-   **DELETE &nbsp;&nbsp;/groups/:group_id/members/all** | Eliminar todos los miembros
-   **DELETE &nbsp;&nbsp;/groups/:group_id/members/:member_id**  | Eliminar miembro

### Moderadores del Grupo (GROUPS MODERATORS)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups/:group_id/moderators** | Asignar moderador al grupo
-   **DELETE &nbsp;&nbsp;/groups/:group_id/moderators/all** | Eliminar todos los moderadores
-   **DELETE &nbsp;&nbsp;/groups/:group_id/moderators/:moderator_id** | Eliminar un moderador

### Chats del Grupo (GROUPS CHATS)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups/:group_id/chats** | Crear chat en grupo
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups/:group_id/chats** | Obtener todos los chats del grupo
-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/groups/:group_id/chats/:chat_id** | Obtener detalles de un chat del grupo
-   **PATCH &nbsp;&nbsp;&nbsp;/groups/:group_id/chats/:chat_id** | Actualizar un chat del grupo
-   **DELETE &nbsp;&nbsp;/groups/:group_id/chats/:chat_id** | Eliminar un chat del grupo

### Gestión de Usuarios (USERS)

-   **GET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/users** | Obtener todos los usuarios
-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/users/validate** | Validar información personal del usuario con contraseña
-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/users/validate/google** | Validar información personal del usuario con Google

### Unirse a Grupos Públicos (JOIN)

-   **POST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/join/group** | Unirse a un grupo público

### Configuraciones de Usuario (SETTINGS)

-   **PATCH &nbsp;&nbsp;&nbsp;/settings** | Actualizar configuraciones del usuario

----------

## Sockets

### Envío y Recepción de Mensajes

-   **sendMessage** &nbsp;&nbsp;&nbsp;| Enviar mensajes a un chat o room específico
-   **joinRoom** &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;&nbsp;| Unirse a un chat y recibir mensajes en tiempo real
-   **listenerUser**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Conectar al usuario para recibir notificaciones en tiempo real

### Manejo de Conexiones

-   **sendMessage** &nbsp;&nbsp;&nbsp;| Enviar mensajes a un chat o room específico
-   **disconnect** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Maneja la desconexión de un usuario de los sockets

### Notificaciones

-   **sendMessage** &nbsp;&nbsp; | Enviar mensajes a un chat o room específico
-   **notification** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Enviar notificaciones en tiempo real a un usuario o grupo de usuarios


## Vista General de una Solicitud y respuesta de la API

![image](https://github.com/user-attachments/assets/78af16d0-f937-4d05-9707-d692467771b6)

