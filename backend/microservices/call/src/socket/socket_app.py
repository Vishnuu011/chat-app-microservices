import socketio
from urllib.parse import parse_qs

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["https://chat-app-frontend-deploy-ten.vercel.app"]
)

# userId -> socketId
user_socket_map: dict[str, str] = {}


def get_receiver_socket_id(user_id: str):
    return user_socket_map.get(user_id)



@sio.event
async def connect(sid, environ, auth):
    try:
        query_string = environ.get("QUERY_STRING", "")
        params = parse_qs(query_string)
        user_id = params.get("userId", [None])[0]

        if not user_id:
            print("❌ Connection rejected: no userId")
            return False

        # Clean up any old socket for this user
        old_sid = user_socket_map.get(user_id)
        if old_sid and old_sid != sid:
            print(f"⚠️ Replacing old socket for {user_id}: {old_sid} → {sid}")

        user_socket_map[user_id] = sid
        print(f"✅ User connected {user_id} -> {sid}")

    except Exception as e:
        print("❌ Connect error:", e)
        return False



@sio.event
async def disconnect(sid):
    try:
        for uid, socket_id in list(
            user_socket_map.items()
        ):
            if socket_id == sid:
                del user_socket_map[uid]
                print(
                    f"❌ User disconnected {uid}"
                )
                break
    except Exception as e:
        print("❌ Disconnect error:", e)



@sio.event
async def acceptCall(sid, data):

    try:
        caller_id = data.get("callerId")

        call_id = data.get("callId")
        

        caller_socket = get_receiver_socket_id(
            caller_id
        )

        if caller_socket:
            await sio.emit(
                "callAccepted",
                {
                    "callId": call_id
                },
                to=caller_socket
            )

    except Exception as e:
        print("❌ acceptCall error:", e)



@sio.event
async def rejectCall(sid, data):
    try:
        caller_id = data.get("callerId")
        call_id = data.get("callId")

        socket_id = get_receiver_socket_id(
            caller_id
        )

        if socket_id:
            await sio.emit(
                "callRejected",
                {"callId": call_id},
                to=socket_id
            )
            print(
                f"✅ Rejection sent to {caller_id}"
            )

    except Exception as e:
        print("❌ rejectCall error:", e)



@sio.event
async def endCall(sid, data):
    try:
        target_user = data.get(
            "targetUserId"
        )
        call_id = data.get(
            "callId"
        )

        if not target_user:
            return

        socket_id = get_receiver_socket_id(
            target_user
        )

        if socket_id:
            await sio.emit(
                "callEnded",
                {"callId": call_id},
                to=socket_id
            )

    except Exception as e:
        print("❌ endCall error:", e)