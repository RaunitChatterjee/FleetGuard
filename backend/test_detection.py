from datetime import datetime, timezone

from app.models import Telemetry
from app.detection.impossible_travel import detect_impossible_travel


previous = Telemetry(
    device_id="FL-001",
    timestamp=datetime(
        2026, 8, 24, 10, 0, 0,
        tzinfo=timezone.utc
    ),
    latitude=28.6139,
    longitude=77.2090,
    speed_kmh=40,
    ignition_status="on",
    firmware_version="v2.3.1",
    nonce="previous"
)


current = Telemetry(
    device_id="FL-001",
    timestamp=datetime(
        2026, 8, 24, 10, 0, 5,
        tzinfo=timezone.utc
    ),
    latitude=19.0760,
    longitude=72.8777,
    speed_kmh=40,
    ignition_status="on",
    firmware_version="v2.3.1",
    nonce="current"
)


result = detect_impossible_travel(previous, current)

print(result)
