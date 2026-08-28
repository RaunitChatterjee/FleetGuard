// Thin client around the FleetGuard FastAPI backend.
// Every function here maps 1:1 to a real, existing endpoint —
// nothing here is invented or simulated on the frontend.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(
      `Could not reach the FleetGuard API at ${API_BASE_URL}. Is the backend running?`,
      0
    );
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status);
  }

  return response.json();
}

// GET /api/stats
export function getStats() {
  return request('/api/stats');
}

// GET /api/alerts
export function getAlerts() {
  return request('/api/alerts');
}

// PATCH /api/alerts/{id}/acknowledge
export function acknowledgeAlert(alertId) {
  return request(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
}

// GET /api/devices
export function getDevices() {
  return request('/api/devices');
}

// GET /api/telemetry/{device_id}
export function getDeviceTelemetry(deviceId) {
  return request(`/api/telemetry/${encodeURIComponent(deviceId)}`);
}

export { ApiError, API_BASE_URL };
