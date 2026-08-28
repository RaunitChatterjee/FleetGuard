from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import Alert


MITRE_MAPPINGS = {
    "impossible_travel": "T0856 - Spoof Reporting Message",
    "device_impersonation": "T0859 - Valid Accounts",
    "unauthorized_device": "T1692 - Unauthorized Message",
    "firmware_regression": "T0867 - Device Firmware",
    "replay_attack": "T0856 - Spoof Reporting Message"
}


def create_alert(
    db: Session,
    device_id: str,
    alert_type: str,
    severity: str,
    details: str
):
    alert = Alert(
        device_id=device_id,
        alert_type=alert_type,
        severity=severity,
        details=details,
        mitre_mapping=MITRE_MAPPINGS.get(alert_type),
        timestamp=datetime.now(timezone.utc),
        acknowledged=0
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert
