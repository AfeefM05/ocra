from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import TypedDict, Dict, Any, Optional, List
from langgraph.graph import StateGraph, END
import json
import math
import os
from pathlib import Path

app = FastAPI(
    title="ORCA Prototype API",
    description="LangGraph Multi-Agent Backend for Marine & Fishing Advisory (Gulf of Mannar / Rameswaram)",
    version="1.0.0"
)

# Enable CORS for Next.js / Vite frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "data" / "rameswaram_data.geojson"

# --- 1. State & Schemas ---
class QueryRequest(BaseModel):
    query: str
    lat: float
    lon: float

class ORCAState(TypedDict):
    query: str
    lat: float
    lon: float
    intent: str
    local_data_slice: Dict[str, Any]
    nearest_pfz: Dict[str, Any]
    distance_km: float
    advisory_text: str

# --- 2. Load Static GeoJSON Slice ---
def load_prototype_data() -> Dict[str, Any]:
    """Reads from local rameswaram_data.geojson slice, or provides robust fallback."""
    if DATA_PATH.exists():
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading GeoJSON file: {e}")
            
    # Fallback structure matching the demonstration specs
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "PFZ-04",
                "properties": {
                    "zone_id": "PFZ-04",
                    "name": "PFZ Alpha - Rameswaram Coast",
                    "chlorophyll_mg_m3": 2.8,
                    "sst_c": 28.4,
                    "wave_height_m": 1.2,
                    "wind_speed_kmh": 12.0,
                    "is_restricted": False,
                    "is_restricted_imbl": False,
                    "status": "SAFE"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [[79.31, 9.28], [79.36, 9.28], [79.36, 9.33], [79.31, 9.33], [79.31, 9.28]]
                    ]
                }
            },
            {
                "type": "Feature",
                "id": "HAZARD-01",
                "properties": {
                    "zone_id": "HAZARD-01",
                    "name": "High Wave Hazard - Offshore Mannar",
                    "chlorophyll_mg_m3": 1.4,
                    "sst_c": 27.8,
                    "wave_height_m": 3.4,
                    "wind_speed_kmh": 32.0,
                    "is_restricted": True,
                    "is_restricted_imbl": False,
                    "status": "DANGER"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [[79.45, 9.35], [79.58, 9.42], [79.62, 9.54], [79.48, 9.52], [79.45, 9.35]]
                    ]
                }
            }
        ]
    }

# --- Spatial Calculation Utilities ---
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_centroid(feature: Dict[str, Any]) -> tuple[float, float]:
    """Extracts representative (lat, lon) centroid from polygon coordinates or point."""
    geom = feature.get("geometry", {})
    coords = geom.get("coordinates", [])
    geom_type = geom.get("type", "")

    if geom_type == "Polygon" and coords and len(coords[0]) > 0:
        ring = coords[0]
        # Coordinates in GeoJSON are [lon, lat]
        avg_lon = sum(pt[0] for pt in ring) / len(ring)
        avg_lat = sum(pt[1] for pt in ring) / len(ring)
        return (avg_lat, avg_lon)
    elif geom_type == "Point" and len(coords) >= 2:
        return (coords[1], coords[0])
    
    # Default to Rameswaram port coords if missing
    return (9.288, 79.313)

# --- 3. LangGraph Agent Nodes ---
def marine_and_risk_agent(state: ORCAState) -> ORCAState:
    """
    Agent 1: Marine & Spatial Risk Agent
    Simulates querying PostGIS/INCOIS by filtering the local GeoJSON slice using spatial filters.
    Detects user intent (fishing, weather/hazard, border/imbl) and selects the relevant spatial feature.
    """
    data = load_prototype_data()
    state["local_data_slice"] = data
    user_lat, user_lon = state["lat"], state["lon"]
    query = state.get("query", "").lower()

    features = data.get("features", [])
    if not features:
        state["nearest_pfz"] = {}
        state["distance_km"] = 0.0
        return state

    # Intent classification
    is_hazard_query = any(k in query for k in ["weather", "wave", "hazard", "danger", "storm", "wind", "ஆபத்து"])
    is_imbl_query = any(k in query for k in ["border", "imbl", "sri lanka", "boundary", "restricted", "எல்லை"])
    
    if is_hazard_query:
        state["intent"] = "hazard"
        # Prioritize hazard features
        candidate_features = [f for f in features if f.get("properties", {}).get("wave_height_m", 0) > 2.0 or "HAZARD" in f.get("properties", {}).get("zone_id", "")]
        if not candidate_features:
            candidate_features = features
    elif is_imbl_query:
        state["intent"] = "imbl"
        # Prioritize IMBL features
        candidate_features = [f for f in features if f.get("properties", {}).get("is_restricted_imbl", False)]
        if not candidate_features:
            candidate_features = features
    else:
        state["intent"] = "pfz"
        # Prioritize fishing zones (safe zones first)
        candidate_features = [f for f in features if not f.get("properties", {}).get("is_restricted", False)]
        if not candidate_features:
            candidate_features = features

    # Find closest feature to user coordinates
    closest_zone = None
    min_dist = float("inf")

    for feature in candidate_features:
        zone_lat, zone_lon = get_centroid(feature)
        dist = haversine_km(user_lat, user_lon, zone_lat, zone_lon)
        if dist < min_dist:
            min_dist = dist
            closest_zone = feature

    # Fallback to absolute closest if nothing matched
    if not closest_zone:
        for feature in features:
            zone_lat, zone_lon = get_centroid(feature)
            dist = haversine_km(user_lat, user_lon, zone_lat, zone_lon)
            if dist < min_dist:
                min_dist = dist
                closest_zone = feature

    state["nearest_pfz"] = closest_zone or {}
    state["distance_km"] = round(min_dist, 2)
    return state


def recommendation_agent(state: ORCAState) -> ORCAState:
    """
    Agent 2: Recommendation & Advisory Synthesis Agent
    Evaluates retrieved data slice against marine safety thresholds (wave height > 2.5m, IMBL limits, chlorophyll)
    and returns a synthesized text advisory.
    """
    pfz = state.get("nearest_pfz", {})
    if not pfz or "properties" not in pfz:
        state["advisory_text"] = "No active marine advisory zone detected in this area. Sea conditions are normal."
        return state

    props = pfz["properties"]
    zone_id = props.get("zone_id", "Unknown Zone")
    zone_name = props.get("name", zone_id)
    wave_height = props.get("wave_height_m", 1.0)
    wind_speed = props.get("wind_speed_kmh", 15.0)
    chlorophyll = props.get("chlorophyll_mg_m3", 2.0)
    sst = props.get("sst_c", 28.0)
    is_imbl = props.get("is_restricted_imbl", False)
    is_restricted = props.get("is_restricted", False)
    dist_km = state.get("distance_km", 0.0)

    # Multi-Agent evaluation logic
    if is_imbl:
        state["advisory_text"] = (
            f"CRITICAL BORDER WARNING: {zone_name} ({zone_id}) is situated {dist_km:.1f} km away along the "
            f"International Maritime Boundary Line (IMBL). Entering Sri Lankan waters is strictly prohibited. "
            f"Steer southwest immediately."
        )
    elif is_restricted or wave_height > 2.5:
        state["advisory_text"] = (
            f"DANGER: Do not proceed towards {zone_name} ({zone_id}), located {dist_km:.1f} km away. "
            f"Hazardous wave heights are at {wave_height}m with wind speeds up to {wind_speed} km/h. "
            f"High sea surge alert active."
        )
    else:
        state["advisory_text"] = (
            f"SAFE: Recommended fishing catch is {zone_name} ({zone_id}), situated {dist_km:.1f} km from your position. "
            f"Optimal conditions detected: Chlorophyll {chlorophyll} mg/m³, Sea Surface Temperature {sst}°C, "
            f"and calm wave conditions at {wave_height}m."
        )

    return state


# --- 4. Build and Compile LangGraph Workflow ---
workflow = StateGraph(ORCAState)
workflow.add_node("data_agent", marine_and_risk_agent)
workflow.add_node("advisory_agent", recommendation_agent)

workflow.set_entry_point("data_agent")
workflow.add_edge("data_agent", "advisory_agent")
workflow.add_edge("advisory_agent", END)

orca_graph = workflow.compile()


# --- 5. API Endpoints ---
@app.get("/")
def root():
    return {
        "service": "ORCA Marine Advisory Multi-Agent Backend",
        "region": "Gulf of Mannar & Rameswaram Coast",
        "status": "ready"
    }

@app.get("/health")
def health_check():
    data = load_prototype_data()
    return {
        "status": "healthy",
        "agent_system": "LangGraph StateGraph",
        "active_nodes": ["marine_and_risk_agent", "recommendation_agent"],
        "geojson_features_loaded": len(data.get("features", []))
    }

@app.get("/data/slice")
def get_data_slice():
    """Provides frontend access to the full raw GeoJSON slice for inspection/rendering."""
    return load_prototype_data()

@app.post("/chat")
async def chat_endpoint(request: QueryRequest):
    """
    Processes translated user query and vessel coordinates through the LangGraph multi-agent flow.
    Returns the voice-synthesizable text advisory and dynamic GeoJSON map_data for React-Leaflet.
    """
    try:
        initial_state: ORCAState = {
            "query": request.query,
            "lat": request.lat,
            "lon": request.lon,
            "intent": "pfz",
            "local_data_slice": {},
            "nearest_pfz": {},
            "distance_km": 0.0,
            "advisory_text": ""
        }

        # Execute LangGraph Multi-Agent Flow
        result = orca_graph.invoke(initial_state)

        return {
            "advisory": result["advisory_text"],
            "map_data": result["nearest_pfz"],
            "distance_km": result.get("distance_km", 0.0),
            "intent": result.get("intent", "pfz"),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
