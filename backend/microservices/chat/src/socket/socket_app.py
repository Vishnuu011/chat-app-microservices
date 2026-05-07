import socketio
from src.config.config import settings

cors_allowed_origins = [settings.ALLOWED_ORIGINS] if settings.ALLOWED_ORIGINS else ["http://localhost:3000"]

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=cors_allowed_origins,
)

user_socket_map: dict[str, set[str]] = {}


def get_receiver_socket_id(user_id: str):
    return list(user_socket_map.get(user_id, []))


def is_user_in_room(sid: str, room: str) -> bool:
    try:
        rooms = sio.manager.rooms.get("/", {})
        return room in rooms and sid in rooms[room]
    except:
        return False


@sio.event
async def connect(sid, environ, auth):

    print("User connected:", sid)

    query = environ.get("QUERY_STRING", "")
    params = dict(q.split("=") for q in query.split("&") if "=" in q)

    user_id = params.get("userId")

    if user_id:

        if user_id not in user_socket_map:
            user_socket_map[user_id] = set()    

        user_socket_map[user_id].add(sid)

        await sio.enter_room(sid, user_id)

        print(f"User {user_id} mapped to socket {sid}")

        await sio.emit(
            "getOnlineUsers",
            list(user_socket_map.keys())
        )


@sio.event
async def joinChat(sid, chatId):

    await sio.enter_room(sid, chatId)

    print(f"{sid} joined chat {chatId}")


@sio.event
async def leaveChat(sid, chatId):

    await sio.leave_room(sid, chatId)

    print(f"{sid} left chat {chatId}")


@sio.event
async def typing(sid, data):

    chat_id = data.get("chatId")
    user_id = data.get("userId")

    await sio.emit(
        "userTyping",
        {
            "chatId": chat_id,
            "userId": user_id
        },
        room=chat_id,
        skip_sid=sid
    )


@sio.event
async def stopTyping(sid, data):

    chat_id = data.get("chatId")
    user_id = data.get("userId")

    await sio.emit(
        "userStoppedTyping",
        {
            "chatId": chat_id,
            "userId": user_id
        },
        room=chat_id,
        skip_sid=sid
    )


@sio.event
async def disconnect(sid):

    print("User disconnected:", sid)

    user_id = None

    for uid, socket_id in list(user_socket_map.items()):

        if socket_id == sid:
            user_id = uid
            break

    if user_id:

        user_socket_map[user_id].discard(sid)
        if not user_socket_map[user_id]:
            del user_socket_map[user_id]

        await sio.emit(
            "getOnlineUsers",
            list(user_socket_map.keys())
        )