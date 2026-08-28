from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from . import models
from .schemas import TelemetryCreate
from .detection.impossible_travel import detect_impossible_travel
from .detection.replay_detection import detect_replay
from .detection.identity_detection import detect_identity_issue
from .detection.firmware_detection import detect_firmware_regression
from .services.alert_service import create_alert

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FleetGuard API",
    description="IoT Fleet Telematics Security Platform",
    version="1.0.0"
)

# CORS: required so the browser-based dashboard (served from a different
# origin/port, e.g. the Vite dev server on :5173) can call this API.
# The detection/backend logic below is untouched.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "FleetGuard API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/api/devices/register")
def register_device(
    device_id: str,
    auth_token: str,
    firmware_version: str,
    db: Session = Depends(get_db)
):
    existing_device = (
        db.query(models.Device)
        .filter(models.Device.device_id == device_id)
        .first()
    )

    if existing_device:
        return {
            "status": "already_registered",
            "device_id": device_id
        }

    device = models.Device(
        device_id=device_id,
        auth_token=auth_token,
        firmware_version=firmware_version,
        status="normal"
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return {
        "status": "registered",
        "device_id": device.device_id,
        "firmware_version": device.firmware_version
    }


@app.post("/api/telemetry/ingest")
def ingest_telemetry(
    telemetry: TelemetryCreate,
    db: Session = Depends(get_db)
):
    alerts = []

    # --------------------------------------------------
    # IDENTITY / AUTHENTICATION DETECTION
    # --------------------------------------------------

    device = (
        db.query(models.Device)
        .filter(
            models.Device.device_id == telemetry.device_id
        )
        .first()
    )

    identity_detection = detect_identity_issue(
        device,
        telemetry.device_id,
        telemetry.auth_token
    )

    if identity_detection:

        alert = create_alert(
            db=db,
            device_id=telemetry.device_id,
            alert_type=identity_detection["alert_type"],
            severity=identity_detection["severity"],
            details=identity_detection["details"]
        )

        alerts.append({
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "details": alert.details,
            "mitre_mapping": alert.mitre_mapping
        })

        return {
            "status": "rejected",
            "device_id": telemetry.device_id,
            "alerts": alerts
        }

    # --------------------------------------------------
    # REPLAY DETECTION
    # --------------------------------------------------

    replay_detection = detect_replay(
        db,
        telemetry.device_id,
        telemetry.nonce,
        telemetry.timestamp
    )

    if replay_detection:

        alert = create_alert(
            db=db,
            device_id=telemetry.device_id,
            alert_type=replay_detection["alert_type"],
            severity=replay_detection["severity"],
            details=replay_detection["details"]
        )

        alerts.append({
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "details": alert.details,
            "mitre_mapping": alert.mitre_mapping
        })

        return {
            "status": "rejected",
            "device_id": telemetry.device_id,
            "alerts": alerts
        }

    # --------------------------------------------------
    # FIRMWARE REGRESSION DETECTION
    # --------------------------------------------------

    firmware_detection = detect_firmware_regression(
        telemetry.firmware_version,
        device.firmware_version
    )

    if firmware_detection:

        alert = create_alert(
            db=db,
            device_id=telemetry.device_id,
            alert_type=firmware_detection["alert_type"],
            severity=firmware_detection["severity"],
            details=firmware_detection["details"]
        )

        alerts.append({
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "details": alert.details,
            "mitre_mapping": alert.mitre_mapping
        })

        return {
            "status": "rejected",
            "device_id": telemetry.device_id,
            "alerts": alerts
        }

    # --------------------------------------------------
    # PREVIOUS TELEMETRY
    # --------------------------------------------------

    previous_telemetry = (
        db.query(models.Telemetry)
        .filter(
            models.Telemetry.device_id == telemetry.device_id,
            models.Telemetry.timestamp <= telemetry.timestamp
        )
        .order_by(
            models.Telemetry.timestamp.desc()
        )
        .first()
    )

    # --------------------------------------------------
    # STORE TELEMETRY
    # --------------------------------------------------

    new_telemetry = models.Telemetry(
        device_id=telemetry.device_id,
        timestamp=telemetry.timestamp,
        latitude=telemetry.lat,
        longitude=telemetry.lon,
        speed_kmh=telemetry.speed_kmh,
        ignition_status=telemetry.ignition_status,
        firmware_version=telemetry.firmware_version,
        nonce=telemetry.nonce
    )

    db.add(new_telemetry)

    device.last_seen = telemetry.timestamp

    db.commit()
    db.refresh(new_telemetry)

    # --------------------------------------------------
    # IMPOSSIBLE TRAVEL DETECTION
    # --------------------------------------------------

    if previous_telemetry:

        detection = detect_impossible_travel(
            previous_telemetry,
            new_telemetry
        )

        if detection:

            alert = create_alert(
                db=db,
                device_id=telemetry.device_id,
                alert_type=detection["alert_type"],
                severity=detection["severity"],
                details=detection["details"]
            )

            alerts.append({
                "alert_id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "details": alert.details,
                "mitre_mapping": alert.mitre_mapping
            })

    return {
        "status": "accepted",
        "telemetry_id": new_telemetry.id,
        "device_id": new_telemetry.device_id,
        "alerts": alerts
    }

    # --------------------------------------------------
# ALERT MONITORING API
# --------------------------------------------------

@app.get("/api/alerts")
def get_alerts(
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(models.Alert)
        .order_by(models.Alert.id.desc())
        .all()
    )

    return [
        {
            "id": alert.id,
            "device_id": alert.device_id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "details": alert.details,
            "mitre_mapping": alert.mitre_mapping,
            "timestamp": alert.timestamp,
            "acknowledged": alert.acknowledged
        }
        for alert in alerts
    ]
    # --------------------------------------------------
# DEVICE MONITORING API
# --------------------------------------------------

@app.get("/api/devices")
def get_devices(
    db: Session = Depends(get_db)
):
    devices = (
        db.query(models.Device)
        .order_by(models.Device.device_id)
        .all()
    )

    return [
        {
            "id": device.id,
            "device_id": device.device_id,
            "firmware_version": device.firmware_version,
            "status": device.status,
            "registered_at": device.registered_at,
            "last_seen": device.last_seen
        }
        for device in devices
    ]
    # --------------------------------------------------
# TELEMETRY MONITORING API
# --------------------------------------------------

@app.get("/api/telemetry/{device_id}")
def get_device_telemetry(
    device_id: str,
    db: Session = Depends(get_db)
):
    telemetry = (
        db.query(models.Telemetry)
        .filter(models.Telemetry.device_id == device_id)
        .order_by(models.Telemetry.timestamp.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": item.id,
            "device_id": item.device_id,
            "timestamp": item.timestamp,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "speed_kmh": item.speed_kmh,
            "ignition_status": item.ignition_status,
            "firmware_version": item.firmware_version
        }
        for item in telemetry
    ]
    # --------------------------------------------------
# DASHBOARD STATISTICS API
# --------------------------------------------------

@app.get("/api/stats")
def get_stats(
    db: Session = Depends(get_db)
):
    total_devices = db.query(models.Device).count()
    total_alerts = db.query(models.Alert).count()

    critical_alerts = (
        db.query(models.Alert)
        .filter(models.Alert.severity == "critical")
        .count()
    )

    high_alerts = (
        db.query(models.Alert)
        .filter(models.Alert.severity == "high")
        .count()
    )

    medium_alerts = (
        db.query(models.Alert)
        .filter(models.Alert.severity == "medium")
        .count()
    )

    low_alerts = (
        db.query(models.Alert)
        .filter(models.Alert.severity == "low")
        .count()
    )

    unacknowledged_alerts = (
        db.query(models.Alert)
        .filter(models.Alert.acknowledged == 0)
        .count()
    )

    return {
        "total_devices": total_devices,
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "high_alerts": high_alerts,
        "medium_alerts": medium_alerts,
        "low_alerts": low_alerts,
        "unacknowledged_alerts": unacknowledged_alerts
    }
    # --------------------------------------------------
# ALERT ACKNOWLEDGEMENT API
# --------------------------------------------------

@app.patch("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = (
        db.query(models.Alert)
        .filter(models.Alert.id == alert_id)
        .first()
    )

    if not alert:
        return {
            "status": "error",
            "message": "Alert not found"
        }

    alert.acknowledged = 1
    db.commit()
    db.refresh(alert)

    return {
        "status": "acknowledged",
        "alert_id": alert.id,
        "acknowledged": alert.acknowledged
    }
