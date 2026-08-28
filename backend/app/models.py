from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from .database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False, index=True)
    auth_token = Column(String, nullable=False)
    firmware_version = Column(String, nullable=False)
    status = Column(String, default="normal")
    registered_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
    last_seen = Column(DateTime, nullable=True)


class Telemetry(Base):
    __tablename__ = "telemetry_raw"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=False)
    ignition_status = Column(String, nullable=False)
    firmware_version = Column(String, nullable=False)
    nonce = Column(String, nullable=False, index=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, nullable=False, index=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    details = Column(String, nullable=False)
    mitre_mapping = Column(String, nullable=True)
    timestamp = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
    acknowledged = Column(Integer, default=0)
