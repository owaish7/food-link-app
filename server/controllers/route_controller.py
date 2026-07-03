# server/controllers/route_controller.py
#
# Road routing via the public OSRM API — a single fast HTTP call that returns
# the driving route geometry, distance and duration. Replaces the previous
# osmnx approach, which downloaded ~50 MB of OpenStreetMap data and built a
# NetworkX graph in memory on every cold call (~50s, memory-heavy).
import requests
from flask import jsonify, request
from geopy.distance import geodesic

OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"


def _find_optimal_meeting_point(route_coords):
    """Return the waypoint closest to the halfway distance along the route."""
    if not route_coords:
        return None
    cumulative = [0]
    for i in range(1, len(route_coords)):
        cumulative.append(cumulative[-1] + geodesic(route_coords[i - 1], route_coords[i]).meters)
    half = cumulative[-1] / 2
    for i, dist in enumerate(cumulative):
        if dist >= half:
            return route_coords[i]
    return route_coords[-1]


def calculate_route():
    data = request.get_json() or {}
    o_lat, o_lng = data.get('origin_latitude'), data.get('origin_longitude')
    d_lat, d_lng = data.get('destination_latitude'), data.get('destination_longitude')

    if None in (o_lat, o_lng, d_lat, d_lng):
        return jsonify({"error": "Invalid coordinates provided"}), 400

    # OSRM expects lon,lat order in the path.
    url = f"{OSRM_BASE}/{o_lng},{o_lat};{d_lng},{d_lat}"
    try:
        resp = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            timeout=15,
        )
        resp.raise_for_status()
        payload = resp.json()
    except Exception as e:
        return jsonify({"error": f"Routing service error: {e}"}), 502

    routes = payload.get("routes") or []
    if not routes:
        return jsonify({"error": "No path found between the locations"}), 404

    best = routes[0]
    # GeoJSON coordinates are [lon, lat]; Leaflet wants [lat, lon].
    route_coords = [[lat, lon] for lon, lat in best["geometry"]["coordinates"]]

    return jsonify({
        "route": route_coords,
        "optimal_meeting_point": _find_optimal_meeting_point(route_coords),
        "distance": best.get("distance"),   # metres
        "duration": best.get("duration"),   # seconds
    })
