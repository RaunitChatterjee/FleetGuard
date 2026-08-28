from math import radians, sin, cos, sqrt, atan2


MAX_REALISTIC_SPEED_KMH = 200


def calculate_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    Calculate distance between two GPS coordinates
    using the Haversine formula.
    """

    earth_radius_km = 6371.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earth_radius_km * c


def detect_impossible_travel(previous, current):
    """
    Compare the previous telemetry packet with the
    current packet and determine whether the implied
    travel speed is unrealistic.
    """

    time_difference = (
        current.timestamp - previous.timestamp
    ).total_seconds()

    if time_difference <= 0:
        return None

    distance_km = calculate_distance_km(
        previous.latitude,
        previous.longitude,
        current.latitude,
        current.longitude
    )

    time_hours = time_difference / 3600

    implied_speed = distance_km / time_hours

    if implied_speed > MAX_REALISTIC_SPEED_KMH:
        return {
            "alert_type": "impossible_travel",
            "severity": "high",
            "details": (
                f"Implied speed {implied_speed:.2f} km/h "
                f"exceeds threshold of "
                f"{MAX_REALISTIC_SPEED_KMH} km/h"
            ),
            "implied_speed_kmh": round(implied_speed, 2)
        }

    return None
