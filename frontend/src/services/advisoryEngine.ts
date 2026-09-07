import type { AdvisoryMessage, LatLng } from '@/types';
import {
  PFZ_ZONES,
  HAZARD_ZONES,
  IMBL_LINE,
  SAFE_ROUTE,
  VESSEL_POSITION,
  SEA_CONDITIONS,
} from '@/data/mockData';

const now = () => new Date().toISOString();

function makeMessage(
  role: 'user' | 'assistant/ m/',
  content: string,
  action?: AdvisoryMessage['action'],
  targetCoordinates?: LatLng,
  targetZone?: string,
): AdvisoryMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: now(),
    action,
    targetCoordinates,
    targetZone,
  };
}

export function processUserQuery(query: string): AdvisoryMessage {
  const q = query.toLowerCase().trim();

  // PFZ queries
  if (q.includes('fishing zone') || q.includes('pfz') || q.includes('fish') || q.includes('catch') || q.includes('மீன்')) {
    const zone = PFZ_ZONES[0];
    const center = zone.coordinates.reduce(
      (acc, c) => ({ lat: acc.lat + c.lat / zone.coordinates.length, lng: acc.lng + c.lng / zone.coordinates.length }),
      { lat: 0, lng: 0 },
    );
    return makeMessage(
      'assistant',
      `Nearest Potential Fishing Zone is "${zone.name}". Chlorophyll level is ${zone.metadata.chlorophyll} mg/m³ with sea surface temperature of ${zone.metadata.sst}°C. Confidence: ${(zone.metadata.confidence * 100).toFixed(0)}%. I have plotted the zone on your map and drawn a safe route. Head southeast.`,
      'fly-to-pfz',
      center,
      zone.id,
    );
  }

  // Hazard / weather queries
  if (q.includes('weather') || q.includes('wave') || q.includes('hazard') || q.includes('danger') || q.includes('storm') || q.includes('ஆபத்து')) {
    const hazard = HAZARD_ZONES[0];
    const center = hazard.coordinates.reduce(
      (acc, c) => ({ lat: acc.lat + c.lat / hazard.coordinates.length, lng: acc.lng + c.lng / hazard.coordinates.length }),
      { lat: 0, lng: 0 },
    );
    return makeMessage(
      'assistant',
      `Warning: ${hazard.name}. Wave height is ${hazard.metadata.waveHeight}m with wind speed of ${hazard.metadata.windSpeed} km/h. Severity is ${hazard.metadata.severity.toUpperCase()}. Avoid this area. Current sea state at your location: waves ${SEA_CONDITIONS.waveHeight}m, wind ${SEA_CONDITIONS.windSpeed} km/h, visibility ${SEA_CONDITIONS.visibility} km.`,
      'fly-to-hazard',
      center,
      hazard.id,
    );
  }

  // IMBL / border queries
  if (q.includes('border') || q.includes('imbl') || q.includes('boundary') || q.includes('sri lanka') || q.includes('எல்லை')) {
    const midPoint = IMBL_LINE.coordinates[Math.floor(IMBL_LINE.coordinates.length / 2)];
    return makeMessage(
      'assistant',
      `You are currently ${'4.2 km'} from the International Maritime Boundary Line (IMBL). Do not cross this boundary — it separates Indian and Sri Lankan waters. I am highlighting the IMBL on your map now. Please maintain a safe distance of at least 5 km.`,
      'fly-to-imbl',
      midPoint,
      IMBL_LINE.id,
    );
  }

  // Route / home queries
  if (q.includes('route') || q.includes('home') || q.includes('return') || q.includes('harbour') || q.includes('harbor') || q.includes('back') || q.includes('வழி')) {
    return makeMessage(
      'assistant',
      `Safe route to ${SAFE_ROUTE.name} is plotted on your map. Distance: ${SAFE_ROUTE.distance} km, ETA: ${SAFE_ROUTE.eta}. The route avoids the high-wave hazard zone and stays clear of the IMBL boundary. Follow the green line on your map.`,
      'fly-to-route',
      SAFE_ROUTE.coordinates[0],
      SAFE_ROUTE.id,
    );
  }

  // Location / where am I
  if (q.includes('where') || q.includes('location') || q.includes('position') || q.includes('எங்கு')) {
    return makeMessage(
      'assistant',
      `Your current position is ${VESSEL_POSITION.lat.toFixed(3)}°N, ${VESSEL_POSITION.lng.toFixed(3)}°E near Rameswaram coast. Heading ${VESSEL_POSITION.heading}° at ${VESSEL_POSITION.speed} knots. Sea conditions: ${SEA_CONDITIONS.waveHeight}m waves, ${SEA_CONDITIONS.windSpeed} km/h wind.`,
      'fly-to-vessel',
      { lat: VESSEL_POSITION.lat, lng: VESSEL_POSITION.lng },
    );
  }

  // Default
  return makeMessage(
    'assistant',
    `I can help you with: finding fishing zones, checking weather and hazards, navigating the IMBL boundary, or plotting a safe route home. Tap the microphone and ask me about fishing, weather, borders, or routes.`,
  );
}

export function getWelcomeMessage(): AdvisoryMessage {
  return makeMessage(
    'assistant',
    `Welcome, Captain. You are near Rameswaram in the Gulf of Mannar. I have detected 3 Potential Fishing Zones nearby. There is a high-wave hazard offshore and you are close to the IMBL boundary. Tap the microphone or ask me about fishing zones, weather, or safe routes.`,
  );
}

export function createUserMessage(text: string): AdvisoryMessage {
  return makeMessage('user', text);
}
