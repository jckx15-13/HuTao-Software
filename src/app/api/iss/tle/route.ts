import { addTelemetryLog } from '@/lib/jsonStorage';

export const ISS_TLE_DATA = {
  name: 'ISS (ZARYA)',
  noradId: 25544,
  line1: '1 25544U 98067A   26220.51805556  .00016717  00000-0  30154-3 0  9993',
  line2: '2 25544  51.6416 230.1245 0006123 110.2341 249.9123 15.49812345501234',
  updatedAt: new Date().toISOString(),
};

/**
 * GET /api/iss/tle
 * Returns raw TLE (Two-Line Element) orbital telemetry for ISS (Zarya).
 */
export async function GET() {
  try {
    const payload = {
      success: true,
      data: ISS_TLE_DATA,
    };
    addTelemetryLog({
      source: 'ISS-TLE',
      rawPayload: payload,
    });
    return Response.json(payload);
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
