import sys
import uuid
from datetime import datetime, timezone

import requests


API_URL = "http://127.0.0.1:8000/api/telemetry/ingest"

DEVICE_ID = "FL-001"
VALID_TOKEN = "fleetguard-demo-001"
FIRMWARE_VERSION = "v2.3.1"


def send_packet(packet):
    try:
        response = requests.post(
            API_URL,
            json=packet,
            timeout=5
        )

        print(f"HTTP {response.status_code}")
        print(response.json())

    except requests.RequestException as error:
        print(f"[ERROR] Could not reach FleetGuard API: {error}")


def gps_spoofing():
    print("\n[ATTACK] GPS Spoofing / Teleport")

    packet = {
        "device_id": DEVICE_ID,
        "auth_token": VALID_TOKEN,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lat": 19.0760,
        "lon": 72.8777,
        "speed_kmh": 812,
        "ignition_status": "on",
        "firmware_version": FIRMWARE_VERSION,
        "nonce": str(uuid.uuid4())
    }

    send_packet(packet)


def replay_attack():
    print("\n[ATTACK] Replay Attack")

    old_timestamp = "2026-08-24T10:30:00Z"
    old_nonce = "replayed-nonce-001"

    packet = {
        "device_id": DEVICE_ID,
        "auth_token": VALID_TOKEN,
        "timestamp": old_timestamp,
        "lat": 28.6139,
        "lon": 77.2090,
        "speed_kmh": 42,
        "ignition_status": "on",
        "firmware_version": FIRMWARE_VERSION,
        "nonce": old_nonce
    }

    send_packet(packet)


def device_impersonation():
    print("\n[ATTACK] Device Impersonation")

    packet = {
        "device_id": DEVICE_ID,
        "auth_token": "attacker-invalid-token",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lat": 28.6139,
        "lon": 77.2090,
        "speed_kmh": 50,
        "ignition_status": "on",
        "firmware_version": FIRMWARE_VERSION,
        "nonce": str(uuid.uuid4())
    }

    send_packet(packet)




def firmware_downgrade():
    print("\n[ATTACK] Firmware Downgrade")

    packet = {
        "device_id": DEVICE_ID,
        "auth_token": VALID_TOKEN,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lat": 28.6139,
        "lon": 77.2090,
        "speed_kmh": 50,
        "ignition_status": "on",
        "firmware_version": "v1.5.0",
        "nonce": str(uuid.uuid4())
    }

    send_packet(packet)


def unauthorized_device():
    print("\n[ATTACK] Unauthorized Device")

    packet = {
        "device_id": "FL-999",
        "auth_token": "attacker-random-token",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lat": 28.6139,
        "lon": 77.2090,
        "speed_kmh": 45,
        "ignition_status": "on",
        "firmware_version": FIRMWARE_VERSION,
        "nonce": str(uuid.uuid4())
    }

    send_packet(packet)


def main():
    if len(sys.argv) != 2:
        print(
            "Usage:\n"
            "  python attack_injector.py gps\n"
            "  python attack_injector.py replay\n"
            "  python attack_injector.py impersonation\n"
            "  python attack_injector.py unauthorized\n"
            "  python attack_injector.py firmware"
        )
        return

    attack = sys.argv[1].lower()

    if attack == "gps":
        gps_spoofing()

    elif attack == "replay":
        replay_attack()

    elif attack == "impersonation":
        device_impersonation()

    elif attack == "unauthorized":
        unauthorized_device()

    elif attack == "firmware":
        firmware_downgrade()

    else:
        print(f"Unknown attack: {attack}")


if __name__ == "__main__":
    main()
