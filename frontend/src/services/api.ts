import type { LatLng } from '@/types';

export interface ChatApiResponse {
  advisory: string;
  map_data: {
    type: 'Feature';
    id: string;
    properties: {
      zone_id: string;
      name: string;
      chlorophyll_mg_m3?: number;
      sst_c?: number;
      wave_height_m: number;
      wind_speed_kmh?: number;
      confidence_score?: number;
      is_restricted: boolean;
      is_restricted_imbl: boolean;
      status: 'SAFE' | 'DANGER' | 'RESTRICTED';
    };
    geometry: {
      type: 'Polygon' | 'Point';
      coordinates: any;
    };
  };
  distance_km?: number;
  intent?: string;
  status: string;
}

const BACKEND_BASE_URL = 'http://localhost:8000';

/**
 * Checks if the LangGraph FastAPI backend is reachable.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sends a query and vessel coordinates to the LangGraph multi-agent chat endpoint.
 */
export async function sendAgentQuery(
  query: string,
  lat: number,
  lon: number,
): Promise<ChatApiResponse | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        lat,
        lon,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data: ChatApiResponse = await response.json();
    return data;
  } catch (error) {
    console.warn('Backend query failed, falling back to local engine:', error);
    return null;
  }
}

/**
 * Extracts a Leaflet [lat, lng] target from a GeoJSON feature.
 */
export function getCentroidFromGeoJson(feature: any): LatLng | null {
  if (!feature || !feature.geometry) return null;

  const { type, coordinates } = feature.geometry;

  if (type === 'Polygon' && Array.isArray(coordinates) && coordinates.length > 0) {
    const ring = coordinates[0];
    if (!ring.length) return null;
    let sumLat = 0;
    let sumLon = 0;
    for (const pt of ring) {
      sumLon += pt[0];
      sumLat += pt[1];
    }
    return {
      lat: sumLat / ring.length,
      lng: sumLon / ring.length,
    };
  }

  if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
    return {
      lat: coordinates[1],
      lng: coordinates[0],
    };
  }

  return null;
}
