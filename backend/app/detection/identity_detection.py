def detect_identity_issue(device, device_id, auth_token):
    """
    Detect device impersonation or unauthorized device access.
    """

    # Device ID is not registered
    if device is None:
        return {
            "alert_type": "unauthorized_device",
            "severity": "critical",
            "details": (
                f"Unknown device {device_id} attempted "
                "to send telemetry"
            ),
            "mitre_mapping": "T1692 - Unauthorized Message"
        }

    # Device exists, but authentication token is wrong
    if device.auth_token != auth_token:
        return {
            "alert_type": "device_impersonation",
            "severity": "high",
            "details": (
                f"Authentication mismatch for registered "
                f"device {device_id}"
            ),
            "mitre_mapping": "T0859 - Valid Accounts"
        }

    return None
