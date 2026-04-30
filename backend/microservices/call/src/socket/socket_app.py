import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)

user_socket_map: dict[str, str] = {}


def get_receiver_socket_id(user_id: str):
    return user_socket_map.get(user_id)


@sio.event
async def connect(sid, environ, auth):

    query = environ.get("QUERY_STRING", "")
    params = dict(q.split("=") for q in query.split("&") if "=" in q)

    user_id = params.get("userId")

    if user_id:
        user_socket_map[user_id] = sid

    print("Connected:", sid)


@sio.event
async def disconnect(sid):

    for uid, socket_id in list(user_socket_map.items()):
        if socket_id == sid:
            del user_socket_map[uid]
            break

    print("Disconnected:", sid)


@sio.event
async def callUser(sid, data):

    receiver_id = data.get("receiverId")
    offer = data.get("offer")
    caller_id = data.get("callerId")

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


@sio.event
async def iceCandidate(sid, data):

    target_user = data.get("targetUserId")

    socket_id = get_receiver_socket_id(target_user)

    if socket_id:

        await sio.emit(
            "iceCandidate",
            {
                "candidate": data.get("candidate")
            },
            room=socket_id
        )


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