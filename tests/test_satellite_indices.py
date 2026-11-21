import pytest
import sys
import os

sys.path.insert(0, os.path.abspath("backend"))

from app.integrations.copernicus import CopernicusSentinelClient

def test_ndvi_calculation():
    # Dense healthy green vegetation: High NIR, Low Red
    indices = CopernicusSentinelClient.calculate_indices(
        nir=0.70, red=0.10, green=0.12, blue=0.04, swir=0.15
    )
    # NDVI = (0.7 - 0.1) / (0.7 + 0.1) = 0.6 / 0.8 = 0.75
    assert indices["ndvi"] == 0.75
    assert "Dense Canopy" in indices["vigor_category"] or "Excellent" in indices["vigor_category"]

def test_evi_and_savi_calculation():
    indices = CopernicusSentinelClient.calculate_indices(
        nir=0.60, red=0.12, green=0.10, blue=0.05, swir=0.18
    )
    assert indices["evi"] > 0.0
    assert indices["savi"] > 0.0
    assert -1.0 <= indices["ndwi"] <= 1.0

def test_water_ndwi_negative_for_vegetation():
    # Healthy terrestrial vegetation typically has negative NDWI (Green - NIR)/(Green + NIR)
    indices = CopernicusSentinelClient.calculate_indices(
        nir=0.65, red=0.10, green=0.12, blue=0.04, swir=0.15
    )
    assert indices["ndwi"] < 0.0
