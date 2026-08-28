import { useEffect, useState } from 'react';
import { getDeviceTelemetry } from '../lib/api';

/**
 * For a list of devices, fetches each device's telemetry history and
 * keeps the latest reading (telemetry is returned newest-first).
 * Devices with no telemetry yet are simply omitted — never faked.
 */
export function useFleetPositions(devices, intervalMs = 5000) {
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!devices || devices.length === 0) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const tick = async () => {
      const results = await Promise.all(
        devices.map(async (device) => {
          try {
            const telemetry = await getDeviceTelemetry(device.device_id);
            return [device.device_id, telemetry[0] || null];
          } catch {
            return [device.device_id, null];
          }
        })
      );
      if (!cancelled) {
        setPositions(Object.fromEntries(results));
        setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [devices, intervalMs]);

  return { positions, loading };
}
