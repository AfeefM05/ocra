export interface LatLng {
  lat: number;
  lng: number;
}

export interface PFZMetadata {
  chlorophyll: number;
  sst: number;
  confidence: number;
  lastUpdated: string;
}

export interface PFZZone {
  id: string;
  name: string;
  coordinates: LatLng[];
  metadata: PFZMetadata;
  color: string;
  fillColor: string;
}

export interface HazardMetadata {
  waveHeight: number;
  windSpeed: number;
  severity: 'moderate' | 'high' | 'extreme';
  validUntil: string;
}

export interface HazardZone {
  id: string;
  name: string;
  coordinates: LatLng[];
  metadata: HazardMetadata;
  color: string;
  fillColor: string;
}

export interface IMBLLine {
  id: string;
  name: string;
  coordinates: LatLng[];
  color: string;
}

export interface NavigationRoute {
  id: string;
  name: string;
  coordinates: LatLng[];
  color: string;
  distance: number;
  eta: string;
  type: 'safe' | 'optimal';
}

export type AlertSeverity = 'safe' | 'moderate' | 'high' | 'extreme';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  zone?: string;
  icon: string;
}

export interface AdvisoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  targetZone?: string;
  targetCoordinates?: LatLng;
  action?: 'fly-to-pfz' | 'fly-to-hazard' | 'fly-to-route' | 'fly-to-imbl' | 'fly-to-vessel';
  dynamicFeature?: any;
}

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export interface SeaCondition {
  label: string;
  waveHeight: number;
  windSpeed: number;
  visibility: number;
  temperature: number;
  status: AlertSeverity;
}

export interface VesselPosition {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  label: string;
}
