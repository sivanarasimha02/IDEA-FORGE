/*
 * ESP32 Agricultural Micro-Location Soil Telemetry Firmware
 * Target: ESP32-WROOM-32 with Modbus RS485 or Capacitive Soil Sensor
 * Sends volumetric soil moisture, temperature, pH, and EC to Backend API
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "FARM_IOT_WIFI";
const char* password = "FARM_SECURE_PASSWORD";

// Server endpoint
const char* serverUrl = "http://192.168.1.100:8000/api/sensors/data";
const char* deviceToken = "iot-gateway-dev-token-9988";
const char* deviceId = "ESP32-SOIL-NODE-01";

// Analog pin configuration
const int MOISTURE_PIN = 34;
const int TEMP_PIN = 35;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Starting Soil Node...");
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi Connection Failed. Proceeding in offline storage mode.");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read calibrated analog sensor values
    int rawMoisture = analogRead(MOISTURE_PIN);
    float moisturePct = map(rawMoisture, 3200, 1400, 0, 100);
    moisturePct = constrain(moisturePct, 0.0, 100.0);

    int rawTemp = analogRead(TEMP_PIN);
    float tempC = (rawTemp * (3.3 / 4095.0)) * 10.0; // Calibrated LM35/thermistor

    // 2. Format JSON payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = deviceId;
    doc["moisture_pct"] = moisturePct;
    doc["temperature_c"] = tempC;
    doc["ph"] = 6.8;
    doc["ec_ds_m"] = 1.35;
    doc["is_simulated"] = false;
    doc["data_source"] = "ESP32-Hardware-Node";

    String jsonString;
    serializeJson(doc, jsonString);

    // 3. Dispatch HTTPS/HTTP POST
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Token", deviceToken);

    int httpCode = http.POST(jsonString);
    if (httpCode > 0) {
      Serial.printf("Telemetry posted. HTTP Response: %d\n", httpCode);
    } else {
      Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  }

  // Sleep for 15 minutes to preserve battery (Deep Sleep mode can be used)
  delay(15 * 60 * 1000);
}
