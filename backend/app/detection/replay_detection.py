def detect_replay(db, device_id, nonce, timestamp):
    """
    Detect whether the same nonce/timestamp combination
    has already been stored for this device.
    """

    from ..models import Telemetry

    existing = (
        db.query(Telemetry)
        .filter(
            Telemetry.device_id == device_id,
            Telemetry.nonce == nonce,
            Telemetry.timestamp == timestamp
        )
        .first()
    )

    if existing:
        return {
            "alert_type": "replay_attack",
            "severity": "high",
            "details": (
                f"Duplicate telemetry detected with "
                f"nonce {nonce}"
            )
        }

    return None
