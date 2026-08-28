import requests


API_URL = "http://127.0.0.1:8000/api/devices/register"


for number in range(1, 11):
    device_id = f"FL-{number:03d}"
    auth_token = f"fleetguard-demo-{number:03d}"

    response = requests.post(
        API_URL,
        params={
            "device_id": device_id,
            "auth_token": auth_token,
            "firmware_version": "v2.3.1",
        },
        timeout=5,
    )

    print(device_id, response.status_code, response.json())
