import { addTelemetryLog } from '@/lib/jsonStorage';

/**
 * Calculate dynamic ISS ground position from epoch time offset.
 */
function calculateIssPosition() {
  const now = Date.now() / 1000;
  const period = 5580; // ~93 minutes orbital period
  const t = (now % period) / period;
  
  // Calculate latitude & longitude sweep
  const lat = Math.sin(t * 2 * Math.PI) * 51.64; // ISS inclination 51.64 deg
  const lon = ((t * 360 - 180 + (now / 240) % 360) % 360) - 180;
  const alt = 418.5 + Math.sin(t * 4 * Math.PI) * 4.2; // Altitude ~418.5 km
  const velocity = 7.66 + Math.cos(t * 2 * Math.PI) * 0.05; // Velocity ~7.66 km/s

  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lon.toFixed(6)),
    altitude: parseFloat(alt.toFixed(2)),
    velocity: parseFloat(velocity.toFixed(3)),
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/iss/positions
 * Returns current latitude, longitude, altitude, and velocity for ISS vector plotting.
 */
export async function GET() {
  try {
    const pos = calculateIssPosition();
    const payload = {
      success: true,
      name: 'ISS (ZARYA)',
      noradId: 25544,
      position: pos,
    };

    addTelemetryLog({
      source: 'ISS-Position',
      latitude: pos.latitude,
      longitude: pos.longitude,
      altitude: pos.altitude,
      velocity: pos.velocity,
      rawPayload: payload,
    });

    return Response.json(payload);
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
