def parse_version(version):
    return tuple(int(part) for part in version.lstrip("v").split("."))


def detect_firmware_regression(current_version, last_version):
    if parse_version(current_version) < parse_version(last_version):
        return {
            "alert_type": "firmware_regression",
            "severity": "high",
            "details": (
                f"Firmware downgrade detected: "
                f"{last_version} -> {current_version}"
            )
        }

    return None
