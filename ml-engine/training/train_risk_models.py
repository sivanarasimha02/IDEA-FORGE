import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, brier_score_loss, f1_score

# Ensure directories exist
os.makedirs("ml-engine/saved_models", exist_ok=True)
os.makedirs("ml-engine/evaluation", exist_ok=True)

def generate_synthetic_agri_climate_dataset(n_samples=3000, random_state=42):
    """
    Generates an agrometeorological dataset simulating diverse agricultural micro-locations,
    soil types, and weather anomalies across multiple growing seasons.
    """
    np.random.seed(random_state)

    # Features:
    # 1. rain_30d_anomaly_pct: -100% to +200%
    # 2. forecast_7d_precip_mm: 0 to 250 mm
    # 3. max_temp_consecutive_35c_days: 0 to 12 days
    # 4. soil_moisture_pct: 5% to 55%
    # 5. et0_mean_mm: 1.5 to 8.0 mm/day
    # 6. ndvi_mean: 0.10 to 0.88
    # 7. irrigation_factor: 0 (rainfed), 0.5 (canal), 1.0 (drip)
    # 8. clay_content_pct: 10% to 70%

    rain_anomaly = np.random.uniform(-90.0, 150.0, n_samples)
    forecast_precip = np.random.exponential(scale=25.0, size=n_samples)
    heat_days = np.random.poisson(lam=2.5, size=n_samples)
    soil_moisture = np.random.uniform(8.0, 48.0, n_samples)
    et0 = np.random.uniform(2.0, 7.5, n_samples)
    ndvi = np.random.uniform(0.18, 0.85, n_samples)
    irrigation = np.random.choice([0.0, 0.5, 1.0], size=n_samples, p=[0.4, 0.3, 0.3])
    clay_content = np.random.uniform(10.0, 65.0, n_samples)

    # Label 1: Drought Risk (1 = High/Critical, 0 = Low/Moderate)
    # Drought happens when rain anomaly is very negative, soil moisture is low, ET0 is high, and no irrigation
    drought_score = (
        -0.03 * rain_anomaly
        - 0.05 * (soil_moisture - 20.0)
        + 0.15 * (et0 - 4.0)
        - 0.80 * irrigation
        - 0.50 * (ndvi - 0.4)
    )
    drought_prob = 1.0 / (1.0 + np.exp(-drought_score))
    y_drought = (drought_prob > 0.55).astype(int)

    # Label 2: Excess Rain Risk (1 = High/Critical, 0 = Low/Moderate)
    # Excess rain occurs when forecast precip is high, soil moisture already high, and high clay content (poor drainage)
    excess_score = (
        0.04 * (forecast_precip - 50.0)
        + 0.06 * (soil_moisture - 32.0)
        + 0.03 * (clay_content - 35.0)
    )
    excess_prob = 1.0 / (1.0 + np.exp(-excess_score))
    y_excess = (excess_prob > 0.55).astype(int)

    # Label 3: Heat Stress Risk
    heat_score = (
        0.45 * (heat_days - 3)
        + 0.15 * (et0 - 5.0)
        - 0.04 * (soil_moisture - 25.0)
    )
    heat_prob = 1.0 / (1.0 + np.exp(-heat_score))
    y_heat = (heat_prob > 0.50).astype(int)

    df = pd.DataFrame({
        "rain_anomaly": rain_anomaly,
        "forecast_precip": forecast_precip,
        "heat_days": heat_days,
        "soil_moisture": soil_moisture,
        "et0": et0,
        "ndvi": ndvi,
        "irrigation": irrigation,
        "clay_content": clay_content
    })

    return df, y_drought, y_excess, y_heat

def train_and_evaluate_models():
    print("Generating training dataset...")
    X, y_drought, y_excess, y_heat = generate_synthetic_agri_climate_dataset()

    feature_names = list(X.columns)
    metrics_report = {}

    # 1. Drought Model
    print("Training Drought Risk Classifier...")
    X_train, X_test, yd_train, yd_test = train_test_split(X, y_drought, test_size=0.25, random_state=42)
    drought_model = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
    drought_model.fit(X_train, yd_train)
    yd_pred = drought_model.predict(X_test)
    yd_prob = drought_model.predict_proba(X_test)[:, 1]
    
    metrics_report["drought_model"] = {
        "model_type": "GradientBoostingClassifier",
        "f1_score": round(float(f1_score(yd_test, yd_pred)), 4),
        "roc_auc": round(float(roc_auc_score(yd_test, yd_prob)), 4),
        "brier_score": round(float(brier_score_loss(yd_test, yd_prob)), 4),
        "feature_importances": {f: round(float(imp), 4) for f, imp in zip(feature_names, drought_model.feature_importances_)}
    }
    joblib.dump(drought_model, "ml-engine/saved_models/drought_risk_model.joblib")

    # 2. Excess Rain Model
    print("Training Excess Rain Risk Classifier...")
    X_train, X_test, ye_train, ye_test = train_test_split(X, y_excess, test_size=0.25, random_state=42)
    excess_model = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
    excess_model.fit(X_train, ye_train)
    ye_pred = excess_model.predict(X_test)
    ye_prob = excess_model.predict_proba(X_test)[:, 1]

    metrics_report["excess_rain_model"] = {
        "model_type": "GradientBoostingClassifier",
        "f1_score": round(float(f1_score(ye_test, ye_pred)), 4),
        "roc_auc": round(float(roc_auc_score(ye_test, ye_prob)), 4),
        "brier_score": round(float(brier_score_loss(ye_test, ye_prob)), 4),
        "feature_importances": {f: round(float(imp), 4) for f, imp in zip(feature_names, excess_model.feature_importances_)}
    }
    joblib.dump(excess_model, "ml-engine/saved_models/excess_rain_model.joblib")

    # 3. Heat Stress Model
    print("Training Heat Stress Risk Classifier...")
    X_train, X_test, yh_train, yh_test = train_test_split(X, y_heat, test_size=0.25, random_state=42)
    heat_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    heat_model.fit(X_train, yh_train)
    yh_pred = heat_model.predict(X_test)
    yh_prob = heat_model.predict_proba(X_test)[:, 1]

    metrics_report["heat_stress_model"] = {
        "model_type": "RandomForestClassifier",
        "f1_score": round(float(f1_score(yh_test, yh_pred)), 4),
        "roc_auc": round(float(roc_auc_score(yh_test, yh_prob)), 4),
        "brier_score": round(float(brier_score_loss(yh_test, yh_prob)), 4),
        "feature_importances": {f: round(float(imp), 4) for f, imp in zip(feature_names, heat_model.feature_importances_)}
    }
    joblib.dump(heat_model, "ml-engine/saved_models/heat_stress_model.joblib")

    # Save evaluation summary
    with open("ml-engine/evaluation/climate_risks_evaluation.json", "w") as f:
        json.dump(metrics_report, f, indent=2)
    print("Climate risk models trained and saved to ml-engine/saved_models/")
    print(f"Metrics: {json.dumps(metrics_report, indent=2)}")

if __name__ == "__main__":
    train_and_evaluate_models()
