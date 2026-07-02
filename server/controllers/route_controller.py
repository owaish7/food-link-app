import osmnx as ox
import networkx as nx
from flask import jsonify, request
from geopy.distance import geodesic

# In-process cache of downloaded road networks. Coordinates are rounded to a
# ~1 km grid so nearby origins reuse the same graph instead of re-downloading
# ~50 MB of OSM data on every request (30-60s). Capped to bound memory usage.
_GRAPH_CACHE = {}
_GRAPH_CACHE_MAX = 4


def _find_optimal_meeting_point(route_coords):
    """Return the waypoint closest to the halfway distance along the route."""
    cumulative = [0]
    for i in range(1, len(route_coords)):
        cumulative.append(cumulative[-1] + geodesic(route_coords[i - 1], route_coords[i]).meters)
    half = cumulative[-1] / 2
    for i, dist in enumerate(cumulative):
        if dist >= half:
            return route_coords[i]
    return route_coords[-1] if route_coords else None


def calculate_route():
    data = request.get_json()
    origin = (data.get('origin_latitude'), data.get('origin_longitude'))
    destination = (data.get('destination_latitude'), data.get('destination_longitude'))

    if None in origin or None in destination:
        return jsonify({"error": "Invalid coordinates provided"}), 400

    # Load the road network around the origin, cached per ~1 km grid cell.
    cache_key = (round(origin[0], 2), round(origin[1], 2))
    G = _GRAPH_CACHE.get(cache_key)
    if G is None:
        try:
            G = ox.graph_from_point(origin, dist=5000, network_type='drive')
        except Exception as e:
            return jsonify({"error": f"Could not load road network: {e}"}), 502
        if len(_GRAPH_CACHE) >= _GRAPH_CACHE_MAX:
            _GRAPH_CACHE.pop(next(iter(_GRAPH_CACHE)))  # evict oldest entry
        _GRAPH_CACHE[cache_key] = G

    # Snap user coordinates to the nearest network nodes.
    origin_node = ox.distance.nearest_nodes(G, origin[1], origin[0])
    destination_node = ox.distance.nearest_nodes(G, destination[1], destination[0])

    try:
        route = nx.shortest_path(G, origin_node, destination_node, weight='length')
        route_coords = [(G.nodes[node]['y'], G.nodes[node]['x']) for node in route]
        return jsonify({
            'route': route_coords,
            'optimal_meeting_point': _find_optimal_meeting_point(route_coords)
        })
    except nx.NetworkXNoPath:
        return jsonify({"error": "No path found between the locations"}), 404
