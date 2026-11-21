#!/usr/bin/env python3
"""
IoT Gateway & Field Sensor Simulator
Simulates periodic telemetry pulses from in-situ soil nodes to the backend API.
"""
import time
import random
import requests
import argparse
from datetime import datetime

DEFAULT_SERVER_URL = "http://localhost:8000/api/sensors/data"
DEFAULT_TOKEN = "iot-gateway-dev-token-9988"

def send_telemetry_reading(server_url: str, device_id: str, token: str, soil_type: str = "clay"):
    # Base moisture depending on soil type
    base_moisture = 32.0 if soil_type == "clay" else (19.0 if soil_type == "sandy" else 26.0)
    moisture = round(base_moisture + random.uniform(-4.0, 4.0), 1)
    temp = round(25.0 + random.uniform(-3.0, 5.0), 1)
    ph = round(6.7 + random.uniform(-0.4, 0.4), 2)
    ec = round(1.2 + random.uniform(-0.2, 0.3), 2)

    payload = {
        "device_id": device_id,
        "moisture_pct": max(5.0, min(95.0, moisture)),
        "temperature_c": max(0.0, min(50.0, temp)),
        "ph": ph,
        "ec_ds_m": ec,
        "is_simulated": True,
        "data_source": "IoT Gateway Gateway-Daemon (Lab Simulation)"
    }

    headers = {
        "Content-Type": "application/json",
        "X-Device-Token": token
    }

    try:
        resp = requests.post(server_url, json=payload, headers=headers, timeout=5.0)
        if resp.status_code in [200, 201]:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Telemetry Dispatched -> Moisture: {moisture}% | Temp: {temp}°C | Status: {resp.status_code}")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Delivery rejected: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Network error connecting to {server_url}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Agricultural IoT Soil Node Telemetry Simulator")
    parser.add_argument("--url", default=DEFAULT_SERVER_URL, help="Target ingestion endpoint")
    parser.add_argument("--device", default="FIELD-NODE-A1", help="Device identifier")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="Gateway auth token")
    parser.add_argument("--interval", type=int, default=5, help="Seconds between readings (0 for single pulse)")
    parser.add_argument("--soil", default="clay", choices=["clay", "loam", "sandy"], help="Soil classification")

    args = parser.parse_args()
    print(f"Starting IoT Field Node Simulator for Device '{args.device}' -> Endpoint: {args.url}")

    if args.interval == 0:
        send_telemetry_reading(args.url, args.device, args.token, args.soil)
    else:
        while True:
            send_telemetry_reading(args.url, args.device, args.token, args.soil)
            time.sleep(args.interval)

if __name__ == "__main__":
    main()
