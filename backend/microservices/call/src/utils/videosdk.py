from jose import jwt
import requests
from datetime import datetime, timedelta
from src.config.config import settings


VIDEOSDK_API_ENDPOINT = "https://api.videosdk.live/v2/rooms"


from jose import jwt
from datetime import datetime, timedelta
from src.config.config import settings


def create_videosdk_token():

    expiration = datetime.utcnow() + timedelta(hours=24)

    payload = {
        "apikey": settings.VIDEOSDK_API_KEY,
        "permissions": ["allow_join", "allow_mod"],
        "exp": int(expiration.timestamp())
    }

    token = jwt.encode(
        payload,
        settings.VIDEOSDK_SECRET_KEY,
        algorithm="HS256"
    )

    return token


async def create_meeting(token: str):

    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }

    response = requests.post(
        VIDEOSDK_API_ENDPOINT,
        headers=headers
    )

    print(response.status_code)
    print(response.text)

    if response.status_code != 200:
        raise Exception("VideoSDK meeting creation failed")

    data = response.json()

    return data["roomId"]