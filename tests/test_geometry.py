import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath("backend"))

from app.services.geometry import (
    validate_polygon_coordinates,
    compute_polygon_centroid,
    compute_geodesic_area_hectares,
    point_in_polygon
)

def test_polygon_validation_valid():
    coords = [
        [77.585, 12.971],
        [77.590, 12.971],
        [77.590, 12.976],
        [77.585, 12.976],
        [77.585, 12.971]
    ]
    # Should not raise
    validate_polygon_coordinates(coords)

def test_polygon_validation_invalid_bounds():
    with pytest.raises(ValueError, match="out of bounds"):
        validate_polygon_coordinates([[195.0, 12.0], [77.0, 12.0], [77.0, 13.0], [195.0, 12.0]])

def test_polygon_centroid():
    coords = [
        [0.0, 0.0],
        [2.0, 0.0],
        [2.0, 2.0],
        [0.0, 2.0],
        [0.0, 0.0]
    ]
    lat, lon = compute_polygon_centroid(coords)
    assert lat == 1.0
    assert lon == 1.0

def test_geodesic_area_calculation():
    # ~500m x ~500m box is approx 25-30 hectares
    coords = [
        [77.585, 12.971],
        [77.590, 12.971],
        [77.590, 12.976],
        [77.585, 12.976],
        [77.585, 12.971]
    ]
    area_ha = compute_geodesic_area_hectares(coords)
    assert 20.0 < area_ha < 35.0

def test_point_in_polygon():
    coords = [
        [10.0, 10.0],
        [20.0, 10.0],
        [20.0, 20.0],
        [10.0, 20.0],
        [10.0, 10.0]
    ]
    assert point_in_polygon(15.0, 15.0, coords) is True
    assert point_in_polygon(5.0, 5.0, coords) is False
