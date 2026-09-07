import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLng } from '@/types';
import {
  MAP_CENTER,
  MAP_ZOOM,
  PFZ_ZONES,
  HAZARD_ZONES,
  IMBL_LINE,
  SAFE_ROUTE,
  RETURN_ROUTE,
  VESSEL_POSITION,
} from '@/data/mockData';

function createVesselIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker-pulse',
    html: `<div style="
      width: 24px;
      height: 24px;
      background: #1affed;
      border: 3px solid #061528;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(26, 255, 237, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    ">🚤</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FlyToController({ target }: { target: LatLng | null }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!target) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    map.flyTo([target.lat, target.lng], 13, { duration: 1.5 });
  }, [target, map]);

  return null;
}

const toLeafletLatLng = (coords: LatLng[]): [number, number][] =>
  coords.map((c) => [c.lat, c.lng]);

interface OceanMapProps {
  flyTarget: LatLng | null;
  activeFeature?: any | null;
}

export default function OceanMap({ flyTarget, activeFeature }: OceanMapProps) {
  const vesselIcon = createVesselIcon();

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      zoomControl={true}
      className="h-full w-full"
      attributionControl={true}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />

      <FlyToController target={flyTarget} />

      {/* PFZ Zones */}
      {PFZ_ZONES.map((zone) => (
        <Polygon
          key={zone.id}
          positions={toLeafletLatLng(zone.coordinates)}
          pathOptions={{
            color: zone.color,
            fillColor: zone.fillColor,
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '6 4',
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-aqua-400 mb-1">{zone.name}</div>
              <div className="text-ocean-100">Chlorophyll: {zone.metadata.chlorophyll} mg/m³</div>
              <div className="text-ocean-100">SST: {zone.metadata.sst}°C</div>
              <div className="text-ocean-100">Confidence: {(zone.metadata.confidence * 100).toFixed(0)}%</div>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* Hazard Zones */}
      {HAZARD_ZONES.map((zone) => (
        <Polygon
          key={zone.id}
          positions={toLeafletLatLng(zone.coordinates)}
          pathOptions={{
            color: zone.color,
            fillColor: zone.fillColor,
            fillOpacity: 0.35,
            weight: 3,
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold text-hazard-500 mb-1">{zone.name}</div>
              <div className="text-ocean-100">Wave Height: {zone.metadata.waveHeight}m</div>
              <div className="text-ocean-100">Wind Speed: {zone.metadata.windSpeed} km/h</div>
              <div className="text-ocean-100">Severity: {zone.metadata.severity.toUpperCase()}</div>
              <div className="text-ocean-100">Valid Until: {new Date(zone.metadata.validUntil).toLocaleTimeString()}</div>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* Dynamic Feature from LangGraph Backend */}
      {activeFeature && activeFeature.geometry && (
        activeFeature.geometry.type === 'Polygon' ? (
          <Polygon
            key={`active-${activeFeature.id || activeFeature.properties?.zone_id || 'zone'}`}
            positions={activeFeature.geometry.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon] as [number, number])}
            pathOptions={{
              color: activeFeature.properties?.status === 'DANGER' || (activeFeature.properties?.wave_height_m ?? 0) > 2.5
                ? '#ef4444'
                : activeFeature.properties?.is_restricted_imbl || activeFeature.properties?.status === 'RESTRICTED'
                ? '#f59e0b'
                : '#10b981',
              fillColor: activeFeature.properties?.status === 'DANGER' || (activeFeature.properties?.wave_height_m ?? 0) > 2.5
                ? '#ef4444'
                : activeFeature.properties?.is_restricted_imbl || activeFeature.properties?.status === 'RESTRICTED'
                ? '#f59e0b'
                : '#10b981',
              fillOpacity: 0.45,
              weight: 4,
              dashArray: '3 6',
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-aqua-400 animate-ping" />
                  <span className="text-[10px] font-bold text-aqua-400 uppercase tracking-wider">
                    LangGraph Identified Zone
                  </span>
                </div>
                <div className="font-bold text-ocean-50 text-base mb-1">
                  {activeFeature.properties?.name || activeFeature.properties?.zone_id}
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold mb-2"
                  style={{
                    backgroundColor: activeFeature.properties?.status === 'DANGER' ? '#ef444425' : activeFeature.properties?.status === 'RESTRICTED' ? '#f59e0b25' : '#10b98125',
                    color: activeFeature.properties?.status === 'DANGER' ? '#f87171' : activeFeature.properties?.status === 'RESTRICTED' ? '#fbbf24' : '#34d399',
                    border: `1px solid ${activeFeature.properties?.status === 'DANGER' ? '#ef444450' : activeFeature.properties?.status === 'RESTRICTED' ? '#f59e0b50' : '#10b98150'}`
                  }}
                >
                  Status: {activeFeature.properties?.status || 'MONITORED'}
                </div>
                {activeFeature.properties?.wave_height_m !== undefined && (
                  <div className="text-ocean-100 text-xs">
                    Wave Height: <span className="font-semibold text-ocean-50">{activeFeature.properties.wave_height_m}m</span>
                  </div>
                )}
                {activeFeature.properties?.chlorophyll_mg_m3 !== undefined && (
                  <div className="text-ocean-100 text-xs">
                    Chlorophyll: <span className="font-semibold text-ocean-50">{activeFeature.properties.chlorophyll_mg_m3} mg/m³</span>
                  </div>
                )}
                {activeFeature.properties?.sst_c !== undefined && (
                  <div className="text-ocean-100 text-xs">
                    Sea Surface Temp: <span className="font-semibold text-ocean-50">{activeFeature.properties.sst_c}°C</span>
                  </div>
                )}
                {activeFeature.properties?.wind_speed_kmh !== undefined && (
                  <div className="text-ocean-100 text-xs">
                    Wind Speed: <span className="font-semibold text-ocean-50">{activeFeature.properties.wind_speed_kmh} km/h</span>
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        ) : activeFeature.geometry.type === 'Point' ? (
          <Marker
            position={[activeFeature.geometry.coordinates[1], activeFeature.geometry.coordinates[0]]}
          >
            <Popup>
              <div className="text-sm font-bold text-aqua-400">
                {activeFeature.properties?.name || 'Agent Target Point'}
              </div>
            </Popup>
          </Marker>
        ) : null
      )}

      {/* IMBL Boundary Line */}
      <Polyline
        positions={toLeafletLatLng(IMBL_LINE.coordinates)}
        pathOptions={{
          color: IMBL_LINE.color,
          weight: 3,
          dashArray: '10 6',
          opacity: 0.9,
        }}
      >
        <Popup>
          <div className="text-sm">
            <div className="font-bold text-hazard-500 mb-1">{IMBL_LINE.name}</div>
            <div className="text-ocean-100">International Maritime Boundary Line</div>
            <div className="text-ocean-100">Do not cross this boundary.</div>
          </div>
        </Popup>
      </Polyline>

      {/* Safe Route */}
      <Polyline
        positions={toLeafletLatLng(SAFE_ROUTE.coordinates)}
        pathOptions={{
          color: SAFE_ROUTE.color,
          weight: 4,
          opacity: 0.85,
        }}
      >
        <Popup>
          <div className="text-sm">
            <div className="font-bold text-safe-500 mb-1">{SAFE_ROUTE.name}</div>
            <div className="text-ocean-100">Distance: {SAFE_ROUTE.distance} km</div>
            <div className="text-ocean-100">ETA: {SAFE_ROUTE.eta}</div>
          </div>
        </Popup>
      </Polyline>

      {/* Return Route */}
      <Polyline
        positions={toLeafletLatLng(RETURN_ROUTE.coordinates)}
        pathOptions={{
          color: RETURN_ROUTE.color,
          weight: 3,
          opacity: 0.5,
          dashArray: '5 8',
        }}
      >
        <Popup>
          <div className="text-sm">
            <div className="font-bold text-aqua-400 mb-1">{RETURN_ROUTE.name}</div>
            <div className="text-ocean-100">Distance: {RETURN_ROUTE.distance} km</div>
            <div className="text-ocean-100">ETA: {RETURN_ROUTE.eta}</div>
          </div>
        </Popup>
      </Polyline>

      {/* Vessel Position */}
      <Marker position={[VESSEL_POSITION.lat, VESSEL_POSITION.lng]} icon={vesselIcon}>
        <Popup>
          <div className="text-sm">
            <div className="font-bold text-aqua-400 mb-1">{VESSEL_POSITION.label}</div>
            <div className="text-ocean-100">Position: {VESSEL_POSITION.lat.toFixed(3)}°N, {VESSEL_POSITION.lng.toFixed(3)}°E</div>
            <div className="text-ocean-100">Heading: {VESSEL_POSITION.heading}°</div>
            <div className="text-ocean-100">Speed: {VESSEL_POSITION.speed} knots</div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
