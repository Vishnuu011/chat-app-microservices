import socketio
from urllib.parse import parse_qs


allow_origins=["http://localhost:3000"]
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=allow_origins
)

# userId -> socketId
user_socket_map: dict[str, str] = {}


def get_receiver_socket_id(user_id: str):
    return user_socket_map.get(user_id)


# -----------------------------
# CONNECT
# -----------------------------
@sio.event
async def connect(sid, environ, auth):

    try:
        query_string = environ.get("QUERY_STRING", "")
        params = parse_qs(query_string)

        user_id = params.get("userId", [None])[0]

        if not user_id:
            print("Connection rejected: no userId")
            return False

        user_socket_map[user_id] = sid

        print(f"User connected {user_id} -> {sid}")

    except Exception as e:
        print("Connect error:", e)
        return False


# -----------------------------
# DISCONNECT
# -----------------------------
@sio.event
async def disconnect(sid):

    try:
        for uid, socket_id in list(user_socket_map.items()):
            if socket_id == sid:
                del user_socket_map[uid]
                print(f"User disconnected {uid}")
                break

    except Exception as e:
        print("Disconnect error:", e)


# -----------------------------
# CALL USER
# -----------------------------
@sio.event
async def callUser(sid, data):

    receiver_id = data.get("receiverId")

    caller_id = data.get("callerId")
    offer = data.get("offer")

    receiver_socket = get_receiver_socket_id(receiver_id)

    if receiver_socket:

        await sio.emit(
            "callOffer",
            {
                "offer": offer,
                "callerId": caller_id
            },
            room=receiver_socket
        )

        print(f"{caller_id} calling {receiver_id}")

    else:
        print("Receiver not online")


# -----------------------------
# ANSWER CALL
# -----------------------------
@sio.event
async def answerCall(sid, data):

    caller_id = data.get("callerId")
    answer = data.get("answer")

    caller_socket = get_receiver_socket_id(caller_id)

    if caller_socket:

        await sio.emit(
            "callAnswer",
            {
                "answer": answer
            },
            room=caller_socket
        )


# -----------------------------
# ICE CANDIDATE
# -----------------------------
@sio.event
async def iceCandidate(sid, data):

    target_user = data.get("targetUserId")
    candidate = data.get("candidate")

    socket_id = get_receiver_socket_id(target_user)

    if socket_id:

        await sio.emit(
            "iceCandidate",
            {
                "candidate": candidate
            },
            room=socket_id
        )


# -----------------------------
# REJECT CALL
# -----------------------------
@sio.event
async def rejectCall(sid, data):

    caller_id = data.get("callerId")

    socket_id = get_receiver_socket_id(caller_id)

    if socket_id:

        await sio.emit(
            "callRejected",
            {},
            room=socket_id
        )


# -----------------------------
# END CALL
# -----------------------------
@sio.event
async def endCall(sid, data):

    target_user = data.get("targetUserId")

    socket_id = get_receiver_socket_id(target_user)

    if socket_id:

        await sio.emit(
            "callEnded",
            {},
            room=socket_id
        )