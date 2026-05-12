import socketio
from urllib.parse import parse_qs

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["https://test-frontent-eight.vercel.app"]
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

        # Clean up any old socket for this user
        old_sid = user_socket_map.get(user_id)
        if old_sid and old_sid != sid:
            print(f"⚠️ Replacing old socket for {user_id}: {old_sid} → {sid}")

        user_socket_map[user_id] = sid
        print(f"✅ User connected {user_id} -> {sid}")

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
# CALL USER — single merged event
# -----------------------------
@sio.event
async def callUser(sid, data):
    try:
        receiver_id = data.get("receiverId")
        caller_id = data.get("callerId")
        offer = data.get("offer")
        call_type = data.get("callType")
        call_id = data.get("callId")  # Pass callId from frontend after startCall API

        if not caller_id:
            print("❌ callerId is missing")
            return

        if not offer:
            print("❌ offer is missing")
            return

        receiver_socket = get_receiver_socket_id(receiver_id)

        if not receiver_socket:
            # Notify caller that receiver is offline
            await sio.emit(
                "callError",
                {"message": "User is offline"},
                to=sid
            )
            return

        # Single event with everything the receiver needs
        await sio.emit(
            "incomingCall",
            {
                "callId": call_id,
                "callerId": caller_id,
                "receiverId": receiver_id,
                "offer": offer,
                "callType": call_type
            },
            to=receiver_socket
        )

        print(f"✅ {caller_id} calling {receiver_id} [{call_type}]")

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
        call_id = data.get("callId")

        if not answer:
            print("❌ answer SDP is missing")
            return

        caller_socket = get_receiver_socket_id(caller_id)

        if caller_socket:
            await sio.emit(
                "callAnswered",   # Renamed to avoid ambiguity with the DB action
                {
                    "callId": call_id,
                    "answer": answer
                },
                to=caller_socket
            )
            print(f"✅ Answer sent to {caller_id}")
        else:
            await sio.emit(
                "callError",
                {"message": "Caller disconnected"},
                to=sid
            )

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

        if not target_user or not candidate:
            print("❌ iceCandidate: missing targetUserId or candidate")
            return

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
    try:
        caller_id = data.get("callerId")
        call_id = data.get("callId")

        socket_id = get_receiver_socket_id(caller_id)

        if socket_id:
            await sio.emit(
                "callRejected",
                {"callId": call_id},
                to=socket_id
            )
            print(f"✅ Rejection sent to {caller_id}")

    except Exception as e:
        print("❌ rejectCall error:", e)


# -----------------------------
# END CALL (socket-only, peer-to-peer notify)
# Use the REST endpoint for DB updates + emit
# -----------------------------
@sio.event
async def endCall(sid, data):
    try:
        target_user = data.get("targetUserId")
        call_id = data.get("callId")

        if not target_user:
            return

        socket_id = get_receiver_socket_id(target_user)

        if socket_id:
            await sio.emit(
                "callEnded",
                {"callId": call_id},
                to=socket_id
            )

    except Exception as e:
        print("❌ endCall error:", e)