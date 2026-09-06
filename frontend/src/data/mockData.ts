import type {
  PFZZone,
  HazardZone,
  IMBLLine,
  NavigationRoute,
  Alert,
  SeaCondition,
  VesselPosition,
  LanguageOption,
} from '@/types';

export const VESSEL_POSITION: VesselPosition = {
  lat: 9.288,
  lng: 79.313,
  heading: 135,
  speed: 6,
  label: 'Fishing Vessel "Matsya"',
};

export const PFZ_ZONES: PFZZone[] = [
  {
    id: 'pfz-1',
    name: 'PFZ Alpha - Gulf of Mannar East',
    coordinates: [
      { lat: 9.35, lng: 79.45 },
      { lat: 9.42, lng: 79.52 },
      { lat: 9.38, lng: 79.62 },
      { lat: 9.28, lng: 79.58 },
      { lat: 9.25, lng: 79.48 },
    ],
    metadata: {
      chlorophyll: 2.8,
      sst: 28.4,
      confidence: 0.87,
      lastUpdated: '2026-09-05T04:00:00Z',
    },
    color: '#1de958',
    fillColor: '#1de958',
  },
  {
    id: 'pfz-2',
    name: 'PFZ Beta - Palk Bay South',
    coordinates: [
      { lat: 9.15, lng: 79.2 },
      { lat: 9.22, lng: 79.3 },
      { lat: 9.18, lng: 79.42 },
      { lat: 9.08, lng: 79.38 },
      { lat: 9.05, lng: 79.25 },
    ],
    metadata: {
      chlorophyll: 3.1,
      sst: 29.1,
      confidence: 0.91,
      lastUpdated: '2026-09-05T04:00:00Z',
    },
    color: '#1de958',
    fillColor: '#1de958',
  },
  {
    id: 'pfz-3',
    name: 'PFZ Gamma - Adam Bridge Channel',
    coordinates: [
      { lat: 9.22, lng: 79.55 },
      { lat: 9.28, lng: 79.65 },
      { lat: 9.24, lng: 79.72 },
      { lat: 9.16, lng: 79.68 },
      { lat: 9.14, lng: 79.58 },
    ],
    metadata: {
      chlorophyll: 2.4,
      sst: 28.7,
      confidence: 0.79,
      lastUpdated: '2026-09-05T04:00:00Z',
    },
    color: '#1de958',
    fillColor: '#1de958',
  },
];

export const IMBL_LINE: IMBLLine = {
  id: 'imbl-1',
  name: 'India - Sri Lanka International Maritime Boundary Line',
  coordinates: [
    { lat: 9.65, lng: 79.7 },
    { lat: 9.55, lng: 79.68 },
    { lat: 9.45, lng: 79.65 },
    { lat: 9.35, lng: 79.63 },
    { lat: 9.25, lng: 79.62 },
    { lat: 9.15, lng: 79.6 },
    { lat: 9.05, lng: 79.58 },
    { lat: 8.95, lng: 79.55 },
  ],
  color: '#ff4500',
};

export const HAZARD_ZONES: HazardZone[] = [
  {
    id: 'hazard-1',
    name: 'High Wave Alert - Offshore Mannar',
    coordinates: [
      { lat: 9.5, lng: 79.55 },
      { lat: 9.6, lng: 79.65 },
      { lat: 9.58, lng: 79.78 },
      { lat: 9.48, lng: 79.75 },
      { lat: 9.42, lng: 79.6 },
    ],
    metadata: {
      waveHeight: 3.2,
      windSpeed: 28,
      severity: 'extreme',
      validUntil: '2026-09-05T18:00:00Z',
    },
    color: '#ff4500',
    fillColor: '#ff6b3d',
  },
];

export const SAFE_ROUTE: NavigationRoute = {
  id: 'route-1',
  name: 'Safe Route to PFZ Alpha',
  coordinates: [
    { lat: 9.288, lng: 79.313 },
    { lat: 9.3, lng: 79.35 },
    { lat: 9.32, lng: 79.4 },
    { lat: 9.34, lng: 79.45 },
    { lat: 9.36, lng: 79.5 },
  ],
  color: '#1de958',
  distance: 18.5,
  eta: '45 min',
  type: 'safe',
};

export const RETURN_ROUTE: NavigationRoute = {
  id: 'route-2',
  name: 'Safe Route Back to Harbor',
  coordinates: [
    { lat: 9.36, lng: 79.5 },
    { lat: 9.33, lng: 79.42 },
    { lat: 9.3, lng: 79.35 },
    { lat: 9.288, lng: 79.313 },
  ],
  color: '#00e5d0',
  distance: 18.5,
  eta: '45 min',
  type: 'optimal',
};

export const ACTIVE_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    title: 'High Wave Warning',
    description: 'Wave heights up to 3.2m detected offshore. Avoid the Mannar outer zone.',
    severity: 'extreme',
    zone: 'Offshore Mannar',
    icon: 'waves',
  },
  {
    id: 'alert-2',
    title: 'IMBL Border Proximity',
    description: 'You are 4.2 km from the International Maritime Boundary Line. Turn back.',
    severity: 'high',
    zone: 'IMBL Sector 3',
    icon: 'alert-triangle',
  },
  {
    id: 'alert-3',
    title: 'Favorable Fishing Conditions',
    description: 'PFZ Alpha shows high chlorophyll (2.8 mg/m³) and optimal SST (28.4°C).',
    severity: 'safe',
    zone: 'Gulf of Mannar East',
    icon: 'fish',
  },
];

export const SEA_CONDITIONS: SeaCondition = {
  label: 'Current Sea State',
  waveHeight: 1.8,
  windSpeed: 14,
  visibility: 8.5,
  temperature: 28.4,
  status: 'moderate',
};

export const LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', label: 'English', flag: 'EN' },
  { code: 'ta-IN', label: 'Tamil', flag: 'TA' },
  { code: 'hi-IN', label: 'Hindi', flag: 'HI' },
];

export const MAP_CENTER: [number, number] = [9.288, 79.313];
export const MAP_ZOOM = 11;
