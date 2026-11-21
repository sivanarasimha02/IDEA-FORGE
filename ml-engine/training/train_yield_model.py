import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

os.makedirs("ml-engine/saved_models", exist_ok=True)
os.makedirs("ml-engine/evaluation", exist_ok=True)

CROP_BASE_YIELDS = {
    0: 4.2,  # Wheat (t/ha)
    1: 4.8,  # Rice (t/ha)
    2: 6.5,  # Maize (t/ha)
    3: 2.2,  # Cotton (t/ha)
    4: 2.8,  # Soybean (t/ha)
    5: 1.6   # Pulses (t/ha)
}

def generate_crop_yield_dataset(n_samples=4000, random_state=42):
    np.random.seed(random_state)

    crop_types = np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples)
    area = np.random.uniform(0.5, 25.0, n_samples)
    growing_days = np.random.uniform(60, 140, n_samples)
    gdd = np.random.uniform(900, 2200, n_samples)
    cumulative_rain = np.random.uniform(150, 950, n_samples)
    rain_anomaly = np.random.uniform(-50.0, 60.0, n_samples)
    heat_stress_days = np.random.poisson(lam=3.0, size=n_samples)
    mean_soil_moisture = np.random.uniform(14.0, 42.0, n_samples)
    peak_ndvi = np.random.uniform(0.38, 0.88, n_samples)
    irrigation_factor = np.random.choice([0.2, 0.6, 1.0], size=n_samples) # rainfed, canal, drip

    yields = []
    for i in range(n_samples):
        c = crop_types[i]
        base = CROP_BASE_YIELDS[c]
        
        # Agronomic multipliers:
        # 1. Biomass / NDVI effect: peak_ndvi strongly correlates with yield
        ndvi_mult = 0.6 + (peak_ndvi[i] * 0.7)
        
        # 2. Water availability: moisture & rain
        water_mult = 0.85 + (irrigation_factor[i] * 0.20) + (min(20.0, max(-20.0, rain_anomaly[i])) * 0.003)
        
        # 3. Heat penalty: -2.5% per severe heat day during reproduction
        heat_mult = max(0.65, 1.0 - (heat_stress_days[i] * 0.025))
        
        # 4. GDD optimality (penalize extreme cold or scorching thermal sums)
        gdd_mult = 1.0 - abs(gdd[i] - 1500) * 0.00015
        
        y_val = base * ndvi_mult * water_mult * heat_mult * gdd_mult
        # Add realistic agro-climatic stochastic variance (+/- 7%)
        y_val += np.random.normal(0, base * 0.07)
        yields.append(max(0.4, round(y_val, 2)))

    df = pd.DataFrame({
        "crop_type": crop_types,
        "area_ha": area,
        "growing_days": growing_days,
        "gdd": gdd,
        "cumulative_rain": cumulative_rain,
        "rain_anomaly": rain_anomaly,
        "heat_stress_days": heat_stress_days,
        "mean_soil_moisture": mean_soil_moisture,
        "peak_ndvi": peak_ndvi,
        "irrigation_factor": irrigation_factor
    })

    return df, np.array(yields)

def train_and_evaluate_yield():
    print("Generating Crop Yield Dataset...")
    X, y = generate_crop_yield_dataset()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    print("Training Random Forest Yield Regressor...")
    model = RandomForestRegressor(n_estimators=150, max_depth=8, min_samples_split=4, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    feature_names = list(X.columns)
    importances = {f: round(float(imp), 4) for f, imp in zip(feature_names, model.feature_importances_)}

    report = {
        "model_type": "RandomForestRegressorEnsemble",
        "r2_score": round(float(r2), 4),
        "rmse_tonnes_per_ha": round(float(rmse), 4),
        "mae_tonnes_per_ha": round(float(mae), 4),
        "feature_importances": importances,
        "n_samples": len(X),
        "test_size": len(X_test)
    }

    joblib.dump(model, "ml-engine/saved_models/crop_yield_model.joblib")
    with open("ml-engine/evaluation/yield_model_evaluation.json", "w") as f:
        json.dump(report, f, indent=2)

    print("Yield Model trained successfully!")
    print(f"Metrics: {json.dumps(report, indent=2)}")

if __name__ == "__main__":
    train_and_evaluate_yield()
