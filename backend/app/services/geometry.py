import math
import json
from typing import List, Tuple, Dict, Any

EARTH_RADIUS_METERS = 6378137.0  # WGS-84 equatorial radius

def validate_polygon_coordinates(coords: List[List[float]]) -> None:
    """Validate a ring of [longitude, latitude] coordinates."""
    if len(coords) < 4:
        raise ValueError("A polygon must have at least 4 coordinates (including closed point)")
    
    # Check closure
    first = coords[0]
    last = coords[-1]
    if abs(first[0] - last[0]) > 1e-7 or abs(first[1] - last[1]) > 1e-7:
        coords.append(first)  # Auto-close if not closed

    for pt in coords:
        if len(pt) < 2:
            raise ValueError(f"Invalid coordinate point: {pt}")
        lon, lat = pt[0], pt[1]
        if not (-180.0 <= lon <= 180.0):
            raise ValueError(f"Longitude {lon} out of bounds [-180, 180]")
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Latitude {lat} out of bounds [-90, 90]")

def compute_polygon_centroid(coords: List[List[float]]) -> Tuple[float, float]:
    """Calculate the geographic centroid (latitude, longitude) of a polygon ring."""
    # Discard closing duplicate point if present for centroid
    pts = coords[:-1] if (len(coords) > 1 and coords[0] == coords[-1]) else coords
    if not pts:
        return 0.0, 0.0
    
    mean_lon = sum(p[0] for p in pts) / len(pts)
    mean_lat = sum(p[1] for p in pts) / len(pts)
    return round(mean_lat, 6), round(mean_lon, 6)

def compute_geodesic_area_hectares(coords: List[List[float]]) -> float:
    """
    Compute geodesic area of a polygon ring in hectares using the spherical excess formula.
    Points are [lon, lat] in degrees.
    """
    if len(coords) < 3:
        return 0.0
    
    # Ensure closing point
    pts = list(coords)
    if pts[0] != pts[-1]:
        pts.append(pts[0])

    area_steradians = 0.0
    n = len(pts) - 1

    for i in range(n):
        lon1, lat1 = math.radians(pts[i][0]), math.radians(pts[i][1])
        lon2, lat2 = math.radians(pts[i+1][0]), math.radians(pts[i+1][1])
        area_steradians += (lon2 - lon1) * (2.0 + math.sin(lat1) + math.sin(lat2))

    area_sq_meters = abs(area_steradians * (EARTH_RADIUS_METERS ** 2) / 2.0)
    area_hectares = area_sq_meters / 10000.0
    return round(area_hectares, 3)

def point_in_polygon(lon: float, lat: float, coords: List[List[float]]) -> bool:
    """Ray-casting algorithm to verify if point (lon, lat) is within polygon coordinates."""
    inside = False
    n = len(coords)
    p1x, p1y = coords[0][0], coords[0][1]
    for i in range(n + 1):
        p2x, p2y = coords[i % n][0], coords[i % n][1]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lon <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lon <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside
