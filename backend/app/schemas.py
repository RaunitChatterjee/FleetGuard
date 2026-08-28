from datetime import datetime

from pydantic import BaseModel, Field


class TelemetryCreate(BaseModel):
    device_id: str
    auth_token: str
    timestamp: datetime
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    speed_kmh: float = Field(..., ge=0)
    ignition_status: str
    firmware_version: str
    nonce: str
