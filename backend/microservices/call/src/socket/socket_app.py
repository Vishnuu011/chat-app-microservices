import socketio
from urllib.parse import parse_qs

allow_origins = ["http://localhost:3000"]

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
            print("❌ Connection rejected: no userId")
            return False

        user_socket_map[user_id] = sid

        print(f"✅ User connected {user_id} -> {sid}")
        print("Connected users:", user_socket_map)

    except Exception as e:
        print("❌ Connect error:", e)
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
                print(f"❌ User disconnected {uid}")
                break
    except Exception as e:
        print("❌ Disconnect error:", e)


# -----------------------------
# CALL USER (MAIN ENTRY)
# -----------------------------
@sio.event
async def callUser(sid, data):
    try:
        print("📞 FULL CALL DATA:", data)

        receiver_id = data.get("receiverId")
        caller_id = data.get("callerId")
        offer = data.get("offer")
        call_type = data.get("callType")

        if not caller_id:
            print("❌ callerId is None → FIX FRONTEND")
            return

        receiver_socket = get_receiver_socket_id(receiver_id)

        if not receiver_socket:
            print(f"❌ Receiver {receiver_id} not online")
            return

        # 🔥 STEP 1: Notify incoming call
        await sio.emit(
            "incomingCall",
            {
                "callerId": caller_id,
                "callType": call_type
            },
            to=receiver_socket
        )

        # 🔥 STEP 2: Send WebRTC offer
        await sio.emit(
            "callOffer",
            {
                "offer": offer,
                "callerId": caller_id,
                "receiverId": receiver_id,
                "callType": call_type
            },
            to=receiver_socket
        )

        print(f"✅ {caller_id} calling {receiver_id}")

    except Exception as e:
        print("❌ callUser error:", e)


# -----------------------------
# ANSWER CALL
# -----------------------------
@sio.event
async def answerCall(sid, data):
    try:
        caller_id = data.get("callerId")
        answer = data.get("answer")

        caller_socket = get_receiver_socket_id(caller_id)

        if caller_socket:
            await sio.emit(
                "callAnswer",
                {"answer": answer},
                to=caller_socket
            )
            print(f"✅ Answer sent to {caller_id}")

    except Exception as e:
        print("❌ answerCall error:", e)


# -----------------------------
# ICE CANDIDATE
# -----------------------------
@sio.event
async def iceCandidate(sid, data):
    try:
        target_user = data.get("targetUserId")
        candidate = data.get("candidate")

        socket_id = get_receiver_socket_id(target_user)

        if socket_id:
            await sio.emit(
                "iceCandidate",
                {"candidate": candidate},
                to=socket_id
            )

    except Exception as e:
        print("❌ iceCandidate error:", e)


# -----------------------------
# REJECT CALL
# -----------------------------
@sio.event
async def rejectCall(sid, data):

    caller_id = data.get("callerId")
    
    socket_id = get_receiver_socket_id(caller_id)

    if socket_id:
        await sio.emit("callRejected", {}, to=socket_id)


# -----------------------------
# END CALL
# -----------------------------
@sio.event
async def endCall(sid, data):

    target_user = data.get("targetUserId")

    socket_id = get_receiver_socket_id(target_user)

    if socket_id:
        await sio.emit("callEnded", {}, to=socket_id)