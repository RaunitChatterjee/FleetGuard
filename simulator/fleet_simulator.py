import random
import time
import uuid
from datetime import datetime, timezone

import requests

from routes import ROUTES


API_URL = "http://127.0.0.1:8000/api/telemetry/ingest"
SEND_INTERVAL = 3


VEHICLES = [
    {"device_id": "FL-001", "auth_token": "fleetguard-demo-001", "route": "route_1", "progress": 0.0},
    {"device_id": "FL-002", "auth_token": "fleetguard-demo-002", "route": "route_2", "progress": 0.2},
    {"device_id": "FL-003", "auth_token": "fleetguard-demo-003", "route": "route_3", "progress": 0.4},
    {"device_id": "FL-004", "auth_token": "fleetguard-demo-004", "route": "route_4", "progress": 0.6},
    {"device_id": "FL-005", "auth_token": "fleetguard-demo-005", "route": "route_5", "progress": 0.8},
    {"device_id": "FL-006", "auth_token": "fleetguard-demo-006", "route": "route_1", "progress": 0.3},
    {"device_id": "FL-007", "auth_token": "fleetguard-demo-007", "route": "route_2", "progress": 0.5},
    {"device_id": "FL-008", "auth_token": "fleetguard-demo-008", "route": "route_3", "progress": 0.7},
    {"device_id": "FL-009", "auth_token": "fleetguard-demo-009", "route": "route_4", "progress": 0.1},
    {"device_id": "FL-010", "auth_token": "fleetguard-demo-010", "route": "route_5", "progress": 0.5},
]


def interpolate_position(route, progress):
    """
    Return a position between route points instead of
    jumping directly from one point to another.
    """

    total_segments = len(route) - 1

    position = progress * total_segments

    index = int(position)

    if index >= total_segments:
        index = total_segments - 1

    fraction = position - index

    lat1, lon1 = route[index]
    lat2, lon2 = route[index + 1]

    latitude = lat1 + (lat2 - lat1) * fraction
    longitude = lon1 + (lon2 - lon1) * fraction

    return latitude, longitude


def generate_telemetry(vehicle):
    route = ROUTES[vehicle["route"]]

    latitude, longitude = interpolate_position(
        route,
        vehicle["progress"]
    )

    latitude += random.uniform(-0.00001, 0.00001)
    longitude += random.uniform(-0.00001, 0.00001)

    telemetry = {
        "device_id": vehicle["device_id"],
        "auth_token": vehicle["auth_token"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lat": latitude,
        "lon": longitude,
        "speed_kmh": round(random.uniform(35, 60), 2),
        "ignition_status": "on",
        "firmware_version": "v2.3.1",
        "nonce": str(uuid.uuid4()),
    }

    # Move only a small amount every cycle.
    vehicle["progress"] += 0.005

    if vehicle["progress"] >= 1.0:
        vehicle["progress"] = 0.0

    return telemetry


def send_telemetry(vehicle):
    telemetry = generate_telemetry(vehicle)

    try:
        response = requests.post(
            API_URL,
            json=telemetry,
            timeout=5
        )

        print(
            f"[{response.status_code}] "
            f"{vehicle['device_id']} | "
            f"lat={telemetry['lat']:.5f} "
            f"lon={telemetry['lon']:.5f} | "
            f"speed={telemetry['speed_kmh']} km/h"
        )

    except requests.RequestException as error:
        print(
            f"[ERROR] {vehicle['device_id']}: {error}"
        )


def main():
    print("===================================")
    print(" FleetGuard Fleet Simulator")
    print("===================================")
    print(f"Vehicles: {len(VEHICLES)}")
    print("Realistic interpolated movement")
    print("Sending telemetry every 3 seconds...\n")

    while True:
        for vehicle in VEHICLES:
            send_telemetry(vehicle)

        print("-" * 75)
        time.sleep(SEND_INTERVAL)


if __name__ == "__main__":
    main()
